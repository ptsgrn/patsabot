import { defineScript } from "@core/define";

export default defineScript({
  meta: {
    id: "afccat",
    name: "AfC Category Creator",
    description: "Create categories for AfC submissions",
    frequency: "0 0 * * *", // Run every day at 00:00
  },

  options: (c) =>
    c.option("--date <date>", "Date to create categories for", "today"),

  async run(ctx) {
    await ctx.bot.Date.populateLocaleData("th");

    const dateObject =
      ctx.opts.date === "today"
        ? new ctx.bot.Date()
        : new ctx.bot.Date(ctx.opts.date);

    let categories = [
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("DD MMMM YYYY", 7)}`,
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("MMMM YYYY", 7)}`,
      `หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/${dateObject.format("YYYY", 7)}`,
    ];

    // no null and unique
    categories = categories
      .filter((c) => c !== null)
      .filter((c, i, a) => a.indexOf(c) === i);

    if (categories.length === 0) {
      ctx.log.info("No categories to create.");
      return;
    }

    ctx.log.info(
      `Creating categories for categories ${JSON.stringify(categories)}`,
    );

    await ctx.bot
      .batchOperation(
        categories,
        (page) => {
          if (!page) return Promise.reject();
          return new Promise((resolve, reject) => {
            if (ctx.dryRun) {
              ctx.log.warn(`Dry run, not creating category: ${page}`);
              return resolve("dryrun");
            }
            if (
              page.indexOf("หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/") === -1 ||
              page === "หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/Invalid date" ||
              page === "หมวดหมู่:ฉบับร่างเรียงตามวันที่ส่ง/"
            )
              return reject();

            ctx.bot
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
                ctx.log.error(`${error.message} ${page}`);
                reject(error);
              });
          });
        },
        10,
        1,
      )
      .then(() => {
        ctx.log.info("done");
      })
      .catch((err) => {
        ctx.log.error(`${err.message}`);
      });
  },
});
