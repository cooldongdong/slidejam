# web-deck

web-deck makes slide decks that are a single `index.html`. You double-click to
open one: there's no build step, no server and no framework.

It was built for talks that **show a website**, and those talks have three needs:

- **Morphs captured from the real site.** Point a script at two URLs and the element
  you click. It records a "click → the page rebuilds itself" transition, with shared
  elements flying to their new places.
- **Real maps and real pages inside slides.** Leaflet maps drop pins and fly between
  places, and live sites run inside a browser or phone frame.
- **Editing without hunting through HTML.** Press **E** and type on the slide. **⌘S**
  writes only the changed text back into the file.

There's also a way to talk to an AI about the slides. Press **A**, click anything
and write what you want there. The deck turns your notes into a list with
selectors and coordinates that you can paste to an assistant.

## Quick start

```sh
git clone … web-deck && cd web-deck
npm install                         # Playwright, only needed for the capture tools
npx playwright install chromium-headless-shell
node tools/new-deck.mjs ~/talks/my-talk
open ~/talks/my-talk/index.html
```

Open `effects.html` to see every effect running next to the markup it needs.

## Keys

| Key | Action |
|---|---|
| → / Space | next step or slide |
| ← | previous slide |
| G or click the page number | overview |
| hover the progress bar | peek at a slide; click to jump |
| R | replay this slide |
| N | speaker notes |
| F | fullscreen |
| E, then ⌘S | edit text in place and save it to the file (Chrome) |
| A | annotate: click and describe what you want, then copy the list for an AI |

## Effects

Elements opt in to an effect with `data-fx="name"`:

| Name | What it does |
|---|---|
| `bars` | bar chart that grows in |
| `count` | counts up to the number |
| `type` | typewriter |
| `mark` | highlighter sweep |
| `pan` | scrolls a tall screenshot |
| `zoom` | pushes in on a point |
| `cycle` | cross-fades between images |
| `clickpath` | a cursor clicks through screenshots |
| `orbit` | steps around a loop, lighting each in turn |
| `assemble` | cards fly in and settle into a grid |
| `spot` | spotlight on parts of a screenshot, stepped |
| `morph` | page rebuild captured from a real site |
| `map` | Leaflet map with pins and a fly-to tour |
| `live` | a real website inside the slide |

Two behaviours need no `data-fx`. `data-i="n"` sets the entrance order, and
`data-step="n"` / `data-step-out="n"` make things appear or leave on each →.

## Capturing a morph

```js
// morph.config.mjs
export default {
  out: "media/morph-project",
  from: { url: "https://example.org/list", click: 'a[href="/item/42"]' },
  to:   { url: "https://example.org/item/42" },   // omit to really click
  pairs: [['a[href="/item/42"] h3', "h1"]],      // things that fly across
  rows: "main section > *",                      // things that rise in
  wait: "map",                                   // for pages with map tiles
};
```

```sh
cd ~/talks/my-talk && node ~/web-deck/tools/capture-morph.mjs morph.config.mjs
```

Then add `<div class="morph" data-fx="morph" data-src="media/morph-project"></div>`
to a slide.

## Checking a deck without a browser

```sh
node tools/shoot.mjs ~/talks/my-talk/index.html --sheet     # every slide, plus a contact sheet
node tools/shoot.mjs index.html 12 --at 0.5,2,4             # one slide at several moments
```

## Layout

```
deck/        the engine: deck.css, deck.js (core and modes), fx.js (effects)
template/    the starting index.html
tools/       new-deck, capture-morph, shoot
effects.html gallery of every effect
examples/    an example deck (storymap) and the gallery's media
skill/       a Claude Code skill for building decks with an AI
```

To use the skill with Claude Code, run
`ln -s "$PWD/skill" ~/.claude/skills/web-deck`.

## License

MIT
