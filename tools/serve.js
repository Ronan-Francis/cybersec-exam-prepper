/**
 * A tiny static file server for local development, with no dependencies.
 *   npm start            serves the project at http://localhost:8080
 *   PORT=3000 npm start  uses another port
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { projectPath } from "./read-json.js";

const PORT = Number(process.env.PORT) || 8080;
const ROOT = projectPath(".");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const filePath = path.join(ROOT, urlPath.endsWith("/") ? `${urlPath}index.html` : urlPath);
  if (!filePath.startsWith(ROOT)) return send(response, 403, "Forbidden");
  try {
    if (!(await stat(filePath)).isFile()) return send(response, 404, "Not found");
    response.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    response.end(await readFile(filePath));
  } catch {
    send(response, 404, "Not found");
  }
}).listen(PORT, () => console.log(`Serving CSSP Exam Prep at http://localhost:${PORT}`));

function send(response, status, text) {
  response.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(text);
}
