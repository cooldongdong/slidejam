# slidejam website

https://slidejam.pages.dev (Astro). The decks themselves are not built here:
`scripts/copy-decks.mjs` copies `deck/`, `demos/`, `examples/` and `effects.html` from the
repo root into `public/` as they are.

```sh
cd site
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
```

- **Hosting:** Cloudflare Pages, connected to this repo. `master` deploys to
  https://slidejam.pages.dev; every other branch gets a preview at
  `https://<branch>.slidejam.pages.dev`. Settings: root directory `site`, build command
  `npm run build`, output `dist`. Node comes from `site/.node-version` (Astro needs ≥ 22.23).
- **The old address** (cooldongdong.github.io/slidejam) is served from the repo root by
  GitHub Pages; `index.html` and `guide.html` there only redirect here.
- **Effect thumbnails** in `public/thumbs/` come from `node tools/thumbs.mjs` (run it from
  the repo root after changing an effect).
