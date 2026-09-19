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

## The words in the corridor

**Off.** `wordCount` is 0 in `index.html` and in `backdrop()`; the list and the
tuning are kept the way the chips are, so putting the counts back (24 and 10)
switches the type on again without retuning it. Switch both or a sub-page's
frozen corridor stops matching the index's. The rest of this section is what it
does when it is on.

`words` is type flying down the field with the slabs — the tour's phrases, the
sponsor marks, the campus names and the speaker names, built in `index.html` out
of `tour.js` so a stop added to the schedule starts appearing in the corridor
too. They are part of the field, not a layer on it: same cloud, same wrap, same
depth fade, spliced into the same far-to-near draw order, so slabs pass in front
of some and behind others.

Each one is laid along the ray from the vanishing point out through its own
position — the axis its neighbouring bars converge on — so the type streams out
of the knot rather than lying flat across the frame, and it is flipped half a
turn on the left of the frame so it is never upside down.

White fill, hairline in the ink. That is the one combination that survives a
field which is both white ground and blue slab: over the ground the outline
carries the word, over a slab the fill does. `wordMaxPx` is the real tuning —
a word keeps growing right up to the near plane, and past about a quarter of the
frame it stops being type flying past and becomes a headline competing with the
one on the card, so it is dropped at that size rather than faded.

## The laptop band

The competition is a band across the sheet under About, not a plate: ink where
everything above it is paper, no border, nothing about it shaped like the reading
it follows. It is the one thing on the page a reader can win, and it should read
as an offer.

`hp-laptop.svg` is the same laptop being given away, drawn in the same hairline
the corridor is drawn in — one ink, one line weight. It ships with its own field
of blue, recoloured to `--blue` on the way into the repo so there is no seam
where the drawing ends and the band begins, and it is scaled past its column and
clipped, so the laptop arrives from off the page rather than sitting in the
middle of a panel like a product shot.

Two grid columns, art then words, the art the smaller half. Under 820px the art
column is a couple of hundred pixels wide and the laptop is a detail of a laptop,
so the band stacks.

## Layout## Layout

Every block is a plate: a white box with one stroke, floating on the frozen
wireframe, which keeps scrubbing behind them as you scroll. Two shapes of block,
and the difference matters:

- `.blk` — bordered. For prose: About, the competition, Questions.
- `.blk--bare` — no border, no padding. For a grid of cards, which are plates
  themselves; a plate of plates is two borders doing one job. The schedule, the
  speakers, the gallery and the socials strip.

Prose sits in `.about__body`, two columns across the plate — one column at this
width is a 150-character line. `.about__body--one` is the single-column variant
for a block short enough that two columns would be a layout rather than a
paragraph. A `.note` under a plate is the line that qualifies what the plate just
said; it lives outside `.about__body` on purpose, or the columns can strand it at
the foot of the first one where it reads as a footnote to half the section.

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
| subhead | HP Forma DJR Office, Medium |
| body | HP Forma DJR Office, Regular |
| caption | Forma DJR Mono, Regular |
| disclaimer | Forma DJR Mono, Medium |

A disclaimer is the machine-side of the page — a condition on an offer, in the
same voice as the dates, the labels and the buttons — so `.note` is mono, and its
measure is computed from `--body-w` and `--body-gap` rather than guessed in `ch`,
so it wraps on exactly the line the column above it wraps on.

Typekit kit `yxt3aqw` serves **one** family — `forma-djr-mono`, in four faces
(`n4`, `i4`, `n7`, `i7`). Two consequences, one fixed and one not:

- **Medium.** There is no `n5` in the kit, so every `font-weight:500` on the site
  was resolving *down* to Regular — CSS font matching tries weights at or below
  the target before going up. Figma shows Medium because the desktop Adobe Fonts
  sync has it; the web kit does not. `fonts/forma-djr-mono-500.woff2` now adds
  the weight to the same family name and the browser merges it with the kit's.
- **Micro and Text are still missing from the kit**, and that used to mean every
  subhead and all body copy rendered in the platform grotesque — the page read as
  Forma on the labels and San Francisco everywhere else, which is two type
  systems rather than one. **HP Forma DJR Office** now fills both roles from
  `fonts/hp-forma-office-{400,500}.woff2`: Medium for subheads and notes, Regular
  for body copy. It leads `--micro` and `--text`, so adding Micro and Text to the
  kit no longer changes anything by itself — reorder those two stacks in
  `site.css` if the cuts are wanted apart again.

Both weights matter. With only the Medium registered, `font-weight:400` copy
matches up to it and every paragraph runs a weight too heavy, which is the whole
reason a text cut and a display cut are different fonts.

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
>
> `fonts/hp-forma-office-*.woff2` are converted from the desktop TTFs of HP's own
> brand face. On an HP site that is the right typeface and the wrong delivery:
> confirm with HP that the webfont is licensed for this domain before it ships.

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
