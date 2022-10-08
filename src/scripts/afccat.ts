// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import bot from '../patsabot/bot.js'
import moment from 'moment'
import meow from 'meow'
import baseLogger from '../patsabot/logger.js'
import cuid from 'cuid'

const logger = baseLogger.child({
  script: 'afccat',
  runId: `run-${cuid()}`
})

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
      default: [],
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

logger.debug('script parameters', cli.flags)
process.env.TZ = 'Asia/Bangkok'
moment.locale('th')
if (cli.flags.date.length === 0) cli.flags.date = [moment().format('YYYY-MM-DD')]
let categories = cli.flags.date.map(date => {
  if (date === 'today') date = moment().format('YYYY-MM-DD')
  if (!moment(date, 'YYYY-MM-DD').isValid()) return null
  return `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('DD MMMM yyyy')}`
})

cli.flags.date.forEach(date => {
  if (date === 'today') date = moment().format('YYYY-MM-DD')
  categories.push(`หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('MMMM yyyy')}`)
  categories.push(`หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${moment(date).format('yyyy')}`)
})

// no null and unique
categories = categories
  .filter(c => c !== null)
  .filter((c, i, a) => a.indexOf(c) === i)

if (isNaN(categories.length) || categories.length === 0) {
  logger.log('info', 'No categories to create.')
  process.exit(0)
}

logger.log('info', 'Categories to create: ' + categories.join(', '))
logger.log('debug', 'categories', categories)

bot.batchOperation(
  categories,
  (page) => {
    return new Promise((resolve, reject) => {
      if (cli.flags.dryRun) {
        logger.log('info', '[W] Dry run, not creating category: ' + page)
        resolve('dryrun')
      }
      if (page.indexOf('หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/') === -1 || page === 'หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/Invalid date') return reject()
      bot.save(
        page,
        '{{AfC submission category header}}',
        'สร้างหมวดหมู่ฉบับร่าง ([[user:PatsaBot/task/1|Task #1]])',
        {
          // do not edit the page if it already exists
          'createonly': true
        }
      )
        .then(resolve)
        .catch(reject)
    })
  },
  1,
  1
).then(() => {
  logger.log('debug', 'done')
})

export default {
  desc: 'Create categories for AfC submissions.'
}
