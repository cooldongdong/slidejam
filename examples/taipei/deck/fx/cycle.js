// cycle — shows its children one at a time, cross-fading. <div data-fx="cycle" data-ms="3000"><img><img></div>
(() => {
  const { register, gen, ms, timers, stop, kids } = Deck.lib;
  Deck.lib.css(`
[data-fx~="cycle"]{position:relative}
[data-fx~="cycle"] > *{transition:opacity .6s var(--ease)}
[data-fx~="cycle"] > :not(:first-child){position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
[data-fx~="cycle"] > :not(.on){opacity:0}
`);

  register("cycle", {
    enter(e) {
      const kids = [...e.children].filter((c) => !("gen" in c.dataset));
      let k = 0;
      const set = () => kids.forEach((c, j) => c.classList.toggle("on", j === k));
      set(); stop(e);
      const id = setInterval(() => { k = (k + 1) % kids.length; set(); }, ms(e, 3000));
      timers.set(e, () => clearInterval(id));
    },
    leave(e) { stop(e); },
    thumb(e) { [...e.children].forEach((c, j) => c.classList.toggle("on", j === 0)); },
  });
})();
