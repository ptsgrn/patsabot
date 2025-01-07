import { Elysia } from "elysia"
import { $ } from "bun"
import { config } from '@core/config'

const now = () => new Date().toISOString()

export const app = new Elysia()
  .get("/deploy/:token", async function* ({ params }) {
    const { token } = params
    if (!token) return { status: 401, body: "Unauthorized" }
    if (token !== config.toolforge.deploykey) return { status: 403, body: "Forbidden" }
    const commands = [
      [$`git fetch`, "git fetch"],
      [$`git reset --hard origin/main`, "git reset --hard origin/main"],
      [$`git pull`, "git pull"],
      [$`bun i`, "bun i"],
    ]

    // yield simple html response prepend for simple style
    yield `[${now()}] Starting deployment...\n`
    const start = Date.now()
    for (const command of commands) {
      yield `[${now()}] Running: ${command[Symbol]}\n`
      for await (const line of command.lines()) {
        console.log(`[${now()}]`, line.trim())
        yield `[${now()}] ${line.trim()}\n`
      }
    }
    const end = Date.now()
    yield `[${now()}] Deployment completed in ${end - start}ms\n`
  })
  .onError(async ({ code }) => {
    if (code === 'NOT_FOUND') {
      const currentHash = await $`git rev-parse --short HEAD | tr -d '\n'`
      return `404 Not Found (${config.bot.username} ${currentHash.text()})`
    }
  })
  .listen(process.env.PORT || 3000)

console.log(`Server running at :${process.env.PORT || 3000}`)