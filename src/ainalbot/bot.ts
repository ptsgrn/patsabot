import { mwn } from 'mwn'
import config, { Site, User } from './config'

const site = new Site(),
   user = new User(),
  { getKeyOf, getUserAgent } = user

const bot = new mwn({
  apiUrl: site.getSiteApiUrl(),
  username: config.username,
  OAuthCredentials: {
    accessSecret: getKeyOf('consumer_secret'),
    accessToken: getKeyOf('consumer_token'),
    consumerSecret: getKeyOf('access_secret'),
    consumerToken: getKeyOf('access_token'),
  },
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

bot.login() // ให้บอตเตรียมเข้าสู่ระบบ
bot.getTokensAndSiteInfo() // จุดนี้เข้าสู่ระบบจริง ๆ อ้างอิงตามคู่มือของ mwn

export default bot
