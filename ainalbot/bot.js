const { mwn } = require('mwn')
const { getSiteURL } = require('./config')

/*
const bot = await mwn.init({
	apiUrl: ,// 'https://en.wikipedia.org/w/api.php',

	// Can be skipped if the bot doesn't need to sign in
	username: 'YourBotUsername',
	password: 'YourBotPassword',

	// Instead of username and password, you can use OAuth 1.0a to authenticate,
	// if the wiki has Extension:OAuth enabled
	OAuthCredentials: {
		consumerToken: "16_DIGIT_ALPHANUMERIC_KEY",
		consumerSecret: "20_DIGIT_ALPHANUMERIC_KEY",
		accessToken: "16_DIGIT_ALPHANUMERIC_KEY",
		accessSecret: "20_DIGIT_ALPHANUMERIC_KEY"
	}
    */
console.log(getSiteURL())