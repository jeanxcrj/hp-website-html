# Designing the Future — HP

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

## Colour

One ink: `#024AD8`, sampled from `hp-logo.png`, which is a single-colour asset
with the letterforms knocked out as transparency. The header filters it to white,
so the band shows through the glyphs and the mark needs no second file.

## Run

```sh
python3 -m http.server 4180 --bind 127.0.0.1
```

`_enginetest.html` is the field on its own, no page over it — useful for tuning.
