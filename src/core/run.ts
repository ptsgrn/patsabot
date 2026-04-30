import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
	Command,
	InvalidArgumentError,
	Option,
} from "@commander-js/extra-typings";
import { Bot } from "@core/bot";
import { Replica } from "@core/replica";
import { createId } from "@paralleldrive/cuid2";
import { version } from "../../package.json";
import { ServiceBase } from "./base";

type BotClass = new () => Bot;

export class ScriptRunner extends ServiceBase {
	private cli = new Command();
	public scheduled: Record<string, Bot> = {};

	private get scriptsDir() {
		return join(import.meta.dir, "../scripts");
	}

	/**
	 * Load a script module by name (relative to src/scripts, no extension).
	 * Names with slashes are allowed for subdirectory scripts (e.g. "database-reports/drafts-with-cats").
	 */
	async loadScript(scriptName: string): Promise<BotClass> {
		if (!scriptName.match(/^[a-z0-9\-/.]+$/)) {
			throw new Error(`Invalid script name: ${scriptName}`);
		}

		const scriptPath = join(this.scriptsDir, `${scriptName}.ts`);
		if (!(await Bun.file(scriptPath).exists())) {
			throw new Error(`Script not found: ${scriptName}`);
		}

		const module = await import(`@scripts/${scriptName}.ts`);

		if (!module.default) {
			throw new Error(`Script ${scriptName} has no default export`);
		}
		if (!(module.default.prototype instanceof Bot)) {
			throw new Error(`Script ${scriptName} default export must extend Bot`);
		}

		return module.default as BotClass;
	}

	/**
	 * Discover top-level script names (no subdirectories).
	 * Subdirectory scripts are managed by their parent script (e.g. database-reports.ts).
	 */
	private async getTopLevelScriptNames(): Promise<string[]> {
		const entries = await readdir(this.scriptsDir, { withFileTypes: true });
		return entries
			.filter((e) => e.isFile() && e.name.endsWith(".ts"))
			.map((e) => e.name.replace(/\.ts$/, ""));
	}

	/**
	 * Discover all script names including subdirectories (used for scheduling).
	 */
	private async getAllScriptNames(): Promise<string[]> {
		const files = (await readdir(this.scriptsDir, {
			recursive: true,
		})) as string[];
		return files
			.filter(
				(f) =>
					f.endsWith(".ts") &&
					!f.endsWith(".d.ts") &&
					!f.includes("TODO"),
			)
			.map((f) => f.replace(/\.ts$/, "").replace(/\\/g, "/"));
	}

	private initInstance(
		instance: Bot,
		scriptName: string,
		logLevel?: string,
		rid = createId(),
	) {
		instance.info.scriptSource = scriptName;
		instance.info.rid = rid;
		instance.log = instance.log.child({ script: scriptName, rid });
		if (logLevel) instance.log.level = logLevel;
	}

	/**
	 * Build the `run` command with each top-level script registered as a subcommand.
	 * This gives each script its own --help output and typed option parsing.
	 */
	private async buildRunCommand(): Promise<Command> {
		const runCmd = new Command("run")
			.description("Run a script")
			.addHelpText(
				"after",
				'\nRun "patsabot run <script> --help" for script-specific options.',
			);

		const scriptNames = await this.getTopLevelScriptNames();

		for (const name of scriptNames) {
			let ScriptClass: BotClass;
			let probe: Bot;
			try {
				ScriptClass = await this.loadScript(name);
				probe = new ScriptClass();
			} catch (err) {
				this.log.warn(
					`Skipping script "${name}": ${(err as Error).message}`,
				);
				continue;
			}

			const scriptCmd = new Command(name).description(
				probe.info.description ?? "",
			);

			// Copy script-defined options into the subcommand so Commander handles
			// parsing, validation, and --help automatically.
			for (const opt of probe.cli.options) {
				scriptCmd.addOption(opt.helpGroup("Script Options"));
			}

			scriptCmd.addOption(
				new Option("--no-dry-run", "Save changes to wiki (default: dry run)")
					.helpGroup("Script Options"),
			);
			scriptCmd.addOption(
				new Option("-l, --log-level <level>", "Log level")
					.choices(["debug", "info", "warn", "error"] as const)
					.default(this.config.logger.level)
					.helpGroup("Global Options"),
			);

			scriptCmd.action(async () => {
				const instance = new ScriptClass();
				for (const [key, value] of Object.entries(scriptCmd.opts())) {
					instance.cli.setOptionValue(key, value);
				}
				const { logLevel } = scriptCmd.opts() as { logLevel: string };
				this.initInstance(instance, name, logLevel);
				await instance.startLifeCycle();
			});

			runCmd.addCommand(scriptCmd);
		}

		return runCmd;
	}

	/**
	 * Run a script by name with default options (used by the web API).
	 */
	async runScript(scriptName: string, rid = createId()) {
		const ScriptClass = await this.loadScript(scriptName);
		const instance = new ScriptClass();
		this.initInstance(instance, scriptName, undefined, rid);
		instance.cli.setOptionValue("dryRun", false);
		await instance.startLifeCycle(rid);
	}

	async startScheduled() {
		const scriptNames = await this.getAllScriptNames();
		for (const name of scriptNames) {
			let ScriptClass: BotClass;
			try {
				ScriptClass = await this.loadScript(name);
			} catch {
				continue;
			}
			const script = new ScriptClass();
			if (!script.info.frequency) {
				this.log.debug(`Script ${script.info.id} has no frequency, skipping`);
				continue;
			}
			this.log.info(`Scheduled ${script.info.id} (${script.info.frequency})`);
			this.initInstance(script, name);
			this.scheduled[script.info.id] = script;
			script.schedule();
		}
	}

	async run() {
		this.cli = new Command("patsabot")
			.version(version)
			// Global options — must be placed before the subcommand name in the CLI.
			// config.ts reads these independently via parseArgs so they take effect
			// before any script is loaded.
			.addOption(
				new Option("-u, --user <username>", "Account to use — loads config-<username>.toml")
					.helpGroup("Global Options"),
			)
			.addOption(
				new Option("--config <path>", "Config file path")
					.default("config.toml")
					.helpGroup("Global Options"),
			)
			.enablePositionalOptions()
			.configureHelp({
				showGlobalOptions: true,
				sortOptions: true,
				sortSubcommands: true,
			});

		this.cli.addCommand(await this.buildRunCommand());

		this.cli
			.command("schedule")
			.description("Schedule a script with a one-off cron pattern or date")
			.argument("<script>", "Script name")
			.option("--cron <cron>", "Cron expression")
			.addOption(
				new Option(
					"--date <date>",
					"ISO 8601 date to run the script (must be in the future)",
				).argParser((value) => {
					if (Number.isNaN(Date.parse(value))) {
						throw new InvalidArgumentError(
							"Invalid date — must be parseable by Date.parse",
						);
					}
					if (new Date(value) < new Date()) {
						throw new InvalidArgumentError("Date must be in the future");
					}
					return new Date(value);
				}),
			)
			.option(
				"--interval <seconds>",
				"Minimum interval between executions (seconds)",
				(v) => Number.parseInt(v, 10),
			)
			.showHelpAfterError()
			.action(async (scriptName, options) => {
				const ScriptClass = await this.loadScript(scriptName);
				const script = new ScriptClass();
				if (!options.cron && !options.date) {
					throw new Error("Provide --cron <expression> or --date <ISO8601>");
				}
				const pattern = (options.date as Date | undefined) ?? (options.cron as string);
				this.scheduled[script.info.id] = script;
				script.info.scriptSource = scriptName;
				await script.schedule({
					pattern,
					options: { interval: options.interval },
				});
			});

		this.cli
			.command("replica-tunnel")
			.description("Open SSH tunnel to a Wikimedia Replica database")
			.argument("<wiki>", "Wiki database name (e.g. thwiki_p, enwiki)")
			.option(
				"--port <port>",
				"Local port to forward to",
				(v) => Number.parseInt(v, 10),
				3306,
			)
			.addOption(
				new Option("--cluster <cluster>", "Database cluster")
					.choices(["web", "analytics"] as const)
					.default("web"),
			)
			.action(async (wiki, options) => {
				Replica.createReplicaTunnel(wiki, options.cluster, options.port);
			});

		this.cli
			.command("start")
			.description("Load all pre-scheduled scripts and start the bot")
			.action(this.startScheduled.bind(this));

		this.cli.parse(Bun.argv);
	}
}

if (
	Bun.main === resolve(join(import.meta.path, "../../")) ||
	import.meta.main
) {
	new ScriptRunner().run();
}
