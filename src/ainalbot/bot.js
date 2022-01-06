// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { site, user } from './config.js'

import log from './logger.js'
import { mwn } from 'mwn'

const bot = new mwn({
  apiUrl: site.siteUrl,
  OAuthCredentials: {
    ...user.OAuthCredentials
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

/**
 * Get page transcluding.
 * @param {string} page Pages to get transcludings.
 * @param {string} [options.tiprop] Which properties to get
 * @param {string} [options.tinamespace] Only include pages in these namespaces.
 * @param {'redirect' | '!redirect'} [options.tishow] Show only items that meet these criteria.
 * @param {('max' | 'number')} [options.tilimit="max"] How may to return.
 * @returns {Promise<string[]> | Promise<[]>} array of page that the page has been transcluded in.
 */
export async function getPageTranscluding(page, options = {}) {
  if (typeof page !== 'string' || page.split().includes('|')) {
    log.log('apierror', 'page must be a string and not contain pipe character.', { from: 'internal:bot#getPageTranscluding', id: 'invalid-page' })
    return []
  }
  let results = []
  try {
    for await (let json of bot.continuedQueryGen({
      action: 'query',
      prop: 'transcludedin',
      titles: page,
      tilimit: 'max',
      ...options,
      'formatversion': '2',
    })) {
      results = results.concat(json.query.pages[0].transcludedin.map((page) => page.title))
    }
  } catch (err) {
    log.log('apierror', err, { from: 'internal:bot#getPageTranscluding', id: 'query-error' })
  }
  log.log('debug', `getPageTranscluding: ${results.length} results.`, { from: 'internal:bot#getPageTranscluding', id: 'query-success' })
  return results
}

/**
 * Get pages in category.
 * @param {string} category Category to get pages.
 * @param {string} [options.cmtype] Only include pages in these types.
 * @param {string} [options.cmlimit="max"] How may to return.
 * @returns {Promise<string[]> | Promise<[]>} array of page that the category has.
 */
export async function getCategoryMembers(category, options = {}) {
  if (typeof category !== 'string' || category.split().includes('|')) {
    log.log('apierror', 'category must be a string and not contain pipe character.', { from: 'internal:bot#getCategoryMembers', id: 'invalid-category' })
    return []
  }
  let results = []
  try {
    for await (let json of bot.continuedQueryGen({
      action: 'query',
      list: 'categorymembers',
      cmlimit: 'max',
      cmtitle: category,
      ...options,
      'formatversion': '2',
    })) {
      results = results.concat(json.query.categorymembers.map((page) => page.title))
    }
  } catch (err) {
    log.log('apierror', err, { from: 'internal:bot#getCategoryMembers', id: 'query-error' })
  }
  log.log('debug', `getCategoryMembers: ${results.length} results.`, { from: 'internal:bot#getCategoryMembers', id: 'query-success' })
  return results
}

export default bot
