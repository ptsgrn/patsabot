import { defineDatabaseReport } from "./_shared";

interface Row {
  page_title: string;
  page_len: number;
}

/**
 * Report for long stubs
 *
 * @see https://github.com/mzmcbride/database-reports/blob/f1c43652ca15263617c477218a318005ffe8839f/dbreps2/src/enwiki/longstubs.rs
 */
export default defineDatabaseReport<Row>({
  id: "long-stubs",
  name: "บทความโครงขนาดยาว",
  description: "รายการที่มีแม่แบบโครงแต่มีขนาดยาว (จำกัด 1000 อันดับแรก)",
  frequencyText: "สัปดาห์ละครั้ง",
  frequency: "@weekly",

  query: `
    /* long-stubs.ts SLOW_OK */
    SELECT page_title, page_len
		FROM linktarget
		JOIN categorylinks ON cl_target_id = lt_id
		JOIN page ON page_id = cl_from
		WHERE lt_namespace = 14
			AND lt_title = 'บทความทั้งหมดที่ยังไม่สมบูรณ์'
			AND page_namespace = 0
			AND page_len > 2000
			AND NOT EXISTS (SELECT 1
											FROM categorylinks
											JOIN linktarget ON lt_id = cl_target_id
											WHERE cl_from = page_id
												AND lt_namespace = 14
												AND lt_title = 'Long_stubs_with_short_prose')
		ORDER BY page_len DESC, page_title ASC
		LIMIT 1000;`,
  headers: ["ที่", "บทความ", "ความยาว (ไบต์)"],

  formatRow(row, index) {
    return [
      index + 1, // index is 0-based
      `[[${row.page_title.replace(/_/g, " ")}]]`, // link to the page
      row.page_len, // page length in bytes
    ];
  },
});
