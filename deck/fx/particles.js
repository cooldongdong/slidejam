// particles — dots drift in from everywhere and gather into the text (one-line titles).
// <h1 data-fx="particles">civictech.tw</h1>
(() => {
  const { register, gen, delay, clamp, lerp, stop, loopRaf, rnd, stageScale } = Deck.lib;
  Deck.lib.css(`
.fx-canvas{position:absolute;left:0;top:0;width:1600px;height:900px;pointer-events:none;z-index:4}
`);

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
})();
