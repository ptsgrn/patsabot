/**
 * This scritp is written for Thai Wikisource with a request from Bebiezaza[1] to
 * cleanup the Index: pages as It reach its consensus and has been announced 
 * per [2].
 * [1]: https://th.wikisource.org/wiki/User:Bebiezaza
 * [2]: https://th.wikisource.org/w/index.php?title=วิกิซอร์ซ:ข่าวสาร&oldid=172181#การปรับการใส่ค่าข้อมูลในหน้าเนมสเปซดัชนี
 * @author Patsagorn Y. (https://w.wiki/JSB)
 * @license MIT
 * @date 2022-02-27
 */

import { mwn } from 'mwn'
import { version, mwnVersion } from '../patsabot/version.js'
import { site, user } from '../patsabot/config.js'
import { flattenArray, parse } from '../patsabot/utils.js'
import { diffLines } from 'diff'
import chunk from 'lodash/chunk.js'
import uniq from 'lodash/uniq.js'
import chalk from 'chalk'

// These are requirments from request for reference.
// (from [[s:th:Special:Permalink/172473#ขั้นตอนการตรวจสอบดัชนีใน หมวดหมู่:ดัชนีที่ใช้ช่องเล่ม]])
// ==== ขั้นตอนการตรวจสอบดัชนีใน [[:หมวดหมู่:ดัชนีที่ใช้ช่องเล่ม]] ====
// # ตรวจสอบว่าถ้าเป็นงานจากราชกิจจานุเบกษา ให้เปลี่ยนประเภทเป็นวารสาร
// # "เล่ม" ถ้าเป็นราชกิจจานุเบกษา ให้ย้ายไป "จากวารสาร"
// # ถ้ามี[[แม่แบบ:ดัชนีที่ผสานแล้ว]] ให้เทียบข้อมูลไปยัง "การผสานหน้า"
// # หากความคืบหน้าเป็น "เสร็จแล้ว" และผสานหน้าเรียบร้อยทั้งหมด ให้นำเดือนปีใส่ช่อง "วันที่เสร็จสมบูรณ์" โดยหาจากวันหลังสุดระหว่างตรวจทานกับผสานหน้า
// # นำข้อมูลมาใส่ "ชุดเล่ม" หากมี

// ===== ขั้นตอนการตรวจสอบดัชนีใน [[:หมวดหมู่:ดัชนีที่ใช้ช่องเล่ม]] สำหรับงานบอต =====
//   ขอให้ทำตามขั้นตอนที่กล่าวมา บางข้อมีข้อก่อนหน้านี้เป็นตัวกำหนดวิธีด้วย

//   "MS" "OCR" "L" "X" "C" "V" "T" "yes" "check" "no" "notadv" "notimg" "held" = [[มีเดียวิกิ:Proofreadpage_index_data_config]]

//   # "เล่ม" ถ้าเป็นราชกิจจานุเบกษา (มาแนว '''ราชกิจจานุเบกษา, เล่ม ''ลลล'', ตอน ''ตตต'', หน้า ''นน'', ''วว ดดดดดด ปปปป''''') ให้ย้ายไป "จากวารสาร"
//   #* ตรวจสอบว่าถ้าเป็นงานจากราชกิจจานุเบกษา ให้เปลี่ยนประเภทเป็นวารสาร
//   # ตรวจจำนวนหน้าในไฟล์และสถานะของแต่ละหน้า ถ้า
//   #* ช่อง "ความคืบหน้า" เป็น "MS" "OCR" "L" หรือ "X" ให้คงไว้ตามเดิม
//   #* บางหน้ายังไม่ได้สร้าง ให้ลงช่อง "ความคืบหน้า" ว่า "C"
//   #* สร้างหน้าแค่บางส่วน ให้ลงช่อง "ความคืบหน้า" ว่า "C"
//   #* สร้างหมดแล้ว แต่บางหน้ายังเป็นสถานะ "รอพิสูจน์อักษร" ให้ลงช่อง "ความคืบหน้า" ว่า "C"
//   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "พิสูจน์อักษรแล้ว" กับ "ไม่มีข้อความ" ให้ลงช่อง "ความคืบหน้า" ว่า "V"
//   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "พิสูจน์อักษรแล้ว" "ไม่มีข้อความ" กับ "ตรวจสอบแล้ว" ให้ลงช่อง "ความคืบหน้า" ว่า "V"
//   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "ตรวจสอบแล้ว" กับ "ไม่มีข้อความ" ให้ลงช่อง "ความคืบหน้า" ว่า "T"
//   # ตรวจสอบด้วยอุปกรณ์คล้าย ๆ <code>"https://checker.toolforge.org/?db=thwikisource_p&title=" + mw.config.get('wgPageName')</code> ร่วมกับข้อที่แล้ว เพื่อดูว่าถ้า
//   #* ไม่มี Transcluded to main namespace ให้ลงช่อง "การผสานหน้า" ว่า "no"
//   #* มีทั้ง Not transcluded to main namespace และ Transcluded to main namespace และ "ความคืบหน้า" เป็น "MS" "OCR" "L" "X" หรือ "C" ให้ลงช่อง "การผสานหน้า" ว่า "no"
//   #* Transcluded to main namespace หมดเรียบร้อยทุกหน้า แต่ "ความคืบหน้า" เป็น "MS" "OCR" "L" "X" หรือ "C" ให้ลงช่อง "การผสานหน้า" ว่า "no"
//   #* มีทั้ง Not transcluded to main namespace และ Transcluded to main namespace และ "ความคืบหน้า" เป็น "V" หรือ "T" ให้ลงช่อง "การผสานหน้า" ว่า "check" (เนื่องจากว่าเป็นได้ทั้งมีหน้า "ไม่มีข้อความ" และเป็น "notadv" หรือ "notimg")
//   #* Transcluded to main namespace หมดเรียบร้อยทุกหน้า และ "ความคืบหน้า" เป็น "V" หรือ "T" ให้ลงช่อง "การผสานหน้า" ว่า "yes"
//   # ลบ {{tl|ดัชนีที่ผสานแล้ว}} / {{tl|index transcluded}} / {{tl|ดัชนีรวมข้าม}} ออกจากหน้าดัชนี
//   # ตรวจสอบเบื้องต้นว่าถ้าข้อมูลจากช่องอื่นสามารถนำมาใส่ใน "ชุดเล่ม" ได้ เช่น https://th.wikisource.org/w/index.php?title=ดัชนี%3ABKK_Rec_vol_1a.pdf&type=revision&diff=172173&oldid=158015

const bot = new mwn()
// thwikisource: Thai Wikisource
bot.setApiUrl('https://th.wikisource.org/w/api.php')
bot.setOptions({
  username: user.username,
  password: user.password,
  OAuthCredentials: {
    ...user.OAuthCredentials
  },
  // Set your user agent (required for WMF wikis, see https://meta.wikimedia.org/wiki/User-Agent_policy):
  userAgent: `PatsaBot/${version} ([[m:User:Patsagorn Y.]]) mwn/${mwnVersion}`,
  defaultParams: {
    assert: 'user' // ensure we're logged in
  }
})

// #region login
mwn.log('[i] logging in...')
Promise.all([
  bot.initOAuth(),
  await bot.getTokensAndSiteInfo(),
  await bot.getSiteInfo(),
]).then(async ([oauth, tokens, siteInfo]) => {
  mwn.log(`[+] logged in as ${(await bot.userinfo().catch(console.error)).name}`)
})
// #endregion

let pagesInCat = await bot.getPagesInCategory('ดัชนีที่ใช้ช่องเล่ม')

async function pageProcess(page, id) {
  return new Promise(async (resolve, reject) => {
    let content = (await bot.read(page)).revisions[0].content
    let parsed = parse(content)
    await parsed.each('transclusion', async (token, index, parent) => {
      // only work in MediaWiki:Proofreadpage index template
      if (token.name !== 'MediaWiki:Proofreadpage index template') return
      // # ตรวจสอบว่าถ้าเป็นงานจากราชกิจจานุเบกษา ให้เปลี่ยนประเภทเป็นวารสาร
      if (getparam(token, 'ประเภท') !== 'วารสาร' && isRKJ(getparam(token, 'เล่ม'))) {
        setparam(token, 'ประเภท', 'วารสาร')
      }
      // # "เล่ม" ถ้าเป็นราชกิจจานุเบกษา (มาแนว '''ราชกิจจานุเบกษา, เล่ม ''ลลล'', ตอน ''ตตต'', หน้า ''นน'', ''วว ดดดดดด ปปปป''''') ให้ย้ายไป "จากวารสาร"
      if (isRKJ(getparam(token, 'เล่ม'))) {
        setparam(token, 'จากวารสาร', getparam(token, 'เล่ม'), {
          putAfter: 'ARC'
        })
        setparam(token, 'เล่ม', '')
      }
      //   # ตรวจจำนวนหน้าในไฟล์และสถานะของแต่ละหน้า ถ้า
      //   #* ช่อง "ความคืบหน้า" เป็น "MS" "OCR" "L" หรือ "X" ให้คงไว้ตามเดิม
      if (!['MS', 'OCR', 'L', 'X'].includes(getparam(token, 'ความคืบหน้า'))) {
        // -1 = ไม่มีหน้า
        // 0 = ไม่มีข้อความ (ขาว)
        // 1 = ยังไม่พิสูจน์อักษร (แดง)
        // 2 = เป็นปัญหา (ม่วง)
        // 3 = พิสูจน์อักษรแล้ว (เหลือง)
        // 4 = ตรวจสอบแล้ว (เขียว)
        let profreadspagestatus = uniq(await checkPagesInIndex(page))
        let profreadpagesprofreadstatus = profreadspagestatus.map(p => p.status)
        let profreadpagesprofreadtranscluded = profreadspagestatus.map(p => p.isTranscluded)
        //   #* บางหน้ายังไม่ได้สร้าง ให้ลงช่อง "ความคืบหน้า" ว่า "C"
        //   #* สร้างหน้าแค่บางส่วน ให้ลงช่อง "ความคืบหน้า" ว่า "C"
        //   #* สร้างหมดแล้ว แต่บางหน้ายังเป็นสถานะ "รอพิสูจน์อักษร" ให้ลงช่อง "ความคืบหน้า" ว่า "C"
        // แปลได้ว่า หากมีหน้าที่ยังไม่สร้าง หรือมีหน้ายังไม่พิสูจอักษรแม้แต่หน้าเดียว จะลงช่อง "ความคืบหน้า" ว่า "C"
        if (profreadpagesprofreadstatus.includes(-1) || profreadpagesprofreadstatus.includes(1)) {
          setparam(token, 'ความคืบหน้า', 'C')
        }
        //   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "พิสูจน์อักษรแล้ว" กับ "ไม่มีข้อความ" ให้ลงช่อง "ความคืบหน้า" ว่า "V"
        //   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "พิสูจน์อักษรแล้ว" "ไม่มีข้อความ" กับ "ตรวจสอบแล้ว" ให้ลงช่อง "ความคืบหน้า" ว่า "V"
        // แปลได้ว่า มีเฉพาะพิสูจน์อักษรแล้ว ไม่มีข้อความ ตรวจสอบแล้ว จะลงช่อง "ความคืบหน้า" ว่า "V"
        // ตรงนี้ใช้การ Invert เอาแทน
        if (!profreadpagesprofreadstatus.includes(-1) && !profreadpagesprofreadstatus.includes(1) && !profreadpagesprofreadstatus.includes(2)) {
          setparam(token, 'ความคืบหน้า', 'V')
        }
        //   #* สร้างหมดแล้ว หน้าทั้งหมดเป็นสถานะ "ตรวจสอบแล้ว" กับ "ไม่มีข้อความ" ให้ลงช่อง "ความคืบหน้า" ว่า "T"
        // แปลได้ว่า มีเฉพาะตรวจสอบแล้ว หรือไม่มีข้อความ จะลงช่อง "ความคืบหน้า" ว่า "T"
        if (!profreadpagesprofreadstatus.includes(-1) && !profreadpagesprofreadstatus.includes(1) && !profreadpagesprofreadstatus.includes(2) && !profreadpagesprofreadstatus.includes(3)) {
          setparam(token, 'ความคืบหน้า', 'T')
        }
        //   #* no-ns0 only or not & "ความคืบหน้า" is ["MS","OCR","L","X","C"]      "การผสานหน้า" = "no"
        //   #* "ความคืบหน้า" is ["V", "T"]                                         "การผสานหน้า" = "check" (เนื่องจากว่าเป็นได้ทั้งมีหน้า "ไม่มีข้อความ" และเป็น "notadv" หรือ "notimg")
        //   #* ns0ed only but "ความคืบหน้า" is ["V", "T"]                          "การผสานหน้า" = "yes"
        // ignore include status, and check param status only
        if (["V", "T"].includes(getparam(token, 'ความคืบหน้า'))) setparam(token, 'การผสานหน้า', 'check')
        // okay, check include status (for overwrite above statement) and check param status
        if (profreadpagesprofreadtranscluded.includes(false) || ["MS", "OCR", "L", "X", "C"].includes(getparam(token, 'ความคืบหน้า'))) setparam(token, 'การผสานหน้า', 'no')
        // overwrite both above statement, and check param status and include status
        if (!profreadpagesprofreadtranscluded.includes(false) && ["V", "T"].includes(getparam(token, 'ความคืบหน้า'))) setparam(token, 'การผสานหน้า', 'yes')
        //   # ลบ {{tl|ดัชนีที่ผสานแล้ว}} / {{tl|index transcluded}} / {{tl|ดัชนีรวมข้าม}} ออกจากหน้าดัชนี
        token = token.map(child => {
          if (child.type === 'template' && (child.name === 'ดัชนีที่ผสานแล้ว' || child.name === 'index transcluded' || child.name === 'ดัชนีรวมข้าม')) {
            return null
          } else {
            return child
          }
        })
        //   # ตรวจสอบเบื้องต้นว่าถ้าข้อมูลจากช่องอื่นสามารถนำมาใส่ใน "ชุดเล่ม" ได้ เช่น https://th.wikisource.org/w/index.php?title=ดัชนี%3ABKK_Rec_vol_1a.pdf&type=revision&diff=172173&oldid=158015
      }
    })
    compareandprint(content, parsed.toString())
  })
}

function isRKJ(value) {
  return /ราชกิจจานุเบกษา, .*? ([0-9๐-๙]?[0-9๐-๙] (มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม) [0-9๐-๙]{4}|\{\{วส\|\|[0-9๐-๙]{1,2}|[0-9๐-๙]{1,2}|[0-9๐-๙]{4}\|\|\|\}\})/.test(value)
}

function setparam(token, params, value, options = {}) {
  let index = token.index_of[params]
  token.parameters[params] = value
  if (index === undefined || token[index].key !== params) {
    if (options?.putAfter) {
      return token.splice((token.index_of[options.putAfter] ?? token.length) + 1, 0, `${params}=${value}\n`)
    }
    if (options?.insertAt) {
      return token.splice(options.insertAt, 0, `${params}=${value}\n`)
    }
    return token.push(`${params}=${value}\n`)
  }
  token[index][2] = value
  return token
}
/**
 * @param  {?} token
 * @param  {string} params
 * @returns {string | string[]}
 */
function getparam(token, params) {
  return token.parameters[params]
}

function compareandprint(before, after) {
  if (before === after) return console.log(chalk.grey('nothing change'))
  diffLines(before, after).forEach((part) => {
    const color = part.added ? 'green' : (part.removed ? 'red' : 'grey');
    process.stdout.write(chalk[color](part.value));
  });
  process.stdout.write('\n')
}

async function checkPagesInIndex(indexname) {
  return new Promise(async (resolve, reject) => {
    let proofreadpagesinindex = await bot.continuedQuery({
      "action": "query",
      "format": "json",
      "list": "proofreadpagesinindex",
      "utf8": 1,
      "formatversion": "2",
      "prppiiprop": "title",
      "prppiititle": indexname,
    }).catch(reject)
    proofreadpagesinindex = flattenArray(proofreadpagesinindex.map(entry => entry.query.proofreadpagesinindex)).map(entry => entry.title)
    let pagesinindexstatus = []
    for (let payloads of chunk(proofreadpagesinindex, 100)) {
      let pagesinindex = await bot.continuedQuery({
        "action": "query",
        "prop": "proofread|transcludedin",
        "titles": payloads.join('|'),
	      "tinamespace": "0"
      }).catch(reject)
      pagesinindex.map(entry => {
        let page = entry.query.pages.map(profreadpage => {
          return {
            status: profreadpage?.missing ? -1 : profreadpage.proofread.quality,
            isTranscluded: profreadpage?.transcludedin?.length > 0
          }
        })
        pagesinindexstatus = pagesinindexstatus.concat(page)
      })
    }
    resolve(pagesinindexstatus)
  })
}

await pageProcess(pagesInCat[5], 0).catch(console.error)
// this mean: on each of pagesInCat, run pageProcess for it, do it in parallel 5 pages at a time,
// if error, retry another 1 time (it count the first run too, so 2 is mean retry 1 time)
// bot.batchOperation(pagesInCat, pageProcess, 1, 2)

// just in case
process.on('unhandledRejection', console.error)
process.on('uncaughtException', console.error)
