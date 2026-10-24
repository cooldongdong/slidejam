// letters — each character rises out of a blur, one after another. <h1 data-fx="letters">
(() => {
  const { register, num, delay, anim, EASE, keep, restore, splitChars } = Deck.lib;
  Deck.lib.css(`
.ltr{display:inline-block}
`);

  register("letters", {
    enter(e) {
      restore(e); keep(e);
      const st = num(e.dataset.stagger, 0.05), d = delay(e, 0.2);
      splitChars(e, "ltr").forEach((c, i) => anim(c,
        [{ transform: "translateY(105%) rotate(8deg)", filter: "blur(14px)", opacity: 0 }, { transform: "none", filter: "blur(0)", opacity: 1 }],
        { duration: 1000, delay: (d + i * st) * 1000, easing: EASE }));
    },
    leave(e) { restore(e); },
  });
})();
