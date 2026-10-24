// slot — odometer: each digit rolls on its own reel and lands. <div class="n" data-fx="slot">226</div>
(() => {
  const { register, $$, gen, ms, delay, stop, anim, keep, restore } = Deck.lib;
  Deck.lib.css(`
.slot-col{display:inline-block;height:1em;line-height:1;overflow:hidden;vertical-align:top}
.slot-strip{display:block}
.slot-strip > i{display:block;height:1em;font-style:normal}
`);

  register("slot", {
    enter(e) {
      restore(e); keep(e);
      const text = e.textContent;
      e.textContent = "";
      const chars = [...text], digits = chars.filter((c) => /\d/.test(c)).length;
      let di = 0;
      chars.forEach((ch) => {
        if (!/\d/.test(ch)) { gen("span", "", e).textContent = ch; return; }
        const fromRight = digits - 1 - di++;
        const col = gen("span", "slot-col", e), strip = gen("span", "slot-strip", col);
        const rounds = 1 + fromRight;
        strip.innerHTML = Array.from({ length: rounds * 10 + +ch + 1 }, (_, j) => `<i>${j % 10}</i>`).join("");
        anim(strip, [{ transform: "translateY(0)" }, { transform: `translateY(${-(rounds * 10 + +ch)}em)` }],
          { duration: ms(e, 1600) + fromRight * 220, delay: delay(e, 0.3) * 1000, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    },
    leave(e) { $$(".slot-strip", e).forEach(stop); restore(e); },
  });
})();
