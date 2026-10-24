// spot — dims a screenshot except for a highlighted box. Several boxes
// (separated by ",") are stepped through with →. Boxes are "x y w h" in percent.
// <div class="spot" data-fx="spot" data-rects="8 30 40 12, 55 60 30 20"><img></div>
(() => {
  const { register, gen, delay, timers, stop } = Deck.lib;
  Deck.lib.css(`
.spot{position:relative;overflow:hidden;border-radius:var(--radius);border:1px solid var(--line-strong)}
.spot > img{display:block;width:100%}
.spot-hole{position:absolute;border-radius:10px;box-shadow:0 0 0 9999px rgb(10 16 19/0);outline:3px solid transparent;transition:all .7s var(--ease)}
.spot.lit .spot-hole{box-shadow:0 0 0 9999px rgb(10 16 19/.55);outline-color:var(--warn)}
`);

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
})();
