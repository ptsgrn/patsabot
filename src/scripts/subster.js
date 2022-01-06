// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const config = {
  category: 'หมวดหมู่:แม่แบบที่ควรรวมผ่านเสมอ',
  worknamespaces: ['0']
}

let workingPage = {}

async function foreachTemplatename(templatename, idx, { log, bot }) {
  log.log('debug', 'script.foreachTemplatename.start %s', templatename)
  bot.request({
    'action': 'query',
    'format': 'json',
    'prop': 'transcludedin',
    'titles': templatename,
    'utf8': 1,
    'formatversion': '2',
    'tinamespace': config.worknamespaces.join('|')
  })
    .then((json) => {
      // log.log('debug', 'script.foreachTemplatename.mass.get %o', json)
      json.query.pages.forEach(pagename => {
        workingPage[pagename.title+''] = []
        workingPage[pagename.title+''].push(templatename+'')
      })
    })
    .finally(() => {
      log.log('debug', 'script.foreachTemplatename.end %s', templatename)
    })
}

function pushPageToWorks(page, templatename) {

}

async function main({bot, log}) {
  let templateslist = []
  for await (let json of bot.continuedQueryGen({
    'action': 'query',
    'format': 'json',
    'list': 'categorymembers',
    'cmtitle': config.category,
    'cmlimit': 'max'
  })) {
    templateslist = templateslist.concat(json.query.categorymembers.map((tem) => tem.title))
    log.log('debug', 'script.templatelist.get %o', templateslist)
    log.log('debug', 'script.templatelist.foreach.start')
    bot.seriesBatchOperation(
      templateslist,
      async (templatename, idx) => {
        await foreachTemplatename(templatename, idx, { log, bot })
      },
      2000,
      2
    ).finally(()=>{
      log.log('debug', 'script.templatelist.foreach.end')
      log.log('debug', 'script.foreachTemplatename.get %o', workingPage)
    })
  }
}

module.exports = {
  id: 'subster',
  name: 'auto subster',
  desc: `subst: แม่แบบที่อยู่ในหมวดหมู่ ${config.category} โดยอัตโนมัติหากไม่ได้ทำ`,
  run: main
}