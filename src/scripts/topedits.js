import { conn } from '../patsabot/replica.js'
import baseLogger from '../patsabot/logger.js'
import bot from '../patsabot/bot.js'
const logger = baseLogger.child({
  script: 'topedits'
})
/**
 *
 * @param {{name: string; editcount: number; group: string[]; exclude: boolean; active: boolean}[]} result
 * @returns
 */
async function save(result) {
  return Promise.all([
    bot.edit('วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)/รายการ', (rev) => {
      // rev.content gives the revision text
      // rev.timestamp gives the revision timestamp
      result = result
        .slice(0, 500)
      console.log(contentTransform(rev.content, result))
      return {
        text: contentTransform(rev.content, result),
        summary: 'ปรับปรุงรายการ',
      }
    }),
    bot.edit('วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ/รายการ', (rev) => {
      // rev.content gives the revision text
      // rev.timestamp gives the revision timestamp
      result = result
        .filter(v => !v.group.includes('bot'))
        .filter(v => v.name !== 'New user message')
        .slice(0, 500)
      console.log(contentTransform(rev.content, result))
      return {
        text: contentTransform(rev.content, result),
        summary: 'ปรับปรุงรายการ',
      }
    })
  ]).catch(err => logger.log('error', err))
}
function contentTransform(text, result) {
  let pretext = text.split('<section begin="list500" />')[0]
  let posttext = text.split('<section end="list500" />')[1]
  text = pretext + generateTable(result) + posttext
  text = text.split('<section begin="lastupdate" />')[0]
        + '<section begin="lastupdate" />{{subst:#timel:r}}<section end="lastupdate" />'
        + text.split('<section end="lastupdate" />')[1]
  return text
}
async function getExcludeList() {
  let content = await bot.read('วิกิพีเดีย:รายชื่อชาววิกิพีเดียตามจำนวนการแก้ไข/นิรนาม')
  return content.revisions[0].content.match(/ผู้ใช้:(.*?)\]\]/ig).map(v => v.slice(7, -2))
}
/**
 *
 * @param {{ name: string; editcount: number; group: string[]; active: boolean; exclude: boolean }[]} data
 */
function generateTable(data) {
  let content = '<section begin="list500" />'
  let count = 1
  for (const { name, ...value } of data) {
    if (value.exclude) {
      content += `\n|-\n| ${count} || [นิรนาม] || {{sort|${value.editcount.toString()}|${value.editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}}} `
    }
    else {
      content += `\n|-\n| ${count} || [[ผู้ใช้:${name}|${!value.active ? '<span style="color: gray;">' : ''}${name}${!value.active ? '</span>' : ''}]] ${rightTransform(value.group)} || {{sort|${value.editcount.toString()}|[[พิเศษ:เรื่องที่เขียน/${name}|${value.editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}]]}} `
    }
    count += 1
  }
  return content + '\n<section end="list500" />'
}
/**
   *
   * @param {string[]} rights
   */
function rightTransform(rights) {
  if (rights.length === 0)
    return ''
  return '(' + rights
    .map(right => right === 'sysop' ? 'admin' : right)
    .map(string => string.charAt(0).toUpperCase() + string.slice(1))
    .join(', ') + ')'
}
async function run() {
  const connection = await conn.catch(err => {
    logger.log('error', 'cannot access replica', err)
    process.exit(1)
  })
  const data = await connection.execute(`
    SELECT user.user_id AS user_id, user.user_name AS user_name, user.user_editcount AS user_editcount,
  	CASE
  		WHEN (ug.user_admin > 0 OR ue.user_admin > 0) THEN 1
  		ELSE 0
  	END AS user_admin,
  	CASE
  		WHEN (ug.user_bot > 0 OR ue.user_bot > 0) THEN 1
  		ELSE 0
  	END AS user_bot
  FROM user
  LEFT JOIN (
  	SELECT ug_user, SUM(ug_group="sysop") AS user_admin, SUM(ug_group="bot") AS user_bot FROM user_groups
  	GROUP BY ug_user
  	HAVING (user_admin = 1 OR user_bot = 1)
  ) AS ug ON user.user_id = ug.ug_user
  LEFT JOIN (
  	SELECT user_id, 0 AS user_admin, 1 AS user_bot FROM user
  	INNER JOIN (
  		SELECT REPLACE(page_title, "_", " ") AS user_name FROM categorylinks
  		INNER JOIN page ON categorylinks.cl_from = page.page_id
  		WHERE (page_namespace = 2 AND cl_to = "บอต")
  		UNION
  		SELECT user_name FROM user
  		INNER JOIN pagelinks ON user.user_name = REPLACE(pagelinks.pl_title, "_", " ")
  		WHERE (pl_namespace = 2 AND pl_from = 1995229)
  	) AS user_exceptions ON user.user_name = user_exceptions.user_name
  ) AS ue ON user.user_id = ue.user_id
  ORDER BY user_editcount DESC, user_id
  LIMIT 580;
    `)
    .catch(err => {
      logger.log('error', err)
      process.exit(1)
    })
    .then(([rows, _]) => {
      // @ts-ignore-nextline
      return rows.map(u => ({
        name: u.user_name.toString(),
        editcount: u.user_editcount,
        is_admin: u.user_admin,
        is_bot: u.user_bot
      }))
    })
  let activeusers = []
  for await (let json of bot.continuedQueryGen({
    action: 'query',
    list: 'allusers',
    auactiveusers: 1,
    aulimit: 'max'
  })) {
    let users = json.query.allusers.map((user) => user.name)
    activeusers = activeusers.concat(users)
  }
  /**
     * @type {{name: string; editcount: number; group: string[]; exclude: boolean; active: boolean}[]}
     */
  let result = []
  let excludeList = getExcludeList()
  for (let { name, editcount, is_admin, is_bot } of data) {
    result.push({
      name,
      editcount,
      active: activeusers.includes(name),
      group: [
        is_admin ? 'sysop' : null,
        is_bot ? 'bot' : null
      ].filter(v => v),
      exclude: (await excludeList).includes(name)
    })
  }
  await connection.end()
  logger.log('info', 'table generated')
  await save(result).catch(err => {
    logger.log('error', err)
  })
}
run()
