import { mwn } from 'mwn'
import { getSiteScriptUrl } from './config'
import { consumer_token,
  consumer_secret,
  access_token,
  access_secret
} from '../config'

const bot = mwn.init({
	apiUrl: `${getSiteScriptUrl}/api.php`,
	OAuthCredentials: { 
		consumerToken: consumer_token,
		consumerSecret: consumer_secret,
		accessToken: access_token,
		accessSecret: access_secret,
	}
})

console.log(`
		consumerToken: ${consumer_token},
		consumerSecret: ${consumer_secret},
		accessToken: ${access_token},
		accessSecret: ${access_secret},
`)
