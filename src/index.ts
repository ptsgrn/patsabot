import config from './ainalbot/config'
import Bree from 'bree'
import Cabin from 'cabin'
import path from 'path'

if (config.help) config.help()

const bree = new Bree({
  logger: new Cabin(),
  root: path.resolve('dist/tasks'),
  jobs: [
    'task1',
  ]
})

bree.start()

