// morph — "click → the page rebuilds itself", captured from two real pages
// by tools/capture-morph.mjs. <div class="morph" data-fx="morph" data-src="media/morph-x"></div>
// The folder holds the screenshots plus morph.js, which calls Deck.morph(src, data).
(() => {
  const { register, $$, gen, delay, clamp, lerp, stop, loopRaf } = Deck.lib;
  Deck.lib.css(`
.morph{position:relative;overflow:hidden;border-radius:var(--radius);border:1px solid var(--line-strong);box-shadow:var(--shadow);background:var(--paper)}
.slide.full > .morph{position:absolute;inset:0;border:0;border-radius:0;box-shadow:none}
.mx{position:absolute;left:0;top:0;overflow:hidden;transform-origin:0 0}
.mx > *{position:absolute;left:0;top:0}
.mx-from{transform-origin:50% 40%}
.mx-reveal{width:100%;height:100%}
.mx-fill{position:absolute;inset:0;background:#fff}
.mx-shadow{border-radius:12px;background:#fff}
.mx-pair,.mx-pair img{transform-origin:0 0}
.mx-pair img{position:absolute;left:0;top:0}
.mx-cursor{z-index:5;filter:drop-shadow(0 3px 6px rgba(0,0,0,.25))}
.mx-ripple{width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:4px solid var(--accent);opacity:0;z-index:4}
`);

  const morphs = {};
  // morph.js names its own folder, but a page elsewhere may reach it by another relative
  // path (../media/x), so the data is filed under the path the page actually loaded it by
  Deck.morph = (src, data) => {
    src = document.currentScript?.dataset.morph || src;
    morphs[src] = data;
    document.querySelectorAll(`[data-fx~="morph"][data-src="${src}"]`).forEach(buildMorph);
  };
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

  // preload every morph on the page so thumbnails have something to show
  const preload = () => document.querySelectorAll('[data-fx~="morph"]').forEach(loadMorph);
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", preload) : preload();
})();
