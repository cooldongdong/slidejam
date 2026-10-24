// Copy the decks (engine, gallery, demos, examples, preview image) from the repo root into
// public/, untouched. They are plain files that open by double-click, so the site just serves them.
import { cpSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "../..");
const pub = resolve(here, "../public");
const items = ["deck", "demos", "examples", "effects.html", "og.png"];
for (const item of items) {
  const to = resolve(pub, item);
  rmSync(to, { recursive: true, force: true });
  if (existsSync(resolve(repo, item))) cpSync(resolve(repo, item), to, { recursive: true });
}
console.log(`copied ${items.join(", ")} into public/`);
