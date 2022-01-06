#!/usr/bin/env node
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ScriptNotFound } from './errorfactory.js'
import _cron from 'node-cron'
import { accessSync } from 'node:fs'
import bot from './bot.js'
import cuid from 'cuid'
import { hideBin } from 'yargs/helpers'
import log from './logger.js'
import yargs from 'yargs'
const { schedule, validate } = _cron


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
    accessSync(new URL(`../scripts/${args._[0]}.js`, import.meta.url)) 
  } catch {
    return new ScriptNotFound(`script "${args._[0]}" might be not existed.`)
  }
  const script = await import(`../scripts/${args._[0]}.js`)
  const workid = cuid()
  log.log('scriptrun', 'script.runner.start', {
    script: args._[0],
    id: script.id,
    workid
  })
  // check if script has schedule inside
  // TODO: make a new cli option to overide this
  if (!script.schedule) {
    script.run({
      bot,
      log: log.child({
        script: script.id || 'UNKNOWN',
        workid
      })
    })
      .catch((err) => {
        log.error(err)
      })
      .finally(() => {
        log.log('scriptdone', 'script.runner.done', { script: args._[0], workid })
      })
  } else {
    if (typeof script.schedule !== 'string') return new Error('schedule must be a string')
    if (!validate(script.schedule)) return new Error(`schedule (${script.schedule}) is not valid`)
    schedule(script.schedule, () => {
      script.run({
        bot,
        log: log.child({
          id: script.id || 'UNKNOWN',
          script: args._[0],
          workid
        })
      })
        .catch((err) => {
          log.error(err)
        })
        .finally(() => {
          log.log('scriptdone', 'script.runner.done', {
            script: args._[0],
            id: script.id || 'UNKNOWN',
            workid
          })
        })
    }, {
      scheduled: true,
      timezone: 'Asia/Bangkok'
    })
  }
})()
