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

interface ConfigJson {
  _site: {
    (x: string): string[]
  },
  config: {
    user: string
    credentials: string
    simulate: boolean
    disabled: []
  },
  log: {
    logdir: string
    debug: boolean
    debugprefix: string
    debugdir: string
    log: boolean
    autolog: []
    excludes: []
  }
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
  .option('user',{
    describe: 'Username of bot',
    string: true,
    alias: 'username',
    default: 'AinalBOT', // Hard embed ชั่วคราวแหละ เชื่อผมดิ
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
  .command('add <taskname>','Add new task to tasks list',(yargs) => {})
  .argv

export default argv
