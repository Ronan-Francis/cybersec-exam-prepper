/**
 * The single-file build: it runs, keeps the code intact and leaves nothing external to load.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { projectPath } from "../tools/read-json.js";

execFileSync(process.execPath, [projectPath("tools/bundle.js")], { stdio: "pipe" });
const html = readFileSync(projectPath("dist/cssp-exam-prep.html"), "utf8");
const script = html.match(/<script>\n([\s\S]*)\n<\/script>/)[1];

test("the bundled script is valid JavaScript", () => {
  assert.doesNotThrow(() => new Function(script));
});

test("code survives bundling unchanged (\"$$\" is not collapsed to \"$\")", () => {
  assert.ok(script.includes("const { $, $$ } = __require"));
});

test("no local stylesheets or module scripts are left to load", () => {
  assert.ok(!/<link rel="stylesheet" href="css\//.test(html));
  assert.ok(!/<script type="module"/.test(html));
  assert.ok(html.includes("globalThis.CSSP_DATA = "));
});
