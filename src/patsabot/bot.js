// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT
import { mwnVersion, version } from './version.js';
import { site, user } from './config.js';
import { mwn } from 'mwn';
const bot = new mwn({
    apiUrl: site.siteUrl,
    OAuthCredentials: {
        ...user.OAuthCredentials
    },
    // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
    userAgent: `PatsaBot/${version} ([[m:User:Patsagorn Y.]]) mwn/${mwnVersion}`,
    defaultParams: {
        assert: 'user' // ensure we're logged in
    }
});
await bot.initOAuth();
await bot.getTokensAndSiteInfo();
export default bot;
