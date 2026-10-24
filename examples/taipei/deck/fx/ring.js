// ring — a progress ring that fills to data-v of data-max. Put a label inside.
// <div class="ring" data-fx="ring" data-v="84" data-max="226"><b>84</b><span>有寫簡介</span></div>
(() => {
  const { register, num, ms, delay, clamp, stop, anim } = Deck.lib;
  Deck.lib.css(`
.ring{position:relative;width:280px;aspect-ratio:1;display:grid;place-content:center;text-align:center}
.ring-svg{position:absolute;inset:0;transform:rotate(-90deg)}
.ring-svg circle{fill:none;stroke-width:8}
.ring-track{stroke:var(--surface-2)}
.ring-arc{stroke:var(--accent);stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100}
.ring b{font:600 72px/1 var(--mono);color:var(--accent)}
.ring span{font-size:22px;color:var(--ink-muted);margin-top:8px}
`);

  register("ring", {
    setup(e) {
      if (e.querySelector(".ring-svg")) return;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.dataset.gen = ""; svg.classList.add("ring-svg"); svg.setAttribute("viewBox", "0 0 100 100");
      svg.innerHTML = '<circle cx="50" cy="50" r="45" pathLength="100" class="ring-track"/><circle cx="50" cy="50" r="45" pathLength="100" class="ring-arc"/>';
      e.prepend(svg);
    },
    frac(e) { return clamp(num(e.dataset.v, 0) / num(e.dataset.max, 100)); },
    enter(e) {
      this.setup(e);
      const arc = e.querySelector(".ring-arc");
      anim(arc, [{ strokeDashoffset: 100 }, { strokeDashoffset: 100 - this.frac(e) * 100 }], { duration: ms(e, 1500), delay: delay(e, 0.3) * 1000, easing: "cubic-bezier(.3,.7,.2,1)" });
    },
    leave(e) { const arc = e.querySelector(".ring-arc"); arc && stop(arc); },
    thumb(e) { const arc = e.querySelector(".ring-arc"); if (arc) arc.style.strokeDashoffset = 100 - this.frac(e) * 100; },
  });
})();
