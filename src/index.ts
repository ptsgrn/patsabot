interface JobsOptions {
  name: string
  path?: string
  timeout?: Number | Object | string | boolean
  interval?: Number | Object | string
  date?: Date
  cron?: string
  hasSeconds?: boolean
  cronValidate?: Object
  closeWorkerAfterMs?: Number
  worker?: Object
  outputWorkerMetadata?: boolean
}
interface AinalBOT {
  tasks: Map<string, VoidFunction>
  bot(): Promise<mwn> 
  start(): void
}
type Jobs = JobsOptions[] | string[]

// NodeJS internal
import path from 'path'

// Packages
import Bree from 'bree'
import { mwn } from 'mwn'

// Bot's internal
import scripts from './tasks/index'
import log, { Multi } from './ainalbot/logger'
import config, { Site, User } from './ainalbot/config'
import bot from './ainalbot/bot'

interface JobsOptions {
  name: string
  path?: string
  timeout?: Number | Object | string | boolean
  interval?: Number | Object | string
  date?: Date
  cron?: string
  hasSeconds?: boolean
  cronValidate?: Object
  closeWorkerAfterMs?: Number
  worker?: Object
  outputWorkerMetadata?: boolean
}

type Jobs = JobsOptions[] | string[]

interface JobsOptions {
  name: string
  path?: string
  timeout?: Number | Object | string | boolean
  interval?: Number | Object | string
  date?: Date
  cron?: string
  hasSeconds?: boolean
  cronValidate?: Object
  closeWorkerAfterMs?: Number
  worker?: Object
  outputWorkerMetadata?: boolean
}

type Jobs = JobsOptions[] | string[]

// Variables
const site = new Site(),
   user = new User(),
  { getKeyOf, getUserAgent } = user

const bree = new Bree({
  logger: Multi,
  root: path.resolve('./dist/tasks'),
  jobs: [
    {
      name: 'task2',
    },
  ],
  worker: {
    workerData: {
      text: 'feat',
    } 
  }
})

bree.start()

if (config.help) config.help()
if (require.main !== module) process.abort()
new AinalBOT.start()