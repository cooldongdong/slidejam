// parallax — layers at different depths drift and follow the mouse.
// <div class="parallax" data-fx="parallax"><img data-depth="0.2" …><div data-depth="1">…</div></div>
(() => {
  const { register, num, timers, stop, loopRaf, kids } = Deck.lib;
  Deck.lib.css(`
.parallax{position:relative;overflow:hidden}
.parallax > *{position:absolute}
`);

  register("parallax", {
    enter(e) {
      const layers = kids(e), slide = e.closest(".slide");
      let mx = 0, my = 0;
      const move = (ev) => { const r = e.getBoundingClientRect(); mx = (ev.clientX - r.left) / r.width - 0.5; my = (ev.clientY - r.top) / r.height - 0.5; };
      slide.addEventListener("mousemove", move);
      let sx = 0, sy = 0;
      loopRaf(e, (t) => {
        sx += (mx + Math.sin(t * 0.45) * 0.35 - sx) * 0.06; sy += (my + Math.cos(t * 0.35) * 0.25 - sy) * 0.06;
        layers.forEach((l) => { const d = num(l.dataset.depth, 0.5); l.style.transform = `translate3d(${-sx * d * 90}px, ${-sy * d * 60}px, 0) scale(${1 + d * 0.04})`; });
      });
      const cancel = timers.get(e);
      timers.set(e, () => { cancel(); slide.removeEventListener("mousemove", move); });
    },
    leave(e) { stop(e); },
  });
})();
