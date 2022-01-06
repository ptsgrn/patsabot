"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("./ainalbot/config"));
const bree_1 = __importDefault(require("bree"));
const cabin_1 = __importDefault(require("cabin"));
const path_1 = __importDefault(require("path"));
if (config_1.default.help)
    config_1.default.help();
const bree = new bree_1.default({
    logger: new cabin_1.default(),
    root: path_1.default.resolve('dist/tasks'),
    jobs: [
        'task1',
    ]
});
bree.start();
