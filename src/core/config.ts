import { isAbsolute, join } from "node:path";
import { z } from "zod";
import { humanReadableToBytes } from "./helper";

/** Repository root, used to resolve relative config paths. */
export const REPO_ROOT = join(import.meta.dir, "../../");

const OAuthSchema = z.object({
  consumerToken: z.string(),
  consumerSecret: z.string(),
  accessToken: z.string(),
  accessSecret: z.string(),
});

const AccountSchema = z.object({
  /**
   * Site selector this account may be used on. Accepts an exact site
   * (`wikipedia:th`), a whole family (`wikipedia:*`), or every site (`*`).
   * The most specific matching account wins.
   */
  site: z.string().default("*"),
  username: z.string(),
  /** Overrides the API URL derived from `[sites.<family>]`. */
  apiUrl: z.string().optional(),
  oauth: OAuthSchema,
});

const SiteSchema = z.object({
  /** API endpoint. `{code}` is replaced with the site code. */
  url: z.string(),
  /** Replica database name. `{code}` is replaced with the site code. */
  dbname: z.string().optional(),
});

const WebUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.enum(["admin", "viewer"]).default("viewer"),
});

const ConfigSchema = z.object({
  bot: z.object({
    /** Site used when `--site` is not given. */
    defaultSite: z.string().default("wikipedia:th"),
    /** Account used when `--user` is not given. */
    defaultUser: z.string(),
    /** Contact string embedded in the User-Agent header. */
    contact: z.string(),
    timezone: z.string().default("UTC"),
  }),
  /** Wiki families, keyed by family name. */
  sites: z.record(z.string(), SiteSchema).default({}),
  /** Credentials, resolved against the active site by `resolveAccount()`. */
  accounts: z.array(AccountSchema).min(1),
  toolforge: z.object({
    sshUser: z.string(),
    sshHost: z.string().default("login.toolforge.org"),
    sshIdentityFile: z.string().optional(),
    tooluser: z.string().optional(),
    webKey: z.string().optional(),
  }),
  replica: z.object({
    username: z.string(),
    password: z.string(),
    /** Fallback when the active site defines no `dbname`. */
    dbname: z.string().optional(),
    cluster: z.enum(["web", "analytics"]).default("web"),
    port: z.number().default(3306),
  }),
  scripts: z
    .object({
      archive: z.object({
        key_salt: z.string().optional(),
      }),
    })
    .optional(),
  logger: z.object({
    logPath: z.string(),
    level: z.enum(["debug", "info", "warn", "error"]).default("info"),
    maxFileSize: z
      .string()
      .default("1MB")
      .transform((v) => humanReadableToBytes(v)),
  }),
  discord: z
    .object({
      logger: z.object({
        webhook: z.string().optional(),
      }),
    })
    .optional(),
  web: z
    .object({
      publicViewable: z.boolean().default(true),
      users: z.array(WebUserSchema).default([]),
      jwtSecret: z.string().optional(),
    })
    .optional(),
  options: z
    .object({
      iactoNotiPrompt: z.boolean().default(false),
    })
    .optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type SiteDefinition = z.infer<typeof SiteSchema>;
export type WebUser = z.infer<typeof WebUserSchema>;

let loaded: Config | null = null;
let loadedFrom: string | null = null;

/** Resolve a config filename against the repo root unless it is absolute. */
export function resolveConfigPath(file: string): string {
  return isAbsolute(file) ? file : join(REPO_ROOT, file);
}

/**
 * Read, validate and install the config singleton.
 *
 * Called once by the CLI after global flags are parsed, so nothing in the
 * codebase may touch config at module scope — see `getConfig()`.
 */
export async function loadConfig(file = "config.toml"): Promise<Config> {
  const path = resolveConfigPath(file);
  if (!(await Bun.file(path).exists())) {
    throw new Error(`Config file not found: ${path}`);
  }
  loaded = ConfigSchema.parse(await import(path));
  loadedFrom = path;
  process.env.TZ = loaded.bot.timezone;
  return loaded;
}

/** The active config. Throws if `loadConfig()` has not run yet. */
export function getConfig(): Config {
  if (!loaded) {
    throw new Error(
      "Config accessed before it was loaded — call loadConfig() first",
    );
  }
  return loaded;
}

export function isConfigLoaded(): boolean {
  return loaded !== null;
}

/** Absolute path of the file the active config came from. */
export function getConfigPath(): string | null {
  return loadedFrom;
}
