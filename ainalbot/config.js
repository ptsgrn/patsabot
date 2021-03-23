const fs = require('fs')
var log = require('./logger')
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
  }
})


const config = {
  configFile: function () {
    return require(typeof(argv.configfile) == 'string' ? argv.configfile : '../config.json')
  },
  credentialsFile: () => {
    return require(typeof(argv.credentials) == 'string' ? argv.credentials : this.configFile.config.credentials)
  },
  userInfo: function () {
    
  },
  isDebug: argv.debug ?? this.configFile?.log?.debug,
  isSilent: argv.silent ?? this.configFile?.log?.silent,
}

module.exports = exports = config

