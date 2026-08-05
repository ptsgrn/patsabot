import { defineScript, type ScriptContext } from "@core/define";
import chalk from "chalk";

// Not a script itself — filenames starting with "_" are skipped by the
// registry (see src/core/registry.ts). Shared plumbing for every report
// under this directory.

export const REPORT_PAGE_BASE = "วิกิพีเดีย:รายงานจากฐานข้อมูล/";
const REPORT_FOOTER = "\n{{ส่วนท้ายรายงานฐานข้อมูล}}";
const DEFAULT_SUMMARY = "อัปเดตรายงาน";

export interface DatabaseReportConfig<Row> {
  /** Stable id for the scheduler/web API. */
  id: string;
  name: string;
  description: string;
  /** Thai phrase describing the schedule, e.g. "สัปดาห์ละครั้ง". */
  frequencyText: string;
  frequency?: string;
  query: string;
  headers: string[];
  preTableTemplates?: string[];
  summary?: string;
  formatRow: (row: Row, index: number, rows: Row[]) => (string | number)[];
}

export function reportPageTitle(name: string) {
  return REPORT_PAGE_BASE + name;
}

function preTableHeader(templates: string[]) {
  return `\n\n${templates.join("\n")}\n{| class="wikitable sortable static-row-numbers static-row-header-text"\n|- style="white-space: nowrap;"`;
}

function createWikiTable<Row>(config: DatabaseReportConfig<Row>, rows: Row[]) {
  let table = `${preTableHeader(config.preTableTemplates ?? [])}\n! ${config.headers.join("\n! ")}\n`;
  for (let i = 0; i < rows.length; i++) {
    table += `|-\n| ${config.formatRow(rows[i], i, rows).join("\n| ")}\n`;
  }
  table += "|}";
  return table;
}

function pageDescription(config: Pick<DatabaseReportConfig<unknown>, "description" | "frequencyText">) {
  return `${config.description} รายงานนี้อัปเดต${config.frequencyText} อัปเดตล่าสุดเมื่อ <onlyinclude>{{subst:#timel:H:i, j F xkY}}</onlyinclude>`;
}

async function savePage(ctx: ScriptContext, title: string, content: string, summary: string) {
  if (!ctx.dryRun) {
    ctx.log.info(`Saving to "${title}"`);
    await ctx.bot.save(title, content, summary);
    ctx.log.info(`Saved to "${title}"`);
    return;
  }
  ctx.log.warn("Dry run — not saving. Pass --no-dry-run to save.");
  console.log(`The following content will be saved to "${chalk.yellowBright(title)}":\n`);
  console.log(content);
}

/**
 * Declare a database report: a script that runs `query` against the replica
 * and saves a wikitable of the results to `วิกิพีเดีย:รายงานจากฐานข้อมูล/<name>`.
 */
export function defineDatabaseReport<Row = Record<string, unknown>>(
  config: DatabaseReportConfig<Row>,
) {
  return defineScript({
    meta: {
      id: config.id,
      name: config.name,
      description: config.description,
      frequency: config.frequency,
    },
    async run(ctx) {
      ctx.log.profile("Querying database");
      const [rows] = await ctx.replica.query(config.query);
      ctx.log.profile("Querying database");
      ctx.log.info(`Found ${rows.length} rows`);

      const table = createWikiTable(config, rows as unknown as Row[]);
      await savePage(
        ctx,
        reportPageTitle(config.name),
        pageDescription(config) + table + REPORT_FOOTER,
        config.summary ?? DEFAULT_SUMMARY,
      );
    },
  });
}

/** Timestamp of a report page's last revision, or null if it has none. */
export async function lastReportUpdate(ctx: ScriptContext, name: string) {
  const page = await ctx.bot.read(reportPageTitle(name));
  const timestamp = page.revisions?.[0]?.timestamp;
  return timestamp ? new ctx.bot.Date(timestamp) : null;
}
