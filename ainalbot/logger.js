const loglevel = require('loglevel')
const prefixer = require('loglevel-plugin-prefix')
const fileSave = require('loglevel-filesave')

const chalk = require('chalk')

const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
}

prefix.reg(log)
log.enableAll()

prefix.apply(log, {
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`;
  },
})

const log = require('loglevel');
const prefix = require('loglevel-plugin-prefix');

prefix.reg(log);
log.enableAll();

log.info('root');

const chicken = log.getLogger('chicken');
chicken.info('chicken');

prefix.apply(chicken, { template: '%l (%n):' });
chicken.info('chicken');

prefix.apply(log);
log.info('root');

const egg = log.getLogger('egg');
egg.info('egg');

const fn = (level, name) => `${level} (${name}):`;

prefix.apply(egg, { format: fn });
egg.info('egg');

prefix.apply(egg, {
  levelFormatter(level) {
    return level.toLowerCase();
  },
});
egg.info('egg');

chicken.info('chicken');
log.info('root');



module.exports = log
