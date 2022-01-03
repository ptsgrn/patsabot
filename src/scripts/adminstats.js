// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { getApiQueryLists } from '../patsabot/apis.js'
import { isArray } from 'util'

const pageLayout = `; {{abbr|ข้อมูลเมื่อ|เวลาที่เข้าถึงข้อมูล}}: <<dated>> {{Time ago|<<dated>>|tz_offset=yes}}
{{tocright}}
=== ลบ ===
<<deletetable>>

=== กู้คืน ===
<<undeletetable>>

=== บล็อก ===
<<blocktable>>

=== ปลดบล็อก ===
<<unblocktable>>

=== ล็อกหน้า ===
<<lockpagetable>>

=== ปลดล็อกหน้า ===
<<unlockpagetable>>

=== การแก้ไข ===
<<edittable>>

=== แก้ไขสิทธิ์ผู้ใช้ ===
<<userightedittable>>

=== รวมประวัติหน้า ===
<<historymergetable>>

=== ตารางรวม ===
<<alltable>>
`
let config = {
  page: 'ผู้ใช้:PatsaBot/สถิติผู้ดูแลระบบ',
  pageLayout
}

async function main({ bot, log }) {
  // get list of sysop in th.wikipedia.org

}
// Copyright (c) 2021 Patsagorn Y.
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/**
 * Get the SQL to query for the given type and actions.
 * This function is entirely based on the code in the XTools' AdminStats module.
 * @license GPL-3.0
 * @see https://github.com/x-tools/xtools/blob/5aae044f81115bd8c2a111f8a2dd3f85d8ff5a56/src/AppBundle/Repository/AdminStatsRepository.php#L79
 * @returns 
 */
function getLogSqlParts({ requestedActions }) {
  const config = {
    'actions': {
      'delete': [
        'delete/delete'
      ],
      'revision-delete': [
        'delete/revision'
      ],
      'log-delete': [
        'delete/event'
      ],
      'restore': [
        'delete/restore'
      ],
      're-block': [
        'block/block',
        'block/reblock'
      ],
      'unblock': [
        'block/unblock'
      ],
      're-protect': [
        'protect/protect',
        'protect/modify',
        'stable/config',
        'stable/modify'
      ],
      'unprotect': [
        'protect/unprotect'
      ],
      'rights': [
        'rights/rights'
      ],
      'merge': [
        'merge/merge'
      ],
      'import': [
        'import/interwiki',
        'import/upload'
      ],
      'abusefilter': [
        'abusefilter/modify',
        'abusefilter/create'
      ],
      'contentmodel': [
        'contentmodel/change',
        'contentmodel/new'
      ]
    }
  }

  let countSql = ''
  let logTypes = []
  let logActions = []

  for (const key in config['actions']) {
    // requestedActions should be an array of strings.
    if (Array.isArray(requestedActions) && !requestedActions.includes(key)) {
      continue
    }

    const logTypeActions = config.actions[key]

    const keyTypes = []
    const keyActions = []

    for (const entry of logTypeActions) {
      console.log(entry)
      const [logType, logAction] = entry.split('/')

      logTypes.push(logType)
      logActions.push(logAction)

      keyTypes.push(logType)
      keyActions.push(logAction)
    }

    keyTypes.push(keyTypes.join(','))
    keyActions.push(keyActions.join(','))

    countSql += `SUM(IF((log_type IN (${keyTypes.join(',')}) AND log_action IN (${keyActions.join(',')})), 1, 0)) AS ` + key + ',\n'
  }
  return [countSql, logTypes.join(','), logActions.join(',')]
}

/**
 * Core function to get statistics about users who have admin/patroller/steward-like permissions
 * This function is entirely based on the code in the XTools' AdminStats module.
 * @license GPL-3.0
 * @see https://github.com/x-tools/xtools/blob/5aae044f81115bd8c2a111f8a2dd3f85d8ff5a56/src/AppBundle/Repository/AdminStatsRepository.php#L38
 * @returns {string} sql query
 */
function getSql() {
  let actorTable = 'actor'
  let loggingTable = 'logging'
  const requestedActions = [
    'delete',
    'revision-delete',
    'log-delete',
    'restore',
    're-block',
    'unblock',
    're-protect',
    'unprotect',
    'rights',
    'merge',
    'import',
    'abusefilter',
    'contentmodel'
  ]
  const [countSql, types, actions] = getLogSqlParts({ requestedActions})
  const dateConditions = '' // currently not used
  
  if (types === '' || actions === '') {
    // Types/actions not applicable to this wiki.
    return ''
  }
  return `SELECT actor_name AS \`username\`,
                ${countSql}
                SUM(IF(log_type != '' AND log_action != '', 1, 0)) AS \`total\`
            FROM ${loggingTable}
            JOIN ${actorTable} ON log_actor = actor_id
            WHERE log_type IN (${types})
                AND log_action IN (${actions})
                ${dateConditions}
            GROUP BY actor_name
            HAVING \`total\` > 0`
}

export const id = 'adminstats'
export const name = 'admins statistics'
export const schedule = '0 0 * * *'
export const desc = `อัปเดตสถิติของผู้ดูแลระบบที่หน้า ${config.page}`
export const run = main