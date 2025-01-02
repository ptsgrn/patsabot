/**
 * @inuse no-include-table
 * @id 0
 * @name updatestatus
 * @desc อัปเดตสถานะบอต
 * @cron 0 0,8,16 * * *
 * @author Patsagorn Y. (mpy@toolforge.org)
 * @license MIT
 */

import baselogger from "../patsabot/logger.js";
import bot from "../../core/bot.js";

const logger = baselogger.child({
  script: "updatestatus",
});
try {
  await bot.save(
    "User:PatsaBot/timestamp",
    "{{subst:#timel:r}}",
    "อัปเดตสถานะ"
  );
} catch (err) {
  logger.log("error", err);
}
