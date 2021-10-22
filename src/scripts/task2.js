module.exports = {
  id: 'task2',
  name: 'test task 2',
  run: function _run({bot, log}) { 
    bot.request({
      'action': 'query',
      'format': 'json',
      'meta': 'userinfo',
    })
      .then(data => {
        log.log('info', data.query)
      })
      .catch(err => {
        log.log('error', err)
      })
  }
}