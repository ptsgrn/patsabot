import type { Bot } from "@core/bot";
import { config } from "@core/config";
import { ScriptRunner } from "@core/run";
import { $ } from "bun";
import { Elysia } from "elysia";

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

runner.log.info("Starting scheduled tasks");
runner.startScheduled();

const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

export const app = new Elysia()
  .get("/tasks", async () => {
    return Object.entries(runner.scheduled).map(getTask);
  })
  .get("/task/:task", async ({ params, status }) => {
    const script = runner.scheduled[params.task];
    if (!script) return status(404, "Task not found");
    return getTask([params.task, script]);
  })
  .get("/badge/:task/running", async ({ params, status }) => {
    const script = runner.scheduled[params.task];
    if (!script) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: script.info.id,
      message: script.job?.isRunning() ? "running" : "idle",
      color: script.job?.isRunning() ? "green" : "blue",
    };
  })
  .get("/badge/:task/next", async ({ params, status }) => {
    const script = runner.scheduled[params.task];
    if (!script) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: script.info.id,
      message: script.job?.nextRun()?.toISOString() || "idle",
      color: script.job?.isRunning() ? "blue" : "orange",
    };
  })
  .get("/badge/:task/previous", async ({ params, status }) => {
    const script = runner.scheduled[params.task];
    if (!script) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: script.info.id,
      message: script.job?.previousRun()?.toISOString() || "idle",
      color: script.job?.isRunning() ? "blue" : "orange",
    };
  })
  .get("/badge/:task/left", async ({ params, status }) => {
    const script = runner.scheduled[params.task];
    if (!script) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: script.info.id,
      message: script.job?.runsLeft() || "idle",
      color: script.job?.isRunning() ? "blue" : "orange",
    };
  })
  .onError(async ({ code }) => {
    if (code === "NOT_FOUND") {
      const currentHash =
        await $`git rev-parse --short HEAD | tr -d '\n'`.quiet();
      return `404 Not Found (${config.bot.username} ${currentHash.text()})`;
    }
  })
  .listen(port);

console.log(`Server running at :${port}`);
