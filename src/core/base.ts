import { $ } from "bun";
import chalk, { type ChalkInstance } from "chalk";
import diff from "fast-diff";
import { terminal, truncateString } from "terminal-kit";
import type { Logger } from "winston";
import { type Config, getConfig } from "./config";
import { type DiffLine, diffLines, isOnIacto, printDiff, wrapText } from "./helper";
import { getLogger } from "./logger";

/**
 * Thrown by `Input.reviewEdit()` when the user picks "Stop" in the review
 * TUI. `executeScript()` treats this as an intentional stop, not a crash.
 */
export class StopRunError extends Error {
  constructor(message = "Stopped by user") {
    super(message);
    this.name = "StopRunError";
  }
}

/**
 * Shared access to the config and logger singletons.
 *
 * Both are exposed as getters so that constructing a service never forces the
 * config to load — the CLI installs it after parsing global flags.
 */
export class ServiceBase {
  private ownLog: Logger | null = null;

  get log(): Logger {
    return (this.ownLog ??= getLogger());
  }

  set log(logger: Logger) {
    this.ownLog = logger;
  }

  get config(): Config {
    return getConfig();
  }
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

type ReviewDecision = "accept" | "skip" | "always" | "stop";

/**
 * Input service to prompt the user for input
 * @extends ServiceBase
 */
export class Input extends ServiceBase {
  /** Set once the user picks "Always" in `reviewEdit()`; sticky for the run. */
  private alwaysAccept = false;

  /**
   * @param appName Name shown on desktop notifications. Defaults to the
   * account the current run is using.
   * @param interactive Whether a human is at a terminal to review edits.
   * When false (background/scheduled runs), `reviewEdit()` never opens the
   * TUI and auto-accepts every edit.
   */
  constructor(
    private appName?: string,
    private interactive = true,
  ) {
    super();
  }

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
      if (isOnIacto() && this.config.options?.iactoNotiPrompt) {
        this.log.debug("Sending notification...");
        const appName = this.appName ?? this.config.bot.defaultUser;
        const stdout =
          await $`notify-send "${question}" --wait ${{ raw: `--action=${choicesEntry.map((v) => v.name).join(" --action=")}` }} --app-name="${appName}"`
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

  /**
   * Show a full-screen scrollable diff for a page and let the user decide
   * whether to save it.
   *
   * In non-interactive runs (no attached terminal, or after the user has
   * already picked "Always" once this run) this skips the TUI, logs the
   * diff, and resolves to "accept" immediately rather than blocking.
   *
   * @param pageTitle Page being edited, shown in the title bar.
   * @param before Current page content.
   * @param after Proposed new content.
   * @returns "accept" to save the edit, "skip" to leave the page alone.
   * @throws {StopRunError} If the user picks "Stop".
   */
  public async reviewEdit(
    pageTitle: string,
    before: string,
    after: string,
  ): Promise<"accept" | "skip"> {
    if (!this.interactive || this.alwaysAccept) {
      this.log.info(`Reviewing "${pageTitle}" (auto-accept)`);
      printDiff(before, after);
      return "accept";
    }

    const decision = await this.runReviewTui(pageTitle, diffLines(before, after));
    if (decision === "stop") {
      throw new StopRunError(`Stopped by user while reviewing "${pageTitle}"`);
    }
    if (decision === "always") {
      this.alwaysAccept = true;
      return "accept";
    }
    return decision;
  }

  private runReviewTui(
    pageTitle: string,
    lines: DiffLine[],
  ): Promise<ReviewDecision> {
    return new Promise((resolve) => {
      let offset = 0;
      let cursor = 0;
      const contextRadius = 3;
      /** Run-start indices (into `lines`) whose fold marker has been expanded individually. */
      const expandedFolds = new Set<number>();
      /** All current fold-candidate run-start indices, refreshed each `buildRows()`. */
      let foldKeys: number[] = [];
      const isNoChange = lines.every((l) => l.type === "context");
      const contentHeight = () => Math.max(1, terminal.height - 4);
      const colorFor = (type: DiffLine["type"]) =>
        type === "add" ? chalk.green : type === "remove" ? chalk.red : chalk.gray;
      const prefixFor = (type: DiffLine["type"]) =>
        type === "add" ? "+ " : type === "remove" ? "- " : "  ";

      // Two right-aligned line-number columns (old | new), wide enough for
      // the largest number either side of the diff will ever show.
      const gutterDigits = Math.max(
        2,
        String(Math.max(0, ...lines.map((l) => l.oldLine ?? 0))).length,
        String(Math.max(0, ...lines.map((l) => l.newLine ?? 0))).length,
      );
      const numCol = (n: number | undefined) =>
        n === undefined ? " ".repeat(gutterDigits) : String(n).padStart(gutterDigits);
      const gutterWidth = gutterDigits * 2 + 4; // "old new │ "
      const blankGutter = " ".repeat(gutterWidth);

      type Row = {
        gutter: string;
        prefix: string;
        text: string;
        type: DiffLine["type"] | "fold";
        foldKey?: number;
      };

      // Rebuilt whenever the terminal is (re)sized or folds are toggled,
      // since wrap width and which context runs collapse both change.
      let rows: Row[] = [];
      const buildRows = () => {
        const contentWidth = Math.max(10, terminal.width - gutterWidth - 2);
        rows = [];
        foldKeys = [];

        const pushLine = (line: DiffLine) => {
          const gutter = `${numCol(line.oldLine)} ${numCol(line.newLine)} │ `;
          const prefix = prefixFor(line.type);
          const wrapped = wrapText(line.text, contentWidth);
          wrapped.forEach((chunk, i) => {
            rows.push({
              gutter: i === 0 ? gutter : blankGutter,
              prefix: i === 0 ? prefix : "  ",
              text: chunk,
              type: line.type,
            });
          });
        };

        // Consecutive unchanged (context) lines fold behind a marker, like
        // `git diff`'s hunk collapsing, leaving `contextRadius` lines visible
        // on each side that borders a change. Each marker toggles on its own
        // with [Enter]; [Z] expands or collapses every marker at once.
        let i = 0;
        while (i < lines.length) {
          if (lines[i].type !== "context") {
            pushLine(lines[i]);
            i++;
            continue;
          }
          let j = i;
          while (j < lines.length && lines[j].type === "context") j++;
          const leadCount = i === 0 ? 0 : contextRadius;
          const trailCount = j === lines.length ? 0 : contextRadius;
          const hiddenCount = j - i - leadCount - trailCount;

          if (hiddenCount < 2) {
            for (let k = i; k < j; k++) pushLine(lines[k]);
          } else {
            foldKeys.push(i);
            const expanded = expandedFolds.has(i);
            const plural = hiddenCount === 1 ? "" : "s";
            for (let k = i; k < i + leadCount; k++) pushLine(lines[k]);
            rows.push({
              gutter: blankGutter,
              prefix: "",
              text: expanded
                ? `▾ ${hiddenCount} unchanged line${plural} shown (Enter to fold) ⋯`
                : `▸ ⋯ ${hiddenCount} unchanged line${plural} hidden (Enter to unfold) ⋯`,
              type: "fold",
              foldKey: i,
            });
            if (expanded) {
              for (let k = i + leadCount; k < j - trailCount; k++) pushLine(lines[k]);
            }
            for (let k = j - trailCount; k < j; k++) pushLine(lines[k]);
          }
          i = j;
        }
      };
      buildRows();

      const ensureCursorVisible = () => {
        const height = contentHeight();
        if (cursor < offset) offset = cursor;
        else if (cursor > offset + height - 1) offset = cursor - height + 1;
        offset = Math.max(0, Math.min(offset, maxOffset()));
      };

      const maxOffset = () => Math.max(0, rows.length - contentHeight());

      const render = () => {
        terminal.clear();
        terminal.moveTo(1, 1);
        const title = isNoChange
          ? ` Review edit: ${pageTitle} (no changes) `
          : ` Review edit: ${pageTitle} `;
        // `noFormat` throughout: page text can contain `%` (percent-encoded
        // URLs) or `^`, which terminal-kit would otherwise read as printf /
        // markup directives and substitute away. Floor the width like
        // `contentWidth` below: if `terminal.width` reads 0 before the
        // terminal has reported its real size (e.g. piped/tmux/SSH before
        // the first resize event), `truncateString(title, 0)` returns "".
        terminal.bold.white.noFormat(truncateString(title, Math.max(10, terminal.width)));
        terminal.moveTo(1, 2);
        terminal(chalk.dim("-".repeat(terminal.width)));

        const visible = rows.slice(offset, offset + contentHeight());
        visible.forEach((row, i) => {
          terminal.moveTo(1, 3 + i);
          const isCursor = offset + i === cursor;
          const content = row.type === "fold" ? row.text : row.prefix + row.text;
          if (isCursor) {
            terminal.noFormat(chalk.inverse(row.gutter + content));
            return;
          }
          terminal.noFormat(chalk.dim(row.gutter));
          terminal.noFormat(
            row.type === "fold" ? chalk.cyan.dim(content) : colorFor(row.type)(content),
          );
        });

        terminal.moveTo(1, terminal.height - 1);
        const scrollHint =
          rows.length > contentHeight()
            ? ` (${offset + 1}-${Math.min(offset + contentHeight(), rows.length)} of ${rows.length}, ↑/↓/PgUp/PgDn to scroll) `
            : "";
        terminal(chalk.dim(`${"-".repeat(terminal.width)}`));
        terminal.moveTo(1, terminal.height);
        terminal.bold.yellow(
          foldKeys.length > 0
            ? " [A]ccept  [S]kip  [L] Always  [X] Stop  [Enter] Toggle fold  [Z] Toggle all "
            : " [A]ccept  [S]kip  [L] Always  [X] Stop ",
        );
        terminal(chalk.dim(scrollHint));
      };

      const onResize = () => {
        buildRows();
        cursor = Math.min(cursor, rows.length - 1);
        ensureCursorVisible();
        render();
      };

      const cleanup = () => {
        terminal.removeListener("key", onKey);
        terminal.removeListener("resize", onResize);
        terminal.grabInput(false);
        terminal.hideCursor(false);
        terminal.fullscreen(false);
      };

      const onKey = (key: string) => {
        switch (key) {
          case "UP":
          case "k":
            cursor = Math.max(0, cursor - 1);
            ensureCursorVisible();
            render();
            return;
          case "DOWN":
          case "j":
            cursor = Math.min(rows.length - 1, cursor + 1);
            ensureCursorVisible();
            render();
            return;
          case "PAGE_UP":
            cursor = Math.max(0, cursor - contentHeight());
            ensureCursorVisible();
            render();
            return;
          case "PAGE_DOWN":
            cursor = Math.min(rows.length - 1, cursor + contentHeight());
            ensureCursorVisible();
            render();
            return;
          case "ENTER":
          case " ":
            {
              const row = rows[cursor];
              if (row?.type === "fold" && row.foldKey !== undefined) {
                if (expandedFolds.has(row.foldKey)) expandedFolds.delete(row.foldKey);
                else expandedFolds.add(row.foldKey);
                buildRows();
                cursor = Math.min(cursor, rows.length - 1);
                ensureCursorVisible();
                render();
              }
            }
            return;
          case "a":
          case "A":
            cleanup();
            resolve("accept");
            return;
          case "s":
          case "S":
            cleanup();
            resolve("skip");
            return;
          case "l":
          case "L":
            cleanup();
            resolve("always");
            return;
          case "z":
          case "Z":
            if (expandedFolds.size < foldKeys.length) {
              for (const key of foldKeys) expandedFolds.add(key);
            } else {
              expandedFolds.clear();
            }
            buildRows();
            cursor = Math.min(cursor, rows.length - 1);
            ensureCursorVisible();
            render();
            return;
          case "x":
          case "X":
          case "CTRL_C":
            cleanup();
            resolve("stop");
            return;
        }
      };

      terminal.fullscreen(true);
      terminal.hideCursor();
      terminal.grabInput(true);
      terminal.on("key", onKey);
      terminal.on("resize", onResize);
      render();
    });
  }
}

export class Output extends ServiceBase {
  /**
   * Chalk instance for coloring text
   */
  public color: ChalkInstance = chalk;
  public diff = diff;
  public printDiff = printDiff;
}
