const winston = require('winston')
const { combine, timestamp, label, printf } = winston.format

const config = require('./config.js')
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${level}] ${label}: ${message}`
})


module.exports = exports = function (args) {
  const modulename = args
  const prefix = './logs/'
  const logger = winston.createLogger({
    level: 'info',
    format: myFormat,
    defaultMeta: { module: modulename },
    transports: [
      new winston.transports.File({ 
        filename: `${prefix}error.log`, 
        level: 'error', 
        format: combine(
          label({label: modulename}), 
          timestamp(), 
          myFormat
        ),
      }),
      new winston.transports.File({
        filename: `${prefix + modulename}.log`, 
        level: 'info',
        format: combine(
          label({label: modulename}),
          timestamp(),
          myFormat
        ),
      }),
      new winston.transports.Console({
        format: combine(
          label({ label: modulename }),
          timestamp(),
          myFormat
        ),
      })
    ],
    // silent: !!config.isSilent,
  }) 


  return logger
}
