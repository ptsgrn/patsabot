const fs = require('fs')
var log = require('./logger')('config')
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
  let argvalue = argv[arg]
  if (typeof(argvalue) === type) return argvalue
  log.error('You are using argv wrongly!')
  return false
}

const config = {
  getConfigFile: function () {
    return require(typeof(argv.configfile) == 'string' 
      ? argv.configfile 
      : '../config.json')
  },
  credentialsFile: () => {
    return require(typeof(argv.credentials) == 'string' 
      ? argv.credentials 
      : this.configFile.config.credentials)
  },
  userInfo: function () {
    
  },
  getSiteURL: function() {
    return this.getConfigFile.site[getarg(argv.site) ?? '_default']
  },
  isDebug: !!argv.debug ?? !!this.configFile?.log?.debug,
  isSilent: !!argv.silent ?? !!this.configFile?.log?.silent,
  isSimulate: !!argv.simulate ?? !!this.configFile?.config?.simulate,
}

module.exports = exports = config
