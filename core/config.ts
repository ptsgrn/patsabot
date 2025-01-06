import { z } from 'zod'

if (!Bun.file('../config.toml').exists()) {
  throw new Error('Please create config.toml')
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
}).parse(await import('../config.toml'))
