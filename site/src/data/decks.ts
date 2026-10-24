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
    id: "civictech",
    file: "examples/civictech/index.html",
    zh: ["civictech.tw 建置成果", "一場 41 頁的成果分享，用 default 主題。"],
    en: ["Building civictech.tw", "A 41-slide project talk in the default theme."],
    who: ["關心公民科技、想找專案參與的人", "People curious about civic tech who want a project to join"],
    goal: ["講清楚一個網站為什麼長這樣：真網站拍下來的頁面重組、資料流動的循環、問卷長條圖，搭配錄好的網站動畫。", "Explain why a website looks the way it does: page morphs captured from the live site, the data loop, survey bars, and recorded site animations."],
  },
  {
    id: "taipei",
    file: "examples/taipei/index.html",
    zh: ["台北一日遊", "七個地方、真地圖、照片，用 warm 主題。"],
    en: ["A day in Taipei", "Seven stops on a real map, with photos, in the warm theme."],
    who: ["第一次來台北的朋友", "Friends visiting Taipei for the first time"],
    goal: ["把一天的行程講成一條路線：地圖飛過七站，每一站一張照片、一種效果。", "Tell a day's plan as a route: the map flies through seven stops, each with a photo and an effect of its own."],
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
