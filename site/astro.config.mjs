// The slidejam website. Decks are not built by Astro: scripts/copy-decks.mjs copies them
// into public/ as they are, so they keep working from a double-click too.
import { defineConfig } from "astro/config";

// Production is GitHub Pages under /slidejam/ (set by the deploy workflow); Cloudflare
// previews and local runs serve from the root.
export default defineConfig({
  site: process.env.SITE || "https://slidejam.pages.dev",
  base: process.env.BASE || "/",
  trailingSlash: "ignore",
});
