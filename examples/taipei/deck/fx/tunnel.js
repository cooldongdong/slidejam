// tunnel — names stream past on the walls of a tunnel ("this many projects").
// <div class="tunnel" data-fx="tunnel"><span>零時政府</span><span>萌典</span>…</div>
(() => {
  const { register, num, clamp, stop, loopRaf, kids } = Deck.lib;
  Deck.lib.css(`
.tunnel{position:relative;overflow:hidden;perspective:900px;transform-style:preserve-3d}
.tn-chip{position:absolute;left:50%;top:50%;white-space:nowrap;font-size:22px;font-weight:600;color:var(--ink-2);background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:6px 16px;backface-visibility:hidden}
`);

  register("tunnel", {
    place(e, t) {
      const chips = kids(e), per = num(e.dataset.per, 12), R = num(e.dataset.radius, 380), pitch = 240;
      const len = Math.max(1, Math.ceil(chips.length / per)) * pitch, speed = num(e.dataset.speed, 260);
      chips.forEach((c, i) => {
        const ring = Math.floor(i / per), a = ((i % per) / per) * 360 + ring * 13;
        const z = ((((-ring * pitch + t * speed) % len) + len) % len) - len + 300;
        c.style.opacity = clamp((z + len - 150) / 700) * clamp((300 - z) / 160);
        c.style.transform = `translate(-50%,-50%) rotateZ(${a + t * 5}deg) translate3d(0, ${R}px, ${z}px) rotateX(90deg)`;
      });
    },
    setup(e) { kids(e).forEach((c) => c.classList.add("tn-chip")); this.place(e, 1.5); },
    enter(e) { this.setup(e); loopRaf(e, (t) => this.place(e, t + 1.5)); },
    leave(e) { stop(e); },
  });
})();
