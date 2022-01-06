import * as load from 'load-json-file'
import fs from 'fs'
import yargs from 'yargs/yargs'
const argv = yargs(process.argv.slice(2))
  .option('credential',{
  })
  .config('config', function (configPath) {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  })
  .default('config', '../config.json')
  .argv

console.log(argv)
