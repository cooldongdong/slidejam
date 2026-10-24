// pop — children pop in one by one with a little bounce (dots, badges, logos).
// <div data-fx="pop"><i></i><i></i>…</div>
(() => {
  const { register, num, delay, stop, anim, kids } = Deck.lib;

  register("pop", {
    enter(e) {
      const st = num(e.dataset.stagger, 0.05), d = delay(e, 0.8);
      kids(e).forEach((c, i) => anim(c, [{ transform: "scale(0)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }],
        { duration: 500, delay: (d + i * st) * 1000, easing: "cubic-bezier(.34,1.56,.64,1)" }));
    },
    leave(e) { kids(e).forEach(stop); },
  });
})();
