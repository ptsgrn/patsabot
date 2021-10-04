// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const readjson = require('jsonfile')
const credentials = readjson.readFileSync('credentials.json')
const { resolve } = require('path')

/**
 * processing current user informations
 */
module.exports = {
  loggerDir: resolve(__dirname, '../../../logs/'),
  user: {
    OAuthCredentials: {
      ...credentials
    }
  },
  /**
   * current site information object
   */
  site: {
    /**
     * internet URL of site
     * @type {String} 
     */
    siteUrl: 'https://th.wikipedia.org/w/api.php'
  }
}