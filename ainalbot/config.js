const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2), {                               
    alias: {
      simulate: ['s', 'dry-run'],
      cron: ['date'],
      all: ['a', 'run-all', 'run'],
      credentials: ['c'],
    }
})


const config = {
  readConfig: (file) => {
    fs.access(file, (err) => {
      if (err) {
        fs.appendFile(file, '{}', (err) => {
          if (err) {
            console.error(`cannot create ${file} to write: ${err.message}`)
            process.exit(0)
          } // if write error
          console.warn(`seem like ${file} did not exist and just create one. please edit and add information before do anything else!`)
          process.exit(0)
        })
      } else {
        return require(file)
      }
    })
  },
  userInfo: function () {
    let file = () => {
      if (typeof argv.credentials === string) { argv.credentials } else { './credentials.json' } 
    }
    config.readConfig(file)
  }
}

module.exports = config
