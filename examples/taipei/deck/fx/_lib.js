// Shared helpers for the effects in this folder. Each effect file is loaded on demand by
// deck.js (only the ones a deck uses) and takes what it needs from Deck.lib.
(() => {
  const { register } = Deck.fx;
  const $$ = (s, r) => [...r.querySelectorAll(s)];
  const gen = (tag, cls, parent, before) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    e.dataset.gen = "";
    parent.insertBefore(e, before || null);
    return e;
  };
  const num = (v, d) => (v == null || v === "" ? d : +v);
  const ms = (e, d) => num(e.dataset.ms, d);
  const delay = (e, d = 0) => num(e.dataset.delay, d);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const timers = new WeakMap(); // element -> cancel()
  const stop = (e) => { timers.get(e)?.(); timers.delete(e); };
  function loopRaf(e, fn) {
    stop(e);
    let id, t0 = performance.now();
    const tick = (now) => { if (fn((now - t0) / 1000) !== false) id = requestAnimationFrame(tick); };
    id = requestAnimationFrame(tick);
    timers.set(e, () => cancelAnimationFrame(id));
  }
  function anim(e, keyframes, opts) {
    stop(e);
    const a = e.animate(keyframes, { fill: "both", easing: "ease-in-out", ...opts });
    timers.set(e, () => a.cancel());
  }

  const kids = (e) => [...e.children].filter((c) => !("gen" in c.dataset));
  const rnd = (i, n) => ((Math.sin((i + 1) * 99.13 * n) * 43758.5453) % 1 + 1) % 1; // same scatter every run
  const EASE = "cubic-bezier(.16,1,.3,1)";
  function trigger(e, fn, d = 0.6) {
    stop(e);
    if (e.dataset.on === "step") { e._pending = fn; return; }
    const t = setTimeout(fn, delay(e, d) * 1000);
    timers.set(e, () => clearTimeout(t));
  }
  const fire = (e) => { const f = e._pending; if (!f) return false; e._pending = null; f(); return true; };
  // effects that rebuild an element's inside keep the authored HTML and put it back on leave
  const saved = new WeakMap();
  const keep = (e) => { if (!saved.has(e)) saved.set(e, e.innerHTML); };
  const restore = (e) => { if (saved.has(e)) { e.innerHTML = saved.get(e); saved.delete(e); } };
  function splitChars(e, cls) {
    const out = [];
    const walk = (n) => [...n.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const ch of c.textContent) {
          if (/\s/.test(ch)) { frag.append(ch); continue; }
          const s = document.createElement("span");
          s.className = cls; s.dataset.gen = ""; s.textContent = ch;
          frag.append(s); out.push(s);
        }
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !("gen" in c.dataset)) walk(c);
    });
    walk(e);
    return out;
  }
  const stageScale = (e) => e.getBoundingClientRect().width / (e.offsetWidth || 1);

  // effect styles go right after deck.css, so a deck's own <style> still wins
  let lastStyle = null;
  const css = (text) => {
    const s = document.createElement("style");
    s.textContent = text;
    const anchor = lastStyle || document.querySelector('link[href$="deck.css"]');
    anchor ? anchor.after(s) : document.head.prepend(s);
    lastStyle = s;
  };

  Deck.lib = { register, css, $$, gen, num, ms, delay, clamp, lerp, timers, stop, loopRaf, anim,
    kids, rnd, EASE, trigger, fire, keep, restore, splitChars, stageScale };
})();
