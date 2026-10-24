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
      if ("ready" in e.dataset) return;
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
      const final = (e.dataset.final = e.textContent); // leave() restores it, so this is the authored text
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
      const final = (e.dataset.final = e.textContent); // leave() restores it, so this is the authored text
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
    setup(e) { this.layout(e); },
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
    const fillOn = C.fill !== null; // older captures have no fill key: keep the white box
    q(".mx-fill").style.background = C.fill || "#fff";
    q(".mx-fill").style.opacity = fillOn ? 1 - prog(t, T.expand[1] - 0.35, T.expand[1] + 0.15, eCubic) : 0;
    const sh = q(".mx-shadow");
    sh.style.background = C.fill || "#fff";
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

  // =====================================================================
  // Motion effects adapted from the civictech.tw intro clips.
  // Several wait for → instead of starting by themselves when given data-on="step".
  // =====================================================================
  const kids = (e) => [...e.children].filter((c) => !("gen" in c.dataset));
  const rnd = (i, n) => ((Math.sin((i + 1) * 99.13 * n) * 43758.5453) % 1 + 1) % 1; // same scatter every run
  const EASE = "cubic-bezier(.16,1,.3,1)";
  function trigger(e, fn, d = 0.6) {
    stop(e);
    if (e.dataset.on === "step") { e._pending = fn; return; }
    const t = setTimeout(fn, delay(e, d) * 1000);
    timers.set(e, () => clearTimeout(t));
  }
  const fire = (e) => { const f = e._pending; if (!f) return false; e._pending = null; f(); return true; };
  // effects that rebuild an element's inside keep the authored HTML and put it back on leave
  const saved = new WeakMap();
  const keep = (e) => { if (!saved.has(e)) saved.set(e, e.innerHTML); };
  const restore = (e) => { if (saved.has(e)) { e.innerHTML = saved.get(e); saved.delete(e); } };
  function splitChars(e, cls) {
    const out = [];
    const walk = (n) => [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of c.textContent) {
          if (/\s/.test(ch)) { frag.append(ch); continue; }
          const s = document.createElement("span");
          s.className = cls; s.dataset.gen = ""; s.textContent = ch;
          frag.append(s); out.push(s);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !("gen" in c.dataset)) walk(c);
    });
    walk(e);
    return out;
  }
  const stageScale = (e) => e.getBoundingClientRect().width / (e.offsetWidth || 1);

  // letters — each character rises out of a blur, one after another. <h1 data-fx="letters">
  register("letters", {
    enter(e) {
      restore(e); keep(e);
      const st = num(e.dataset.stagger, 0.05), d = delay(e, 0.2);
      splitChars(e, "ltr").forEach((c, i) => anim(c,
        [{ transform: "translateY(105%) rotate(8deg)", filter: "blur(14px)", opacity: 0 }, { transform: "none", filter: "blur(0)", opacity: 1 }],
        { duration: 1000, delay: (d + i * st) * 1000, easing: EASE }));
    },
    leave(e) { restore(e); },
  });

  // rotate — one word in a sentence keeps changing. Words are separated by ｜.
  // <p>在這裡，你可以<span data-fx="rotate">讀別人的經驗｜串接資料｜找到夥伴</span></p>
  register("rotate", {
    enter(e) {
      restore(e); keep(e);
      const words = e.textContent.split(/[|｜]/).map((w) => w.trim()).filter(Boolean);
      e.textContent = "";
      const box = gen("span", "rot-box", e);
      const spans = words.map((w) => { const s = gen("span", "rot-word", box); s.textContent = w; return s; });
      let k = 0;
      const set = (first) => {
        const prev = (k - 1 + spans.length) % spans.length;
        spans.forEach((s, j) => (s.className = "rot-word" + (j === k ? " on" : !first && j === prev ? " out" : "")));
        box.style.width = spans[k].offsetWidth + "px";
      };
      set(true); stop(e);
      const id = setInterval(() => { k = (k + 1) % spans.length; set(); }, ms(e, 2200));
      timers.set(e, () => clearInterval(id));
    },
    leave(e) { stop(e); restore(e); },
    thumb(e) { if (!e.querySelector(".rot-box")) e.textContent = e.textContent.split(/[|｜]/)[0]; },
  });

  // flap — split-flap board: every character flips through letters before it lands.
  // <p data-fx="flap">17 個議題</p>
  register("flap", {
    enter(e) {
      restore(e); keep(e);
      const cells = splitChars(e, "flap-cell");
      const glyphs = [...new Set(e.textContent.replace(/\s/g, ""))].join("") + "公民科技資料開放政府議題專案";
      const d = delay(e, 0.3), FL = 0.055, st = num(e.dataset.stagger, 0.04);
      const plan = cells.map((c, i) => ({ c, ch: c.textContent, stop: d + 0.5 + i * st + rnd(i, 3) * 0.35, seed: rnd(i, 7) * 10, digit: /\d/.test(c.textContent) }));
      const end = Math.max(...plan.map((p) => p.stop)) + FL;
      loopRaf(e, (t) => {
        for (const p of plan) {
          if (t >= p.stop) {
            p.c.textContent = p.ch;
            const k = clamp((t - p.stop) / FL);
            p.c.style.transform = `scaleY(${lerp(0.2, 1, 1 - Math.pow(1 - k, 3))})`;
          } else {
            const pool = p.digit ? "0123456789" : glyphs;
            p.c.textContent = t < d ? " " : pool[Math.floor((t + p.seed) / FL) % pool.length];
            p.c.style.transform = `scaleY(${Math.abs(Math.cos((((t + p.seed) % FL) / FL) * Math.PI))})`;
          }
        }
        return t < end;
      });
    },
    leave(e) { stop(e); restore(e); },
  });

  // slot — odometer: each digit rolls on its own reel and lands. <div class="n" data-fx="slot">226</div>
  register("slot", {
    enter(e) {
      restore(e); keep(e);
      const text = e.textContent;
      e.textContent = "";
      const chars = [...text], digits = chars.filter((c) => /\d/.test(c)).length;
      let di = 0;
      chars.forEach((ch) => {
        if (!/\d/.test(ch)) { gen("span", "", e).textContent = ch; return; }
        const fromRight = digits - 1 - di++;
        const col = gen("span", "slot-col", e), strip = gen("span", "slot-strip", col);
        const rounds = 1 + fromRight;
        strip.innerHTML = Array.from({ length: rounds * 10 + +ch + 1 }, (_, j) => `<i>${j % 10}</i>`).join("");
        anim(strip, [{ transform: "translateY(0)" }, { transform: `translateY(${-(rounds * 10 + +ch)}em)` }],
          { duration: ms(e, 1600) + fromRight * 220, delay: delay(e, 0.3) * 1000, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    },
    leave(e) { $$(".slot-strip", e).forEach(stop); restore(e); },
  });

  // particles — dots drift in from everywhere and gather into the text (one-line titles).
  // <h1 data-fx="particles">civictech.tw</h1>
  register("particles", {
    async enter(e) {
      this.leave(e);
      await document.fonts.ready;
      const slide = e.closest(".slide");
      if (!slide.classList.contains("active")) return;
      const cs = getComputedStyle(e), k = stageScale(slide);
      const sr = slide.getBoundingClientRect(), er = e.getBoundingClientRect();
      const x0 = (er.left - sr.left) / k, y0 = (er.top - sr.top) / k, w = Math.ceil(er.width / k), h = Math.ceil(er.height / k);
      const off = document.createElement("canvas"); off.width = w; off.height = h;
      const oc = off.getContext("2d", { willReadFrequently: true });
      oc.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      oc.textBaseline = "middle";
      oc.textAlign = cs.textAlign === "center" ? "center" : /right|end/.test(cs.textAlign) ? "right" : "left";
      oc.fillText(e.textContent.trim(), oc.textAlign === "center" ? w / 2 : oc.textAlign === "right" ? w : 0, h / 2);
      const px = oc.getImageData(0, 0, w, h).data, step = Math.max(3, Math.round(parseFloat(cs.fontSize) / 34));
      const pts = [];
      for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
        if (px[(y * w + x) * 4 + 3] > 128) {
          const i = pts.length;
          pts.push({ tx: x0 + x, ty: y0 + y, sx: rnd(i, 1) * Deck.W, sy: rnd(i, 2) * Deck.H, d: rnd(i, 3) * 0.8 + (x / w) * 0.5, r: 1.2 + rnd(i, 4) * (step / 3) });
        }
      }
      const cv = gen("canvas", "fx-canvas", slide);
      cv.width = Deck.W * 2; cv.height = Deck.H * 2;
      const ctx = cv.getContext("2d"); ctx.scale(2, 2);
      e.style.opacity = "0";
      const d = delay(e, 0.2), color = cs.color;
      loopRaf(e, (t) => {
        ctx.clearRect(0, 0, Deck.W, Deck.H);
        ctx.fillStyle = color;
        let all = true;
        for (const p of pts) {
          const q = clamp((t - d - p.d) / 1.6), ez = 1 - Math.pow(1 - q, 5);
          if (q < 1) all = false;
          ctx.globalAlpha = 0.25 + 0.75 * ez;
          ctx.beginPath();
          ctx.arc(lerp(p.sx + Math.sin(t * 1.3 + p.sy) * 14, p.tx, ez), lerp(p.sy + Math.cos(t * 1.1 + p.sx) * 14, p.ty, ez), p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (all) { e.style.opacity = ""; cv.style.transition = "opacity .8s"; cv.style.opacity = 0; return false; }
      });
    },
    leave(e) { stop(e); e.style.opacity = ""; e.closest(".slide")?.querySelectorAll(".fx-canvas").forEach((c) => c.remove()); },
  });

  // textmask — big words filled with a picture that slowly drifts.
  // <h1 data-fx="textmask" data-img="media/photo.jpg">公民科技</h1>
  register("textmask", {
    setup(e) { e.classList.add("textmask"); e.style.backgroundImage = `url("${e.dataset.img}")`; },
    enter(e) {
      this.setup(e);
      anim(e, [{ backgroundPosition: "0% 20%", backgroundSize: "140%" }, { backgroundPosition: "100% 80%", backgroundSize: "170%" }],
        { duration: ms(e, 9000), iterations: Infinity, direction: "alternate" });
    },
    leave(e) { stop(e); },
  });

  // tilt — a screenshot (or a whole grid) in 3D.
  //   data-mode="settle" (default) lies tilted then swings flat · "sway" turns side to side · "hold" stays tilted and drifts
  // <div data-fx="tilt"><img class="shot" src="…"></div>
  register("tilt", {
    enter(e) {
      const rx = num(e.dataset.rx, 55), rz = num(e.dataset.rz, -25), mode = e.dataset.mode || "settle";
      const tilted = `perspective(2400px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(.8)`;
      if (mode === "sway") anim(e, [{ transform: "perspective(1600px) rotateY(-20deg) rotateX(6deg)" }, { transform: "perspective(1600px) rotateY(20deg) rotateX(6deg)" }], { duration: ms(e, 5000), iterations: Infinity, direction: "alternate" });
      else if (mode === "hold") anim(e, [{ transform: `${tilted} translateY(40px)` }, { transform: `${tilted} translateY(-40px)` }], { duration: ms(e, 8000), iterations: Infinity, direction: "alternate" });
      else anim(e, [{ transform: tilted }, { transform: "perspective(2400px) rotateX(0deg) rotateZ(0deg) scale(1)" }], { duration: ms(e, 2200), delay: delay(e, 0.6) * 1000, easing: EASE });
    },
    leave(e) { stop(e); },
  });

  // explode — stacked layers lift apart in 3D, each with a label. Children are the layers,
  // bottom first; data-label on a layer names it.
  // <div class="explode" data-fx="explode"><div class="card">…</div><div data-label="專案名稱">…</div>…</div>
  register("explode", {
    setup(e) {
      kids(e).forEach((c, i) => {
        c.classList.add("x-layer"); c.style.setProperty("--k", i);
        if (c.dataset.label && !c.querySelector(".x-tag")) {
          const t = gen("div", "x-tag", c);
          gen("i", "", t); gen("span", "", t).textContent = c.dataset.label;
        }
      });
    },
    enter(e) { this.setup(e); e.classList.remove("open"); trigger(e, () => e.classList.add("open"), 0.9); },
    step(e) { return fire(e); },
    leave(e) { stop(e); e.classList.remove("open"); },
    thumb(e) { e.classList.add("open"); },
  });

  // parallax — layers at different depths drift and follow the mouse.
  // <div class="parallax" data-fx="parallax"><img data-depth="0.2" …><div data-depth="1">…</div></div>
  register("parallax", {
    enter(e) {
      const layers = kids(e), slide = e.closest(".slide");
      let mx = 0, my = 0;
      const move = (ev) => { const r = e.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - 0.5; my = (ev.clientY - r.top) / r.height - 0.5; };
      slide.addEventListener("mousemove", move);
      let sx = 0, sy = 0;
      loopRaf(e, (t) => {
        sx += (mx + Math.sin(t * 0.45) * 0.35 - sx) * 0.06; sy += (my + Math.cos(t * 0.35) * 0.25 - sy) * 0.06;
        layers.forEach((l) => { const d = num(l.dataset.depth, 0.5); l.style.transform = `translate3d(${-sx * d * 90}px, ${-sy * d * 60}px, 0) scale(${1 + d * 0.04})`; });
      });
      const cancel = timers.get(e);
      timers.set(e, () => { cancel(); slide.removeEventListener("mousemove", move); });
    },
    leave(e) { stop(e); },
  });

  // dive — zooms into one spot of the first picture until it becomes the second.
  // <div class="dive" data-fx="dive" data-at="30% 40%"><img src="a.png"><img src="b.png"></div>
  register("dive", {
    enter(e) {
      const [a, b] = kids(e);
      stop(a); stop(b);
      trigger(e, () => {
        a.style.transformOrigin = b.style.transformOrigin = e.dataset.at || "50% 50%";
        anim(a, [{ transform: "scale(1)", filter: "blur(0)", opacity: 1 }, { transform: `scale(${num(e.dataset.scale, 6)})`, filter: "blur(6px)", opacity: 0 }], { duration: 1400, easing: "cubic-bezier(.6,0,.2,1)" });
        anim(b, [{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 1400, delay: 200, easing: "cubic-bezier(.6,0,.2,1)" });
      }, 1);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); },
  });

  // wipe — a coloured band sweeps across, leaving the second picture behind it
  // (before/after, light/dark). <div class="wipe" data-fx="wipe"><img src="before.png"><img src="after.png"></div>
  register("wipe", {
    enter(e) {
      const [, b] = kids(e);
      const band = e.querySelector(".wipe-band") || gen("i", "wipe-band", e);
      stop(b); stop(band);
      const ang = (Math.atan((0.3 * e.offsetWidth) / (e.offsetHeight || 1)) * 180) / Math.PI;
      trigger(e, () => {
        const opt = { duration: ms(e, 1300), easing: "cubic-bezier(.65,0,.35,1)" };
        anim(b, [{ clipPath: "polygon(0 0, 0% 0, -30% 100%, 0 100%)" }, { clipPath: "polygon(0 0, 130% 0, 100% 100%, 0 100%)" }], opt);
        anim(band, [{ left: "-20%", transform: `skewX(${-ang}deg)` }, { left: "115%", transform: `skewX(${-ang}deg)` }], opt);
      }, 1);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); const band = e.querySelector(".wipe-band"); band && stop(band); },
  });

  // hotspots — pulsing dots on a screenshot; each → opens the next one's note.
  // Each note is a child with data-at="x y" (percent); add data-auto to step by itself.
  // <div class="hotspots" data-fx="hotspots"><img src="…"><p data-at="62 18">每個專案有自己的網址</p></div>
  register("hotspots", {
    setup(e) {
      kids(e).filter((c) => c.dataset.at).forEach((c) => {
        const [x, y] = c.dataset.at.split(/\s+/).map(Number);
        c.classList.add("hs-note");
        c.style.left = x + "%"; c.style.top = y + "%";
        if (!c._dot) { c._dot = gen("i", "hs-dot", e); c._dot.style.left = x + "%"; c._dot.style.top = y + "%"; }
      });
    },
    notes(e) { return kids(e).filter((c) => c.dataset.at); },
    enter(e) {
      this.setup(e);
      e.dataset.k = -1; e.classList.remove("lit");
      this.notes(e).forEach((n) => n.classList.remove("open"));
      stop(e);
      const ts = [setTimeout(() => e.classList.add("lit"), delay(e, 0.8) * 1000)];
      if (e.dataset.auto != null) this.notes(e).forEach((_, i) => ts.push(setTimeout(() => this.step(e), (delay(e, 0.8) + 0.8) * 1000 + i * ms(e, 2400))));
      timers.set(e, () => ts.forEach(clearTimeout));
    },
    step(e) {
      const ns = this.notes(e), k = +e.dataset.k + 1;
      if (k >= ns.length) return false;
      e.classList.add("lit");
      ns.forEach((n, j) => { n.classList.toggle("open", j === k); n._dot?.classList.toggle("open", j === k); });
      e.dataset.k = k;
      return true;
    },
    leave(e) { stop(e); },
    thumb(e) { e.classList.add("lit"); },
  });

  // story — a list of steps next to screens; the highlighted step and the screen move together.
  // Automatic every data-ms; with data-on="step" each → moves on.
  // <div class="story" data-fx="story"><ol><li>…</li>…</ol><div class="phone"><div data-frames><img>…</div></div></div>
  register("story", {
    parts(e) { return { items: $$("li", e.querySelector("ol, ul")), frames: kids(e.querySelector("[data-frames]") || e.lastElementChild) }; },
    set(e, k) {
      const { items, frames } = this.parts(e);
      items.forEach((l, j) => l.classList.toggle("on", j === k));
      frames.forEach((f, j) => f.classList.toggle("on", j === k));
      e.dataset.k = k;
    },
    enter(e) {
      this.set(e, 0); stop(e);
      if (e.dataset.on === "step") return;
      const n = this.parts(e).items.length;
      const id = setInterval(() => this.set(e, (+e.dataset.k + 1) % n), ms(e, 3000));
      timers.set(e, () => clearInterval(id));
    },
    step(e) {
      if (e.dataset.on !== "step") return false;
      const k = +e.dataset.k + 1;
      if (k >= this.parts(e).items.length) return false;
      this.set(e, k); return true;
    },
    leave(e) { stop(e); },
    thumb(e) { this.set(e, 0); },
  });

  // chat — messages pop in one by one, with "typing…" before the other side's.
  // class="me" puts a bubble on the right; class="link" makes a link preview.
  // <div class="chat" data-fx="chat"><p>有網站整理公民科技專案嗎？</p><p class="me">有！</p>…</div>
  register("chat", {
    enter(e) {
      const msgs = kids(e);
      msgs.forEach((m) => m.classList.remove("on"));
      e.querySelector(".chat-typing")?.remove();
      stop(e);
      const ts = [];
      timers.set(e, () => ts.forEach(clearTimeout));
      const gap = ms(e, 1300);
      let at = delay(e, 0.6) * 1000;
      msgs.forEach((m) => {
        if (!m.classList.contains("me")) {
          ts.push(setTimeout(() => { const t = gen("p", "chat-typing", e, m); t.innerHTML = "<i></i><i></i><i></i>"; }, at));
          at += 800;
        }
        ts.push(setTimeout(() => { e.querySelector(".chat-typing")?.remove(); m.classList.add("on"); }, at));
        at += gap;
      });
    },
    leave(e) { stop(e); e.querySelector(".chat-typing")?.remove(); },
    thumb(e) { kids(e).forEach((m) => m.classList.add("on")); },
  });

  // terminal — the command types itself, then the output prints line by line.
  // <div class="terminal" data-fx="terminal"><div class="cmd">curl …</div><div>{</div>…</div>
  register("terminal", {
    enter(e) {
      const [cmd, ...lines] = kids(e);
      lines.forEach((l) => l.classList.remove("on"));
      restore(cmd); keep(cmd);
      const text = cmd.textContent, per = 0.045, d = delay(e, 0.6);
      cmd.textContent = "";
      cmd.classList.add("typing");
      loopRaf(e, (t) => {
        const n = clamp(Math.floor((t - d) / per), 0, text.length);
        cmd.textContent = text.slice(0, n);
        if (n < text.length) return;
        cmd.classList.remove("typing");
        const shown = Math.floor((t - d - text.length * per - 0.5) / 0.07);
        lines.forEach((l, i) => l.classList.toggle("on", i < shown));
        return shown < lines.length;
      });
    },
    leave(e) { stop(e); const cmd = kids(e)[0]; cmd.classList.remove("typing"); restore(cmd); },
    thumb(e) { kids(e).forEach((l) => l.classList.add("on")); },
  });

  // tunnel — names stream past on the walls of a tunnel ("this many projects").
  // <div class="tunnel" data-fx="tunnel"><span>零時政府</span><span>萌典</span>…</div>
  register("tunnel", {
    place(e, t) {
      const chips = kids(e), per = num(e.dataset.per, 12), R = num(e.dataset.radius, 380), pitch = 240;
      const len = Math.max(1, Math.ceil(chips.length / per)) * pitch, speed = num(e.dataset.speed, 260);
      chips.forEach((c, i) => {
        const ring = Math.floor(i / per), a = ((i % per) / per) * 360 + ring * 13;
        const z = ((((-ring * pitch + t * speed) % len) + len) % len) - len + 300;
        c.style.opacity = clamp((z + len - 150) / 700) * clamp((300 - z) / 160);
        c.style.transform = `translate(-50%,-50%) rotateZ(${a + t * 5}deg) translate3d(0, ${R}px, ${z}px) rotateX(90deg)`;
      });
    },
    setup(e) { kids(e).forEach((c) => c.classList.add("tn-chip")); this.place(e, 1.5); },
    enter(e) { this.setup(e); loopRaf(e, (t) => this.place(e, t + 1.5)); },
    leave(e) { stop(e); },
  });

  // network — topics as hubs, their projects as dots around them, slowly turning in 3D.
  // <div class="network" data-fx="network"><div><b>政府預算</b><span>twbudget</span>…</div>…</div>
  const PALETTE = ["#0d5f74", "#b45309", "#7c3aed", "#15803d", "#be185d", "#1d4ed8", "#a16207", "#0f766e"];
  register("network", {
    build(e) {
      if (e._nw) return e._nw;
      const groups = kids(e), hubs = [], dots = [];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.gen = ""; svg.classList.add("nw-lines");
      e.prepend(svg);
      groups.forEach((g, i) => {
        const y = 1 - ((i + 0.5) / groups.length) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
        const color = g.dataset.color || PALETTE[i % PALETTE.length];
        g.classList.add("nw-group"); g.style.setProperty("--c", color);
        const label = g.querySelector("b"), members = $$("span", g);
        const hub = { el: label, x: Math.cos(th) * r, y: y * 0.75, z: Math.sin(th) * r, n: members.length };
        hubs.push(hub);
        members.forEach((m, j) => {
          const u = rnd(j, i + 1) * 2 - 1, a = rnd(j, i + 7) * Math.PI * 2, d = (0.08 + Math.sqrt(members.length) * 0.03) * Math.cbrt(rnd(j, i + 3)), s = Math.sqrt(1 - u * u);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("stroke", color); svg.appendChild(line);
          m.classList.add("nw-dot");
          dots.push({ el: m, hub, line, x: hub.x + Math.cos(a) * s * d, y: hub.y + u * d, z: hub.z + Math.sin(a) * s * d, delay: rnd(j, i + 11) * 0.8 });
        });
      });
      return (e._nw = { svg, hubs, dots });
    },
    draw(e, t) {
      const { svg, hubs, dots } = this.build(e);
      const W = e.offsetWidth, H = e.offsetHeight, RAD = Math.min(W, H * 1.4) * 0.42;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const yaw = -0.6 + t * 0.12, pitch = 0.3, boom = 1 - Math.pow(1 - clamp((t - 0.2) / 2), 5);
      const proj = (p) => {
        let x = p.x * RAD * boom, y = p.y * RAD * boom, z = p.z * RAD * boom;
        [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
        [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
        const s = 1100 / (1100 + z + 300);
        return { x: W / 2 + x * s, y: H / 2 + y * s, s, z };
      };
      const fogOf = (z) => clamp(1 - (z + RAD * 0.4) / (RAD * 2.6));
      const hp = new Map(hubs.map((h) => [h, proj(h)]));
      for (const d of dots) {
        const p = proj(d), h = hp.get(d.hub), k = clamp((t - 0.4 - d.delay) / 1.2), f = fogOf(p.z);
        d.el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.s})`;
        d.el.style.opacity = k * (0.35 + 0.65 * f);
        d.line.setAttribute("x1", h.x); d.line.setAttribute("y1", h.y); d.line.setAttribute("x2", p.x); d.line.setAttribute("y2", p.y);
        d.line.setAttribute("opacity", k * 0.5 * (0.35 + 0.65 * f));
      }
      const lab = clamp((t - 2) / 1);
      for (const h of hubs) {
        const p = hp.get(h), f = fogOf(p.z);
        h.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, calc(-100% - 22px)) scale(${0.7 + p.s * 0.4})`;
        h.el.style.opacity = 0.4 + 0.6 * f;
        h.el.style.setProperty("--lab", lab * clamp((f - 0.35) / 0.25));
        h.el.style.zIndex = Math.round(1000 - p.z);
      }
    },
    setup(e) { this.draw(e, 6); },
    enter(e) { loopRaf(e, (t) => this.draw(e, t)); },
    leave(e) { stop(e); },
  });

  // ring — a progress ring that fills to data-v of data-max. Put a label inside.
  // <div class="ring" data-fx="ring" data-v="84" data-max="226"><b>84</b><span>有寫簡介</span></div>
  register("ring", {
    setup(e) {
      if (e.querySelector(".ring-svg")) return;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.dataset.gen = ""; svg.classList.add("ring-svg"); svg.setAttribute("viewBox", "0 0 100 100");
      svg.innerHTML = '<circle cx="50" cy="50" r="45" pathLength="100" class="ring-track"/><circle cx="50" cy="50" r="45" pathLength="100" class="ring-arc"/>';
      e.prepend(svg);
    },
    frac(e) { return clamp(num(e.dataset.v, 0) / num(e.dataset.max, 100)); },
    enter(e) {
      this.setup(e);
      const arc = e.querySelector(".ring-arc");
      anim(arc, [{ strokeDashoffset: 100 }, { strokeDashoffset: 100 - this.frac(e) * 100 }], { duration: ms(e, 1500), delay: delay(e, 0.3) * 1000, easing: "cubic-bezier(.3,.7,.2,1)" });
    },
    leave(e) { const arc = e.querySelector(".ring-arc"); arc && stop(arc); },
    thumb(e) { const arc = e.querySelector(".ring-arc"); if (arc) arc.style.strokeDashoffset = 100 - this.frac(e) * 100; },
  });

  // feature — tiles of a grid take turns being the big one, the others making room.
  // <div class="feature" data-fx="feature" data-ms="2800"><div class="card">…</div>…</div>
  register("feature", {
    set(e, k, animate) {
      const tiles = kids(e), s = stageScale(e);
      const before = tiles.map((c) => c.getBoundingClientRect());
      tiles.forEach((c, j) => c.classList.toggle("featured", j === k));
      e.dataset.k = k;
      if (!animate) return;
      tiles.forEach((c, j) => {
        const a = before[j], b = c.getBoundingClientRect();
        if (!b.width) return;
        anim(c, [{ transform: `translate(${(a.left - b.left) / s}px, ${(a.top - b.top) / s}px) scale(${a.width / b.width}, ${a.height / b.height})`, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: 900, easing: EASE });
      });
    },
    enter(e) {
      this.set(e, 0, false); stop(e);
      const n = kids(e).length;
      const id = setInterval(() => this.set(e, (+e.dataset.k + 1) % n, true), ms(e, 2800));
      timers.set(e, () => clearInterval(id));
    },
    leave(e) { stop(e); kids(e).forEach(stop); },
    thumb(e) { this.set(e, 0, false); },
  });

  // swarm — lots of small things rush in from deep space and settle into place.
  // <div class="swarm" data-fx="swarm"><span>…</span>×100</div>
  register("swarm", {
    enter(e) {
      const items = kids(e), n = items.length, spread = ms(e, 1600) / 1000, d = delay(e, 0.2);
      items.forEach((c, i) => {
        const dx = (rnd(i, 1) - 0.5) * 1800, dy = (rnd(i, 2) - 0.5) * 1100, dz = -400 - rnd(i, 3) * 1600, r = (rnd(i, 4) - 0.5) * 120;
        anim(c, [{ opacity: 0, transform: `perspective(1200px) translate3d(${dx}px, ${dy}px, ${dz}px) rotateX(${r}deg) rotateY(${-r}deg)` }, { opacity: 1, transform: "none" }],
          { duration: 1300, delay: (d + (i / n) * spread * 0.6 + rnd(i, 5) * spread * 0.4) * 1000, easing: EASE });
      });
    },
    leave(e) { kids(e).forEach(stop); },
  });

  // collapse — everything shrinks into the centre and one last thing appears (an ending).
  // The child with data-end is what's left. <div class="collapse" data-fx="collapse">…<div data-end>civictech.tw</div></div>
  register("collapse", {
    enter(e) {
      const items = kids(e).filter((c) => !("end" in c.dataset)), end = e.querySelector("[data-end]");
      items.forEach(stop); end && stop(end);
      trigger(e, () => {
        const er = e.getBoundingClientRect(), s = stageScale(e);
        items.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const dx = (er.left + er.width / 2 - (r.left + r.width / 2)) / s, dy = (er.top + er.height / 2 - (r.top + r.height / 2)) / s;
          anim(c, [{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.1)`, opacity: 0 }], { duration: 900, delay: i * 70, easing: "cubic-bezier(.7,0,.3,1)" });
        });
        if (end) anim(end, [{ opacity: 0, transform: "scale(.6)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 900, delay: 800 + items.length * 70, easing: EASE });
      }, 1.2);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); },
  });

  // bento — a feature grid. Tiles fly in from the nearest screen edge, overshoot a little
  // as they lock into place, then the whole grid drifts closer. Tiles keep their own
  // effects running inside (pan, slot, type, terminal, stack, compare…).
  // Size tiles with class w2 / h2 (two columns wide / two rows tall).
  // <div class="bento" data-fx="bento"><div class="tile w2"><div class="head"><b>標題</b><span>一句話</span></div>…</div>…</div>
  register("bento", {
    enter(e) {
      const tiles = kids(e), slide = e.closest(".slide"), s = stageScale(slide), sr = slide.getBoundingClientRect();
      tiles.forEach((c, i) => {
        stop(c);
        const r = c.getBoundingClientRect();
        const cx = (r.left + r.width / 2 - sr.left) / s - Deck.W / 2, cy = (r.top + r.height / 2 - sr.top) / s - Deck.H / 2;
        const [dx, dy] = Math.abs(cx) / Deck.W > Math.abs(cy) / Deck.H ? [Math.sign(cx) * 1300, cy * 0.3] : [cx * 0.3, Math.sign(cy || 1) * 900];
        const rot = (rnd(i, 4) - 0.5) * 30, d = delay(e, 0.1) + rnd(i, 9) * num(e.dataset.spread, 0.7);
        anim(c, [{ opacity: 0, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, offset: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, transform: "none" }],
          { duration: 1000, delay: d * 1000, easing: "cubic-bezier(.34,1.45,.64,1)" });
      });
      if (e.dataset.drift !== "off") anim(e, [{ transform: "scale(1)" }, { transform: "scale(1.035)" }], { duration: 8000, delay: 1500, easing: "ease-in-out" });
    },
    leave(e) { stop(e); kids(e).forEach(stop); },
  });

  // pop — children pop in one by one with a little bounce (dots, badges, logos).
  // <div data-fx="pop"><i></i><i></i>…</div>
  register("pop", {
    enter(e) {
      const st = num(e.dataset.stagger, 0.05), d = delay(e, 0.8);
      kids(e).forEach((c, i) => anim(c, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 500, delay: (d + i * st) * 1000, easing: "cubic-bezier(.34,1.56,.64,1)" }));
    },
    leave(e) { kids(e).forEach(stop); },
  });

  // compare — two pictures split by a line that sweeps back and forth (light/dark, before/after).
  // <div class="compare" data-fx="compare"><img src="light.png"><img src="dark.png"></div>
  register("compare", {
    setup(e) { if (!e.querySelector(".cmp-line")) gen("i", "cmp-line", e); this.at(e, 50); },
    at(e, x) { const [, b] = kids(e); if (b) b.style.clipPath = `inset(0 0 0 ${x}%)`; e.querySelector(".cmp-line").style.left = x + "%"; },
    enter(e) { this.setup(e); const per = ms(e, 3200) / 1000; loopRaf(e, (t) => this.at(e, 50 + 38 * Math.sin((t / per) * Math.PI * 2))); },
    leave(e) { stop(e); },
  });

  // stack — a pile of cards; the front one moves to the back every few seconds.
  // <div class="stack" data-fx="stack"><div class="card">…</div><div class="card">…</div>…</div>
  register("stack", {
    place(e, t) {
      const cards = kids(e), n = cards.length, every = ms(e, 1600) / 1000;
      cards.forEach((c, i) => {
        const phase = ((t / every + (n - i)) % n + n) % n, depth = Math.floor(phase);
        const enter = depth === 0 ? 1 - Math.pow(2, -10 * clamp((phase % 1) / 0.35)) : 1;
        c.style.zIndex = n - depth;
        c.style.transform = `translateY(${depth * 16}px) scale(${1 - depth * 0.05}) rotate(${(1 - enter) * -7}deg)`;
        c.style.opacity = 1 - depth * 0.3;
      });
    },
    setup(e) { this.place(e, 0); },
    enter(e) { const d = delay(e, 1.2); loopRaf(e, (t) => this.place(e, Math.max(0, t - d))); },
    leave(e) { stop(e); },
  });

  // preload every morph on the page so thumbnails have something to show
  const preload = () => document.querySelectorAll('[data-fx~="morph"]').forEach(loadMorph);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", preload) : preload();
})();
