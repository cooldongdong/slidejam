// bars — horizontal bars that grow in. <div data-fx="bars" data-max="65">
//   <div class="bar" data-v="60"><span>label</span><em>60%</em></div> …
(() => {
  const { register, $$, gen, num, delay, timers, stop } = Deck.lib;
  Deck.lib.css(`
[data-fx~="bars"]{display:grid;row-gap:12px}
.bar{display:grid;grid-template-columns:330px 1fr 200px;column-gap:24px;align-items:center}
.bar > span{font-size:24px;color:var(--ink-2);text-align:right;white-space:nowrap}
.bar > em{font:normal 24px var(--mono);color:var(--ink-muted)}
.bar-track{height:26px;background:var(--surface-2);border-radius:4px;overflow:hidden}
.bar-fill{display:block;height:100%;width:0;background:var(--accent);transition:width 1.1s var(--ease)}
.bar.hot > span,.bar.hot > em{color:var(--warn);font-weight:650}
.bar.hot .bar-fill{background:var(--warn)}
`);

  register("bars", {
    setup(e) {
      if ("ready" in e.dataset) return;
      e.dataset.ready = "";
      $$(".bar", e).forEach((b) => gen("i", "bar-fill", gen("div", "bar-track", b, b.children[1])));
    },
    widths(e, on) {
      const max = num(e.dataset.max, Math.max(...$$(".bar", e).map((b) => +b.dataset.v)));
      $$(".bar", e).forEach((b) => ($$(".bar-fill", b)[0].style.width = on ? (b.dataset.v / max) * 100 + "%" : "0"));
    },
    enter(e) { this.setup(e); this.widths(e, false); stop(e); const t = setTimeout(() => this.widths(e, true), delay(e, 350)); timers.set(e, () => clearTimeout(t)); },
    leave(e) { stop(e); },
    thumb(e) { this.setup(e); this.widths(e, true); },
  });
})();
