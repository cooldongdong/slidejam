// clickpath — a cursor walks a click-through demo over screenshots (children
// are the frames). The script is a list of commands separated by ";":
//   move X Y (percent of the box) · click · frame N · wait MS · loop
// <div class="clickpath" data-fx="clickpath" data-script="move 26 50; wait 1200; click; frame 1; …">
(() => {
  const { register, gen, timers, stop } = Deck.lib;
  Deck.lib.css(`
.clickpath{position:relative;aspect-ratio:16/10;border-radius:14px;overflow:hidden;border:1px solid var(--line-strong);box-shadow:0 30px 60px -30px rgb(15 26 29/.4);background:#fff}
.clickpath > :not(.cursor){position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s}
.clickpath > .on{opacity:1}
.cursor{position:absolute;left:70%;top:85%;width:34px;height:34px;transition:left 1s var(--ease),top 1s var(--ease);pointer-events:none;z-index:3}
.cursor svg{position:relative;z-index:2;filter:drop-shadow(0 2px 3px rgb(0 0 0/.3))}
.cursor .ring{position:absolute;left:-14px;top:-14px;width:36px;height:36px;border-radius:50%;border:3px solid var(--accent);opacity:0;transform:scale(.4)}
.cursor.click .ring{animation:ring .5s var(--ease)}
@keyframes ring{0%{opacity:1;transform:scale(.4)}100%{opacity:0;transform:scale(1.6)}}
`);

  register("clickpath", {
    enter(e) {
      const frames = [...e.children].filter((c) => !("gen" in c.dataset));
      let cur = e.querySelector(".cursor");
      if (!cur) {
        cur = gen("div", "cursor", e);
        cur.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg><i class="ring"></i>';
      }
      const cmds = (e.dataset.script || "").split(";").map((s) => s.trim().split(/\s+/)).filter((c) => c[0]);
      const frame = (k) => frames.forEach((f, j) => f.classList.toggle("on", j === k));
      const move = (x, y, fast) => { cur.style.transition = fast ? "none" : ""; cur.style.left = x + "%"; cur.style.top = y + "%"; };
      const start = cmds.find((c) => c[0] === "move");
      let ts = [];
      stop(e);
      timers.set(e, () => ts.forEach(clearTimeout));
      const run = () => {
        frame(0); move(start ? +start[1] : 70, start ? +start[2] : 85, true);
        let at = 400;
        for (const [c, a, b] of cmds) {
          const t = at;
          if (c === "wait") at += +a;
          else if (c === "move") { ts.push(setTimeout(() => move(+a, +b), t)); at += 1000; }
          else if (c === "click") ts.push(setTimeout(() => { cur.classList.remove("click"); void cur.offsetWidth; cur.classList.add("click"); }, t));
          else if (c === "frame") ts.push(setTimeout(() => frame(+a), t));
        }
        ts.push(setTimeout(run, at + 1500));
      };
      run();
    },
    leave(e) { stop(e); },
    thumb(e) { [...e.children].forEach((c, j) => c.classList.toggle("on", j === 0)); },
  });
})();
