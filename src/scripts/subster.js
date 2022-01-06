// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const bot = require('../ainalbot/bot')

let category = 'แม่แบบที่ควรรวมผ่านเสมอ'

async function main() {
  let templateslist = []
  for await (let json of bot.continuedQueryGen({
    'action': 'query',
    'format': 'json',
    'list': 'categorymembers',
    'cmtitle': category,
    'cmlimit': 'max'
  })) {
    let templates = json.query.categorymembers.map((tem) => tem.title)
    templateslist = templateslist.concat(templates)
    console.log(templateslist)
  }
}

module.exports = {
  desc: `subst: แม่แบบที่อยู่ในหมวดหมู่ ${category} โดยอัตโนมัติหากไม่ได้ทำ`,
  excluderegex: false,//i,
  run: main
}