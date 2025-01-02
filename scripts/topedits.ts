import { Command, Option } from '@commander-js/extra-typings';
import { Bot } from '../core/bot';

interface UserEdit {
  user_name: string
  user_editcount: number
  user_group: string[]
  is_active: boolean
  is_anonymous: boolean
}

export default class TopEdits extends Bot {
  info = {
    id: "topedits",
    name: "TopEdits",
    description: "อัปเดตตาราง[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ]] และ[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)]]",
  }

  cli = new Command()
    .addOption(new Option('--no-dry-run', 'Save change to wiki').default(true))

  options = {
    // Maximum number of user to get edit count
    maxQuerySize: 2000,
    listTop: 500,
    targetPage: {
      noBot: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ/รายการ",
      withBot: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)/รายการ",
    },
    anonymousList: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียตามจำนวนการแก้ไข/นิรนาม",
    anonymousListUserRegex: /ผู้ใช้:(.+)\]\]/g,
    groupText: {
      "sysop": "Admin",
      "bot": "Bot",
    } as Record<string, string>,
    summary: 'ปรับปรุงรายการ',
  }

  constructor() {
    super()
  }

  async getTopEdits() {
    console.debug('Getting top edits')
    console.time('getTopEdits')
    let start = Date.now()
    const results = await this.replica.query(`
      /* topedits.ts SLOW_OK */
      SELECT
        user_name,
        user_editcount
      FROM user
      WHERE user_editcount > 0
      ORDER BY user_editcount DESC
      LIMIT ${this.options.maxQuerySize};
    `)
    console.timeEnd('getTopEdits')
    if (!results) {
      throw new Error('Query returned no results');
    }
    // @ts-ignore
    return results[0].map((row: any) => ({
      user_name: row.user_name.toString(),
      user_editcount: row.user_editcount
    })) as { user_name: string, user_editcount: number }[]
  }

  async getBotUserList() {
    console.debug('Getting bot user list')
    console.time('getBotUserList')
    const results = await this.replica.query(`
      /* editcount.rs SLOW_OK */
      SELECT
        user_name
      FROM user
      JOIN user_groups
      ON user_id = ug_user
      WHERE ug_group = 'bot';
    `)
    console.timeEnd('getBotUserList')
    if (!results) {
      throw new Error('Query returned no results');
    }
    // @ts-ignore
    return results[0].map((row: any) => row.user_name.toString())
  }

  async getUserAnonymousList() {
    console.debug('Getting anonymous user list')
    console.time('getUserAnonymousList')
    const page = await this.bot.read(this.options.anonymousList)
    console.timeEnd('getUserAnonymousList')
    if (!page.revisions) {
      throw new Error('Failed to get page content')
    }
    const users = page.revisions?.[0].content?.matchAll(this.options.anonymousListUserRegex)
    return Array.from(users || []).map((m) => m[1])
  }

  async getUserGroup(user: string) {
    console.time('getUserGroup ' + user)
    const results = await this.replica.query(`
      /* topedits.rs SLOW_OK */
      SELECT
        ug_group
      FROM user_groups
      JOIN user
      ON user_id = ug_user
      WHERE user_name = ?;
    `, [user])
    console.timeEnd('getUserGroup ' + user)
    if (!results) {
      throw new Error('Query returned no results');
    }
    // @ts-ignore
    return results[0].map((row: any) => row.ug_group.toString())
  }

  async getActiveUsers() {
    let activeusers: string[] = [];
    console.debug('Getting active users')
    console.time('getActiveUsers')
    for await (let json of this.bot.continuedQueryGen({
      action: "query",
      list: "allusers",
      auactiveusers: 1,
      aulimit: "max",
    })) {
      let users = json.query?.allusers.map((user: { name: string }) => user.name) as string[];
      activeusers = activeusers.concat(users);
    }
    console.timeEnd('getActiveUsers')
    return activeusers
  }

  userGroupText(groups: string[]) {
    const userGroup = groups.map((group) => this.options.groupText[group]).filter(v => v)
    if (userGroup.length === 0) {
      return ''
    }
    return ` (${userGroup.join(', ')})`
  }

  createTable(userList: UserEdit[], limit: number = 500) {
    let content = '<section begin="list500" />';
    let count = 1;
    for (const { user_name, is_active, is_anonymous, user_editcount, user_group } of userList) {
      if (is_anonymous) {
        content += `\n|-\n| ${count} `
          + `|| [นิรนาม] `
          + `|| {{sort|${user_editcount.toString()}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}}}`;
      } else {
        content += `\n|-\n| ${count} `
          + `|| [[ผู้ใช้:${user_name}|${!is_active ? '<span style="color: gray;">' + user_name + '</span>' : user_name}]]${this.userGroupText(user_group)} `
          + `|| {{sort|${user_editcount.toString()}|[[พิเศษ:เรื่องที่เขียน/${user_name}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}]]}}`;
      }
      if (count >= limit) {
        break;
      }
      count += 1;
    }
    return content + '\n<section end="list500" />';
  }

  processListPageContent(text: string, table: string) {
    let pretext = text.split('<section begin="list500" />')[0];
    let posttext = text.split('<section end="list500" />')[1];
    text = pretext + table + posttext;
    text =
      text.split('<section begin="lastupdate" />')[0] +
      '<section begin="lastupdate" />{{subst:#timel:r}}<section end="lastupdate" />' +
      text.split('<section end="lastupdate" />')[1];
    return text;
  }

  async saveToWiki(userList: UserEdit[]) {
    const noBotContent = this.createTable(userList
      .filter((user) => !user.user_group.includes('bot'))
      .filter((v) => v.user_name !== "New user message"), this.options.listTop)
    const withBotContent = this.createTable(userList, this.options.listTop)

    if (this.cli.opts().dryRun) {
      console.log('Dry run enabled, skipping edit')
      console.log('No bot content:')
      const noBotRead = (await this.bot.read(this.options.targetPage.noBot)).revisions?.[0].content
      if (!noBotRead) {
        throw new Error('Failed to get page content')
      }
      console.table({
        noBotContent: this.processListPageContent(noBotRead, noBotContent),
      })
      console.log('With bot content:')
      const withBotRead = (await this.bot.read(this.options.targetPage.withBot)).revisions?.[0].content
      if (!withBotRead) {
        throw new Error('Failed to get page content')
      }
      console.table({
        withBotContent: this.processListPageContent(withBotRead, withBotContent),
      })
      return
    }
    return Promise.all([
      this.bot.edit(this.options.targetPage.noBot, (rev) => {
        return {
          text: this.processListPageContent(rev.content, noBotContent),
          summary: this.options.summary,
        };
      }),
      this.bot.edit(this.options.targetPage.withBot, (rev) => {
        return {
          text: this.processListPageContent(rev.content, withBotContent),
          summary: this.options.summary,
        };
      }),
    ])
  }

  async run(): Promise<void> {
    await this.replica.init()
    const topEdits = await this.getTopEdits()
    const users = await this.getUserAnonymousList()
    const activeUser = await this.getActiveUsers()

    let userList: UserEdit[] = []
    let noBotCount = 0
    console.log('Processing top edits')
    console.time('processTopEdits')
    for (let user of topEdits) {
      const userGroup = await this.getUserGroup(user.user_name)
      userList.push({
        user_name: user.user_name,
        user_editcount: user.user_editcount,
        user_group: userGroup,
        is_active: activeUser.includes(user.user_name),
        is_anonymous: users.includes(user.user_name),
      })
      if (noBotCount >= this.options.listTop) {
        break
      }
      if (!userGroup.includes('bot')) {
        noBotCount++
      }
    }
    console.timeEnd('processTopEdits')
    console.log('Saving to wiki')
    await this.saveToWiki(userList)
    await this.replica.end()
  }
}
