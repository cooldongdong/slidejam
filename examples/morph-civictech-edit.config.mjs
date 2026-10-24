// civictech.tw: a project page, click "建議修改" → the edit form rebuilds from it
export default {
  out: "examples/civictech/media/morph-edit",
  init: () => { try { sessionStorage.setItem("event-popup-dismissed", "1"); sessionStorage.setItem("survey-popup-dismissed", "1"); localStorage.setItem("theme", "light"); } catch {} },
  from: { url: "https://civictech.tw/p/cofacts", click: 'aside a[href$="/edit"] >> nth=0' },
  to: { url: "https://civictech.tw/p/cofacts/edit" },
  pairs: [
    ['aside a[href$="/edit"] >> nth=0', "h1"],
    ["h1", "h1 + p"],
  ],
  rows: "form.edit-form .grid > *",
};
