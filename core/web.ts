import { Elysia, t } from "elysia"
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { $, ShellPromise, type Shell } from "bun"
import { config } from '@core/config'

const now = () => new Date().toISOString()

export const app = new Elysia()
  .use(swagger())
  .use(
    jwt({
      name: "jwt",
      secret: config.toolforge.deploykey
    })
  )
  .get("/deploy", async function* ({ jwt, query }) {
    const data = await jwt.verify(query.token)
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
  .onError(async ({ code }) => {
    if (code === 'NOT_FOUND') {
      const currentHash = await $`git rev-parse --short HEAD | tr -d '\n'`
      return `404 Not Found (${config.bot.username} ${currentHash.text()})`
    }
  })
  .listen(process.env.PORT || 3000)

console.log(`Server running at :${process.env.PORT || 3000}`)