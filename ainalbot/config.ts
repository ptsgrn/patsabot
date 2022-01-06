import * as load from 'load-json-file'
import yargs from 'yargs/yargs'
const argv = yargs(process.argv.slice(2)).options({
  user: { type: 'string' },
  credentials: { type: 'string' }, 
})
  .argv
