// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { accessSync } from 'node:fs'
import bot from './ainalbot/bot.js'
import log from './ainalbot/logger.js'
import { ScriptNotFound } from './ainalbot/errorfactory.js'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import cuid from 'cuid'

let args = yargs(hideBin(process.argv))
  .command('node . [script]', 'run script', (_args) => {
    return _args
      .positional('script', {
        describe: 'script to run',
        normalize: true
      })
  })
  .help('help')
  .alias('help', 'h')
  .epilog('MIT License by Patsagorn Y. 2020-2021')
  .parse();

(async function() {
  try {
    accessSync(new URL(`./scripts/${args._[0]}.js`, import.meta.url)) 
  } catch {
    throw new ScriptNotFound(`script "${args._[0]}" might be not existed.`)
  }
  const script = await import(`./scripts/${args._[0]}.js`)
  const workid = cuid()
  log.log('scriptrun', 'script.runner.start', {script: args._[0], workid })
  script.run({
    bot, 
    log: log.child({ 
      script: script.id || 'UNKNOWN',
      workid
    })
  })
    .finally(() => {
      log.log('scriptdone', 'script.runner.done', {script: args._[0], workid })
    })
    .catch((err) => {
      log.error(err)
      throw err
    })
})()
