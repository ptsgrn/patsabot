/**
 * @name sandboxclean
 * @desc รีเซ็ตหน้ากระบะทราย
 * @script https://github.com/ptsgrn/patsabot/blob/main/src/scripts/sandboxclean.ts
 * @author Patsagorn Y. (mpy@toolforge.org)
 * @license MIT
 */

const sandboxlist = ["วิกิพีเดีย:ทดลองเขียน", "ฉบับร่าง:ทดลองเขียน"];

// function isHaveToclean(page) {
//   console.log(page.history)
//   return false
// }

// function cleanSandbox() {

// }

export async function run({ bot, log }) {
  await bot.getSiteInfo();
  let pagename = "วิกิพีเดีย:ทดลองเขียน";
  let page = new bot.page(pagename);
  console.log(
    await page
      .history({
        props: ["sha1", "timestamp", "user", "comment"],
        limit: 1,
      })
      .catch((err) => log.error("%o", err))
  );
  // bot.batchOperation(
  //   sandboxlist,
  //   async (pagename, idx) => {
  //     let page = new bot.title(pagename)
  //     console.log(await page.history({
  //       props: ['sha1', 'timestamp', 'user', 'comment'],
  //       limit: 1
  //     }))
  //     // if (isHaveToclean(page))
  //   },
  //   /* concurrency */ 5,
  //   /* retries */ 2
  // )
}

export const id = 2; // task id
export const name = "Clean up sandboxs";
export const desc = 'Clean up the "' + sandboxlist.join('", "') + '".';
export const excluderegex = false;
// export const schedule = '*/15 * * * *'
