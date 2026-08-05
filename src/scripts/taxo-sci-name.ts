import { defineScript, type ScriptContext } from "@core/define";
import { isThaiCharacter } from "@core/helper";
import type { ApiPage, EditTransform } from "mwn";

const SUMMARY = "บอต: เพิ่มชื่อวิทยาศาสตร์ ([[ผู้ใช้:PatsaBot/task/7|task #7]])";

const RANKS: Record<string, string> = {
  subordo: "อันดับย่อย",
  infraordo: "อันดับฐาน",
  ordo: "อันดับ",
  subfamilia: "วงศ์ย่อย",
  familia: "วงศ์",
  genus: "สกุล",
  species: "ชนิด",
  subtribus: "เผ่าย่อย",
  tribus: "เผ่า",
  classis: "ชั้น",
};

const REGEXS = {
  MATCH_RANK: /^\| *rank *= *(.+)$/m,
  MATCH_RANK_S: /(.*)(\| *rank *= *.*)/ms,
  MATCH_LINK: /^\| *link *= *(.+)$/m,
  MATCH_LINK_S: /(.*)(\| *link *= *.*)/ms,
  MATCH_LINK_LINE: /(\| *link *= *.+)/,
  EXTRACT_SCIENTIFIC_NAME: /:.*\/(\w+)\/?.*$/,
  REMOVE_BRACKET_TEXT: /(.+) \(.+\)$/m,
};

function extractScientificName(title: string) {
  const match = title.match(REGEXS.EXTRACT_SCIENTIFIC_NAME);
  return match ? match[1] : title;
}

function getRankFromText(content: string) {
  const matchedContent = content.match(REGEXS.MATCH_RANK);
  return matchedContent ? matchedContent[1].trim() : null;
}

function cleanDisplayText(display: string) {
  return Object.entries(RANKS)
    .reduce((acc, [, prefix]) => acc.replace(new RegExp(`^${prefix}`, "i"), "").trim(), display)
    .replace(REGEXS.REMOVE_BRACKET_TEXT, "$1")
    .trim();
}

function setDisplayText(
  ctx: ScriptContext<any>,
  content: string,
  displayText: string,
  linkTarget: string,
) {
  const linkLine = content.match(REGEXS.MATCH_LINK_LINE);
  if (!linkLine) {
    ctx.log.warn("No link line found in content. Returning original content.");
    return content;
  }
  const [beforeLink, afterLink] = content.split(linkLine[0]);
  return (
    beforeLink +
    (linkTarget ? `|link=${linkTarget}` : linkLine[1].trim()) +
    (displayText !== linkTarget ? `|${displayText}` : "") +
    afterLink
  );
}

async function suggestDisplayName(ctx: ScriptContext<any>, content: string, rank: string) {
  const matchedContent = content.match(REGEXS.MATCH_LINK);
  if (!matchedContent) return;
  const [linkTarget, linkDisplay] = matchedContent[1].split("|").map((part) => part.trim());
  if (linkDisplay && isThaiCharacter(linkDisplay[0])) {
    return { linkDisplay, linkTarget };
  }
  try {
    const linkTargetPage = new ctx.bot.Page(linkTarget);
    if (await linkTargetPage.isRedirect()) {
      const redirectTarget = await linkTargetPage.getRedirectTarget();
      if (!redirectTarget.startsWith(RANKS[rank])) {
        ctx.log.warn(
          `Redirect target "${redirectTarget}" does not start with rank prefix "${RANKS[rank]}".`,
        );
      }
      const cleanedDisplayText = cleanDisplayText(redirectTarget);
      return { linkDisplay: cleanedDisplayText, linkTarget: redirectTarget };
    }

    const redirectTarget = await linkTargetPage.getRedirectTarget();
    if (!redirectTarget.startsWith(RANKS[rank])) {
      ctx.log.warn(
        `Redirect target "${redirectTarget}" does not start with rank prefix "${RANKS[rank]}".`,
      );
    }
    const cleanedDisplayText = cleanDisplayText(redirectTarget);
    if (!isThaiCharacter(cleanedDisplayText[0])) {
      return;
    }
    return { linkDisplay: cleanedDisplayText, linkTarget: redirectTarget };
  } catch (error) {
    ctx.log.error(`Failed to get redirect target for "${linkTarget}":`, error);
    return null;
  }
}

async function processPageContent(ctx: ScriptContext<any>, content: string, scientificName: string) {
  const contentMatch = content.match(REGEXS.MATCH_RANK_S);
  if (!contentMatch) {
    return { ok: false as const, error: "Content match failed" };
  }

  let newContent = contentMatch[1] + `|scientific_name=${scientificName}\n` + contentMatch[2];
  const rank = getRankFromText(newContent) || "";

  const suggested = await suggestDisplayName(ctx, newContent, rank);
  if (suggested) {
    newContent = setDisplayText(ctx, newContent, suggested.linkDisplay, suggested.linkTarget);
  }

  return { ok: true as const, content: newContent };
}

async function processPage(
  ctx: ScriptContext<{ auto?: boolean; delay?: number }>,
  page: ApiPage,
) {
  const scientificName = extractScientificName(page.title);

  // Returning undefined leaves the content unchanged (mwn treats it as an
  // abort); its type only declares string/ApiEditPageParams, hence the cast.
  await ctx.bot.edit(page.title, (async ({ content }) => {
    const { ok, error, content: processedContent } = await processPageContent(
      ctx,
      content,
      scientificName,
    );

    if (!ok) {
      ctx.log.warn(`Skipping ${page.title}: ${error}`);
      return;
    }

    ctx.log.info(
      `Processing ${ctx.output.color.bgBlueBright(page.title)} with scientific name "${ctx.output.color.bgBlueBright(scientificName)}"`,
    );
    ctx.output.printDiff(content, processedContent);

    if (ctx.opts.auto) {
      ctx.log.info(`Auto-confirming changes for ${page.title} in ${ctx.opts.delay} milliseconds`);
      await new Promise((resolve) => setTimeout(resolve, ctx.opts.delay));
      ctx.log.info(`Saving changes to ${page.title}`);
      return { text: processedContent, summary: SUMMARY, bot: true };
    }

    const result = await ctx.input.prompt(`Save the changes to "${page.title}"?`, [
      { name: "Yes", value: "yes", alias: ["y"] },
      { name: "No", value: "no", alias: ["n"] },
    ]);

    if (result === "no") {
      ctx.log.warn(`Skipping ${page.title}`);
      return content;
    }

    ctx.log.info(`Saving changes to ${page.title}`);
    return { text: processedContent, summary: SUMMARY, bot: true };
  }) as EditTransform);
}

export default defineScript({
  meta: {
    id: "taxo-sci-name",
    name: "Taxonomy: Add Scientific Name",
    description: "Adds a scientific name to a taxonomy entry",
    frequency: "0 1 * * *", // Run every day at 1:00 AM
  },

  options: (c) =>
    c
      .option("-a, --auto", "Automatically yes (with some delay)", true)
      .option("-d, --delay <ms>", "Delay before auto-confirming changes", (v) => +v || 1000),

  async run(ctx) {
    const linkedCategoryWithoutScienctificName = new ctx.bot.Category(
      "แม่แบบอนุกรมมีหน้าที่ลิงก์แต่ไม่ระบุ scientific name",
    );

    for await (const page of linkedCategoryWithoutScienctificName.membersGen({
      cmnamespace: 10,
    })) {
      ctx.log.info(
        `>>> ${`https://th.wikipedia.org/wiki/${page.title.replaceAll(" ", "_")}`} <<<`,
      );
      await processPage(ctx, page);
    }
  },
});
