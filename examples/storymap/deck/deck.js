// slidejam core: a 1600×900 stage, slides, keyboard nav, overview, notes,
// plus two authoring modes — E edits text in place and writes it back to this
// file, A collects "do X here" notes you can paste to an AI.
// Effects live in fx.js and register themselves through Deck.fx.register().
(() => {
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

  let ovBuilt = false;
  function toggleOverview(force) {
    const ov = $("#overview");
    const on = force ?? !ov.classList.contains("show");
    if (on && !ovBuilt) {
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
      $(".ov-item.cur", ov)?.scrollIntoView({ block: "center" });
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
    if (!dirty.size) return toast("沒有要存的修改");
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
    if (ok.length) {
      const w = await h.createWritable(); await w.write(src); await w.close();
    }
    ok.forEach((e) => { dirty.delete(e); e.classList?.remove("dirty"); });
    if (fail.length) {
      const list = fail.map((e) => `・第 ${Deck.slides.findIndex((s) => s.contains(e)) + 1} 頁：「${e.textContent.trim().slice(0, 20)}」`).join("\n");
      toast(`存了 ${ok.length} 處；${fail.length} 處找不到原文，沒存（紅框）：\n${list}\n可以按 A 標起來交給 AI 改`, 8000);
    } else toast(`已存 ${ok.length} 處到 ${h.name}`);
  }

  // ---------- A: annotate — click anything, say what you want there ----------
  const annoKey = "slidejam-anno:" + location.pathname;
  let annos = store.get(annoKey) || [];
  let hoverEl = null, pendingAnno = null;
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
  function setAnnotating(on) {
    if (on === document.body.classList.contains("annotating")) return;
    const was = authoring();
    document.body.classList.toggle("annotating", on);
    if (on) setEditing(false);
    if (was !== authoring()) freezeFx(on);
    hoverEl?.classList.remove("anno-hover");
    renderPanel(); renderPins();
    if (on) toast("標註模式：點一下標位置，拖拉可以框範圍，寫下想要怎樣。右上角可以複製給 AI。A 或 Esc 離開");
  }
  function renderPins() {
    $$(".anno-pin, .anno-band.done", stage).forEach((p) => p.remove());
    if (!document.body.classList.contains("annotating")) return;
    annos.forEach((a, n) => {
      if (a.slide !== Deck.cur) return;
      if (a.stageBox) {
        const b = el("div", { className: "anno-band done" }, stage);
        const [x, y, w, h] = a.stageBox;
        Object.assign(b.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      }
      const p = el("div", { className: "anno-pin", textContent: n + 1 }, stage);
      p.style.left = a.x + "px"; p.style.top = a.y + "px";
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
    let down = null, band = null;
    const pct = (v) => Math.round(v * 10) / 10;
    stage.addEventListener("mousedown", (ev) => {
      if (!document.body.classList.contains("annotating") || pendingAnno || ev.button !== 0) return;
      ev.preventDefault();
      down = { ev, t: pick(ev.target) || Deck.slides[Deck.cur], p: stagePoint(ev) };
    }, true);
    addEventListener("mousemove", (ev) => {
      if (!down) return;
      const [x, y] = stagePoint(ev), [x0, y0] = down.p;
      if (!band && Math.hypot(x - x0, y - y0) < 6) return;
      band ??= el("div", { className: "anno-band" }, stage);
      Object.assign(band.style, { left: Math.min(x, x0) + "px", top: Math.min(y, y0) + "px", width: Math.abs(x - x0) + "px", height: Math.abs(y - y0) + "px" });
    });
    addEventListener("mouseup", (ev) => {
      if (!down) return;
      const t = down.t, r = t.getBoundingClientRect(), [x0, y0] = down.p, [x1, y1] = stagePoint(ev), e0 = down.ev;
      const rx = (cx) => ((cx - r.left) / r.width) * 100, ry = (cy) => ((cy - r.top) / r.height) * 100;
      pendingAnno = { slide: Deck.cur, title: titleOf(Deck.cur), what: describe(t), selector: selectorOf(t), x: x0, y: y0, rel: `(${Math.round(rx(e0.clientX))}%, ${Math.round(ry(e0.clientY))}%)` };
      if (band) {
        const bx = Math.min(rx(e0.clientX), rx(ev.clientX)), by = Math.min(ry(e0.clientY), ry(ev.clientY));
        pendingAnno.box = `${pct(bx)} ${pct(by)} ${pct(Math.abs(rx(ev.clientX) - rx(e0.clientX)))} ${pct(Math.abs(ry(ev.clientY) - ry(e0.clientY)))}`;
        pendingAnno.stageBox = [Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)];
        band.remove(); band = null;
      }
      down = null;
      $(".what", box).textContent = `第 ${Deck.cur + 1} 頁 · ${pendingAnno.what}` + (pendingAnno.box ? `\n框：${pendingAnno.box}（%）` : "");
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
        box.style.display = "none"; pendingAnno = null; renderPanel(); renderPins();
      } else if (ev.key === "Escape") { box.style.display = "none"; pendingAnno = null; }
    });
  }

  // #12 is the 12th slide; #bento is the slide with id="bento"
  function hashIndex() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (/^\d+$/.test(h)) return Math.max(0, +h - 1);
    const i = Deck.slides.findIndex((s) => s.id === h);
    return i >= 0 ? i : null;
  }

  // ---------- boot ----------
  function boot() {
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
    $("#page").title = "總覽（G）";
    $("#page").addEventListener("click", (e) => { e.stopPropagation(); toggleOverview(true); });
    const badge = () => ($("#modebadge").textContent = document.body.classList.contains("editing") ? "編輯 · ⌘S 存檔" : "標註");
    new MutationObserver(badge).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    setupPeek(); setupAnnotate();
    addEventListener("resize", fit); fit();

    // ?embed: a deck shown inside another page — no chrome, no keys, replays by itself
    // (?embed&loop=8 replays every 8 s; default 9)
    const q = new URLSearchParams(location.search);
    const embed = q.has("embed");
    if (embed) {
      document.body.classList.add("embed");
      const every = +(q.get("loop") || 9) * 1000;
      setInterval(() => !document.hidden && show(Deck.cur), every);
    }
    if (!embed) {
      addEventListener("keydown", (e) => {
        const typing = e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName);
        if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); return; }
        if (e.key === "Escape") {
          if (typing) return e.target.blur();
          if (document.body.classList.contains("editing")) return setEditing(false);
          if (document.body.classList.contains("annotating")) return setAnnotating(false);
          return toggleOverview(false);
        }
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
        else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); show(Deck.cur - 1); }
        else if (k === "g" || k === "o") toggleOverview();
        else if (k === "r") show(Deck.cur);
        else if (e.key === "Home") show(0);
        else if (e.key === "End") show(Deck.slides.length - 1);
        else if (k === "n") notes.classList.toggle("show");
        else if (k === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
        else if (k === "e") setEditing(!document.body.classList.contains("editing"));
        else if (k === "a") setAnnotating(!document.body.classList.contains("annotating"));
      });
      stage.addEventListener("click", (e) => {
        if (document.body.classList.contains("editing") || document.body.classList.contains("annotating")) return;
        if (e.target.closest("a, button, iframe, .leaflet-container")) return;
        next();
      });
      addEventListener("hashchange", () => { const i = hashIndex(); if (i != null && i !== Deck.cur) show(i); });
      addEventListener("beforeunload", (e) => { if (dirty.size) e.preventDefault(); });
    }

    Deck.slides.forEach((s) => eachFx(s, (d, e) => d.setup?.(e)));
    Deck.cur = hashIndex() ?? 0;
    show(Deck.cur);
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : boot();
})();
