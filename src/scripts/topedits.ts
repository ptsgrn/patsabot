import { Bot } from "@core/bot";

interface UserEdit {
	user_name: string;
	user_editcount: number;
	user_group: string[];
	is_active: boolean;
	is_anonymous: boolean;
}

export default class TopEdits extends Bot {
	info: Bot["info"] = {
		id: "topedits",
		name: "TopEdits",
		description:
			"อัปเดตตาราง[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ]] และ[[วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)]]",
	};

	options = {
		// Maximum number of user to get edit count
		maxQuerySize: 2000,
		listTop: 500,
		targetPage: {
			noBot: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ/รายการ",
			withBot: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียที่แก้ไขมากที่สุด 500 อันดับ (รวมบอต)/รายการ",
		},
		anonymousList: "วิกิพีเดีย:รายชื่อชาววิกิพีเดียตามจำนวนการแก้ไข/นิรนาม",
		anonymousListUserRegex: /ผู้ใช้:(.+)\]\]/g,
		groupText: {
			sysop: "Admin",
			bot: "Bot",
		} as Record<string, string>,
		summary: "ปรับปรุงรายการ",
	};

	async getTopEdits() {
		this.log.info("Getting top edits with groups");
		this.log.profile("getTopEdits");
		const results = await this.replica.query(`
      /* topedits.ts SLOW_OK */
      SELECT
        user_name,
        user_editcount,
        GROUP_CONCAT(ug_group) AS user_groups
      FROM user
      LEFT JOIN user_groups ON user_id = ug_user
      WHERE user_editcount > 0
      GROUP BY user_id, user_name, user_editcount
      ORDER BY user_editcount DESC
      LIMIT ${this.options.maxQuerySize};
    `);
		this.log.profile("getTopEdits");
		if (!results) {
			throw new Error("Query returned no results");
		}
		// @ts-expect-error
		return results[0].map(
			(row: { user_name: Buffer; user_editcount: number; user_groups: string | null }) => ({
				user_name: row.user_name.toString(),
				user_editcount: row.user_editcount,
				user_group: row.user_groups ? row.user_groups.toString().split(",") : [] as string[],
			}),
		) as { user_name: string; user_editcount: number; user_group: string[] }[];
	}

	async getUserAnonymousList() {
		this.log.info("Getting anonymous user list");
		this.log.profile("getUserAnonymousList");
		const page = await this.bot.read(this.options.anonymousList);
		this.log.profile("getUserAnonymousList");
		if (!page.revisions) {
			throw new Error("Failed to get page content");
		}
		const users = page.revisions?.[0].content?.matchAll(
			this.options.anonymousListUserRegex,
		);
		return Array.from(users || []).map((m) => m[1]);
	}

	async getActiveUsers() {
		let activeusers: string[] = [];
		this.log.info("Getting active users");
		this.log.profile("getActiveUsers");
		for await (const json of this.bot.continuedQueryGen({
			action: "query",
			list: "allusers",
			auactiveusers: 1,
			aulimit: "max",
		})) {
			const users = json.query?.allusers.map(
				(user: { name: string }) => user.name,
			) as string[];
			activeusers = activeusers.concat(users);
		}
		this.log.profile("getActiveUsers");
		return activeusers;
	}

	userGroupText(groups: string[]) {
		const userGroup = groups
			.map((group) => this.options.groupText[group])
			.filter((v) => v);
		if (userGroup.length === 0) {
			return "";
		}
		return ` (${userGroup.join(", ")})`;
	}

	createTable(userList: UserEdit[], limit: number = 500) {
		let content = '<section begin="list500" />';
		let count = 1;
		for (const {
			user_name,
			is_active,
			is_anonymous,
			user_editcount,
			user_group,
		} of userList) {
			if (is_anonymous) {
				content +=
					`\n|-\n| ${count} ` +
					`|| [นิรนาม] ` +
					`|| {{sort|${user_editcount.toString()}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}}}`;
			} else {
				content +=
					`\n|-\n| ${count} ` +
					`|| [[ผู้ใช้:${user_name}|${!is_active ? `<span style="color: gray;">${user_name}</span>` : user_name}]]${this.userGroupText(user_group)} ` +
					`|| {{sort|${user_editcount.toString()}|[[พิเศษ:เรื่องที่เขียน/${user_name}|${user_editcount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}]]}}`;
			}
			if (count >= limit) {
				break;
			}
			count += 1;
		}
		return `${content}\n<section end="list500" />`;
	}

	processListPageContent(text: string, table: string) {
		const pretext = text.split('<section begin="list500" />')[0];
		const posttext = text.split('<section end="list500" />')[1];
		text = pretext + table + posttext;
		text =
			text.split('<section begin="lastupdate" />')[0] +
			'<section begin="lastupdate" />{{subst:#timel:r}}<section end="lastupdate" />' +
			text.split('<section end="lastupdate" />')[1];
		return text;
	}

	async saveToWiki(userList: UserEdit[]) {
		const noBotContent = this.createTable(
			userList
				.filter((user) => !user.user_group.includes("bot"))
				.filter((v) => v.user_name !== "New user message"),
			this.options.listTop,
		);
		const withBotContent = this.createTable(userList, this.options.listTop);

		if (this.dryRun) {
			this.log.warn("Dry run enabled, skipping edit");
			const noBotRead = (await this.bot.read(this.options.targetPage.noBot))
				.revisions?.[0].content;
			if (!noBotRead) {
				throw new Error("Failed to get page content");
			}
			console.table({
				noBotContent: this.processListPageContent(noBotRead, noBotContent),
			});
			const withBotRead = (await this.bot.read(this.options.targetPage.withBot))
				.revisions?.[0].content;
			if (!withBotRead) {
				throw new Error("Failed to get page content");
			}
			console.table({
				withBotContent: this.processListPageContent(
					withBotRead,
					withBotContent,
				),
			});
			return;
		}
		return Promise.all([
			this.bot.edit(this.options.targetPage.noBot, (rev) => {
				return {
					text: this.processListPageContent(rev.content, noBotContent),
					summary: this.options.summary,
				};
			}),
			this.bot.edit(this.options.targetPage.withBot, (rev) => {
				return {
					text: this.processListPageContent(rev.content, withBotContent),
					summary: this.options.summary,
				};
			}),
		]);
	}

	async run(): Promise<void> {
		const [topEdits, anonymousUsers, activeUsers] = await Promise.all([
			this.getTopEdits(),
			this.getUserAnonymousList(),
			this.getActiveUsers(),
		]);

		const userList: UserEdit[] = [];
		let noBotCount = 0;
		this.log.info("Processing top edits");
		this.log.profile("processTopEdits");
		for (const { user_name, user_editcount, user_group } of topEdits) {
			if (noBotCount >= this.options.listTop) break;
			userList.push({
				user_name,
				user_editcount,
				user_group,
				is_active: activeUsers.includes(user_name),
				is_anonymous: anonymousUsers.includes(user_name),
			});
			if (!user_group.includes("bot")) noBotCount++;
		}
		this.log.profile("processTopEdits");
		this.log.info("Saving to wiki");
		await this.saveToWiki(userList);
	}
}
