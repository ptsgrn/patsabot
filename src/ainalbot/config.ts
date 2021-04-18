import fs from 'fs'
import jsonfile from 'jsonfile'
import yargs from 'yargs/yargs'

interface PackageJsonFile {
  name: string,
  version: number,
  'private': boolean,
  'description': string,
  main: string,
  scripts: object,
  repository: object,
  author: string,
  maintainers: object[],
  license: string,
  bugs: {
    url?: string,
    email?: string,
  },
  homepage: string,
  dependencies: object,
  devDependencies: object,
}

const argv: any = yargs(process.argv.slice(2))
  .alias('help','h')
  .alias('version','v')
  .alias('config','cfg')
  .alias('credential', ['credentials', 'cre'])
  .locale(yargs().locale())
  .usage('node . <add|remove|start|stop|run>')
  .config('credential', function (configPath:string) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .default('credential', 'credentials.json')
  // --config
  .config('config', function (configPath:string) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .default('config', 'config.json')
  .describe({
    'config':'Configuration file',
    'credential': 'Credential keys file (a.k.a. OAuth key) to use with `config.site` or `--site`, file can be blank if you don\'t have to login',
  })
  .option('site',{
    describe: 'What site should bot usend in',
    default: '_default',
  })
  // --debug
  .option('debug',{
    alias: 'd',
    boolean: true,
    describe: 'Run in debug mode',
  })
  .group(['config', 'credential'], 'Bot\'s Autherization')
  .epilogue('Running to any issue? File a bug at <https://gitlab.com/ptsgrn/ainalbot/-/issues> or contact the owner at <https://w.wiki/JSB>')
  .argv

class Site {
  constructor() {
    // It's nothing here (for now)
  }
  getSiteApiUrl() {
    let s: any = argv._site[argv.site] ?? argv._site._default
    return `${s[0]}//${s[1] + s[2]}/api.php` as string
  }
}

class User {
  getKeyOf (key:string) {
    let keys:any =  argv[argv.config.user]
    return keys[key] as string
  }
  getUserAgent (pkgfile:string = 'package.json'):string {
    let pkg: PackageJsonFile = jsonfile.readFileSync(pkgfile)
    let ret:string = ''
    ret += pkg.name + '/'
    ret += pkg.version + ' '
    ret += '('
    ret += 'by [[m:User talk:' + pkg.author + ']]; '
    ret += pkg.bugs.url +'; '
    ret += '[[w:th:User:AinalBOT/shutoff]];'
    ret += ') '
    Object.entries(pkg.dependencies).forEach(([pack, version]) => {
      ret += `${pack}/${version} `
    })
    return ret
  }
}

class Page {
}

export default argv
export {
  Site,
  User,
  Page,
}
