import bot from '../patsabot/bot.js';
import baselogger from '../patsabot/logger.js';
const logger = baselogger.child({
    script: 'updatestatus'
});
await bot.save('User:PatsaBot/timestamp', "{{subst:#timel:r}}", "อัปเดตสถานะ");
