// dive — zooms into one spot of the first picture until it becomes the second.
// <div class="dive" data-fx="dive" data-at="30% 40%"><img src="a.png"><img src="b.png"></div>
(() => {
  const { register, num, delay, stop, anim, kids, trigger, fire } = Deck.lib;
  Deck.lib.css(`
.dive,.wipe{position:relative;overflow:hidden;border-radius:var(--radius);border:1px solid var(--line-strong);background:var(--surface)}
.dive > *,.wipe > :not(.wipe-band){display:block;width:100%;height:100%;object-fit:cover}
.dive > :nth-child(2),.wipe > :nth-child(2){position:absolute;inset:0}
.dive > :nth-child(2){opacity:0}
`);

  register("dive", {
    enter(e) {
      const [a, b] = kids(e);
      stop(a); stop(b);
      trigger(e, () => {
        a.style.transformOrigin = b.style.transformOrigin = e.dataset.at || "50% 50%";
        anim(a, [{ transform: "scale(1)", filter: "blur(0)", opacity: 1 }, { transform: `scale(${num(e.dataset.scale, 6)})`, filter: "blur(6px)", opacity: 0 }], { duration: 1400, easing: "cubic-bezier(.6,0,.2,1)" });
        anim(b, [{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 1400, delay: 200, easing: "cubic-bezier(.6,0,.2,1)" });
      }, 1);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); },
  });
})();
