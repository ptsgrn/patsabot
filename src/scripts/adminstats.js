/**
 * @id 0
 * @inuse
 * @name adminstats
 * @desc สถิติการใช้งานเครื่องมือของผู้ดูแลระบบ
 * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/adminstats.ts
 * @cron 30 2 * * 1
 * @author Patsagorn Y. (mpy@toolforge.org)
 * @license MIT
 */
import Logger from '../patsabot/logger.js';
import bot from '../patsabot/bot.js';
import { conn } from '../patsabot/replica.js';
import meow from 'meow';
const cli = meow(`
  Script to update admins stats at [[w:th:วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ]]

  Usage
    $ patsabot adminstats [options]

  Options
		--dry-run, -n	    Do not actually update the page, print out the text instead.
    --debug, -d	      Debug mode.
`, {
    importMeta: import.meta,
    flags: {
        dryRun: {
            type: 'boolean',
            alias: 'n',
            default: false,
        },
        debug: {
            type: 'boolean',
            default: false,
        },
    },
});
const adminStatsData = [
    {
        userid: 60742,
        name: 'AAAERTCM',
        editcount: 15761,
        registration: '2009-02-22T06:03:45Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 2229,
        revdel: 119,
        restore: 5,
        block: 273,
        unblock: 0,
        protected: 185,
        unprotected: 1,
        rights: 0,
        reblock: 14,
        modifyprotect: 5,
        abusefilter: 45,
        merge: 14,
        import: 0,
    },
    {
        userid: 79882,
        name: 'B20180',
        editcount: 108958,
        registration: '2009-12-15T04:54:04Z',
        groups: [
            '*',
            'user',
            'autoconfirmed',
            'bureaucrat',
            'interface-admin',
            'sysop',
        ],
        delete: 5352,
        revdel: 30,
        restore: 81,
        block: 465,
        unblock: 2,
        protected: 680,
        unprotected: 3,
        rights: 13,
        reblock: 28,
        modifyprotect: 11,
        abusefilter: 21,
        merge: 28,
        import: 0,
    },
    {
        userid: 337868,
        name: 'Chainwit.',
        editcount: 31583,
        registration: '2018-11-11T20:28:37Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 3736,
        revdel: 0,
        restore: 6,
        block: 191,
        unblock: 0,
        protected: 108,
        unprotected: 0,
        rights: 0,
        reblock: 11,
        modifyprotect: 6,
        abusefilter: 0,
        merge: 11,
        import: 0,
    },
    {
        userid: 267650,
        name: 'Geonuch',
        editcount: 16088,
        registration: '2016-07-17T07:08:28Z',
        groups: [
            '*',
            'user',
            'autoconfirmed',
            'checkuser',
            'interface-admin',
            'sysop',
        ],
        delete: 4493,
        revdel: 86,
        restore: 13,
        block: 610,
        unblock: 18,
        protected: 129,
        unprotected: 1,
        rights: 10,
        reblock: 25,
        modifyprotect: 7,
        abusefilter: 91,
        merge: 25,
        import: 0,
    },
    {
        userid: 356206,
        name: 'JMKTIN',
        editcount: 6659,
        registration: '2019-05-28T09:54:44Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 1629,
        revdel: 0,
        restore: 1,
        block: 37,
        unblock: 0,
        protected: 26,
        unprotected: 0,
        rights: 0,
        reblock: 14,
        modifyprotect: 0,
        abusefilter: 0,
        merge: 14,
        import: 0,
    },
    {
        userid: 401376,
        name: 'Kaoavi',
        editcount: 7377,
        registration: '2021-03-31T09:52:22Z',
        groups: ['*', 'user', 'autoconfirmed', 'interface-admin', 'sysop'],
        delete: 264,
        revdel: 3,
        restore: 4,
        block: 54,
        unblock: 0,
        protected: 22,
        unprotected: 5,
        rights: 0,
        reblock: 4,
        modifyprotect: 1,
        abusefilter: 1,
        merge: 4,
        import: 0,
    },
    {
        userid: 436,
        name: 'Lerdsuwa',
        editcount: 28247,
        registration: '',
        groups: [
            '*',
            'user',
            'autoconfirmed',
            'bureaucrat',
            'interface-admin',
            'sysop',
        ],
        delete: 6044,
        revdel: 6,
        restore: 33,
        block: 2020,
        unblock: 25,
        protected: 452,
        unprotected: 15,
        rights: 100,
        reblock: 11,
        modifyprotect: 12,
        abusefilter: 243,
        merge: 11,
        import: 0,
    },
    {
        userid: 1018,
        name: 'Mda',
        editcount: 38566,
        registration: '',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 2224,
        revdel: 0,
        restore: 4,
        block: 22,
        unblock: 0,
        protected: 11,
        unprotected: 0,
        rights: 1,
        reblock: 3,
        modifyprotect: 1,
        abusefilter: 0,
        merge: 3,
        import: 0,
    },
    {
        userid: 47237,
        name: 'Mopza',
        editcount: 30122,
        registration: '2008-07-12T17:05:36Z',
        groups: ['*', 'user', 'autoconfirmed', 'interface-admin', 'sysop'],
        delete: 7813,
        revdel: 18,
        restore: 31,
        block: 366,
        unblock: 9,
        protected: 367,
        unprotected: 3,
        rights: 0,
        reblock: 20,
        modifyprotect: 29,
        abusefilter: 107,
        merge: 20,
        import: 0,
    },
    {
        userid: 106127,
        name: 'Nullzero',
        editcount: 19504,
        registration: '2011-02-18T13:02:34Z',
        groups: ['*', 'user', 'autoconfirmed', 'interface-admin', 'sysop'],
        delete: 7764,
        revdel: 10,
        restore: 76,
        block: 408,
        unblock: 31,
        protected: 287,
        unprotected: 3,
        rights: 0,
        reblock: 13,
        modifyprotect: 15,
        abusefilter: 331,
        merge: 13,
        import: 0,
    },
    {
        userid: 14820,
        name: 'Pongsak ksm',
        editcount: 59037,
        registration: '2006-11-26T07:56:40Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 4197,
        revdel: 2,
        restore: 28,
        block: 11,
        unblock: 0,
        protected: 38,
        unprotected: 0,
        rights: 0,
        reblock: 0,
        modifyprotect: 4,
        abusefilter: 0,
        merge: 0,
        import: 0,
    },
    {
        userid: 2746,
        name: 'Sry85',
        editcount: 99474,
        registration: '2006-01-21T09:26:06Z',
        groups: [
            '*',
            'user',
            'autoconfirmed',
            'bureaucrat',
            'interface-admin',
            'sysop',
        ],
        delete: 80450,
        revdel: 0,
        restore: 194,
        block: 1232,
        unblock: 13,
        protected: 921,
        unprotected: 52,
        rights: 17,
        reblock: 37,
        modifyprotect: 31,
        abusefilter: 68,
        merge: 37,
        import: 0,
    },
    {
        userid: 3630,
        name: 'Timekeepertmk',
        editcount: 13876,
        registration: '2006-03-14T10:20:29Z',
        groups: ['*', 'user', 'autoconfirmed', 'checkuser', 'sysop'],
        delete: 11177,
        revdel: 53,
        restore: 67,
        block: 348,
        unblock: 4,
        protected: 39,
        unprotected: 1,
        rights: 31,
        reblock: 19,
        modifyprotect: 5,
        abusefilter: 0,
        merge: 19,
        import: 0,
    },
    {
        userid: 9092,
        name: 'Xiengyod',
        editcount: 20554,
        registration: '2006-08-10T06:26:23Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 2999,
        revdel: 0,
        restore: 2,
        block: 75,
        unblock: 1,
        protected: 43,
        unprotected: 0,
        rights: 0,
        reblock: 12,
        modifyprotect: 8,
        abusefilter: 0,
        merge: 12,
        import: 0,
    },
    {
        userid: 328795,
        name: 'ZeroSixTwo',
        editcount: 61319,
        registration: '2018-08-21T19:45:19Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 94,
        revdel: 0,
        restore: 0,
        block: 0,
        unblock: 0,
        protected: 0,
        unprotected: 0,
        rights: 0,
        reblock: 0,
        modifyprotect: 0,
        abusefilter: 0,
        merge: 0,
        import: 0,
    },
    {
        userid: 43396,
        name: 'พุทธามาตย์',
        editcount: 17302,
        registration: '2008-05-14T04:22:16Z',
        groups: ['*', 'user', 'autoconfirmed', 'sysop'],
        delete: 3579,
        revdel: 6,
        restore: 4,
        block: 196,
        unblock: 2,
        protected: 188,
        unprotected: 1,
        rights: 0,
        reblock: 9,
        modifyprotect: 7,
        abusefilter: 0,
        merge: 9,
        import: 0,
    },
];
const logger = Logger.child({
    script: 'adminstats',
});
cli.flags.debug && logger.debug(cli.flags);
class AdminStats {
    constructor(config) {
        this.config = config ?? cli.flags;
    }
    async run() {
        let admins = await this.getAdmins();
        this.updateAt = new Date().toISOString();
        let adminStatsData = await Promise.all(admins.map(async (admin) => {
            return {
                ...admin,
                ...(await this.getAdminStats(admin.userid, admin.name)),
            };
        }));
        let adminStatsDataLastSixMonths = await Promise.all(admins.map(async (admin) => {
            return {
                ...admin,
                ...(await this.getAdminStats(admin.userid, admin.name, true)),
            };
        }));
        this.connection.end();
        this.connection = null;
        let formattedTable = this.formatAdminsTable(adminStatsData);
        let formattedTableLastSixMonths = this.formatAdminsTable(adminStatsDataLastSixMonths);
        if (this.config.dryRun) {
            console.log(formattedTable);
            console.log(formattedTableLastSixMonths);
            return;
        }
        await this.updateAdminStats(await formattedTable, await formattedTableLastSixMonths);
    }
    async getAdminStats(userid, username, onlyLastSixMonths = false) {
        const log_delete_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'delete'", [userid], onlyLastSixMonths);
        const log_revdel_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'revision'", [userid], onlyLastSixMonths);
        const log_restore_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'restore'", [userid], onlyLastSixMonths);
        const log_block_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'block'", [userid], onlyLastSixMonths);
        const log_unblock_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'unblock'", [userid], onlyLastSixMonths);
        const log_protected_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'protect'", [userid], onlyLastSixMonths);
        const log_unprotected_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'unprotect'", [userid], onlyLastSixMonths);
        const log_rights_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'rights' AND `log_action` = 'rights'", [userid], onlyLastSixMonths);
        const log_reblock_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'reblock'", [userid], onlyLastSixMonths);
        const log_modifyprotect_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'modify'", [userid], onlyLastSixMonths);
        const log_abusefilter_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'abusefilter'", [userid], onlyLastSixMonths);
        const log_merge_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'reblock'", [userid], onlyLastSixMonths);
        const log_import_count = await this.queryReplica("SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'import'", [userid], onlyLastSixMonths);
        return {
            delete: log_delete_count,
            revdel: log_revdel_count,
            restore: log_restore_count,
            block: log_block_count,
            unblock: log_unblock_count,
            protected: log_protected_count,
            unprotected: log_unprotected_count,
            rights: log_rights_count,
            reblock: log_reblock_count,
            modifyprotect: log_modifyprotect_count,
            abusefilter: log_abusefilter_count,
            merge: log_merge_count,
            import: log_import_count,
        };
    }
    async getAdmins() {
        const admins = await bot.continuedQuery({
            action: 'query',
            list: 'allusers',
            auprop: ['groups', 'blockinfo', 'editcount', 'registration'].join('|'),
            augroup: ['sysop', 'interface-admin'].join('|'),
            aulimit: 'max',
        });
        return admins[0].query.allusers.filter((user) => {
            return !this.config.excludeUsers?.includes(user.name);
        });
    }
    async queryReplica(query, value, onlyLastSixMonths) {
        if (!this.connection) {
            this.connection = await conn.catch((err) => {
                logger.error(`cannot connect to replica database: ${err.message}`, {
                    err,
                });
                process.exit(1);
                return null;
            });
        }
        if (onlyLastSixMonths) {
            query += ` AND log_timestamp > '${new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString()}'`;
        }
        return await this.connection
            .query(query, value)
            .catch((err) => {
            logger.error('cannot execute query', { err });
            process.exit(1);
            return [];
        })
            .then((res) => res[0][0].count);
    }
    async formatAdminsTable(statsDatas) {
        let tableContent = '';
        const tableHeader = `{| class="wikitable sortable" style="text-align: center;" \n` +
            `! rowspan="2" |ชื่อผู้ใช้ \n` +
            `! rowspan="2" |กลุ่มผู้ใช้ \n` +
            `! rowspan="2" |จำนวนการแก้ไข \n` +
            `! colspan="3" |การลบ \n` +
            `! colspan="3" |การบล็อก \n` +
            `! colspan="3" |การป้องกันหน้า \n` +
            `! rowspan="2" |ให้/ลบสิทธิ์ \n` +
            `! rowspan="2" |แก้ไขตัวกรอง \n` +
            `! rowspan="2" |ผสานหน้า \n` +
            `! rowspan="2" |นำเข้า \n` +
            `|- \n` +
            `!ลบ \n` +
            `!ลบรุ่น \n` +
            `!กู้คืน \n` +
            `!บล็อก \n` +
            `!ปลดบล็อก \n` +
            `!บล็อกซ้ำ \n` +
            `!ป้องกัน \n` +
            `!ยกเลิกป้องกัน \n` +
            `!ป้องกันซ้ำ \n`;
        tableContent += tableHeader;
        for (const statsData of statsDatas) {
            tableContent += `|- \n`;
            // ชื่อผู้ใช้
            tableContent += `| [[ผู้ใช้:${statsData.name}|${statsData.name}]] \n`;
            // กลุ่มผู้ใช้
            tableContent += `| ${this.formatUserGroups(statsData.groups)} \n`;
            // จำนวนการแก้ไข
            tableContent += `| ${statsData.editcount
                .toString()
                .split(/(?=(?:\d{3})+(?:\.|$))/g)
                .join(',')} \n`;
            // การลบ
            tableContent += `| ${statsData.delete} \n`;
            tableContent += `| ${statsData.revdel} \n`;
            tableContent += `| ${statsData.restore} \n`;
            // การบล็อก
            tableContent += `| ${statsData.block} \n`;
            tableContent += `| ${statsData.unblock} \n`;
            tableContent += `| ${statsData.reblock} \n`;
            // การป้องกันหน้า
            tableContent += `| ${statsData.protected} \n`;
            tableContent += `| ${statsData.unprotected} \n`;
            tableContent += `| ${statsData.modifyprotect} \n`;
            // ให้/ลบสิทธิ์
            tableContent += `| ${statsData.rights} \n`;
            // แก้ไขตัวกรอง
            tableContent += `| ${statsData.abusefilter} \n`;
            // ผสานหน้า
            tableContent += `| ${statsData.merge} \n`;
            // นำเข้า
            tableContent += `| ${statsData.import} \n`;
        }
        tableContent += `|} \n`;
        return tableContent;
    }
    formatUserGroups(groups) {
        return groups
            .sort((a, b) => {
            // sysop then interface-admin then checkuser then bureaucrat
            if (a === 'sysop') {
                return -1;
            }
            else if (b === 'sysop') {
                return 1;
            }
            else if (a === 'interface-admin') {
                return -1;
            }
            else if (b === 'interface-admin') {
                return 1;
            }
            else if (a === 'checkuser') {
                return -1;
            }
            else if (b === 'checkuser') {
                return 1;
            }
            else if (a === 'bureaucrat') {
                return -1;
            }
            else if (b === 'bureaucrat') {
                return 1;
            }
            else {
                return 0;
            }
        })
            .map((group) => {
            if (group === 'sysop') {
                return '[[File:Admin mop.svg|28px|link=|alt=ผู้ดูแลระบบ|ผู้ดูแลระบบ]]';
            }
            else if (group === 'interface-admin') {
                return '[[File:Wikipedia Interface administrator.svg|20px|link=|alt=ผู้ดูแลอินเตอร์เฟซ|ผู้ดูแลอินเตอร์เฟซ]]';
            }
            else if (group === 'checkuser') {
                return '[[File:Wikipedia Checkuser.svg|20px|link=|alt=ผู้ตรวจสอบผู้ใช้|ผู้ตรวจสอบผู้ใช้]]';
            }
            else if (group === 'bureaucrat') {
                return '[[File:Wikipedia bureaucrat.svg|20px|link=|alt=ผู้ดูแลสิทธิ์แต่งตั้ง|ผู้ดูแลสิทธิ์แต่งตั้ง]]';
            }
            else {
                return null;
            }
        })
            .filter((group) => group !== null)
            .join(' ');
    }
    async updateAdminStats(formattedTable, formattedTableLastSixMonths) {
        bot.edit('วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ', (rev) => {
            let content = `{{/ส่วนหัว}}`;
            content += `\n== สถิติผู้ดูแลระบบ (รวมทั้งหมด) ==\n`;
            content += `<section begin="adminstats" />\n`;
            content += formattedTable;
            content += `<section end="adminstats" />\n`;
            content += `\n== สถิติผู้ดูแลระบบ (6 เดือนล่าสุด) ==\n`;
            content += `<section begin="adminstatslastsixmonths" />\n`;
            content += formattedTableLastSixMonths;
            content += `<section end="adminstatslastsixmonths" />\n`;
            content += `: ข้อมูลอัปเดตล่าสุดเมื่อ: <section begin="last-update" />{{subst:#timel:r|${this.updateAt}}}<section end="last-update" />`;
            return {
                text: content,
                summary: 'อัปเดตสถิติผู้ดูแลระบบ',
                minor: false,
            };
        });
    }
}
const config = {
    dryRun: cli.flags.dryRun,
    excludeUsers: ['ตัวกรองการละเมิดกฎ'],
};
new AdminStats(config).run();
