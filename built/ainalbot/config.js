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
const load = __importStar(require("load-json-file"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const argv = yargs_1.default(process.argv.slice(2)).options({
    user: { type: 'string' },
    credentials: { type: 'string' },
})
    .argv;
const getConfigFile = () => load.sync('./config.json');
function credentialsFile() {
    return load.sync(argv.credentials
        ?? getConfigFile.config.credentials);
}
function userInfo() {
    let credentials = credentialsFile;
    let username = argv.user
        ?? getConfigFile.config.user
        ?? null;
    let { consumer_token, consumer_secret, access_token, access_secret } = credentials[username];
    return {
        consumer_token,
        consumer_secret,
        access_token,
        access_secret,
    };
}
function getSiteScriptUrl() {
    let url;
    let siteObjec = getConfigFile.site[argv.site ?? '_default'] ?? getConfigFile.site['_default'];
    url: String = `${siteObject[0]}//${siteObject[1] + siteObject[3]}`;
    return url;
}
function isDebug() {
    return !!argv.debug ?? !!getConfigFile?.log?.debug;
}
function isSilent() {
    return !!argv.silent ?? !!getConfigFile?.log?.silent;
}
function isSimulate() {
    return !!argv.simulate ?? !!getConfigFile?.config?.simulate;
}
exports.default = {
    getConfigFile: getConfigFile(),
    credentialsFile,
    userInfo,
    getSiteScriptUrl,
    isDebug,
    isSilent,
    isSimulate,
};
