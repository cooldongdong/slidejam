// The slidejam website. Decks are not built by Astro: scripts/copy-decks.mjs copies them
// into public/ as they are, so they keep working from a double-click too.
import { defineConfig } from "astro/config";

// Hosted on Cloudflare Pages: master is https://slidejam.pages.dev, every other branch gets
// a preview at https://<branch>.slidejam.pages.dev. BASE is only for serving under a subpath.
export default defineConfig({
  site: process.env.SITE || "https://slidejam.pages.dev",
  base: process.env.BASE || "/",
  trailingSlash: "ignore",
});
