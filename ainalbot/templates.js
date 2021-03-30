require('cejs')
const Wikiapi = require('wikiapi')
const log = require('./logger')('templates')

const template_parser = {
  template: function (wikitext, name) {
    let template = {}
    let parsed = CeL.wiki.parse(wikitext)
    parsed.forEach((t)=>{
      if (t.name !== name) return
      t.forEach((t)=>{
        if (!t.key) return
        template[t.key] = t[2].toString()
      })
    })
    return template
  }
}

module.exports = template_parser

