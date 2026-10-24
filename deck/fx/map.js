// map — a real map (Leaflet + OpenStreetMap tiles; needs a network connection).
// Pins drop in one by one, then each → flies to the next stop of the tour.
//   data-center="lat lng"  data-zoom="14"
//   data-pins="lat lng label; lat lng label; …"
//   data-tour="lat lng zoom; lat lng zoom; …"   (add data-auto to play it by itself)
//   data-tiles="https://…/{z}/{x}/{y}.png"       (optional tile server)
// <div class="map" data-fx="map" data-center="24.99 121.42" data-zoom="14" data-pins="…"></div>
(() => {
  const { register, num, ms, delay, timers, stop } = Deck.lib;
  Deck.lib.css(`
.map{position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line-strong);background:var(--surface-2)}
.slide.full > .map{position:absolute;inset:0;border:0;border-radius:0}
.map .leaflet-control-attribution{font-size:11px}
.pin{position:relative}
.pin i{position:absolute;left:-11px;top:-30px;width:22px;height:22px;border-radius:50% 50% 50% 0;background:var(--accent);transform:rotate(-45deg);box-shadow:0 4px 10px rgb(0 0 0/.3);animation:pin-drop .6s var(--ease) both}
.pin i::after{content:"";position:absolute;left:7px;top:7px;width:8px;height:8px;border-radius:50%;background:var(--on-accent)}
.pin span{position:absolute;left:16px;top:-34px;white-space:nowrap;font:600 20px var(--sans);color:var(--ink);background:var(--surface);padding:3px 10px;border-radius:8px;box-shadow:0 4px 12px rgb(0 0 0/.15);animation:pin-label .5s .3s var(--ease) both}
@keyframes pin-drop{from{transform:translateY(-60px) rotate(-45deg);opacity:0}to{transform:rotate(-45deg);opacity:1}}
@keyframes pin-label{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:none}}
`);

  let leaflet;
  const loadLeaflet = () => (leaflet ??= new Promise((res, rej) => {
    if (window.L) return res(window.L);
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const js = document.createElement("script");
    js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    js.onload = () => res(window.L); js.onerror = () => { leaflet = null; rej(); Deck.toast("地圖載不到，請確認有網路"); };
    document.head.appendChild(js);
  }));
  const triples = (s) => (s || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => { const [a, b, ...rest] = x.split(/\s+/); return [+a, +b, rest.join(" ")]; });
  register("map", {
    async enter(e) {
      const L = await loadLeaflet().catch(() => null);
      if (!L || !e.closest(".slide.active")) return;
      const [lat, lng] = triples(e.dataset.center)[0] || [23.7, 121];
      const zoom = num(e.dataset.zoom, 13);
      if (!e._map) {
        const live = e.dataset.interactive != null;
        const m = (e._map = L.map(e, { zoomControl: live, attributionControl: true, dragging: live, scrollWheelZoom: live, doubleClickZoom: live, boxZoom: live, keyboard: false, zoomSnap: 0.25 }));
        L.tileLayer(e.dataset.tiles || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(m);
      }
      const m = e._map;
      m.invalidateSize(); m.setView([lat, lng], zoom, { animate: false });
      (e._pins || []).forEach((p) => p.remove());
      stop(e);
      const ts = [];
      timers.set(e, () => ts.forEach(clearTimeout));
      const d = delay(e, 0.8) * 1000, st = num(e.dataset.stagger, 0.25) * 1000;
      e._pins = triples(e.dataset.pins).map(([a, b, label], i) => {
        const icon = L.divIcon({ className: "pin", html: `<i></i>${label ? `<span>${label}</span>` : ""}`, iconSize: [0, 0] });
        const p = L.marker([a, b], { icon, interactive: false });
        ts.push(setTimeout(() => p.addTo(m), d + i * st));
        return p;
      });
      e.dataset.k = -1;
      if (e.dataset.auto != null) {
        const tour = triples(e.dataset.tour), gap = ms(e, 3500);
        tour.forEach((_, i) => ts.push(setTimeout(() => this.step(e), d + e._pins.length * st + 600 + i * gap)));
      }
    },
    step(e) {
      const tour = triples(e.dataset.tour), k = +e.dataset.k + 1;
      if (!e._map || k >= tour.length) return false;
      const [a, b, z] = tour[k];
      e._map.flyTo([a, b], +z || e._map.getZoom(), { duration: num(e.dataset.fly, 2.2) });
      e.dataset.k = k;
      return true;
    },
    leave(e) { stop(e); },
  });
})();
