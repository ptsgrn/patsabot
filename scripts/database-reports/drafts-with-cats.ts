import { DatabaseReportBot } from "@scripts/database-reports";

interface Row {
	draftname: Buffer;
	categoryname: Buffer;
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
    SELECT draft.page_title AS draftname, cl_to AS categoryname
    FROM categorylinks
    JOIN page AS draft ON draft.page_id = cl_from
    LEFT JOIN page AS catpage ON catpage.page_namespace = 14 AND catpage.page_title = cl_to
    LEFT JOIN page_props ON pp_page = catpage.page_id AND pp_propname = 'hiddencat'
    LEFT JOIN templatelinks ON tl_from = catpage.page_id
    LEFT JOIN linktarget ON lt_id = tl_target_id AND lt_namespace = 10 AND lt_title = 'หมวดหมู่บำรุงรักษา'
    WHERE draft.page_namespace = 118
      AND pp_page IS NULL
      AND tl_from IS NULL
      AND cl_to NOT LIKE 'AfC_%'
      AND cl_to NOT LIKE 'ฉบับร่าง%'
      AND cl_to != 'Namespace_example_pages'
    LIMIT 1000;`;
	headers = ["ฉบับร่าง", "หมวดหมู่"];
	preTableTemplates: string[] = ["{{static row numbers}}"];

	formatRow(row: Row) {
		return [
			`[[ฉบับร่าง:${row.draftname.toString().replace(/_/g, " ")}]]`,
			`[[:หมวดหมู่:${row.categoryname.toString().replace(/_/g, " ")}|]]`,
		];
	}
}
