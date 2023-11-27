/**
 * @id 5
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
import { conn, query } from '../patsabot/replica.js';
import meow from 'meow';
const cli = meow(
  `
  Script to update admins stats at [[w:th:วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ]]

  Usage
    $ patsabot adminstats [options]

  Options
		--dry-run, -n	    Do not actually update the page, print out the text instead.
    --debug, -d	      Debug mode.
`,
  {
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
  }
);
const logger = Logger.child({
  script: 'adminstats',
});
cli.flags.debug && logger.debug(cli.flags);
bot.enableEmergencyShutoff({
  page: 'ผู้ใช้:PatsaBot/shutoff/5',
  intervalDuration: 5000,
  condition: function (pagetext) {
    return pagetext !== 'on';
  },
  onShutoff: function (pagetext) {
    process.exit();
  },
});
class AdminStats {
  constructor(config) {
    this.config = config ?? cli.flags;
  }
  async run() {
    let admins = await this.getAdmins();
    this.updateAt = new Date().toISOString();
    let adminsStatsData = [];
    console.log(admins.map((a) => a.name));
    for (const admin of admins) {
      const stats = await this.getAdminStats(admin.userid, admin.name);
      console.log(admin.name, stats.unblock);
      adminsStatsData.push({
        ...admin,
        ...stats,
      });
      // wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    let adminStatsData = await Promise.all(
      admins.map(async (admin) => {
        const stats = await this.getAdminStats(admin.userid, admin.name);
        return {
          ...admin,
          ...stats,
        };
      })
    );
    let adminStatsDataLastSixMonths = await Promise.all(
      admins.map(async (admin) => {
        const stats = await this.getAdminStats(admin.userid, admin.name, true);
        return {
          ...admin,
          ...stats,
        };
      })
    ).catch((err) => {
      logger.error('cannot get admin stats', { err });
      process.exit(1);
      return [];
    });
    this.connection.end();
    this.connection = null;
    let formattedTable = this.formatAdminsTable(adminStatsData);
    let formattedTableLastSixMonths = this.formatAdminsTable(
      adminStatsDataLastSixMonths
    );
    if (this.config.dryRun) {
      console.log(formattedTable);
      console.log(formattedTableLastSixMonths);
      return;
    }
    await this.updateAdminStats(
      await formattedTable,
      await formattedTableLastSixMonths
    );
  }
  async getAdminStats(userid, username, onlyLastSixMonths = false) {
    let q = `SELECT
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'delete') AS log_delete_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'revision') AS log_revdel_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'restore') AS log_restore_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'block') AS log_block_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'unblock') AS log_unblock_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'protect') AS log_protected_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'unprotect') AS log_unprotected_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'rights' AND log_action = 'rights') AS log_rights_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'reblock') AS log_reblock_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'modify') AS log_modifyprotect_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'abusefilter') AS log_abusefilter_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND (log_type = 'merge' OR log_type = 'mergeuser') AND log_action = 'merge') AS log_merge_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'import') AS log_import_count
      `;
    if (onlyLastSixMonths) {
      q = `SELECT
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'delete')
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'revision') AS log_revdel_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'delete' AND log_action = 'restore') AS log_restore_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'block') AS log_block_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'unblock') AS log_unblock_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'protect') AS log_protected_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'unprotect') AS log_unprotected_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'rights' AND log_action = 'rights') AS log_rights_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'block' AND log_action = 'reblock') AS log_reblock_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'protect' AND log_action = 'modify') AS log_modifyprotect_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'abusefilter') AS log_abusefilter_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND (log_type = 'merge' OR log_type = 'mergeuser') AND log_action = 'merge') AS log_merge_count,
        (SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE actor_user = ? AND log_type = 'import') AS log_import_count
      `;
    }
    const results = await query(q, [
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
      userid,
    ]).catch((err) => {
      logger.error('cannot execute query', { err });
    });
    return {
      delete: results[0][0].log_delete_count,
      revdel: results[0][0].log_revdel_count,
      restore: results[0][0].log_restore_count,
      block: results[0][0].log_block_count,
      unblock: results[0][0].log_unblock_count,
      reblock: results[0][0].log_reblock_count,
      protected: results[0][0].log_protected_count,
      unprotected: results[0][0].log_unprotected_count,
      modifyprotect: results[0][0].log_modifyprotect_count,
      rights: results[0][0].log_rights_count,
      abusefilter: results[0][0].log_abusefilter_count,
      merge: results[0][0].log_merge_count,
      import: results[0][0].log_import_count,
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
      this.connection = conn;
    }
    if (onlyLastSixMonths) {
      query += ` AND log_timestamp > '${new Date(
        new Date().setMonth(new Date().getMonth() - 6)
      ).toISOString()}'`;
    }
    return await this.connection
      .query(query, value)
      .catch((err) => {
        logger.error('cannot execute query', { err });
      })
      .then((res) => {
        if (res[0][0] === undefined) {
          return null;
        }
        return res[0][0].count;
      });
  }
  async formatAdminsTable(statsDatas) {
    let tableContent = '';
    const tableHeader =
      `{| class="wikitable sortable" style="text-align: center;" \n` +
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
        } else if (a === 'interface-admin' && b !== 'sysop') {
          return -1;
        } else if (
          a === 'checkuser' &&
          b !== 'sysop' &&
          b !== 'interface-admin'
        ) {
          return -1;
        } else if (
          a === 'bureaucrat' &&
          b !== 'sysop' &&
          b !== 'interface-admin' &&
          b !== 'checkuser'
        ) {
          return -1;
        } else {
          return 1;
        }
      })
      .map((group) => {
        if (group === 'sysop') {
          return '[[File:Admin mop.svg|28px|link=|alt=ผู้ดูแลระบบ|ผู้ดูแลระบบ]]';
        } else if (group === 'interface-admin') {
          return '[[File:Wikipedia Interface administrator.svg|20px|link=|alt=ผู้ดูแลอินเตอร์เฟซ|ผู้ดูแลอินเตอร์เฟซ]]';
        } else if (group === 'checkuser') {
          return '[[File:Wikipedia Checkuser.svg|20px|link=|alt=ผู้ตรวจสอบผู้ใช้|ผู้ตรวจสอบผู้ใช้]]';
        } else if (group === 'bureaucrat') {
          return '[[File:Wikipedia bureaucrat.svg|20px|link=|alt=ผู้ดูแลสิทธิ์แต่งตั้ง|ผู้ดูแลสิทธิ์แต่งตั้ง]]';
        } else {
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
