import config from './ainalbot/config'
import Bree from 'bree'
import path from 'path'

if (config.help) config.help()

const bree = new Bree({
  logger: console,
  root: path.resolve('dist/tasks')
})

bree.start()

