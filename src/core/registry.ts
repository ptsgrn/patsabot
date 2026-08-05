import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { resolveMeta } from "./context";
import {
  type AnyCommand,
  isScript,
  type ResolvedScriptMeta,
  type Script,
} from "./define";

export const SCRIPTS_DIR = join(import.meta.dir, "../scripts");

export interface ScriptEntry {
  /** Path under `src/scripts` without the extension — the CLI name. */
  name: string;
  script: Script<AnyCommand>;
  meta: ResolvedScriptMeta;
}

const NAME_PATTERN = /^[a-z0-9][a-z0-9\-/.]*$/;

/**
 * Load one script by its path name (e.g. `afccat`,
 * `database-reports/long-stubs`).
 */
export async function loadScript(name: string): Promise<ScriptEntry> {
  if (!NAME_PATTERN.test(name) || name.includes("..")) {
    throw new Error(`Invalid script name: ${name}`);
  }

  const path = join(SCRIPTS_DIR, `${name}.ts`);
  if (!(await Bun.file(path).exists())) {
    throw new Error(`Script not found: ${name}`);
  }

  const module = await import(path);
  if (!isScript(module.default)) {
    throw new Error(
      `Script ${name} must default-export defineScript({ ... })`,
    );
  }

  const script = module.default as Script<AnyCommand>;
  return { name, script, meta: resolveMeta(script, name) };
}

/**
 * Every script name under `src/scripts`, including subdirectories.
 *
 * Files starting with `_` are shared helpers, not scripts, and are skipped —
 * as are `.d.ts` files and anything outside `.ts`.
 */
export async function listScriptNames(): Promise<string[]> {
  const files = (await readdir(SCRIPTS_DIR, { recursive: true })) as string[];
  return files
    .map((f) => f.replaceAll("\\", "/"))
    .filter(
      (f) =>
        f.endsWith(".ts") &&
        !f.endsWith(".d.ts") &&
        !f.split("/").some((segment) => segment.startsWith("_")),
    )
    .map((f) => f.replace(/\.ts$/, ""))
    .sort();
}

/**
 * Load every script. Modules that fail to import (or do not export a script)
 * are reported through `onError` and skipped, so one broken file cannot break
 * `--help` or the scheduler.
 */
export async function discoverScripts(
  onError?: (name: string, error: Error) => void,
): Promise<ScriptEntry[]> {
  const entries: ScriptEntry[] = [];
  for (const name of await listScriptNames()) {
    try {
      entries.push(await loadScript(name));
    } catch (err) {
      onError?.(name, err as Error);
    }
  }
  return entries;
}
