# slidejam website

The site at https://cooldongdong.github.io/slidejam/ (Astro). The decks themselves are
not built here: `scripts/copy-decks.mjs` copies `deck/`, `demos/`, `examples/` and
`effects.html` from the repo root into `public/` as they are.

```sh
cd site
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
```

- **Production:** GitHub Pages, deployed by `.github/workflows/pages.yml` on every push
  to `master` (built with `BASE=/slidejam`).
- **Previews:** Cloudflare Pages builds every branch at
  `https://<branch>.slidejam.pages.dev`. Settings: root directory `site`, build command
  `npm run build`, output `dist`, env `NODE_VERSION=22`.
- **Effect thumbnails** in `public/thumbs/` come from `node tools/thumbs.mjs` (run it from
  the repo root after changing an effect).
