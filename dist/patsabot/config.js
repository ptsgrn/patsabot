import { resolveRelativePath, parseJsonFile } from './utils.js';
// these are bad idea, but I will fix it as I now how ('=-=)
export let credentials = parseJsonFile(
  resolveRelativePath(import.meta.url, '../../credentials.json')
);
export let config = parseJsonFile(
  resolveRelativePath(import.meta.url, '../../config.json')
);
/**
 * processing current user informations
 */
export const loggerDir = resolveRelativePath(import.meta.url, '../../logs/');
export const user = {
  username: credentials.username,
  password: credentials.password,
  OAuthCredentials: {
    consumerToken: credentials.consumerToken,
    consumerSecret: credentials.consumerSecret,
    accessToken: credentials.accessToken,
    accessSecret: credentials.accessSecret,
  },
};
export const site = {
  siteUrl: config.config.siteUrl ?? 'https://th.wikipedia.org/w/api.php',
};
export const ircConfig = {
  /**
   * IRC server address
   * @type {String}
   */
  server: credentials?.irc?.server ?? 'irc.libera.chat',
  /**
   * IRC server port
   * @type {Number}
   * @default 6667
   * @example 6667
   */
  port: credentials?.irc?.port ?? 6667,
  /**
   * IRC user's username
   * @type {String}
   */
  userName: credentials?.irc?.username,
  /**
   * IRC user's password
   * @type {String}
   * @default ''
   */
  password: credentials?.irc?.password ?? '',
  /**
   * IRC user's real name
   * @type {String}
   * @example 'PatsaBot by Patsagorn Y. (link to github)'
   */
  realName: credentials?.irc?.realName,
  /**
   * IRC user's nickname
   * @type {String}
   */
  nickName: credentials?.irc?.nickName,
};
export const replicaCredentials = {
  /** database table username for autherization */
  username: credentials?.replica?.username,
  /** database table password for autherization */
  password: credentials?.replica?.password,
};
export const replicaConfig = {
  /**
   * database table host
   * @type {String}
   * @default '127.0.0.1'
   */
  dbHost: config?.replica?.host ?? '127.0.0.1',
  /**
   * database table port
   * @type {Number}
   * @default 3306
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
   * @default 'mysql'
   */
  dbProvider: config?.replica?.provider ?? 'mysql',
  /**
   * database url for connection
   * @type {String}
   */
  dbURL: `${config?.replica?.provider ?? 'mysql'}://${
    replicaCredentials.username
  }:${replicaCredentials.password}@${config?.replica?.host ?? '127.0.0.1'}:${
    config?.replica?.port ?? 3306
  }/${config?.replica?.database ?? 'thwiki_p'}`,
};
export const schedule = parseJsonFile(
  resolveRelativePath(import.meta.url, '../../schedule.json')
);