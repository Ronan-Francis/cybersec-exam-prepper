/**
 * Builds a single self-contained HTML file: dist/cssp-exam-prep.html
 *   npm run bundle
 *
 * It inlines the stylesheets, the JSON data (as globalThis.CSSP_DATA) and the JavaScript modules.
 * The modules are wrapped in a small loader, so there are no dependencies or bundler to install.
 * This works because the source follows two conventions (see README):
 *   - imports are single-line named imports:  import { a, b as c } from "./file.js";
 *   - exports are declarations:               export function f() {}  /  export const x = ...
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { projectPath } from "./read-json.js";
import { loadAppData } from "../js/data/load-data.js";
import { readJsonFromDisk } from "./read-json.js";

const ENTRY = "js/main.js";
const OUTPUT = "dist/cssp-exam-prep.html";

async function bundle() {
  let html = await readFile(projectPath("index.html"), "utf8");
  html = await inlineStylesheets(html);
  const data = await loadAppData(readJsonFromDisk, "data/");
  const modules = await collectModules(ENTRY);
  const script = `globalThis.CSSP_DATA = ${JSON.stringify(data)};\n${moduleLoader(modules, ENTRY)}`;
  if (/<\/script/i.test(script)) throw new Error("Bundled code contains a closing script tag");
  html = html.replace(/\s*<script type="module" src="js\/main\.js"><\/script>/, "");
  // Function replacements, so "$$" and "$&" in the code are not treated as replacement patterns.
  html = html.replace("</body>", () => `<script>\n${script}\n</script>\n</body>`);
  await mkdir(projectPath("dist"), { recursive: true });
  await writeFile(projectPath(OUTPUT), html);
  console.log(`Wrote ${OUTPUT} (${Math.round(html.length / 1024)} KB, ${modules.size} modules)`);
}

/** Replaces each local <link rel="stylesheet" href="css/..."> with an inline <style>. */
async function inlineStylesheets(html) {
  const links = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)">/g)];
  for (const [tag, href] of links) {
    const css = await readFile(projectPath(href), "utf8");
    html = html.replace(tag, () => `<style>/* ${href} */\n${css}</style>`);
  }
  return html;
}

const IMPORT = /^import\s+\{([^}]*)\}\s+from\s+["']([^"']+)["'];?[ \t]*$/gm;

/** Reads the entry module and everything it imports, keyed by project-relative path. */
async function collectModules(entry, modules = new Map()) {
  if (modules.has(entry)) return modules;
  const source = await readFile(projectPath(entry), "utf8");
  modules.set(entry, source);
  for (const [, , specifier] of source.matchAll(IMPORT)) {
    await collectModules(resolve(entry, specifier), modules);
  }
  return modules;
}

function resolve(fromFile, specifier) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
}

/** Turns one ES module into a function body that returns its exports. */
function toFactory(file, source) {
  const exported = [];
  let body = source.replace(IMPORT, (_, names, specifier) => {
    const bindings = names.split(",").map(n => n.trim()).filter(Boolean).map(n => n.replace(/\s+as\s+/, ": "));
    return `const { ${bindings.join(", ")} } = __require(${JSON.stringify(resolve(file, specifier))});`;
  });
  body = body.replace(/^export\s+((?:async\s+)?function\*?|const|let|class)\s+([A-Za-z_$][\w$]*)/gm, (_, keyword, name) => {
    exported.push(name);
    return `${keyword} ${name}`;
  });
  if (/^\s*export\s/m.test(body) || /^\s*import\s/m.test(body)) {
    throw new Error(`${file} uses an import or export form the bundler doesn't support (see README conventions)`);
  }
  return `function () {\n${body}\nreturn { ${exported.join(", ")} };\n}`;
}

function moduleLoader(modules, entry) {
  const factories = [...modules].map(([file, source]) => `${JSON.stringify(file)}: ${toFactory(file, source)}`);
  return `(function () {
"use strict";
const __factories = {
${factories.join(",\n")}
};
const __cache = {};
function __require(file) {
  if (!(file in __cache)) __cache[file] = __factories[file]();
  return __cache[file];
}
__require(${JSON.stringify(entry)});
})();`;
}

await bundle();
