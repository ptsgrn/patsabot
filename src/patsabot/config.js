// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import _jsonfile from 'jsonfile'
import { resolveRelativePath, parseJsonFile} from './utils.js'

// these are bad idea, but I will fix it as I now how ('=-=)
export let credentials = parseJsonFile(resolveRelativePath(import.meta.url, '../../credentials.json'))
export let config = parseJsonFile(resolveRelativePath(import.meta.url, '../../config.json'))

/**
 * processing current user informations
 */
export const loggerDir = resolveRelativePath(import.meta.url, '../../logs/')
export const user = {
  username: credentials.username,
  password: credentials.password,
  OAuthCredentials: {
    'consumerToken': credentials.consumerToken,
    'consumerSecret': credentials.consumerSecret,
    'accessToken': credentials.accessToken,
    'accessSecret':  credentials.accessSecret
  }
}
export const site = {
  /**
   * internet URL of site
   * @type {String}
  */
  siteUrl: config.siteUrl ?? 'https://th.wikipedia.org/w/api.php'
}

export const replicaCredentials = {
  /**
   * database table username for autherization
   * @type {String}
   */
  username: credentials?.replica?.username
    ?? credentials?.replica?.user,
  /**
   * database table password for autherization
   * @type {String}
   */
  password: credentials?.replica?.password,
}

export const replicaConfig = {
  /**
   * database table host
   * @type {String}
   */
  dbHost: config?.replica?.host ?? "127.0.0.1",
  /**
   * database table port
   * @type {Number}
   */
  dbPort: config?.replica?.port ?? 3306,
  /**
   * database name
   * @type {String}
   * @default 'thwiki_p'
   */
  dbName: config?.replica?.database ?? 'thwiki_p',
  /**
   * database provider
   * @type {String}
   * @default 'mongodb'
   */
  dbProvider: config?.replica?.provider ?? 'mysql',
  /**
   * database url for connection
   * @type {String}
   */
  dbURL: `${config?.replica?.provider ?? 'mysql'}://${replicaCredentials.username}:${replicaCredentials.password}@${config?.replica?.host ?? "127.0.0.1"}:${config?.replica?.port ?? 3306}/${config?.replica?.database ?? 'thwiki_p'}`,
}