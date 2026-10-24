// orbit — children sit around an ellipse; a dot travels it and lights each one in turn.
// <div class="orbit" data-fx="orbit" data-ms="14000" style="height:640px"><div>資料庫</div><div>API</div>…</div>
// A child with class="center" stays in the middle instead of joining the ring; nodes with
// data-link get a dashed line to it.
(() => {
  const { register, gen, ms, stop, loopRaf } = Deck.lib;
  Deck.lib.css(`
.orbit{position:relative;width:100%;height:620px}
.orbit > svg{position:absolute;inset:0;width:100%;height:100%}
.orbit-node{position:absolute;transform:translate(-50%,-50%);background:var(--surface);border:2px solid var(--line-strong);border-radius:var(--radius);padding:14px 22px;font-size:28px;font-weight:600;text-align:center;white-space:nowrap;transition:border-color .3s,background .3s,transform .3s}
.orbit-node small{display:block;font-size:18px;font-weight:400;color:var(--ink-muted);margin-top:4px}
.orbit-node.lit{border-color:var(--accent);background:var(--accent-soft);transform:translate(-50%,-50%) scale(1.08)}
.orbit > .center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}
`);

  register("orbit", {
    layout(e) {
      const nodes = [...e.children].filter((c) => !("gen" in c.dataset) && !c.classList.contains("center"));
      const w = e.clientWidth, h = e.clientHeight, cx = w / 2, cy = h / 2, rx = w / 2 - 110, ry = h / 2 - 50;
      let svg = e.querySelector("svg");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.gen = "";
        svg.innerHTML = '<ellipse fill="none" stroke="var(--line-strong)" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/><circle class="halo" r="22" fill="var(--accent)" opacity=".18"/><circle class="dot" r="10" fill="var(--accent)"/>';
        e.prepend(svg);
      }
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      Object.entries({ cx, cy, rx, ry }).forEach(([k, v]) => svg.querySelector("ellipse").setAttribute(k, v));
      nodes.forEach((n, i) => {
        const a = -Math.PI / 2 + (i / nodes.length) * Math.PI * 2;
        n.classList.add("orbit-node");
        n.style.left = cx + rx * Math.cos(a) + "px"; n.style.top = cy + ry * Math.sin(a) + "px";
      });
      svg.querySelectorAll(".link").forEach((l) => l.remove());
      if (e.querySelector(":scope > .center")) nodes.filter((n) => "link" in n.dataset).forEach((n) => {
        const x = parseFloat(n.style.left), y = parseFloat(n.style.top);
        const l = document.createElementNS(svg.namespaceURI, "path");
        Object.entries({ class: "link", d: `M${x} ${y} Q${(x + cx) / 2} ${cy} ${cx} ${cy}`, fill: "none", stroke: "var(--warn)", "stroke-width": 2.5, "stroke-dasharray": "8 8", opacity: 0.75 })
          .forEach(([k, v]) => l.setAttribute(k, v));
        svg.querySelector("ellipse").after(l);
      });
      return { nodes, svg, cx, cy, rx, ry };
    },
    setup(e) { this.layout(e); },
    enter(e) {
      const { nodes, svg, cx, cy, rx, ry } = this.layout(e), period = ms(e, 14000) / 1000;
      const dots = svg.querySelectorAll("circle");
      loopRaf(e, (t) => {
        const f = (t % period) / period, a = -Math.PI / 2 + f * Math.PI * 2;
        dots.forEach((d) => { d.setAttribute("cx", cx + rx * Math.cos(a)); d.setAttribute("cy", cy + ry * Math.sin(a)); });
        const k = Math.round(f * nodes.length) % nodes.length;
        nodes.forEach((n, j) => n.classList.toggle("lit", j === k));
      });
    },
    leave(e) { stop(e); },
  });
})();
