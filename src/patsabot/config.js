// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import _jsonfile from 'jsonfile'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
const { readFileSync } = _jsonfile
const credentials = readFileSync('credentials.json')

/**
 * processing current user informations
 */
export const loggerDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../logs/')
export const user = {
  username: credentials.username,
  password: credentials.password,
  OAuthCredentials: {
    'consumerToken': credentials.consumerToken,
    'consumerSecret':  credentials.consumerSecret,
    'accessToken': credentials.accessToken,
    'accessSecret':  credentials.accessSecret
  }
}
export const site = {
  /**
   * internet URL of site
   * @type {String}
  */
  // TODO: make a new cli option to overide this
  siteUrl: 'https://th.wikipedia.org/w/api.php'
}