// civictech.tw: a topic page, click one project card → that project's own page
export default {
  out: "examples/media/morph-project",
  init: () => { try { sessionStorage.setItem("event-popup-dismissed", "1"); sessionStorage.setItem("survey-popup-dismissed", "1"); localStorage.setItem("theme", "light"); } catch {} },
  from: { url: "https://civictech.tw/c/budget", click: 'a[href="/p/twbudget"]' },
  to: { url: "https://civictech.tw/p/twbudget" },
  pairs: [
    ['a[href="/p/twbudget"] >> text=中央政府預算視覺化', "h1"],
    ['a[href="/p/twbudget"] >> text=視覺化呈現中央政府總預算', "header p >> nth=-1"],
  ],
  rows: "dl > div, aside",
};
