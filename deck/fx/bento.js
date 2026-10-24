// bento — a feature grid. Tiles fly in from the nearest screen edge, overshoot a little
// as they lock into place, then the whole grid drifts closer. Tiles keep their own
// effects running inside (pan, slot, type, terminal, stack, compare…).
// Size tiles with class w2 / h2 (two columns wide / two rows tall).
// <div class="bento" data-fx="bento"><div class="tile w2"><div class="head"><b>標題</b><span>一句話</span></div>…</div>…</div>
(() => {
  const { register, num, delay, stop, anim, kids, rnd, stageScale } = Deck.lib;
  Deck.lib.css(`
.bento{display:grid;grid-template-columns:repeat(var(--cols,4),1fr);grid-auto-rows:1fr;gap:18px;transform-origin:50% 50%}
.bento > .w2{grid-column:span 2}.bento > .h2{grid-row:span 2}
.tile{position:relative;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:var(--surface);box-shadow:0 20px 60px rgb(15 26 29/.07)}
.tile.dark{background:#0f1a1d;border-color:#1c2a2e;color:#f2f5f5}
.tile .head{position:absolute;left:24px;top:20px;right:24px;z-index:3}
.tile .head b{display:block;font-size:26px;font-weight:650;color:var(--ink)}
.tile .head span{display:block;font-size:16px;color:var(--ink-muted);margin-top:6px}
.tile .head.pill b,.tile .head.pill span{display:inline-block;background:rgb(255 255 255/.9);padding:3px 10px;border-radius:9px}
.tile.dark .head b{color:#f2f5f5}.tile.dark .head span{color:#9fb0b4}
.tile .vis{position:absolute;left:24px;right:24px;top:96px;bottom:0;overflow:hidden;border-radius:12px 12px 0 0;box-shadow:0 0 0 1px var(--line);border:0}
.tile .vis.pan > img{width:100%}
.tile > .fill{position:absolute;inset:0}
.tile .big{position:absolute;left:24px;bottom:20px;font:600 120px/.95 var(--mono);letter-spacing:-.04em}
.tile .big + small,.tile .big small{display:block;font-size:18px;color:#9fb0b4;letter-spacing:0;font-family:var(--sans);margin-top:8px}
.tile .phone{position:absolute;left:50%;top:92px;width:190px;margin-left:-95px;padding:7px;border-radius:32px}
.tile .phone::before{top:14px;width:50px;height:14px;margin-left:-25px}
.tile .phone > .pan{border:0;border-radius:26px;height:100%}
.tile .terminal{position:absolute;left:0;right:0;top:84px;bottom:0;background:none;box-shadow:none;font-size:15px;padding:12px 24px}
.dots{position:absolute;left:24px;right:24px;bottom:20px;display:flex;flex-wrap:wrap;gap:7px}
.dots > i{width:25px;height:25px;border-radius:7px;background:var(--c,var(--accent))}
.tile > img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
.tile > .pan:not(.vis),.tile > .zoom:not(.vis),.tile > [data-fx~="cycle"]:not(.vis){position:absolute;inset:0;border:0;border-radius:0;height:auto}
.tile > [data-fx~="cycle"] > *{width:100%;height:100%;object-fit:cover;object-position:top}
.tile .cap{position:absolute;left:0;right:0;bottom:0;padding:44px 24px 18px;background:linear-gradient(to top,var(--surface) 55%,transparent);z-index:2}
.tile .cap b{display:block;font-size:30px;color:var(--ink)}
.tile .cap .tag{display:inline-block;font:17px var(--mono);color:var(--warn);border:1.5px solid var(--warn);border-radius:999px;padding:2px 12px;margin-bottom:8px;background:var(--surface)}
.tile.dark .cap{background:linear-gradient(to top,#0f1719 55%,transparent)}
.tile.dark .cap b{color:#fff}
.tile .wish{position:absolute;left:24px;right:24px;bottom:22px;border:1.5px solid var(--accent);border-radius:10px;padding:10px 14px;font-size:18px;color:var(--ink);background:var(--surface);min-height:46px}
`);

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
})();
