const { createLogger, format, transports } = require('winston')
const { loggerDir, isDebug } = require('./config')
const { DailyRotateFile } = require('winston-daily-rotate-file')

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
    new transports.File({ filename: `${loggerDir}/error.log`, level: 'error' }),
  ],\
  exceptionHandlers: [
    new transports.File({ filename: `${loggerDir}/exceptions.log` })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }))
}

logger.configure({
  level: 'verbose',
  transports: [
    new DailyRotateFile()
  ]
})

module.exports = logger