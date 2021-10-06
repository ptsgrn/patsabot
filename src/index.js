// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { accessSync, readdirSync } = require('fs')
const { resolve } = require('path')
const bot = require('./ainalbot/bot')
const log = require('./ainalbot/logger')
const { ScriptNotFound } = require('./ainalbot/errorfactory')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const dayjs = require('dayjs')
const cuid = require('cuid')

let args = yargs(hideBin(process.argv))
  .command('node . [script]', 'run script', (yargs) => {
    return yargs
      .positional('script', {
        describe: 'script to run',
        normalize: true
      })
  })
  .completion('completion', function() {
    let files = readdirSync(resolve(__dirname, './scripts/'))
    console.log(files)
    return files
  })
  .help('help')
  .alias('help', 'h')
  .epilog('MIT License by Patsagorn Y. 2020-2021')
  .parse()

try {
  accessSync(resolve(__dirname, `./scripts/${args._[0]}.js`)) 
} catch {
  throw new ScriptNotFound(`script "${args._[0]}" might be not existed.`)
}
const script = require(resolve(__dirname, `./scripts/${args._[0]}.js`))
const startRun = new bot.date()
const workid = cuid()
log.log('scriptrun', `script ${script.id} (workid:${workid}) starting at ${startRun}`)
script.run({
  bot, 
  log: log.child({ 
    script: script.id || 'UNKNOWN',
    workid
  })
}).then(() => {
  log.log('scriptdone',`script ${script.id} (workid:${workid}) done in ${dayjs(new bot.date()).diff(startRun)}ms`)
}).catch((err) => {
  log.error(err)
  throw err
})
