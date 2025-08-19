import { DatabaseReportBot } from "@scripts/database-reports";

/**
 * Report for article that have link to user namespace.
 *
 * @see https://github.com/mzmcbride/database-reports/blob/f1c43652ca15263617c477218a318005ffe8839f/dbreps2/src/general/userlinksinarticles.rs
 */
export default class DraftsWithCats extends DatabaseReportBot {
	info: DatabaseReportBot["info"] = {
		id: "linked-user-ns0",
		name: "บทความที่มีลิงก์ผู้ใช้",
		description: "บทความที่มีลิงก์ไปยังหน้าผู้ใช้หรือหน้าคุยกับผู้ใช้",
		frequency: "@weekly",
		frequencyText: "สัปดาห์ละครั้ง",
	};

	query = `
    /* draft-with-cats.ts SLOW_OK */
    SELECT
      DISTINCT page_title
    FROM
      page
      JOIN pagelinks ON pl_from = page_id
      JOIN linktarget ON pl_target_id = lt_id
    WHERE
      pl_from_namespace = 0
      AND lt_namespace IN (2, 3)
      AND NOT EXISTS (
        SELECT 1 FROM templatelinks
        JOIN linktarget ON tl_target_id = lt_id
        WHERE tl_from = page_id
        AND lt_namespace = 10
        AND lt_title IN (
          'Db-meta',
          'Under_construction',
          'GOCEinuse',
          'Proposed_deletion/dated',
          'Wikipedia_person_user_link',
          'Cleanup_bare_URLs'
        )
      );`;
	headers = ["บทความ"];
	preTableTemplates: string[] = ["{{static row numbers}}"];

	formatRow(row: { page_title: string }) {
		return [`[[${row.page_title.toString().replace(/_/g, " ")}]]`];
	}
}
