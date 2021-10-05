const { createLogger, format, transports } = require('winston')
const { loggerDir } = require('./config')
require('winston-daily-rotate-file')

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
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