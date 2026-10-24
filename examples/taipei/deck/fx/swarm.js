// swarm — lots of small things rush in from deep space and settle into place.
// <div class="swarm" data-fx="swarm"><span>…</span>×100</div>
(() => {
  const { register, ms, delay, stop, anim, kids, rnd, EASE } = Deck.lib;
  Deck.lib.css(`
.swarm{display:flex;flex-wrap:wrap;gap:8px;align-content:center}
.swarm > *{font-size:17px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:4px 10px;color:var(--ink-2)}
`);

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
})();
