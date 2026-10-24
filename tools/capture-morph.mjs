#!/usr/bin/env node
// Capture a "click → the page rebuilds itself" morph from two real pages.
//
//   node tools/capture-morph.mjs morph.config.mjs
//   node tools/capture-morph.mjs --from URL --click SEL [--to URL] --pair "SEL_A => SEL_B" --rows SEL --out DIR
//
// Writes screenshots plus morph.js into the out folder. Use it in a slide with
//   <div class="morph" data-fx="morph" data-src="media/morph-x"></div>
//
// Config (all keys optional except from.url, from.click, out):
//   out      folder to write, relative to the current directory
//   size     [width, height] of the browser, default [1600, 900]
//   from     { url, click, scroll }    page A, the element that gets clicked, and
//                                      optionally how far down to scroll first (px)
//   to       { url }                   page B; leave out to really click and follow
//   pairs    [[selA, selB], …]         elements that fly from A to B (title → title …)
//   rows     selector on page B        everything else that rises in, staggered
//   hide     [selector, …]             removed on both pages (cookie bars, popups)
//   wait     ms | "map"                extra settle time; "map" waits for map tiles too
//   init     () => {}                  runs in the page before its own scripts
//                                      (set localStorage flags that hide popups…)
//   setup    async (page) => {}        runs before each page is captured
// Selectors can use Playwright syntax, e.g. 'a[href="/p/x"] >> text=Title'.
//   boxPad   px around the clicked element, default 0
//   fill     colour of the growing box; default is the clicked element's background, "none" for no box
//   stagger  seconds between rows, default 0.1
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function readConfig(argv) {
  if (argv[0] && !argv[0].startsWith("--")) return (await import(pathToFileURL(resolve(argv[0])).href)).default;
  const c = { from: {}, to: {}, pairs: [] };
  for (let i = 0; i < argv.length; i += 2) {
    const [k, v] = [argv[i].replace(/^--/, ""), argv[i + 1]];
    if (k === "from") c.from.url = v;
    else if (k === "click") c.from.click = v;
    else if (k === "to") c.to.url = v;
    else if (k === "pair") c.pairs.push(v.split("=>").map((s) => s.trim()));
    else if (k === "hide") (c.hide ??= []).push(v);
    else if (k === "wait") c.wait = /^\d+$/.test(v) ? +v : v;
    else c[k] = /^[\d.]+$/.test(v) ? +v : v;
  }
  if (!c.to.url) delete c.to;
  return c;
}

const C = await readConfig(process.argv.slice(2));
if (!C.from?.url || !C.from?.click || !C.out) {
  console.error("need at least from.url, from.click and out — see the comment at the top of this file");
  process.exit(1);
}
const [W, H] = C.size ?? [1600, 900];
const OUT = resolve(C.out);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: "light" });
if (C.init) await ctx.addInitScript(C.init);
const page = await ctx.newPage();

async function settle() {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  if (C.wait === "map") {
    // Leaflet marks tiles as loaded; MapLibre/Mapbox expose map.loaded() on the canvas container
    await page.waitForFunction(() => {
      const t = document.querySelectorAll(".leaflet-tile");
      if (t.length) return [...t].every((x) => x.classList.contains("leaflet-tile-loaded"));
      return true;
    }, null, { timeout: 20000 }).catch(() => console.warn("map tiles never finished loading — capturing anyway"));
    await page.waitForTimeout(1200);
  } else await page.waitForTimeout(typeof C.wait === "number" ? C.wait : 1200);
  if (C.hide?.length) await page.evaluate((sels) => sels.forEach((s) => document.querySelectorAll(s).forEach((e) => e.remove())), C.hide);
  if (C.setup) await C.setup(page);
  await page.evaluate(() => scrollTo(0, 0));
}

const one = async (sel) => {
  const loc = page.locator(sel).first();
  if (!(await loc.count())) throw new Error(`nothing matches "${sel}" on ${page.url()}`);
  return loc;
};
// screenshot one element alone on a see-through background, so it can float over the other page:
// everything else is hidden (overlays that merely sit behind it included) and ancestors lose
// their backgrounds. Flying text drops its own background too; rows keep theirs, so cards stay cards.
async function grab(file, loc, self = false) {
  const b = await loc.boundingBox();
  await loc.evaluate((e, self) => {
    const st = document.createElement("style");
    st.id = "__grab";
    st.textContent = "body *{visibility:hidden !important} [data-grab],[data-grab] *{visibility:visible !important}";
    document.head.appendChild(st);
    e.setAttribute("data-grab", "");
    window.__bg = [];
    for (let p = self ? e : e.parentElement; p; p = p.parentElement) { window.__bg.push([p, p.style.background]); p.style.background = "transparent"; }
  }, self);
  await loc.screenshot({ path: `${OUT}/${file}`, omitBackground: true });
  await loc.evaluate((e) => { e.removeAttribute("data-grab"); document.getElementById("__grab").remove(); window.__bg.forEach(([p, bg]) => (p.style.background = bg)); });
  return { x: b.x, y: b.y, w: b.width, h: b.height };
}
const fontSize = (loc) => loc.evaluate((e) => (e.textContent.trim() ? parseFloat(getComputedStyle(e).fontSize) : 0));

// ---- page A ----
await page.goto(C.from.url, { waitUntil: "load" });
await settle();
const target = await one(C.from.click);
if (C.from.scroll != null) { await page.evaluate((y) => scrollTo(0, y), C.from.scroll); await page.waitForTimeout(400); }
else await target.scrollIntoViewIfNeeded();
const tb = await target.boundingBox();
if (tb.y + tb.height > H) throw new Error(`"${C.from.click}" is below the fold even after scrolling; pick something higher on the page`);
const pad = C.boxPad ?? 0;
const box = { x: tb.x - pad, y: tb.y - pad, w: tb.width + pad * 2, h: tb.height + pad * 2 };
// the growing box is painted in the clicked element's own colour (none if it has no background)
const fill = C.fill !== undefined ? (C.fill === "none" ? null : C.fill) : await target.evaluate((e) => { const c = getComputedStyle(e).backgroundColor; return /rgba\(.*,\s*0\)$|transparent/.test(c) ? null : c; });
const pairs = C.pairs ?? [];
const from = [];
for (const [i, [a]] of pairs.entries()) {
  const loc = await one(a);
  from.push({ ...(await grab(`pair-${i}-a.png`, loc, true)), fs: await fontSize(loc) });
}
await page.screenshot({ path: `${OUT}/from.png` });

// ---- page B ----
if (C.to?.url) await page.goto(C.to.url, { waitUntil: "load" });
else await Promise.all([page.waitForLoadState("load"), target.click()]);
await settle();
const to = [];
for (const [i, [, b]] of pairs.entries()) {
  const loc = await one(b);
  to.push({ ...(await grab(`pair-${i}-b.png`, loc, true)), fs: await fontSize(loc) });
  await loc.evaluate((e) => e.setAttribute("data-morph-pair", ""));
}
const rows = [];
if (C.rows) {
  const all = page.locator(C.rows);
  const n = await all.count();
  for (let i = 0; i < n; i++) {
    const loc = all.nth(i);
    const b = await loc.boundingBox();
    if (!b || b.width < 2 || b.height < 2) continue;
    if (b.y + b.height > H || b.x + b.width > W) continue; // off-screen rows would scroll the page while capturing
    // skip rows that wrap or sit inside a flying element or another row, or they would show twice
    const overlaps = await loc.evaluate((e) => [...document.querySelectorAll("[data-morph-pair], [data-morph-row]")].some((p) => e.contains(p) || p.contains(e)));
    if (overlaps) continue;
    rows.push(await grab(`row-${rows.length}.png`, loc));
    await loc.evaluate((e) => e.setAttribute("data-morph-row", ""));
  }
}
// page B without the flying parts, so they can land on it
await page.evaluate(() => {
  scrollTo(0, 0);
  document.querySelectorAll("[data-morph-pair], [data-morph-row]").forEach((e) => (e.style.opacity = 0));
});
await page.waitForTimeout(200);
await page.screenshot({ path: `${OUT}/to.png` });
await browser.close();

const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v * 10) / 10]));
const data = {
  size: [W, H],
  box: round(box),
  click: [Math.round(box.x + box.w / 2), Math.round(box.y + box.h / 2)],
  fill,
  pairs: pairs.map((_, i) => {
    const a = from[i], b = to[i];
    // text scales by font size (line wraps change widths); anything else by width
    const ratio = a.fs && b.fs ? b.fs / a.fs : b.w / a.w;
    return { from: round({ x: a.x, y: a.y, w: a.w, h: a.h }), to: round({ x: b.x, y: b.y, w: b.w, h: b.h }), ratio: Math.round(ratio * 1e4) / 1e4 };
  }),
  rows: rows.map(round),
  stagger: C.stagger ?? 0.1,
  source: { from: C.from.url, to: C.to?.url ?? "(clicked)", captured: new Date().toISOString().slice(0, 10) },
};
const src = C.out.replace(/\\/g, "/").replace(/\/$/, "");
writeFileSync(`${OUT}/morph.js`, `// made by tools/capture-morph.mjs — re-run it instead of editing by hand\nDeck.morph(${JSON.stringify(src)}, ${JSON.stringify(data, null, 1)});\n`);
console.log(`✓ ${OUT}  (${pairs.length} pairs, ${rows.length} rows)`);
console.log(`  <div class="morph" data-fx="morph" data-src="${src}"></div>`);
