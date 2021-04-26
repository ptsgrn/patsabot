import Debug from 'debug'
import config, { PackageJsonFile } from './config'
import jsonfile from 'jsonfile'
let debug = Debug('AinalBotInternal')
let { extend } = debug
const Multi = {
  info: extend('info'),
  error: extend('error'),
  warn: extend('warn'),
}

export default debug
export {
  Multi,
}