---
name: trace-reference-art
description: Turn a reference image (a phone screenshot of a comic or game page) into canvas art for a page of Mira by tracing it, then prove the match with measurements rather than by eye. Use this whenever the user shares a screenshot or picture and wants a page, scene, panel or object built to look like it ("make this scene", "after the call with mom" plus an image, "it doesn't look like it", "put it side by side until it's tight"), whenever art has to be redone or tightened against a reference, and whenever an already-traced page (pages/*.json here) needs regenerating or tweaking, even if the user never says "trace".
---

# Trace reference art

Pages in this game are drawn on an HTML canvas. When there's a reference image,
don't draw the scene by hand: trace it. On the couch page (chapter 1, page 7),
two hand-drawn attempts scored a pixel error of 49 out of 255 and the user
rightly rejected both. The traced version scores 4.5, and every line of it is
the reference's. Hand-placed shapes can't reach that however long you iterate,
because a hand-inked line's weight and wobble are the look.

This skill is the method that got there, the tools it left behind, and the
traps it hit. Read it end to end the first time; after that, the steps and the
traps table are what you'll come back to.

## Before you start

- **Is the image actually a reference?** A screenshot can be the game itself. On
  the couch page the first thing to settle was that the art didn't exist in the
  code at all: `grep` for what's in the picture, and render the nearest page to
  compare. Then ask the user where the scene belongs if the story doesn't make
  it obvious.
- **What size is it?** A screenshot shared in chat can arrive at half size
  (600 x 1335 for the brushing page). Everything still works in reference
  pixels, with `REF` = 900 / width, but the kernel sizes in the config need
  halving (see *Traps*).
- **Keep the reference out of the repo.** It's someone else's art. The page
  config records its size and sha256 instead, so a later run can check it has
  the same image.
- **Tools.** Python with `pip install opencv-python-headless numpy`; Node with
  Playwright (installed globally in the cloud environment; the scripts find it);
  the dev server, `npx vite --port 5173`. Scripts are in `scripts/` next to this
  file.

## How a reference maps onto a page

Every tall page draws on a **900 x 2000 sheet**: `ctx.scale(0.6, 0.6)`, then
`ctx.translate(0, -sheetTop(height))` (`sheetTop` is in `ch01-wake.js`). A phone
screenshot 1200 px wide lands on that sheet at exactly **0.75**, and its status
bar (77 px) lands on `sheetTop`'s minimum of 58. So **reference pixels are page
coordinates**: the page just adds `ctx.scale(0.75, 0.75)` and draws everything
in reference pixels. For a screenshot of another width the factor is 900 / width.
Measure positions (bars, buttons, items) straight off the reference.

## The steps

1. **Grid the reference** where you need positions:
   `python3 scripts/grid.py ref.png x0,y0,x1,y1 out.png --scale 2` rules a
   labelled grid over a crop. Read off anything in the screenshot that the game
   draws itself (its home button: it gets erased and carried through), and the
   rough shape of anything the player removes or taps.

2. **Write the page config**, `pages/<page>.json`. Copy `pages/ch01-couch.json`:
   the output path, the reference's size and sha256, the status bar, the circles
   to erase, and a `regions` block only if the page has items to take away or
   tap (see *Regions* below).

3. **Trace**: `python3 scripts/run.py pages/<page>.json ref.png --work /tmp/x`.
   It writes `src/game/chapters/<page>-trace.js` and two previews. Look at
   `trace-preview.png` beside the reference at 1:1 (hair, hatching, thin white
   shapes) and `regions-preview.png` (each item tinted its own colour) *before*
   wiring anything up. Wrong there means wrong in the game.

4. **Write the page module** by adapting `src/game/chapters/ch01-couch.js`;
   `references/page-code.md` explains each part and what's page-specific. Add
   it to the chapter's `pages` list.

5. **Measure against the reference** (next section) and iterate until what's
   left is below what the eye can see.

6. **Check it plays**, not just that it looks right. Drive it in Playwright at
   several phone shapes (400 x 864 is the reference's own, 390 x 844 and
   360 x 640 too), through its own `debug()` hook, and watch for page errors,
   60 fps, and every state the player can reach, including ones the reference
   never shows (an emptied tray). The debug list (`?debug`) opens any page directly.

7. **Commit** the config, the generated module and the page. Not the reference.

## Desktop layout

On a landscape window the original is not the phone page scaled up: it's a
white page with the scene in a square framed panel. Measured on the wake page
(desktop screenshots 2000 x 1124, `pages/ch01-wake-desk*.json`):

| | Phone (1200 x 2670 ref) | Desktop (2000 x 1124 ref) |
|---|---|---|
| Scene | full width, torn bottom edge | square panel 504..1501 x 54..1062, heavy frame, centred |
| Scale of the art | 1 | 0.61 of the phone's |
| View | phone x 0..1200, y 77..~1740 | phone x -200..1400, y ~445..2040: about 200 px more each side, the headboard's top cut, more quilt below |
| Label | 170..730 x 1128..1300 | over the panel's lower middle, text at 41 px (phone 50 at 0.75) |
| Card (clock) | 64..1146 x 1756..2366 | 720..1285 x 782..1100: 0.521 of the phone card, centred, hanging over the frame's bottom edge |

The pattern for a page without desktop screenshots: the same panel and frame,
the phone art at 0.61 centred in it, and the card at 0.521 centred and hanging
over its bottom edge. The strips the phone never shows (about 200 phone px
each side) have to come from a desktop screenshot; without one, scale the
phone art to fill the panel's width instead and say the view is narrower.

The engine: a page sets `wide: true`; on a landscape window `api.wide()` is
true and the page draws in CSS pixels of the whole window (`api.width()` x
`api.height()`), fitting the 2000 x 1124 reference into it. `ch01-wake.js` is
the worked example: `drawDesk`, `DESK_*`. Offscreen art canvases must be as
wide as the art, not the window, or a narrow window cuts it off.

Desktop screenshots come in lighter grain (about half the phone's) and softer
(webp, smaller): `DESK_GRAIN`, and expect near-line error around 20-25.

## Measure, don't eyeball

Eyeballing is how the couch went wrong twice. Render the page at the
reference's exact pixel size and measure:

```
node scripts/render.mjs --ref ref.png --status-bar 77 --url 'http://127.0.0.1:5173/?ch=1&p=7' --out mine.png
python3 scripts/measure.py ref.png mine.png --status-bar 77 --out /tmp/m \
    --ignore 1000,77,1160,307 \
    --grain couch=30,1080,300,1500 page=200,2400,1000,2600 \
    --tones tray=180,1850,1000,2270 --crop face=440,620,880,900
```

What each number tells you, with the couch's final values as a benchmark:

| Measure | What it catches | Couch |
|---|---|---|
| `side.png` overlay (right panel) | Doubled lines mean misalignment. Fix placement before anything else | no doubling |
| error everywhere | Overall; hand-drawn art sits around 49 | 4.45 |
| error near lines | Line weight and edge softness | 13.6 |
| by band / `heat.png` | *Where* it's wrong. Thin edge traces everywhere = done; a blob = a real mismatch there | tray band highest, 8.2 |
| grain at 1 / 2 / 4 px | Printed texture on flat areas. Match within about 10%; white paper must be 0 | 0.72/1.30/1.68 vs 0.82/1.31/1.56 |
| tones | Share of black / dark grey / mid / light in busy areas. Catches "heavier" or "lighter" | within a point per bin |
| crops | The eye check at 3x, for the things numbers summarise | |

How to work the loop:

- **Change one thing, re-measure, keep it only if the numbers move.** A change
  worth less than about 1% that costs bytes or load time isn't worth it; the
  couch rejected rougher ink edges for that reason (1% for 50-75% more data).
- **When something looks off, sample pixels across it** in both images: a row of
  gray values through one stroke. That's how the too-thin ink and the grey
  fringes were found; guessing at them wasted two rounds.
- **Error everywhere bottoms out around 4.5.** The reference's grain is random,
  so no grain lines up with it pixel for pixel; judge texture by the grain row.
- **Prove any guarantee with a negative control.** When a test says something
  works, switch the fix off and check the same test fails. On this project a
  font test passed for the wrong reason until it was checked this way.

## The page, in brief

`references/page-code.md` has the detail; the shape of it:

- The traced module exports `LAYERS` (colour fills, back to front), `BRUSH` and
  `INK` (grey hatching and black pen, as filled shapes), `INK_COLOR`, and with
  regions `PIECES` and `FLOOR`. Art paths are half reference pixels; regions are
  whole ones.
- Paint the art **once** into a canvas the size of the screen, then copy it each
  frame. Rebuild only when the screen size changes. Only the live parts (removed
  items, a filling bar, hints) draw per frame.
- Order: white paper, colour layers (even-odd), grain over paint only, brush,
  pen, then a slight blur of the whole thing. Grain and blur are tuned to the
  reference: `GRAIN` 2.4 and `SOFT` 0.6 on the couch. Recheck both with the
  grain row and the near-line error if a new reference looks different.

## Regions: things the player takes away

If items get removed (eaten, picked up), each needs its own region, so removing
one shows what's under it without cutting into its neighbours. `regions.py`
seeds a watershed from rough shapes you give it (circles, "drums" for things
like maki rolls, polygons), with a draw order for overlaps. It puts each boundary
down the middle of the ink line two items share. It also hands the floor showing
between items to the nearest one, so removing everything leaves a clean empty
container, and samples the floor's colour for `FLOOR`. The shapes only need to be
right to about 15 px; the watershed finds the real edge. Check the tinted preview.

What shows where an item has gone: trace a screenshot of the page with
everything taken away as a second config (`keep` limits the trace to what
changes, `pages/ch01-couch-empty.json`), paint it into its own canvas, and copy
it in clipped to the eaten regions. A flat `FLOOR` fill is only the fallback;
on the couch it read as dark holes (error 12.4 against the empty-tray
screenshot, 3.9 traced).

Where an item in front hides part of one behind, taking the front one away
should show the rest of the one behind. Only a screenshot can show that: the
couch has one of the back-left maki left alone (`pages/ch01-couch-one.json`),
drawn over its own region too once the one in front has gone, since that
one's outline crossed it. For the others the reference never showed the
hidden part; tell the user, and ask for a screenshot of that state.

Two regions meet down the middle of the ink line between them, which belongs
to the item in front. When the one behind goes, give the one in front its
other half back: the pen only (not the still art, which brings the eaten
item's edge with it) in a band along its region, clipped to the eaten area.

## Traps

Each of these cost a round on the couch. The symptom is how you'll recognise it.

| Symptom | Cause | Fix (already in the tools unless noted) |
|---|---|---|
| Grey fringe beside black lines | The detector for brown areas (hair) fired along thick lines, and dropped the ink threshold there | Brown areas are found by an opening on the mid-dark band, which keeps solid areas and drops line rims |
| Thin white shapes vanish (chopstick insides) | A 5 x 5 opening deletes anything under 5 px | 3 x 3 opening |
| Colours slightly cool or warm | Cluster centres came from a blurred copy through 8-bit Lab | Each layer takes the median of the reference's own clean pixels |
| Flat areas split into patchwork, data doubles | More clusters get spent splitting one flat tone | Merge colours closer than a just-noticeable difference (Lab 3) |
| Busy areas read heavier than the reference | The reference's black strokes have soft grey rims; a crisp trace turns them black | The page's `soften()` blur; check the tones row |
| Pale seams between colour areas | Anti-aliased edges of adjacent fills | Layers overlap by half a pixel. Stroking every layer also works but cost 70 ms to paint |
| The blur does nothing | Chrome ignores canvas `filter: blur()` under about a pixel | `soften()` does it by hand with shifted, semi-transparent copies |
| Grain on white paper | The reference's paper has none; only paint does | Grain everywhere, then the white layer repainted clean |
| The screenshot's own button gets traced | It's part of the image | `erase` in the config, with lines carried through |
| Removing items leaves outlines or seams | Regions didn't own the floor between them; each drawn separately | Regions take the floor gaps; removed ones are filled as one shape |
| Eaten pieces leave dark holes; the bar stays after the tray is empty | The flat `FLOOR` fill, and the page drew the bar to the end | Trace the empty state and copy it in where pieces went; hide the bar once full, and her lap shows where it was |
| A piece left behind shows a cut-off bottom, or the eaten piece's outline across it | The piece in front hid it in the reference | A screenshot of it alone, over its own region too once the one in front goes (see *Regions*) |
| Removed item shows a grey cut-out | Wrong floor colour: the sample caught nearby grey | Sample within the floor's gray band; check the preview |
| Hair turns into black blocks, dark tiles trace as grey brush, thin grout vanishes (brushing page) | A half-size screenshot (600 px wide): the 7 px solid-area opening and 3 px speck opening are too big for it, and the tiles are darker than the solid band | `solid_open` 4, `speck` 2, `solid_max_gray` 100 in the config; halve `SOFT` and retune `GRAIN` (0.3 and 0.9 there) |
| Eyes come out as faint grey dashes, every line a touch light (commute page) | Contours run through pixel centres, so each traced stroke loses half a 2x pixel a side; on a half-size screenshot a 2 px eye dash loses half its weight | `ink_grow` 1 (near-line error 14.3 to 13.9 on both half-size pages) |
| A panel's content has to move (a feed that scrolls, a toothbrush that slides) | It's baked into the still art | Copy that rectangle of the still canvas shifted, clipped to the panel and inset past its border's soft rim; draw new content in the same place (`ch01-commute.js`) |
| Stars in a night window disappear | Ink holes under `ink_min_area` are dropped | `ink_min_area` 1.5 |
| The screenshot's button covers a corner, not a line running through | `erase` can only carry straight lines through | `paint` in the config: fill it with the wall, then draw the corner back (rects sampled from nearby, pen lines) |
| A page that pans repaints its art every frame | The still-art cache is keyed on the whole transform | Key on everything but the sideways offset and draw the copy at it (`ch01-brush.js`) |
| The screenshot has text the game must not show (another character's name on a label) | It's part of the image | `paint` a rect of the label's own colour over it, trace the label, and write the page's text live on it (`pages/ch01-wake.json`) |
| Something animated in the screenshot (the wake page's clock card drops, shakes, flips) | Baked in, it can't move, and nobody has seen what's behind it | Trace it alone (`keep`, with what changes blanked, `pages/ch01-wake-card.json`), copy its painted canvas in under the moving transform, and draw only the changing part live. Fill what's behind it with `tile`: repeat real rows of the same pattern from nearby |
| A measure moves between runs on the same code | Something in the shot animates (a shaking card) | Compare that part by eye in a crop, or read the other bands |
| Test "passes" but the fix isn't working | A Playwright `load` wait includes fonts; cached files skip `route()`; `document.fonts.check()` says loaded while loading | Measure order from navigation, a fresh browser context, gate on `document.fonts.load()`, and a negative control |

## Budget

A full-screen traced page is about 290 KB raw, about 96 KB gzipped, in its
`-trace.js`. The still-art canvas takes around 170 ms to build when the page opens
(desktop Chromium), and play holds 60 fps after that. Lowering `ink_eps` or
`ink_smooth` in the config keeps more of the pen's roughness at a real cost in
bytes; on the couch it wasn't worth it.

## Files

- `scripts/run.py`: trace a page end to end from its config
- `scripts/tracer.py`: colour layers, brush and pen
- `scripts/regions.py`: per-item regions and floor colour
- `scripts/gen.py`: writes the ES module
- `scripts/grid.py`: gridded crops for reading positions
- `scripts/render.mjs`, `scripts/measure.py`: the comparison loop
- `pages/*.json`: one config per traced page; `ch01-couch.json` is the worked example
- `references/page-code.md`: how the page draws the traced data
