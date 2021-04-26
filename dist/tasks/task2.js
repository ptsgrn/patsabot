"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../ainalbot/logger"));
const log = logger_1.default.extend('task2');
const bot_1 = __importDefault(require("../ainalbot/bot"));
bot_1.default.request({
    "action": "query",
    "format": "json",
    "meta": "userinfo",
})
    .then(data => {
    log('data: %o', data.query);
})
    .catch(err => {
    log(err);
});
