import { defineScript, type ScriptContext } from "@core/define";

interface UserEdit {
  user_name: string;
  user_editcount: number;
  user_group: string[];
  is_active: boolean;
  is_anonymous: boolean;
}

interface TopEditRow {
  user_name: string;
  user_editcount: number;
  user_groups: string | null;
}

type Opts = {
  dryRun?: boolean;
  maxQuerySize: string;
  listTop: string;
  targetPageNoBot: string;
  targetPageWithBot: string;
  anonymousList: string;
  anonymousListUserRegex: string;
  groupTextSysop: string;
  groupTextBot: string;
  summary: string;
};

type Ctx = ScriptContext<Opts>;

async function getTopEdits(ctx: Ctx) {
  ctx.log.info("Getting top edits with groups");
  ctx.log.profile("getTopEdits");
  const results = await ctx.replica.query<TopEditRow[]>(`
    /* topedits.ts SLOW_OK */
    SELECT
      user_name,
      user_editcount,
      GROUP_CONCAT(ug_group) AS user_groups
    FROM user
    LEFT JOIN user_groups ON user_id = ug_user
    WHERE user_editcount > 0
    GROUP BY user_id, user_name, user_editcount
    ORDER BY user_editcount DESC
    LIMIT ${ctx.opts.maxQuerySize};
  `);
  ctx.log.profile("getTopEdits");
  if (!results) {
    throw new Error("Query returned no results");
  }
  return results[0].map((row) => ({
    user_name: row.user_name,
    user_editcount: row.user_editcount,
    user_group: row.user_groups ? row.user_groups.split(",") : [],
  }));
}

async function getUserAnonymousList(ctx: Ctx) {
  ctx.log.info("Getting anonymous user list");
  ctx.log.profile("getUserAnonymousList");
  const page = await ctx.bot.read(ctx.opts.anonymousList);
  ctx.log.profile("getUserAnonymousList");
  if (!page.revisions) {
    throw new Error("Failed to get page content");
  }
  const users = page.revisions?.[0].content?.matchAll(
    new RegExp(ctx.opts.anonymousListUserRegex, "g"),
  );
  return Array.from(users || []).map((m) => m[1]);
}

async function getActiveUsers(ctx: Ctx) {
  let activeusers: string[] = [];
  ctx.log.info("Getting active users");
  ctx.log.profile("getActiveUsers");
  for await (const json of ctx.bot.continuedQueryGen({
    action: "query",
    list: "allusers",
    auactiveusers: 1,
    aulimit: "max",
  })) {
    const users = json.query?.allusers.map((user: { name: string }) => user.name) as string[];
    activeusers = activeusers.concat(users);
  }
  ctx.log.profile("getActiveUsers");
  return activeusers;
}

function userGroupText(ctx: Ctx, groups: string[]) {
  const userGroup = groups
    .map((group) => {
      if (group === "sysop") return ctx.opts.groupTextSysop;
      if (group === "bot") return ctx.opts.groupTextBot;
      return null;
    })
    .filter((v) => v);
  if (userGroup.length === 0) return "";
  return ` (${userGroup.join(", ")})`;
}

function createTable(ctx: Ctx, userList: UserEdit[], limit: number = 500) {
  let content = '<section begin="list500" />';
  let count = 1;
  for (const { user_name, is_active, is_anonymous, user_editcount, user_group } of userList) {
    if (is_anonymous) {
      content +=
        `\n|-\n| ${count} ` +
        `|| [นิรนาม] ` +
        `|| {{sort|${user_editcount.toString()}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}}}`;
    } else {
      content +=
        `\n|-\n| ${count} ` +
        `|| [[ผู้ใช้:${user_name}|${!is_active ? `<span style="color: gray;">${user_name}</span>` : user_name}]]${userGroupText(ctx, user_group)} ` +
        `|| {{sort|${user_editcount.toString()}|[[พิเศษ:เรื่องที่เขียน/${user_name}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}]]}}`;
    }
    if (count >= limit) break;
    count += 1;
  }
  return `${content}\n<section end="list500" />`;
}

function processListPageContent(text: string, table: string) {
  const pretext = text.split('<section begin="list500" />')[0];
  const posttext = text.split('<section end="list500" />')[1];
  text = pretext + table + posttext;
  text =
    text.split('<section begin="lastupdate" />')[0] +
    '<section begin="lastupdate" />{{subst:#timel:r}}<section end="lastupdate" />' +
    text.split('<section end="lastupdate" />')[1];
  return text;
}

async function saveToWiki(ctx: Ctx, userList: UserEdit[]) {
  const noBotContent = createTable(
    ctx,
    userList
      .filter((user) => !user.user_group.includes("bot"))
      .filter((v) => v.user_name !== "New user message"),
    +ctx.opts.listTop,
  );
  const withBotContent = createTable(ctx, userList, +ctx.opts.listTop);

  if (ctx.dryRun) {
    ctx.log.warn("Dry run enabled, skipping edit");
    const noBotRead = (await ctx.bot.read(ctx.opts.targetPageNoBot)).revisions?.[0].content;
    if (!noBotRead) throw new Error("Failed to get page content");
    console.table({ noBotContent: processListPageContent(noBotRead, noBotContent) });
    const withBotRead = (await ctx.bot.read(ctx.opts.targetPageWithBot)).revisions?.[0].content;
    if (!withBotRead) throw new Error("Failed to get page content");
    console.table({ withBotContent: processListPageContent(withBotRead, withBotContent) });
    return;
  }
  return Promise.all([
    ctx.bot.edit(ctx.opts.targetPageNoBot, (rev) => ({
      text: processListPageContent(rev.content, noBotContent),
      summary: ctx.opts.summary,
    })),
    ctx.bot.edit(ctx.opts.targetPageWithBot, (rev) => ({
      text: processListPageContent(rev.content, withBotContent),
      summary: ctx.opts.summary,
    })),
  ]);
}

export default defineScript({
  meta: {
    id: "topedits",
    name: "TopEdits",
    description:
      "อัปเดตตาราง[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ]] และ[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)]]",
    frequency: "@weekly",
  },

  options: (c) =>
    c
      .option("--max-query-size <number>", "Maximum number of users to query from database", "2000")
      .option("--list-top <number>", "Number of top users to list on the page", "500")
      .option(
        "--target-page-no-bot <pagename>",
        "Target page for top edits without bots",
        "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ/รายการ",
      )
      .option(
        "--target-page-with-bot <pagename>",
        "Target page for top edits with bots",
        "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)/รายการ",
      )
      .option(
        "--anonymous-list <pagename>",
        "Page containing the list of anonymous users",
        "วิกิพีเดีย:รายชื่อชาววิกิพีเดียตามจำนวนการแก้ไข/นิรนาม",
      )
      .option(
        "--anonymous-list-user-regex <regex>",
        "Regex to extract anonymous user names from the anonymous list page",
        "ผู้ใช้:(.+)\\]\\]",
      )
      .option("--group-text-sysop <text>", "Text to display for sysop user group", "Admin")
      .option("--group-text-bot <text>", "Text to display for bot user group", "Bot")
      .option("--summary <text>", "Edit summary to use when saving", "ปรับปรุงรายการ"),

  async run(ctx) {
    const [topEdits, anonymousUsers, activeUsers] = await Promise.all([
      getTopEdits(ctx),
      getUserAnonymousList(ctx),
      getActiveUsers(ctx),
    ]);

    const userList: UserEdit[] = [];
    let noBotCount = 0;
    ctx.log.info("Processing top edits");
    ctx.log.profile("processTopEdits");
    for (const { user_name, user_editcount, user_group } of topEdits) {
      if (noBotCount >= +ctx.opts.listTop) break;
      userList.push({
        user_name,
        user_editcount,
        user_group,
        is_active: activeUsers.includes(user_name),
        is_anonymous: anonymousUsers.includes(user_name),
      });
      if (!user_group.includes("bot")) noBotCount++;
    }
    ctx.log.profile("processTopEdits");
    ctx.log.info("Saving to wiki");
    await saveToWiki(ctx, userList);
  },
});
