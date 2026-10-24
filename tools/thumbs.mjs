#!/usr/bin/env node
// Picture of each effect's demo, for the cards on the website's effects page.
// Re-run after changing an effect:  node tools/thumbs.mjs   →  site/public/thumbs/<id>.jpg
// It also takes the posters for the play page (site/public/posters/<deck>.jpg).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const out = resolve("site/public/thumbs");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto(pathToFileURL(resolve("effects.html")).href);
await page.waitForFunction(() => window.Deck?.slides?.length);
const ids = await page.evaluate(() => Deck.slides.map((s) => s.id).filter(Boolean));
for (const id of ids) {
  await page.evaluate((id) => Deck.show(Deck.slides.findIndex((s) => s.id === id)), id);
  await page.waitForTimeout(3600);
  // the demo is the slide's first child; frame it with a little paper around it
  const box = await page.evaluate((id) => {
    const r = document.getElementById(id).firstElementChild.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, id);
  const pad = 28;
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1600, box.width + pad * 2), height: Math.min(900, box.height + pad * 2) };
  await page.screenshot({ path: `${out}/${id}.jpg`, type: "jpeg", quality: 80, clip });
}

// posters for the play page: each example deck's opening slide
const decks = { intro: "examples/intro/index.html", effects: "effects.html", taipei: "examples/taipei/index.html" };
const posters = resolve("site/public/posters");
mkdirSync(posters, { recursive: true });
for (const [id, file] of Object.entries(decks)) {
  await page.goto(pathToFileURL(resolve(file)).href + "?slide=1");
  await page.waitForFunction(() => window.Deck?.slides?.length);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${posters}/${id}.jpg`, type: "jpeg", quality: 82 });
}
await browser.close();
console.log(`✓ ${ids.length} thumbnails → ${out}, ${Object.keys(decks).length} posters → ${posters}`);
