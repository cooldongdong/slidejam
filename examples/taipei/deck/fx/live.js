// live — a real website running inside the slide, drawn at a desktop (or
// phone) size and scaled to fit. Needs a network connection.
// <div class="live" data-fx="live" data-src="https://…" data-w="1440" data-h="900"></div>
(() => {
  const { register, gen, num } = Deck.lib;
  Deck.lib.css(`
.live{position:relative;overflow:hidden}
.live > iframe{position:absolute;left:0;top:0;border:0;transform-origin:0 0}
`);

  register("live", {
    enter(e) {
      let f = e.querySelector("iframe");
      const w = num(e.dataset.w, 1440), h = num(e.dataset.h, 900);
      if (!f) {
        f = gen("iframe", "", e);
        f.src = e.dataset.src; f.loading = "lazy"; f.allow = "geolocation; fullscreen";
        Object.assign(f.style, { width: w + "px", height: h + "px" });
      }
      if (!e.style.aspectRatio && !e.style.height) e.style.aspectRatio = `${w}/${h}`;
      f.style.transform = `scale(${e.clientWidth / w})`;
    },
  });
})();
