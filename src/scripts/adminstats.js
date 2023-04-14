/**
 * @id 0
 * @name adminstats
 * @desc สถิติการใช้งานเครื่องมือของผู้ดูแลระบบ
 * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/adminstats.ts
 * @cron 30 2 * * 1
 * @author Patsagorn Y. (mpy@toolforge.org)
 * @license MIT
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _TextContent_instances, _TextContent_subst, _AdminStats_instances, _AdminStats_start_get, _AdminStats_end_get;
import meow from 'meow';
import axios from 'axios';
import bot from '../patsabot/bot.js';
import Logger from '../patsabot/logger.js';
const cli = meow(`
  Script to update admins stats at [[w:th:วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ]]

  Usage
    $ patsabot adminstats [options]

  Options
		--dry-run, -n	    Do not actually update the page, print out the text instead.
`, {
    importMeta: import.meta,
    flags: {
        dryRun: {
            type: 'boolean',
            alias: 'n',
            default: false,
        },
    },
});
cli.flags.dryRun = !cli.flags.dryRun;
const logger = Logger.child({
    script: 'adminstats',
});
let testText = `
== วิกิพีเดีย (th.wikipedia.org) ==

Generated using [https://xtools.wmflabs.org/adminstats/th.wikipedia.org/2021-09-10/2022-09-10?actions=delete%7Crevision-delete%7Clog-delete%7Crestore%7Cre-block%7Cunblock%7Cre-protect%7Cunprotect%7Crights%7Cmerge%7Cimport%7Cabusefilter%7Ccontentmodel XTools] on 2022-09-10 16:42

{| class="wikitable sortable"
! #
! Username
! User groups
! Total
! Delete
! Revision delete
! Log delete
! Restore
! (Re)block
! Unblock
! (Re)protect
! Unprotect
! Rights
! Merge
! Import
! AbuseFilter
! Content model
|-
| {{FORMATNUM:1}}
| [[User:Timekeepertmk|Timekeepertmk]]
| 
| {{FORMATNUM:3858}}
| {{FORMATNUM:3676}}
| {{FORMATNUM:2}}
| {{FORMATNUM:2}}
| {{FORMATNUM:45}}
| {{FORMATNUM:114}}
| {{FORMATNUM:1}}
| {{FORMATNUM:12}}
| {{FORMATNUM:1}}
| {{FORMATNUM:4}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:2}}
| [[User:นคเรศ|นคเรศ]]
| 
| {{FORMATNUM:1746}}
| {{FORMATNUM:1347}}
| {{FORMATNUM:87}}
| {{FORMATNUM:0}}
| {{FORMATNUM:2}}
| {{FORMATNUM:174}}
| {{FORMATNUM:0}}
| {{FORMATNUM:94}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:41}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:3}}
| [[User:Chainwit.|Chainwit.]]
| 
| {{FORMATNUM:882}}
| {{FORMATNUM:733}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:3}}
| {{FORMATNUM:81}}
| {{FORMATNUM:0}}
| {{FORMATNUM:65}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:4}}
| [[User:JMKTIN|JMKTIN]]
| 
| {{FORMATNUM:792}}
| {{FORMATNUM:773}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:14}}
| {{FORMATNUM:0}}
| {{FORMATNUM:5}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:5}}
| [[User:Geonuch|Geonuch]]
| 
| {{FORMATNUM:729}}
| {{FORMATNUM:521}}
| {{FORMATNUM:2}}
| {{FORMATNUM:1}}
| {{FORMATNUM:4}}
| {{FORMATNUM:156}}
| {{FORMATNUM:4}}
| {{FORMATNUM:28}}
| {{FORMATNUM:1}}
| {{FORMATNUM:1}}
| {{FORMATNUM:3}}
| {{FORMATNUM:0}}
| {{FORMATNUM:8}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:6}}
| [[User:Sry85|Sry85]]
| 
| {{FORMATNUM:548}}
| {{FORMATNUM:422}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:87}}
| {{FORMATNUM:28}}
| {{FORMATNUM:0}}
| {{FORMATNUM:8}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:2}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:7}}
| [[User:Horus|Horus]]
| 
| {{FORMATNUM:470}}
| {{FORMATNUM:449}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:15}}
| {{FORMATNUM:0}}
| {{FORMATNUM:4}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:1}}
| {{FORMATNUM:1}}
|-
| {{FORMATNUM:8}}
| [[User:B20180|B20180]]
| 
| {{FORMATNUM:106}}
| {{FORMATNUM:68}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:11}}
| {{FORMATNUM:0}}
| {{FORMATNUM:18}}
| {{FORMATNUM:0}}
| {{FORMATNUM:3}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:6}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:9}}
| [[User:Pongsak ksm|Pongsak ksm]]
| 
| {{FORMATNUM:97}}
| {{FORMATNUM:89}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:6}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:2}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:10}}
| [[User:Lerdsuwa|Lerdsuwa]]
| 
| {{FORMATNUM:89}}
| {{FORMATNUM:29}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:2}}
| {{FORMATNUM:44}}
| {{FORMATNUM:0}}
| {{FORMATNUM:5}}
| {{FORMATNUM:4}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:3}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:11}}
| [[User:พุทธามาตย์|พุทธามาตย์]]
| 
| {{FORMATNUM:74}}
| {{FORMATNUM:66}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:4}}
| {{FORMATNUM:0}}
| {{FORMATNUM:3}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:12}}
| [[User:Mda|Mda]]
| 
| {{FORMATNUM:62}}
| {{FORMATNUM:58}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:3}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:13}}
| [[User:Nullzero|Nullzero]]
| 
| {{FORMATNUM:16}}
| {{FORMATNUM:9}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:2}}
| {{FORMATNUM:0}}
| {{FORMATNUM:4}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:1}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:14}}
| [[User:MediaWiki default|MediaWiki default]]
| 
| {{FORMATNUM:2}}
| {{FORMATNUM:2}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
| {{FORMATNUM:15}}
| [[User:Pathoschild|Pathoschild]]
| 
| {{FORMATNUM:2}}
| {{FORMATNUM:2}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
| {{FORMATNUM:0}}
|-
|}
`;
class TextContent {
    constructor(text) {
        _TextContent_instances.add(this);
        if (typeof text !== 'string')
            throw new TypeError('Text must be a string.');
        this.content = text;
        this.content = this.cleanupdata().renameColumn().translate().content;
    }
    static get content() {
        return this.content;
    }
    cleanupdata() {
        __classPrivateFieldGet(this, _TextContent_instances, "m", _TextContent_subst).call(this, 'FORMATNUM');
        this.content = this.content
            .replace('== วิกิพีเดีย (th.wikipedia.org) ==', '')
            .replace(/[\n\r]{3,}/gi, '\n');
        return this;
    }
    renameColumn() {
        const columnnamemap = {
            Username: 'ชื่อผู้ใช้',
            'User groups': 'กลุ่มผู้ใช้',
            Total: 'รวม',
            Delete: 'ลบ',
            'Revision delete': 'ลบรุ่น',
            'Log delete': 'ลบปูม',
            Restore: 'กู้คืน',
            '(Re)block': '<abbr title="รวมการบล็อกซ้ำ (Reblock)">บล็อก</abbr>',
            Unblock: 'ปลดบล็อก',
            '(Re)protect': '<abbr title="รวมการป้องกันซ้ำ (Reprotect)">ป้องกัน</abbr>',
            Unprotect: 'ปลดป้องกัน',
            Rights: 'แก้สิทธิ์',
            Merge: 'รวมประวัติ',
            Import: 'นำเข้า',
            AbuseFilter: 'แก้ตัวกรอง',
            'Content model': 'แก้โมเดลหน้า',
        };
        for (let col in columnnamemap) {
            this.content = this.content.replace(`! ${col}`, `! ${columnnamemap[col]}`);
        }
        return this;
    }
    translate() {
        this.content = this.content
            .replace('Generated using', 'สร้างโดย')
            .replace(/\] on /i, '] เมื่อ ')
            .replace(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/i, (_date, year, month, day, hour, minute) => new Intl.DateTimeFormat('th-TH', {
            timeZone: 'Asia/Bangkok',
            dateStyle: 'full',
            timeStyle: 'full',
        }).format(Date.UTC(year, +month - 1, day, hour, minute)));
        return this;
    }
}
_TextContent_instances = new WeakSet(), _TextContent_subst = function _TextContent_subst(templatename) {
    this.content = this.content.replace(new RegExp(`{{ ?(${templatename}) ?([:\|])`, 'ig'), '{{subst:$1$2');
    return this;
};
class AdminStats {
    constructor(config) {
        _AdminStats_instances.add(this);
        this.config = config;
        this.bot = bot;
    }
    async run() {
        const contentResponse = await axios.get(`https://xtools.wmflabs.org/adminstats/th.wikipedia.org/${__classPrivateFieldGet(this, _AdminStats_instances, "a", _AdminStats_start_get)}/${__classPrivateFieldGet(this, _AdminStats_instances, "a", _AdminStats_end_get)}?format=wikitext&actions=delete|revision-delete|log-delete|restore|re-block|unblock|re-protect|unprotect|rights|merge|import|abusefilter|contentmodel`);
        let content = new TextContent(contentResponse.data).content;
        content =
            `${this.config.header}\n: ข้อมูลระหว่างวันที่ ${__classPrivateFieldGet(this, _AdminStats_instances, "a", _AdminStats_start_get)} ถึง ${__classPrivateFieldGet(this, _AdminStats_instances, "a", _AdminStats_end_get)}` + content;
        if (cli.flags.dryRun) {
            logger.log('info', await this.bot.save(this.config.title, content, 'อัปเดตสถิติผู้ดูแลระบบ'));
        }
        else {
            logger.log('info', 'DRYRUN');
            logger.log('info', content);
        }
    }
}
_AdminStats_instances = new WeakSet(), _AdminStats_start_get = function _AdminStats_start_get() {
    const date = new Date();
    return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(`${date.getFullYear()}-${
    /* yes start with 0 and js handle this */ date.getMonth()}-${date.getDate()}`));
}, _AdminStats_end_get = function _AdminStats_end_get() {
    return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
};
const config = {
    header: `{{/ส่วนหัว}}`,
    title: 'วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ',
};
new AdminStats(config).run();
