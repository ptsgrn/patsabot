import { Bot, Command } from "@core";
import type { EntityId, ItemId } from "wikibase-sdk";

export default class TaxoLinkWD extends Bot {
  info = {
    id: "taxo-link-wd",
    name: "TaxoLinkWD",
    description: "",
  };

  cli = new Command("taxo-link-wd")
    .description("Link taxonomy templates to Wikidata items")
    .option(
      "--start <pagename>",
      "start point of the category members generator",
    )
    .option("--end <pagename>", "end point of the category members generator");

  async run() {
    const taxonomyCate = new this.bot.Category("แม่แบบอนุกรมวิธาน");
    for await (let { title } of taxonomyCate.membersGen({
      cmnamespace: 10,
    })) {
      this.log.info(`Processing ${title}`);
      const url = this.wikidata.read.getEntitiesFromSitelinks({
        titles: title,
        sites: "thwiki",
      });
      const res = await this.bot
        .rawRequest({
          url: url,
          method: "GET",
        })
        .then((response) => response.data)
        .then(this.wikidata.read.simplify.entities);

      const qid = Object.keys(res)[0] as EntityId;
      if (!qid) {
        // Find possible item by labe from enwiki
        const enwikiUrl = this.wikidata.read.getEntitiesFromSitelinks({
          titles: title.replace("แม่แบบ:", "Template:"),
          sites: "enwiki",
        });
        const enRes = await this.bot.rawRequest({
          url: enwikiUrl,
          method: "GET",
        });
        const enResSimp = this.wikidata.read.simplify.entities(enRes.data);
        const enQid = Object.keys(enResSimp)[0] as ItemId;
        if (!enQid) {
          this.log.warn(`No Wikidata item found for ${title}`);
          continue;
        }
        if (enResSimp[enQid].type !== "item") {
          this.log.warn(`Wikidata entity for ${title} is not an item`);
          continue;
        }
        // Add sitelink to thwiki
        await this.wikidata.edit.sitelink.set({
          id: enQid,
          site: "thwiki",
          title,
        });
        // Edit description from generic "Wikimedia template" to "Taxonomy template"
        if (
          !enResSimp[enQid].descriptions?.en ||
          enResSimp[enQid].descriptions?.en !== "Taxonomy template"
        ) {
          await this.wikidata.edit.description.set({
            id: enQid,
            value: "แม่แบบอนุกรมวิธาน",
            language: "th",
            summary: "Add taxonomy template description",
          });
        }
      }
      if (qid && res[qid].type === "item") {
        // Update description from generic "แม่แบบวิกิมีเดีย" to "แม่แบบอนุกรมวิธาน" (toxonomy templates)
        if (
          !res[qid].descriptions?.th ||
          res[qid].descriptions?.th !== "แม่แบบอนุกรมวิธาน"
        ) {
          await this.wikidata.edit.description.set({
            id: qid,
            value: "แม่แบบอนุกรมวิธาน",
            language: "th",
            summary: "Add taxonomy template description",
          });
        }
      }

      break;
    }
  }
}
