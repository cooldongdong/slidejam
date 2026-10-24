// feature — tiles of a grid take turns being the big one, the others making room.
// <div class="feature" data-fx="feature" data-ms="2800"><div class="card">…</div>…</div>
(() => {
  const { register, ms, timers, stop, anim, kids, EASE, stageScale } = Deck.lib;
  Deck.lib.css(`
.feature{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:1fr;gap:20px;grid-auto-flow:dense}
.feature > .featured{grid-column:span 2;grid-row:span 2;order:-1}
`);

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
})();
