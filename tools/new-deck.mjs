#!/usr/bin/env node
// Start a new deck, or refresh the engine inside an existing one.
//
//   node tools/new-deck.mjs ~/talks/my-talk            new folder with index.html, deck/, media/
//   node tools/new-deck.mjs ~/talks/my-talk --update   only replace deck/ (your slides are untouched)
//
// The engine is copied, not linked, so a deck folder keeps working on its own:
// zip it, mail it, open index.html from a USB stick.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [target, flag] = process.argv.slice(2);
if (!target) { console.error("usage: node tools/new-deck.mjs <folder> [--update]"); process.exit(1); }
const dir = resolve(target);
const update = flag === "--update";

if (!update && existsSync(join(dir, "index.html"))) {
  console.error(`${dir}/index.html already exists. Use --update to refresh only deck/.`);
  process.exit(1);
}
mkdirSync(join(dir, "media"), { recursive: true });
cpSync(join(root, "deck"), join(dir, "deck"), { recursive: true });
if (!update) cpSync(join(root, "template/index.html"), join(dir, "index.html"));
console.log(update ? `✓ refreshed ${dir}/deck` : `✓ new deck at ${dir}\n  open ${join(dir, "index.html")}`);
