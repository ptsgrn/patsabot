import { Elysia, t } from "elysia"
import { jwt } from '@elysiajs/jwt'
import { bearer } from "@elysiajs/bearer"
import { swagger } from '@elysiajs/swagger'
import { $, ShellPromise } from "bun"
import { config } from '@core/config'
import { version } from "../package.json"
import { ScriptRunner } from "@core/run"
import type { Bot } from '@core/bot'
import { createId } from '@paralleldrive/cuid2'
import { join, resolve } from 'node:path'

const now = () => new Date().toISOString()
const getTask = ([id, script]: [string, Bot]) => ({
  id,
  info: script.info,
  job: {
    next: script.job?.nextRun(),
    previous: script.job?.previousRun(),
    left: script.job?.runsLeft(),
    pattern: script.job?.getPattern(),
    status: script.job?.isBusy()
      ? "busy" : script.job?.isRunning()
        ? "running" : script.job?.isStopped()
          ? "stopped" : "idle" as "busy" | "running" | "stopped" | "idle",
    options: script.job?.options
  }
})
const runner = new ScriptRunner()
runner.startScheduled()

export const app = new Elysia()
  .use(swagger({
    swaggerOptions: {
      persistAuthorization: true,
    },
    documentation: {
      info: {
        title: 'PatsaBot API',
        version: version
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  }))
  .get("/deploy", async function* ({ headers, set, error }) {
    if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
      return error(401, "Unauthorized")
    }
    const commands = [
      [$`git fetch`, "git fetch"],
      [$`git reset --hard origin/main`, "git reset --hard origin/main"],
      [$`git pull`, "git pull"],
      [$`bun i`, "bun i"],
    ] as [ShellPromise, string][]

    // yield simple html response prepend for simple style
    yield `[${now()}] Starting deployment...\n`
    const start = Date.now()
    for (const [command, rawCommand] of commands) {
      yield `[${now()}] Running: ${rawCommand}\n`
      for await (const line of command.lines()) {
        console.log(`[${now()}]`, line.trim())
        yield `[${now()}] ${line.trim()}\n`
      }
    }
    const end = Date.now()
    yield `[${now()}] Deployment completed in ${end - start}ms\n`
  })
  .get("/tasks", async () => {
    return Object.entries(runner.scheduled).map(getTask)
  })
  .get("/task/:task", async ({ params }) => {
    const script = runner.scheduled[params.task]
    return getTask([params.task, script])
  })
  .post("/task/:task/pause", async ({ params, headers, error }) => {
    if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
      return error(401, "Unauthorized")
    }
    const script = runner.scheduled[params.task]
    if (!script) {
      return error(404, "Task not found")
    }
    return { message: script.job?.pause() ? "Task paused" : "Task already paused" }
  })
  .post("/task/:task/resume", async ({ params, error, headers }) => {
    if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
      return error(401, "Unauthorized")
    }
    const script = runner.scheduled[params.task]
    if (!script) {
      return error(404, "Task not found")
    }
    return { message: script.job?.resume() ? "Task resumed" : "Task already running" }
  })
  .post("/task/:task/stop", async ({ params, error, headers }) => {
    if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
      return error(401, "Unauthorized")
    }
    const script = runner.scheduled[params.task]
    if (!script) {
      return error(404, "Task not found")
    }
    script.job?.stop()
    delete runner.scheduled[params.task]
    return { message: "Task stopped and removed" }
  })
  .post("/task/:task/run", async ({ params, error, headers }) => {
    if (headers.authorization !== `Bearer ${config.toolforge.webKey}`) {
      return error(401, "Unauthorized")
    }
    const script = runner.scheduled[params.task]
    if (!script) {
      return error(404, "Task not found")
    }
    if (!script.info.scriptSource) {
      return error(500, "No script source")
    }
    script.info.rid = createId()
    runner.runScript(script.info.scriptSource)
    return {
      message: "Script start running",
      rid: script.info.rid
    }
  })
  .get("/badge/:task/running", async ({ params }) => {
    const script = runner.scheduled[params.task]
    return {
      "schemaVersion": 1,
      "label": script.info.id,
      "message": script.job?.isRunning() ? "running" : "idle",
      "color": script.job?.isRunning() ? "green" : "blue"
    }
  })
  .get("/badge/:task/next", async ({ params }) => {
    const script = runner.scheduled[params.task]
    return {
      "schemaVersion": 1,
      "label": script.info.id,
      "message": script.job?.nextRun()?.toISOString() || "idle",
      "color": script.job?.isRunning() ? "blue" : "orange"
    }
  })
  .get("/badge/:task/previous", async ({ params }) => {
    const script = runner.scheduled[params.task]
    return {
      "schemaVersion": 1,
      "label": script.info.id,
      "message": script.job?.previousRun()?.toISOString() || "idle",
      "color": script.job?.isRunning() ? "blue" : "orange"
    }
  })
  .get("/badge/:task/left", async ({ params }) => {
    const script = runner.scheduled[params.task]
    return {
      "schemaVersion": 1,
      "label": script.info.id,
      "message": script.job?.runsLeft() || "idle",
      "color": script.job?.isRunning() ? "blue" : "orange"
    }
  })
  .get("/logs/:kind", async function* ({ params, error, query }) {
    if (!['error', 'exceptions', 'output', 'rejections'].includes(params.kind.replace(/\.log$/, ''))) {
      return error(404, "Log not found")
    }
    const rid = query.rid
    const file = Bun.file(config.logger.logPath + "/" + params.kind)
    if (!file.exists()) {
      error(404, "Log not found")
    }
    const stream = file.stream();
    const decoder = new TextDecoder();

    let remainingData = "";

    for await (const chunk of stream) {
      const str = decoder.decode(chunk);

      remainingData += str; // Append the chunk to the remaining data

      // Split the remaining data by newline character
      let lines = remainingData.split(/\r?\n/);
      // Loop through each line, except the last one
      while (lines.length > 1) {
        const linecontent = lines.shift();
        // if (rid) {
        //   if (linecontent && linecontent.includes(rid)) {
        //     yield linecontent + '\n'
        //   }
        // } else {
        //   yield linecontent + '\n'
        // }
        
      }
      // Update the remaining data with the last incomplete line
      remainingData = lines[0];
    }
  })
  .onError(async ({ code }) => {
    if (code === 'NOT_FOUND') {
      const currentHash = await $`git rev-parse --short HEAD | tr -d '\n'`.quiet()
      return `404 Not Found (${config.bot.username} ${currentHash.text()})`
    }
  })
  .listen(process.env.PORT || 3000)

console.log(`Server running at :${process.env.PORT || 3000}`)