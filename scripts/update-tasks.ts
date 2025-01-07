import { Bot } from '@core/bot';

export default class UpdateBotTaskBot extends Bot {
  public info: { id: string; name: string; description: string; } = {
    id: 'update-tasks',
    description: 'อัปเดตงานบอต',
    name: 'update-tasks',
  }
}