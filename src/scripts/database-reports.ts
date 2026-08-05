import { createId } from "@paralleldrive/cuid2";
import { executeScript } from "@core/context";
import { defineScript } from "@core/define";
import { discoverScripts } from "@core/registry";
import { lastReportUpdate } from "./database-reports/_shared";

/**
 * Interactively run every report under `database-reports/`, prompting
 * before each save. Individual reports are already reachable directly
 * (`patsabot run database-reports/long-stubs`) and are auto-scheduled by
 * `patsabot start` since each declares its own `frequency` — this command is
 * only for the "run everything, one at a time, with a confirm" workflow.
 */
export default defineScript({
  meta: {
    description: "Interactively run all database reports",
  },

  async run(ctx) {
    const reports = (await discoverScripts((name, err) =>
      ctx.log.warn(`Skipping report "${name}": ${err.message}`),
    )).filter((entry) => entry.name.startsWith("database-reports/"));

    for (const entry of reports) {
      ctx.log.info(`Report ${entry.meta.id} (${entry.meta.name})`);
      ctx.log.debug(`Last update: ${await lastReportUpdate(ctx, entry.meta.name)}`);

      if (await ctx.input.confirm(`Run ${entry.meta.id}?`)) {
        await executeScript(entry.script, {
          source: entry.name,
          site: ctx.site.key,
          user: ctx.account.username,
          dryRun: ctx.dryRun,
          logLevel: ctx.log.level,
          rid: createId(),
        });
      }
    }
  },
});
