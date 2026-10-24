// flap — split-flap board: every character flips through letters before it lands.
// <p data-fx="flap">17 個議題</p>
(() => {
  const { register, num, delay, clamp, lerp, stop, loopRaf, rnd, keep, restore, splitChars } = Deck.lib;
  Deck.lib.css(`
.flap-cell{display:inline-block;min-width:.92em;text-align:center;margin:0 .03em;padding:.05em .04em;border-radius:.1em;color:#f2f5f6;background:linear-gradient(#232c31 0 49%,#11181b 49% 51%,#1b2327 51%);box-shadow:0 .05em .1em rgb(0 0 0/.3);transform-origin:50% 50%}
`);

  register("flap", {
    enter(e) {
      restore(e); keep(e);
      const cells = splitChars(e, "flap-cell");
      const glyphs = [...new Set(e.textContent.replace(/\s/g, ""))].join("") + "公民科技資料開放政府議題專案";
      const d = delay(e, 0.3), FL = 0.055, st = num(e.dataset.stagger, 0.04);
      const plan = cells.map((c, i) => ({ c, ch: c.textContent, stop: d + 0.5 + i * st + rnd(i, 3) * 0.35, seed: rnd(i, 7) * 10, digit: /\d/.test(c.textContent) }));
      const end = Math.max(...plan.map((p) => p.stop)) + FL;
      loopRaf(e, (t) => {
        for (const p of plan) {
          if (t >= p.stop) {
            p.c.textContent = p.ch;
            const k = clamp((t - p.stop) / FL);
            p.c.style.transform = `scaleY(${lerp(0.2, 1, 1 - Math.pow(1 - k, 3))})`;
          } else {
            const pool = p.digit ? "0123456789" : glyphs;
            p.c.textContent = t < d ? " " : pool[Math.floor((t + p.seed) / FL) % pool.length];
            p.c.style.transform = `scaleY(${Math.abs(Math.cos((((t + p.seed) % FL) / FL) * Math.PI))})`;
          }
        }
        return t < end;
      });
    },
    leave(e) { stop(e); restore(e); },
  });
})();
