/**
 * File helpers for Node tools and tests: resolve paths from the project root and read JSON.
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function projectPath(relative) {
  return path.join(ROOT, relative);
}

export async function readJsonFromDisk(relative) {
  return JSON.parse(await readFile(projectPath(relative), "utf8"));
}
