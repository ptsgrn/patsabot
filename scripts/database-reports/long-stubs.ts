import { DatabaseReportBot } from '@scripts/database-reports';

/**
 * Report for long stubs
 * 
 * @see https://github.com/mzmcbride/database-reports/blob/f1c43652ca15263617c477218a318005ffe8839f/dbreps2/src/enwiki/longstubs.rs
 */
export default class LongStubs extends DatabaseReportBot {
  info: DatabaseReportBot['info'] = {
    id: "long-stubs",
    name: "บทความโครงขนาดยาว",
    description: "รายการที่มีแม่แบบโครงแต่มีขนาดยาว (จำกัด 1000 อันดับแรก)",
    frequency: '@weekly',
    frequencyText: 'สัปดาห์ละครั้ง'
  }

  query = `
    /* long-stubs.ts SLOW_OK */
    SELECT
      page_title,
      page_len
    FROM
      page
      JOIN categorylinks ON cl_from = page_id
    WHERE
      ((cl_to LIKE 'โครง%' AND cl_to NOT LIKE 'โครงการ%') OR cl_to LIKE '%stub')
      AND page_namespace = 0
      AND page_len > 2000
    GROUP BY
      page_title
    ORDER BY
      page_len DESC
    LIMIT
      1000;`
  headers = ["ที่", "บทความ", "ความยาว (ไบต์)"]

  formatRow(row: any, index: number) {
    return [
      index + 1, // index is 0-based
      `[[${row.page_title.toString().replace(/_/g, " ")}]]`, // link to the page
      row.page_len // page length in bytes
    ]
  }
}