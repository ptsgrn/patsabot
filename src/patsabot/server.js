// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import Bree from 'bree'
import { resolveRelativePath } from './utils.js'
import baseLogger from './logger.js'
import sanitize from 'sanitize-filename'
import express from 'express'
import { Router } from 'express'
import bodyParser from 'body-parser'
import cuid from 'cuid'
import expressJwt from 'express-jwt'
import jwt from 'jsonwebtoken'
import cors from 'cors'

const logger = baseLogger.child({
  component: 'jobsrunner'
})

if (!process.env.AUTH_TOKEN) {
  logger.log('error', 'AUTH_TOKEN is not set')
  process.exit(1)
}

const server = express()
const v1 = Router()
const PORT = process.env.PORT || 3000

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

jobs.start()

server.use(cors())
v1.use(bodyParser.json())

v1.use((req, res, next) => {
  logger.log('info', `apir-${cuid()}`, {
    reqId: `apir-${cuid()}`,
    method: req.method,
    url: req.url,
    body: req.body
  })
  next()
})

const restParameterSchemaText = `
<pre>
REST parameters

GET /v1/               - This helps text.
GET /v1/config         - get Bree's config.
GET /v1/jobs           - get all jobs and their status.
GET /v1/jobs/:name     - get a job's status.
POST /v1/jobs          - create a job.
POST /v1/start         - start all jobs.
POST /v1/start/:name   - start a job.
POST /v1/stop          - stop all jobs.    (known issue: jobs will not stop)
POST /v1/stop/:name    - stop a job.       (known issue: jobs will not stop)
POST /v1/run/:name     - run a jobs.
POST /v1/delete/:name  - delete a job.
POST /v1/login         - login.

PatsaBot (c) MIT 2022 Patsagorn Y.
</pre>
`

server.get('/', (req, res) => {
  res.contentType('html').send(restParameterSchemaText)
})

v1.get('/config', (req, res) => {
  res.send({
    ...jobs.config
  })
})

/**
 * Jobs info
 * @typedef JobsInfo
 * @property {string} name - job name
 * @property {( 'active' | 'delayed' | 'waiting' | 'done' )} status - job status
 */

v1.get('/jobs', (_req, res) => {
  let jobsname = [
    ...jobs.config.jobs.map((job) => job.name)
  ]

  /** @type {JobsInfo[]} */
  let jobinfo = jobsname.map(name => {
    /** @type {JobsInfo} */
    return {
      name,
      status: jobs.intervals.has(name)
        ? 'waiting'
        : (jobs.timeouts.has(name)
          ? 'delayed'
          : (jobs.workers.has(name)
            ? 'active'
            : 'inactive'
          )
        )
    }
  })

  res.send({
    jobs: jobinfo,
    status: 'ok'
  })
})

v1.get('/jobs/:jobName', (req, res) => {
  const jobName = req.params.jobName
  let jobsName = jobs.config.jobs.filter((job) => job.name === jobName).map(j => j.name)
  const jobsInfo = jobsName.map(name => {
    /** @type {JobsInfo} */
    return {
      name,
      status: jobs.intervals.has(name)
        ? 'waiting'
        : (jobs.timeouts.has(name)
          ? 'delayed'
          : (jobs.workers.has(name)
            ? 'active'
            : 'inactive'
          )
        )
    }
  })
  return res.send({
    jobs: jobsInfo,
    status: 'ok'
  })
})

v1.post('/jobs', (req, res) => {
  let { jobs: jobsToSubmit, copy, start } = req.body
  jobsToSubmit = jobsToSubmit || []
  copy = copy || false
  start = start || false
  let newJobs = []
  for (const job of jobsToSubmit) {
    // const origJob = jobs.config.jobs.find((j) => j.name === job.name)
    if (!job) return res.status(400).send('Name does not exist in jobs')
    const newJob = { ...job }
    if (jobs.config.jobs.find((j) => j.name === job.name) && copy) {
      newJob.name = job.name + '(1)'
    }
    if (job.name.endsWith(')')) {
      newJob.name = job.name.replace(
        /(^.*)(\((\d+)\))(?=$)/i,
        (_match, subName, _p2, num) =>
          `${subName}(${Number.parseInt(num, 10) + 1})`
      )
    }
    newJob.path = scriptFile(newJob.path || newJob.file || newJob.name)
    newJobs.push(newJob)
  }
  jobsToSubmit = newJobs
  try {
    newJobs = jobs.add(jobsToSubmit)
  } catch (err) {
    return res.status(400).send({
      error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
      jobs: jobsToSubmit
    })
  }
  if (start) {
    for (const job of jobsToSubmit) {
      jobs.start(job.name)
    }
  }
  return res.send({
    jobs: newJobs,
    status: 'ok'
  })
})

v1.post('/start', (req, res) => {
  jobs.start()
  return res.send({ status: 'ok' })
})

v1.post('/start/:jobName', (req, res) => {
  const { jobName } = req.params
  jobs.start(jobName)
  return res.send({ status: 'ok' })
})

v1.post('/stop', (req, res) => {
  jobs.stop()
  return res.send({ status: 'ok' })
})

v1.post('/stop/:jobName', (req, res) => {
  const { jobName } = req.params
  jobs.stop(jobName)
  jobs.workers.get(jobName).kill('SIGINT')
  return res.send({ status: 'ok' })
})

v1.post('/run/:jobName', (req, res) => {
  const { jobName } = req.params
  jobs.run(jobName)
  return res.send({ status: 'ok' })
})

v1.post('/delete/:jobName', (req, res) => {
  const { jobName } = req.params
  jobs.remove(jobName)
  return res.send({ status: 'ok' })
})

v1.all('/login', (req, res) => {
  if (!req.user.admin) return res.status(401).send({ error: 'unauthorized' })
  return res.send({
    status: 'ok',
    username: req.user.username
  })
})

server.use('/v1',
  expressJwt({
    secret: process.env.AUTH_TOKEN,
    algorithms: ['HS256'],
    getToken: (req) => {
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1]
      } else if (req.query && req.query.token) {
        return req.query.token
      }
      return null
    }
  }),
  v1
)


server.use((req, res) => {
  if (req.method === 'GET') {
    res.status(404).send({
      error: 'Not found',
      message: 'The requested URL was not found on this server.'
    })
  } else {
    res.status(405).send({
      error: 'Method not allowed',
      message: 'The method is not allowed for the requested URL.'
    })
  }
})
// error handler
server.use((err, _req, res, next) => {
  logger.error(err)
  res.status(500).send({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message
  })
  next()
})

server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`)
  console.log(`your token is ${jwt.sign({ 'admin': true, username: `#${process.env.USER}@bothost` }, process.env.AUTH_TOKEN)}`)
})
