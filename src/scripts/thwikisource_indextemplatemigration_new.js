/**
 * This scritp is written for Thai Wikisource with a request from Bebiezaza[1] to
 * cleanup the Index: pages as It reach its consensus and has been announced
 * per [2].
 * [1]: https://th.wikisource.org/wiki/User:Bebiezaza
 * [2]: https://th.wikisource.org/w/index.php?title=วิกิซอร์ซ:ข่าวสาร&oldid=172181#การปรับการใส่ค่าข้อมูลในหน้าเนมสเปซดัชนี
 * @author Patsagorn Y. (https://w.wiki/JSB)
 * @license MIT
 * @date 2022-02-27
 */

import {
  mwn
} from 'mwn'
import {
  version,
  mwnVersion
} from '../patsabot/version.js'
import {
  user
} from '../patsabot/config.js'
import {
  parse
} from '../patsabot/utils.js'
import {
  diffLines
} from 'diff'
import chalk from 'chalk'

class IndexTemplateMigration {
  constructor() {
    /** @type {import('mwn/src/bot').mwn} */
    this.bot = new mwn()
    this.log = mwn.log
    this.config = {
      siteApiUrl: 'https://th.wikisource.org/w/api.php',
      categoryToWorkOn: 'ดัชนีที่ใช้ช่องเล่ม',
      templateToFind: 'MediaWiki:Proofreadpage index template',
      printDiff: true,
    }
  }
  /**
   * Logging in to wiki and fetch the site datas
   * @returns {Promise<void>}
   */
  async login() {
    this.bot.setApiUrl(this.config.siteApiUrl)
    this.bot.setOptions({
      username: user.username,
      password: user.password,
      OAuthCredentials: {
        ...user.OAuthCredentials,
      },
      // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
      userAgent: `PatsaBot/${version} ([[m:User:Patsagorn Y.]]) mwn/${mwnVersion}`,
      defaultParams: {
        assert: 'user', // ensure we're logged in
      },
    })
    this.log('[i] logging in...')
    return Promise.all([
      this.bot.initOAuth(),
      await this.bot.getTokensAndSiteInfo(),
      await this.bot.getSiteInfo(),
    ]).then(async () => {
      this.log(
        `[+] logged in as ${
          (await this.bot.userinfo().catch(console.error)).name
        }`
      )
    })
  }

  /**
   * Get category members in a category
   * @param {string} categoryname category name to get
   * @returns {string[]} array of category members
   */
  async getPagesInCategory(categoryname) {
    this.log(`[i] fetching pages in category ${categoryname}`)
    this.pagesInCategory = await this.bot
      .getPagesInCategory(categoryname)
      .catch(console.error)
    this.log(
      `[i] found ${this.pagesInCategory.length} pages in category ${categoryname}`
    )
  }
  async processingPages(pagename) {
    this.log(`[i] processing page ${pagename}`)
    const revisions = (await this.bot.read(pagename).catch(console.error))
      .revisions
    const content = revisions[0].content
    const parsed = parse(content)
    return this.processingPageContent(parsed, pagename)
  }
  /**
   * Porcessing on each page too but focus on content of each
   * page. This function will be called by processingPages()
   * Basically, It will parse the content of each page and
   * find template and use next function to process the content
   * of template;
   * @param {parse} parsed Parsed content
   * @param {string} pagename Pagename that being process
   */
  async processingPageContent(parsed, pagename) {
    this.log(`[i] processing page content ${pagename}`)
    let templateToken = null
    await parsed.each('transclusion', (entry) => {
      if (entry.name === this.config.templateToFind) {
        this.log(`[i] found template ${entry.name}`)
        templateToken = entry
      }
    })
    let processed = this.processingTemplate(templateToken, pagename)
    this.config.printDiff && this.printDiff(templateToken.toString(), processed.toString())
    return processed
  }
  /**
   * Compare the text in line mode (difference between same line)
   * @param {string} beforeText Old text to compare
   * @param {string} afterText New text to compare
   * @returns {boolean} true if there is a difference and false if not
   */
  printDiff(beforeText, afterText) {
    if (beforeText === afterText) return false
    let diff = diffLines(beforeText, afterText)
    let diffText = ''
    diff.forEach((part) => {
      let color = part.added ? chalk.green : part.removed ? chalk.red : chalk.gray
      diffText += color(part.value)
    })
    console.log(diffText)
    return true
  }

  // Next variouse functions are for processing template
  // parameters and its value

  /**
   * run each function and return value from all function
   * @date 2022-03-26
   * @param {parse} templateToken
   * @param {string} pagename
   * @param {[()=>parse]} [...fns]
   * @returns {any}
   */
  runEach(templateToken, pagename, [...fns]) {
    let ret = templateToken
    for (let func of fns) {
      this.log(`[i] on '${pagename}' do task '${func.name}'`)
      ret = func(ret, pagename)
    }
    return ret
  }
  processingTemplate(templateToken, pagename) {
    /**
     * @type {Function[]}
     */
    const functionsList = [
      this.checkIfIsRkjAndChangeType,
    ]
    return this.runEach(templateToken, pagename, functionsList)
  }
  /**
   * ตรวจสอบว่าถ้าเป็นงานจากราชกิจจานุเบกษา ให้เปลี่ยนประเภทเป็นวารสาร
   * @param {parse} templateToken
   * @returns {parse} templateToken
   */
  checkIfIsRkjAndChangeType(templateToken) {
    templateToken[0] = 'hi-mum'
    console.log(templateToken)
    return templateToken
  }

  // Start running the script
  async run() {
    await this.login()
    await this.getPagesInCategory(this.config.categoryToWorkOn)
    for (const page of this.pagesInCategory) {
      await this.processingPages(page)
    }
  }
}

// new IndexTemplateMigration().run()
new IndexTemplateMigration().printDiff(`hello
its me
`, `hello
its me`)
process.on('unhandledRejection', console.error)
process.on('uncaughtException', console.error)
