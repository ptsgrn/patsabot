const fs = require('fs')
const load = require('load-json-file')
const log = require('./logger')('config')
const argv = require('minimist')(process.argv.slice(2), {                               
  alias: {
    simulate: ['s', 'dry-run'],
    cron: ['date'],
    all: ['a', 'run-all', 'run'],
    credentials: ['c'],
    // loging
    silent: ['sil'],
    filelog: ['log'],
    filelogall: ['logall'],
    nofilelog: ['nologall'],
    nofilelogall: ['nofilelogall'],
    logprefix: ['logprefix'],        
    loglevel: ['loglv'],
    // site
    site: []
  }
})

function getarg(arg, type = 'string') {
  if (!argv[arg]) return undefined  
  let argvalue = argv[arg]
  if (typeof(argvalue) === type) return argvalue
  log.error('You are using argv wrongly!')
  return undefined
}

function getConfigFile() {
  return load.sync('./config.json')
}

function credentialsFile() {
  return load.sync(getarg('credentials')
    ?? argv.credentials 
    ?? getConfigFile().config.credentials)
}

function userInfo() {
  let credentials = credentialsFile()
  let username = getarg('user') 
    ?? getConfigFile().config.user 
    ?? null 
    let { 
      consumer_token, 
      consumer_secret, 
      access_token, 
      access_secret 
    } = credentials[username]
  return {
    consumer_token,
    consumer_secret,
    access_token,
    access_secret,
  }
}

function getSiteScriptUrl() {
  let url
  let siteObject = getConfigFile().site[getarg(argv.site) ?? '_default'] ?? getConfigFile().site['_default']
  url = `${siteObject[0]}//${siteObject[1] + siteObject[3]}`
  return url
}

function isDebug() {
  return !!argv.debug ?? !!getConfigFile?.log?.debug
}

function isSilent() {
  return !!argv.silent ?? !!getConfigFile?.log?.silent
}

function isSimulate() {
  return !!argv.simulate ?? !!getConfigFile?.config?.simulate
}

module.exports = exports = {
  getConfigFile: getConfigFile(),
  credentialsFile,
  userInfo,
  getSiteScriptUrl,
  isDebug,
  isSilent,
  isSimulate,
}
