import { Bot } from '@core/bot';

export default class UpdateStatusBot extends Bot {
  public info: { id: string; name: string; description: string; } = {
    id: 'updatestatus',
    description: 'อัปเดตสถานะบอต',
    name: 'updatestatus',
  }

  constructor() {
    super()
  }

  async run() {
    await this.bot.save(
      `ผู้ใช้:${this.config.bot.username}/timestamp`,
      "{{subst:#timel:r}}",
      "อัปเดตสถานะ"
    );
    this.log.info("Status updated")
  }
}