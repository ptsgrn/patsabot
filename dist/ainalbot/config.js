"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Page = exports.User = exports.Site = void 0;
const fs_1 = __importDefault(require("fs"));
const jsonfile_1 = __importDefault(require("jsonfile"));
const yargs_1 = __importDefault(require("yargs/yargs"));
const argv = yargs_1.default(process.argv.slice(2))
    .alias('help', 'h')
    .alias('version', 'v')
    .alias('config', 'cfg')
    .alias('credential', ['credentials', 'cre'])
    .locale(yargs_1.default().locale())
    .usage('node . <add|remove|start|stop|run>')
    .config('credential', function (configPath) {
    return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
})
    .default('credential', 'credentials.json')
    .config('config', function (configPath) {
    return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
})
    .default('config', 'config.json')
    .describe({
    'config': 'Configuration file',
    'credential': 'Credential keys file (a.k.a. OAuth key) to use with `config.site` or `--site`, file can be blank if you don\'t have to login',
})
    .option('user', {
    describe: 'Username of bot',
    string: true,
    alias: 'username',
    default: 'AinalBOT',
})
    .option('site', {
    describe: 'What site should bot usend in',
    alias: 'wiki',
    default: '_default',
})
    .option('debug', {
    alias: 'd',
    boolean: true,
    describe: 'Run in debug mode',
})
    .group(['config', 'credential'], 'Bot\'s Autherization')
    .epilogue('Running to any issue? File a bug at <https://gitlab.com/ptsgrn/ainalbot/-/issues> or contact the owner at <https://w.wiki/JSB>')
    .command('start', 'start bot', (yargs) => { })
    .argv;
class Site {
    constructor() {
    }
    getSiteApiUrl() {
        let s = argv._site[argv.site] ?? argv._site._default;
        return `https://th.wikipedia.org/w/api.php`;
    }
}
exports.Site = Site;
class User {
    getKeyOf(key) {
        let keys = argv[argv.config.user];
        return keys[key];
    }
    getUserAgent(pkgfile = 'package.json') {
        let pkg = jsonfile_1.default.readFileSync(pkgfile);
        let ret = '';
        ret += pkg.name + '/';
        ret += pkg.version + ' ';
        ret += '(';
        ret += 'by [[m:User talk:' + pkg.author + ']]; ';
        ret += pkg.bugs.url + '; ';
        ret += '[[w:th:User:AinalBOT/shutoff]];';
        ret += ') ';
        Object.entries(pkg.dependencies).forEach(([pack, version]) => {
            ret += `${pack}/${version} `;
        });
        return ret;
    }
}
exports.User = User;
class Page {
}
exports.Page = Page;
exports.default = argv;
