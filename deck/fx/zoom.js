// zoom — pushes in on one spot. <div class="zoom" data-fx="zoom" data-at="22% 52%" data-scale="1.9"><img></div>
(() => {
  const { register, num, ms, delay, stop, anim } = Deck.lib;
  Deck.lib.css(`
.pan,.zoom{position:relative;overflow:hidden;border-radius:var(--radius);border:1px solid var(--line-strong);background:var(--surface)}
.zoom > img{display:block;width:100%;height:100%;object-fit:cover}
`);

  register("zoom", {
    enter(e) {
      const img = e.firstElementChild;
      img.style.transformOrigin = e.dataset.at || "50% 50%";
      anim(img, [{ transform: "scale(1)" }, { transform: `scale(${num(e.dataset.scale, 1.8)})` }], {
        duration: ms(e, 5000), delay: delay(e, 1) * 1000,
        ...(e.dataset.once != null ? {} : { iterations: Infinity, direction: "alternate" }),
      });
    },
    leave(e) { e.firstElementChild && stop(e.firstElementChild); },
  });
})();
