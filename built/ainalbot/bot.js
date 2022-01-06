"use strict";
const { mwn } = require('mwn');
const { getSiteScriptUrl } = require('./config');
const { consumer_token, consumer_secret, access_token, access_secret } = require('../config').userInfo();
const bot = mwn.init({
    apiUrl: `${getSiteScriptUrl}/api.php`,
    OAuthCredentials: {
        consumerToken: consumer_token,
        consumerSecret: consumer_secret,
        accessToken: access_token,
        accessSecret: access_secret,
    }
});
console.log(`
		consumerToken: ${consumer_token},
		consumerSecret: ${consumer_secret},
		accessToken: ${access_token},
		accessSecret: ${access_secret},
`);
