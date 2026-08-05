import { defineScript } from "@core/define";
import type { EntityId, ItemId } from "wikibase-sdk";

export default defineScript({
  meta: {
    id: "taxo-link-wd",
    name: "TaxoLinkWD",
    description: "Link taxonomy templates to Wikidata items",
  },

  options: (c) =>
    c
      .option("--start <pagename>", "start point of the category members generator")
      .option("--end <pagename>", "end point of the category members generator"),

  async run(ctx) {
    const taxonomyCate = new ctx.bot.Category("แม่แบบอนุกรมวิธาน");
    for await (const { title } of taxonomyCate.membersGen({ cmnamespace: 10 })) {
      ctx.log.info(`Processing ${title}`);
      const url = ctx.wikidata.read.getEntitiesFromSitelinks({
        titles: title,
        sites: "thwiki",
      });
      const res = await ctx.bot
        .rawRequest({ url, method: "GET" })
        .then((response) => response.data)
        .then(ctx.wikidata.read.simplify.entities);

      const qid = Object.keys(res)[0] as EntityId;
      if (!qid) {
        // Find possible item by label from enwiki
        const enwikiUrl = ctx.wikidata.read.getEntitiesFromSitelinks({
          titles: title.replace("แม่แบบ:", "Template:"),
          sites: "enwiki",
        });
        const enRes = await ctx.bot.rawRequest({ url: enwikiUrl, method: "GET" });
        const enResSimp = ctx.wikidata.read.simplify.entities(enRes.data);
        const enQid = Object.keys(enResSimp)[0] as ItemId;
        if (!enQid) {
          ctx.log.warn(`No Wikidata item found for ${title}`);
          continue;
        }
        if (enResSimp[enQid].type !== "item") {
          ctx.log.warn(`Wikidata entity for ${title} is not an item`);
          continue;
        }
        // Add sitelink to thwiki
        await ctx.wikidata.edit.sitelink.set({
          id: enQid,
          site: "thwiki",
          title,
        });
        // Edit description from generic "Wikimedia template" to "Taxonomy template"
        if (
          !enResSimp[enQid].descriptions?.en ||
          enResSimp[enQid].descriptions?.en !== "Taxonomy template"
        ) {
          await ctx.wikidata.edit.description.set({
            id: enQid,
            value: "แม่แบบอนุกรมวิธาน",
            language: "th",
            summary: "Add taxonomy template description",
          });
        }
      }
      if (qid && res[qid].type === "item") {
        // Update description from generic "แม่แบบวิกิมีเดีย" to "แม่แบบอนุกรมวิธาน" (taxonomy templates)
        if (
          !res[qid].descriptions?.th ||
          res[qid].descriptions?.th !== "แม่แบบอนุกรมวิธาน"
        ) {
          await ctx.wikidata.edit.description.set({
            id: qid,
            value: "แม่แบบอนุกรมวิธาน",
            language: "th",
            summary: "Add taxonomy template description",
          });
        }
      }

      ctx.log.info(`Finished processing ${title}`);
    }
  },
});
