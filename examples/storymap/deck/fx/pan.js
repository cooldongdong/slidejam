// pan — slowly scrolls a tall screenshot inside its box, back and forth.
// <div class="pan" data-fx="pan" style="height:500px"><img src="tall.png"></div>
(() => {
  const { register, ms, delay, stop, anim } = Deck.lib;
  Deck.lib.css(`
.pan,.zoom{position:relative;overflow:hidden;border-radius:14px;border:1px solid var(--line-strong);background:var(--surface)}
.pan > img{display:block;width:100%;height:auto}
`);

  register("pan", {
    enter(e) {
      const img = e.querySelector("img, video");
      const go = () => {
        const dist = img.getBoundingClientRect().height / (e.getBoundingClientRect().height / e.clientHeight) - e.clientHeight;
        if (dist <= 0) return;
        anim(img, [{ transform: "translateY(0)" }, { transform: `translateY(${-dist}px)` }], { duration: ms(e, 7000), delay: delay(e, 1.2) * 1000, iterations: Infinity, direction: "alternate" });
      };
      img.complete !== false ? go() : img.addEventListener("load", go, { once: true });
    },
    leave(e) { const img = e.querySelector("img, video"); img && stop(img); },
  });
})();
