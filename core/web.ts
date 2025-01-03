import { Elysia } from "elysia"
import { $ } from "bun"
import config from '../config.toml'

const now = () => new Date().toISOString()

export const app = new Elysia()
  .get("/deploy/:token", async function* ({ params }) {
    const { token } = params
    if (!token) return { status: 401, body: "Unauthorized" }
    if (token !== config.toolforge.deploykey) return { status: 403, body: "Forbidden" }
    const commands = [
      $`git fetch`,
      $`git reset --hard origin/main`,
      $`git pull`,
      $`bun i`,
    ]

    // yield simple html response prepend for simple style
    yield `<html><body><pre>`
    yield `[${now()}] Starting deployment...\n`
    const start = Date.now()
    for (const command of commands) {
      yield `[${now()}] Running: ${command}\n`
      for await (const line of command.lines()) {
        console.log(`[${now()}]`, line.trim())
        yield `[${now()}] ${line.trim()}\n`
      }
      await Bun.sleep(5000)
    }
    const end = Date.now()
    yield `[${now()}] Deployment completed in ${end - start}ms\n`
    yield `</pre></body></html>`
  })
  .listen(process.env.PORT || 3000)