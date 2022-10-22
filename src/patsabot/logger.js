import 'winston-daily-rotate-file';
import { loggerDir, sentry_dsn } from './config.js';
import winston from 'winston';
const { createLogger, format, transports, addColors } = winston;
import Sentry from 'winston-sentry-log';
addColors({
    done: 'green',
    scriptrun: 'bold green',
    scriptdone: 'bold green'
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
        scriptdone: 5
    },
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: format.combine(format.timestamp(), format.errors({
        stack: true
    }), format.splat(), format.json(), format.ms()),
    defaultMeta: { service: 'patsabot' },
    transports: [
        new transports.File({
            filename: `${loggerDir}/logs.log`,
        }),
        new transports.Console({
            format: format.combine(format.colorize(), format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`))
        }),
        new Sentry({
            dsn: sentry_dsn,
            level: 'info',
            environment: process.env.NODE_ENV,
            tags: {
                service: 'patsabot'
            }
        }),
    ],
    exceptionHandlers: [
        new transports.File({
            filename: `${loggerDir}/exceptions.log`,
            maxsize: 1000000,
        })
    ]
});
export default logger;
