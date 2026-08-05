import { $ } from "bun";
import { Elysia } from "elysia";
import { loadConfig } from "./config";
import type { ScheduledScript } from "./scheduler";
import { Scheduler } from "./scheduler";

await loadConfig(process.env.CONFIG_FILE ?? "config.toml");

const getTask = ([id, scheduled]: [string, ScheduledScript]) => {
  const { job, entry } = scheduled;
  return {
    id,
    info: entry.meta,
    job: {
      next: job.nextRun(),
      previous: job.previousRun(),
      left: job.runsLeft(),
      pattern: job.getPattern(),
      status: job.isBusy()
        ? "busy"
        : job.isRunning()
          ? "running"
          : job.isStopped()
            ? "stopped"
            : ("idle" as "busy" | "running" | "stopped" | "idle"),
      options: job.options,
    },
  };
};

const scheduler = new Scheduler();

scheduler.log.info("Starting scheduled tasks");
await scheduler.scheduleAll();

const port = Number.parseInt(process.env.PORT ?? "3000", 10) || 3000;

export const app = new Elysia()
  .get("/tasks", () => Object.entries(scheduler.jobs).map(getTask))
  .get("/task/:task", ({ params, status }) => {
    const scheduled = scheduler.jobs[params.task];
    if (!scheduled) return status(404, "Task not found");
    return getTask([params.task, scheduled]);
  })
  .get("/badge/:task/running", ({ params, status }) => {
    const scheduled = scheduler.jobs[params.task];
    if (!scheduled) return status(404, "Task not found");
    const running = scheduled.job.isRunning();
    return {
      schemaVersion: 1,
      label: scheduled.entry.meta.id,
      message: running ? "running" : "idle",
      color: running ? "green" : "blue",
    };
  })
  .get("/badge/:task/next", ({ params, status }) => {
    const scheduled = scheduler.jobs[params.task];
    if (!scheduled) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: scheduled.entry.meta.id,
      message: scheduled.job.nextRun()?.toISOString() || "idle",
      color: scheduled.job.isRunning() ? "blue" : "orange",
    };
  })
  .get("/badge/:task/previous", ({ params, status }) => {
    const scheduled = scheduler.jobs[params.task];
    if (!scheduled) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: scheduled.entry.meta.id,
      message: scheduled.job.previousRun()?.toISOString() || "idle",
      color: scheduled.job.isRunning() ? "blue" : "orange",
    };
  })
  .get("/badge/:task/left", ({ params, status }) => {
    const scheduled = scheduler.jobs[params.task];
    if (!scheduled) return status(404, "Task not found");
    return {
      schemaVersion: 1,
      label: scheduled.entry.meta.id,
      message: scheduled.job.runsLeft() || "idle",
      color: scheduled.job.isRunning() ? "blue" : "orange",
    };
  })
  .onError(async ({ code }) => {
    if (code === "NOT_FOUND") {
      const currentHash =
        await $`git rev-parse --short HEAD | tr -d '\n'`.quiet();
      return `404 Not Found (${scheduler.config.bot.defaultUser} ${currentHash.text()})`;
    }
  })
  .listen(port);

console.log(`Server running at :${port}`);
