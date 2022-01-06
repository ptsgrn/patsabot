"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Multi = void 0;
const debug_1 = __importDefault(require("debug"));
let debug = debug_1.default('AinalBotInternal');
let { extend } = debug;
const Multi = {
    info: extend('info'),
    error: extend('error'),
    warn: extend('warn'),
};
exports.Multi = Multi;
exports.default = debug;
