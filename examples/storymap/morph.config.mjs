// 捲動版封面，點右下「換成翻頁版」→ StoryMapJS 翻頁版
export default {
  out: "media/morph-flip",
  from: { url: "https://shulin-storymap-demo.cooldongdong.workers.dev/", click: "a.switch" },
  pairs: [
    ["h1", "h2.vco-headline-title"],
    ["header p, h1 ~ p >> nth=0", ".vco-text p >> nth=0"],
  ],
  rows: ".vco-mapmarker, .vco-slidenav-next",
  wait: "map",
  boxPad: 4,
  stagger: 0.08,
};
