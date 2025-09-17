import { Command } from "@commander-js/extra-typings";
import { Bot } from "@core/bot";
import { isThaiCharacter } from "@core/helper";
import type { ApiPage } from "mwn";

export default class TaxonomyAddScientificName extends Bot {
	info: Bot["info"] = {
		id: "taxo-sci-name",
		name: "Taxonomy: Add Scientific Name",
		description: "Adds a scientific name to a taxonomy entry",
		scriptSource: "scripts/taxo-sci-name.ts",
	};

	cli = new Command()
		.option("-a, --auto", "Automatically yes (with some delay)")
		.option(
			"-d, --delay <ms>",
			"Delay before auto-confirming changes",
			(v) => +v || 5000,
		);

	summary = "บอต: เพิ่มชื่อวิทยาศาสตร์ ([[ผู้ใช้:PatsaBot/task/7|task #7]])";
	ranks: Record<string, string> = {
		subordo: "อันดับย่อย",
		infraordo: "อันดับฐาน",
		ordo: "อันดับ",
		subfamilia: "วงศ์ย่อย",
		familia: "วงศ์",
		genus: "สกุล",
		species: "ชนิด",
		subtribus: "เผ่าย่อย",
		tribus: "เผ่า",
		classis: "ชั้น",
	};
	regexs = {
		MATCH_RANK: /^\| *rank *= *(.+)$/m,
		MATCH_RANK_S: /(.*)(\| *rank *= *.*)/ms,
		MATCH_LINK: /^\| *link *= *(.+)$/m,
		MATCH_LINK_S: /(.*)(\| *link *= *.*)/ms,
		MATCH_LINK_LINE: /(\| *link *= *.+)/,
		EXTRACT_SCIENTIFIC_NAME: /:.*\/(\w+)\/?.*$/,
		REMOVE_BRACKET_TEXT: /(.+) \(.+\)$/m,
	};

	async run(): Promise<void> {
		//     console.log(this.processPageContent(`{{Don't edit this line {{{machine code|}}}
		// |rak=familia
		// |link=Acteonemertidae
		// |parent=Oerstediina
		// |extinct= <!--leave blank or delete this line for "not extinct"; put "yes" for "extinct" -->
		// |refs={{BioRef|WoRMS|title=Oerstediina |id=1640068 |access-date=28 May 2024}} <!--Shown on this page only; don't include <ref> tags -->
		// }}
		// `, "Achlysiella").content)
		const linkedCategoryWithoutScienctificName = new this.bot.Category(
			"แม่แบบอนุกรมมีหน้าที่ลิงก์แต่ไม่ระบุ scientific name",
		);

		for await (const page of linkedCategoryWithoutScienctificName.membersGen({
			cmnamespace: 10,
		})) {
			this.log.info(
				`>>> ${`https://th.wikipedia.org/wiki/${page.title.replaceAll(" ", "_")}`} <<<`,
			);
			await this.processPage(page);
		}

		//     console.log(await this.suggestDisplayName(`{{Don't edit this line {{{machine code|}}}
		// |parent=Fabids
		// |rank=ordo
		// |link=Malpighiales A
		// |refs={{Cite journal|author=Angiosperm Phylogeny Group|year=2016|title=An update of the Angiosperm Phylogeny Group classification for the orders and families of flowering plants: APG IV|journal=Botanical Journal of the Linnean Society|volume=181|issue=1|pages=1–20|url=http://onlinelibrary.wiley.com/doi/10.1111/boj.12385/epdf|format=PDF|issn=00244074|doi=10.1111/boj.12385}}
		// }}
		// `, "ordo"))
		//     console.log(await this.suggestDisplayName(`{{Don't edit this line {{{machine code|}}}
		// |parent=Fabids
		// |rank=ordo
		// |link=Malpighiales|Display Content
		// |refs={{Cite journal|author=Angiosperm Phylogeny Group|year=2016|title=An update of the Angiosperm Phylogeny Group classification for the orders and families of flowering plants: APG IV|journal=Botanical Journal of the Linnean Society|volume=181|issue=1|pages=1–20|url=http://onlinelibrary.wiley.com/doi/10.1111/boj.12385/epdf|format=PDF|issn=00244074|doi=10.1111/boj.12385}}
		// }}
		// `, "ordo"))

		// console.log(this.setDisplayText(`{{Don't edit this line {{{machine code|}}}
		// |parent=Fabids
		// |rank=ordo
		// |link=Malpighiales|Display Content
		// |refs={{Cite journal|author=Angiosperm Phylogeny Group|year=2016|title=An update of the Angiosperm Phylogeny Group classification for the orders and families of flowering plants: APG IV|journal=Botanical Journal of the Linnean Society|volume=181|issue=1|pages=1–20|url=http://onlinelibrary.wiley.com/doi/10.1111/boj.12385/epdf|format=PDF|issn=00244074|doi=10.1111/boj.12385}}
		// }}
		// `, "YAY"))
	}

	async processPage(page: ApiPage) {
		const scientificName = this.extractScientificName(page.title);

		await this.bot.edit(page.title, async ({ content }) => {
			const {
				ok,
				error,
				content: processedContent,
			} = await this.processPageContent(content, scientificName);

			if (!ok) {
				this.log.warn(`Skipping ${page.title}: ${error}`);
				return;
			}

			this.log.info(
				`Processing ${this.output.color.bgBlueBright(page.title)} with scientific name "${this.output.color.bgBlueBright(scientificName)}"`,
			);
			// console.log(processedContent);
			this.output.printDiff(content, processedContent);

			if (this.cli.opts().auto) {
				this.log.info(
					`Auto-confirming changes for ${page.title} in ${this.cli.opts().delay} milliseconds`,
				);
				await new Promise((resolve) =>
					setTimeout(resolve, this.cli.opts().delay),
				);

				this.log.info(`Saving changes to ${page.title}`);
				return {
					text: processedContent,
					summary: this.summary,
					bot: true,
				};
			}

			const result = await this.input.prompt(
				`Save the changes to "${page.title}"?`,
				[
					{
						name: "Yes",
						value: "yes",
						alias: ["y"],
					},
					{
						name: "No",
						value: "no",
						alias: ["n"],
					},
				],
			);

			if (result === "no") {
				this.log.warn(`Skipping ${page.title}`);
				return;
			}

			this.log.info(`Saving changes to ${page.title}`);
			return {
				text: processedContent,
				summary: this.summary,
				bot: true,
			};
		});
	}

	async processPageContent(content: string, scientificName: string) {
		const contentMatch = content.match(this.regexs.MATCH_RANK_S);
		if (!contentMatch) {
			return {
				ok: false as const,
				error: "Content match failed",
			};
		}

		let newContent = contentMatch
			? contentMatch[1] +
				`|scientific_name=${scientificName}\n` +
				contentMatch[2]
			: content;
		const rank = this.getRankFromText(newContent) || "";

		const suggestedDisplayName = await this.suggestDisplayName(
			newContent,
			rank,
		);

		if (suggestedDisplayName) {
			const result = "yes";

			// if (result === "custom") {
			// 	const customDisplayName = this.input.ask(
			// 		`Enter a custom display name for ${rank}:"${scientificName}":`,
			// 	);
			// 	if (!customDisplayName) {
			// 		this.log.warn(
			// 			`No custom display name provided for ${rank}:"${scientificName}".`,
			// 		);
			// 		return {
			// 			ok: false as const,
			// 			error: "No custom display name provided",
			// 		};
			// 	}
			// 	newContent = this.setDisplayText(
			// 		newContent,
			// 		customDisplayName,
			// 		suggestedDisplayName.linkTarget,
			// 	);
			// }

			if (result === "yes") {
				newContent = this.setDisplayText(
					newContent,
					suggestedDisplayName.linkDisplay,
					suggestedDisplayName.linkTarget,
				);
			}
		}

		return {
			ok: true as const,
			content: newContent,
		};
	}

	getRankFromText(content: string) {
		const matchedContent = content.match(this.regexs.MATCH_RANK);
		return matchedContent ? matchedContent[1].trim() : null;
	}

	async suggestDisplayName(content: string, rank: string) {
		const matchedContent = content.match(this.regexs.MATCH_LINK);
		if (!matchedContent) return;
		const [linkTarget, linkDisplay] = matchedContent[1]
			.split("|")
			.map((part) => part.trim());
		if (linkDisplay && isThaiCharacter(linkDisplay[0])) {
			return { linkDisplay, linkTarget };
		}
		try {
			const linkTargetPage = new this.bot.Page(linkTarget);
			if (await linkTargetPage.isRedirect()) {
				const redirectTarget = await linkTargetPage.getRedirectTarget();
				if (!redirectTarget.startsWith(this.ranks[rank])) {
					this.log.warn(
						`Redirect target "${redirectTarget}" does not start with rank prefix "${this.ranks[rank]}".`,
					);
				}
				const cleanedDisplayText = this.cleanDisplayText(redirectTarget);
				return {
					linkDisplay: cleanedDisplayText,
					linkTarget: redirectTarget,
				};
			}

			const redirectTarget = await linkTargetPage.getRedirectTarget();
			if (!redirectTarget.startsWith(this.ranks[rank])) {
				this.log.warn(
					`Redirect target "${redirectTarget}" does not start with rank prefix "${this.ranks[rank]}".`,
				);
			}
			const cleanedDisplayText = this.cleanDisplayText(redirectTarget);
			if (!isThaiCharacter(cleanedDisplayText[0])) {
				return;
			}

			return {
				linkDisplay: cleanedDisplayText,
				linkTarget: redirectTarget,
			};
		} catch (error) {
			this.log.error(
				`Failed to get redirect target for "${linkTarget}":`,
				error,
			);
			return null;
		}
	}

	cleanDisplayText(display: string) {
		return Object.entries(this.ranks)
			.reduce((acc, [_rank, prefix]) => {
				return acc.replace(new RegExp(`^${prefix}`, "i"), "").trim();
			}, display)
			.replace(this.regexs.REMOVE_BRACKET_TEXT, "$1")
			.trim();
	}

	setDisplayText(content: string, displayText: string, linkTarget: string) {
		const linkLine = content.match(this.regexs.MATCH_LINK_LINE);
		if (!linkLine) {
			this.log.warn(
				"No link line found in content. Returning original content.",
			);
			return content;
		}
		const [beforeLink, afterLink] = content.split(linkLine[0]);
		return (
			beforeLink +
			(linkTarget ? `|link=${linkTarget}` : linkLine[1].trim()) +
			(displayText !== linkTarget ? `|${displayText}` : "") +
			afterLink
		);
	}

	extractScientificName(title: string) {
		const match = title.match(this.regexs.EXTRACT_SCIENTIFIC_NAME);
		return match ? match[1] : title;
	}
}
