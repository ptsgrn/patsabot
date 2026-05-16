import { DatabaseReportBot } from "@scripts/database-reports";

interface Row {
  draftname: string;
  categoryname: string;
}

/**
 * Report for draft articles that have categories.
 *
 * @see https://en.wikipedia.org/w/index.php?title=Wikipedia:Database_reports/Drafts_with_categories
 */
export default class DraftsWithCats extends DatabaseReportBot {
  info: DatabaseReportBot["info"] = {
    id: "draft-with-cats",
    name: "ฉบับร่างที่ใช้หมวดหมู่",
    description: "ฉบับร่างที่มีหมวดหมู่จริง จำกัด 1000 รายการ",
    frequency: "@weekly",
    frequencyText: "สัปดาห์ละครั้ง",
  };

  query = `
    /* draft-with-cats.ts SLOW_OK */
    SELECT DISTINCT draft.page_title AS draftname, lt_title AS categoryname
	FROM categorylinks
	JOIN page AS draft ON draft.page_id = cl_from
	JOIN linktarget ON lt_id = cl_target_id
	LEFT JOIN page AS catpage ON catpage.page_namespace = 14 AND catpage.page_title = lt_title
	LEFT JOIN page_props ON pp_page = catpage.page_id AND pp_propname = 'hiddencat'
	WHERE draft.page_namespace = 118
		AND pp_page IS NULL
		AND lt_title NOT LIKE '%\_drafts'
		AND lt_title NOT LIKE 'AfC_%'
		AND lt_title NOT LIKE 'ฉบับร่าง%'
		AND NOT (draft.page_title = 'กระบะทราย' AND lt_title IN ('Namespace_example_pages', 'Wikipedia_drafts'))
		AND NOT EXISTS (SELECT 1
										FROM templatelinks
										JOIN linktarget ON lt_id = tl_target_id AND lt_namespace = 10 AND lt_title = 'หมวดหมู่บำรุงรักษา'
										WHERE tl_from = catpage.page_id)
	LIMIT 1000;`;
  headers = ["ฉบับร่าง", "หมวดหมู่"];
  preTableTemplates: string[] = ["{{static row numbers}}"];

  formatRow(row: Row) {
    return [
      `[[ฉบับร่าง:${row.draftname.replace(/_/g, " ")}]]`,
      `[[:หมวดหมู่:${row.categoryname.replace(/_/g, " ")}|]]`,
    ];
  }
}
