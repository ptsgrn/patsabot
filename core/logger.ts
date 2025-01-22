import { createLogger, transports, format, Logger } from 'winston';
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

/**
 * Logger configuration using `winston` library with multiple transports.
 * 
 * Transports:
 * - `DailyRotateFile`: Rotates log files daily with a maximum size of 20MB and keeps logs for 7 days.
 * - `File`: Logs error messages to a file with a specified maximum size.
 * - `Console`: Logs messages to the console with colorized output.
 * 
 * Exception Handlers:
 * - `File`: Logs uncaught exceptions to a file with a specified maximum size.
 * 
 * Rejection Handlers:
 * - `File`: Logs unhandled promise rejections to a file with a specified maximum size.
 * 
 * @constant
 * @type {Logger}
 * @default
 */
export const logger: Logger = createLogger({
  level: config.logger.level,
  format: loggerFormat,
  transports: [
    new DailyRotateFile({
      filename: `${config.logger.logPath}/output-%DATE%.jsonl`,
      datePattern: 'YYYYMMDD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '7d',
    }),
    new transports.File({
      filename: `${config.logger.logPath}/error.jsonl`,
      level: 'error',
      maxsize: config.logger.maxFileSize,
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, durationMs }) => {
          return `${chalk.dim(`${timestamp}`)} ${level} ${message}${durationMs ? ` ${chalk.dim(`(${durationMs}ms)`)}` : ''}`;
        })
      )
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: `${config.logger.logPath}/exceptions.jsonl`,
      maxsize: config.logger.maxFileSize,
      format: loggerFormat,
    })
  ],
  rejectionHandlers: [
    new transports.File({
      filename: `${config.logger.logPath}/rejections.jsonl`,
      maxsize: config.logger.maxFileSize,
      format: loggerFormat,
    }),
  ],
  exitOnError: false,
});
