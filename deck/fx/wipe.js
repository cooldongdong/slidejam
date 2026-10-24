// wipe — a coloured band sweeps across, leaving the second picture behind it
// (before/after, light/dark). <div class="wipe" data-fx="wipe"><img src="before.png"><img src="after.png"></div>
(() => {
  const { register, gen, ms, stop, anim, kids, trigger, fire } = Deck.lib;
  Deck.lib.css(`
.dive,.wipe{position:relative;overflow:hidden;border-radius:14px;border:1px solid var(--line-strong);background:var(--surface)}
.dive > *,.wipe > :not(.wipe-band){display:block;width:100%;height:100%;object-fit:cover}
.dive > :nth-child(2),.wipe > :nth-child(2){position:absolute;inset:0}
.wipe > :nth-child(2){clip-path:polygon(0 0,0% 0,-30% 100%,0 100%)}
.wipe-band{position:absolute;top:-10%;height:120%;width:7%;left:-20%;background:var(--accent);opacity:.9;z-index:2}
`);

  register("wipe", {
    enter(e) {
      const [, b] = kids(e);
      const band = e.querySelector(".wipe-band") || gen("i", "wipe-band", e);
      stop(b); stop(band);
      const ang = (Math.atan((0.3 * e.offsetWidth) / (e.offsetHeight || 1)) * 180) / Math.PI;
      trigger(e, () => {
        const opt = { duration: ms(e, 1300), easing: "cubic-bezier(.65,0,.35,1)" };
        anim(b, [{ clipPath: "polygon(0 0, 0% 0, -30% 100%, 0 100%)" }, { clipPath: "polygon(0 0, 130% 0, 100% 100%, 0 100%)" }], opt);
        anim(band, [{ left: "-20%", transform: `skewX(${-ang}deg)` }, { left: "115%", transform: `skewX(${-ang}deg)` }], opt);
      }, 1);
    },
    step(e) { return fire(e); },
    leave(e) { stop(e); kids(e).forEach(stop); const band = e.querySelector(".wipe-band"); band && stop(band); },
  });
})();
