import { Bot } from "@core/bot";

type AdminLogAction = {
  type: string;
  action: string;
  count: number;
  last6MonthsCount: number;
};

type AdminStats = {
  userid: number;
  name: string;
  groups: string[];
  counts: AdminLogAction[];
};

type AdminStatsRow = {
  user_id: number;
  user_name: string;
  user_groups: string | null;
  log_type: string | null;
  log_action: string | null;
  count: number | string;
  last_6_months_count: number | string;
};

export default class AdminStatsBot extends Bot {
  info: Bot["info"] = {
    id: "adminstats",
    name: "adminstats",
    description: "Fetch and display admin statistics",
    frequency: "0 0 * * 0", // Every Sunday at midnight
  };

  queryList = [
    // Delete actions
    {
      type: "delete",
      action: "delete",
    },
    {
      type: "delete",
      action: "revision",
    },
    {
      type: "delete",
      action: "restore",
    },
    // Block actions
    { type: "block", action: "block" },
    { type: "block", action: "unblock" },
    {
      type: "block",
      action: "reblock",
    },
    // Protect actions
    {
      type: "protect",
      action: "protect",
    },
    {
      type: "protect",
      action: "unprotect",
    },
    {
      type: "protect",
      action: "modify",
    },
    // User rights actions
    {
      type: "rights",
      action: "rights",
    },
    {
      type: "abusefilter",
      action: "modify",
    },
    {
      type: "merge",
      action: "merge",
    },
    {
      type: "import",
      action: "interwiki",
    },
  ] as const;

  tableHeader =
    `{| class="wikitable sortable defaultright col1left col2center"\n` +
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
    `!แก้ไขป้องกัน\n`;

  private readonly eligibleGroups = ["sysop", "bureaucrat", "interface-admin"];

  private readonly displayGroups = [
    "sysop",
    "interface-admin",
    "bureaucrat",
    "checkuser",
  ];

  async beforeRun(): Promise<void> {
    await this.replica.init();
  }

  async run() {
    const adminStats = await this.getAdminStats();
    const adminStatsLines = adminStats.map((admin) =>
      this.formatAdminStatsLine(admin, "count"),
    );
    const adminStatsLast6MonthsLines = adminStats.map((admin) =>
      this.formatAdminStatsLine(admin, "last6MonthsCount"),
    );

    const finalAllTimeTable =
      this.tableHeader + adminStatsLines.join("\n") + `\n|}`;

    const finalLast6MonthsTable =
      this.tableHeader + adminStatsLast6MonthsLines.join("\n") + `\n|}`;

    let pageContent =
      (await this.bot.read("วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ")).revisions?.[0]
        .content || "";
    pageContent = this.insertBetween(
      pageContent,
      '<section begin="adminstats" />',
      '<section end="adminstats" />',
      `\n${finalAllTimeTable}\n`,
    );

    pageContent = this.insertBetween(
      pageContent,
      '<section begin="adminstatslastsixmonths" />',
      '<section end="adminstatslastsixmonths" />',
      `\n${finalLast6MonthsTable}\n`,
    );

    pageContent = this.insertBetween(
      pageContent,
      '<section begin="last-update" />',
      '<section end="last-update" />',
      "{{subst:#time:r}}",
    );

    await this.bot.edit(
      "วิกิพีเดีย:ผู้ดูแลระบบ/สถิติ",
      () => {
        return {
          text: pageContent,
          summary: `อัปเดตสถิติผู้ดูแลระบบ`,
        };
      },
      {},
    );
  }

  formatAdminStatsLine(
    admin: AdminStats,
    countField: "count" | "last6MonthsCount",
  ) {
    return (
      `|-\n` +
      `| [[Special:Contributions/${admin.name}|${admin.name}]] || ` +
      `${this.userGroupFormatter(admin.groups)} || ` +
      this.queryList
        .map((q) => this.getCount(admin.counts, q.type, q.action, countField))
        .join(" || ")
    );
  }

  userGroupFormatter(groups: string[]) {
    const groupMap: { [key: string]: string } = {
      sysop: "[[File:Admin mop.svg|20px|link=|alt=ผู้ดูแลระบบ|ผู้ดูแลระบบ]]",
      "interface-admin":
        "[[File:Wikipedia Interface administrator.svg|20px|link=|alt=ผู้ดูแลอินเตอร์เฟซ|ผู้ดูแลอินเตอร์เฟซ]]",
      bureaucrat:
        "[[File:Wikipedia bureaucrat.svg|20px|link=|alt=ผู้ดูแลสิทธิ์แต่งตั้ง|ผู้ดูแลสิทธิ์แต่งตั้ง]]",
      checkuser:
        "[[File:Wikipedia Checkuser.svg|20px|link=|alt=ผู้ตรวจสอบผู้ใช้|ผู้ตรวจสอบผู้ใช้]]",
    };
    const orderedGroups = [
      "sysop",
      "interface-admin",
      "bureaucrat",
      "checkuser",
    ];

    return groups
      .toSorted((a, b) => orderedGroups.indexOf(a) - orderedGroups.indexOf(b))
      .map((g) => groupMap[g] || "")
      .filter(Boolean)
      .join("");
  }

  getCount(
    stats: AdminLogAction[],
    type: string,
    action: string,
    countField: "count" | "last6MonthsCount" = "count",
  ) {
    return (
      stats.find((s) => s.type === type && s.action === action)?.[countField] ||
      0
    );
  }

  async getAdminStats() {
    const last6MonthsDate = new Date();
    last6MonthsDate.setMonth(last6MonthsDate.getMonth() - 6);

    return this.queryAdminStats(
      this.formatMediaWikiTimestamp(last6MonthsDate),
      this.formatMediaWikiTimestamp(new Date()),
    );
  }

  async queryAdminStats(last6MonthsTimestamp: string, nowTimestamp: string) {
    const eligibleGroupPlaceholders = this.eligibleGroups
      .map(() => "?")
      .join(", ");
    const displayGroupPlaceholders = this.displayGroups
      .map(() => "?")
      .join(", ");
    const logActionFilter = this.queryList
      .map(() => "(logging.log_type = ? AND logging.log_action = ?)")
      .join(" OR ");
    const logActionValues = this.queryList.flatMap(({ type, action }) => [
      type,
      action,
    ]);

    const [rows] = await this.replica.query<AdminStatsRow[]>(
      `
				/* adminstats.ts SLOW_OK */
				WITH admin_users AS (
					SELECT DISTINCT
						user.user_id,
						user.user_name
					FROM user
					JOIN user_groups AS eligible_groups
						ON eligible_groups.ug_user = user.user_id
					WHERE eligible_groups.ug_group IN (${eligibleGroupPlaceholders})
						AND (
							eligible_groups.ug_expiry IS NULL
							OR eligible_groups.ug_expiry = 'infinity'
							OR eligible_groups.ug_expiry > ?
						)
				),
				admin_groups AS (
					SELECT
						user_groups.ug_user,
						GROUP_CONCAT(DISTINCT user_groups.ug_group) AS user_groups
					FROM user_groups
					WHERE user_groups.ug_group IN (${displayGroupPlaceholders})
						AND (
							user_groups.ug_expiry IS NULL
							OR user_groups.ug_expiry = 'infinity'
							OR user_groups.ug_expiry > ?
						)
					GROUP BY user_groups.ug_user
				),
				admin_log_counts AS (
					SELECT
						actor.actor_user AS user_id,
						logging.log_type,
						logging.log_action,
						COUNT(*) AS count,
						SUM(logging.log_timestamp > ?) AS last_6_months_count
					FROM admin_users
					JOIN actor
						ON actor.actor_user = admin_users.user_id
					JOIN logging
						ON logging.log_actor = actor.actor_id
					WHERE ${logActionFilter}
					GROUP BY actor.actor_user, logging.log_type, logging.log_action
				)
				SELECT
					admin_users.user_id,
					admin_users.user_name,
					admin_groups.user_groups,
					admin_log_counts.log_type,
					admin_log_counts.log_action,
					COALESCE(admin_log_counts.count, 0) AS count,
					COALESCE(admin_log_counts.last_6_months_count, 0) AS last_6_months_count
				FROM admin_users
				LEFT JOIN admin_groups
					ON admin_groups.ug_user = admin_users.user_id
				LEFT JOIN admin_log_counts
					ON admin_log_counts.user_id = admin_users.user_id
				ORDER BY admin_users.user_name;
			`,
      [
        ...this.eligibleGroups,
        nowTimestamp,
        ...this.displayGroups,
        nowTimestamp,
        last6MonthsTimestamp,
        ...logActionValues,
      ],
    );

    return this.adminStatsFromRows(rows);
  }

  adminStatsFromRows(rows: AdminStatsRow[]) {
    const adminStats = new Map<number, AdminStats>();

    for (const row of rows) {
      const userid = row.user_id;
      const admin: AdminStats = adminStats.get(userid) ?? {
        userid,
        name: row.user_name,
        groups: row.user_groups ? row.user_groups.split(",") : [],
        counts: [],
      };

      if (row.log_type && row.log_action) {
        admin.counts.push({
          type: row.log_type,
          action: row.log_action,
          count: Number(row.count),
          last6MonthsCount: Number(row.last_6_months_count),
        });
      }

      adminStats.set(userid, admin);
    }

    return [...adminStats.values()];
  }

  formatMediaWikiTimestamp(date: Date) {
    return date.toISOString().replace(/\D/g, "").slice(0, 14);
  }

  insertBetween(
    str: string,
    anchorStart: string,
    anchorEnd: string,
    insertStr: string,
  ) {
    const startIndex = str.indexOf(anchorStart);
    const endIndex = str.indexOf(anchorEnd, startIndex + anchorStart.length);

    if (startIndex === -1 || endIndex === -1) {
      return str;
    }

    return (
      str.slice(0, startIndex + anchorStart.length) +
      insertStr +
      str.slice(endIndex)
    );
  }
}
