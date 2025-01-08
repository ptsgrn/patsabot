import { z } from 'zod'
import { parseArgs } from "util";
import { join } from "path"

const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    config: {
      type: 'string',
      default: "config.toml",
    }
  },
  strict: false,
});

let configFile = join(import.meta.dir, "../", typeof values.config === 'string' ? values.config : "config.toml")

if (!Bun.file(configFile).exists()) {
  throw new Error(`Config file not found: ${configFile}`)
}

export const config = z.object({
  oauth: z.object({
    consumerToken: z.string(),
    consumerSecret: z.string(),
    accessToken: z.string(),
    accessSecret: z.string(),
  }),
  bot: z.object({
    apiUrl: z.string(),
    username: z.string(),
    contact: z.string(),
    timezone: z.string(),
  }),
  toolforge: z.object({
    login: z.string(),
    tooluser: z.string(),
    deploykey: z.string(),
  }),
  replica: z.object({
    username: z.string(),
    password: z.string(),
    dbname: z.string(),
    cluster: z.string(),
    port: z.number(),
  }),
  scripts: z.object({
    archive: z.object({
      key_salt: z.string().optional(),
    }),
  }),
  logger: z.object({
    logPath: z.string(),
    level: z.string().default("info"),
  }),
  discord: z.object({
    logger: z.object({
      webhook: z.string().optional(),
    }),
  }),
}).parse(await import(configFile))

process.env.TZ = config.bot.timezone