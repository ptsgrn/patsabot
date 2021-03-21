const mwn = require('mwn')
const argv = require('minimist')(process.argv.slice(2), {
  alias: {
    simulate: ['s', 'dry-run'],
    cron: ['c', 'date'],
    all: ['a', 'run-all', 'run']
  }
})
const config = require('./ainalbot/config').userInfo(argv, './credentials.json')

// console.log(config)
