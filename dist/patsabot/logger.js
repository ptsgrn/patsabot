import { loggerDir, credentials } from './config.js';
import winston from 'winston';
const { createLogger, format, transports, addColors } = winston;
import DiscordTransport from './discord-transport.js';
addColors({
  done: 'green',
  scriptrun: 'bold green',
  scriptdone: 'bold green',
});
const logger = createLogger({
  levels: {
    emerg: 0,
    alert: 1,
    crit: 2,
    error: 3,
    apierror: 6,
    warning: 4,
    notice: 5,
    info: 6,
    debug: 7,
    done: 6,
    scriptrun: 5,
    scriptdone: 5,
  },
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({
      stack: true,
    }),
    format.splat(),
    format.json(),
    format.ms()
  ),
  defaultMeta: { service: 'patsabot' },
  transports: [
    new transports.File({
      filename: `${loggerDir}/logs.log`,
      maxsize: 5242880, // 5MB
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
    new DiscordTransport({
      webhook: credentials.discord.webhook.logger,
      defaultMeta: { service: 'patsabot' },
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: `${loggerDir}/error.log`,
      maxsize: 1048576, // 1MB
    }),
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
    }),
  ],
});
export default logger;
