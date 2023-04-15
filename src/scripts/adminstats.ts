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

import type { Connection } from 'mysql2/promise';
import Logger from '../patsabot/logger.js';
import bot from '../patsabot/bot.js';
import { conn } from '../patsabot/replica.js';
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

interface AdminStatsConfig {
  dryRun: boolean;
  excludeUsers?: string[];
}

interface AllUserApiResponse {
  userid: number;
  name: string;
  editcount: number;
  registration: string;
  groups: string[];
}

interface AdminStatsData {
  userid: number;
  name: string;
  editcount: number;
  registration: string;
  groups: string[];

  delete: number;
  revdel: number;
  restore: number;

  block: number;
  unblock: number;
  reblock: number;

  protected: number;
  unprotected: number;
  modifyprotect: number;

  rights: number;
  abusefilter: number;
  merge: number;
  import: number;
}

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
  public config: AdminStatsConfig;
  private connection: Connection;
  private updateAt: string;
  constructor(config) {
    this.config = config ?? cli.flags;
  }

  async run() {
    let admins = await this.getAdmins();
    this.updateAt = new Date().toISOString();
    let adminStatsData = await Promise.all(
      admins.map(async (admin) => {
        return {
          ...admin,
          ...(await this.getAdminStats(admin.userid, admin.name)),
        };
      })
    );
    let adminStatsDataLastSixMonths = await Promise.all(
      admins.map(async (admin) => {
        return {
          ...admin,
          ...(await this.getAdminStats(admin.userid, admin.name, true)),
        };
      })
    );
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

  async getAdminStats(
    userid: number,
    username: string,
    onlyLastSixMonths = false
  ) {
    const log_delete_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'delete'",
      [userid],
      onlyLastSixMonths
    );
    const log_revdel_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'revision'",
      [userid],
      onlyLastSixMonths
    );
    const log_restore_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'delete' AND `log_action` = 'restore'",
      [userid],
      onlyLastSixMonths
    );
    const log_block_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'block'",
      [userid],
      onlyLastSixMonths
    );
    const log_unblock_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'unblock'",
      [userid],
      onlyLastSixMonths
    );
    const log_protected_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'protect'",
      [userid],
      onlyLastSixMonths
    );
    const log_unprotected_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'unprotect'",
      [userid],
      onlyLastSixMonths
    );
    const log_rights_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'rights' AND `log_action` = 'rights'",
      [userid],
      onlyLastSixMonths
    );
    const log_reblock_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'reblock'",
      [userid],
      onlyLastSixMonths
    );
    const log_modifyprotect_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'protect' AND `log_action` = 'modify'",
      [userid],
      onlyLastSixMonths
    );
    const log_abusefilter_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'abusefilter'",
      [userid],
      onlyLastSixMonths
    );
    const log_merge_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'block' AND `log_action` = 'reblock'",
      [userid],
      onlyLastSixMonths
    );
    const log_import_count = await this.queryReplica(
      "SELECT count(log_action) AS count FROM logging_userindex INNER JOIN actor_logging ON log_actor = actor_id  WHERE `actor_user` = '?' AND `log_type` = 'import'",
      [userid],
      onlyLastSixMonths
    );
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
    }) as AllUserApiResponse[];
  }

  async queryReplica(query: string, value: any[], onlyLastSixMonths?: boolean) {
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
      query += ` AND log_timestamp > '${new Date(
        new Date().setMonth(new Date().getMonth() - 6)
      ).toISOString()}'`;
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

  private async formatAdminsTable(statsDatas: AdminStatsData[]) {
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

  private formatUserGroups(groups: string[]) {
    return groups
      .sort((a, b) => {
        // sysop then interface-admin then checkuser then bureaucrat
        if (a === 'sysop') {
          return -1;
        } else if (b === 'sysop') {
          return 1;
        } else if (a === 'interface-admin') {
          return -1;
        } else if (b === 'interface-admin') {
          return 1;
        } else if (a === 'checkuser') {
          return -1;
        } else if (b === 'checkuser') {
          return 1;
        } else if (a === 'bureaucrat') {
          return -1;
        } else if (b === 'bureaucrat') {
          return 1;
        } else {
          return 0;
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

  async updateAdminStats(
    formattedTable: string,
    formattedTableLastSixMonths: string
  ) {
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

const config: AdminStatsConfig = {
  dryRun: cli.flags.dryRun,
  excludeUsers: ['ตัวกรองการละเมิดกฎ'],
};

new AdminStats(config).run();
