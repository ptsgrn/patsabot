const bot = require('../ainalbot/bot')
bot.request({
  'action': 'query',
  'format': 'json',
  'meta': 'userinfo',
})
  .then(data => {
    console.log(data.query)
  })
  .catch(err=>{
    console.log(err)
  })

