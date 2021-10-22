// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const config = {
  category: 'หมวดหมู่:แม่แบบที่ควรรวมผ่านเสมอ',
  worknamespaces: ['*']
}

let workingPage = {}

async function foreachTemplatename(templatename, idx, { log, bot }) {
  log.log('debug', 'script.foreachTemplatename.start', {data: templatename})
  const response = await bot.request({
    'action': 'query',
    'format': 'json',
    'prop': 'transcludedin',
    'titles': 'แม่แบบ:ยินดีต้อนรับ',
    'utf8': 1,
    'formatversion': '2',
    'tinamespace': config.worknamespaces.join('|')
  })
  response.query.pages[0].transcludedin.forEach(page => {
    workingPage[page.title+''] = []
    workingPage[page.title+''].push(templatename)
  })
  log.log('debug', 'script.foreachTemplatename.end', {data: templatename})
  console.log(workingPage)
}

function pushPageToWorks(page, templatename) {
  console.log(page, templatename)
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
    log.log('debug', 'script.templatelist.get', {data: templateslist})
    log.log('debug', 'script.templatelist.foreach.start')
    bot.seriesBatchOperation(
      templateslist,
      async (templatename, idx) => {
        await foreachTemplatename(templatename, idx, { log, bot })
      },
      10,
      2
    ).finally(()=>{
      log.log('debug', 'script.templatelist.foreach.end')
      log.log('debug', 'script.foreachTemplatename.get', {data: workingPage})
    })
  }
}

module.exports = {
  id: 'subster',
  name: 'auto subster',
  desc: `subst: แม่แบบที่อยู่ในหมวดหมู่ ${config.category} โดยอัตโนมัติหากไม่ได้ทำ`,
  run: main
}