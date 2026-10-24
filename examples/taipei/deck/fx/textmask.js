// textmask — big words filled with a picture that slowly drifts.
// <h1 data-fx="textmask" data-img="media/photo.jpg">公民科技</h1>
(() => {
  const { register, ms, stop, anim } = Deck.lib;
  Deck.lib.css(`
.textmask{background-size:cover;background-position:center;-webkit-background-clip:text;background-clip:text;color:transparent !important}
`);

  register("textmask", {
    setup(e) { e.classList.add("textmask"); e.style.backgroundImage = `url("${e.dataset.img}")`; },
    enter(e) {
      this.setup(e);
      anim(e, [{ backgroundPosition: "0% 20%", backgroundSize: "140%" }, { backgroundPosition: "100% 80%", backgroundSize: "170%" }],
        { duration: ms(e, 9000), iterations: Infinity, direction: "alternate" });
    },
    leave(e) { stop(e); },
  });
})();
