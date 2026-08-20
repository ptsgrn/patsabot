import { Cron, type CronOptions } from "croner";
import { ServiceBase } from "./base";
import { executeScript, type RunParams } from "./context";
import { discoverScripts, type ScriptEntry } from "./registry";

export interface ScheduledScript {
  entry: ScriptEntry;
  job: Cron;
}

/** Defaults applied to every job a scheduler owns. */
export type SchedulerDefaults = Omit<RunParams, "source" | "opts" | "rid">;

/**
 * Owns the cron jobs for scheduled scripts, keyed by script id.
 *
 * Jobs run through `executeScript`, so each firing gets its own context, run
 * id, and freshly authenticated client.
 */
export class Scheduler extends ServiceBase {
  public readonly jobs: Record<string, ScheduledScript> = {};

  constructor(private defaults: SchedulerDefaults = {}) {
    super();
  }

  /** Register one script on a cron pattern or a one-off date. */
  schedule(
    entry: ScriptEntry,
    pattern: string | Date,
    options: CronOptions = {},
    params: Partial<RunParams> = {},
  ): ScheduledScript {
    const job = new Cron(pattern, {
      name: entry.meta.id,
      timezone: this.config.bot.timezone,
      ...options,
    });

    job.schedule(() =>
      executeScript(entry.script, {
        ...this.defaults,
        source: entry.name,
        ...params,
        // Cron-fired runs have no attached terminal — never block on a
        // keypress, no matter what the caller passed in.
        interactive: false,
      }),
    );

    const scheduled = { entry, job };
    this.jobs[entry.meta.id] = scheduled;
    return scheduled;
  }

  /**
   * Schedule every discovered script that declares a `frequency`. Scripts
   * without one are only ever run on demand.
   */
  async scheduleAll(): Promise<ScheduledScript[]> {
    const entries = await discoverScripts((name, err) =>
      this.log.warn(`Skipping script "${name}": ${err.message}`),
    );

    const started: ScheduledScript[] = [];
    for (const entry of entries) {
      if (!entry.meta.frequency) {
        this.log.debug(`Script ${entry.meta.id} has no frequency, skipping`);
        continue;
      }
      started.push(this.schedule(entry, entry.meta.frequency));
      this.log.info(`Scheduled ${entry.meta.id} (${entry.meta.frequency})`);
    }
    return started;
  }

  /** Stop every job this scheduler owns. */
  stopAll() {
    for (const { job } of Object.values(this.jobs)) job.stop();
  }
}
