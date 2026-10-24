// tilt — a screenshot (or a whole grid) in 3D.
//   data-mode="settle" (default) lies tilted then swings flat · "sway" turns side to side · "hold" stays tilted and drifts
// <div data-fx="tilt"><img class="shot" src="…"></div>
(() => {
  const { register, num, ms, delay, stop, anim, EASE } = Deck.lib;

  register("tilt", {
    enter(e) {
      const rx = num(e.dataset.rx, 55), rz = num(e.dataset.rz, -25), mode = e.dataset.mode || "settle";
      const tilted = `perspective(2400px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(.8)`;
      if (mode === "sway") anim(e, [{ transform: "perspective(1600px) rotateY(-20deg) rotateX(6deg)" }, { transform: "perspective(1600px) rotateY(20deg) rotateX(6deg)" }], { duration: ms(e, 5000), iterations: Infinity, direction: "alternate" });
      else if (mode === "hold") anim(e, [{ transform: `${tilted} translateY(40px)` }, { transform: `${tilted} translateY(-40px)` }], { duration: ms(e, 8000), iterations: Infinity, direction: "alternate" });
      else anim(e, [{ transform: tilted }, { transform: "perspective(2400px) rotateX(0deg) rotateZ(0deg) scale(1)" }], { duration: ms(e, 2200), delay: delay(e, 0.6) * 1000, easing: EASE });
    },
    leave(e) { stop(e); },
  });
})();
