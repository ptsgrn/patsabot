import { Bot } from "@core/bot";
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

export default class Login extends Bot {
  info: Bot["info"] = {
    id: "login",
    name: "Login",
    description: "Get site and user info",
  };

  async run() {
    const siteAndUserInfo = await this.bot.request({
      action: "query",
      format: "json",
      meta: "siteinfo|userinfo",
      siprop: "general",
      uiprop: "*",
    });
    if (!siteAndUserInfo) {
      console.error("Failed to get site and user info");
      return;
    }
    const userinfo = siteAndUserInfo.query?.userinfo as UserInfo | undefined;
    const siteinfo = siteAndUserInfo.query?.general as SiteInfo | undefined;

    if (!userinfo || !siteinfo) {
      console.error("Failed to get site and user info");
      return;
    }

    console.info(this.renderLoginReport(userinfo, siteinfo));
  }

  private renderLoginReport(userinfo: UserInfo, siteinfo: SiteInfo) {
    return [
      "",
      `  ${chalk.white.underline.bold(`Patsabot v${version}`)}`,
      `  ${chalk.white.underline("USER INFO")}`,
      ...this.renderUserInfo(userinfo),
      "",
      `  ${chalk.white.underline("SITE INFO")}`,
      ...this.renderSiteInfo(siteinfo),
      "",
    ].join("\n");
  }

  private renderUserInfo(userinfo: UserInfo) {
    return [
      ...this.renderLoginStatus(userinfo),
      `  ${this.label("Is bot:")} ${this.botBadge(userinfo.groups)}`,
      `  ${this.label("User groups:")} ${userinfo.groups.join(", ")}`,
      `  ${this.label("User groups membership:")} ${this.formatList(userinfo.groupmembership)}`,
      `  ${this.label("Unreaded messages:")} ${this.formatUnreadMessages(userinfo)}`,
      `  ${this.label("Unseen watchlist count:")} ${userinfo.unreadcount ?? "-"}`,
    ];
  }

  private renderLoginStatus(userinfo: UserInfo) {
    if (!userinfo.id) {
      return [
        `  ${chalk.red("  [Not logged in]                                         ")}${chalk.grey.bgBlueBright("      ")}`,
      ];
    }

    return [
      `  ${this.label("Logged in as: ")}${userinfo.name}`,
      this.labelValue(
        "  User regist date: ",
        `${moment(userinfo.registrationdate).fromNow()} (${userinfo.registrationdate})`,
      ),
      this.labelValue("  User ID: ", userinfo.id),
      this.labelValue("  Edit count(s): ", userinfo.editcount ?? "-"),
      this.labelValue(
        "  Latest contrib: ",
        moment(userinfo.latestcontrib).fromNow(),
      ),
    ];
  }

  private renderSiteInfo(siteinfo: SiteInfo) {
    return [
      this.labelValue("Site name:", siteinfo.sitename),
      this.labelValue("Wiki ID:", siteinfo.wikiid),
      this.labelValue("Site Api Url:", this.bot.defaultOptions.apiUrl ?? "-"),
      this.labelValue("Server Time:", siteinfo.time),
      this.labelValue(
        "Time zone:",
        `${siteinfo.timezone} (${this.formatUtcOffset(siteinfo.timeoffset)})`,
      ),
    ];
  }

  private label(text: string) {
    return chalk.green(text);
  }

  private labelValue(label: string, value: string | number) {
    return `  ${this.label(label)}\t${value}`;
  }

  private botBadge(groups: string[]) {
    return groups.includes("bot")
      ? chalk.bgGreen(" BOT ")
      : chalk.bgRed(" NO ");
  }

  private formatList(values?: string[]) {
    return values?.length ? values.join(", ") : "-";
  }

  private formatUnreadMessages(userinfo: UserInfo) {
    const messages = userinfo.messages?.black;
    return messages?.length
      ? chalk.grey.bgBlueBright(messages.join(", "))
      : "-";
  }

  private formatUtcOffset(timeoffset: number) {
    const sign = timeoffset >= 0 ? "+" : "-";
    return `UTC${sign}${Math.abs(timeoffset) / 60}`;
  }
}
