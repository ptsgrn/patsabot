import { mwn } from 'mwn'
import config, { Site, User } from './config'

const site = new Site(),
   user = new User(),
  { getKeyOf, getUserAgent } = user

const bot = new mwn({
  apiUrl: site.getSiteApiUrl(),
  username: getKeyOf(''),
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
    assert: 'user',
  },
  shutoff: {
    onShutoff: (_) => {
      throw new Error('Bot had been shutted off')
    }
  }
})

bot.login()
bot.getTokensAndSiteInfo()

export default bot
