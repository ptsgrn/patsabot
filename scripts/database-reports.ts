import { Command, Option } from '@commander-js/extra-typings';
import { Bot } from '@core/bot';
import { readdir } from "node:fs/promises";
import { join } from 'node:path';
import chalk from 'chalk';

export class DatabaseReportBot extends Bot {
  info = {
    id: "database-report",
    name: "Database Report",
    description: "A database report",
    frequency: '@weekly',
    frequencyText: 'สัปดาห์ละครั้ง'
  } satisfies Bot['info'] | {
    frequencyText: string
  }

  reportPageBase: string = "วิกิพีเดีย:รายงานจากฐานข้อมูล/"
  reportFooter: string = "\n{{ส่วนท้ายรายงานฐานข้อมูล}}"
  summary: string = "อัปเดตรายงาน"

  query: string = ""
  headers: string[] = ['ที่']
  preTableTemplates: string[] = []

  get preTableHeader() {
    return `\n\n${this.preTableTemplates.join("\n")}\n{| class="wikitable sortable static-row-numbers static-row-header-text"\n|- style="white-space: nowrap;"`
  }

  public cli = new Command()
    .addOption(new Option("-s, --save", "Save the report to a page specified in scripts, instead of printing to console."))

  get scriptDescription() {
    return `Create a database report about ${this.info.name}\n${this.info.description}`
  }

  get pageTitle() {
    return this.reportPageBase + this.info.name
  }

  get pageDescription() {
    return `${this.info.description} รายงานนี้อัปเดต${this.info.frequencyText} อัปเดตล่าสุดเมื่อ <onlyinclude>{{subst:#timel:H:i, j F xkY}}</onlyinclude>`
  }


  async beforeRun() {
    await this.replica.init()
  }

  async run() {
    this.log.profile('Querying database')
    const result = await this.replica.query(this.query)
    if (!result) {
      throw new Error('Query returned undefined')
    }
    const [rows, fields] = result
    this.log.profile('Querying database')
    // @ts-ignore
    this.log.info(`Found ${rows.length} rows`)
    this.log.debug('Creating wiki table')
    // @ts-ignore
    const table = this.createWikiTable(this.headers, rows)
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

  async schedule() {
    await super.schedule({
      pattern: this.info.frequency,
      options: {
        name: this.info.id
      }
    })
  }
}

export default class RunScheduleDatabaseReport extends Bot {
  info: Bot['info'] = {
    id: 'run-schedule-database-report',
    name: 'Run Schedule Database Report',
    description: 'Run all scheduled database reports'
  }
  allReports: Record<string, DatabaseReportBot> = {}

  async run() {
    this.log.info('Running all scheduled database reports')
    const files = await readdir(join(import.meta.dir, '../scripts/database-reports'))
    for (const file of files) {
      if (!file.endsWith('.ts')) {
        continue
      }
      const module = await import(`@scripts/database-reports/${file}`)
      const report = new module.default() as DatabaseReportBot
      this.log.info(`Scheduled ${report.info.id} (${report.info.frequency})`)
      this.allReports[report.info.id] = report
      await report.schedule()
    }
  }
}