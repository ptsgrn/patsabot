const { createLogger, format, transports, addColors } = require('winston')
const { loggerDir } = require('./config')
require('winston-daily-rotate-file')

addColors({
  done: 'green',
  scriptrun: 'bold green',
  scriptdone: 'bold green'
})
const logger = createLogger({
  levels: {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7,
    done: 6,
    scriptrun: 5,
    scriptdone: 5
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({
      stack: true
    }),
    format.splat(),
    format.json(),
    format.ms()
  ),
  defaultMeta: { service: 'ainalbot' },
  transports: [
    new transports.DailyRotateFile({
      dirname: './logs/',
      frequency: '24h',
      filename: process.env.NODE_ENV === 'production' ? 'prod-%DATE%.log' : '%DATE%.log',
      maxSize: '1mb',
      maxFiles: '15d',
      utc: true,
      createSymlink: true,
      symlinkName: '_current.log'
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: `${loggerDir}/exceptions.log` })
  ]
})

module.exports = logger