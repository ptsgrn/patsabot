// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const config = {
  category: 'หมวดหมู่:แม่แบบที่ควรรวมผ่านเสมอ',
  worknamespaces: ['*']
}

// let workingPage = {}
/**
 * run on each template
 * @param  {String[]} templatename
 * @param  {winston} others.log
 * @param  {mwn} others.bot
 */
// async function foreachTemplatename(templatename, { log, bot }) {
  
// }

/**
 * @param  {mwn} bot
 * @param  {winston} log
 */
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
    log.log('debug', 'script.templateslist.request.get', {data: templateslist})
    // await foreachTemplatename(templateslist, {bot, log})
  }
}

export const id = 'subster'
export const name = 'auto subster'
export const desc = `subst: แม่แบบที่อยู่ในหมวดหมู่ ${config.category} โดยอัตโนมัติหากไม่ได้ทำ`
export const run = main