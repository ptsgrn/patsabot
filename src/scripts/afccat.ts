// /**
//  * @inuse
//  * @id 1
//  * @name afccat
//  * @desc สร้างหน้าหมวดหมู่สำหรับ AfC แบบรายวัน เช่น [[:หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/04 พฤศจิกายน 2021]], ไม่แก้ไขหากมีการสร้างแล้ว
//  * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/afccat.ts
//  * @author Patsagorn Y. (mpy@toolforge.org)
//  * @license MIT
//  */

// import bot from "../../core/bot.js";
// import { cuid } from "../patsabot/utils.js";
// import meow from "meow";
// import moment from "moment";

// const cli = meow(
// 	`
// 	Usage
// 	  $ patsabot afccat [options]

// 	Options
// 	  --date, -d	Date to create the category.
// 		--dry-run, -n	Do not actually create the category, just test.

// 	Examples
// 	  $ patsabot afccat -d 2020-01-01 -d 2020-01-02 -d 2020-01-03
// 		Create categories for 2020-01-01, 2020-01-02, and 2020-01-03.
// `,
// 	{
// 		importMeta: import.meta,
// 		booleanDefault: undefined,
// 		flags: {
// 			date: {
// 				type: "string",
// 				default: [],
// 				alias: "d",
// 				isMultiple: true,
// 			},
// 			dryRun: {
// 				type: "boolean",
// 				default: false,
// 				alias: "n",
// 			},
// 		},
// 	},
// );

// /**
//  * @async
//  * @function afccat
//  */
// async function afccat() {}

// afccat();
