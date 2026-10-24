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
| A | annotate: click a point or drag a box, describe what you want, then copy the list for an AI |

## Effects

Elements opt in to an effect with `data-fx="name"`:

| Group | Effects |
|---|---|
| Text | `type` typewriter · `mark` highlighter · `letters` characters rise out of a blur · `rotate` one word keeps changing · `flap` split-flap board · `particles` dots gather into a title · `textmask` words filled with a drifting picture |
| Numbers & data | `count` counts up · `slot` odometer reels · `bars` bar chart · `ring` progress ring · `orbit` steps around a loop · `network` topics and projects as a turning 3D cluster · `tunnel` names stream down a tunnel · `swarm` many items rush in and settle |
| Screenshots | `pan` scroll a tall shot · `zoom` push in · `cycle` cross-fade · `spot` stepped spotlight · `hotspots` pulsing dots with notes · `tilt` 3D tilt / sway · `explode` layers lift apart with labels · `parallax` depth layers · `dive` zoom into a spot until it becomes the next page · `wipe` coloured band reveals an after-image · `morph` page rebuild captured from a real site |
| Walkthroughs | `clickpath` cursor clicks through screenshots · `story` steps synced with screens · `chat` messages pop in · `terminal` command types, output prints · `live` real website in the slide · `map` Leaflet map with pins and a fly-to tour |
| Layout | `bento` feature grid: tiles fly in from the nearest edge and keep their own effects running inside (size them with `w2` / `h2`) · `pop` children pop in · `compare` split line sweeps between two pictures · `stack` a pile of cards that shuffles · `assemble` cards fly into a grid · `feature` tiles take turns being big · `collapse` everything shrinks into one last line |

Frames are plain classes: `.browser`, `.phone`, `.tablet`, `.monitor`, `.laptop`, and `.devices` to group them.
Effects that wait for → instead of starting by themselves take `data-on="step"`.

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
