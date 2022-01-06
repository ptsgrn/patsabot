const text:String = "Hello world"
import debug from '../ainalbot/logger'
const log = debug.extend('task1')


setTimeout(function(){
  log(text)
}, 3*1000)

