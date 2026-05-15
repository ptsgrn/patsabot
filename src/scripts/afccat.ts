import { Bot, Command } from "@core/bot";

export default class Afccat extends Bot {
  public info: Bot["info"] = {
    id: "afccat",
    name: "AfC Category Creator",
    description: "Create categories for AfC submissions",
    frequency: "0 2 * * *", // Run every day at 2:00 AM
  };

  cli = new Command().option(
    "--date <date>",
    "Date to create categories for",
    "today",
  );

  async run() {
    await this.bot.Date.populateLocaleData("th");
    let categories = [];

    const date = this.cli.opts().date;
    let dateObject = new this.bot.Date(date);
    if (date === "today") {
      dateObject = new this.bot.Date();
    }
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("DD MMMM YYYY", 7)}`,
    );
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("MMMM YYYY", 7)}`,
    );
    categories.push(
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("YYYY", 7)}`,
    );

    // no null and unique
    categories = categories
      .filter((c) => c !== null)
      .filter((c, i, a) => a.indexOf(c) === i);

    if (Number.isNaN(categories.length) || categories.length === 0) {
      this.log.info("No categories to create.");
      process.exit(0);
    }

    this.log.info(
      `Creating categories for categories ${JSON.stringify(categories)}`,
    );

    this.bot
      .batchOperation(
        categories,
        (page) => {
          if (!page) return Promise.reject();
          return new Promise((resolve, reject) => {
            if (this.dryRun) {
              this.log.warn(`Dry run, not creating category: ${page}`);
              return resolve("dryrun");
            }
            if (
              page.indexOf("หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/") === -1 ||
              page === "หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/Invalid date"
            )
              return reject();

            this.bot
              .save(
                page,
                "{{AfC submission category header}}",
                "สร้างหมวดหมู่ฉบับร่าง ([[user:PatsaBot/task/1|Task #1]])",
                {
                  // do not edit the page if it already exists
                  createonly: true,
                },
              )
              .then(resolve)
              .catch((error) => {
                this.log.error(`${error.message} ${page}`);
                reject(error);
              });
          });
        },
        10,
        1,
      )
      .then(() => {
        this.log.info("done");
      })
      .catch((err) => {
        this.log.error(`${err.message}`);
      });
  }
}
