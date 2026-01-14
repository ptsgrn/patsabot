import { Bot } from '@core/bot';

export default class AdminStatsBot extends Bot {
  info = {
    id: "adminstats",
    name: "Admin Stats",
    description: "Fetch and display admin statistics",
  }

  queryList = [
    // Delete actions
    {
      'type': 'delete', 'action': 'delete'
    },
    {
      'type': 'delete', 'action': 'revision'
    },
    {
      'type': 'delete', 'action': 'restore'
    },
    // Block actions
    { 'type': 'block', 'action': 'block' },
    { 'type': 'block', 'action': 'unblock' },
    {
      'type': 'block', 'action': 'reblock'
    },
    // Protect actions
    {
      'type': 'protect', 'action': 'protect'
    },
    {
      'type': 'protect', 'action': 'unprotect'
    },
    {
      'type': 'protect', 'action': 'modify'
    },
    // User rights actions
    {
      'type': 'rights', 'action': 'rights'
    },
    {
      'type': 'abusefilter', 'action': 'modify'
    },
    {
      'type': 'merge', 'action': 'merge'
    },
    {
      'type': 'import', 'action': 'interwiki'
    }
  ] as const;

  tableHeader = `{| class="wikitable sortable defaultright col1left col2center"\n` +
    `! rowspan="2" |ชื่อผู้ใช้\n` +
    `! rowspan="2" |กลุ่มผู้ใช้\n` +
    `! colspan="3" |การลบ\n` +
    `! colspan="3" |การบล็อก\n` +
    `! colspan="3" |การป้องกันหน้า\n` +
    `! rowspan="2" |การแก้สิทธิ์\n` +
    `! rowspan="2" |แก้ไขตัวกรอง\n` +
    `! rowspan="2" |ผสานประวัติหน้า\n` +
    `! rowspan="2" |นำเข้า\n` +
    `|-\n` +
    `!ลบ\n` +
    `!ลบรุ่น\n` +
    `!กู้คืน\n` +
    `!บล็อก\n` +
    `!ปลดบล็อก\n` +
    `!บล็อกซ้ำ\n` +
    `!ป้องกัน\n` +
    `!ยกเลิกป้องกัน\n` +
    `!แก้ไขป้องกัน\n`

  async beforeRun(): Promise<void> {
    await this.replica.init()
  }

  async run() {
    let adminStatsLines: string[] = [];
    let adminStatsLast6MonthsLines: string[] = [];
    const adminLists: {
      userid: number;
      name: string;
      editcount: number;
      registration: string;
      groups: string[];
    }[] = await this.bot.continuedQuery({
      "action": "query",
      "format": "json",
      "list": "allusers",
      "formatversion": "2",
      "augroup": "sysop|bureaucrat|interface-admin",
      "auprop": "blockinfo|groups|editcount|registration"
    }).then(res => res.map(r => r.query?.allusers).flat());

    for (const admin of adminLists) {
      const stats = await this.getAdminStats(admin.userid);
      adminStatsLines.push(
        `|-\n` +
        `| [[Special:Contributions/${admin.name}|${admin.name}]] || ` +
        `${this.userGroupFormatter(admin.groups)} || ` +
        this.queryList.map(q =>
          this.getCount(stats.allTimeCounts, q.type, q.action)
        ).join(' || ')
      );

      adminStatsLast6MonthsLines.push(
        `|-\n` +
        `| [[Special:Contributions/${admin.name}|${admin.name}]] || ` +
        `${this.userGroupFormatter(admin.groups)} || ` +
        this.queryList.map(q =>
          this.getCount(stats.last6MonthsCounts, q.type, q.action)
        ).join(' || ')
      );
    }

    const finalAllTimeTable = this.tableHeader +
      adminStatsLines.join('\n') +
      `\n|}`;

    const finalLast6MonthsTable = this.tableHeader +
      adminStatsLast6MonthsLines.join('\n') +
      `\n|}`;

    let pageContent = (await this.bot.read('วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ')).revisions?.[0].content || '';
    pageContent = this.insertBetween(
      pageContent,
      '<section begin="adminstats" />',
      '<section end="adminstats" />',
      `\n${finalAllTimeTable}\n`
    );

    pageContent = this.insertBetween(
      pageContent,
      '<section begin="adminstatslastsixmonths" />',
      '<section end="adminstatslastsixmonths" />',
      `\n${finalLast6MonthsTable}\n`
    );

    pageContent = this.insertBetween(
      pageContent,
      '<section begin="last-update" />',
      '<section end="last-update" />',
      '{{subst:#time:r}}'
    )

    console.log(pageContent)
  }

  userGroupFormatter(groups: string[]) {
    const groupMap: { [key: string]: string } = {
      'sysop': '[[File:Admin mop.svg|20px|link=|alt=ผู้ดูแลระบบ|ผู้ดูแลระบบ]]',
      'interface-admin': '[[File:Wikipedia Interface administrator.svg|20px|link=|alt=ผู้ดูแลอินเตอร์เฟซ|ผู้ดูแลอินเตอร์เฟซ]]',
      'bureaucrat': '[[File:Wikipedia bureaucrat.svg|20px|link=|alt=ผู้ดูแลสิทธิ์แต่งตั้ง|ผู้ดูแลสิทธิ์แต่งตั้ง]]',
      'checkuser': '[[File:Wikipedia Checkuser.svg|20px|link=|alt=ผู้ตรวจสอบผู้ใช้|ผู้ตรวจสอบผู้ใช้]]',
    };
    const orderedGroups = ['sysop', 'interface-admin', 'bureaucrat', 'checkuser'];

    return groups
      .toSorted((a, b) =>
        orderedGroups.indexOf(a) - orderedGroups.indexOf(b)
      )
      .map(g => groupMap[g] || "")
      .filter(Boolean)
      .join('');
  }

  getCount(stats: Awaited<ReturnType<AdminStatsBot['queryLogAction']>>, type: string, action: string) {
    return stats.find(s => s.type === type && s.action === action)?.count || 0;
  }

  async getAdminStats(userId: number) {
    const last6MonthsDate = new Date();
    last6MonthsDate.setMonth(last6MonthsDate.getMonth() - 6);

    const allTimeCounts = await this.queryLogAction(userId);
    const last6MonthsCounts = await this.queryLogAction(userId, last6MonthsDate);

    return {
      allTimeCounts,
      last6MonthsCounts
    }
  }

  async queryLogAction(userId: number, filterAfter?: Date) {
    const [rows, fields] = await this.replica.query(`
      SELECT log_type, log_action, COUNT(log_timestamp) as count
      FROM logging
      JOIN actor
      ON log_actor = actor_id
      WHERE actor_user = ${userId}
      ${filterAfter
        ? `AND log_timestamp > '${filterAfter.toISOString().replace('T', ' ').substring(0, 19)}'`
        : ''
      }
      GROUP BY log_type, log_action;
    `)

    return rows.map((row: any) => ({
      type: row.log_type.toString(),
      action: row.log_action?.toString(),
      count: row.count
    })) as { type: string; action: string; count: number }[];
  }

  insertBetween(str: string, anchorStart: string, anchorEnd: string, insertStr: string) {
    const startIndex = str.indexOf(anchorStart);
    const endIndex = str.indexOf(anchorEnd, startIndex + anchorStart.length);

    if (startIndex === -1 || endIndex === -1) {
      return str; // Anchors not found, return original string
    }

    return str.slice(0, startIndex + anchorStart.length) +
      insertStr +
      str.slice(endIndex);
  }
}