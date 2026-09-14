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

`tour.js` is the tour. Twelve stops, each with a slug, and every other surface
is a view onto that array — the schedule on the index, the gallery's groups,
the stop filter on a speaker card, and the twelve registration pages. Adding a
stop is one entry; it appears on all four. Typing them into four files by hand
is how a stop ends up on the schedule with no registration page behind it.

`status` carries the colour coding off the planning sheet, because on that sheet
the colour *is* the information — half these dates are not agreed. There is one
ink here, so the same three states are drawn by weight instead: a filled chip is
agreed, an outlined one is aimed at, a dashed one is booked but already moving.
A second hue would be a second brand.

| file | what it is |
| --- | --- |
| `index.html` | the corridor, the hero, and the sheet that swipes up over it |
| `speakers.html` | the bill — photo, position, company, stops, description |
| `register.html` | one page per stop, addressed as `?stop=<slug>` |
| `site.css` | the ink, the band, the gutters, the type — everything shared |
| `pages.js` | everything that draws itself out of `tour.js` |

The schedule is grouped by school rather than by date: UPenn and NYU each host
two chapters on different days, and a flat date list splits those pairs across
the page — which is the one thing someone scanning for their own campus is
looking for. Date order survives inside each group.

Speakers and photos are slots, drawn empty. A placeholder that looks like
content is the kind that ships by accident, so an unfilled field renders as its
own greyed label and the gap stays visible. The registration form has no
endpoint behind it and says so on submit rather than showing a success state for
something that did not happen.

## Colour

One ink: `#024AD8`, sampled from `hp-logo.png` — a single-colour asset with the
letterforms knocked out as transparency, now used only as the favicon. The header
carries `hp-lockup.svg` instead: mark, wordmark, leading and the space between
the two are all inside the one file, so the lockup cannot drift out of its own
proportions the way a mark-plus-span pair can. Its paths ship white, so the band
needs no filter to knock them out.

## Run

```sh
python3 -m http.server 4180 --bind 127.0.0.1
```

`_enginetest.html` is the field on its own, no page over it — useful for tuning.
