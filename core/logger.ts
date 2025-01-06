import { createLogger, transports, format } from 'winston';
import { config } from '@core/config';
import chalk from 'chalk';

const loggerFormat = format.combine(
  format.timestamp(),
  format.errors({
    stack: true,
  }),
  format.splat(),
  format.json(),
)

export const logger = createLogger({
  level: config.logger.level,
  format: loggerFormat,
  transports: [
    new transports.File({
      filename: `${config.logger.logPath}/output.log`,
      maxsize: 5242880, // 5MB
    }),
    new transports.File({
      filename: `${config.logger.logPath}/error.log`,
      level: 'error',
      maxsize: 5242880, // 5MB
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, durationMs }) => {
          return `${chalk.dim(`[${timestamp}]`)} ${level}: ${message}${durationMs ? ` ${chalk.dim(`(${durationMs}ms)`)}` : ''}`;
        })
      )
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: `${config.logger.logPath}/exceptions.log`,
      maxsize: 5242880, // 5MB
      format: loggerFormat,
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: `${config.logger.logPath}/rejections.log`,
      maxsize: 5242880, // 5MB
      format: loggerFormat,
    }),
  ]
});
