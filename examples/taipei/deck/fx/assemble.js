// assemble — children fly in from scattered spots and settle into the layout.
// <div class="grid3" data-fx="assemble" data-stagger="0.12">…</div>
(() => {
  const { register, gen, num, delay, stop, anim, kids } = Deck.lib;

  register("assemble", {
    enter(e) {
      const kids = [...e.children].filter((c) => !("gen" in c.dataset));
      const st = num(e.dataset.stagger, 0.12), d = delay(e, 0.2);
      kids.forEach((c, i) => {
        // deterministic scatter so every run looks the same
        const r = (n) => ((Math.sin((i + 1) * 99.13 * n) * 43758.5453) % 1 + 1) % 1;
        const dx = (r(1) - 0.5) * 900, dy = (r(2) - 0.5) * 600, rot = (r(3) - 0.5) * 30;
        anim(c, [{ opacity: 0, transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.7)` }, { opacity: 1, transform: "none" }],
          { duration: 1000, delay: (d + i * st) * 1000, easing: "cubic-bezier(.16,1,.3,1)" });
      });
    },
    leave(e) { [...e.children].forEach(stop); },
  });
})();
