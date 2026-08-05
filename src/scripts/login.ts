import { defineScript } from "@core/define";
import chalk from "chalk";
import moment from "moment";
import { version } from "../../package.json";

type UserInfo = {
  id?: number;
  name: string;
  registrationdate?: string;
  editcount?: number;
  latestcontrib?: string;
  groups: string[];
  groupmembership?: string[];
  messages?: {
    black?: string[];
  };
  unreadcount?: number;
};

type SiteInfo = {
  sitename: string;
  wikiid: string;
  time: string;
  timezone: string;
  timeoffset: number;
};

function label(text: string) {
  return chalk.green(text);
}

function labelValue(text: string, value: string | number) {
  return `  ${label(text)}\t${value}`;
}

function botBadge(groups: string[]) {
  return groups.includes("bot") ? chalk.bgGreen(" BOT ") : chalk.bgRed(" NO ");
}

function formatList(values?: string[]) {
  return values?.length ? values.join(", ") : "-";
}

function formatUnreadMessages(userinfo: UserInfo) {
  const messages = userinfo.messages?.black;
  return messages?.length ? chalk.grey.bgBlueBright(messages.join(", ")) : "-";
}

function formatUtcOffset(timeoffset: number) {
  const sign = timeoffset >= 0 ? "+" : "-";
  return `UTC${sign}${Math.abs(timeoffset) / 60}`;
}

function renderLoginStatus(userinfo: UserInfo) {
  if (!userinfo.id) {
    return [
      `  ${chalk.red("  [Not logged in]                                         ")}${chalk.grey.bgBlueBright("      ")}`,
    ];
  }

  return [
    `  ${label("Logged in as: ")}${userinfo.name}`,
    labelValue(
      "  User regist date: ",
      `${moment(userinfo.registrationdate).fromNow()} (${userinfo.registrationdate})`,
    ),
    labelValue("  User ID: ", userinfo.id),
    labelValue("  Edit count(s): ", userinfo.editcount ?? "-"),
    labelValue("  Latest contrib: ", moment(userinfo.latestcontrib).fromNow()),
  ];
}

function renderUserInfo(userinfo: UserInfo) {
  return [
    ...renderLoginStatus(userinfo),
    `  ${label("Is bot:")} ${botBadge(userinfo.groups)}`,
    `  ${label("User groups:")} ${userinfo.groups.join(", ")}`,
    `  ${label("User groups membership:")} ${formatList(userinfo.groupmembership)}`,
    `  ${label("Unreaded messages:")} ${formatUnreadMessages(userinfo)}`,
    `  ${label("Unseen watchlist count:")} ${userinfo.unreadcount ?? "-"}`,
  ];
}

function renderSiteInfo(siteinfo: SiteInfo, apiUrl: string) {
  return [
    labelValue("Site name:", siteinfo.sitename),
    labelValue("Wiki ID:", siteinfo.wikiid),
    labelValue("Site Api Url:", apiUrl),
    labelValue("Server Time:", siteinfo.time),
    labelValue("Time zone:", `${siteinfo.timezone} (${formatUtcOffset(siteinfo.timeoffset)})`),
  ];
}

function renderLoginReport(userinfo: UserInfo, siteinfo: SiteInfo, apiUrl: string) {
  return [
    "",
    `  ${chalk.white.underline.bold(`Patsabot v${version}`)}`,
    `  ${chalk.white.underline("USER INFO")}`,
    ...renderUserInfo(userinfo),
    "",
    `  ${chalk.white.underline("SITE INFO")}`,
    ...renderSiteInfo(siteinfo, apiUrl),
    "",
  ].join("\n");
}

export default defineScript({
  meta: {
    description: "Get site and user info",
  },

  async run(ctx) {
    const siteAndUserInfo = await ctx.bot.request({
      action: "query",
      format: "json",
      meta: "siteinfo|userinfo",
      siprop: "general",
      uiprop: "*",
    });
    if (!siteAndUserInfo) {
      ctx.log.error("Failed to get site and user info");
      return;
    }
    const userinfo = siteAndUserInfo.query?.userinfo as UserInfo | undefined;
    const siteinfo = siteAndUserInfo.query?.general as SiteInfo | undefined;

    if (!userinfo || !siteinfo) {
      ctx.log.error("Failed to get site and user info");
      return;
    }

    console.info(renderLoginReport(userinfo, siteinfo, ctx.bot.defaultOptions.apiUrl ?? "-"));
  },
});
