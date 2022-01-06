"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text = "Hello world";
const logger_1 = __importDefault(require("../ainalbot/logger"));
const log = logger_1.default.extend('task1');
setTimeout(function () {
    log(text);
}, 3 * 1000);
