import { createId } from "@paralleldrive/cuid2";
import { Mwn } from "mwn";
import Parser from "wikiparser-node";
import { dependencies, version } from "../../package.json";
import { Input, Output } from "./base";
import { getConfig } from "./config";
import type {
  AnyCommand,
  OptionsOf,
  ResolvedScriptMeta,
  Script,
  ScriptContext,
} from "./define";
import { getLogger } from "./logger";
import { Replica } from "./replica";
import { accountApiUrl, resolveAccount, resolveSite } from "./site";
import { WikidataService } from "./wikidata";

export interface RunParams {
  /** Path under `src/scripts`, used as the default id and log label. */
  source: string;
  /** Parsed options for this script. */
  opts?: Record<string, unknown>;
  /** `family:code`. Falls back to the script's `meta.site`, then the config. */
  site?: string;
  /** Account name. Falls back to `bot.defaultUser`. */
  user?: string;
  /** Bypasses the `[sites]` table. */
  apiUrl?: string;
  /** Writes are suppressed unless this is explicitly false. */
  dryRun?: boolean;
  logLevel?: string;
  rid?: string;
}

/** Fill in the defaults a script's `meta` leaves out. */
export function resolveMeta(
  script: Script<AnyCommand>,
  source: string,
): ResolvedScriptMeta {
  const id = script.meta.id ?? source;
  return {
    id,
    name: script.meta.name ?? id,
    description: script.meta.description,
    frequency: script.meta.frequency,
    site: script.meta.site,
    source,
  };
}

/** Strip a `/w/api.php` suffix to get a Wikibase instance base URL. */
function toInstanceUrl(apiUrl: string) {
  return apiUrl.replace(/\/w\/api\.php\/?$/, "");
}

/**
 * Build the context a script runs against: resolved site and credentials, a
 * logged-in Mwn client, and the shared services.
 */
export async function createContext<C extends AnyCommand>(
  script: Script<C>,
  params: RunParams,
): Promise<ScriptContext<OptionsOf<C>>> {
  const config = getConfig();
  const meta = resolveMeta(script, params.source);
  const rid = params.rid ?? createId();

  const site = resolveSite(
    config,
    params.site ?? meta.site ?? config.bot.defaultSite,
    params.apiUrl,
  );
  const account = resolveAccount(config, site, params.user);
  const apiUrl = params.apiUrl ?? accountApiUrl(config, site, account.username);

  const log = getLogger().child({ script: meta.source, rid });
  if (params.logLevel) log.level = params.logLevel;

  const userAgent = `${account.username}/${version} (${config.bot.contact}) mwn/${dependencies.mwn}`;

  const bot = new Mwn({
    apiUrl,
    userAgent,
    OAuthCredentials: {
      consumerToken: account.oauth.consumerToken,
      consumerSecret: account.oauth.consumerSecret,
      accessToken: account.oauth.accessToken,
      accessSecret: account.oauth.accessSecret,
    },
  });
  bot.initOAuth();
  await bot.getTokensAndSiteInfo();

  const wikidataApiUrl =
    config.sites.wikidata?.url ?? "https://www.wikidata.org/w/api.php";

  return {
    opts: (params.opts ?? {}) as OptionsOf<C>,
    meta,
    rid,
    dryRun: params.dryRun !== false,
    site,
    account,
    config,
    log,
    bot,
    replica: new Replica({ dbname: site.dbname }),
    wikidata: new WikidataService({
      instance: toInstanceUrl(wikidataApiUrl),
      userAgent,
      credentials: {
        oauth: {
          consumer_key: account.oauth.consumerToken,
          consumer_secret: account.oauth.consumerSecret,
          token: account.oauth.accessToken,
          token_secret: account.oauth.accessSecret,
        },
      },
    }),
    input: new Input(account.username),
    output: new Output(),
    wikitextParser: Parser,
  };
}

/**
 * Run one script end to end: build the context, then `beforeRun` -> `run` ->
 * `afterRun`. Errors from `run` are logged, not rethrown, so a failing
 * scheduled script cannot take the process down. The replica connection is
 * always closed.
 */
export async function executeScript<C extends AnyCommand>(
  script: Script<C>,
  params: RunParams,
): Promise<void> {
  const ctx = await createContext(script, params);
  ctx.log.debug(
    `Running ${ctx.meta.id} on ${ctx.site.key} as ${ctx.account.username}${ctx.dryRun ? " (dry run)" : ""}`,
  );

  try {
    await script.beforeRun?.(ctx);
    await script.run(ctx);
  } catch (err) {
    if (err instanceof Error) {
      ctx.log.error(err.message, { cause: err });
    } else {
      ctx.log.error(String(err));
    }
  } finally {
    try {
      await script.afterRun?.(ctx);
    } finally {
      if (ctx.replica.conn) await ctx.replica.end();
    }
  }
}
