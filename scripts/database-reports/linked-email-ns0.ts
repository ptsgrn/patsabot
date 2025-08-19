import { DatabaseReportBot } from "@scripts/database-reports";

interface Row {
	page_title: Buffer;
	page_len: number;
}

/**
 * Report for usage of linked email addresses in the main namespace.
 * Copyright 2008 bjweeks, MZMcBride
 * Copyright 2021 Kunal Mehta <legoktm@debian.org>
 *
 * @see https://github.com/mzmcbride/database-reports/blob/f1c43652ca15263617c477218a318005ffe8839f/dbreps2/src/general/linkedemailsinarticles.rs
 */
export default class LinkedEmailNs0 extends DatabaseReportBot {
	info: DatabaseReportBot["info"] = {
		id: "linked-email-ns0",
		name: "บทความที่มีลิงก์ที่อยู่อีเมล",
		description: "บทความที่มีการใช้ลิงก์แต่ลิงก์ไปที่อยู่อีเมล (ด้วย <code>mailto:</code>)",
		frequency: "@weekly",
		frequencyText: "สัปดาห์ละครั้ง",
	};

	query = `
    /* linked-email-ns0.ts SLOW_OK */
    SELECT
      DISTINCT page_title
    FROM
      externallinks
      JOIN page ON el_from = page_id
    WHERE
      el_to_domain_index LIKE 'mailto:%'
      AND page_namespace = 0
    LIMIT
      1000;`;
	headers = ["บทความ"];
	preTableTemplates: string[] = ["{{static row numbers}}"];

	formatRow(row: Row) {
		return [
			`[[${row.page_title.toString().replace(/_/g, " ")}]]`, // link to the page
		];
	}
}
