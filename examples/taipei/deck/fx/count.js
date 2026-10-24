// count — counts up to the number written inside. <span data-fx="count">1,165</span>
(() => {
  const { register, ms, delay, clamp, stop, loopRaf } = Deck.lib;

  register("count", {
    enter(e) {
      const final = (e.dataset.final = e.textContent); // leave() restores it, so this is the authored text
      const m = final.match(/-?[\d,]*\.?\d+/);
      if (!m) return;
      const target = parseFloat(m[0].replace(/,/g, "")), dp = (m[0].split(".")[1] || "").length, comma = m[0].includes(",");
      const fmt = (v) => { const s = v.toFixed(dp); return comma ? Number(s).toLocaleString("en-US", { minimumFractionDigits: dp }) : s; };
      const d = delay(e, 0.3), dur = ms(e, 1400) / 1000;
      loopRaf(e, (t) => {
        const k = clamp((t - d) / dur), eased = 1 - Math.pow(1 - k, 3);
        e.textContent = final.replace(m[0], fmt(target * eased));
        return k < 1;
      });
    },
    leave(e) { stop(e); if (e.dataset.final) e.textContent = e.dataset.final; },
  });
})();
