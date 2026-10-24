// mark — a highlighter sweeps in behind the text. <b data-fx="mark">重點</b>
(() => {
  const { register, delay, timers, stop } = Deck.lib;
  Deck.lib.css(`
[data-fx~="mark"]{background:linear-gradient(transparent 58%,var(--warn-soft) 58%) no-repeat 0 0/0% 100%;transition:background-size .9s var(--ease)}
[data-fx~="mark"].marked{background-size:100% 100%}
`);

  register("mark", {
    enter(e) { e.classList.remove("marked"); stop(e); const t = setTimeout(() => e.classList.add("marked"), delay(e, 0.8) * 1000); timers.set(e, () => clearTimeout(t)); },
    leave(e) { stop(e); e.classList.remove("marked"); },
    thumb(e) { e.classList.add("marked"); },
  });
})();
