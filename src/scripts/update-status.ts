import { defineScript } from "@core/define";

export default defineScript({
  meta: {
    description: "อัปเดตสถานะบอต",
    frequency: "@daily",
  },
  async run(ctx) {
    await ctx.bot.save(
      `ผู้ใช้:${ctx.account.username}/timestamp`,
      "{{subst:#timel:r}}",
      "อัปเดตสถานะ",
    );
    ctx.log.info("Status updated");
  },
});
