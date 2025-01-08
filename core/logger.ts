import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
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
    new DailyRotateFile({
      filename: `${config.logger.logPath}/output-%DATE%.log`,
      datePattern: 'YYYYMMDD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
    }),
    new transports.File({
      filename: `${config.logger.logPath}/error.log`,
      level: 'error',
      maxsize: config.logger.maxFileSize,
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
      maxsize: config.logger.maxFileSize,
      format: loggerFormat,
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: `${config.logger.logPath}/rejections.log`,
      maxsize: config.logger.maxFileSize,
      format: loggerFormat,
    }),
  ]
});
