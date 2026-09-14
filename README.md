# HP USA College Tour 2026

A one-screen animated site. The background is an infinite flight down a
corridor of extruded bars, all converging on a single vanishing point.

## The field

`field.js` is a canvas port of the static SVG tool at `~/work/extrusion-field`
(repo `jeanxcrj/extrusion-field`). The geometry is the tool's: axis-aligned bars
scattered in depth, projected through one perspective point. What the port adds
is time — a `travel` offset slides the cloud toward the camera and each bar wraps
from the far plane back to the near one, so the flight never re-seeds.

Two rules carried over from the tool, both learned the hard way:

- a bar is defined by its **near end** (`z0`) plus a length, never by its centre,
  so a long bar can never straddle the near plane and blow up to fill frame.
- `cone` < 1 pulls the far end of the cloud toward the view axis, which is what
  tightens the vanishing knot.

`index.html` tunes it off the poster rather than off the tool's presets: the knot
stays left and low so the field streams out from the left, but `aspectXY` comes
well down from a flat band so structure surrounds the knot instead of fanning
sideways, `hole` holds a void open on the view axis so a near slab cannot plug
the centre, and the ground is a pale blue that the wash bleaches to white at the
vanishing point. The zoomed-in read comes from `thick` — massive, fewer slabs at
the same camera distance — not from moving the camera in.

`chips` are the flat dark rectangles drifting through the field, currently set
to 0 in `index.html` — the tuning is kept there so they can be switched back on. They are flat in
shape but interleaved in stacking: no projection, no perspective scaling, no depth
fade and no ride on the field's travel, yet each is spliced into the bar draw
order at its own fixed `layer`, so slabs pass in front of some and behind others.
They carry the same white hairline as the bars and drift on their own slow clock,
independent of flight speed, so the wheel throttle never drags them along.

The bloom at the knot is a gaussian normalised to reach zero at `washR`, sampled
into the gradient. `bgAt()` uses the identical curve — if the two ever disagree,
every bar is mixed toward a background colour that is not the one behind it and
the field visibly separates from its own wash.

## Interaction

| gesture | what it does |
| --- | --- |
| move the pointer | the vanishing point drifts toward it |
| press and drag | steers ten times harder, for aiming the corridor |
| wheel | a throttle, not a scroll — always decays back to cruise |
| load | the flight arrives at 5.5× and settles, so the page opens mid-journey |

`prefers-reduced-motion` draws one still frame and stops the loop. A hidden tab
stops it too, so returning doesn't jump the field forward by however long you
were away.

## The pages

The whole site is `index.html`: the corridor, the hero, then three plates —
About, Schedule, Speakers. `register.html?stop=<slug>` is the one other real
page, the form for a single stop; reached without a slug it hands you back to
the schedule. `speakers.html` is a redirect left behind so links already given
out still land.

`tour.js` is the tour. Twelve stops, each with a slug, and every other surface is
a view onto that array — the schedule cards, the campus menu under REGISTER in
the band, and the per-stop forms. Adding a stop is one entry; it appears on all
three. Typing them into three files by hand is how a stop ends up on the
schedule with no registration page behind it.

`status` and `note` are still in there and are no longer rendered anywhere.
CONFIRMED / TARGETING / ON HOLD and "the chapter has asked to move to Oct 31"
are how the tour is tracked internally; a student reading a schedule needs the
date, not the state of the negotiation behind it. They stay because they are the
truth about each date.

| file | what it is |
| --- | --- |
| `index.html` | the corridor, the hero, and the plates that ride up over it |
| `register.html` | the form for one stop, addressed as `?stop=<slug>` |
| `speakers.html` | a redirect to `index.html#speakers` |
| `site.css` | the ink, the band, the gutters, the type — everything shared |
| `pages.js` | everything that draws itself out of `tour.js` |
| `tour.js` | the twelve stops and the bill |

A card per **stop**, not per campus, so UPenn and NYU appear twice, told apart by
chapter. The page's job is one registration per stop, and a card that cannot map
to exactly one form is a click with no answer. The band's menu is the exception:
it lists campuses, one each, because without the chapter beside it a second
UPenn is the same words twice.

## Layout

Every block is a plate: a white box with one stroke, floating on the frozen
wireframe, which keeps scrubbing behind them as you scroll. Two shapes of block,
and the difference matters:

- `.blk` — bordered. For prose. About is the only one.
- `.blk--bare` — no border, no padding. For a grid of cards, which are plates
  themselves; a plate of plates is two borders doing one job.

Everything lands on the same left margin: a bare block's heading and its cards,
and a bordered block's outer edge. Only a bordered block's *heading* sits inset,
because it is inside the box and cannot reach the margin without sitting on the
border.

One stroke weight for every box — `--bd`. It was 3px on plates, 2px on cards and
1px on everything else, which read as three unrelated systems.

## Type

| role | face |
| --- | --- |
| title | Forma DJR Mono, Medium |
| subhead | Forma DJR Micro, Medium |
| body | Forma DJR Text, Regular |
| caption | Forma DJR Mono, Regular |

Typekit kit `yxt3aqw` serves **one** family — `forma-djr-mono`, in four faces
(`n4`, `i4`, `n7`, `i7`). Two consequences, one fixed and one not:

- **Medium.** There is no `n5` in the kit, so every `font-weight:500` on the site
  was resolving *down* to Regular — CSS font matching tries weights at or below
  the target before going up. Figma shows Medium because the desktop Adobe Fonts
  sync has it; the web kit does not. `fonts/forma-djr-mono-500.woff2` now adds
  the weight to the same family name and the browser merges it with the kit's.
- **Micro and Text are still missing**, so every subhead and all body copy is
  rendering in the platform grotesque, not Forma. Add both families to the kit
  and `--micro` / `--text` pick them up with no code change.

`.no-medium` in `site.css` is a synthetic weight — it thickens stems optically
with `-webkit-text-stroke` when no real 500 is available. It is dormant now, and
deliberately kept: `pages.js` asks `document.fonts` whether a 500-weight
`forma-djr-mono` face is actually registered and only applies it when none is, so
if the self-hosted file is ever pulled the site still reads medium instead of
silently dropping to Regular.

> **Licensing.** `fonts/` came from a befonts.com download whose licence reads
> *Personal Use Only*, and the files are the `-Testing` trial cuts. That is fine
> for working out the design locally and is **not** fine on an HP-branded site.
> Before this ships, either add Medium to kit `yxt3aqw` — at which point the
> probe switches the self-hosted face off on its own and `fonts/` can be deleted
> — or buy a webfont licence from DJR. The same applies to the Micro and Text
> families when they are added.

## Colour

Blue is a role, not the palette: headings, calls to action, the band, and the
footer panel. Body copy is `--ink`, anything subordinate is `--slate` — the
third colour on the specimen. `#024AD8` is sampled from `hp-logo.png`, a
single-colour asset with the letterforms knocked out as transparency, now used
only as the favicon. The header
carries `hp-lockup.svg` instead: mark, wordmark, leading and the space between
the two are all inside the one file, so the lockup cannot drift out of its own
proportions the way a mark-plus-span pair can. Its paths ship white, so the band
needs no filter to knock them out.

## Run

```sh
python3 -m http.server 4180 --bind 127.0.0.1
```

`_enginetest.html` is the field on its own, no page over it — useful for tuning.
