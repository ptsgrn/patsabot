import { Bot } from "@core";

interface G10CandidateRow {
  page_namespace: number;
  page_title: string;
  localized_namespace: string;
  last_nonbot_edit: string;
  last_nonbot_editor: string;
  creator_name: string;
}

export default class G10Nominator extends Bot {
  info = {
    id: "g10-nominator",
    name: "G10 Nominator",
    description: "แจ้งลบ",
    frequency: "0 0 * * *", // every 24 hours
  };

  cli = new this.Command().option(
    "--dry-run",
    "Dry run mode. The bot will log the pages it would nominate without actually nominating them.",
    false,
  );

  async run() {
    const [rows] = await this.replica.query<G10CandidateRow[]>(`
      /* inactive-drafts.ts SLOW_OK */
		WITH candidate_pages AS (
			SELECT page.page_id, page.page_namespace, page.page_title
			FROM page
			WHERE page.page_namespace = 118
				AND page.page_is_redirect = 0

			UNION DISTINCT

			SELECT page.page_id, page.page_namespace, page.page_title
			FROM templatelinks
			JOIN linktarget
				ON lt_id = tl_target_id
				AND lt_namespace = 10
				AND lt_title IN ('บทความฉบับร่าง', 'ฉบับร่างบทความ')
			JOIN page
				ON page.page_id = tl_from
				AND page.page_is_redirect = 0
				AND page.page_namespace = 118
		),
		nonbot_revisions AS (
			SELECT
				revision.rev_id,
				revision.rev_page,
				revision.rev_timestamp,
				actor.actor_name,
				ROW_NUMBER() OVER (
					PARTITION BY revision.rev_page
					ORDER BY revision.rev_timestamp DESC, revision.rev_id DESC
				) AS edit_rank
			FROM candidate_pages
			JOIN revision
				ON revision.rev_page = candidate_pages.page_id
			JOIN actor
				ON actor.actor_id = revision.rev_actor
			LEFT JOIN user_groups AS bot_groups
				ON bot_groups.ug_user = actor.actor_user
				AND bot_groups.ug_group = 'bot'
				AND (
					bot_groups.ug_expiry IS NULL
					OR bot_groups.ug_expiry = 'infinity'
					OR bot_groups.ug_expiry > DATE_FORMAT(UTC_TIMESTAMP(), '%Y%m%d%H%i%s')
				)
			WHERE bot_groups.ug_user IS NULL
		),
		last_nonbot_edits AS (
			SELECT
				nonbot_revisions.rev_page,
				nonbot_revisions.rev_timestamp AS last_nonbot_edit,
				nonbot_revisions.actor_name AS last_nonbot_editor
			FROM nonbot_revisions
			WHERE nonbot_revisions.edit_rank = 1
		),
		creator_revisions AS (
			SELECT
				revision.rev_page,
				MIN(revision.rev_id) AS creator_rev_id
			FROM candidate_pages
			JOIN revision
				ON revision.rev_page = candidate_pages.page_id
			GROUP BY revision.rev_page
		)
		SELECT
			candidate_pages.page_namespace,
			candidate_pages.page_title,
			CASE candidate_pages.page_namespace
				WHEN 0 THEN ''
				WHEN 1 THEN 'พูดคุย'
				WHEN 2 THEN 'ผู้ใช้'
				WHEN 3 THEN 'คุยกับผู้ใช้'
				WHEN 4 THEN 'วิกิพีเดีย'
				WHEN 5 THEN 'คุยเรื่องวิกิพีเดีย'
				WHEN 6 THEN 'ไฟล์'
				WHEN 7 THEN 'คุยเรื่องไฟล์'
				WHEN 8 THEN 'มีเดียวิกิ'
				WHEN 9 THEN 'คุยเรื่องมีเดียวิกิ'
				WHEN 10 THEN 'แม่แบบ'
				WHEN 11 THEN 'คุยเรื่องแม่แบบ'
				WHEN 12 THEN 'วิธีใช้'
				WHEN 13 THEN 'คุยเรื่องวิธีใช้'
				WHEN 14 THEN 'หมวดหมู่'
				WHEN 15 THEN 'คุยเรื่องหมวดหมู่'
				WHEN 118 THEN 'ฉบับร่าง'
				WHEN 119 THEN 'คุยเรื่องฉบับร่าง'
				WHEN 828 THEN 'มอดูล'
				WHEN 829 THEN 'คุยเรื่องมอดูล'
				WHEN 2300 THEN 'แกดเจ็ต'
				WHEN 2301 THEN 'คุยเรื่องแกดเจ็ต'
				WHEN 2302 THEN 'คำนิยามแกดเจ็ต'
				WHEN 2303 THEN 'คุยเรื่องคำนิยามแกดเจ็ต'
				ELSE CONCAT('Namespace ', candidate_pages.page_namespace)
			END AS localized_namespace,
			last_nonbot_edits.last_nonbot_edit,
			last_nonbot_edits.last_nonbot_editor,
			creator_actor.actor_name AS creator_name
		FROM candidate_pages
		JOIN last_nonbot_edits
			ON last_nonbot_edits.rev_page = candidate_pages.page_id
		JOIN creator_revisions
			ON creator_revisions.rev_page = candidate_pages.page_id
		JOIN revision AS creator_revision
			ON creator_revision.rev_id = creator_revisions.creator_rev_id
		JOIN actor AS creator_actor
			ON creator_actor.actor_id = creator_revision.rev_actor
		WHERE last_nonbot_edits.last_nonbot_edit < DATE_FORMAT(
			DATE_SUB(UTC_TIMESTAMP(), INTERVAL 4380 HOUR),
			'%Y%m%d%H%i%s'
		)
		ORDER BY last_nonbot_edits.last_nonbot_edit ASC, candidate_pages.page_title ASC
		LIMIT 1000;`);

    this.log.info(`Found ${rows.length} candidate pages for G10 nomination.`);

    // Username, Set(Page title to notify about)
    let usersToNotify = new Map<string, Set<string>>();
    let pagesToNominate = new Map<
      string,
      {
        pageCreator: string;
        deletionTemplate: string;
      }
    >();

    for (const row of rows) {
      const fullPageName =
        `${row.localized_namespace}:${row.page_title}`.replace(/_/g, " ");

      if (!usersToNotify.has(row.creator_name)) {
        usersToNotify.set(row.creator_name, new Set<string>());
      }

      // Mark the page for deletion
      pagesToNominate.set(fullPageName, {
        pageCreator: row.creator_name,
        deletionTemplate: `{{subst:ลบ-ท10|ts=${row.last_nonbot_edit}|bot=PatsaBot}}`,
      });
    }

    for (const [pageTitle, deletionTemplate] of pagesToNominate.entries()) {
      if (this.options.dryRun) {
        this.log.info(
          `[Dry Run] Would nominate page "${pageTitle}" for deletion with template: ${deletionTemplate}`,
        );
      } else {
        this.log.info(
          `Nominating page "${pageTitle}" for deletion with template: ${deletionTemplate}`,
        );

        await this.bot.edit(pageTitle, ({ content }) => {
          if (content.includes("{{ลบ-ท10")) {
            this.log.info(
              `Page "${pageTitle}" already has a G10 deletion template. Skipping nomination.`,
            );

            return null;
          }

          return {
            text: `${deletionTemplate}\n\n${content}`,
            summary:
              "บอต: เพิ่มแม่แบบแจ้งลบ (ท10) เนื่องจากไม่มีการแก้ไขโดยผู้ใช้ที่ไม่ใช่บอตเป็นเวลานาน",
            minor: true,
            bot: true,
          };
        });

        // usersToNotify
        //   .get(deletionTemplate.pageCreator)
        //   ?.add(`{{subst:Db-draft-notice|1=${pageTitle}}} ~~~~`);
      }
    }

    for (const [username, notifications] of usersToNotify.entries()) {
      const userTalkPage = `คุยกับผู้ใช้:${username}`;
      const notificationText = Array.from(notifications).join("\n\n");

      if (this.options.dryRun) {
        this.log.info(
          `[Dry Run] Would notify user "${username}" on their talk page "${userTalkPage}" with the following message:\n${notificationText}`,
        );
      } else {
        this.log.info(
          `Notifying user "${username}" on their talk page "${userTalkPage}" with the following message:\n${notificationText}`,
        );

        await this.bot.edit(userTalkPage, ({ content }) => ({
          text: `${content}\n\n${notificationText}`,
          summary: "บอต: แจ้งเตือนการแจ้งลบฉบับร่าง",
          minor: true,
          bot: true,
        }));
      }
    }
  }
}
