// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { accessSync } = require('fs')
const { resolve } = require('path')
const bot = require('./ainalbot/bot')
const log = require('./ainalbot/logger')
const { ScriptNotFound } = require('./ainalbot/errorfactory')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const dayjs = require('dayjs')

let args = yargs(hideBin(process.argv))
  .command('node . [script]', 'run script', (yargs) => {
    return yargs
      .positional('script', {
        describe: 'script to run',
        normalize: true
      })
  }, () => {})
  .parse()
try {
  accessSync(resolve(__dirname, `./scripts/${args._[0]}.js`)) 
} catch {
  throw new ScriptNotFound(`script "${args._[0]}" might be not existed.`)
}
const script = require(resolve(__dirname, `./scripts/${args._[0]}.js`))
const startRun = new bot.date()
script.run({
  bot, 
  log: log.child({ 
    script: script.id || 'UNKNOWN',
    startRun
  })
}).then(()=>{
  log.log('scriptdone',`script ${script.id} done in ${dayjs(new bot.date()).diff(startRun)}ms`)
}).catch((err)=>{
  log.error(err)
  throw err
})