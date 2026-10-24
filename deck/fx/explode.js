// explode — stacked layers lift apart in 3D, each with a label. Children are the layers,
// bottom first; data-label on a layer names it.
// <div class="explode" data-fx="explode"><div class="card">…</div><div data-label="專案名稱">…</div>…</div>
(() => {
  const { register, gen, stop, kids, trigger, fire } = Deck.lib;
  Deck.lib.css(`
.explode{position:relative;transform-style:preserve-3d;transition:transform 1.4s var(--ease)}
.explode > .x-layer{position:absolute;inset:0;transform-style:preserve-3d;transition:transform 1.2s var(--ease) calc(var(--k) * .12s),background .8s,box-shadow .8s;border-radius:14px}
.explode.open{transform:perspective(2600px) translateX(-8%) rotateX(55deg) rotateZ(-28deg) scale(.82)}
.explode.open > .x-layer{transform:translateZ(calc(var(--k) * 90px))}
.explode.open > .x-layer:not(:first-child){background:rgb(255 255 255/.5);box-shadow:inset 0 0 0 1px rgb(13 95 116/.35),0 20px 50px rgb(15 26 29/.08)}
.x-tag{position:absolute;left:100%;top:50%;display:flex;align-items:center;gap:12px;white-space:nowrap;opacity:0;transform:translateY(-50%) rotateZ(28deg) rotateX(-55deg);transform-origin:0 50%;transition:opacity .6s calc(1s + var(--k) * .15s)}
.x-tag i{display:block;width:0;height:2px;background:var(--accent);transition:width .6s var(--ease) calc(1s + var(--k) * .15s)}
.x-tag span{font-size:30px;font-weight:650;color:var(--accent-ink)}
.explode.open .x-tag{opacity:1}
.explode.open .x-tag i{width:90px}
`);

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
})();
