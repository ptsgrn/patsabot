'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const mwn_1 = require('mwn')
const config_1 = require('./config')
const config_2 = require('../config')
const bot = mwn_1.mwn.init({
  apiUrl: `${config_1.getSiteScriptUrl}/api.php`,
  OAuthCredentials: {
    consumerToken: config_2.consumer_token,
    consumerSecret: config_2.consumer_secret,
    accessToken: config_2.access_token,
    accessSecret: config_2.access_secret,
  }
})
console.log(`
		consumerToken: ${config_2.consumer_token},
		consumerSecret: ${config_2.consumer_secret},
		accessToken: ${config_2.access_token},
		accessSecret: ${config_2.access_secret},
`)
