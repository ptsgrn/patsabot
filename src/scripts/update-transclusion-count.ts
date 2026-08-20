import { defineScript } from "@core/define";

// Ports the "thwiki004-update-transclusion-count" PAWS notebook: counts how
// often each template/module is transcluded and writes the counts as Lua
// data tables. มอดูล:Transclusion count reads these to render on-wiki
// reports — this script only maintains the raw data, not the report itself.

type CountRow = { lt_title: string; transclusions: number };

const SECTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "ก", "ข", "ค", "ฆ", "ง", "จ", "ฉ", "ช", "ซ", "ฌ", "ญ", "ฎ", "ฏ",
  "ฐ", "ฑ", "ฒ", "ณ", "ด", "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ",
  "ฝ", "พ", "ฟ", "ภ", "ม", "ย", "ร", "ฤ", "ล", "ฦ", "ว", "ศ", "ษ",
  "ส", "ห", "อ", "ฮ", "เ", "แ", "โ", "ใ", "ไ",
  "other",
] as const;

const DATA_PAGE_BASE = "มอดูล:Transclusion count/data/";
const SUMMARY = "[[WP:BOT|บอต]]: อัปเดตหน้า";
const MIN_TRANSCLUSIONS = 2000;
const SIG_FIGS = 2;

/** Round to `sigFigs` significant figures, e.g. roundToSigFigs(2345, 2) === 2300. */
function roundToSigFigs(n: number, sigFigs: number): number {
  if (n === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(n)));
  const factor = 10 ** (magnitude - sigFigs + 1);
  return Math.round(n / factor) * factor;
}

function luaKey(title: string): string {
  return title.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function bucketFor(title: string): (typeof SECTIONS)[number] {
  const letter = title[0];
  return letter && (SECTIONS as readonly string[]).includes(letter)
    ? (letter as (typeof SECTIONS)[number])
    : "other";
}

function addRow(buckets: Map<string, string[]>, title: string, count: number) {
  // An extra sig fig for very large counts, matching the original notebook.
  const sigFigs = count < 100000 ? SIG_FIGS : SIG_FIGS + 1;
  const rounded = roundToSigFigs(count, sigFigs);
  buckets.get(bucketFor(title))?.push(`  ["${luaKey(title)}"] = ${rounded},`);
}

export default defineScript({
  meta: {
    id: "update-transclusion-count",
    name: "Update Transclusion Count",
    description: "อัปเดตจำนวนการใช้แม่แบบและมอดูลใน มอดูล:Transclusion count/data/*",
    frequency: "@weekly",
  },
  async run(ctx) {
    const [templateRows] = await ctx.replica.query<CountRow[]>(`
      /* update-transclusion-count.ts SLOW_OK */
      SELECT lt_title, COUNT(*) AS transclusions
      FROM templatelinks
      JOIN linktarget ON tl_target_id = lt_id
      WHERE lt_namespace = 10
      GROUP BY lt_title
      HAVING COUNT(*) > ${MIN_TRANSCLUSIONS}
      LIMIT 10000;
    `);

    const [moduleRows] = await ctx.replica.query<CountRow[]>(`
      /* update-transclusion-count.ts SLOW_OK */
      SELECT lt_title, COUNT(*) AS transclusions
      FROM templatelinks
      JOIN linktarget ON tl_target_id = lt_id
      WHERE lt_namespace = 828
      GROUP BY lt_title
      HAVING COUNT(*) > ${MIN_TRANSCLUSIONS}
      LIMIT 10000;
    `);

    ctx.log.info(`Found ${templateRows.length} templates, ${moduleRows.length} modules`);

    const buckets = new Map<string, string[]>(SECTIONS.map((section) => [section, []]));
    for (const row of templateRows) {
      addRow(buckets, row.lt_title, Number(row.transclusions));
    }
    for (const row of moduleRows) {
      addRow(buckets, `มอดูล:${row.lt_title}`, Number(row.transclusions));
    }

    for (const section of SECTIONS) {
      const title = DATA_PAGE_BASE + section;
      const content = `return {\n${buckets.get(section)?.join("\n")}\n}\n`;

      if (ctx.dryRun) {
        ctx.log.info(`[Dry Run] Would save changes to "${title}"`);
        continue;
      }

      await ctx.bot.save(title, content, SUMMARY);
      ctx.log.info(`Saved "${title}"`);
    }
  },
});
