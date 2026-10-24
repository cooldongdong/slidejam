// web-deck effects. Each one is opted into with data-fx="name" and configured
// with data-* attributes. effects.html shows every one of them running.
(() => {
  const { register } = Deck.fx;
  const $$ = (s, r) => [...r.querySelectorAll(s)];
  const gen = (tag, cls, parent, before) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    e.dataset.gen = "";
    parent.insertBefore(e, before || null);
    return e;
  };
  const num = (v, d) => (v == null || v === "" ? d : +v);
  const ms = (e, d) => num(e.dataset.ms, d);
  const delay = (e, d = 0) => num(e.dataset.delay, d);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const timers = new WeakMap(); // element -> cancel()
  const stop = (e) => { timers.get(e)?.(); timers.delete(e); };
  function loopRaf(e, fn) {
    stop(e);
    let id, t0 = performance.now();
    const tick = (now) => { if (fn((now - t0) / 1000) !== false) id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    timers.set(e, () => cancelAnimationFrame(id));
  }
  function anim(e, keyframes, opts) {
    stop(e);
    const a = e.animate(keyframes, { fill: "both", easing: "ease-in-out", ...opts });
    timers.set(e, () => a.cancel());
  }

  // bars — horizontal bars that grow in. <div data-fx="bars" data-max="65">
  //   <div class="bar" data-v="60"><span>label</span><em>60%</em></div> …
  register("bars", {
    setup(e) {
      if (e.dataset.ready) return;
      e.dataset.ready = "";
      $$(".bar", e).forEach((b) => gen("i", "bar-fill", gen("div", "bar-track", b, b.children[1])));
    },
    widths(e, on) {
      const max = num(e.dataset.max, Math.max(...$$(".bar", e).map((b) => +b.dataset.v)));
      $$(".bar", e).forEach((b) => ($$(".bar-fill", b)[0].style.width = on ? (b.dataset.v / max) * 100 + "%" : "0"));
    },
    enter(e) { this.setup(e); this.widths(e, false); stop(e); const t = setTimeout(() => this.widths(e, true), delay(e, 350)); timers.set(e, () => clearTimeout(t)); },
    leave(e) { stop(e); },
    thumb(e) { this.setup(e); this.widths(e, true); },
  });

  // count — counts up to the number written inside. <span data-fx="count">1,165</span>
  register("count", {
    enter(e) {
      const final = (e.dataset.final ??= e.textContent);
      const m = final.match(/-?[\d,]*\.?\d+/);
      if (!m) return;
      const target = parseFloat(m[0].replace(/,/g, "")), dp = (m[0].split(".")[1] || "").length, comma = m[0].includes(",");
      const fmt = (v) => { const s = v.toFixed(dp); return comma ? Number(s).toLocaleString("en-US", { minimumFractionDigits: dp }) : s; };
      const d = delay(e, 0.3), dur = ms(e, 1400) / 1000;
      loopRaf(e, (t) => {
        const k = clamp((t - d) / dur), eased = 1 - Math.pow(1 - k, 3);
        e.textContent = final.replace(m[0], fmt(target * eased));
        return k < 1;
      });
    },
    leave(e) { stop(e); if (e.dataset.final) e.textContent = e.dataset.final; },
  });

  // type — types the text out letter by letter. <p data-fx="type" data-ms="45">…</p>
  register("type", {
    enter(e) {
      const final = (e.dataset.final ??= e.textContent);
      const chars = [...final], per = ms(e, 55) / 1000, d = delay(e, 0.4);
      e.classList.add("typing");
      loopRaf(e, (t) => {
        const n = clamp(Math.floor((t - d) / per), 0, chars.length);
        e.textContent = chars.slice(0, n).join("");
        if (n >= chars.length) { e.classList.remove("typing"); return false; }
      });
    },
    leave(e) { stop(e); e.classList.remove("typing"); if (e.dataset.final) e.textContent = e.dataset.final; },
  });

  // mark — a highlighter sweeps in behind the text. <b data-fx="mark">重點</b>
  register("mark", {
    enter(e) { e.classList.remove("marked"); stop(e); const t = setTimeout(() => e.classList.add("marked"), delay(e, 0.8) * 1000); timers.set(e, () => clearTimeout(t)); },
    leave(e) { stop(e); e.classList.remove("marked"); },
    thumb(e) { e.classList.add("marked"); },
  });

  // pan — slowly scrolls a tall screenshot inside its box, back and forth.
  // <div class="pan" data-fx="pan" style="height:500px"><img src="tall.png"></div>
  register("pan", {
    enter(e) {
      const img = e.querySelector("img, video");
      const go = () => {
        const dist = img.getBoundingClientRect().height / (e.getBoundingClientRect().height / e.clientHeight) - e.clientHeight;
        if (dist <= 0) return;
        anim(img, [{ transform: "translateY(0)" }, { transform: `translateY(${-dist}px)` }], { duration: ms(e, 7000), delay: delay(e, 1.2) * 1000, iterations: Infinity, direction: "alternate" });
      };
      img.complete !== false ? go() : img.addEventListener("load", go, { once: true });
    },
    leave(e) { const img = e.querySelector("img, video"); img && stop(img); },
  });

  // zoom — pushes in on one spot. <div class="zoom" data-fx="zoom" data-at="22% 52%" data-scale="1.9"><img></div>
  register("zoom", {
    enter(e) {
      const img = e.firstElementChild;
      img.style.transformOrigin = e.dataset.at || "50% 50%";
      anim(img, [{ transform: "scale(1)" }, { transform: `scale(${num(e.dataset.scale, 1.8)})` }], {
        duration: ms(e, 5000), delay: delay(e, 1) * 1000,
        ...(e.dataset.once != null ? {} : { iterations: Infinity, direction: "alternate" }),
      });
    },
    leave(e) { e.firstElementChild && stop(e.firstElementChild); },
  });

  // cycle — shows its children one at a time, cross-fading. <div data-fx="cycle" data-ms="3000"><img><img></div>
  register("cycle", {
    enter(e) {
      const kids = [...e.children].filter((c) => !("gen" in c.dataset));
      let k = 0;
      const set = () => kids.forEach((c, j) => c.classList.toggle("on", j === k));
      set(); stop(e);
      const id = setInterval(() => { k = (k + 1) % kids.length; set(); }, ms(e, 3000));
      timers.set(e, () => clearInterval(id));
    },
    leave(e) { stop(e); },
    thumb(e) { [...e.children].forEach((c, j) => c.classList.toggle("on", j === 0)); },
  });

  // clickpath — a cursor walks a click-through demo over screenshots (children
  // are the frames). The script is a list of commands separated by ";":
  //   move X Y (percent of the box) · click · frame N · wait MS · loop
  // <div class="clickpath" data-fx="clickpath" data-script="move 26 50; wait 1200; click; frame 1; …">
  register("clickpath", {
    enter(e) {
      const frames = [...e.children].filter((c) => !("gen" in c.dataset));
      let cur = e.querySelector(".cursor");
      if (!cur) {
        cur = gen("div", "cursor", e);
        cur.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><i class="ring"></i>';
      }
      const cmds = (e.dataset.script || "").split(";").map((s) => s.trim().split(/\s+/)).filter((c) => c[0]);
      const frame = (k) => frames.forEach((f, j) => f.classList.toggle("on", j === k));
      const move = (x, y, fast) => { cur.style.transition = fast ? "none" : ""; cur.style.left = x + "%"; cur.style.top = y + "%"; };
      const start = cmds.find((c) => c[0] === "move");
      let ts = [];
      stop(e);
      timers.set(e, () => ts.forEach(clearTimeout));
      const run = () => {
        frame(0); move(start ? +start[1] : 70, start ? +start[2] : 85, true);
        let at = 400;
        for (const [c, a, b] of cmds) {
          const t = at;
          if (c === "wait") at += +a;
          else if (c === "move") { ts.push(setTimeout(() => move(+a, +b), t)); at += 1000; }
          else if (c === "click") ts.push(setTimeout(() => { cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click"); }, t));
          else if (c === "frame") ts.push(setTimeout(() => frame(+a), t));
        }
        ts.push(setTimeout(run, at + 1500));
      };
      run();
    },
    leave(e) { stop(e); },
    thumb(e) { [...e.children].forEach((c, j) => c.classList.toggle("on", j === 0)); },
  });

  // orbit — children sit around an ellipse; a dot travels it and lights each one in turn.
  // <div class="orbit" data-fx="orbit" data-ms="14000" style="height:640px"><div>資料庫</div><div>API</div>…</div>
  register("orbit", {
    layout(e) {
      const nodes = [...e.children].filter((c) => !("gen" in c.dataset));
      const w = e.clientWidth, h = e.clientHeight, cx = w / 2, cy = h / 2, rx = w / 2 - 110, ry = h / 2 - 50;
      let svg = e.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.gen = "";
        svg.innerHTML = '<ellipse fill="none" stroke="var(--line-strong)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/><circle class="halo" r="22" fill="var(--accent)" opacity=".18"/><circle class="dot" r="10" fill="var(--accent)"/>';
        e.prepend(svg);
      }
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      Object.entries({ cx, cy, rx, ry }).forEach(([k, v]) => svg.querySelector("ellipse").setAttribute(k, v));
      nodes.forEach((n, i) => {
        const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2;
        n.classList.add("orbit-node");
        n.style.left = cx + rx * Math.cos(a) + "px"; n.style.top = cy + ry * Math.sin(a) + "px";
      });
      return { nodes, svg, cx, cy, rx, ry };
    },
    enter(e) {
      const { nodes, svg, cx, cy, rx, ry } = this.layout(e), period = ms(e, 14000) / 1000;
      const dots = svg.querySelectorAll("circle");
      loopRaf(e, (t) => {
        const f = (t % period) / period, a = -Math.PI / 2 + f * Math.PI * 2;
        dots.forEach((d) => { d.setAttribute("cx", cx + rx * Math.cos(a)); d.setAttribute("cy", cy + ry * Math.sin(a)); });
        const k = Math.round(f * nodes.length) % nodes.length;
        nodes.forEach((n, j) => n.classList.toggle("lit", j === k));
      });
    },
    leave(e) { stop(e); },
    thumb(e) { /* positions are inline styles already, nothing to do */ },
  });

  // assemble — children fly in from scattered spots and settle into the layout.
  // <div class="grid3" data-fx="assemble" data-stagger="0.12">…</div>
  register("assemble", {
    enter(e) {
      const kids = [...e.children].filter((c) => !("gen" in c.dataset));
      const st = num(e.dataset.stagger, 0.12), d = delay(e, 0.2);
      kids.forEach((c, i) => {
        // deterministic scatter so every run looks the same
        const r = (n) => ((Math.sin((i + 1) * 99.13 * n) * 43758.5453) % 1 + 1) % 1;
        const dx = (r(1) - 0.5) * 900, dy = (r(2) - 0.5) * 600, rot = (r(3) - 0.5) * 30;
        anim(c, [{ opacity: 0, transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.7)` }, { opacity: 1, transform: "none" }],
          { duration: 1000, delay: (d + i * st) * 1000, easing: "cubic-bezier(.16,1,.3,1)" });
      });
    },
    leave(e) { [...e.children].forEach(stop); },
  });

  // spot — dims a screenshot except for a highlighted box. Several boxes
  // (separated by ",") are stepped through with →. Boxes are "x y w h" in percent.
  // <div class="spot" data-fx="spot" data-rects="8 30 40 12, 55 60 30 20"><img></div>
  register("spot", {
    rects(e) { return (e.dataset.rects || "").split(",").map((s) => s.trim().split(/\s+/).map(Number)).filter((r) => r.length === 4); },
    place(e, k) {
      let hole = e.querySelector(".spot-hole") || gen("i", "spot-hole", e);
      const r = this.rects(e)[k];
      if (!r) return;
      Object.assign(hole.style, { left: r[0] + "%", top: r[1] + "%", width: r[2] + "%", height: r[3] + "%" });
      e.dataset.k = k;
    },
    enter(e) {
      e.classList.remove("lit"); this.place(e, 0); stop(e);
      const t = setTimeout(() => e.classList.add("lit"), delay(e, 1) * 1000);
      timers.set(e, () => clearTimeout(t));
    },
    step(e) {
      const k = +e.dataset.k + 1;
      if (k >= this.rects(e).length) return false;
      this.place(e, k); return true;
    },
    leave(e) { stop(e); e.classList.remove("lit"); },
    thumb(e) { this.place(e, 0); e.classList.add("lit"); },
  });

  // live — a real website running inside the slide, drawn at a desktop (or
  // phone) size and scaled to fit. Needs a network connection.
  // <div class="live" data-fx="live" data-src="https://…" data-w="1440" data-h="900"></div>
  register("live", {
    enter(e) {
      let f = e.querySelector("iframe");
      const w = num(e.dataset.w, 1440), h = num(e.dataset.h, 900);
      if (!f) {
        f = gen("iframe", "", e);
        f.src = e.dataset.src; f.loading = "lazy"; f.allow = "geolocation; fullscreen";
        Object.assign(f.style, { width: w + "px", height: h + "px" });
      }
      if (!e.style.aspectRatio && !e.style.height) e.style.aspectRatio = `${w}/${h}`;
      f.style.transform = `scale(${e.clientWidth / w})`;
    },
  });

  // morph — "click → the page rebuilds itself", captured from two real pages
  // by tools/capture-morph.mjs. <div class="morph" data-fx="morph" data-src="media/morph-x"></div>
  // The folder holds the screenshots plus morph.js, which calls Deck.morph(src, data).
  const morphs = {};
  Deck.morph = (src, data) => { morphs[src] = data; document.querySelectorAll(`[data-fx~="morph"][data-src="${src}"]`).forEach(buildMorph); };
  const eQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
  const eCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const eExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const prog = (t, a, b, ez = eQuint) => ez(clamp((t - a) / (b - a)));
  function loadMorph(e) {
    const src = e.dataset.src;
    if (morphs[src]) return buildMorph(e);
    if (document.querySelector(`script[data-morph="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src + "/morph.js"; s.dataset.morph = src;
    s.onerror = () => Deck.toast(`找不到 ${src}/morph.js，先跑 tools/capture-morph.mjs`);
    document.head.appendChild(s);
  }
  function buildMorph(e) {
    const C = morphs[e.dataset.src], src = e.dataset.src;
    if (!C || e.querySelector(".mx")) return;
    const [W, H] = C.size;
    const root = gen("div", "mx", e);
    Object.assign(root.style, { width: W + "px", height: H + "px" });
    const img = (cls, file, w) => `<img class="${cls}" src="${src}/${file}" alt=""${w ? ` style="width:${w}px"` : ""}>`;
    root.innerHTML = img("mx-from", "from.png", W) + '<div class="mx-shadow"></div>' +
      `<div class="mx-reveal">${img("", "to.png", W)}<div class="mx-fill"></div></div>` +
      C.pairs.map((p, i) => `<div class="mx-pair">${img("a", `pair-${i}-a.png`, p.from.w)}${img("b", `pair-${i}-b.png`, p.to.w)}</div>`).join("") +
      C.rows.map((r, i) => img("mx-row", `row-${i}.png`, r.w)).join("") +
      '<svg class="mx-cursor" viewBox="0 0 24 24" width="36" height="36"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><div class="mx-ripple"></div>';
    $$("*", root).forEach((c) => (c.dataset.gen = ""));
    fitMorph(e); renderMorph(root, C, 0);
    if (e.closest(".slide.active") && !document.body.classList.contains("editing")) Deck.fx.morph.enter(e);
  }
  function fitMorph(e) {
    const root = e.querySelector(".mx"), C = morphs[e.dataset.src];
    if (!root) return;
    if (!e.style.aspectRatio && !e.style.height) e.style.aspectRatio = `${C.size[0]}/${C.size[1]}`;
    root.style.transform = `scale(${e.clientWidth / C.size[0]})`;
  }
  function renderMorph(root, C, t) {
    const q = (s) => root.querySelector(s), qa = (s) => [...root.querySelectorAll(s)];
    const [W, H] = C.size, B = C.box, cx = B.x + B.w / 2, cy = B.y + B.h / 2, [kx, ky] = C.click;
    const T = { move: [0.4, 1.3], click: 1.45, expand: [1.6, 2.7], morph: [1.65, 2.8], rows: 2.45 };
    // cursor travels over and presses
    const mv = prog(t, ...T.move, eCubic), cur = q(".mx-cursor");
    cur.style.transform = `translate(${lerp(W * 0.72, kx, mv)}px, ${lerp(H * 0.87, ky, mv)}px)`;
    cur.style.opacity = 1 - prog(t, T.expand[0], T.expand[0] + 0.3);
    const rp = clamp((t - T.click) / 0.6), rip = q(".mx-ripple");
    rip.style.transform = `translate(${kx}px, ${ky}px) scale(${0.3 + rp})`;
    rip.style.opacity = t < T.click ? 0 : 0.8 * (1 - rp);
    const press = t > T.click - 0.05 && t < T.click + 0.15 ? 0.985 : 1;
    const started = t >= T.click;
    // the old page steps back and blurs
    const back = prog(t, T.expand[0] - 0.1, T.expand[1], eCubic), bg = q(".mx-from");
    bg.style.transform = `scale(${lerp(1, 0.93, back)})`;
    bg.style.filter = `blur(${8 * back}px)`;
    // the clicked box grows into the whole screen
    const k = prog(t, ...T.expand);
    const lift = prog(t, T.click + 0.05, T.expand[0] + 0.25, eCubic) * (1 - k);
    const px = (v, c) => c + (v - c) * press;
    const bx = { x: px(lerp(B.x, 0, k), cx), y: px(lerp(B.y, 0, k), cy), w: lerp(B.w, W, k) * press, h: lerp(B.h, H, k) * press };
    const r = lerp(12, 0, k), rev = q(".mx-reveal");
    rev.style.visibility = started ? "visible" : "hidden";
    rev.style.clipPath = `inset(${bx.y}px ${W - bx.x - bx.w}px ${H - bx.y - bx.h}px ${bx.x}px round ${r}px)`;
    q(".mx-fill").style.opacity = 1 - prog(t, T.expand[1] - 0.35, T.expand[1] + 0.15, eCubic);
    const sh = q(".mx-shadow");
    Object.assign(sh.style, { left: bx.x + "px", top: bx.y + "px", width: bx.w + "px", height: bx.h + "px", borderRadius: r + "px", visibility: started ? "visible" : "hidden" });
    sh.style.boxShadow = `0 ${2 + 40 * lift}px ${6 + 90 * lift}px rgba(15,23,42,${0.06 + 0.16 * lift})`;
    sh.style.opacity = 1 - k;
    // shared elements fly to their new spot, cross-fading on the way
    qa(".mx-pair").forEach((w, i) => {
      const { from, to, ratio } = C.pairs[i];
      const ez = prog(t, T.morph[0] + i * 0.05, T.morph[1] + i * 0.05), sc = lerp(1, ratio, ez);
      w.style.visibility = started ? "visible" : "hidden";
      w.style.transform = `translate(${lerp(px(from.x, cx), to.x, ez)}px, ${lerp(px(from.y, cy), to.y, ez)}px)`;
      const [a, b] = w.children, xf = clamp((ez - 0.35) / 0.3);
      a.style.transform = `scale(${sc * (ez === 0 ? press : 1)})`; a.style.opacity = 1 - xf;
      b.style.transform = `scale(${sc / ratio})`; b.style.opacity = xf;
    });
    // everything else rises in, staggered
    qa(".mx-row").forEach((el, i) => {
      const R = C.rows[i], ez = prog(t, T.rows + i * C.stagger, T.rows + i * C.stagger + 0.8, eExpo);
      el.style.opacity = ez;
      el.style.transform = `translate(${R.x}px, ${R.y + 50 * (1 - ez)}px)`;
    });
  }
  register("morph", {
    enter(e) {
      loadMorph(e);
      const root = e.querySelector(".mx"), C = morphs[e.dataset.src];
      if (!root) return;
      fitMorph(e);
      const d = delay(e, 0.9);
      loopRaf(e, (t) => { renderMorph(root, C, t - d); return t - d < 4.5; });
    },
    leave(e) { stop(e); const root = e.querySelector(".mx"); root && renderMorph(root, morphs[e.dataset.src], 0); },
    thumb(e) { const root = e.querySelector(".mx"); root && renderMorph(root, morphs[e.dataset.src], 10); },
  });
  // map — a real map (Leaflet + OpenStreetMap tiles; needs a network connection).
  // Pins drop in one by one, then each → flies to the next stop of the tour.
  //   data-center="lat lng"  data-zoom="14"
  //   data-pins="lat lng label; lat lng label; …"
  //   data-tour="lat lng zoom; lat lng zoom; …"   (add data-auto to play it by itself)
  //   data-tiles="https://…/{z}/{x}/{y}.png"       (optional tile server)
  // <div class="map" data-fx="map" data-center="24.99 121.42" data-zoom="14" data-pins="…"></div>
  let leaflet;
  const loadLeaflet = () => (leaflet ??= new Promise((res, rej) => {
    if (window.L) return res(window.L);
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => res(window.L); js.onerror = () => { leaflet = null; rej(); Deck.toast("地圖載不到，請確認有網路"); };
    document.head.appendChild(js);
  }));
  const triples = (s) => (s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b, ...rest] = x.split(/\s+/); return [+a, +b, rest.join(" ")]; });
  register("map", {
    async enter(e) {
      const L = await loadLeaflet().catch(() => null);
      if (!L || !e.closest(".slide.active")) return;
      const [lat, lng] = triples(e.dataset.center)[0] || [23.7, 121];
      const zoom = num(e.dataset.zoom, 13);
      if (!e._map) {
        const live = e.dataset.interactive != null;
        const m = (e._map = L.map(e, { zoomControl: live, attributionControl: true, dragging: live, scrollWheelZoom: live, doubleClickZoom: live, boxZoom: live, keyboard: false, zoomSnap: 0.25 }));
        L.tileLayer(e.dataset.tiles || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
      }
      const m = e._map;
      m.invalidateSize(); m.setView([lat, lng], zoom, { animate: false });
      (e._pins || []).forEach((p) => p.remove());
      stop(e);
      const ts = [];
      timers.set(e, () => ts.forEach(clearTimeout));
      const d = delay(e, 0.8) * 1000, st = num(e.dataset.stagger, 0.25) * 1000;
      e._pins = triples(e.dataset.pins).map(([a, b, label], i) => {
        const icon = L.divIcon({ className: "pin", html: `<i></i>${label ? `<span>${label}</span>` : ""}`, iconSize: [0, 0] });
        const p = L.marker([a, b], { icon, interactive: false });
        ts.push(setTimeout(() => p.addTo(m), d + i * st));
        return p;
      });
      e.dataset.k = -1;
      if (e.dataset.auto != null) {
        const tour = triples(e.dataset.tour), gap = ms(e, 3500);
        tour.forEach((_, i) => ts.push(setTimeout(() => this.step(e), d + e._pins.length * st + 600 + i * gap)));
      }
    },
    step(e) {
      const tour = triples(e.dataset.tour), k = +e.dataset.k + 1;
      if (!e._map || k >= tour.length) return false;
      const [a, b, z] = tour[k];
      e._map.flyTo([a, b], +z || e._map.getZoom(), { duration: num(e.dataset.fly, 2.2) });
      e.dataset.k = k;
      return true;
    },
    leave(e) { stop(e); },
  });

  // preload every morph on the page so thumbnails have something to show
  const preload = () => document.querySelectorAll('[data-fx~="morph"]').forEach(loadMorph);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", preload) : preload();
})();
