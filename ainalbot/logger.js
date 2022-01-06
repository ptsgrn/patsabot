var modulename = 'default' // stupid default name
module.exports.modulename = exports.modulename = modulename
const log = require('loglevel')
const prefix = require('loglevel-plugin-prefix')
const fileSave = require('loglevel-filesave')
const chalk = require('chalk')
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    silent: ['sil'],
    filelog: ['log'],
    filelogall: ['logall'],
    nofilelog: ['nologall'],
    nofilelogall: ['nofilelogall'],
    logprefix: ['logprefix'],
  }
})
const colors = {
  TRACE: chalk.magenta,
  DEBUG: chalk.cyan,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red,
}
prefix.reg(log)

if (argv.debug) { log.enableAll() }

var logger = loglevel.getLogger(modulename);
fileSave(logger, {file: `./logs/${argv.debug ? 'debug/'}${modulename}.log`});

prefix.apply(log, {
  format(level, name, timestamp) {
    return `${chalk.gray(`[${timestamp}]`)} ${colors[level.toUpperCase()](level)} ${chalk.green(`${name}:`)}`;
  },
})

module.exports = exports = log