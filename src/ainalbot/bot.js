// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const { mwn } = require('mwn')
const config = require('./config')

const bot = new mwn({
  apiUrl: config.site.siteUrl,
  // username: 'YourBotUsername',
  // password: 'YourBotPassword',
  OAuthCredentials: {
    ...config.user.OAuthCredentials
  },
  // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
  userAgent: 'AinalBOT/0.0.2-alpha ([[m:User:Patsagorn Y.]]) mwn/0.9.1',
  defaultParams: {
    assert: 'user' // ensure we're logged in
  },
  exclusionRegex: /\{\{nobots\}\}/i
})

bot.initOAuth()
bot.getTokensAndSiteInfo()

module.exports = bot