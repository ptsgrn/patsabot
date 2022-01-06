// Copyright (c) 2021 Patsagorn Y.
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { getPageTranscluding } from '../patsabot/bot.js'
import { parse } from '../patsabot/utils.js'

const config = {
  category: 'หมวดหมู่:แม่แบบที่ควรรวมผ่านเสมอ',
  worknamespaces: [0, 1, 2, /*3, 4,*/ 5, 6, 7, 9, 11, 12, 13, 14,
    15, 100, 101, 109, 108, 118, 119, 829, 2301, 2303],
  templatePerBatch: 5,
  maxRetryPerBatch: 1,
}

/**
 * run on each template
 * @param  {String[]} templatename
 * @param  {winston} others.log
 * @param  {mwn} others.bot
 */
async function foreachTemplatename(templatename, { log, bot }) {
  let workingPages = {}
  await bot.batchOperation(
    templatename,
    async (template) => {
      let pages = getPageTranscluding(template)
      for (const page of pages) {
        if (!workingPages[page]) workingPages[page] = []
        workingPages[page].push(template)
      }
    },
    config.templatePerBatch,
    config.maxRetryPerBatch
  )
  log.log('info', 'script.foreachTemplatename.found', { data: workingPages })
  await substPages(workingPages, { log, bot })
}

/**
 * process subst on each template
 * @param {{String:String[]}} workingPages working page list, Pagename that have to
 *     process is key, template have to subst is value in String[]
 * @param {Bot} additional.bot mwn class
 * @param {Logger} additional.log winstone class
 */
async function substPages(workingPages, { log, bot}) {
  for (const page in workingPages) {
    await bot.edit(page, ({ content }) => {
      log.log('debug', 'script.substPages.editing', {data: page})
      let parser = parse(content)
      workingPages[page] = workingPages[page].map(item => {
        if (!item) return
        return item.split(':')[1]
      })
      log.log('debug', 'script.substPages.haveto', { data: workingPages[page] })
      parser.each('template', function processTemplate(template) {
        // list of template that have to subst is prefixing with "แม่แบบ" take it of
        if (!workingPages[page].includes(template.name)) return
        log.log('debug', 'script.substPages.willSubst', { data: template.name })
        template[0] = 'subst:' + template[0]
        return template.toString()
      })
      console.log('=============\n', parser.toString())
      // return {
      //   text: parser.toString(),
      //   summary: 'replacing foo with bar',
      //   minor: true
      // }
    })
  }
}

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
    await foreachTemplatename(templateslist, { bot, log })
  }
}

export const id = 'subster'
export const name = 'auto subster'
export const desc = `subst: แม่แบบที่อยู่ในหมวดหมู่ ${config.category} โดยอัตโนมัติหากไม่ได้ทำ`
export const run = main