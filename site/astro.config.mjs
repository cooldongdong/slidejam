// The slidejam website. Decks are not built by Astro: scripts/copy-decks.mjs copies them
// into public/ as they are, so they keep working from a double-click too.
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://slidejam.pages.dev",
  trailingSlash: "ignore",
});
