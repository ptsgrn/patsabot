import os from "node:os";
import chalk, { type ChalkInstance } from "chalk";
import diff from "fast-diff";

/**
 * Converts a human-readable file size string into bytes.
 *
 * @param size - The human-readable file size string (e.g., '5MB', '1.2GB').
 * @returns The size in bytes.
 * @throws Will throw an error if the input size format is invalid.
 *
 * @example
 * ```typescript
 * humanReadableToBytes('5MB'); // Returns 5242880
 * humanReadableToBytes('1.2GB'); // Returns 1288490188.8
 * ```
 */
export function humanReadableToBytes(size: string) {
	const units = {
		B: 1,
		KB: 1024,
		MB: 1024 ** 2,
		GB: 1024 ** 3,
		TB: 1024 ** 4,
		PB: 1024 ** 5,
	};

	const regex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB)$/i;
	const match = size.match(regex);

	if (!match) {
		throw new Error(
			"Invalid size format. Example of valid input: '5MB', '1.2GB'.",
		);
	}

	const value = parseFloat(match[1]);
	const unit = match[2].toUpperCase() as keyof typeof units;

	return value * (units[unit] || 0);
}

/**
 * Checks if a character is a Thai character.
 *
 * @param char - The character to check.
 * @returns True if the character is a Thai character, false otherwise.
 */
export function isThaiCharacter(char: string): boolean {
	const thaiCharacterRange = /^[\u0E00-\u0E7F]$/;
	return thaiCharacterRange.test(char);
}

export function isOnIacto() {
	return os.hostname() === "iacto";
}

export type DiffLine = {
	type: "add" | "remove" | "context";
	text: string;
	/** 1-based line number in `before`. Unset for "add" lines. */
	oldLine?: number;
	/** 1-based line number in `after`. Unset for "remove" lines. */
	newLine?: number;
};

/**
 * Line-based diff for the interactive review TUI. Encodes each unique line
 * as a single BMP character (the classic diff-match-patch "line mode" trick)
 * so `fast-diff`, which is character-based, effectively diffs whole lines.
 */
export function diffLines(before: string, after: string): DiffLine[] {
	const lineToChar = new Map<string, string>();
	const charToLine = new Map<string, string>();

	const nextChar = () => {
		const code = lineToChar.size;
		// Skip the UTF-16 surrogate range so each line stays a single code unit.
		return String.fromCharCode(code < 0xd800 ? code : code + 0x0800);
	};

	const encode = (text: string) =>
		text
			.split("\n")
			.map((line) => {
				let char = lineToChar.get(line);
				if (char === undefined) {
					char = nextChar();
					lineToChar.set(line, char);
					charToLine.set(char, line);
				}
				return char;
			})
			.join("");

	const beforeEncoded = encode(before);
	const afterEncoded = encode(after);
	const changes = diff(beforeEncoded, afterEncoded);

	const result: DiffLine[] = [];
	let oldNo = 0;
	let newNo = 0;
	for (const [operation, chars] of changes) {
		const type = operation === 1 ? "add" : operation === -1 ? "remove" : "context";
		for (const char of chars) {
			const text = charToLine.get(char);
			if (text === undefined) continue;
			if (type !== "add") oldNo++;
			if (type !== "remove") newNo++;
			result.push({
				type,
				text,
				oldLine: type === "add" ? undefined : oldNo,
				newLine: type === "remove" ? undefined : newNo,
			});
		}
	}
	return result;
}

/**
 * Word-wrap `text` to `width` columns, hard-breaking any word that's wider
 * than `width` on its own (e.g. long wikitext template calls with no spaces).
 * Always returns at least one row, even for an empty string.
 */
export function wrapText(text: string, width: number): string[] {
	if (width <= 0 || text.length <= width) return [text];

	const rows: string[] = [];
	let remaining = text;
	while (remaining.length > width) {
		let breakAt = remaining.lastIndexOf(" ", width);
		if (breakAt <= 0) breakAt = width;
		rows.push(remaining.slice(0, breakAt));
		remaining = remaining.slice(breakAt).replace(/^ /, "");
	}
	rows.push(remaining);
	return rows;
}

export function printDiff(
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
		colorAdd: chalk.green.underline,
		colorRemove: chalk.red.strikethrough,
		colorChange: chalk.gray,
	};
	const colors = { ...defaultOptions, ...options };
	const differences = diff(original, updated);
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
