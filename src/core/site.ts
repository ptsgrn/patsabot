import type { Account, Config } from "./config";

/** A site selector resolved against `[sites]` in the config. */
export interface ResolvedSite {
  /** Wiki family, e.g. `wikipedia`. */
  family: string;
  /** Site code, e.g. `th`. */
  code: string;
  /** Canonical `family:code` string. */
  key: string;
  /** Fully expanded API endpoint. */
  apiUrl: string;
  /** Replica database name, if the family declares one. */
  dbname?: string;
}

/** The credentials chosen for the active site. */
export interface ResolvedAccount {
  username: string;
  oauth: Account["oauth"];
}

/**
 * Split a `family:code` selector. A bare family (`wikidata`) is read as
 * `wikidata:www`, matching Pywikibot's treatment of single-site families.
 */
export function parseSiteSelector(selector: string): {
  family: string;
  code: string;
} {
  const [family, code] = selector.split(":", 2);
  if (!family) {
    throw new Error(`Invalid site selector: "${selector}"`);
  }
  return { family, code: code || "www" };
}

/**
 * How specifically an account's `site` field matches a site.
 * Higher wins; 0 means no match.
 */
function matchScore(accountSite: string, site: { family: string; code: string }) {
  if (accountSite === "*") return 1;
  const { family, code } = parseSiteSelector(accountSite);
  if (family !== site.family) return 0;
  if (accountSite.endsWith(":*")) return 2;
  return code === site.code ? 3 : 0;
}

/** Expand `{code}` placeholders in a site template. */
function expand(template: string, code: string) {
  return template.replaceAll("{code}", code);
}

/**
 * Resolve `--site` (or `bot.defaultSite`) into a concrete endpoint.
 *
 * @param apiUrlOverride Bypasses the `[sites]` table entirely (`--api-url`).
 */
export function resolveSite(
  config: Config,
  selector = config.bot.defaultSite,
  apiUrlOverride?: string,
): ResolvedSite {
  const { family, code } = parseSiteSelector(selector);
  const definition = config.sites[family];

  if (!definition && !apiUrlOverride) {
    const known = Object.keys(config.sites).sort().join(", ") || "none";
    throw new Error(
      `Unknown site family "${family}". Declared families: ${known}`,
    );
  }

  return {
    family,
    code,
    key: `${family}:${code}`,
    apiUrl: apiUrlOverride ?? expand(definition!.url, code),
    dbname: definition?.dbname ? expand(definition.dbname, code) : undefined,
  };
}

/**
 * Pick the credentials for a site, preferring the most specific `site`
 * selector. `username` defaults to `bot.defaultUser`.
 */
export function resolveAccount(
  config: Config,
  site: ResolvedSite,
  username = config.bot.defaultUser,
): ResolvedAccount {
  const named = config.accounts.filter((a) => a.username === username);

  if (named.length === 0) {
    const known = [...new Set(config.accounts.map((a) => a.username))]
      .sort()
      .join(", ");
    throw new Error(
      `No account named "${username}" in config. Known accounts: ${known}`,
    );
  }

  const best = named
    .map((account) => ({ account, score: matchScore(account.site, site) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)[0];

  if (!best) {
    throw new Error(
      `Account "${username}" is not configured for site ${site.key}. ` +
        `It declares: ${named.map((a) => a.site).join(", ")}`,
    );
  }

  return { username: best.account.username, oauth: best.account.oauth };
}

/**
 * The API URL to actually use: an account-level `apiUrl` overrides the one
 * derived from the family template.
 */
export function accountApiUrl(
  config: Config,
  site: ResolvedSite,
  username: string,
): string {
  const account = config.accounts.find(
    (a) => a.username === username && matchScore(a.site, site) > 0,
  );
  return account?.apiUrl ?? site.apiUrl;
}
