import chalk from 'chalk';
import { Bot } from '../core/bot'
import { version } from '../package.json'
import moment from 'moment';

export default class Login extends Bot {
  info = {
    id: "login",
    name: "Login",
    description: "Get site and user info"
  }

  constructor() {
    super()
  }

  async run() {
    const siteAndUserInfo = await this.bot
      .request({
        action: "query",
        format: "json",
        meta: "siteinfo|userinfo",
        siprop: "general",
        uiprop: "*",
      })
    if (!siteAndUserInfo) {
      console.error('Failed to get site and user info')
      return
    }
    let userinfo = siteAndUserInfo.query?.userinfo;
    let siteinfo = siteAndUserInfo.query?.general;
    console.info(`
  ${chalk.white.underline.bold(
      `Patsabot v${version}`
    )}
  ${chalk.white.underline(
      "USER INFO"
    )}
  ${userinfo.id
        ? chalk.green("Logged in as: ") +
        userinfo.name +
        "\n" +
        chalk.green("  User regist date: ") +
        moment(userinfo.registrationdate).fromNow() +
        " (" +
        userinfo.registrationdate +
        ")\n" +
        chalk.green("  User ID: ") +
        userinfo.id +
        "\n" +
        chalk.green("  Edit count(s): ") +
        userinfo.editcount +
        "\n" +
        chalk.green("  Latest contrib: ") +
        moment(userinfo.latestcontrib).fromNow() +
        "\n"
        : chalk.red(
          "  [Not logged in]                                         "
        ) +
        chalk.grey.bgBlueBright("      ") +
        "\n"
      }  ${chalk.green("Is bot:")} ${userinfo.groups.includes("bot")
        ? chalk.bgGreen(" BOT ")
        : chalk.bgRed(" NO ")
      }
  ${chalk.green("User groups:")} ${userinfo.groups.join(", ")}
  ${chalk.green("User groups membership:")} ${userinfo.groupmembership ? userinfo.groupmembership.join(", ") : "-"
      }
  ${chalk.green("Unreaded messages:")} ${userinfo.messages
        ? chalk.grey.bgBlueBright(userinfo.messages.black.join(", "))
        : "-"
      }
  ${chalk.green("Unseen watchlist count:")} ${userinfo.unreadcount ? userinfo.unreadcount : "-"
      }

  ${chalk.white.underline("SITE INFO")}
  ${chalk.green("Site name:")}\t${siteinfo.sitename}
  ${chalk.green("Wiki ID:")}\t${siteinfo.wikiid}
  ${chalk.green("Site Api Url:")}\t${this.bot.defaultOptions.apiUrl}
  ${chalk.green("Server Time:")}\t${siteinfo.time}
  ${chalk.green("Time zone:")}\t${siteinfo.timezone} (UTC${(siteinfo.timeoffset >= 0 ? "+" : "-") + siteinfo.timeoffset / 60
      })
`);
  }
}