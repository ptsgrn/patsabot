// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { mwnVersion, version } from "./version.js";
import { mwn } from "mwn";

const bot = new mwn({
  apiUrl: process.env.BOT_API_URL || "https://th.wikipedia.org/w/api.php",
  OAuthCredentials: {
    consumerToken: process.env.BOT_CONSUMER_TOKEN,
    consumerSecret: process.env.BOT_CONSUMER_SECRET,
    accessToken: process.env.BOT_ACCESS_TOKEN,
    accessSecret: process.env.BOT_ACCESS_SECRET,
  },
  // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
  userAgent: `PatsaBot/${version} ([[m:User:Patsagorn Y.]]) mwn/${mwnVersion}`,
  defaultParams: {
    assert: "user", // ensure we're logged in
  },
});

await bot.initOAuth();
await bot.getTokensAndSiteInfo();

export default bot;
