const fs = require('fs')
const argv = require('minimist')(process.argv.    slice(2), {                               
    alias: {
      simulate: ['s', 'dry-run'],
      cron: ['c', 'date'],
      all: ['a', 'run-all', 'run']
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

      }
    })
  },
  userInfo: function (argv, file) {
    config.readConfig(file)
  }
}

module.exports = config
