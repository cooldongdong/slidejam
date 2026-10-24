// terminal — the command types itself, then the output prints line by line.
// <div class="terminal" data-fx="terminal"><div class="cmd">curl …</div><div>{</div>…</div>
(() => {
  const { register, delay, clamp, stop, loopRaf, kids, keep, restore } = Deck.lib;
  Deck.lib.css(`
.terminal{background:var(--dark);color:var(--code);font:22px/1.55 var(--mono);border-radius:var(--radius);padding:26px 30px;overflow:hidden;box-shadow:0 30px 60px -30px rgb(0 0 0/.5)}
.terminal > *{white-space:pre}
.terminal .cmd{color:var(--on-dark);min-height:1.55em;white-space:pre-wrap;word-break:break-all}
.terminal .cmd::before{content:"$ ";color:var(--code-prompt)}
.terminal > :not(.cmd){opacity:0}
.terminal > .on{opacity:1}
body.editing .terminal > *,body.annotating .terminal > *{opacity:1}
.terminal .k{color:var(--code-key)}.terminal .s{color:var(--code-str)}.terminal .n{color:var(--code-num)}
`);

  register("terminal", {
    enter(e) {
      const [cmd, ...lines] = kids(e);
      lines.forEach((l) => l.classList.remove("on"));
      restore(cmd); keep(cmd);
      const text = cmd.textContent, per = 0.045, d = delay(e, 0.6);
      cmd.textContent = "";
      cmd.classList.add("typing");
      loopRaf(e, (t) => {
        const n = clamp(Math.floor((t - d) / per), 0, text.length);
        cmd.textContent = text.slice(0, n);
        if (n < text.length) return;
        cmd.classList.remove("typing");
        const shown = Math.floor((t - d - text.length * per - 0.5) / 0.07);
        lines.forEach((l, i) => l.classList.toggle("on", i < shown));
        return shown < lines.length;
      });
    },
    leave(e) { stop(e); const cmd = kids(e)[0]; cmd.classList.remove("typing"); restore(cmd); },
    thumb(e) { kids(e).forEach((l) => l.classList.add("on")); },
  });
})();
