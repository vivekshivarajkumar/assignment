# The page module

How `src/game/chapters/ch01-couch.js` draws a traced page, part by part, and
which parts change for a new page. Start a new page by copying it.

## What is page-specific

| Part | Couch value | For a new page |
|---|---|---|
| Header comment | the couch scene | describe the scene and what the player does |
| Import of `-trace.js` | `./ch01-couch-trace.js` | your page's generated module; drop `FLOOR`, `PIECES` if the config has no `regions` |
| `REF` | 0.75 | 900 / reference width |
| `BAR`, `FILL`, `bar()` | the call's bar, measured on the reference | whatever live UI the page draws; measure it in reference pixels off the grid |
| `SOFT`, `GRAIN` | 0.6, 2.4 | start from these; retune only if the grain row or near-line error says so |
| `debug()`, `draw()` live parts, `down()` | eating pieces, filling the bar | the page's own interaction |

Everything else (`paths`, `paint`, `grainTiles`, `soften`, `stillArt`, the
coordinate helpers) carries over unchanged.

## Coordinates

The page draws in three steps from screen units: `ctx.scale(0.6)` onto the
900-wide sheet, `ctx.translate(0, -sheetTop(h))` to the sheet's visible slice,
then `ctx.scale(REF)` into reference pixels. Two helpers go both ways:

```js
const toRef = (x, y) => [x / 0.6 / REF, (y / 0.6 + top()) / REF]      // tap -> reference px
const toScreen = (x, y) => [x * REF * 0.6, (y * REF - top()) * 0.6]  // reference px -> screen
```

Use `toRef` for hit testing and `toScreen` for anything drawn outside the
scaled block (tap hints) or reported by `debug()`.

## `paths()`

Builds `Path2D` objects from the traced strings the first time the page is
shown, not at import, so other pages don't pay for them. Keep it lazy.

## `paint(g)`, the still art

Order matters; each step is there because a measurement asked for it:

1. White over the whole reference rectangle (1200 x 2670 on the couch; use your
   reference's size).
2. `g.scale(0.5)`: traced paths are in half reference pixels. Fill each layer
   in order with `'evenodd'`, and keep the white (`#ffffff`) layer's path: it
   is the paper.
3. Grain over everything: the `up` tile with `'lighter'`, the `down` tile with
   `'difference'`. Together they add zero-mean grain without clipping.
4. Back to `'source-over'`, half scale again: repaint the paper white (the
   reference's paper has no grain), then `BRUSH` in its colour, then `INK` in
   `INK_COLOR`, both even-odd.

Don't stroke the layers to hide seams. The tracer already overlaps them by half
a pixel, and stroking cost 70 ms per paint.

## `grainTiles(g)` and `GRAIN`

A seeded 256 x 256 noise tile (`rng(11)` so it's the same every run), blurred
once 3 x 3 with wrap-around, scaled to a standard deviation of `GRAIN` grey
levels, and split into a lightening tile and a darkening tile. Pixels are
written straight into `ImageData` because drawing them one by one was slow.
`GRAIN` is measured *after* softening, so if you change `SOFT`, recheck it.

## `soften(c, sigma)` and `SOFT`

A Gaussian blur done with the GPU: each pass lays two copies of the canvas,
shifted one pixel either way, over it at alpha `a / (1 - a)` and then `a`,
which blends to the 3-tap kernel `[a, 1 - 2a, a]`. Horizontal then vertical,
repeated until the variances add up to `sigma²`. It exists because Chrome
silently ignores `filter: blur()` under about a pixel. It's called with
`SOFT * m.a`, so the blur is in reference pixels whatever the screen density.

## `stillArt(ctx)`, the cache

The traced art is painted once into an offscreen canvas the size of the
screen, with the live transform, and copied in each frame with the transform
reset. The cache key is the canvas size plus the transform's scale and offset,
so it repaints only when the screen changes (a resize, a rotation). Painting
takes about 170 ms, so it must not happen per frame. Anything that changes
while the page is open is drawn over the copy, never into it.

## Live parts

- **Removed items** (with `regions`): union the removed pieces' paths into one
  `Path2D` and fill it once with `FLOOR`. Filling them one by one leaves a
  hairline seam where two pieces met.
- **UI in reference pixels**: measured positions go straight into the scaled
  block (the couch's `bar()`). Colours of things carried over from another page
  (the bar's `FILL`, `K.ink`) come from that page, not from the trace.
- **Hints**: `tapHint` in screen units, via `toScreen`.

## Hit testing

`down(x, y)` converts the tap with `toRef` and asks
`probe.isPointInPath(piece, rx, ry)` against a spare 2D context with an
identity transform. It tests the same region paths that are drawn, so what
the player sees removed is exactly what they tapped. Skip already-removed
pieces. Regions never overlap (the watershed splits shared edges between
them), so the order they're checked in doesn't matter.

## `debug()`

Return enough state for a Playwright test to drive the page without guessing
coordinates: the counts, a done flag, and the screen position of every
tappable thing (`toScreen` of each piece's `x, y`). Step 6 of the skill's
Playwright check drives the page through it.
