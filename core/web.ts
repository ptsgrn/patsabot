import { Elysia, t } from "elysia"
import { jwt } from '@elysiajs/jwt'
import { bearer } from "@elysiajs/bearer"
import { swagger } from '@elysiajs/swagger'
import { $, ShellPromise } from "bun"
import { config } from '@core/config'
import { version } from "../package.json"

const now = () => new Date().toISOString()

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
  .onError(async ({ code }) => {
    if (code === 'NOT_FOUND') {
      const currentHash = await $`git rev-parse --short HEAD | tr -d '\n'`
      return `404 Not Found (${config.bot.username} ${currentHash.text()})`
    }
  })
  .listen(process.env.PORT || 3000)

console.log(`Server running at :${process.env.PORT || 3000}`)