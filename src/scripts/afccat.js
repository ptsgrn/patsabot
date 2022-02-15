// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import bot from '../patsabot/bot.js'
import moment from 'moment'
import meow from 'meow'

const cli = meow(`
	Usage
	  $ patsabot afccat [options]

	Options
	  --date, -d	Date to create the category.
		--dry-run, -n	Do not actually create the category, just test.

	Examples
	  $ patsabot afccat -d 2020-01-01 -d 2020-01-02 -d 2020-01-03
		Create categories for 2020-01-01, 2020-01-02, and 2020-01-03.
`, {
  importMeta: import.meta,
  booleanDefault: undefined,
  flags: {
    date: {
      type: 'string',
      default: [moment().format('DD MMMM yyyy')],
      alias: 'd',
      isMultiple: true
    },
    dryRun: {
      type: 'boolean',
      default: false,
      alias: 'n',
    },
  }
})

moment.locale('th')
let categories = cli.flags.date.map(date => {
  if (!moment(date, 'YYYY-MM-DD').isValid()) return null
  return `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('DD MMMM yyyy')}`
})

cli.flags.date.forEach(date => {
  categories.push(`หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('MMMM yyyy')}`)
  categories.push(`หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('yyyy')}`)
})

// no null and unique
categories = categories
  .filter(c => c !== null)
  .filter((c, i, a) => a.indexOf(c) === i)

if (isNaN(categories.length) || categories.length === 0) {
  bot.log('[W] No categories to create.')
  process.exit(0)
}

bot.log('[I] Categories to create: ' + categories.join(', '))

bot.batchOperation(
  categories,
  (page) => {
    return new Promise((resolve, reject) => {
      if (cli.flags.dryRun) {
        bot.log('[W] Dry run, not creating category: ' + page)
        resolve()
      }
      if (page.indexOf('หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/') === -1 || page ===  'หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/Invalid date') return reject()
      bot.save(
        page,
        '{{AfC submission category header}}',
        'สร้างหมวดหมู่ฉบับร่าง ([[user:PatsaBot/task/1|Task #1]])',
        {
          // do not edit the page if it already exists
          'createonly': 1
        }
      )
        .then(resolve)
        .catch(reject)
    })
  },
  1,
  1
).then(() => {
  bot.log('[I] Done.')
})

export default {
  desc: 'Create categories for AfC submissions.'
}
