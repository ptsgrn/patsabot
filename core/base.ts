import { config } from "@core/config";
import { logger } from "@core/logger";
import { $ } from "bun";
import chalk, { type ChalkInstance } from "chalk";
import diff from "fast-diff";
import type { Logger } from "winston";
import { isOnIacto } from "./helper";

export class ServiceBase {
	public log: Logger = logger;
	public config = config;
}

interface PromptChoiceEntry {
	name: string;
	value: string;
	alias: string[];
}

export class PromptChoice implements PromptChoiceEntry {
	constructor(
		public name: string,
		public value: string,
		public alias: string[],
	) {
		if (!name || !value) {
			throw new Error("PromptChoice requires a name and value");
		}
		this.value = this.value.trim().toLocaleLowerCase();
		this.name = this.name.trim();
		this.alias = alias.map((a) => a.trim().toLocaleLowerCase());
	}

	isMatch(value: string) {
		return (
			this.value.toLocaleLowerCase() === value ||
			this.alias.includes(value.toLocaleLowerCase())
		);
	}
}

/**
 * Input service to prompt the user for input
 * @extends ServiceBase
 */
export class Input extends ServiceBase {
	/**
	 * Prompt the user for some input from choices
	 * @param message Question to ask
	 * @param choices Choices to choose from
	 * @returns User's choice from one of the choices
	 */
	public async prompt<T extends readonly PromptChoiceEntry[]>(
		message: string,
		choices?: T,
	): Promise<
		T extends readonly PromptChoiceEntry[] ? T[number]["value"] : "y" | "n"
	> {
		const defaultChoices: PromptChoiceEntry[] = [
			{
				name: "Yes",
				value: "y",
				alias: ["yes"],
			},
			{
				name: "No",
				value: "n",
				alias: ["no"],
			},
		];
		const effectiveChoices = (choices ?? defaultChoices) as PromptChoiceEntry[];
		const choicesEntry = effectiveChoices.map(
			(choice) => new PromptChoice(choice.name, choice.value, choice.alias),
		);
		while (true) {
			const question =
				"> " +
				message +
				" (" +
				choicesEntry.map((c) => c.value).join("/") +
				"): ";
			this.log.debug(question);
			if (isOnIacto()) {
				this.log.debug("Sending notification...");
				const stdout =
					await $`notify-send "${question}" --wait ${{ raw: `--action=${choicesEntry.map((v) => v.name).join(" --action=")}` }} --app-name="${this.config.bot.username}"`
						.quiet()
						.text();
				if (stdout) {
					const selectedAction = +stdout.toString().trim();
					this.log.debug(`User selected action: ${selectedAction}`);
					return choicesEntry[selectedAction]
						?.value as T extends readonly PromptChoiceEntry[]
						? T[number]["value"]
						: "y" | "n";
				}
			}
			const answer = prompt(chalk.yellowBright(question))?.toLowerCase();
			this.log.debug(`User input: ${answer}`);
			if (answer && choicesEntry.some((choice) => choice.isMatch(answer))) {
				return choicesEntry.find((choice) => choice.isMatch(answer))
					?.value as T extends readonly PromptChoiceEntry[]
					? T[number]["value"]
					: "y" | "n";
			} else {
				this.log.warn("Invalid input. Please try again.");
			}
		}
	}

	/**
	 * Confirm a question with the user
	 * @param message Question to confirm
	 * @returns True if user confirms, false otherwise
	 */
	public async confirm(message: string) {
		return (await this.prompt(message)) === "y";
	}

	/**
	 * Ask the user for some input
	 * @param message Question to ask
	 * @returns User's input
	 */
	public ask(message: string) {
		return prompt(`> ${message}`);
	}
}

export class Output extends ServiceBase {
	/**
	 * Chalk instance for coloring text
	 */
	public color: ChalkInstance = chalk;
	public diff = diff;
	public printDiff(
		original: string,
		updated: string,
		options:
			| {
					colorAdd?: ChalkInstance;
					colorRemove?: ChalkInstance;
					colorChange?: ChalkInstance;
			  }
			| undefined = {},
	) {
		const defaultOptions = {
			colorAdd: this.color.green.underline,
			colorRemove: this.color.red.strikethrough,
			colorChange: this.color.gray,
		};
		const colors = { ...defaultOptions, ...options };
		const differences = this.diff(original, updated);
		console.log(
			differences
				.map(([operation, text]) => {
					const color =
						operation === 1
							? colors.colorAdd
							: operation === -1
								? colors.colorRemove
								: colors.colorChange;
					return color(text);
				})
				.join(""),
		);
	}
}
