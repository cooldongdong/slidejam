// hotspots — pulsing dots on a screenshot; each → opens the next one's note.
// Each note is a child with data-at="x y" (percent); add data-auto to step by itself.
// <div class="hotspots" data-fx="hotspots"><img src="…"><p data-at="62 18">每個專案有自己的網址</p></div>
(() => {
  const { register, gen, ms, delay, timers, stop, kids } = Deck.lib;
  Deck.lib.css(`
.hotspots{position:relative}
.hotspots > img{display:block;width:100%;border-radius:var(--radius);border:1px solid var(--line-strong)}
.hs-dot{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--surface) 90%,transparent);opacity:0;transform:scale(.3);transition:opacity .4s,transform .5s var(--ease)}
.hs-dot::after{content:"";position:absolute;inset:-4px;border-radius:50%;border:3px solid var(--accent);animation:hs-pulse 1.8s ease-out infinite}
@keyframes hs-pulse{from{transform:scale(1);opacity:.8}to{transform:scale(2.6);opacity:0}}
.hotspots.lit .hs-dot{opacity:1;transform:none}
.hs-note{position:absolute;margin:0;transform:translate(28px,-50%) scale(.9);transform-origin:0 50%;max-width:420px;background:var(--surface);border-radius:12px;padding:12px 18px;font-size:24px;line-height:1.45;color:var(--ink);box-shadow:0 18px 40px -12px rgb(var(--shadow-rgb)/.35);opacity:0;transition:opacity .4s,transform .5s var(--ease);z-index:3}
.hs-note.open{opacity:1;transform:translate(28px,-50%)}
body.editing .hs-note,body.annotating .hs-note,.thumb .hs-note:first-of-type{opacity:1}
`);

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
})();
