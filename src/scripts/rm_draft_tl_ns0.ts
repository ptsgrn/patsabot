import bot from "../patsabot/bot.js";
import { cuid } from "../patsabot/utils.js";
import logger from "../patsabot/logger.js";
import meow from "meow";
const log = logger.child({
    script: "rm_draft_tl_ns0",
    runId: `run-${cuid()}`,
});
const cli = meow(`

  Usage
    just run it

  Options
    --dry-run, -n just test.
`, {
    importMeta: import.meta,
    booleanDefault: undefined,
    flags: {
        dryRun: {
            type: "boolean",
            default: false,
            alias: "n",
        },
    },
});
log.debug("script parameters", { ...cli.flags });
const dryRun = cli.flags.dryRun;
async function main() {
    const draftTemplates = [
        ...(await bot.request({
            action: "query",
            format: "json",
            prop: "redirects",
            titles: "แม่แบบ:บทความฉบับร่าง",
            formatversion: "2",
        })).query.pages[0].redirects.map(({ title }) => title.replace("แม่แบบ:", "")),
        "บทความฉบับร่าง",
    ];
    console.log(draftTemplates);
    log.info(`found ${draftTemplates.length} draft templates: ${draftTemplates.join(", ")}`);
    const replaceRegex = new RegExp(`\\{\\{\\s*?((แม่แบบ|[Tt]emplate)\\:)?(${draftTemplates.join("|")}).*?\\}\\}\n?`, "g");
    console.log(replaceRegex);
    for await (const result of bot.continuedQueryGen({
        action: "query",
        format: "json",
        prop: "transcludedin",
        titles: "แม่แบบ:บทความฉบับร่าง",
        formatversion: "2",
        tinamespace: "0",
    })) {
        for (const list of result.query.pages) {
            for (const { title } of list.transcludedin) {
                log.info(`dry run: ${title}`);
                bot.edit(title, ({ content }) => {
                    content = content.replace(replaceRegex, "");
                    if (dryRun) {
                        return;
                    }
                    return {
                        action: "edit",
                        utf8: true,
                        bot: true,
                        summary: "ลบแม่แบบบทความฉบับร่าง",
                        text: content,
                    };
                });
            }
        }
    }
}
main().catch((e) => {
    log.error(e, { stack: e.stack });
    process.exit(1);
});
