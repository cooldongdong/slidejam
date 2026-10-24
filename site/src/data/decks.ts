// Example decks shown on the site. Slide counts, effects and theme are read from the deck
// files at build time (see deckStats), so adding a deck here is all it takes.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const decks = [
  {
    id: "storymap",
    file: "examples/storymap/index.html",
    zh: ["從車站出發", "樹林社大的地圖故事：真地圖插點飛行、嵌入真網站、從真網站拍下的頁面重組。"],
    en: ["From the station", "A Shulin story map talk: a live map tour, an embedded site, and a morph from the real site."],
  },
  {
    id: "effects",
    file: "effects.html",
    zh: ["效果圖鑑", "slidejam 的 44 種效果，每一頁一種。它本身就是一份 slidejam 簡報。"],
    en: ["Effects gallery", "All 44 slidejam effects, one per slide. It is itself a slidejam deck."],
  },
];

// what the deck file says about itself: how many slides, which effects, which theme
export function deckStats(file: string) {
  const html = readFileSync(resolve(process.cwd(), "..", file), "utf8");
  const slides = (html.match(/<section class="slide/g) || []).length;
  const fx = [...new Set([...html.matchAll(/data-fx="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))];
  const theme = html.match(/deck\/themes\/([a-z-]+)\.css/)?.[1] ?? "default";
  return { slides, fx, theme };
}
