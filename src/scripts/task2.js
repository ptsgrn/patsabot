import { workerData } from 'worker_threads'
import debug from '../ainalbot/logger'
const log = debug.extend('task2')
import bot from '../ainalbot/bot'

bot.request({
	"action": "query",
	"format": "json",
	"meta": "userinfo",
})
  .then(data => {
    log('data: %o', data.query)
  })
  .catch(err=>{
    log(err)
  })

