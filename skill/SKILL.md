---
name: slidejam
description: 用 slidejam 做或改「單一 index.html 的網頁簡報」——1600×900 舞台、data-fx 效果、從真網站拍下來的頁面重組（morph）動畫、地圖、真網站嵌入。當用戶說「做簡報」「做一份網頁簡報」「介紹某個網站／產品的簡報」「第 N 頁加動畫」「這頁用 pan／morph／map」，或貼上一段以「簡報：…／標註 N 則」開頭的標註清單時就要用。也用在新增一種效果、重拍 morph、檢查簡報截圖。Use for building or editing slidejam HTML slide decks, reading pasted annotation lists, adding effects, or capturing morphs from live sites; respond in Traditional Chinese.
---

# slidejam

The repo root is the parent folder of this skill (resolve the symlink:
`readlink -f ~/.claude/skills/slidejam/..`). Everything below is relative to it.

**`effects.html` is the source of truth for effects.** Before writing markup for an
effect, open that slide in `effects.html` and copy its pattern. Don't work from memory.

## The flow: walk the user through it

Follow these steps in order, and tell the user which step you are on, e.g.「（步驟 2／6：大綱）」.
They are the same steps as the site's 使用流程 page (`guide.html`). Keep the two in sync.

### Step 0: which deck?
- If the user named a folder, or pasted an annotation list (its first lines give
  the file path), that is the deck. Read its `index.html` and go to step 5.
- Otherwise ask one question: 開一份新的，還是繼續做某個資料夾的簡報？
- To find existing decks, look for folders that contain both `index.html` and
  `deck/deck.js` (for example `~/talks/*`). List them and let the user pick.

### Step 1: opening questions (new deck only)
Ask these five in one message, then wait:
1. 講什麼：主題和你最想讓台下記住的一句話
2. 講給誰：聽眾是誰、對這個主題熟不熟
3. 講多久：幾分鐘
4. 要秀哪些網站或畫面：網址也一起給
5. 你有幾小時可以做：這決定第一版做多細

### Step 2: outline (needs a go-ahead)
Give one line per slide: the point it makes, the effect from `effects.html` by
name, and any screenshot or morph it needs. Mark the slides that need real
screenshots. **Wait for 「可以動工」 or an equivalent go-ahead.** Do not create files
before that.

### Step 3: set up
- `node tools/new-deck.mjs <folder>`. Use the folder the user chose; the default is
  `~/talks/<short-name>`.
- Take screenshots into `media/` with Playwright at 1600×900 and
  `deviceScaleFactor: 2`. Capture morphs (see below).
- If the folder is a git repo, commit.

### Step 4: first version
- Write every slide, with speaker notes.
- Check your work: run `node tools/shoot.mjs <deck>/index.html --sheet`, Read the
  sheet, and fix what looks wrong. For motion, use `--at 0.5,2,4 <slide>`.
- Then hand it over in one message:
  - the path to open in Chrome;
  - a one-line summary per slide;
  - what you are unsure about;
  - how to give feedback: press E to fix wording themselves; for effects or
    layout, press A to mark spots and paste the list back.

### Step 5: rounds of changes
- Treat each message or pasted annotation list as one round.
- Handle every item.
- Re-shoot only the slides you touched.
- Report back item by item.
- Commit after each round.

### Step 6: before the talk
Run through this with the user:
- **Network:** `map` and `live` need it. Offer screenshot fallbacks.
- **Fonts:** Google Fonts fall back to system fonts offline.
- **Presenter view:** P opens notes on their own screen. Share or project the main
  window only.
- **Full screen:** F.
- **Blank slides:** look for any in the G overview.

## More than one deck
- Every deck is its own folder with its own copy of the engine. Decks never
  affect each other.
- In a new conversation, the user can say「繼續做 ~/talks/xxx」or just paste an
  annotation list. Go to step 5.
- When the engine gains effects, run `node tools/new-deck.mjs <deck> --update`.
  It replaces only that deck's `deck/` folder.

## Reading an annotation list

When the user presses A in the deck and clicks things, the deck produces a list
like this:

```
簡報：…  檔案：/path/index.html
1. 第 12 頁〈title〉
   元素：img（media/x.png）
   選擇器：.slide:nth-of-type(12) > div.grid2 > img
   點在：(300, 330)，元素內 (23%, 28%)
   想要：這裡慢慢放大
```

- Find the element with the selector, then confirm it with the 元素 text. The
  selector is counted against authored elements only.
- "元素內 (x%, y%)" is the exact point inside that element. Use it for `zoom`'s
  `data-at` and `hotspots`' `data-at`.
- "框住：元素內 x y 寬 高" means the user dragged a box. The numbers are percentages
  of that element and can go straight into `spot`'s `data-rects`. Never guess these
  positions from a screenshot; ask the user to box them with A instead.
- Map each wish to an effect from `effects.html`. If nothing fits, build a new
  effect (see below) rather than one-off inline code.
- Handle every item, re-shoot the affected slides, and report back per item.

## Keeping in-place editing (E, then ⌘S) working

The save feature finds each edited element's original text in the file and
replaces only that. Write markup it can find:

- Text lives in leaf elements (`p`, `h1`–`h3`, `li`, `span`, `b`…). Inline tags
  inside them are fine.
- Quote every attribute, write `<br>` (not `<br/>`), and use only the entities
  `&lt; &gt; &amp;`. Write other characters literally (「」、…).
- Don't generate visible text from JavaScript arrays. Put it in the markup; effects
  read it from there, as `bars` and `orbit` do.
- Speaker notes are plain text inside `aside.notes`.

## Morph from a real site

1. Write `morph.config.mjs` next to the deck. The keys are documented at the top
   of `tools/capture-morph.mjs`.
2. Run it from the deck folder: `node <repo>/tools/capture-morph.mjs morph.config.mjs`.
   It writes `media/<name>/` and prints the `<div class="morph" …>` to paste in.
- The clicked element must be on screen. Use `from.scroll` if it isn't.
- `pairs` are the things that fly across, such as title → title. `rows` are what
  rises in. Rows below the fold are skipped.
- Map pages need `wait: "map"`. Popups go in `init` (localStorage flags) or `hide`.
- Re-shoot at 2.2–3.5 s to check the moment the box grows.

## Where effects live, and adding one

Each effect is one file, `deck/fx/<name>.js`, holding its JS and its CSS
(`Deck.lib.css(...)`). `deck.js` reads every `data-fx` name on the page and loads
only those files, so a deck never lists scripts by hand. Shared helpers are in
`deck/fx/_lib.js` (`Deck.lib`). To change an effect, read just its file.

1. Create `deck/fx/<name>.js`. Start from a similar effect. It should:
   - take what it needs from `Deck.lib`;
   - put its styles in `Deck.lib.css(`…`)`;
   - call `register("<name>", { setup?, enter, leave, step?, thumb? })`.
2. `leave` must restore the authored state. Edit mode relies on this.
3. Mark generated nodes with `gen()`, so edit mode and annotation skip them.
4. Add a slide to `effects.html` with `id="<name>"`. It needs a demo, a line for
   「跟 AI 說」 and the markup. Then add it to the index on slide 1.
5. Run `tools/new-deck.mjs <deck> --update` for any deck that needs the effect.

## Writing the talk

- Write spoken lines, not prose. Keep one point per page and short sentences.
  Open with a question to build suspense, and start list items with a verb.
- Read each line aloud in your head. If it doesn't flow, rewrite it.
- Show only features that really exist. In the notes, flag facts that need
  proofreading by someone else.
- Use full-page videos (`slide video`) as section transitions. Don't use them as
  content.

## Gotchas

- Decks open from `file://`, so `fetch()` of local JSON fails. Keep data in markup
  or load it with `<script src>`. (`morph.js` uses `Deck.morph(...)` for this reason.)
- `live` iframes need a network connection, and some sites refuse to be framed
  (X-Frame-Options). Fall back to screenshots or a morph.
- `map` loads Leaflet and OSM tiles from the network. If the venue has no Wi-Fi,
  use a morph or screenshot instead.
- ⌘S works in Chrome only (File System Access API).
