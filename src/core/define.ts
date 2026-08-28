import type { Command } from "@commander-js/extra-typings";
import type { Mwn } from "mwn";
import type Parser from "wikiparser-node";
import type { Logger } from "winston";
import type { Input, Output } from "./base";
import type { Config } from "./config";
import type { Replica } from "./replica";
import type { ResolvedAccount, ResolvedSite } from "./site";

// biome-ignore lint/suspicious/noExplicitAny: Commander's generics are variadic.
export type AnyCommand = Command<any[], any>;

/** The parsed option object a Command produces. */
export type OptionsOf<C> = C extends { opts(): infer O }
  ? O
  : Record<string, never>;

export interface ScriptMeta {
  /**
   * Stable identifier used by the scheduler and the web API. Defaults to the
   * script's path under `src/scripts` (e.g. `database-reports/long-stubs`).
   */
  id?: string;
  /** Human-readable name. Defaults to `id`. */
  name?: string;
  description: string;
  /** Cron pattern. A script without one is never auto-scheduled. */
  frequency?: string;
  /**
   * Site this script targets when `--site` is not given, overriding
   * `bot.defaultSite`. Use for scripts bound to one wiki (e.g. `wikidata`).
   */
  site?: string;
}

/** `ScriptMeta` after the runner has filled in the defaults. */
export interface ResolvedScriptMeta extends Required<
  Omit<ScriptMeta, "frequency" | "site">
> {
  frequency?: string;
  site?: string;
  /** Path under `src/scripts`, without the extension. */
  source: string;
}

/**
 * Everything a script is handed at run time. Built fresh per run by
 * `createContext()`; scripts never construct their own clients.
 */
export interface ScriptContext<TOptions = Record<string, never>> {
  /** Parsed CLI options, typed from this script's own `options` builder. */
  readonly opts: TOptions;
  readonly meta: ResolvedScriptMeta;
  /** Unique id for this run, attached to every log line. */
  readonly rid: string;
  /**
   * When true, the script must not write to the wiki. On by default; the
   * global `--no-dry-run` flag turns it off.
   */
  readonly dryRun: boolean;
  /**
   * Whether a human is at a terminal to review edits interactively. Off for
   * scheduled/background runs; `ctx.input.reviewEdit()` respects it.
   */
  readonly interactive: boolean;
  readonly site: ResolvedSite;
  readonly account: ResolvedAccount;
  readonly config: Config;
  readonly log: Logger;
  readonly bot: Mwn;
  readonly replica: Replica;
  readonly input: Input;
  readonly output: Output;
  readonly wikitextParser: typeof Parser;
}

export interface ScriptDefinition<C extends AnyCommand = AnyCommand> {
  meta: ScriptMeta;
  /**
   * Declare script-specific flags. Whatever this returns determines the type
   * of `ctx.opts`.
   */
  options?: (command: Command) => C;
  /** Runs after the wiki client is ready, before `run`. */
  beforeRun?: (ctx: ScriptContext<OptionsOf<C>>) => void | Promise<void>;
  run: (ctx: ScriptContext<OptionsOf<C>>) => void | Promise<void>;
  /** Always runs, even if `run` threw. The replica is closed after this. */
  afterRun?: (ctx: ScriptContext<OptionsOf<C>>) => void | Promise<void>;
}

/** Marker used by the registry to tell scripts from other modules. */
export const SCRIPT_MARKER = Symbol.for("patsabot.script");

export type Script<C extends AnyCommand = AnyCommand> = ScriptDefinition<C> & {
  readonly [SCRIPT_MARKER]: true;
};

/**
 * Declare a bot script. The default export of every file under `src/scripts`.
 *
 * @example
 * ```typescript
 * export default defineScript({
 *   meta: { description: "Create AfC categories", frequency: "0 2 * * *" },
 *   options: (c) => c.option("--date <date>", "Date to create for", "today"),
 *   async run(ctx) {
 *     ctx.log.info(ctx.opts.date); // typed as string
 *   },
 * });
 * ```
 */
export function defineScript<C extends AnyCommand = Command>(
  definition: ScriptDefinition<C>,
): Script<C> {
  if (import.meta.main) {
    definition.run?.({} as ScriptContext<OptionsOf<C>>);
  }
  return { ...definition, [SCRIPT_MARKER]: true } as Script<C>;
}

export function isScript(value: unknown): value is Script {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<symbol, unknown>)[SCRIPT_MARKER] === true
  );
}
