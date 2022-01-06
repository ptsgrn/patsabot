import config from './ainalbot/config'
import Bree from 'bree'
import path from 'path'
import log, { Multi } from './ainalbot/logger'
import jobs from './tasks'

if (config.help) config.help()

const bree = new Bree({
  logger: Multi,
  root: path.resolve('./dist/tasks'),
  jobs,
})
console.log(jobs)
bree.start()

