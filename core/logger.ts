import { createLogger, transports, format } from 'winston';
import { config } from '@core/config';
import chalk from 'chalk';

export const logger = createLogger({
  level: config.logger.level,
  format: format.combine(
    format.timestamp(),
    format.errors({
      stack: true,
    }),
    format.splat(),
    format.json(),
  ),
  transports: [
    new transports.File({
      filename: `${config.logger.logPath}/output.log`,
      maxsize: 5242880, // 5MB
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
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
    new transports.File({ filename: `${config.logger.logPath}/exceptions.log` })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'rejections.log' })
  ]
});
