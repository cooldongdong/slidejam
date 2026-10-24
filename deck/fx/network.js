// network — topics as hubs, their projects as dots around them, slowly turning in 3D.
// <div class="network" data-fx="network"><div><b>政府預算</b><span>twbudget</span>…</div>…</div>
(() => {
  const { register, $$, delay, clamp, stop, loopRaf, kids, rnd } = Deck.lib;
  Deck.lib.css(`
.network{position:relative;overflow:hidden}
.nw-lines{position:absolute;inset:0;width:100%;height:100%}
.nw-group{display:contents}
.nw-group > b{position:absolute;left:0;top:0;white-space:nowrap;font-size:22px;font-weight:650;color:rgb(15 26 29/var(--lab,0));transform-origin:50% calc(100% + 22px)}
.nw-group > b::after{content:"";position:absolute;left:50%;top:calc(100% + 8px);width:28px;height:28px;margin-left:-14px;border-radius:50%;background:#fff;border:3px solid var(--c);box-sizing:border-box}
.nw-dot{position:absolute;left:-5px;top:-5px;width:10px;height:10px;border-radius:50%;background:var(--c);font-size:0;overflow:hidden}
`);

  const PALETTE = ["#0d5f74", "#b45309", "#7c3aed", "#15803d", "#be185d", "#1d4ed8", "#a16207", "#0f766e"];
  register("network", {
    build(e) {
      if (e._nw) return e._nw;
      const groups = kids(e), hubs = [], dots = [];
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.dataset.gen = ""; svg.classList.add("nw-lines");
      e.prepend(svg);
      groups.forEach((g, i) => {
        const y = 1 - ((i + 0.5) / groups.length) * 2, r = Math.sqrt(1 - y * y), th = i * 2.39996;
        const color = g.dataset.color || PALETTE[i % PALETTE.length];
        g.classList.add("nw-group"); g.style.setProperty("--c", color);
        const label = g.querySelector("b"), members = $$("span", g);
        const hub = { el: label, x: Math.cos(th) * r, y: y * 0.75, z: Math.sin(th) * r, n: members.length };
        hubs.push(hub);
        members.forEach((m, j) => {
          const u = rnd(j, i + 1) * 2 - 1, a = rnd(j, i + 7) * Math.PI * 2, d = (0.08 + Math.sqrt(members.length) * 0.03) * Math.cbrt(rnd(j, i + 3)), s = Math.sqrt(1 - u * u);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("stroke", color); svg.appendChild(line);
          m.classList.add("nw-dot");
          dots.push({ el: m, hub, line, x: hub.x + Math.cos(a) * s * d, y: hub.y + u * d, z: hub.z + Math.sin(a) * s * d, delay: rnd(j, i + 11) * 0.8 });
        });
      });
      return (e._nw = { svg, hubs, dots });
    },
    draw(e, t) {
      const { svg, hubs, dots } = this.build(e);
      const W = e.offsetWidth, H = e.offsetHeight, RAD = Math.min(W, H * 1.4) * 0.42;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const yaw = -0.6 + t * 0.12, pitch = 0.3, boom = 1 - Math.pow(1 - clamp((t - 0.2) / 2), 5);
      const proj = (p) => {
        let x = p.x * RAD * boom, y = p.y * RAD * boom, z = p.z * RAD * boom;
        [x, z] = [x * Math.cos(yaw) - z * Math.sin(yaw), x * Math.sin(yaw) + z * Math.cos(yaw)];
        [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
        const s = 1100 / (1100 + z + 300);
        return { x: W / 2 + x * s, y: H / 2 + y * s, s, z };
      };
      const fogOf = (z) => clamp(1 - (z + RAD * 0.4) / (RAD * 2.6));
      const hp = new Map(hubs.map((h) => [h, proj(h)]));
      for (const d of dots) {
        const p = proj(d), h = hp.get(d.hub), k = clamp((t - 0.4 - d.delay) / 1.2), f = fogOf(p.z);
        d.el.style.transform = `translate(${p.x}px, ${p.y}px) scale(${p.s})`;
        d.el.style.opacity = k * (0.35 + 0.65 * f);
        d.line.setAttribute("x1", h.x); d.line.setAttribute("y1", h.y); d.line.setAttribute("x2", p.x); d.line.setAttribute("y2", p.y);
        d.line.setAttribute("opacity", k * 0.5 * (0.35 + 0.65 * f));
      }
      const lab = clamp((t - 2) / 1);
      for (const h of hubs) {
        const p = hp.get(h), f = fogOf(p.z);
        h.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, calc(-100% - 22px)) scale(${0.7 + p.s * 0.4})`;
        h.el.style.opacity = 0.4 + 0.6 * f;
        h.el.style.setProperty("--lab", lab * clamp((f - 0.35) / 0.25));
        h.el.style.zIndex = Math.round(1000 - p.z);
      }
    },
    setup(e) { this.draw(e, 6); },
    enter(e) { loopRaf(e, (t) => this.draw(e, t)); },
    leave(e) { stop(e); },
  });
})();
