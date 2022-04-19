// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Bree from 'bree'
import { resolveRelativePath } from './utils.js'
import logger from './logger.js'
import sanitize from 'sanitize-filename'
import express from 'express'
import { Router } from 'express'

const server = express()
const v1 = Router()

function scriptFile(filename) {
  return resolveRelativePath(import.meta.url, '../scripts/' + sanitize(filename) + '.js')
}

const jobs = new Bree({
  root: false,
  logger,
  timezone: 'Asia/Bangkok',
  workerMessageHandler: (message) => {
    logger.info(message)
  }
})

jobs.on('worker created', (name) => {
  logger.info(`Worker ${name} created.`)
})

jobs.on('worker deleted', (name) => {
  logger.info(`Worker ${name} deleted.`)
})

// jobs.add({
//   name: 'afccat',
//   path: scriptFile('afccat'),
//   cron: '0 0 * * *'
// })

const restParameterSchemaText = `
<pre>
REST parameters

GET /v1/              - This helps text.
GET /v1/config        - get Bree's config.
</pre>
`

v1.get('/', (req, res) => {
  res.contentType('html').send(restParameterSchemaText)
})

v1.get('/config', (req, res) => {
  res.send({
    'logger': 'patsabot.logger',
    'timezone': 'Asia/Bangkok',
    'workerMessageHandler': 'patsabot.workerMessageHandler'
  })
})

v1.get('/jobs', (req, res) => {
  res.send({
    'workers': jobs.workers.entries(),
    'intervals': jobs.intervals.entries(),
    'timeouts': jobs.timeouts.entries()
  })
})

console.log({
  'workers': jobs.workers.entries(),
  'intervals': jobs.intervals.entries(),
  'timeouts': jobs.timeouts.entries(),
  'isSchedule': jobs.isSchedule(),
})

server.use(v1)
jobs.start()
server.listen(3000)
