#!/usr/bin/env node
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// get script name from argv
import { parentPort } from 'node:worker_threads'
import { argv, exit } from 'node:process'
import { accessSync } from 'node:fs'
import bot from './bot.js'
import cuid from 'cuid'
import log from './logger.js'

(async function() {
  const workid = cuid()
  const scriptname = argv[2]
  try {
    accessSync(new URL(`../scripts/${scriptname}.js`, import.meta.url)) 
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
  const script = await import(`../scripts/${scriptname}.js`)

  // run script
  log.log('scriptrun', 'script.runner.start', {
    script: scriptname,
    id: script.id,
    workid
  })
  console.log(`script ${scriptname} started`)
  script.run({
    bot,
    log: log.child({
      id: script.id || 'UNKNOWN',
      script: scriptname || 'UNKNOWN',
      workid
    })
  })
    .catch((err) => {
      log.error(err)
      exit(1)
    })
    .finally(() => {
      log.log('scriptdone', 'script.runner.done', { script: scriptname, workid })
      if (parentPort) {
        parentPort.postMessage('done')
      } else {
        exit(0)
      }
    })
})()