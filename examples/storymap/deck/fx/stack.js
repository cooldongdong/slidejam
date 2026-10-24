// stack — a pile of cards; the front one moves to the back every few seconds.
// <div class="stack" data-fx="stack"><div class="card">…</div><div class="card">…</div>…</div>
(() => {
  const { register, ms, delay, clamp, stop, loopRaf, kids } = Deck.lib;
  Deck.lib.css(`
.stack{position:relative}
.stack > *{position:absolute;left:0;right:0;top:0;transform-origin:50% 0}
.stack .card{padding:16px 18px;border-radius:14px;box-shadow:0 10px 30px rgb(15 26 29/.12)}
.stack .card b{display:block;font-size:19px;color:var(--ink)}
.stack .card p{font-size:14px;line-height:1.5;margin-top:6px}
.stack .card .tag{font-size:12px;margin-bottom:8px}
`);

  register("stack", {
    place(e, t) {
      const cards = kids(e), n = cards.length, every = ms(e, 1600) / 1000;
      cards.forEach((c, i) => {
        const phase = ((t / every + (n - i)) % n + n) % n, depth = Math.floor(phase);
        const enter = depth === 0 ? 1 - Math.pow(2, -10 * clamp((phase % 1) / 0.35)) : 1;
        c.style.zIndex = n - depth;
        c.style.transform = `translateY(${depth * 16}px) scale(${1 - depth * 0.05}) rotate(${(1 - enter) * -7}deg)`;
        c.style.opacity = 1 - depth * 0.3;
      });
    },
    setup(e) { this.place(e, 0); },
    enter(e) { const d = delay(e, 1.2); loopRaf(e, (t) => this.place(e, Math.max(0, t - d))); },
    leave(e) { stop(e); },
  });
})();
