import { Bot } from '../core/bot';
import { Command } from '@commander-js/extra-typings';

export default class Afccat extends Bot {
  info = {
    id: "afccat",
    name: "AfC Category Creator",
    description: "Create categories for AfC submissions",
  }

  cli = new Command()
    .option("--date <date>", "Date to create categories for", "today")
    .option("--dry-run", "Dry run, do not create categories", false);

  constructor() {
    super()
  }

  async run() {
    await this.bot.Date.populateLocaleData("th");
    let categories = [];

    const date = this.cli.opts().date;
    let dateObject = new this.bot.Date(date);
    if (date === "today") {
      dateObject = new this.bot.Date()
    }
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("DD MMMM YYYY", 'Asia/Bangkok')}`
    );
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("MMMM YYYY", 'Asia/Bangkok')}`
    );
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("YYYY", 'Asia/Bangkok')}`
    );

    // no null and unique
    categories = categories
      .filter((c) => c !== null)
      .filter((c, i, a) => a.indexOf(c) === i);

    if (isNaN(categories.length) || categories.length === 0) {
      this.log("[I] No categories to create.");
      process.exit(0);
    }

    this.log(`[D] categories ${JSON.stringify(categories)}`);

    this.bot
      .batchOperation(
        categories,
        (page) => {
          if (!page) return Promise.reject();
          return new Promise((resolve, reject) => {
            if (this.cli.opts().dryRun) {
              this.log("[W] Dry run, not creating category: " + page);
              resolve("dryrun");
            }
            if (
              page.indexOf("หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/") === -1 ||
              page === "หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/Invalid date"
            ) return reject();

            this.bot
              .save(
                page,
                "{{AfC submission category header}}",
                "สร้างหมวดหมู่ฉบับร่าง ([[user:PatsaBot/task/1|Task #1]])",
                {
                  // do not edit the page if it already exists
                  createonly: true,
                }
              )
              .then(resolve)
              .catch((error) => {
                this.log(`[E] ${error.message} ${page}`);
                reject(error);
              });
          });
        },
        10,
        1
      )
      .then(() => {
        this.log("[I] done");
      })
      .catch((err) => {
        this.log(`[E] ${err.message}`);
      });
  }
}
