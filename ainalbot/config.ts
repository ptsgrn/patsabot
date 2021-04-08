import fs from 'fs'
import yargs from 'yargs/yargs'
const argv = yargs(process.argv.slice(2))
  // --help, --version
  .alias('help', 'h')
  .alias('version', 'v')
  .locale(yargs().locale())
  .usage('$0 <add|rm|show|all>')
  // --credential
  .config('credential', function (configPath:string) {
    return [JSON.parse(fs.readFileSync(configPath, 'utf-8'))]
  })
  .default('credential', 'credentials.json')
  // --config
  .config('config', function (configPath:string) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .default('config', 'config.json')
  .describe({
    'config':'Configuration file',
    'credential': 'Credential key (i.e. OAuth key) to use with `config.site` or `--site`, file can be blank if you don\'t have to login',
  })
  // --debug
  .option('debug',{
    alias: 'd',
    boolean: true,
  })
  .group(['config', 'credential'], 'Bot\'s Autherization')
  .epilogue('Running to any issue? File a bug at <https://gitlab.com/ptsgrn/ainalbot/-/issues> or contact the owner at <https://w.wiki/JSB>')
  .argv

export default argv
