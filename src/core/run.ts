import {
  Command,
  InvalidArgumentError,
  Option,
} from "@commander-js/extra-typings";
import { version } from "../../package.json";
import { getConfig, loadConfig } from "./config";
import { executeScript, type RunParams } from "./context";
import type { AnyCommand } from "./define";
import { discoverScripts, loadScript, type ScriptEntry } from "./registry";
import { Replica } from "./replica";
import { Scheduler } from "./scheduler";
import { resolveAccount, resolveSite } from "./site";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

const GLOBAL_GROUP = "Global Options";
const SCRIPT_GROUP = "Script Options";

/**
 * Flags accepted by every command.
 *
 * They are declared on the root *and* on each leaf command so that both
 * `patsabot --user X run afccat` and `patsabot run afccat --user X` work;
 * `resolveGlobals()` decides which one won.
 */
function globalOptions(): Option[] {
  return [
    new Option("-c, --config <path>", "Config file to load")
      .default("config.toml")
      .helpGroup(GLOBAL_GROUP),
    new Option(
      "-s, --site <family:code>",
      "Wiki to work on, e.g. wikipedia:th (default: bot.defaultSite)",
    ).helpGroup(GLOBAL_GROUP),
    new Option(
      "-u, --user <username>",
      "Account to log in as (default: bot.defaultUser)",
    ).helpGroup(GLOBAL_GROUP),
    new Option(
      "--api-url <url>",
      "API endpoint, overriding the one derived from --site",
    ).helpGroup(GLOBAL_GROUP),
    new Option("--dry-run", "Do not write to the wiki")
      .default(true)
      .helpGroup(GLOBAL_GROUP),
    new Option("--no-dry-run", "Write changes to the wiki").helpGroup(
      GLOBAL_GROUP,
    ),
    new Option(
      "--interactive",
      "Force the interactive edit-review TUI on",
    ).helpGroup(GLOBAL_GROUP),
    new Option(
      "--no-interactive",
      "Disable the interactive edit-review TUI (for background/unattended runs). Defaults to on when stdout is a terminal.",
    ).helpGroup(GLOBAL_GROUP),
    new Option("-l, --log-level <level>", "Console log level")
      .choices(LOG_LEVELS)
      .helpGroup(GLOBAL_GROUP),
  ];
}

function addGlobalOptions<T extends AnyCommand>(command: T): T {
  for (const option of globalOptions()) command.addOption(option);
  return command;
}

interface Globals {
  config: string;
  site?: string;
  user?: string;
  apiUrl?: string;
  dryRun: boolean;
  interactive?: boolean;
  logLevel?: string;
}

/**
 * Merge the global flags seen on the root with those seen on the subcommand.
 * A value typed on the subcommand wins; otherwise the root's wins; otherwise
 * the declared default applies.
 */
function resolveGlobals(leaf: AnyCommand): Globals {
  const chain: AnyCommand[] = [];
  for (let cmd: AnyCommand | null = leaf; cmd; cmd = cmd.parent as AnyCommand | null)
    chain.push(cmd);

  const pick = <T>(name: string): T | undefined => {
    const fromCli = chain.find((c) => c.getOptionValueSource(name) === "cli");
    if (fromCli) return fromCli.getOptionValue(name) as T;
    const withValue = chain.find(
      (c) => c.getOptionValue(name) !== undefined,
    );
    return withValue?.getOptionValue(name) as T | undefined;
  };

  return {
    config: pick<string>("config") ?? "config.toml",
    site: pick<string>("site"),
    user: pick<string>("user"),
    apiUrl: pick<string>("apiUrl"),
    dryRun: pick<boolean>("dryRun") ?? true,
    interactive: pick<boolean>("interactive"),
    logLevel: pick<string>("logLevel"),
  };
}

/** Turn resolved globals into the parameters `executeScript` expects. */
function toRunParams(entry: ScriptEntry, globals: Globals): RunParams {
  return {
    source: entry.name,
    site: globals.site,
    user: globals.user,
    apiUrl: globals.apiUrl,
    dryRun: globals.dryRun,
    interactive: globals.interactive,
    logLevel: globals.logLevel,
  };
}

/**
 * Build the `run` command, registering one subcommand per discovered script.
 *
 * Script metadata and flags are read straight off the exported definition —
 * nothing is instantiated and no wiki client is built until a script actually
 * runs.
 */
function buildRunCommand(entries: ScriptEntry[]): AnyCommand {
  const runCmd = new Command("run")
    .description("Run a script once")
    .addHelpText(
      "after",
      '\nRun "patsabot run <script> --help" for script-specific options.',
    );

  for (const entry of entries) {
    const scriptCmd = new Command(entry.name).description(
      entry.meta.description,
    );

    entry.script.options?.(scriptCmd);
    for (const option of scriptCmd.options) option.helpGroup(SCRIPT_GROUP);
    addGlobalOptions(scriptCmd);

    scriptCmd.action(async () => {
      const globals = resolveGlobals(scriptCmd);
      await executeScript(entry.script, {
        ...toRunParams(entry, globals),
        opts: scriptCmd.opts(),
      });
    });

    runCmd.addCommand(scriptCmd);
  }

  return runCmd;
}

function parseFutureDate(value: string): Date {
  if (Number.isNaN(Date.parse(value))) {
    throw new InvalidArgumentError(
      "Invalid date — must be parseable by Date.parse",
    );
  }
  const date = new Date(value);
  if (date < new Date()) {
    throw new InvalidArgumentError("Date must be in the future");
  }
  return date;
}

/** Assemble the whole CLI. Discovers scripts, so it is async. */
export async function buildCli(): Promise<Command> {
  const program = addGlobalOptions(new Command("patsabot"))
    .version(version)
    .description("Wikipedia bot framework for Thai Wikipedia")
    .configureHelp({
      // Global options are added directly to every command (see
      // addGlobalOptions), grouped under "Global Options" via helpGroup —
      // commander's own ancestor-option listing would just duplicate them.
      showGlobalOptions: false,
      sortOptions: true,
      sortSubcommands: true,
    });

  // Every command needs the config, and every command accepts --config, so
  // load it once here rather than at module scope anywhere else.
  program.hook("preAction", async (_root, action) => {
    await loadConfig(resolveGlobals(action).config);
  });

  const entries = await discoverScripts((name, err) => {
    console.warn(`Skipping script "${name}": ${err.message}`);
  });

  program.addCommand(buildRunCommand(entries));

  addGlobalOptions(
    program
      .command("list")
      .description("List available scripts")
      .option("--json", "Output as JSON"),
  ).action(async (options) => {
    if (options.json) {
      console.log(
        JSON.stringify(
          entries.map((e) => ({ script: e.name, ...e.meta })),
          null,
          2,
        ),
      );
      return;
    }
    for (const { name, meta } of entries) {
      const schedule = meta.frequency ? `  [${meta.frequency}]` : "";
      console.log(`${name}${name === meta.id ? "" : ` (id: ${meta.id})`}${schedule}`);
      console.log(`    ${meta.description}`);
    }
  });

  addGlobalOptions(
    program
      .command("schedule")
      .description("Schedule a script with a one-off cron pattern or date")
      .argument("<script>", "Script name")
      .option("--cron <cron>", "Cron expression")
      .addOption(
        new Option(
          "--date <date>",
          "ISO 8601 date to run the script (must be in the future)",
        ).argParser(parseFutureDate),
      )
      .option(
        "--interval <seconds>",
        "Minimum interval between executions (seconds)",
        (v) => Number.parseInt(v, 10),
      )
      .showHelpAfterError(),
  ).action(async (scriptName, options, command) => {
    if (!options.cron && !options.date) {
      throw new Error("Provide --cron <expression> or --date <ISO8601>");
    }
    const entry = await loadScript(scriptName);
    const globals = resolveGlobals(command);
    const scheduler = new Scheduler(toRunParams(entry, globals));
    scheduler.schedule(
      entry,
      options.date ?? (options.cron as string),
      { interval: options.interval },
      toRunParams(entry, globals),
    );
    scheduler.log.info(
      `Scheduled ${entry.meta.id} (${options.date?.toISOString() ?? options.cron})`,
    );
  });

  addGlobalOptions(
    program
      .command("start")
      .description("Schedule every script that declares a frequency"),
  ).action(async (_options, command) => {
    const globals = resolveGlobals(command);
    const scheduler = new Scheduler({
      site: globals.site,
      user: globals.user,
      apiUrl: globals.apiUrl,
      dryRun: globals.dryRun,
      logLevel: globals.logLevel,
      interactive: false,
    });
    await scheduler.scheduleAll();
  });

  addGlobalOptions(
    program
      .command("replica-tunnel")
      .description("Open an SSH tunnel to a Wikimedia Replica database")
      .argument("<wiki>", "Wiki database name (e.g. thwiki_p, enwiki)")
      .option(
        "--port <port>",
        "Local port to forward to",
        (v) => Number.parseInt(v, 10),
        3306,
      )
      .addOption(
        new Option("--cluster <cluster>", "Database cluster")
          .choices(["web", "analytics"] as const)
          .default("web"),
      ),
  ).action(async (wiki, options) => {
    await Replica.createReplicaTunnel(wiki, options.cluster, options.port);
  });

  addGlobalOptions(
    program
      .command("config")
      .description("Show the resolved site and account for the current flags"),
  ).action(async (_options, command) => {
    const globals = resolveGlobals(command);
    const config = getConfig();
    const site = resolveSite(config, globals.site, globals.apiUrl);
    const account = resolveAccount(config, site, globals.user);
    console.log(
      JSON.stringify(
        {
          configFile: globals.config,
          site,
          account: account.username,
          dryRun: globals.dryRun,
        },
        null,
        2,
      ),
    );
  });

  return program;
}

export async function runCli(argv: string[] = Bun.argv): Promise<void> {
  const program = await buildCli();
  await program.parseAsync(argv);
}

if (import.meta.main) {
  await runCli();
}
