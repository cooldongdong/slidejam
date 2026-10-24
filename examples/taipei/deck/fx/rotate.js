// rotate — one word in a sentence keeps changing. Words are separated by ｜.
// <p>在這裡，你可以<span data-fx="rotate">讀別人的經驗｜串接資料｜找到夥伴</span></p>
(() => {
  const { register, gen, ms, timers, stop, keep, restore, restoreLater } = Deck.lib;
  Deck.lib.css(`
.rot-box{display:inline-block;position:relative;vertical-align:bottom;height:1.3em;overflow:hidden;transition:width .5s var(--ease);color:var(--accent)}
.rot-word{position:absolute;left:0;top:0;white-space:nowrap;transform:translateY(100%);opacity:0;transition:transform .6s var(--ease),opacity .5s}
.rot-word.on{transform:none;opacity:1}
.rot-word.out{transform:translateY(-100%);opacity:0}
`);

  register("rotate", {
    enter(e) {
      restore(e); keep(e);
      const words = e.textContent.split(/[|｜]/).map((w) => w.trim()).filter(Boolean);
      e.textContent = "";
      const box = gen("span", "rot-box", e);
      const spans = words.map((w) => { const s = gen("span", "rot-word", box); s.textContent = w; return s; });
      let k = 0;
      const set = (first) => {
        const prev = (k - 1 + spans.length) % spans.length;
        spans.forEach((s, j) => (s.className = "rot-word" + (j === k ? " on" : !first && j === prev ? " out" : "")));
        box.style.width = spans[k].offsetWidth + "px";
      };
      set(true); stop(e);
      const id = setInterval(() => { k = (k + 1) % spans.length; set(); }, ms(e, 2200));
      timers.set(e, () => clearInterval(id));
    },
    leave(e) { restoreLater(e); },
    thumb(e) { if (!e.querySelector(".rot-box")) e.textContent = e.textContent.split(/[|｜]/)[0]; },
  });
})();
