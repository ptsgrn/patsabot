<<<<<<< HEAD

=======
import { mwn } from 'mwn'
import config, { Site, User } from './config'
import debug from './logger'
const log = debug.extend('bot')

const site = new Site(),
   user = new User(),
  { getKeyOf, getUserAgent } = user

let bot = new mwn({
// const bot = await mwn.init({
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
      if (wikitext !== 'running') return false // ถ้าข้อความไม่ใช่ 'running' ให้หยุด
      return true
    }
  }
})

bot.login()
bot.getTokensAndSiteInfo()

export default bot

/*
bot.initOAuth()
bot.getTokensAndSiteInfo()
*/

<<<<<<< HEAD
>>>>>>> main
=======
>>>>>>> main
