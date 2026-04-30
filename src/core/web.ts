import { randomBytes } from "node:crypto";
import { join } from "node:path";
import type { Bot } from "@core/bot";
import { config } from "@core/config";
import {
	inMemoryTransport,
	logger,
	type LogEntry,
} from "@core/logger";
import { ScriptRunner } from "@core/run";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { swagger } from "@elysiajs/swagger";
import { createId } from "@paralleldrive/cuid2";
import { $ } from "bun";
import { Elysia, sse, status as httpStatus, t } from "elysia";
import { version } from "../../package.json";

type AuthRole = "admin" | "viewer";
type AuthUser = {
	sub: string;
	role: AuthRole;
};
type LogFilter = {
	scripts?: string[];
	rid?: string;
	level?: string;
};
type JwtVerifier = {
	verify: (token?: string) => Promise<AuthUser | false>;
};

const configuredJwtSecret = config.web?.jwtSecret?.trim();
const jwtSecret =
	configuredJwtSecret && configuredJwtSecret.length > 0
		? configuredJwtSecret
		: (() => {
				const secret = randomBytes(32).toString("hex");
				logger.warn(
					"[web] No jwtSecret in config - tokens invalidate on restart. Set [web].jwtSecret.",
				);
				return secret;
			})();

const jwtPlugin = jwt({
	name: "jwt",
	secret: jwtSecret,
	schema: t.Object({
		sub: t.String(),
		role: t.Union([t.Literal("admin"), t.Literal("viewer")]),
	}),
	exp: "7d",
});

const tokenFromRequest = (request: Request, bearerToken?: string) => {
	if (bearerToken) return bearerToken;
	const auth = request.headers.get("authorization");
	if (auth?.startsWith("Bearer ")) return auth.slice("Bearer ".length);
	return new URL(request.url).searchParams.get("token") ?? "";
};

const authenticatedUser = async (
	jwt: JwtVerifier,
	request: Request,
	bearerToken?: string,
) => {
	const payload = await jwt.verify(tokenFromRequest(request, bearerToken));
	return payload || null;
};

const requireAuth = new Elysia({ name: "requireAuth" })
	.use(jwtPlugin)
	.use(bearer())
	.onBeforeHandle(async ({ jwt, bearer, request }) => {
		const user = await authenticatedUser(jwt, request, bearer);
		if (!user) return httpStatus(401, "Unauthorized");
	});

const requireAuthIfPrivate = new Elysia({ name: "requireAuthIfPrivate" })
	.use(jwtPlugin)
	.use(bearer())
	.onBeforeHandle(async ({ jwt, bearer, request }) => {
		if (config.web?.publicViewable !== false) return;
		const user = await authenticatedUser(jwt, request, bearer);
		if (!user) return httpStatus(401, "Unauthorized");
	});

function assertAdmin(user: AuthUser | null) {
	if (!user) return httpStatus(401, "Unauthorized");
	if (user.role !== "admin") {
		return httpStatus(403, "Forbidden: admin role required");
	}
}

async function assertReadable(
	jwt: JwtVerifier,
	request: Request,
	bearerToken?: string,
) {
	if (config.web?.publicViewable !== false) return;
	const user = await authenticatedUser(jwt, request, bearerToken);
	if (!user) return httpStatus(401, "Unauthorized");
}

const now = () => new Date().toISOString();
const getTask = ([id, script]: [string, Bot]) => ({
	id,
	info: script.info,
	job: {
		next: script.job?.nextRun(),
		previous: script.job?.previousRun(),
		left: script.job?.runsLeft(),
		pattern: script.job?.getPattern(),
		status: script.job?.isBusy()
			? "busy"
			: script.job?.isRunning()
				? "running"
				: script.job?.isStopped()
					? "stopped"
					: ("idle" as "busy" | "running" | "stopped" | "idle"),
		options: script.job?.options,
	},
});
const runner = new ScriptRunner();
const activeRuns = new Set<string>();

runner.log.info("Starting scheduled tasks");
runner.startScheduled();

function taskIsActive(taskId: string, script: Bot) {
	return activeRuns.has(taskId) || script.job?.isBusy() === true;
}

function resolveScriptFilter(scriptSearch?: string) {
	const rawSearch = scriptSearch?.trim();
	if (!rawSearch) return undefined;
	const search = rawSearch.toLocaleLowerCase();
	const matches = Object.entries(runner.scheduled)
		.filter(([id, script]) => {
			const source = script.info.scriptSource ?? "";
			const name = script.info.name ?? "";
			return [id, source, name].some((value) =>
				value.toLocaleLowerCase().includes(search),
			);
		})
		.map(([, script]) => script.info.scriptSource)
		.filter((source): source is string => Boolean(source));

	return matches.length > 0 ? [...new Set(matches)] : [rawSearch];
}

const logLevelPriority: Record<string, number> = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	verbose: 4,
	debug: 5,
	silly: 6,
};

function normalizeLogLevel(level?: string) {
	const normalized = level?.trim().toLocaleLowerCase();
	return normalized && normalized in logLevelPriority ? normalized : undefined;
}

function streamFilter(query: {
	script?: string;
	rid?: string;
	level?: string;
}): LogFilter | undefined {
	const scripts = resolveScriptFilter(query.script);
	const level = normalizeLogLevel(query.level);
	return scripts || query.rid || level ? { scripts, rid: query.rid, level } : undefined;
}

function matchesFilter(entry: LogEntry, filter?: LogFilter) {
	const minimumLevel = filter?.level ? logLevelPriority[filter.level] : undefined;
	const entryLevel = logLevelPriority[entry.level];
	return (
		(!filter?.scripts || filter.scripts.includes(entry.script ?? "")) &&
		(!filter?.rid || entry.rid === filter.rid) &&
		(minimumLevel === undefined ||
			entryLevel === undefined ||
			entryLevel <= minimumLevel)
	);
}

async function* logStream(
	query: { script?: string; rid?: string; level?: string },
	request: Request,
) {
	const filter = streamFilter(query);

	for (const entry of inMemoryTransport
		.getBuffer()
		.filter((entry) => matchesFilter(entry, filter))) {
		yield entry;
	}

	const queue: LogEntry[] = [];
	let resolver: (() => void) | null = null;
	const wake = () => {
		resolver?.();
		resolver = null;
	};
	const listener = (entry: LogEntry) => {
		if (!matchesFilter(entry, filter)) return;
		queue.push(entry);
		wake();
	};
	const abort = () => wake();

	inMemoryTransport.emitter.on("entry", listener);
	request.signal.addEventListener("abort", abort);
	try {
		while (!request.signal.aborted) {
			if (queue.length === 0) {
				await new Promise<void>((resolve) => {
					resolver = resolve;
				});
			}
			const entry = queue.shift();
			if (entry) yield entry;
		}
	} finally {
		inMemoryTransport.emitter.off("entry", listener);
		request.signal.removeEventListener("abort", abort);
	}
}

const queryLogSchema = t.Object({
	script: t.Optional(t.String()),
	rid: t.Optional(t.String()),
	level: t.Optional(t.String()),
	page: t.Optional(t.String()),
	limit: t.Optional(t.String()),
});

const queryStreamSchema = t.Object({
	script: t.Optional(t.String()),
	rid: t.Optional(t.String()),
	level: t.Optional(t.String()),
	token: t.Optional(t.String()),
});
const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

export const app = new Elysia()
	.use(
		swagger({
			swaggerOptions: {
				persistAuthorization: true,
			},
			documentation: {
				info: {
					title: "PatsaBot API",
					version: version,
				},
				components: {
					securitySchemes: {
						bearerAuth: {
							type: "http",
							scheme: "bearer",
							bearerFormat: "JWT",
						},
					},
				},
			},
		}),
	)
	.use(jwtPlugin)
	.use(bearer())
	.post(
		"/auth/login",
		async ({ body, jwt }) => {
			const users = config.web?.users ?? [];
			const found = users.find(
				(user) =>
					user.username === body.username && user.password === body.password,
			);
			if (!found) return httpStatus(401, "Invalid credentials");
			const token = await jwt.sign({
				sub: found.username,
				role: found.role,
			});
			return {
				token,
				role: found.role,
				username: found.username,
			};
		},
		{
			body: t.Object({
				username: t.String(),
				password: t.String(),
			}),
		},
	)
	.get("/", () => {
		const file = Bun.file(join(import.meta.dir, "../../static/remote.html"));
		return new Response(file, {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	})
	.get("/deploy", async function* ({ headers }) {
		if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
			return httpStatus(401, "Unauthorized");
		}
		const commands = [
			{ command: $`git fetch`, rawCommand: "git fetch" },
			{
				command: $`git reset --hard origin/main`,
				rawCommand: "git reset --hard origin/main",
			},
			{ command: $`git pull`, rawCommand: "git pull" },
			{ command: $`bun i`, rawCommand: "bun i" },
		];

		yield `[${now()}] Starting deployment...\n`;
		const start = Date.now();
		for (const { command, rawCommand } of commands) {
			yield `[${now()}] Running: ${rawCommand}\n`;
			for await (const line of command.lines()) {
				console.log(`[${now()}]`, line.trim());
				yield `[${now()}] ${line.trim()}\n`;
			}
		}
		const end = Date.now();
		yield `[${now()}] Deployment completed in ${end - start}ms\n`;
	})
	.group("", (app) =>
		app
			.use(requireAuthIfPrivate)
			.get("/tasks", async ({ jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				return Object.entries(runner.scheduled).map(getTask);
			})
			.get("/task/:task", async ({ params, jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return getTask([params.task, script]);
			})
			.get(
				"/logs",
				async ({ query, jwt, bearer, request }) => {
					const authError = await assertReadable(jwt, request, bearer);
					if (authError) return authError;
					const { script, rid, level, page = "1", limit = "100" } = query;
					const filter = streamFilter({ script, rid, level });
					const entries = inMemoryTransport
						.getBuffer()
						.filter((entry) => matchesFilter(entry, filter));
					const p = Math.max(1, Number.parseInt(page, 10) || 1);
					const l = Math.min(
						500,
						Math.max(1, Number.parseInt(limit, 10) || 100),
					);
					return {
						total: entries.length,
						page: p,
						limit: l,
						entries: entries.slice((p - 1) * l, p * l),
					};
				},
				{ query: queryLogSchema },
			)
			.get(
				"/logs/stream",
				async ({ query, request, jwt, bearer }) => {
					const authError = await assertReadable(jwt, request, bearer);
					if (authError) return authError;
					return sse(logStream(query, request));
				},
				{ query: queryStreamSchema },
			)
			.get("/badge/:task/running", async ({ params, jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					schemaVersion: 1,
					label: script.info.id,
					message: script.job?.isRunning() ? "running" : "idle",
					color: script.job?.isRunning() ? "green" : "blue",
				};
			})
			.get("/badge/:task/next", async ({ params, jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					schemaVersion: 1,
					label: script.info.id,
					message: script.job?.nextRun()?.toISOString() || "idle",
					color: script.job?.isRunning() ? "blue" : "orange",
				};
			})
			.get("/badge/:task/previous", async ({ params, jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					schemaVersion: 1,
					label: script.info.id,
					message: script.job?.previousRun()?.toISOString() || "idle",
					color: script.job?.isRunning() ? "blue" : "orange",
				};
			})
			.get("/badge/:task/left", async ({ params, jwt, bearer, request }) => {
				const authError = await assertReadable(jwt, request, bearer);
				if (authError) return authError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					schemaVersion: 1,
					label: script.info.id,
					message: script.job?.runsLeft() || "idle",
					color: script.job?.isRunning() ? "blue" : "orange",
				};
			}),
	)
	.group("", (app) =>
		app
			.use(requireAuth)
			.post("/task/:task/pause", async ({ params, jwt, bearer, request }) => {
				const user = await authenticatedUser(jwt, request, bearer);
				const adminError = assertAdmin(user);
				if (adminError) return adminError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					message: script.job?.pause() ? "Task paused" : "Task already paused",
				};
			})
			.post("/task/:task/resume", async ({ params, jwt, bearer, request }) => {
				const user = await authenticatedUser(jwt, request, bearer);
				const adminError = assertAdmin(user);
				if (adminError) return adminError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				return {
					message: script.job?.resume() ? "Task resumed" : "Task already running",
				};
			})
			.post("/task/:task/stop", async ({ params, jwt, bearer, request }) => {
				const user = await authenticatedUser(jwt, request, bearer);
				const adminError = assertAdmin(user);
				if (adminError) return adminError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				script.job?.stop();
				delete runner.scheduled[params.task];
				return { message: "Task stopped and removed" };
			})
			.post("/task/:task/run", async ({ params, jwt, bearer, request }) => {
				const user = await authenticatedUser(jwt, request, bearer);
				const adminError = assertAdmin(user);
				if (adminError) return adminError;
				const script = runner.scheduled[params.task];
				if (!script) return httpStatus(404, "Task not found");
				if (!script.info.scriptSource) return httpStatus(500, "No script source");
				if (taskIsActive(params.task, script)) {
					return httpStatus(409, "Task is already running");
				}

				const rid = createId();
				script.info.rid = rid;
				activeRuns.add(params.task);
				void runner
					.runScript(script.info.scriptSource, rid)
					.catch((err) => {
						runner.log.error((err as Error).message, {
							cause: err,
							script: script.info.scriptSource,
							rid,
						});
					})
					.finally(() => {
						activeRuns.delete(params.task);
					});

				return {
					message: "Script start running",
					rid,
				};
			}),
	)
	.onError(async ({ code }) => {
		if (code === "NOT_FOUND") {
			const currentHash =
				await $`git rev-parse --short HEAD | tr -d '\n'`.quiet();
			return `404 Not Found (${config.bot.username} ${currentHash.text()})`;
		}
	})
	.listen(port);

console.log(`Server running at :${port}`);
