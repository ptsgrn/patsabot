import { EventEmitter } from "node:events";
import chalk from "chalk";
import { createLogger, format, type Logger, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import TransportStream from "winston-transport";
import { getConfig } from "./config";

const loggerFormat = format.combine(
  format.timestamp(),
  format.errors({
    stack: true,
  }),
  format.splat(),
  format.json(),
);

export interface LogEntry {
  level: string;
  message: string;
  script?: string;
  rid?: string;
  timestamp: string;
  [key: string]: unknown;
}

export class InMemoryTransport extends TransportStream {
  public readonly emitter = new EventEmitter();
  private buffer: LogEntry[] = [];
  private readonly MAX = 1000;

  log(info: LogEntry, callback: () => void) {
    const { level, message, script, rid, timestamp, ...rest } = info;
    const entry: LogEntry = {
      ...rest,
      level,
      message,
      script,
      rid,
      timestamp: timestamp ?? new Date().toISOString(),
    };
    if (this.buffer.length >= this.MAX) this.buffer.shift();
    this.buffer.push(entry);
    this.emitter.emit("entry", entry);
    callback();
  }

  getBuffer(filter?: { script?: string; rid?: string }): LogEntry[] {
    if (!filter) return [...this.buffer];
    return this.buffer.filter(
      (entry) =>
        (!filter.script || entry.script === filter.script) &&
        (!filter.rid || entry.rid === filter.rid),
    );
  }
}

export const inMemoryTransport = new InMemoryTransport();

let instance: Logger | null = null;

/**
 * The shared winston logger, built on first use.
 *
 * Construction is deferred because the transports need `logger.logPath` from
 * the config, which is only available after the CLI has parsed `--config`.
 *
 * Transports: in-memory ring buffer, daily-rotated JSONL, an error-only file,
 * and a colorized console. Uncaught exceptions and rejections get their own
 * files; the process is never killed by a logging error.
 */
export function getLogger(): Logger {
  if (instance) return instance;

  const config = getConfig();
  instance = createLogger({
    level: config.logger.level,
    format: loggerFormat,
    transports: [
      inMemoryTransport,
      new DailyRotateFile({
        filename: `${config.logger.logPath}/output-%DATE%.jsonl`,
        datePattern: "YYYYMMDD",
        // zippedArchive: true,
        maxSize: "20m",
        maxFiles: "7d",
      }),
      new transports.File({
        filename: `${config.logger.logPath}/error.jsonl`,
        level: "error",
        maxsize: config.logger.maxFileSize,
      }),
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.errors(),
          format.printf(({ level, message, timestamp, durationMs }) => {
            return `${chalk.dim(`${timestamp}`)} ${level} ${message}${durationMs ? ` ${chalk.dim(`(${durationMs}ms)`)}` : ""}`;
          }),
        ),
      }),
    ],
    exceptionHandlers: [
      new transports.File({
        filename: `${config.logger.logPath}/exceptions.jsonl`,
        maxsize: config.logger.maxFileSize,
        format: loggerFormat,
      }),
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

  return instance;
}
