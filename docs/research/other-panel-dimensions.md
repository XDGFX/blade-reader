# Fit dimensions of two other fuse panels

Whether the yoke outline drawn for the Blue Sea ST Blade 12-way
([#40](https://github.com/XDGFX/blade-reader/issues/40)) fits two other 12-way fuse panels: the
Narva 54450BL and the common generic panel with an LED column. Checked on 2026-10-10. The same
figures apply to the rev A strip, which shares the yoke's fingers and pitch.

**Neither panel takes the yoke, or a strip, as drawn.** Both have screw pads in pockets open to
the long side, all in one plane, so the concept carries over; each needs its own outline.

## Side by side

All in mm.

| | Blue Sea ST Blade | Narva 54450BL | Generic LED panel |
|---|---|---|---|
| Way pitch | 13.36 | 11.70 | 12.7 (12.5–12.9) |
| Between the two rows of way screws | 67.16 | 76.0 | 69.3 (68.3–70) |
| Way screw inset from the long edge | 8.52 | 8.5 | about 7.8 |
| Pocket clear width | 11.11 | 10.5 | about 9.7–10.2 |
| Pad top above the mounting face | 14.33 | 16.00 | not found |
| Barrier above the pad | 4–8.5 | 4–8 | not found |
| Open to the long side at pad height | yes | yes | yes |
| End way screw to the positive end | 27.83 | 28.5 | 20.8 ± 0.8 |
| Way screw thread | #8-32 | not modelled | M4 |
| Body | 164.4 × 84.2 | 165.0 × 93.0 | 138.25 × 85 |
| Source | CAD, [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md), and a printed plate | simplified STEP | one factory drawing and photos |

The pitches span 1.66 mm and the row spacings 8.8 mm, so no one outline with slotted holes fits
all three.

## Narva 54450BL

Measured from Narva's STEP model, `Narva12WayFuseBox(54450BL).stp`, supplied by Cal and not kept
in the repo. Read with cadquery: bounding boxes, the faces of the terminal solids, and vertical
ray casts at 0.1 mm steps. The model is simplified: it has no threads, holes, fuses or internal
bus, so every figure is nominal.

- **Solids:** base, cover, 12 way terminals, 4 bus bars and 3 studs. 165.0 × 93.0, 58.0 tall
  with the cover and 30.5 without.
- **Way terminals:** six per long side, aligned across the panel. Each is a flat plate
  11.0 × 10.5 × 2 with a Ø8 screw head. M4 is a guess from the head.
- **Pitch 11.70, rows 76.0 apart.** Against the yoke that is 1.66 out per way, about 4.15 at the
  end ways if centred, and 8.84 too narrow across, so the arms would land on the barrier ends.
- **Pads:** tops at 16.00, all 12 in one plane, on a deck at 14.0. The flat runs 5.5 outboard of
  the screw centre and stops 2.75 short of the edge.
- **Pocket:** 10.5 clear between barriers 1.2 thick, so a 9.5 finger has 0.5 a side. Barrier
  tops slope from 24.0 at the inner wall to 20.0 at the edge. Open to the long side with no wall
  or lip, and open above.
- **Way end:** the end screw is 28.5 from the panel's end. Past a 2.5 barrier is open deck at
  14.0 with two studs 9.5 either side of the centreline, 11.5 from the end, seats at 17.0. The
  Blue Sea has one + stud on the centreline. That these two are the positive feed is inferred.
- **Far end:** four bus bars of three screws on 11.0 pitch, then one stud on the centreline.
- **Cover:** modelled, but its skirt reaches 14.0 along the ways with no openings and overlaps
  the barriers, so it cannot say whether a board passes out under it.

A Narva outline needs 11.7 pitch and 76.0 between rows. Each way's column is 1.66 narrower than
the Blue Sea's, which bears on the yoke's plan to put each sensor in the gap beside its finger
([#48](https://github.com/XDGFX/blade-reader/issues/48)).

## Generic LED panel

The panel sold as Nilight, Kohree, Baywatt ATCH12B, Jaycar SZ2032 and many others: clear snap
cover, a column of red LEDs down the middle, four 3-screw negative bars in two rows at one end,
and a stud on the centreline at each end. No CAD model or caliper measurement was found. The
figures rest on one factory drawing, listing specifications, and pixel measurements on four
images scaled from their printed dimensions.

| Figure | Value | Backing |
|---|---|---|
| Way pitch | 12.7 (12.5–12.9) | Four image reads: 12.6, 12.6, 12.73, 12.68 [1][2][3] and Cal's listing image |
| Between rows | 69.3 (68.3–70) | The screws sit in line with the 70 mm mounting holes, or up to 0.5 a side inboard [1][2] |
| End way screw to positive end | 20.8 ± 0.8 | Three reads |
| End way screw to negative end | 53.6 ± 0.8 | Three reads |
| Pad width, pocket clear width | about 9.6, about 9.7–10.2 | Two photos [2][3] |
| Body, mounting holes | 138.25 × 85 (88 over the latches) × 36.5, 70 × 123.25 | Factory drawing [1][2]; [3], [4] and [5] agree |
| Threads | M4 way screws, M5 studs | [1][3][4][5] |
| Open to the long side | Yes | One oblique close-up [2]; a square-on photo [3] agrees |
| Pad and barrier heights | Not found | — |

- **Against the yoke:** 0.66 out per way, about 1.65 at the end ways if centred, where a Ø5.4
  hole gives an M4 screw only 0.7 of slack. A 9.5 finger has 0.1–0.35 a side even on the right
  pitch, so this panel wants narrower fingers. The rows are about 2.1 wider apart.
- **Positive end:** the + stud is about 14 past the end way screws and about 6.7 from the end.
- **Its pitch is not 16.8.** That figure came from the difference in length between the 6-way
  and the 12-way, divided by three (`generic-fuse-boxes.md`, on its research branch). The 12-way
  has a second row of negative bars that the 6-way lacks, so the 50.5 difference is three
  pitches (38.1) plus about 12.4 of bus row.
- **Cal's listing image** gives 137 × 85 and holes on 68 × 121. The factory drawing is taken as
  right, since two other listings agree with it.
- **A lookalike exists.** OptiFuse's BLR-I-1212-G [6] is 131.57 long with holes on 70.80 × 117.80,
  a spare-fuse slot before the ways, and a pitch of about 13.0 read off its drawing. A panel
  with an LED column is not certain to be this body.

## Still unknown

- Narva: the way screw thread, and whether the cover clears a fitted board.
- Generic: pad height, barrier height, screw length, and the cover.
- Both: a panel in hand and a printed plate, as was done for the Blue Sea and its clone
  ([#13](https://github.com/XDGFX/blade-reader/issues/13)).

## Sources

All checked 2026-10-10.

1. Baywatt ATCH6B/ATCH12B, the factory drawing:
   https://www.baywatt.com/products/ato-atc-fuse-block-with-nevative-busbar-and-led-indicator-6-or-12-way
2. Kohree 12-way, the same drawing with its own photos:
   https://www.kohree.com/products/12v-fuse-block-12-way
3. Tailored12v LV5401, its own sketch and photo:
   https://tailored12v.com/products/6-way-fuse-block-standard-blade-fuse-with-negative-bussbar-and-led-light-copy
4. Nilight, inch dimensions and threads:
   https://www.nilight.com/products/nilight-12-way-blade-fuse-block-12-circuits-with-negative-bus-fuse-box-holder-with-led-indicator-ato-atc-fuse-panel-waterproof-cover-for-12v-automotive-cars-marine-boats-rvs-trailers-2-years-warranty
5. Jaycar SZ2032, read from a search snippet only:
   https://www.jaycar.com.au/powertech-12-way-fuse-block-with-bus-bar/p/SZ2032
6. OptiFuse BLR-I-1212-G, a different body:
   https://www.optifuse.com/optifuse_ecommerce_tools/datasheets/BLR-I-1212-G.pdf
