// compare — two pictures split by a line that sweeps back and forth (light/dark, before/after).
// <div class="compare" data-fx="compare"><img src="light.png"><img src="dark.png"></div>
(() => {
  const { register, gen, ms, stop, loopRaf, kids } = Deck.lib;
  Deck.lib.css(`
.compare{position:relative;overflow:hidden}
.compare > img{display:block;width:100%;height:100%;object-fit:cover;object-position:top left}
.compare > img:nth-of-type(2){position:absolute;inset:0}
.cmp-line{position:absolute;top:0;bottom:0;width:3px;margin-left:-1.5px;background:#fff;box-shadow:0 0 18px rgb(0 0 0/.35);z-index:2}
`);

  register("compare", {
    setup(e) { if (!e.querySelector(".cmp-line")) gen("i", "cmp-line", e); this.at(e, 50); },
    at(e, x) { const [, b] = kids(e); if (b) b.style.clipPath = `inset(0 0 0 ${x}%)`; e.querySelector(".cmp-line").style.left = x + "%"; },
    enter(e) { this.setup(e); const per = ms(e, 3200) / 1000; loopRaf(e, (t) => this.at(e, 50 + 38 * Math.sin((t / per) * Math.PI * 2))); },
    leave(e) { stop(e); },
  });
})();
