"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const bree_1 = __importDefault(require("bree"));
const mwn_1 = require("mwn");
const logger_1 = require("./ainalbot/logger");
const config_1 = __importStar(require("./ainalbot/config"));
const site = new config_1.Site(), user = new config_1.User(), { getKeyOf, getUserAgent } = user;
class AinalBOT {
    constructor() {
        this.bot = async () => {
            const bot = await mwn_1.mwn.init({
                apiUrl: site.getSiteApiUrl(),
                OAuthCredentials: {
                    consumerSecret: getKeyOf('consumer_secret'),
                    consumerToken: getKeyOf('consumer_token'),
                    accessSecret: getKeyOf('access_secret'),
                    accessToken: getKeyOf('access_token'),
                },
                password: getKeyOf('password'),
                username: config_1.default.username,
                userAgent: getUserAgent(),
                silent: !config_1.default.debug,
                maxRetries: 7,
                defaultParams: {
                    assert: 'user',
                },
                shutoff: {
                    onShutoff: (wikitext) => {
                        throw new Error('Bot had been shutted off\nPage text is ⟩' + wikitext);
                        process.exit(1);
                    },
                    page: 'User:AinalBOT/shutoff',
                    condition: (wikitext) => {
                        return true;
                    }
                }
            });
            return bot;
        };
        this.job = () => {
            const bree = new bree_1.default({
                logger: logger_1.Multi,
                root: path_1.default.resolve('./dist/tasks'),
                jobs: [
                    {
                        name: 'task2',
                    },
                ],
                worker: {
                    workerData: {
                        text: 'feat',
                    }
                }
            });
            return bree;
        };
    }
}
if (config_1.default.help)
    config_1.default.help();
if (require.main !== module)
    process.abort();
