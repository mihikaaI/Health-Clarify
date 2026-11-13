#!/usr/bin/env node
/**
 * Publish the scroll page from scrollcraft/builds/healthclarify/ into the Next.js
 * app's public/scroll/ folder. next.config.mjs rewrites "/" to it.
 *
 *   node scrollcraft/sync-to-app.mjs
 *
 * The build folder stays the source of truth. The only change made on the way
 * is rewriting the relative asset URLs to /scroll/..., because the page is
 * served from "/" and a relative "page.css" would resolve to /page.css.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "scrollcraft", "builds", "healthclarify");
const dst = path.join(root, "public", "scroll");
fs.mkdirSync(dst, { recursive: true });

for (const f of ["scrollcraft.css", "scrollcraft.js", "page.css", "page.js", "data.js", "i18n.js"]) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
}

let html = fs.readFileSync(path.join(src, "index.html"), "utf8");
for (const f of ["scrollcraft.css", "page.css", "scrollcraft.js", "page.js", "data.js", "i18n.js"]) {
  html = html.replace(new RegExp(`(href|src)="${f.replace(".", "\.")}"`, "g"), `$1="/scroll/${f}"`);
}
fs.writeFileSync(path.join(dst, "index.html"), html);
console.log("published to " + path.relative(root, dst));
