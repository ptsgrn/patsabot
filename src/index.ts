import config from './ainalbot/config'
import Bree from 'bree'
import path from 'path'
import log, { Multi } from './ainalbot/logger'
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

if (config.help) config.help()

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

