// Example decks shown on the site. Slide counts, effects and theme are read from the deck
// files at build time (see deckStats), so adding a deck here is all it takes.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const decks = [
  {
    id: "intro",
    file: "examples/intro/index.html",
    zh: ["slidejam：會動的簡報", "一份 8 頁的產品介紹，用 night 主題。"],
    en: ["slidejam, in eight slides", "An eight-slide product intro in the night theme."],
    who: ["想認識 slidejam 的人", "People meeting slidejam"],
    goal: ["三分鐘講清楚它能做什麼：一個檔案、真網站拍進來、跟 AI 一起改。", "Show in three minutes what it does: one file, real sites captured, revised with an AI."],
  },
  {
    id: "storymap",
    file: "examples/storymap/index.html",
    zh: ["從車站出發", "樹林社大的地圖故事，用 warm 主題。"],
    en: ["From the station", "A Shulin story map, in the warm theme."],
    who: ["社大學員與在地居民", "Community college members and neighbours"],
    goal: ["把散落的舊文章變成走得到的路線：真地圖飛過七個地點，再把網站本身放進投影片。", "Turn scattered old articles into a walkable route: a real map flies through seven places, and the site itself plays in the slides."],
  },
  {
    id: "effects",
    file: "effects.html",
    zh: ["效果圖鑑", "44 種效果，每一頁一種。"],
    en: ["The effects gallery", "All 44 effects, one per slide."],
    who: ["正在做簡報、想找效果的人", "Anyone building a deck"],
    goal: ["它本身就是一份 slidejam 簡報：每一頁示範一個效果，附上「跟 AI 這樣說」。", "It is itself a slidejam deck: every slide demonstrates one effect, with the line to ask an AI with."],
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
