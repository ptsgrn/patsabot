// Copyright (c) 2022 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { version } from '../patsabot/version.js'
import chalk from 'chalk'
import bot from '../patsabot/bot.js'
import moment from 'moment'

(async () => { 
  await bot.getSiteInfo()
  bot.request({
    'action': 'query',
    'format': 'json',
    'meta': 'siteinfo|userinfo',
    'siprop': 'general',
    'uiprop': '*'
  }).then((data) => {
    let userinfo = data.query.userinfo
    let siteinfo = data.query.general
    console.info(`
  ${chalk.white.underline.bold(`Patsabot v${version}`)}                                         ${chalk.grey.bgBlueBright('      ')}
                                                          ${chalk.grey.bgBlueBright(' PTS  ')}
  ${chalk.white.underline('USER INFO')}                                               ${chalk.grey.bgBlueBright('  GRN ')}
  ${userinfo.id ?
    chalk.green('Logged in as: ') + userinfo.name.padEnd(42, ' ') + chalk.grey.bgBlueBright('      ') + '\n'
        + chalk.green('  User regist date: ') + moment(userinfo.registrationdate).fromNow() + ' (' + userinfo.registrationdate + ')\n'
        + chalk.green('  User ID: ') + userinfo.id + '\n'
        + chalk.green('  Edit count(s): ') + userinfo.editcount + '\n'
        + chalk.green('  Latest contrib: ') + moment(userinfo.latestcontrib).fromNow() + '\n'
    : chalk.red('  [Not logged in]                                         ') + chalk.grey.bgBlueBright('      ') + '\n'
  }  ${chalk.green('Is bot:')} ${userinfo.groups.includes('bot') ? chalk.bgGreen(' BOT ') : chalk.bgRed(' NO ')}
  ${chalk.green('User groups:')} ${userinfo.groups.join(', ')}
  ${chalk.green('User groups membership:')} ${userinfo.groupmembership ? userinfo.groupmembership.join(', ') : '-'}
  ${chalk.green('Unreaded messages:')} ${userinfo.messages ? chalk.grey.bgBlueBright(userinfo.messages.black.join(', ')) : '-'}
  ${chalk.green('Unseen watchlist count:')} ${userinfo.unreadcount ? userinfo.unreadcount : '-'}

  ${chalk.white.underline('SITE INFO')}
  ${chalk.green('Site name:')} ${siteinfo.sitename}
  ${chalk.green('Wiki ID:')} ${siteinfo.wikiid}
  ${chalk.green('Site Api Url:')} ${bot.defaultOptions.apiUrl}
  ${chalk.green('Server Time:')} ${siteinfo.time}
  ${chalk.green('Time zone:')} ${siteinfo.timezone} (UTC${(siteinfo.timeoffset >= 0 ? '+':'-') + siteinfo.timeoffset/60})
`)
  })
})()