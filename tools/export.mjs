#!/usr/bin/env node
// Export a deck to PowerPoint or PDF, for people who need to change it somewhere else
// (Canva, Google Slides, Keynote, PowerPoint).
//
//   node tools/export.mjs path/to/index.html               → index.pptx next to the deck
//   node tools/export.mjs index.html --pdf                 → index.pdf, text you can select and search
//   node tools/export.mjs index.html --font "Noto Sans TC" set all text in a font the other app has
//   node tools/export.mjs index.html --steps               a page for every step, not just each slide's last
//   node tools/export.mjs index.html --slides 3,8          only these slides
//   node tools/export.mjs index.html --wait 5 --out x.pptx seconds to let a slide settle; where to write
//
// In the .pptx every picture, box and line of text is its own object, so they can be moved,
// copied and reused. What the slide shows after it settles is what gets exported: videos
// become their last frame, moving effects a still. Small decorations that are not boxes or
// pictures (bullet marks, numbered dots, lines) come along as small transparent pictures.
//
// Without --font the deck's own fonts are named, and an app that lacks them substitutes its
// own (Canva has no PingFang, for one), which moves and re-wraps text. --font needs the font
// installed or on Google Fonts, so pages are measured in the font the file will name; a PDF
// keeps its name only when it is installed as a .ttf file.
//
// Works on slidejam decks, and on any deck with a fixed-size #stage that exposes `slides`,
// `show(i)`, `next()` and `cur` as globals (--stage picks another stage element).
import { chromium } from "playwright";
import PptxGenJS from "pptxgenjs";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";
import { resolve, dirname, basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = (k) => { const i = args.indexOf("--" + k); if (i < 0) return false; args.splice(i, 1); return true; };
const font = opt("font", null);
let mono = opt("mono", font ? "Space Mono" : null);
const wait = +opt("wait", 5);
const stageSel = opt("stage", "#stage");
const outArg = opt("out", null);
const pdf = flag("pdf");
const everyStep = flag("steps");
const only = opt("slides", null)?.split(",").map(Number);
const file = resolve(args.shift() || "index.html");
const out = outArg ? resolve(outArg) : join(dirname(file), basename(file, ".html") + (pdf ? ".pdf" : ".pptx"));
const url = pathToFileURL(file).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// ---------- driving the deck ----------
async function open(i) {
  await page.goto("about:blank"); // a new hash alone wouldn't reload the deck
  await page.goto(url + "#" + (i + 1));
  await page.waitForFunction(() => window.Deck?.slides?.length || (typeof slides !== "undefined" && typeof show === "function"));
  const size = await page.evaluate((sel) => {
    // one interface over slidejam's Deck and the plain globals of older decks
    window.__x = window.Deck?.slides?.length
      ? { count: () => Deck.slides.length, cur: () => Deck.cur, slide: () => Deck.slides[Deck.cur], show: (i) => Deck.show(i), next: () => Deck.next() }
      : { count: () => slides.length, cur: () => cur, slide: () => slides[cur], show: (i) => show(i), next: () => next() };
    const st = document.querySelector(sel);
    return { w: st.offsetWidth, h: st.offsetHeight };
  }, stageSel);
  if (size.w !== page.viewportSize().width || size.h !== page.viewportSize().height) await page.setViewportSize({ width: size.w, height: size.h });
  await page.evaluate((i) => __x.cur() !== i && __x.show(i), i);
  return size;
}

// how many presses of → a slide takes before the next one: press until the slide changes,
// is shown again (the last slide re-shows itself, which touches its class), or nothing changes
async function countSteps(i) {
  await open(i);
  await page.waitForTimeout(600);
  let k = 0;
  for (; k < 30; k++) {
    const moved = await page.evaluate(async (i) => {
      let changed = false, reshown = false;
      const slide = __x.slide();
      const mo = new MutationObserver((ms) => { changed = true; if (ms.some((m) => m.target === slide && m.attributeName === "class")) reshown = true; });
      mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
      __x.next();
      await new Promise((r) => setTimeout(r, 350));
      mo.disconnect();
      return __x.cur() !== i || reshown ? "left" : changed ? "step" : "none";
    }, i);
    if (moved !== "step") break;
  }
  return k;
}

// open a slide at a step, let it settle, then stop everything that would still move
async function settle(i, steps) {
  const size = await open(i);
  await page.waitForTimeout(600);
  for (let s = 0; s < steps; s++) { await page.evaluate(() => __x.next()); await page.waitForTimeout(400); }
  await page.waitForTimeout(wait * 1000);
  await page.evaluate(async (sel) => {
    const slide = __x.slide();
    await Promise.all([...slide.querySelectorAll("video")].map((v) => !v.loop && v.duration
      ? new Promise((ok) => { v.pause(); v.onseeked = ok; v.currentTime = v.duration - 0.05; setTimeout(ok, 2000); })
      : v.pause()));
    document.getAnimations().forEach((a) => a.pause());
    window.requestAnimationFrame = () => 0;
    for (let id = 1; id < 1e5; id++) { clearInterval(id); }
    window.setTimeout = window.setInterval = () => 0;
    // show only the slide: the stage at the top left, unscaled; deck chrome and other slides hidden
    const st = document.querySelector(sel);
    for (let e = st; e && e !== document.body; e = e.parentElement)
      for (const sib of e.parentElement.children) if (sib !== e) sib.style.setProperty("display", "none", "important");
    for (const c of st.children) if (c !== slide) c.style.setProperty("display", "none", "important");
    const css = document.createElement("style");
    css.textContent = `html,body{overflow:visible!important;margin:0!important}
      ${sel}{position:absolute!important;left:0!important;top:0!important;transform:none!important;margin:0!important}
      ${sel} *,${sel} *::before,${sel} *::after{box-shadow:none!important;text-shadow:none!important;transition:none!important}
      @page{size:${st.offsetWidth}px ${st.offsetHeight}px;margin:0}`;
    document.head.append(css);
  }, stageSel);
  if (font) await useFont();
  await page.waitForTimeout(300);
  return size;
}

// every element in the slide in one of two plain weights of the chosen font: apps that import
// the file have regular and bold, not 600 or 650, and one family keeps a mixed line whole
async function useFont() {
  const r = await page.evaluate(async ({ font, mono }) => {
    // fonts.check() says yes to fonts that aren't there; a missing font measures like its fallback
    const has = (f) => { const g = document.createElement("canvas").getContext("2d"), t = "mmmmlli 0O 永和";
      return ["serif", "sans-serif"].every((b) => { g.font = `40px ${b}`; const w0 = g.measureText(t).width; g.font = `40px "${f}",${b}`; return g.measureText(t).width !== w0; }); };
    // not installed: try Google Fonts, which is enough to measure by
    const get = async (f) => {
      if (has(f)) return true;
      const l = document.createElement("link"); l.rel = "stylesheet";
      l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=block`;
      await new Promise((ok) => { l.onload = l.onerror = ok; document.head.append(l); });
      await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 40px "${f}"`, "永和 Aa").catch(() => {})));
      return has(f);
    };
    if (!(await get(font))) return { error: `font not found, installed or on Google Fonts: ${font}` };
    if (mono && !(await get(mono))) mono = null;
    const css = document.createElement("style");
    css.textContent = `.x-slide *::before,.x-slide *::after,.x-slide *::marker{font-family:inherit!important}`;
    document.head.append(css);
    const slide = __x.slide();
    slide.classList.add("x-slide");
    for (const e of [slide, ...slide.querySelectorAll("*")]) {
      const c = getComputedStyle(e);
      const isMono = /mono|courier|consolas|menlo/i.test(c.fontFamily);
      e.style.setProperty("font-family", isMono && mono ? `"${mono}","${font}",monospace` : `"${font}",sans-serif`, "important");
      e.style.setProperty("font-weight", +c.fontWeight >= 560 ? "700" : "400", "important");
    }
    return { mono };
  }, { font, mono });
  if (r.error) throw new Error(r.error);
  if (mono && !r.mono) console.log(`\n! ${mono} wasn't found, so code and labels are set in ${font} instead (pass --mono)`);
  mono = r.mono;
}

// ---------- reading a slide into objects ----------
// Walks the slide in paint order. Pictures (img, video, canvas, svg, iframes, background images,
// anything rotated or in 3D) are cut out of the page; plain boxes become shapes; text becomes
// text boxes. Whatever is left after hiding those (bullets, rules, pseudo-elements) is cut out
// in a second pass and split into separate pieces.
function readSlide(stageSel) {
  const st = document.querySelector(stageSel), S = st.getBoundingClientRect();
  const slide = __x.slide();
  const items = [];
  let xid = 0;
  const cv = document.createElement("canvas").getContext("2d");
  const color = (c) => {
    if (!c || c === "transparent") return null;
    cv.fillStyle = "#000"; cv.fillStyle = c;
    const v = cv.fillStyle;
    if (v.startsWith("#")) return { hex: v.slice(1).toUpperCase(), a: 1 };
    const m = v.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(",").map(Number);
    return { hex: [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase(), a };
  };
  const box = (r) => ({ x: r.left - S.left, y: r.top - S.top, w: r.right - r.left, h: r.bottom - r.top });
  const meet = (a, b) => {
    const r = { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
    return r.right - r.left > 0.5 && r.bottom - r.top > 0.5 ? r : null;
  };
  const tag = (e, cls) => { e.dataset.xid = ++xid; e.classList.add(cls); return xid; };
  const flat = (m) => m === "none" || /^matrix\([^,]+, 0, 0, [^,]+,/.test(m);
  const PICS = new Set(["IMG", "VIDEO", "CANVAS", "IFRAME", "OBJECT", "EMBED", "PICTURE"]);
  // inline, or an inline-block that draws nothing of its own around plain text (effects wrap
  // each letter or word in one), so a line of text stays one text box
  const inline = (e) => {
    if (PICS.has(e.tagName) || e instanceof SVGElement) return false;
    const c = getComputedStyle(e);
    if (c.display === "inline") return true;
    return /^inline-(block|flex)$/.test(c.display) && !(color(c.backgroundColor)?.a > 0.01) && c.backgroundImage === "none"
      && !parseFloat(c.borderTopWidth) && !parseFloat(c.borderBottomWidth) && flat(c.transform) && [...e.children].every((k) => k.tagName === "BR" || inline(k));
  };
  const hasText = (e) => [...e.childNodes].some((n) => (n.nodeType === 3 && n.textContent.trim()) || (n.nodeType === 1 && inline(n) && n.textContent.trim()));

  function walk(e, clip, op) {
    const c = getComputedStyle(e);
    if (c.display === "none" || c.visibility === "hidden") return;
    op *= +c.opacity;
    if (op < 0.04) return;
    const R = e.getBoundingClientRect();
    if (c.overflow !== "visible" && R.width && R.height) clip = meet(clip, R) || { left: 0, top: 0, right: 0, bottom: 0 };
    const vis = R.width && R.height ? meet(R, clip) : null;
    if (!vis && c.display !== "contents" && c.overflow !== "visible") return;
    // pictures, and anything rotated, skewed or in 3D (shapes and text boxes can't follow it)
    const many = e.querySelectorAll("img,canvas,svg,video").length > 12;
    if (vis && (PICS.has(e.tagName) || e instanceof SVGElement || !flat(c.transform) || many || /text/.test(c.webkitBackgroundClip + c.backgroundClip))) {
      items.push({ kind: "pic", xid: tag(e, "x-pic"), box: box(vis) });
      return;
    }
    if (vis && e !== slide) {
      const bg = color(c.backgroundColor);
      const bw = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].map(parseFloat);
      const bc = [c.borderTopColor, c.borderRightColor, c.borderBottomColor, c.borderLeftColor];
      const line = bw[0] > 0 && bw.every((w) => w === bw[0]) && bc.every((x) => x === bc[0]) && c.borderTopStyle !== "none" && color(bc[0]);
      if (c.backgroundImage !== "none") items.push({ kind: "pic", xid: tag(e, "x-picbg"), box: box(vis), own: true });
      else if ((bg && bg.a > 0.01) || (line && line.a > 0.01)) {
        tag(e, "x-shape");
        if (line) e.classList.add("x-line");
        const r = Math.min(parseFloat(c.borderTopLeftRadius) || 0, R.width / 2, R.height / 2);
        items.push({ kind: "shape", box: box(vis), fill: bg && bg.a > 0.01 ? { ...bg, a: bg.a * op } : null,
          line: line ? { ...line, w: bw[0] } : null, radius: vis === R || (vis.left === R.left && vis.right === R.right && vis.top === R.top && vis.bottom === R.bottom) ? r : 0 });
      }
    }
    if (hasText(e)) text(e, op);
    for (const k of e.children) if (!inline(k) || !hasText(e)) walk(k, clip, op);
  }

  // one text box per block of text, keeping each run's colour, size and weight
  function text(e, op) {
    const runs = [], rects = [];
    const c0 = getComputedStyle(e);
    const take = (n) => {
      for (const k of [...n.childNodes]) {
        if (k.nodeType === 3) {
          const c = getComputedStyle(k.parentElement);
          const pre = /pre/.test(c.whiteSpace);
          let t = pre ? k.textContent : k.textContent.replace(/\s+/g, " ");
          if (c.textTransform === "uppercase") t = t.toUpperCase();
          if (!t) continue;
          const rg = document.createRange(); rg.selectNodeContents(k);
          for (const r of rg.getClientRects()) if (r.width > 0) rects.push(r);
          const col = color(c.color) || { hex: "000000", a: 1 };
          runs.push({ t, color: col.hex, a: col.a * op, size: parseFloat(c.fontSize), bold: +c.fontWeight >= 560, italic: c.fontStyle === "italic",
            family: c.fontFamily.split(",")[0].replace(/["']/g, "").trim(), spacing: parseFloat(c.letterSpacing) || 0, underline: /underline/.test(c.textDecorationLine) });
          // hidden by wrapping, so the leftover pass doesn't cut the text out with the decorations
          const s = document.createElement("span"); s.className = "x-txt"; k.replaceWith(s); s.append(k);
        } else if (k.nodeType === 1 && k.tagName === "BR") runs.push({ t: "\n" });
        else if (k.nodeType === 1 && inline(k)) take(k);
      }
    };
    take(e);
    if (!rects.length) return;
    // neighbouring runs that look the same become one
    for (let j = runs.length - 1; j > 0; j--) {
      const a = runs[j - 1], z = runs[j];
      if (a.t !== "\n" && z.t !== "\n" && ["color", "a", "size", "bold", "italic", "family", "spacing", "underline"].every((k) => a[k] === z[k])) { a.t += z.t; runs.splice(j, 1); }
    }
    while (runs.length && !runs[0].t.trim()) runs.shift();
    if (!runs.length) return;
    runs[0].t = runs[0].t.replace(/^ +/, ""); const last = runs[runs.length - 1]; last.t = last.t.replace(/ +$/, "");
    const u = rects.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }),
      { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 });
    const tops = [...new Set(rects.map((r) => Math.round(r.top / 4)))];
    const size = Math.max(...runs.filter((r) => r.size).map((r) => r.size));
    // the glyphs' box is shorter than the line box; the text box starts where the line box does
    const glyphs = Math.max(...rects.map((r) => r.height));
    const lh = c0.lineHeight === "normal" ? glyphs : parseFloat(c0.lineHeight);
    const align = /center/.test(c0.textAlign) ? "center" : /right|end/.test(c0.textAlign) ? "right" : "left";
    // wrapping width: the block's content box; a single line gets room to spare, since the
    // other app's font metrics differ a little and a line that wraps is worse than one that's short
    const R = e.getBoundingClientRect();
    const padL = parseFloat(c0.paddingLeft) + parseFloat(c0.borderLeftWidth), padR = parseFloat(c0.paddingRight) + parseFloat(c0.borderRightWidth);
    let left = R.left + padL, right = R.right - padR;
    if (tops.length === 1) {
      const spare = Math.max(size, (u.right - u.left) * 0.15);
      if (align === "left") { left = u.left; right = Math.max(u.right + spare, right); }
      else if (align === "right") { right = u.right; left = Math.min(u.left - spare, left); }
      else { left = Math.min(u.left - spare / 2, left); right = Math.max(u.right + spare / 2, right); }
    } else right += size * 0.3;
    const top = u.top - (lh - glyphs) / 2;
    items.push({ kind: "text", box: box({ left, top, right, bottom: Math.max(u.bottom, top + lh * tops.length) + 2 }), runs, align, lh });
  }

  const bgc = color(getComputedStyle(slide).backgroundColor);
  const bg = bgc && bgc.a > 0.5 ? bgc.hex : color(getComputedStyle(st).backgroundColor)?.hex || "FFFFFF";
  const bgPic = getComputedStyle(slide).backgroundImage !== "none" ? { kind: "pic", xid: tag(slide, "x-picbg"), box: box(S), own: true } : null;
  walk(slide, { left: S.left, top: S.top, right: S.right, bottom: S.bottom }, 1);
  return { bg, items: bgPic ? [bgPic, ...items] : items };
}

// cut one item out of the page: everything else invisible, transparent background
const ISO = `html.x-iso,html.x-iso body{background:transparent!important}
  html.x-iso ${stageSel},html.x-iso ${stageSel} .x-slide{background:transparent!important}
  html.x-iso ${stageSel} *{visibility:hidden!important}
  html.x-iso ${stageSel} .x-solo,html.x-iso ${stageSel} .x-solo *{visibility:visible!important}
  html.x-iso ${stageSel} .x-solo.x-own *{visibility:hidden!important}
  html.x-iso ${stageSel} .x-solo.x-own{color:transparent!important;-webkit-text-fill-color:transparent!important}`;
// what's left once pictures, boxes and text are taken out
const LEFT = `html.x-left,html.x-left body{background:transparent!important}
  html.x-left ${stageSel},html.x-left ${stageSel} .x-slide{background:transparent!important}
  html.x-left .x-pic{visibility:hidden!important}
  html.x-left .x-picbg{background:none!important;border-color:transparent!important}
  html.x-left .x-shape{background-color:transparent!important}
  html.x-left .x-line{border-color:transparent!important}
  html.x-left .x-txt{color:transparent!important;-webkit-text-fill-color:transparent!important}`;

async function cut(item) {
  await page.evaluate(({ xid, own }) => {
    document.querySelectorAll(".x-solo").forEach((e) => e.classList.remove("x-solo", "x-own"));
    const e = document.querySelector(`[data-xid="${xid}"]`);
    e.classList.add("x-solo"); if (own) e.classList.add("x-own");
    document.documentElement.classList.add("x-iso");
  }, item);
  const { x, y, w, h } = item.box;
  const png = await page.screenshot({ clip: { x, y, width: w, height: h }, omitBackground: true });
  await page.evaluate(() => document.documentElement.classList.remove("x-iso"));
  return png;
}

// split the leftovers into separate pictures, one per cluster of marks
async function leftovers() {
  await page.evaluate(() => document.documentElement.classList.add("x-left"));
  const png = await page.screenshot({ omitBackground: true });
  await page.evaluate(() => document.documentElement.classList.remove("x-left"));
  const work = await browser.newPage();
  const parts = await work.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.width, H = img.height, c = document.createElement("canvas");
    c.width = W; c.height = H; const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, W, H).data;
    // 4×4 cells; cells touching (with one cell of slack) belong to the same piece
    const C = 4, cw = Math.ceil(W / C), ch = Math.ceil(H / C), on = new Uint8Array(cw * ch), count = new Uint32Array(cw * ch);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[(y * W + x) * 4 + 3] > 12) { const i = ((y / C) | 0) * cw + ((x / C) | 0); on[i] = 1; count[i]++; }
    const seen = new Int32Array(cw * ch).fill(-1), out = [];
    for (let i = 0; i < on.length; i++) {
      if (!on[i] || seen[i] >= 0) continue;
      let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0; const q = [i]; seen[i] = out.length;
      while (q.length) {
        const j = q.pop(), cx = j % cw, cy = (j / cw) | 0; n += count[j];
        x0 = Math.min(x0, cx); y0 = Math.min(y0, cy); x1 = Math.max(x1, cx); y1 = Math.max(y1, cy);
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
          const k = ny * cw + nx; if (on[k] && seen[k] < 0) { seen[k] = out.length; q.push(k); }
        }
      }
      if (n < 12) { out.push(null); continue; }
      const x = x0 * C, y = y0 * C, w = Math.min(W, (x1 + 1) * C) - x, h = Math.min(H, (y1 + 1) * C) - y;
      const p = document.createElement("canvas"); p.width = w; p.height = h; p.getContext("2d").drawImage(c, x, y, w, h, 0, 0, w, h);
      out.push({ box: { x, y, w, h }, data: p.toDataURL("image/png") });
    }
    return out.filter(Boolean);
  }, "data:image/png;base64," + png.toString("base64"));
  await work.close();
  return parts;
}

// ---------- writing ----------
const states = [];
const total = await (async () => { await open(0); return page.evaluate(() => __x.count()); })();
for (let i = 0; i < total; i++) {
  if (only && !only.includes(i + 1)) continue;
  const k = await countSteps(i);
  for (let s = everyStep ? 0 : k; s <= k; s++) states.push([i, s]);
}
console.log(`${total} slides, ${states.length} pages`);

if (pdf) {
  const doc = await PDFDocument.create();
  for (const [i, s] of states) {
    await settle(i, s);
    // print paints a grey box where a video is; put a picture of its frame in its place
    for (const v of await page.$$(`${stageSel} video`)) {
      const bb = await v.boundingBox(); if (!bb || bb.width < 2) continue;
      const src = "data:image/png;base64," + (await v.screenshot()).toString("base64");
      await v.evaluate((el, src) => { const img = new Image(); img.src = src; img.className = el.className;
        const c = getComputedStyle(el); for (const k of ["position", "left", "top", "right", "bottom", "width", "height", "borderRadius", "margin", "display", "transform"]) img.style[k] = c[k];
        el.after(img); el.remove(); }, src);
    }
    await page.waitForTimeout(200);
    const one = await PDFDocument.load(await page.pdf({ preferCSSPageSize: true, printBackground: true, pageRanges: "1" }));
    (await doc.copyPages(one, [0])).forEach((p) => doc.addPage(p));
    process.stdout.write(".");
  }
  fixRadicals(doc);
  writeFileSync(out, await doc.save());
  // Chromium embeds some fonts (variable ones, some web fonts) as nameless shapes; an app that
  // rebuilds the text, like Canva, then has to guess the font
  const shapes = doc.getPages().some((p) => { const f = p.node.Resources()?.lookup(PDFName.of("Font"));
    return f && f.entries().some(([, v]) => doc.context.lookup(v).get(PDFName.of("Subtype")) === PDFName.of("Type3")); });
  if (shapes) console.log("\n! Some text is embedded without its font's name, so apps that import the PDF will guess the font. Pass --font with a font installed as a .ttf file (not .otf, not a variable font).");
} else {
  const px = 1 / 96, pt = 0.75;
  const pptx = new PptxGenJS();
  let size;
  for (const [i, s] of states) {
    size = await settle(i, s);
    if (states[0][0] === i && states[0][1] === s) { pptx.defineLayout({ name: "DECK", width: size.w * px, height: size.h * px }); pptx.layout = "DECK"; }
    await page.addStyleTag({ content: ISO + LEFT });
    const { bg, items } = await page.evaluate(readSlide, stageSel);
    const slide = pptx.addSlide();
    slide.background = { color: bg };
    const at = (b) => ({ x: b.x * px, y: b.y * px, w: b.w * px, h: b.h * px });
    const texts = [];
    for (const it of items) {
      if (it.kind === "text") { texts.push(it); continue; }
      if (it.kind === "pic") { slide.addImage({ data: "image/png;base64," + (await cut(it)).toString("base64"), ...at(it.box) }); continue; }
      slide.addShape(it.radius > 0.5 ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, {
        ...at(it.box), rectRadius: it.radius > 0.5 ? it.radius * px : undefined,
        fill: it.fill ? { color: it.fill.hex, transparency: Math.round((1 - it.fill.a) * 100) } : { type: "none" },
        line: it.line ? { color: it.line.hex, width: it.line.w * pt, transparency: Math.round((1 - it.line.a) * 100) } : { type: "none" },
      });
    }
    for (const p of await leftovers()) slide.addImage({ data: p.data.replace(/^data:/, ""), ...at(p.box) });
    for (const t of texts) {
      slide.addText(t.runs.map((r) => r.t === "\n" ? { text: "", options: { breakLine: true } } : {
        text: r.t, options: { color: r.color, transparency: r.a < 1 ? Math.round((1 - r.a) * 100) : undefined, fontSize: r.size * pt, bold: r.bold, italic: r.italic,
          underline: r.underline ? { style: "sng" } : undefined, charSpacing: r.spacing ? r.spacing * pt : undefined,
          fontFace: font ? (mono && /mono|courier|consolas|menlo/i.test(r.family) ? mono : font) : r.family } }), {
        ...at(t.box), margin: 0, valign: "top", align: t.align, fit: "none", wrap: true, lineSpacing: t.lh * pt, paraSpaceBefore: 0, paraSpaceAfter: 0 });
    }
    process.stdout.write(".");
  }
  await pptx.writeFile({ fileName: out });
}
await browser.close();
console.log(`\n✓ ${out}`);
if (errors.length) { console.log("page errors:"); [...new Set(errors)].forEach((e) => console.log("  " + e)); }

// Fonts such as PingFang and Noto CJK draw 一 and the Kangxi radical ⼀ with one glyph, and
// Chromium's PDF tells readers it's the radical, so copied or searched text comes out wrong.
// Point those glyphs back at the ordinary characters.
function fixRadicals(doc) {
  const supplement = { 0x2ea0: "民", 0x2ed8: "青", 0x2ec4: "西", 0x2ec5: "見", 0x2ecf: "邑", 0x2ed6: "阜", 0x2e97: "心", 0x2eb7: "羊", 0x2ebc: "肉", 0x2ec9: "貝", 0x2ed1: "長", 0x2edd: "食", 0x2ee4: "鬼" };
  const plain = (cp) => {
    if (cp >= 0x2f00 && cp <= 0x2fdf) { const n = String.fromCodePoint(cp).normalize("NFKC"); return n.length === 1 ? n.codePointAt(0) : null; }
    return supplement[cp] ? supplement[cp].codePointAt(0) : null;
  };
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;
    const filter = obj.dict.get(PDFName.of("Filter"));
    let data = filter ? (filter === PDFName.of("FlateDecode") ? inflateSync(obj.contents) : null) : obj.contents;
    if (!data) continue;
    const s = data.toString("latin1");
    if (!s.includes("begincmap")) continue;
    // the destination is the last <hex> on each bfchar/bfrange line
    const fixed = s.replace(/^(.*<[0-9A-Fa-f]+>.*)<([0-9A-Fa-f]{4})>(\s*)$/gm, (m, head, hex, tail) => {
      const p = plain(parseInt(hex, 16));
      return p ? `${head}<${p.toString(16).toUpperCase().padStart(4, "0")}>${tail}` : m;
    });
    if (fixed === s) continue;
    obj.contents = deflateSync(Buffer.from(fixed, "latin1"));
    obj.dict.set(PDFName.of("Filter"), PDFName.of("FlateDecode"));
    obj.dict.delete(PDFName.of("DecodeParms"));
    obj.dict.delete(PDFName.of("Length"));
  }
}
