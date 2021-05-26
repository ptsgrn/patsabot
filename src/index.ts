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

// Variables
const site = new Site(),
   user = new User(),
  { getKeyOf, getUserAgent } = user

class AinalBOT {
  constructor() {
    this.tasks = new Map()
    console.log(0)
  }
  bot = async () => {
    const bot = await mwn.init({
      apiUrl: site.getSiteApiUrl(),
      OAuthCredentials: {
        consumerSecret: getKeyOf('consumer_secret'),
        consumerToken: getKeyOf('consumer_token'),
        accessSecret: getKeyOf('access_secret'),
        accessToken: getKeyOf('access_token'),
      },
      password: getKeyOf('password'),
      username: config.username,
      userAgent: getUserAgent(),
      silent: !config.debug,
      maxRetries: 7,
      defaultParams: {
        assert: 'user', // keep logged-in
      },
      shutoff: {
        onShutoff: (wikitext: string): void => {
          // throw and exit(1)
          throw new Error('Bot had been shutted off\nPage text is ⟩' + wikitext)
          process.exit(1)
        },
        page: 'User:AinalBOT/shutoff',
        condition: (wikitext: string): boolean => {
          // if (wikitext !== 'running') return false // ถ้าข้อความไม่ใช่ 'running' ให้หยุด
          return true
        }
      }
    })
    return bot
  }
  start() {
    
  }
}

if (config.help) config.help()
if (require.main !== module) process.abort()
new AinalBOT.start()
