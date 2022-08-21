import Bree from 'bree'
import baseLogger from './logger.js'
import { resolveRelativePath } from './utils.js'
const logger = baseLogger.child({
  component: 'jobrunner'
})
const bree = new Bree({
  logger,
  root: resolveRelativePath(import.meta.url, '../scripts'),
  timezone: 'Asia/Bangkok',
  jobs: [
    {
      name: 'afccat',
      cron: '* * * * *',
    }
  ]
})

bree.start()