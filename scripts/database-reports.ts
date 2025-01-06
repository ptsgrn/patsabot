import { Command, Option } from '@commander-js/extra-typings';
import { Bot } from '@core/bot';
import chalk from 'chalk';

export class DatabaseReportBot extends Bot {
  reportPageBase: string = "วิกิพีเดีย:รายงานจากฐานข้อมูล/"
  reportPage: string = ""
  reportDescription: string = ""
  reportFrequency: string = '@weekly'
  reportFrequencyText: string = 'สัปดาห์ละครั้ง'
  reportFooter: string = "\n{{ส่วนท้ายรายงานฐานข้อมูล}}"
  summary: string = "อัปเดตรายงาน"

  query: string = ""
  headers: string[] = ['ที่']
  preTableHeader: string = `\n\n{| class="wikitable sortable static-row-numbers static-row-header-text"\n|- style="white-space: nowrap;"`

  public cli = new Command()
    .addOption(new Option("-s, --save", "Save the report to a page specified in scripts, instead of printing to console."))

  get scriptDescription() {
    return `Create a database report about ${this.reportPage}\n${this.reportDescription}`
  }

  get pageTitle() {
    return this.reportPageBase + this.reportPage
  }

  get pageDescription() {
    return `${this.reportDescription} รายงานนี้อัปเดต${this.reportFrequencyText} อัปเดตล่าสุดเมื่อ <onlyinclude>{{subst:#timel:r}}</onlyinclude>`
  }


  async beforeRun() {
    await this.replica.init()
  }

  async run() {
    this.log.profile('Querying database')
    const [rows, fields] = await this.replica.query(this.query)
    this.log.profile('Querying database')
    this.log.info(`Found ${rows.length} rows`)
    this.log.debug('Creating wiki table')
    const table = this.createWikiTable(this.headers, rows)
    this.log.info('Saving page')
    await this.savePage(this.pageDescription, table, this.reportFooter)
  }

  createWikiTable(headers: string[], rows: any[]) {
    let table = this.preTableHeader + "\n! " + headers.join("\n! ") + "\n"
    for (let i = 0; i < rows.length; i++) {
      table += "|-\n| " + this.formatRow(rows[i], i, rows).join("\n| ") + "\n"
    }
    table += "|}"
    return table
  }

  async savePage(header: string, content: string, footer: string) {
    const page = this.pageTitle
    if (this.cli.opts().save) {
      this.log.info(`Saving to "${page}"`)
      await this.bot.save(page, header + content + footer, this.summary)
      this.log.info(`Saved to "${page}"`)
    } else {
      this.log.warn('Not saving the report to a page. Use --save option to save.')
      console.log(`The following content will be saved to "${chalk.yellowBright(page)}":\n`)
      console.log(header + content + footer)
      console.log(chalk.yellowBright(`\nTo save the report, run the script with the --save option.`))
    }
  }

  async afterRun() {
    await this.replica.end()
  }

  formatRow(row: any, index: number, rows?: any[]): string[] {
    return []
  }
}