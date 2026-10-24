// collapse — everything shrinks into the centre and one last thing appears (an ending).
// The child with data-end is what's left. <div class="collapse" data-fx="collapse">…<div data-end>civictech.tw</div></div>
(() => {
  const { register, delay, stop, anim, kids, EASE, trigger, fire, stageScale } = Deck.lib;
  Deck.lib.css(`
.collapse{position:relative}
.collapse > [data-end]{position:absolute;inset:0;display:grid;place-items:center;opacity:0;pointer-events:none}
`);

  register("collapse", {
    enter(e) {
      const items = kids(e).filter((c) => !("end" in c.dataset)), end = e.querySelector("[data-end]");
      items.forEach(stop); end && stop(end);
      trigger(e, () => {
        const er = e.getBoundingClientRect(), s = stageScale(e);
        items.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const dx = (er.left + er.width / 2 - (r.left + r.width / 2)) / s, dy = (er.top + er.height / 2 - (r.top + r.height / 2)) / s;
          anim(c, [{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.1)`, opacity: 0 }], { duration: 900, delay: i * 70, easing: "cubic-bezier(.7,0,.3,1)" });
        });
        if (end) anim(end, [{ opacity: 0, transform: "scale(.6)", filter: "blur(10px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }], { duration: 900, delay: 800 + items.length * 70, easing: EASE });
      }, 1.2);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); },
  });
})();
