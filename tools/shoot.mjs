#!/usr/bin/env node
// Screenshot slides of a deck, so you (or an AI) can check them without opening a browser.
//
//   node tools/shoot.mjs path/to/index.html            every slide, 2.5 s after it opens
//   node tools/shoot.mjs index.html 3 12 14            only these slides
//   node tools/shoot.mjs index.html 14 --at 0.5,2,4    several moments of one slide
//   node tools/shoot.mjs index.html 24 --steps 2       press → twice before the shot
//   node tools/shoot.mjs index.html --sheet            also save sheet.png, all shots on one page
//
// Pictures go to .shots/ next to the deck (override with --out DIR).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const at = opt("at", "2.5").split(",").map(Number);
const steps = +opt("steps", 0);
const outArg = opt("out", null);
const sheet = args.includes("--sheet") && args.splice(args.indexOf("--sheet"), 1);
const file = resolve(args.shift() || "index.html");
const out = outArg ? resolve(outArg) : join(dirname(file), ".shots");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(pathToFileURL(file).href);
await page.waitForFunction(() => window.Deck?.slides?.length);
const total = await page.evaluate(() => Deck.slides.length);
const which = args.length ? args.map(Number) : Array.from({ length: total }, (_, i) => i + 1);

const shots = [];
for (const n of which) {
  for (const t of at) {
    await page.evaluate((i) => Deck.show(i), n - 1);
    for (let s = 0; s < steps; s++) { await page.waitForTimeout(400); await page.evaluate(() => Deck.next()); }
    await page.waitForTimeout(t * 1000);
    const name = `${String(n).padStart(2, "0")}${at.length > 1 ? `-${t}s` : ""}${steps ? `-step${steps}` : ""}.png`;
    await page.screenshot({ path: join(out, name) });
    shots.push([name, `${n}${at.length > 1 ? ` · ${t}s` : ""}`]);
  }
}
if (sheet) {
  const cols = shots.length > 8 ? 4 : 3;
  await page.setViewportSize({ width: cols * 400 + 20, height: 900 });
  await page.setContent(`<body style="margin:0;padding:10px;background:#111;font:14px monospace;color:#ccc;display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px">` +
    shots.map(([f, l]) => `<div><img src="${pathToFileURL(join(out, f)).href}" style="width:100%;display:block">${l}</div>`).join("") + "</body>");
  await page.waitForLoadState("load");
  await page.screenshot({ path: join(out, "sheet.png"), fullPage: true });
}
await browser.close();
console.log(`✓ ${which.length} slide(s) → ${out}`);
if (errors.length) { console.log("page errors:"); [...new Set(errors)].forEach((e) => console.log("  " + e)); }
