// story — a list of steps next to screens; the highlighted step and the screen move together.
// Automatic every data-ms; with data-on="step" each → moves on.
// <div class="story" data-fx="story"><ol><li>…</li>…</ol><div class="phone"><div data-frames><img>…</div></div></div>
(() => {
  const { register, $$, ms, timers, stop, kids } = Deck.lib;
  Deck.lib.css(`
.story{display:grid;grid-template-columns:1fr auto;gap:64px;align-items:center}
.story ol,.story ul{list-style:none;margin:0;padding:0;display:grid;gap:22px;counter-reset:st}
.story li{counter-increment:st;display:grid;grid-template-columns:56px 1fr;opacity:.3;transition:opacity .5s}
.story li::before{content:counter(st);font:600 26px var(--mono);color:var(--accent)}
.story li.on{opacity:1}
.story li small{display:block;font-size:22px;color:var(--ink-muted)}
[data-frames]{position:relative;overflow:hidden}
[data-frames] > *{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top;opacity:0;transform:translateY(24px);transition:opacity .5s,transform .6s var(--ease)}
[data-frames] > .on{opacity:1;transform:none}
`);

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
})();
