// slidejam core: a 1600×900 stage, slides, keyboard nav, overview, notes,
// plus two authoring modes — E edits text in place and writes it back to this
// file, A collects "do X here" notes you can paste to an AI.
// Effects live one per file in fx/; only the ones a deck uses are loaded.
(() => {
  const FX_BASE = new URL("fx/", document.currentScript.src).href;
  const W = 1600, H = 900;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, parent) => {
    const e = Object.assign(document.createElement(tag), attrs);
    e.dataset.gen = "";
    if (parent) parent.appendChild(e);
    return e;
  };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const Deck = (window.Deck = { W, H, fx: {}, cur: 0, slides: [] });
  let stage, notes, toastTimer;

  // ---------- effects registry ----------
  // An effect is { setup(el), enter(el, slide), leave(el), step(el) -> bool, thumb(el) }.
  // setup runs once at load for every element, so thumbnails of unvisited slides look right.
  // Elements opt in with data-fx="name" (several names separated by spaces).
  Deck.fx.register = (name, def) => (Deck.fx[name] = def);
  const fxOf = (e) => (e.dataset.fx || "").split(/\s+/).filter(Boolean).map((n) => [n, Deck.fx[n]]);
  function eachFx(slide, fn) {
    $$("[data-fx]", slide).forEach((e) => fxOf(e).forEach(([n, d]) => {
      if (!d) return console.warn(`[slidejam] unknown effect "${n}"`, e);
      fn(d, e);
    }));
  }

  function toast(msg, ms = 2600) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), ms);
  }
  Deck.toast = toast;

  // ---------- navigation ----------
  function fit() {
    const s = Math.min(innerWidth / W, innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }

  function leave(i) {
    const s = Deck.slides[i];
    if (!s) return;
    s.classList.remove("active");
    $$("video", s).forEach((v) => v.pause());
    eachFx(s, (d, e) => d.leave?.(e));
  }

  function show(i) {
    const slides = Deck.slides;
    i = Math.max(0, Math.min(slides.length - 1, i));
    leave(Deck.cur);
    Deck.cur = i;
    const s = slides[i];
    $$("[data-step]", s).forEach((e) => e.classList.remove("on"));
    $$("[data-step-out]", s).forEach((e) => e.classList.remove("off"));
    s.classList.add("active");
    $$("video", s).forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
    if (!authoring()) eachFx(s, (d, e) => d.enter?.(e, s));
    stage.classList.toggle("on-dark", s.classList.contains("section") || s.classList.contains("video") || s.classList.contains("dark"));
    $("#bar").style.width = ((i + 1) / slides.length) * 100 + "%";
    $("#page").textContent = `${i + 1} / ${slides.length}`;
    renderNotes();
    renderPins();
    renderPresenter();
    history.replaceState(null, "", "#" + (i + 1));
  }

  function next() {
    const s = Deck.slides[Deck.cur];
    // effects with their own steps get the key first, then data-step groups
    let used = false;
    eachFx(s, (d, e) => { if (!used && d.step?.(e)) used = true; });
    if (used) return;
    const pending = [...$$("[data-step]", s).filter((e) => !e.classList.contains("on")).map((e) => +e.dataset.step),
      ...$$("[data-step-out]", s).filter((e) => !e.classList.contains("off")).map((e) => +e.dataset.stepOut)];
    if (pending.length) {
      const n = Math.min(...pending);
      $$(`[data-step="${n}"]`, s).forEach((e) => e.classList.add("on"));
      $$(`[data-step-out="${n}"]`, s).forEach((e) => e.classList.add("off"));
      return;
    }
    show(Deck.cur + 1);
  }
  Object.assign(Deck, { show, next, prev: () => show(Deck.cur - 1) });

  // in E or A mode effects stand still, so text and positions are where they rest
  const authoring = () => document.body.classList.contains("editing") || document.body.classList.contains("annotating");
  function freezeFx(on) {
    const s = Deck.slides[Deck.cur];
    eachFx(s, (d, e) => (on ? d.leave?.(e) : d.enter?.(e, s)));
  }

  // ---------- notes ----------
  const notesOf = (s) => $("aside.notes", s);
  function renderNotes() {
    const n = notesOf(Deck.slides[Deck.cur]);
    const text = n ? n.textContent.trim() : "";
    if (document.body.classList.contains("editing")) {
      notes.innerHTML = "";
      el("b", { textContent: `［${Deck.cur + 1}］講稿（可以直接改）` }, notes);
      const box = el("div", { contentEditable: "plaintext-only", textContent: text }, notes);
      if (n) box.addEventListener("input", () => { n.textContent = "\n" + box.innerText.trim() + "\n"; markDirty(n); });
    } else {
      notes.textContent = `［${Deck.cur + 1}］ ` + text;
    }
  }

  // ---------- thumbnails, overview, progress peek ----------
  function makeThumb(i, width) {
    const box = el("div", { className: "thumb" });
    const c = Deck.slides[i].cloneNode(true);
    c.classList.add("active");
    c.removeAttribute("id"); $$("[id]", c).forEach((e) => e.removeAttribute("id"));
    $$("aside.notes, .anno-pin", c).forEach((e) => e.remove());
    $$("video", c).forEach((v) => { v.removeAttribute("autoplay"); v.preload = "metadata"; v.src = v.getAttribute("src").split("#")[0] + "#t=2.5"; });
    $$("[data-step]", c).forEach((e) => e.classList.add("on"));
    $$("[data-step-out]", c).forEach((e) => e.classList.add("off"));
    eachFx(c, (d, e) => d.thumb?.(e));
    c.style.transform = `scale(${width / W})`;
    box.appendChild(c);
    return box;
  }
  const titleOf = (i) => {
    const s = Deck.slides[i];
    if (s.dataset.title) return s.dataset.title;
    const t = $(".kicker, h1, h2, .big-q", s);
    if (t) return t.textContent.replace(/\s+/g, " ").trim().slice(0, 22);
    const v = $("video", s);
    return v ? "🎬 " + v.getAttribute("src").split("/").pop().replace(/\.\w+$/, "") : "";
  };
  Deck.titleOf = titleOf;

  // the overview and Play all share one scroll position, so switching between them
  // keeps every thumbnail where it was
  let ovBuilt = false, ovScroll = 0;
  function toggleOverview(force, keepScroll) {
    const ov = $("#overview");
    const on = force ?? !ov.classList.contains("show");
    if (!on && ov.classList.contains("show")) ovScroll = ov.scrollTop;
    if (on && !ovBuilt) {
      const top = el("div", { className: "ov-top" }, ov);
      ov.prepend(top);
      const back = el("button", { className: "ov-back", textContent: "←", title: "回到投影片（Esc）" }, top);
      back.onclick = (e) => { e.stopPropagation(); toggleOverview(false); };
      el("b", { textContent: "總覽" }, top);
      const play = el("button", { textContent: "▶ 播放全部" }, top);
      play.onclick = (e) => { e.stopPropagation(); toggleOverview(false); toggleWall(true); };
      el("span", { textContent: "點縮圖跳到那一頁" }, top);
      const grid = $(".grid", ov);
      Deck.slides.forEach((_, i) => {
        const it = el("div", { className: "ov-item" }, grid); it.dataset.k = i;
        it.appendChild(makeThumb(i, 300));
        el("span", { textContent: `${i + 1}　${titleOf(i)}` }, it);
        it.addEventListener("click", (e) => { e.stopPropagation(); toggleOverview(false); show(i); });
      });
      requestAnimationFrame(() => $$(".thumb", grid).forEach((t) => (t.firstChild.style.transform = `scale(${t.clientWidth / W})`)));
      ovBuilt = true;
    }
    ov.classList.toggle("show", on);
    if (on) {
      $$(".ov-item", ov).forEach((it) => it.classList.toggle("cur", +it.dataset.k === Deck.cur));
      if (keepScroll) ov.scrollTop = ovScroll;
      else $(".ov-item.cur", ov)?.scrollIntoView({ block: "center" });
    }
  }

  function setupPeek() {
    const zone = $("#hoverzone"), peek = $("#peek"), tick = $("#peek-tick"), bar = $("#bar");
    const cache = {};
    const idxAt = (e) => Math.min(Deck.slides.length - 1, Math.max(0, Math.floor((e.offsetX / zone.clientWidth) * Deck.slides.length)));
    zone.addEventListener("mousemove", (e) => {
      const i = idxAt(e), n = Deck.slides.length;
      if (peek.dataset.k !== String(i)) {
        peek.dataset.k = i; peek.innerHTML = "";
        peek.appendChild((cache[i] ??= makeThumb(i, 304)));
        el("span", { textContent: `${i + 1} / ${n}　${titleOf(i)}` }, peek);
      }
      const x = ((i + 0.5) / n) * W;
      peek.style.left = Math.min(W - 330, Math.max(10, x - 160)) + "px"; peek.style.display = "block";
      tick.style.left = x + "px"; tick.style.display = "block";
      bar.classList.add("hot");
    });
    zone.addEventListener("mouseleave", () => { peek.style.display = tick.style.display = "none"; bar.classList.remove("hot"); });
    zone.addEventListener("click", (e) => { e.stopPropagation(); show(idxAt(e)); });
  }

  // ---------- E: edit text in place, ⌘S writes back to this file ----------
  // We never serialise the live DOM (it carries animation state). Instead we
  // read the file, find each edited element's original source text, and swap
  // just that text. Everything else in the file stays byte-for-byte the same.
  const INLINE = new Set(["B", "I", "EM", "STRONG", "SPAN", "BR", "CODE", "A", "SMALL", "SUB", "SUP", "MARK", "U", "S"]);
  const orig = new Map(); // element -> innerHTML as loaded
  const dirty = new Set();
  const isTextLeaf = (e) => e.textContent.trim() && [...e.querySelectorAll("*")].every((c) => INLINE.has(c.tagName) && !("gen" in c.dataset));
  function editables() {
    const out = [];
    const walk = (e) => {
      for (const c of e.children) {
        if ("gen" in c.dataset || c.matches("aside.notes, svg, script, style, video, img, iframe, .leaflet-container")) continue;
        if (!INLINE.has(c.tagName) && isTextLeaf(c)) out.push(c);
        else walk(c);
      }
    };
    Deck.slides.forEach(walk);
    return out;
  }
  function markDirty(e) { dirty.add(e); e.classList?.add("dirty"); }
  function setEditing(on) {
    if (on === document.body.classList.contains("editing")) return;
    const was = authoring();
    document.body.classList.toggle("editing", on);
    if (on) setAnnotating(false);
    if (was !== authoring()) freezeFx(on);
    editables().forEach((e) => {
      if (on) {
        if (!orig.has(e)) orig.set(e, e.innerHTML);
        e.dataset.edit = ""; e.contentEditable = "plaintext-only";
        e.oninput = () => markDirty(e);
      } else {
        delete e.dataset.edit; e.removeAttribute("contenteditable"); e.oninput = null;
      }
    });
    $$("aside.notes").forEach((n) => { if (!orig.has(n)) orig.set(n, n.innerHTML); });
    renderNotes();
    toast(on ? "編輯模式：點文字直接改，⌘S 存回檔案，Esc 離開" : dirty.size ? `還有 ${dirty.size} 處沒存（⌘S）` : "離開編輯模式");
  }

  // file handle, remembered per page so ⌘S only asks once
  const idb = (mode, fn) => new Promise((res, rej) => {
    const r = indexedDB.open("slidejam", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("h");
    r.onsuccess = () => {
      try { const q = fn(r.result.transaction("h", mode).objectStore("h")); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }
      catch (err) { rej(err); }
    };
    r.onerror = () => rej(r.error);
  });
  const fileName = () => decodeURIComponent(location.pathname.split("/").pop() || "index.html");
  async function fileHandle() {
    let h = null;
    try { h = await idb("readonly", (s) => s.get(location.pathname)); } catch {}
    if (h && (await h.requestPermission({ mode: "readwrite" })) === "granted") return h;
    toast(`請選這份簡報的檔案：${fileName()}`, 5000);
    [h] = await showOpenFilePicker({ types: [{ description: "HTML", accept: { "text/html": [".html", ".htm"] } }] });
    if (h.name !== fileName()) { toast(`選到的是 ${h.name}，不是 ${fileName()}，沒有存`, 5000); throw new Error("wrong file"); }
    if ((await h.requestPermission({ mode: "readwrite" })) !== "granted") throw new Error("no permission");
    try { await idb("readwrite", (s) => s.put(h, location.pathname)); } catch {}
    return h;
  }

  // path of an element from <body>, counting only authored (non-generated) children
  function pathOf(e) {
    const p = [];
    for (; e && e !== document.body; e = e.parentElement) {
      const sib = [...e.parentElement.children].filter((c) => !("gen" in c.dataset));
      p.unshift(sib.indexOf(e));
    }
    return p;
  }
  const atPath = (doc, p) => p.reduce((e, k) => e?.children[k], doc.body);
  const escapeHTML = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  async function save() {
    // a deck on a website can be tried (edit, annotate, themes) but not saved back
    if (location.protocol !== "file:") return toast("這是網站上的簡報，改了只是試試看。\n下載整個資料夾、在自己電腦打開，⌘S 就會存回檔案。", 5000);
    if (!dirty.size && !themeDirty()) return toast("沒有要存的修改");
    if (!window.showOpenFilePicker) return toast("這個瀏覽器不能直接存檔，請用 Chrome。也可以按 A 把要改的地方標給 AI", 5000);
    let h;
    try { h = await fileHandle(); } catch { return; }
    let src = await (await h.getFile()).text();
    const doc = new DOMParser().parseFromString(src, "text/html");
    const ok = [], fail = [];
    for (const e of dirty) {
      const before = orig.get(e), tag = e.tagName.toLowerCase();
      const after = e.matches("aside.notes") ? "\n" + escapeHTML(e.textContent.trim()) + "\n" : e.innerHTML;
      // which occurrence is ours? count same-tag, same-content elements before it in the file
      const twin = atPath(doc, pathOf(e));
      const same = [...doc.getElementsByTagName(tag)].filter((x) => x.innerHTML === before);
      const k = same.indexOf(twin);
      const needle = `>${before}</${tag}>`;
      const hits = [];
      for (let j = src.indexOf(needle); j >= 0; j = src.indexOf(needle, j + 1)) hits.push(j);
      if (k < 0 || hits.length !== same.length) { fail.push(e); continue; }
      src = src.slice(0, hits[k] + 1) + after + src.slice(hits[k] + 1 + before.length);
      doc.body && twin && (twin.innerHTML = after);
      orig.set(e, after); ok.push(e);
    }
    // a theme picked with T: swap the theme file named in the <link>, nothing else
    let themeSaved = false, themeNote = "";
    if (themeDirty()) {
      const now = themeLink.getAttribute("href"), needle = `href="${themeFrom}"`;
      const n = src.split(needle).length - 1;
      if ("gen" in themeLink.dataset) themeNote = "\n主題沒存：這份簡報的 <head> 裡沒有主題那一行，請先加上 <link rel=\"stylesheet\" href=\"deck/themes/default.css\">";
      else if (n !== 1) themeNote = "\n主題沒存：檔案裡找不到唯一的主題那一行";
      else { src = src.replace(needle, `href="${now}"`); themeFrom = now; themeSaved = true; }
    }
    if (ok.length || themeSaved) {
      const w = await h.createWritable(); await w.write(src); await w.close();
    }
    ok.forEach((e) => { dirty.delete(e); e.classList?.remove("dirty"); });
    if (themeSaved && !fail.length && !themeNote) return toast(`已存到 ${h.name}：${ok.length ? `${ok.length} 處文字、` : ""}主題 ${themeName()}`);
    if (fail.length) {
      const list = fail.map((e) => `・第 ${Deck.slides.findIndex((s) => s.contains(e)) + 1} 頁：「${e.textContent.trim().slice(0, 20)}」`).join("\n");
      toast(`存了 ${ok.length} 處；${fail.length} 處找不到原文，沒存（紅框）：\n${list}\n可以按 A 標起來交給 AI 改`, 8000);
    } else toast(`已存 ${ok.length} 處到 ${h.name}` + themeNote, themeNote ? 7000 : 2600);
  }

  // ---------- T: themes — preview any theme here; ⌘S writes the choice into the file ----------
  // Swatches: paper, ink, accent, second accent, dark block (from deck/themes/*.css).
  const THEMES = {
    default: { zh: "石油藍", c: ["#f6f7f8", "#111a1f", "#0d5f74", "#b45309", "#0f1a1d"] },
    warm: { zh: "暖紙張", c: ["#faf6f0", "#2a1f17", "#9a4a1f", "#3f6b4a", "#2a1f17"] },
    night: { zh: "深色", c: ["#0e1417", "#eef4f6", "#4fd1c5", "#f4b860", "#071012"] },
    mono: { zh: "黑白", c: ["#ffffff", "#000000", "#000000", "#d4380d", "#000000"] },
  };
  let themeLink = null, themeFrom = null; // the <link> and its href as the file has it
  function themeEl() {
    if (!themeLink) {
      themeLink = $('link[href*="themes/"]');
      if (!themeLink) { // no theme line yet: add one for previewing (it can't be saved)
        const base = $('link[href$="deck.css"]');
        themeLink = el("link", { rel: "stylesheet" });
        themeLink.setAttribute("href", base.getAttribute("href").replace(/deck\.css$/, "themes/default.css"));
        base.after(themeLink);
      }
      themeFrom = themeLink.getAttribute("href");
    }
    return themeLink;
  }
  const themeName = () => (themeEl().getAttribute("href").match(/themes\/([\w-]+)\.css/) || [])[1] || "default";
  const themeDirty = () => !!themeLink && themeLink.getAttribute("href") !== themeFrom;
  function setTheme(name) {
    const l = themeEl();
    l.setAttribute("href", l.getAttribute("href").replace(/themes\/[\w-]+\.css/, `themes/${name}.css`));
    if ($("#themes")?.classList.contains("show")) renderThemes(); // may run before boot
    Deck.onTheme?.(name);
  }
  function renderThemes() {
    const box = $("#themes"), cur = themeName();
    box.innerHTML = "";
    el("b", { textContent: "主題" }, box);
    el("small", { className: "keys-hint", textContent: themeDirty() ? "按 ⌘S 把這個主題存進檔案" : "選了只是預覽，不會改到檔案" }, box);
    const grid = el("div", { className: "th-grid" }, box);
    Object.entries(THEMES).forEach(([name, t]) => {
      const [paper, ink, accent, warn, dark] = t.c;
      const sw = el("button", { className: "th" + (name === cur ? " on" : "") }, grid);
      sw.innerHTML = `<span class="th-card" style="background:${paper};color:${ink}"><b>Aa 標題</b><s style="background:${accent}"></s><s style="background:${warn};width:40%"></s><u style="background:${dark}"></u></span><span>${name} <small>${t.zh}</small></span>`;
      sw.onclick = (e) => { e.stopPropagation(); setTheme(name); };
    });
  }
  function toggleThemes(force) {
    const box = $("#themes"), on = force ?? !box.classList.contains("show");
    if (on) renderThemes();
    box.classList.toggle("show", on);
  }
  Object.assign(Deck, { setTheme, themeName, themes: Object.keys(THEMES) });

  // ---------- A: annotate — click anything, say what you want there ----------
  const annoKey = "slidejam-anno:" + location.pathname;
  let annos = store.get(annoKey) || [];
  let hoverEl = null, pendingAnno = null, liveBand = null;
  function describe(e) {
    const tag = e.tagName.toLowerCase();
    const cls = [...e.classList].filter((c) => !/^(active|on|off|dirty|anno-hover)$/.test(c)).map((c) => "." + c).join("");
    const text = (e.getAttribute("alt") || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 24);
    const src = e.getAttribute("src");
    return `${tag}${cls}` + (text ? `「${text}」` : src ? `（${src}）` : "");
  }
  function selectorOf(e) {
    const parts = [];
    for (; e && !e.classList.contains("slide"); e = e.parentElement) {
      const sib = [...e.parentElement.children].filter((c) => c.tagName === e.tagName && !("gen" in c.dataset));
      const cls = [...e.classList].filter((c) => !/^(active|on|off|dirty|anno-hover)$/.test(c))[0];
      parts.unshift(e.tagName.toLowerCase() + (cls ? "." + cls : "") + (sib.length > 1 ? `:nth-of-type(${sib.indexOf(e) + 1})` : ""));
    }
    const si = Deck.slides.indexOf(e);
    return [`.slide:nth-of-type(${si + 1})`, ...parts].join(" > ");
  }
  function cancelAnno() {
    pendingAnno = null;
    liveBand?.remove(); liveBand = null;
    const box = $("#anno-input");
    if (box) box.style.display = "none";
  }
  function setAnnotating(on) {
    if (on === document.body.classList.contains("annotating")) return;
    const was = authoring();
    document.body.classList.toggle("annotating", on);
    if (on) setEditing(false);
    if (was !== authoring()) freezeFx(on);
    hoverEl?.classList.remove("anno-hover");
    if (!on) cancelAnno();
    renderPanel(); renderPins();
    if (on) toast("標註模式：點一下標位置，拖拉可以框範圍，寫下想要怎樣。右上角可以複製給 AI。A 或 Esc 離開");
  }
  // ---- boxes: eight handles resize, dragging inside moves. The box being written about and
  // the saved ones both work this way; the numbers in the note follow.
  const pct = (v) => Math.round(v * 10) / 10;
  // a stage box as "x y w h" in % of the element it was drawn on (what data-rects wants)
  function boxPct(t, [x, y, w, h]) {
    const r = t.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const rx = (v) => ((s.left + (v / W) * s.width - r.left) / r.width) * 100, ry = (v) => ((s.top + (v / H) * s.height - r.top) / r.height) * 100;
    return `${pct(rx(x))} ${pct(ry(y))} ${pct(rx(x + w) - rx(x))} ${pct(ry(y + h) - ry(y))}`;
  }
  const placeBox = (b, [x, y, w, h]) => Object.assign(b.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
  function makeEditable(b, get, set, done) {
    const drag = (ev, h) => {
      ev.preventDefault(); ev.stopPropagation();
      const [x0, y0, w0, h0] = get(), [px, py] = stagePoint(ev);
      const move = (e2) => {
        const [qx, qy] = stagePoint(e2), dx = qx - px, dy = qy - py;
        if (!h) return set([x0 + dx, y0 + dy, w0, h0]);
        let l = x0, t = y0, r = x0 + w0, btm = y0 + h0;
        if (h.includes("w")) l += dx; if (h.includes("e")) r += dx;
        if (h.includes("n")) t += dy; if (h.includes("s")) btm += dy;
        set([Math.min(l, r), Math.min(t, btm), Math.max(8, Math.abs(r - l)), Math.max(8, Math.abs(btm - t))]);
      };
      const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); done?.(); };
      addEventListener("pointermove", move); addEventListener("pointerup", up);
    };
    ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((h) => {
      const k = el("i", { className: "anno-h" }, b);
      k.dataset.h = h;
      k.addEventListener("pointerdown", (ev) => drag(ev, h));
    });
    b.addEventListener("pointerdown", (ev) => { if (ev.target === b) drag(ev, null); });
  }
  const targetOf = (a) => { try { return document.querySelector(a.selector) || Deck.slides[a.slide]; } catch { return Deck.slides[a.slide]; } };
  function renderPins() {
    $$(".anno-pin, .anno-band.done", stage).forEach((p) => p.remove());
    if (!document.body.classList.contains("annotating")) return;
    annos.forEach((a, n) => {
      if (a.slide !== Deck.cur) return;
      const b = a.stageBox && el("div", { className: "anno-band done" }, stage);
      const p = el("div", { className: "anno-pin", textContent: n + 1 }, stage);
      const place = () => { p.style.left = a.x + "px"; p.style.top = a.y + "px"; if (b) placeBox(b, a.stageBox); };
      place();
      if (b) makeEditable(b, () => a.stageBox, (box) => { a.stageBox = box; a.box = boxPct(targetOf(a), box); [a.x, a.y] = box; place(); }, () => { store.set(annoKey, annos); renderPanel(); });
    });
  }
  function renderPanel() {
    const p = $("#anno-panel");
    p.innerHTML = "";
    el("b", { textContent: `標註 ${annos.length} 則` }, p);
    const ol = el("ol", {}, p);
    annos.forEach((a, n) => {
      const li = el("li", {}, ol);
      li.append(`第 ${a.slide + 1} 頁：${a.note} `);
      const x = el("button", { className: "x", textContent: "✕", title: "刪掉" }, li);
      x.onclick = (e) => { e.stopPropagation(); annos.splice(n, 1); store.set(annoKey, annos); renderPanel(); renderPins(); };
      el("small", { textContent: a.what }, li);
    });
    const copy = el("button", { textContent: "複製給 AI" }, p);
    copy.onclick = async (e) => {
      e.stopPropagation();
      try { await navigator.clipboard.writeText(annoText()); toast("已複製，貼給 AI 就好"); } catch { toast("複製失敗，請手動選取"); }
    };
    const clear = el("button", { className: "ghost", textContent: "全部清掉" }, p);
    clear.onclick = (e) => { e.stopPropagation(); annos = []; store.set(annoKey, annos); renderPanel(); renderPins(); };
  }
  function annoText() {
    const head = `簡報：${document.title}\n檔案：${decodeURIComponent(location.pathname)}\n標註 ${annos.length} 則（座標是 1600×900 畫面上的位置）\n`;
    return head + annos.map((a, n) => [
      `\n${n + 1}. 第 ${a.slide + 1} 頁〈${a.title}〉`,
      `   元素：${a.what}`,
      `   選擇器：${a.selector}`,
      a.box ? `   框住：元素內 ${a.box}（x y 寬 高，%；可直接當 data-rects）` : `   點在：(${Math.round(a.x)}, ${Math.round(a.y)})，元素內 ${a.rel}`,
      `   想要：${a.note}`,
    ].join("\n")).join("\n");
  }
  // what a click means: skip anything an effect generated and land on authored markup
  const pick = (t) => {
    while (t && t.dataset && "gen" in t.dataset) t = t.parentElement;
    return t?.closest?.(".slide *") || null;
  };
  const stagePoint = (ev) => {
    const r = stage.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H];
  };
  function setupAnnotate() {
    const box = $("#anno-input"), ta = $("textarea", box);
    stage.addEventListener("mousemove", (ev) => {
      if (!document.body.classList.contains("annotating") || pendingAnno) return;
      const t = pick(ev.target);
      if (t === hoverEl) return;
      hoverEl?.classList.remove("anno-hover"); hoverEl = t; t?.classList.add("anno-hover");
    });
    // click marks a point; drag draws a box (handy for spot / zoom / hotspots positions)
    let down = null, band = null, target = null;
    // a drawn box stays dashed until the note is sent, and can be resized or moved meanwhile
    const setBox = (b) => {
      pendingAnno.stageBox = b; pendingAnno.box = boxPct(target, b); [pendingAnno.x, pendingAnno.y] = b;
      placeBox(liveBand, b);
      $(".what", box).textContent = `第 ${Deck.cur + 1} 頁 · ${pendingAnno.what}\n框：${pendingAnno.box}（%）`;
    };
    const keepBand = (b) => {
      liveBand = b; b.classList.add("live");
      makeEditable(b, () => pendingAnno.stageBox, setBox, () => ta.focus());
    };
    // pointer events, not mouse events: a map (Leaflet) cancels pointerdown, and then the
    // browser never sends the mouse events
    stage.addEventListener("pointerdown", (ev) => {
      if (!document.body.classList.contains("annotating") || pendingAnno || ev.button !== 0 || ev.target.closest?.(".anno-band")) return;
      ev.preventDefault();
      down = { ev, t: pick(ev.target) || Deck.slides[Deck.cur], p: stagePoint(ev) };
    }, true);
    addEventListener("pointermove", (ev) => {
      if (!down) return;
      const [x, y] = stagePoint(ev), [x0, y0] = down.p;
      if (!band && Math.hypot(x - x0, y - y0) < 6) return;
      band ??= el("div", { className: "anno-band" }, stage);
      Object.assign(band.style, { left: Math.min(x, x0) + "px", top: Math.min(y, y0) + "px", width: Math.abs(x - x0) + "px", height: Math.abs(y - y0) + "px" });
    });
    addEventListener("pointerup", (ev) => {
      if (!down) return;
      const t = (target = down.t), r = t.getBoundingClientRect(), [x0, y0] = down.p, [x1, y1] = stagePoint(ev), e0 = down.ev;
      const rx = (cx) => ((cx - r.left) / r.width) * 100, ry = (cy) => ((cy - r.top) / r.height) * 100;
      pendingAnno = { slide: Deck.cur, title: titleOf(Deck.cur), what: describe(t), selector: selectorOf(t), x: x0, y: y0, rel: `(${Math.round(rx(e0.clientX))}%, ${Math.round(ry(e0.clientY))}%)` };
      down = null;
      $(".what", box).textContent = `第 ${Deck.cur + 1} 頁 · ${pendingAnno.what}`;
      if (band) {
        keepBand(band); band = null;
        setBox([Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)]);
      }
      box.style.left = Math.min(innerWidth - 400, ev.clientX + 12) + "px";
      box.style.top = Math.min(innerHeight - 160, ev.clientY + 12) + "px";
      box.style.display = "block"; ta.value = ""; ta.focus();
    });
    stage.addEventListener("click", (ev) => { if (document.body.classList.contains("annotating")) ev.stopPropagation(); }, true);
    ta.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        if (ta.value.trim()) { annos.push({ ...pendingAnno, note: ta.value.trim() }); store.set(annoKey, annos); }
        cancelAnno(); renderPanel(); renderPins();
      } else if (ev.key === "Escape") cancelAnno();
    });
  }

  // #12 is the 12th slide; #bento is the slide with id="bento". ?slide=bento does the same
  // without a fragment, so a deck in an iframe doesn't scroll the page around it.
  function hashIndex() {
    const h = decodeURIComponent(location.hash.slice(1)) || new URLSearchParams(location.search).get("slide") || "";
    if (/^\d+$/.test(h)) return Math.max(0, +h - 1);
    const i = Deck.slides.findIndex((s) => s.id === h);
    return i >= 0 ? i : null;
  }

  // ---------- effects on demand ----------
  // Every name in a data-fx attribute becomes fx/<name>.js. Plain <script> tags work
  // from file://, so decks still open by double-click with no build step.
  const loadScript = (src) => new Promise((res) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res;
    s.onerror = () => { console.warn(`[slidejam] could not load ${src}`); res(); };
    document.head.appendChild(s);
  });
  async function loadEffects() {
    const names = new Set();
    $$("[data-fx]").forEach((e) => e.dataset.fx.split(/\s+/).forEach((n) => n && !Deck.fx[n] && names.add(n)));
    if (!names.size) return;
    if (!Deck.lib) await loadScript(FX_BASE + "_lib.js");
    await Promise.all([...names].map((n) => loadScript(FX_BASE + n + ".js")));
  }
  Deck.loadEffects = loadEffects;

  // ---------- keys ----------
  // Actions and their keys. Letter keys can be changed from the ? panel (handy when another
  // tool already grabs one); the choice is remembered in this browser for every deck.
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  // In full screen the browser takes Esc for itself, so an open note box or overview could
  // only be closed by leaving full screen. Keyboard Lock (Chrome, Edge) hands Esc to the deck
  // instead: Esc closes what is open first, and leaves full screen when nothing is.
  // (Inside an iframe the lock is refused; the page around it has to take it.)
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) navigator.keyboard?.lock?.(["Escape"]).catch(() => {});
    else navigator.keyboard?.unlock?.();
  });
  const ACTIONS = [
    { id: "next", fixed: "→ / 空白", label: "下一步、下一頁", run: () => next() },
    { id: "prev", fixed: "←", label: "上一頁", run: () => show(Deck.cur - 1) },
    { id: "overview", key: "g", label: "總覽：點縮圖跳頁，也能「播放全部」", run: () => toggleOverview() },
    { id: "presenter", key: "p", label: "講者視窗：講稿只在你的螢幕", run: () => openPresenter() },
    { id: "notes", key: "n", label: "講稿（在同一個視窗）", run: () => notes.classList.toggle("show") },
    { id: "replay", key: "r", label: "重播這一頁", run: () => show(Deck.cur) },
    { id: "fullscreen", key: "f", label: "全螢幕", run: fullscreen },
    { id: "edit", key: "e", label: "直接改字，⌘S 存回檔案", run: () => setEditing(!document.body.classList.contains("editing")) },
    { id: "annotate", key: "a", label: "標註給 AI：點一下或拖拉框選", run: () => setAnnotating(!document.body.classList.contains("annotating")) },
    { id: "theme", key: "t", label: "換主題（預覽；⌘S 存進檔案）", run: () => toggleThemes() },
    { id: "help", key: "?", label: "這份說明", run: () => toggleKeys() },
  ];
  const keyStore = "slidejam-keys";
  const customKeys = () => store.get(keyStore) || {};
  const keyOf = (a) => customKeys()[a.id] ?? a.key;
  let rebinding = null;
  function renderKeys() {
    const box = $("#keys");
    box.innerHTML = "";
    const head = el("div", { className: "keys-head" }, box);
    el("b", { textContent: "快捷鍵" }, head);
    if (Object.keys(customKeys()).length) {
      const reset = el("button", { className: "keys-reset", textContent: "↺", title: "恢復預設按鍵" }, head);
      reset.onclick = (ev) => { ev.stopPropagation(); store.set(keyStore, {}); renderKeys(); toast("按鍵恢復預設"); };
    }
    el("small", { className: "keys-hint", textContent: "點一列直接執行・點右邊的鍵可以換掉" }, box);
    ACTIONS.forEach((a) => {
      const row = el("div", { className: "key-row" }, box);
      el("span", { textContent: a.label }, row);
      if (a.fixed) el("kbd", { textContent: a.fixed }, row);
      else {
        const waiting = rebinding === a.id;
        const cap = el("button", { className: "key-cap" + (waiting ? " wait" : ""), textContent: waiting ? "按新的鍵…" : keyOf(a).toUpperCase(), title: "換一個鍵" }, row);
        cap.onclick = (ev) => { ev.stopPropagation(); rebinding = a.id; renderKeys(); };
      }
      row.onclick = () => { if (a.id !== "help") toggleKeys(false); a.run(); };
    });
  }
  // while a key cap is waiting, the next key press becomes its new key; a key does one
  // thing only, so if another action had it the two swap
  function rebind(e) {
    if (!rebinding) return false;
    e.preventDefault();
    if (e.key === "Escape") { rebinding = null; renderKeys(); return true; }
    if (e.key.length !== 1 || e.key === " " || e.metaKey || e.ctrlKey) { toast("請按一個字母、數字或符號鍵"); return true; }
    const k = e.key.toLowerCase(), me = ACTIONS.find((a) => a.id === rebinding);
    const map = customKeys(), owner = ACTIONS.find((a) => !a.fixed && a !== me && keyOf(a) === k);
    if (owner) map[owner.id] = keyOf(me);
    map[me.id] = k;
    store.set(keyStore, map);
    toast(owner ? `「${me.label}」改用 ${k.toUpperCase()}；「${owner.label}」換成 ${map[owner.id].toUpperCase()}` : `「${me.label}」改用 ${k.toUpperCase()}`, 4000);
    rebinding = null;
    renderKeys();
    return true;
  }
  function toggleKeys(force) {
    const box = $("#keys"), on = force ?? !box.classList.contains("show");
    if (on) renderKeys(); else rebinding = null;
    box.classList.toggle("show", on);
  }
  function onKey(e) {
    if (rebind(e)) return;
    // an unsent annotation note goes away as soon as you do anything else
    if (pendingAnno && !e.target.closest?.("#anno-input")) { cancelAnno(); if (e.key === "Escape") return; }
    const typing = e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName);
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); return; }
    if (e.key === "Escape") {
      if (typing) return e.target.blur();
      if ($("#keys").classList.contains("show")) return toggleKeys(false);
      if ($("#themes").classList.contains("show")) return toggleThemes(false);
      if (walled) { toggleWall(false); return toggleOverview(true, true); }
      if (document.body.classList.contains("editing")) return setEditing(false);
      if (document.body.classList.contains("annotating")) return setAnnotating(false);
      if ($("#overview").classList.contains("show")) return toggleOverview(false);
      if (notes.classList.contains("show")) return notes.classList.remove("show");
      if (document.fullscreenElement) return document.exitFullscreen();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); show(Deck.cur - 1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(Deck.slides.length - 1);
    else {
      const k = e.key.toLowerCase(), a = ACTIONS.find((x) => !x.fixed && keyOf(x) === k);
      if (a) { e.preventDefault(); a.run(); }
    }
  }

  // ---------- P: presenter window ----------
  // A second window with the notes, this slide, the next one and a clock. Share or project
  // the main window; this one stays on your own screen. Either window can drive the deck.
  let presenter = null, clock = 0, clockStart = 0;
  // full screen here, or on the page around an embedded deck (same site only)
  const inFullscreen = () => { try { return !!(document.fullscreenElement || top.document.fullscreenElement); } catch { return !!document.fullscreenElement; } };
  function openPresenter() {
    // the new window opens behind a full-screen one and nothing seems to happen, so say where it went
    if (inFullscreen()) toast("講者視窗開在全螢幕後面了：按 Esc 離開全螢幕就看得到。下次可以先按 P，再進全螢幕", 6000);
    if (presenter && !presenter.closed) return presenter.focus();
    presenter = open("", "slidejam-presenter", "width=1180,height=760");
    if (!presenter) return toast("瀏覽器擋住了新視窗：請允許這個頁面開彈出視窗", 5000);
    const styles = $$('link[rel="stylesheet"], style').map((n) => (n.tagName === "LINK" ? `<link rel="stylesheet" href="${n.href}">` : n.outerHTML)).join("");
    const d = presenter.document;
    d.open();
    d.write(`<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><base href="${location.href}">
<title>講者視窗 · ${document.title}</title>${styles}</head><body class="presenter">
<div class="p-top"><b id="p-page"></b><span id="p-clock">00:00</span><button id="p-reset">重新計時</button><span class="p-hint">← → 翻頁・這個視窗只有你看得到</span></div>
<div class="p-main"><div class="p-notes" id="p-notes"></div>
<div class="p-side"><small>現在</small><div id="p-cur"></div><small>下一頁</small><div id="p-next"></div>
<div class="p-nav"><button id="p-prev">← 上一頁</button><button id="p-fwd">下一步 →</button></div></div></div></body></html>`);
    d.close();
    d.addEventListener("keydown", onKey);
    d.getElementById("p-prev").onclick = () => show(Deck.cur - 1);
    d.getElementById("p-fwd").onclick = () => next();
    d.getElementById("p-reset").onclick = () => (clockStart = Date.now());
    clockStart = Date.now();
    clearInterval(clock);
    clock = setInterval(() => {
      if (presenter.closed) return clearInterval(clock);
      const s = Math.floor((Date.now() - clockStart) / 1000);
      d.getElementById("p-clock").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
    renderPresenter();
  }
  function renderPresenter() {
    if (!presenter || presenter.closed) return;
    const d = presenter.document, n = Deck.slides.length, i = Deck.cur;
    const note = notesOf(Deck.slides[i]);
    d.getElementById("p-page").textContent = `${i + 1} / ${n}　${titleOf(i)}`;
    d.getElementById("p-notes").textContent = note ? note.textContent.trim() : "（這一頁沒有講稿）";
    const put = (id, k) => { const box = d.getElementById(id); box.innerHTML = ""; if (k < n) box.appendChild(makeThumb(k, 360)); else box.textContent = "（最後一頁）"; };
    put("p-cur", i); put("p-next", i + 1);
  }

  // ---------- W: wall — every slide at once, all playing ----------
  let walled = false;
  function toggleWall(force) {
    const on = force ?? !walled;
    if (on === walled) return;
    walled = on;
    document.body.classList.toggle("wall", on);
    if (on) {
      leave(Deck.cur);
      const wall = el("div", { id: "wall" }, document.body);
      const top = el("div", { className: "ov-top" }, wall);
      const back = el("button", { className: "ov-back", textContent: "←", title: "回到總覽（Esc）" }, top);
      back.onclick = () => { toggleWall(false); toggleOverview(true, true); };
      el("b", { textContent: "總覽・播放中" }, top);
      const stopBtn = el("button", { textContent: "■ 停止播放" }, top);
      stopBtn.onclick = () => { toggleWall(false); toggleOverview(true, true); };
      el("span", { textContent: "滑過去重播・點一下打開那一頁" }, top);
      const grid = el("div", { className: "wall-grid" }, wall);
      Deck.slides.forEach((s, i) => {
        const cell = el("div", { className: "wall-cell" + (i === Deck.cur ? " cur" : "") }, grid);
        el("div", { className: "wall-box" }, cell).appendChild(s);
        el("span", { textContent: `${i + 1}　${titleOf(i)}` }, cell);
        cell.onclick = () => { toggleWall(false); show(i); };
        cell.onmouseenter = () => { eachFx(s, (d, e) => d.leave?.(e)); eachFx(s, (d, e) => d.enter?.(e, s)); };
      });
      fitWall();
      wall.scrollTop = ovScroll;
      Deck.slides.forEach((s) => {
        s.classList.add("active");
        $$("video", s).forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
        eachFx(s, (d, e) => d.enter?.(e, s));
      });
    } else {
      const anchor = $("#hoverzone");
      Deck.slides.forEach((s) => {
        eachFx(s, (d, e) => d.leave?.(e));
        $$("video", s).forEach((v) => v.pause());
        s.classList.remove("active");
        s.style.transform = "";
        stage.insertBefore(s, anchor);
      });
      ovScroll = $("#wall").scrollTop;
      $("#wall").remove();
      show(Deck.cur);
    }
  }
  function fitWall() {
    if (walled) $$(".wall-box").forEach((b) => (b.firstChild.style.transform = `scale(${b.clientWidth / W})`));
  }

  // ---------- boot ----------
  async function boot() {
    stage = $("#stage");
    Deck.slides = $$(".slide", stage).filter((s) => s.parentElement === stage);
    const chrome = (tag, id, parent) => el(tag, { id }, parent);
    ["hoverzone", "bar", "page", "peek", "peek-tick"].forEach((id) => chrome("div", id, stage));
    notes = chrome("div", "notes", document.body);
    el("div", { className: "grid" }, chrome("div", "overview", document.body));
    chrome("div", "toast", document.body);
    chrome("div", "modebadge", document.body).textContent = "";
    const ai = chrome("div", "anno-input", document.body);
    el("div", { className: "what" }, ai); el("textarea", { placeholder: "想要怎樣？例如：這張圖慢慢放大到右上角" }, ai);
    el("div", { className: "hint", textContent: "Enter 送出・Shift+Enter 換行・Esc 取消" }, ai);
    chrome("div", "anno-panel", document.body);
    const help = chrome("button", "help", document.body);
    help.textContent = "?"; help.title = "快捷鍵";
    help.onclick = () => toggleKeys();
    chrome("div", "keys", document.body);
    chrome("div", "themes", document.body);
    addEventListener("click", (e) => {
      // a click outside the ? panel only closes it; it doesn't also turn the page
      if ($("#keys").classList.contains("show") && !e.target.closest("#keys, #help")) { e.stopPropagation(); toggleKeys(false); }
      if ($("#themes").classList.contains("show") && !e.target.closest("#themes, #keys")) { e.stopPropagation(); toggleThemes(false); }
    }, true);
    $("#page").title = "總覽（G）";
    $("#page").addEventListener("click", (e) => { e.stopPropagation(); toggleOverview(true); });
    const badge = () => ($("#modebadge").textContent = document.body.classList.contains("editing") ? "編輯 · ⌘S 存檔" : "標註");
    new MutationObserver(badge).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setupPeek(); setupAnnotate();
    addEventListener("resize", () => { fit(); fitWall(); }); fit();

    // ?embed: a deck shown inside another page — no chrome, no keys, plays by itself
    const q = new URLSearchParams(location.search);
    const embed = q.has("embed");
    if (embed) {
      document.body.classList.add("embed");
      // ?embed&tour=6 walks through the whole deck by itself (a step every 6 s, then starts
      // over); otherwise ?embed&loop=8 just replays the one slide
      if (q.has("tour")) {
        const every = +(q.get("tour") || 6) * 1000;
        setInterval(() => {
          if (document.hidden) return;
          Deck.cur === Deck.slides.length - 1 ? show(0) : next();
        }, every);
      } else {
        const every = +(q.get("loop") || 9) * 1000;
        setInterval(() => !document.hidden && show(Deck.cur), every);
      }
    }
    if (!embed) {
      addEventListener("keydown", onKey);
      stage.addEventListener("click", (e) => {
        if (document.body.classList.contains("editing") || document.body.classList.contains("annotating")) return;
        if (e.target.closest("a, button, input, select, label, iframe, .leaflet-container")) return;
        next();
      });
      addEventListener("hashchange", () => { const i = hashIndex(); if (i != null && i !== Deck.cur) show(i); });
      addEventListener("beforeunload", (e) => { if (dirty.size) e.preventDefault(); });
    }

    await loadEffects();
    Deck.slides.forEach((s) => eachFx(s, (d, e) => d.setup?.(e)));
    Deck.cur = hashIndex() ?? 0;
    show(Deck.cur);
    if (q.has("wall")) toggleWall(true);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
