// type — types the text out letter by letter. <p data-fx="type" data-ms="45">…</p>
(() => {
  const { register, ms, delay, clamp, stop, loopRaf } = Deck.lib;

  register("type", {
    enter(e) {
      const final = (e.dataset.final = e.textContent); // leave() restores it, so this is the authored text
      const chars = [...final], per = ms(e, 55) / 1000, d = delay(e, 0.4);
      e.classList.add("typing");
      loopRaf(e, (t) => {
        const n = clamp(Math.floor((t - d) / per), 0, chars.length);
        e.textContent = chars.slice(0, n).join("");
        if (n >= chars.length) { e.classList.remove("typing"); return false; }
      });
    },
    leave(e) { stop(e); e.classList.remove("typing"); if (e.dataset.final) e.textContent = e.dataset.final; },
  });
})();
