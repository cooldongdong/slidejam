// chat — messages pop in one by one, with "typing…" before the other side's.
// class="me" puts a bubble on the right; class="link" makes a link preview.
// <div class="chat" data-fx="chat"><p>有網站整理公民科技專案嗎？</p><p class="me">有！</p>…</div>
(() => {
  const { register, gen, ms, delay, timers, stop, kids } = Deck.lib;
  Deck.lib.css(`
.chat{display:flex;flex-direction:column;gap:12px;padding:56px 18px 18px;background:var(--chat-bg);font-size:17px}
.chat > p,.chat-typing{margin:0;max-width:80%;align-self:flex-start;background:var(--surface);border-radius:18px 18px 18px 6px;padding:10px 14px;font-size:17px;line-height:1.45;color:var(--ink);box-shadow:0 2px 4px rgb(0 0 0/.06)}
.chat > p{opacity:0;transform:translateY(12px) scale(.96);transition:opacity .35s,transform .45s var(--ease)}
.chat > p.on{opacity:1;transform:none}
.chat > p.me{align-self:flex-end;background:var(--accent);color:var(--on-accent);border-radius:18px 18px 6px 18px}
.chat > p.link{background:var(--surface);color:var(--ink);border:1px solid var(--line);padding:0;overflow:hidden}
.chat > p.link b{display:block;padding:10px 14px 2px;color:var(--accent-ink)}
.chat > p.link small{display:block;padding:0 14px 10px;color:var(--ink-muted);font-size:14px}
.chat-typing{display:flex;gap:5px;padding:14px}
.chat-typing i{width:7px;height:7px;border-radius:50%;background:var(--ink-muted);animation:dots 1s infinite}
.chat-typing i:nth-child(2){animation-delay:.15s}.chat-typing i:nth-child(3){animation-delay:.3s}
@keyframes dots{0%,60%,100%{transform:none;opacity:.5}30%{transform:translateY(-4px);opacity:1}}
body.editing .chat > p,body.annotating .chat > p{opacity:1;transform:none}
`);

  register("chat", {
    enter(e) {
      const msgs = kids(e);
      msgs.forEach((m) => m.classList.remove("on"));
      e.querySelector(".chat-typing")?.remove();
      stop(e);
      const ts = [];
      timers.set(e, () => ts.forEach(clearTimeout));
      const gap = ms(e, 1300);
      let at = delay(e, 0.6) * 1000;
      msgs.forEach((m) => {
        if (!m.classList.contains("me")) {
          ts.push(setTimeout(() => { const t = gen("p", "chat-typing", e, m); t.innerHTML = "<i></i><i></i><i></i>"; }, at));
          at += 800;
        }
        ts.push(setTimeout(() => { e.querySelector(".chat-typing")?.remove(); m.classList.add("on"); }, at));
        at += gap;
      });
    },
    leave(e) { stop(e); e.querySelector(".chat-typing")?.remove(); },
    thumb(e) { kids(e).forEach((m) => m.classList.add("on")); },
  });
})();
