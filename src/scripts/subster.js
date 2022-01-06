// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

let category = 'หมวดหมู่:แม่แบบที่ควรรวมผ่านเสมอ'
let templateslist = []

async function main({bot, log}) {
  log.log('info', 'start')
  for await (let json of bot.continuedQueryGen({
    'action': 'query',
    'format': 'json',
    'list': 'categorymembers',
    'cmtitle': category,
    'cmlimit': 'max'
  })) {
    templateslist = templateslist.concat(json.query.categorymembers.map((tem) => tem.title))
    log.log('info', 'end')
  }
}

module.exports = {
  id: 'subster',
  name: 'auto subster',
  desc: `subst: แม่แบบที่อยู่ในหมวดหมู่ ${category} โดยอัตโนมัติหากไม่ได้ทำ`,
  run: main
}