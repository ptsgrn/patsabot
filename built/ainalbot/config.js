"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const argv = yargs_1.default(process.argv.slice(2))
    .option('credential', {})
    .config('config', function (configPath) {
    return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
})
    .default('config', '../config.json')
    .argv;
console.log(argv);
