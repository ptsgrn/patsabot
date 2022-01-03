// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MI

import { DateTime } from '../patsabot/utils.js'

async function savePage({ bot, log }) {
  const tomorrowDate = DateTime.format('DD MMMM yyyy')
  log.log('debug', 'script.main.prepare', { data: `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${tomorrowDate}` })
  try {
    return bot.save(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${tomorrowDate}`, // page title
      '{{AfC submission category header}}', // content
      'สร้างหมวดหมู่ฉบับร่าง ([[user:PatsaBot/task/1|Task #1]])', // summary
      {
        // do not edit the page if it already exists
        'createonly': 1
      })
  } catch (e) {
    log.error('script.main.error', { data: e })
  } finally {
    log.log('debug', 'script.main.done', { data: `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${tomorrowDate}` })
  }
}

async function main({ bot, log }) {
  // shutoff option
  bot.enableEmergencyShutoff({
    // The name of the page to check
    page: 'User:PatsaBot/shutoff/1',

    // check shutoff page every 5 seconds
    intervalDuration: 5000,

    // function to determine whether the bot should continue to run or not
    condition: (pagetext) => pagetext === 'on',
    // function to trigger when shutoff is activated
    onShutoff: function (pagetext) {
      log.error('bot.shutoff', {pagetext})
      // let's just exit, though we could also terminate
      // any open connections, close files, etc.
      // process.exit(0)
    }
  })
  return savePage({ bot, log })
}

export const id = 1 // task id
export const name = 'Create AfC Daily category'
export const desc = 'This script is base on https://github.com/earwig/earwigbot-plugins/blob/develop/tasks/afc_dailycats.py and adapted to javascript.'
export const excluderegex = false
export const schedule = '0 0 * * *'
export const run = main