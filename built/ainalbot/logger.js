"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const config_1 = __importDefault(require("./config"));
const myFormat = winston_2.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});
function logger() {
    const prefix = './logs/';
    const logger = winston_1.default.createLogger({
        level: 'info',
        format: myFormat,
        defaultMeta: {},
        transports: [
            new winston_1.default.transports.File({
                filename: `${prefix}error.log`,
                level: 'error',
                format: winston_2.combine(winston_2.timestamp(), myFormat),
            }),
            new winston_1.default.transports.File({
                filename: `${prefix + modulename}.log`,
                level: 'info',
                format: winston_2.combine(winston_2.timestamp(), myFormat),
            }),
            new winston_1.default.transports.Console({
                format: winston_2.combine(winston_2.timestamp(), myFormat),
            })
        ],
        silent: !!config_1.default.isSilent,
    });
}
exports.default = logger;
