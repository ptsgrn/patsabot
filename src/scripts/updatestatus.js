import bot from '../patsabot/bot.js';
import baselogger from '../patsabot/logger.js';
const logger = baselogger.child({
    script: 'updatestatus'
});
try {
    await bot.save('User:PatsaBot/timestamp', "{{subst:#timel:r}}", "อัปเดตสถานะ");
}
catch (err) {
    logger.log('error', err);
}
