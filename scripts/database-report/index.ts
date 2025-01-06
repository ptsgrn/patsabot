import { Bot } from '@core/bot';

export class DatabaseReportBot extends Bot {
  reportPage: string = ""
  reportDescription: string = ""
  reportFrequency: string = '@weekly'
  reportFrequencyText: string = 'สัปดาห์ละครั้ง'

  get pageDescription() {
    return `${this.reportDescription} รายงานนี้อัปเดต${this.reportFrequencyText} อัปเดตล่าสุดเมื่อ <onlyinclude>{{subst:#timel:r}}</onlyinclude>\n\n`
  }

  async run() {
    console.log('Generating database report...')
  }
}