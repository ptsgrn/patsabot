import { Bot } from '@core/bot';

export default class UpdateBotTaskBot extends Bot {
  public info: Bot['info'] = {
    id: 'update-tasks',
    description: 'อัปเดตงานบอต',
    name: 'update-tasks',
  }
}