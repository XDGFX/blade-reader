---
date: 2026-10-11
issue: 97
map: 71
---

# The USB socket's edge line, and the room a plug needs

Answers XDGFX/blade-reader#97: where the TYPE-C-31-M-12's datasheet puts the board's edge, whether
`board/imports/TYPE_C_31_M_12.tsx` as placed agrees, how much room a USB-C plug needs between the
parts face and the bulkhead, and what `board/scripts/fit-plate.ts` needs to get past the stake
slots. Nothing in `board/` is changed by this note.

## Summary

- **The socket does not have to move.** The datasheet draws the board's edge 5.79 mm in front of
  the two locating pegs, which leaves the mouth 0.49 mm proud. As placed the pegs are 5.756 mm
  from the chin's edge and the mouth 0.52 mm proud: 0.034 mm further out than the datasheet, inside
  its own ±0.05 mm layout tolerance. Moving J2 from `A_OUTER + 4.85` to `A_OUTER + 4.884` would
  make it exact; it is not worth a re-route.
- **The stake and pad pattern matches** in every position. The footprint's stake slots are wider
  and shorter than the datasheet's and its pads longer; the part still fits (below).
- **A plug needs 5.2 mm between the parts face and the bulkhead**, at the chin's outer edge, for
  the largest overmould the USB Type-C specification allows. The panel's CAD puts about 14.3 mm
  there, so it clears by about 9 mm if the panel is screwed flat to the bulkhead.
- **`fit-plate.ts` needs one branch for `pill` holes**, about five lines, tried and reverted here.
  `fit-print.ts` has the same gap and fails silently.

## Sources

| Source | What it is | How good |
|---|---|---|
| HRO drawing "TYPE-C-31-M-12", rev A, drawn 2020-12-08, one sheet. [LCSC's copy for C165948](https://datasheet.lcsc.com/datasheet/pdf/9e56b777c022540fcce7c7f67825f55e.pdf?productCode=C165948), read 2026-10-11 (SHA-256 `6ae33d50…38da1a9e`) | The manufacturer's own drawing: part views and "RECOMMEND P.C.B LAYOUT (COMPONENT SIDE)", with a line labelled PCB EDGE | Primary. A vector drawing, read at 600 dpi. The edge line is dimensioned outright. Pad length and stake thickness are not dimensioned. One 0.01 mm inconsistency (below) |
| USB Type-C Cable and Connector Specification, Release 2.5, March 2026, [usb.org](https://www.usb.org/sites/default/files/USB%20Type-C%202.5%20Release%20202603.zip) | Figures 3-1 (receptacle), 3-3 (plug), 3-82 and 3-83 (overmould clearance) | Primary. Figures 3-1 and 3-3 are normative except dimensions in brackets, which section 3.2.1 calls reference only; 3-82 and 3-83 are informative |
| `board/dist/index/circuit.json`, built from this commit with `--routing-disabled` | Where J2's holes and pads are on the yoke | The board itself |
| `docs/research/fuse-panel-dimensions.md` | Height of the way pads above the panel's mounting face, from Blue Sea's CAD | CAD, not measured on a panel |
| Assmann WSW drawing [ASS 10363 CA rev 04](https://www.assmann-wsw.com/uploads/datasheets/ASS_10363_CA.pdf) | One real cable's plug | Secondary, one example |

The socket is C165948, extended, $0.1879 each at 5 on LCSC, 2026-10-11.

## The datasheet's edge line against the socket as placed

Distances are in mm from the chin's outer edge, into the board; negative is past the edge. J2 is
at `at(25, A_OUTER + 4.85, 180)`, so a footprint y of `v` is `4.85 + v` from the edge. The
"as placed" column is read from the built circuit JSON, not worked from the footprint.

| Feature | Datasheet | As placed | Difference |
|---|---|---|---|
| Mouth of the shell | −0.49 | −0.52 | 0.034 further out |
| Front stake slots, centre | 2.11 | 2.076 | 0.034 |
| Locating pegs, centre | 5.79 | 5.756 | 0.034 |
| Rear stake slots, centre | 6.29 | 6.256 | 0.034 |
| Rear of the shell | 6.86 | 6.83 | 0.034 |
| Lead tips | 7.26 ± 0.10 | 7.23 ± 0.10 | 0.034 |
| Signal and power pads | 6.29 to 7.43 | 6.374 to 7.674 | front end 0.08 further in, back end 0.24 |

How the datasheet's column is built: the layout gives 5.79 from the peg centres to the PCB EDGE
line, 0.50 from the pegs back to the rear slots' centres, 4.18 between the slot rows and 1.64 from
the pegs to the pads' back end. The part's bottom view gives 6.28 from the mouth to the pegs, so
the mouth is 6.28 − 5.79 = 0.49 past the edge. The side view agrees: 2.60 from the mouth to the
front stakes, against 6.28 + 0.50 − 4.18 = 2.60 by the layout. It gives 6.77 to the
rear stakes where the layout gives 6.78; that 0.01 is the drawing's own. The top view gives the
shell as 7.35 long with the leads 0.40 ± 0.10 past its back.

Everything on the footprint is shifted by the same 0.034, so the features agree with each other
exactly and only the edge is off. The datasheet's layout tolerance is ±0.05. JLC's tolerance on a
routed outline is larger than that (not checked for this note), so the 0.034 is lost in the fab.

**Verdict: no move.** `docs/design.md` says the mouth is "drawn 0.5 proud of the edge, which its
datasheet has not confirmed"; the datasheet confirms it, at 0.49.

### Across the socket

| Feature | Datasheet | Footprint |
|---|---|---|
| Stake slots, centre to centre across | 8.65 | 8.650 |
| Pegs, centre to centre | 5.78 | 5.800 |
| Peg holes | Ø0.60, for Ø0.50 pegs | Ø0.60 |
| Eight signal pads | 0.30 wide at 0.50 pitch, ±0.25 to ±1.75 | the same |
| Four power and ground pads | 0.60 wide, centred ±2.40 and ±3.20 | the same |

### Stake slots and pads: where the footprint differs

| | Datasheet | Footprint |
|---|---|---|
| Rear slot, hole | 0.60 × 1.70 | 0.80 × 1.50 |
| Rear slot, plated land | 0.90 × 2.00 | 1.20 × 2.00 |
| Front slot, hole | 0.60 × 1.40 | 0.80 × 1.20 |
| Front slot, plated land | 0.90 × 1.70 | 1.20 × 1.80 |
| Pad length | 1.14 (1.64 − 0.50, not dimensioned itself) | 1.30 |

The stakes are 1.10 long at the rear and 0.80 at the front (side view), so they have 0.20 a side
along the footprint's slots against the datasheet's 0.30. Their thickness is not dimensioned; they
are folded from the shell, and the footprint's slot is 0.20 wider than the datasheet's. They reach
1.01 below the parts face, so they stop 0.59 short of the ring face of a 1.6 mm board, as
`docs/design.md` says. The leads' visible part lies 7.26 − 0.40 = 6.86 to 7.26 from the datasheet's
edge, inside both pads; the footprint's longer pad leaves 0.45 of toe where the datasheet's leaves
0.17.

The footprint is the one EasyEDA holds for C165948, the pattern JLC's own library places this part
on. Nothing here asks for it to be redrawn to the datasheet.

## The room a plug needs

From the specification, Release 2.5:

| Figure | Value | Where | Standing |
|---|---|---|---|
| Overmould, greatest height | 7.0 max | Fig 3-3, section C-C | Normative |
| Overmould, greatest width | 12.85 max | Fig 3-3, section A-A | Normative |
| Overmould length | (35) | Fig 3-3 | Reference; no maximum is given |
| Overmould's front face to the plug's tip | 6.65 ± 0.10 | Fig 3-3, section C-C | Normative |
| Plug shell | 8.25 ± 0.03 × 2.40 ± 0.03 | Fig 3-3 | Normative |
| Receptacle shell, mouth to where the plug stops | (6.20), designed to ± 0.20 | Fig 3-1, 3.2.1 note 7 | Reference |
| Clearance round the overmould | 0.05 min | Fig 3-82, 3.10.3 | Informative |
| Receptacle opening | 8.34 +0.06/−0.02 × 2.56 ± 0.04 | Fig 3-1 | Normative |

The specification gives no cable bend radius or strain-relief length, and says nothing about where
a receptacle stands against a board's edge. Releases before 2.5 were not opened.

Worked from those and the datasheet (estimates, not stated by either source):

- **The plug's centreline is about 1.65 mm off the parts face.** The socket is 3.26 high and its
  opening 2.56; the datasheet does not dimension the centreline, and 1.63 to 1.68 covers a shell
  wall of 0.30 to 0.35.
- **A largest-allowed overmould reaches 1.65 + 3.5 = 5.15 mm from the parts face towards the
  bulkhead**, and 3.5 − 1.65 = 1.85 the other way, which is 0.25 past the ring face. With the
  specification's 0.05 clearance the bulkhead has to be **5.2 mm or more from the parts face**.
  The Assmann plug, 6.4 ± 0.2 high, needs 4.95.
- **The overmould never reaches the board.** Seated, its face is 6.65 − 6.20 = 0.45 from the
  socket's mouth, 0.15 to 0.75 over the tolerances, so 0.67 to 1.27 outside the chin's edge as
  placed. That is what the 0.49 overhang is for: an overmould 7.0 high is deeper than the socket
  and the board together, and with the mouth flush or set back it would land on the board's edge
  before the plug seated.
- **What has to be clear** is a box outside the chin's edge, 25 mm from the panel's centreline on
  the odd side: 12.85 wide, so 6.5 either side of the socket's middle; from 5.2 on the bulkhead's
  side of the parts face to 0.3 past the ring face; and running straight out from the edge for
  the plug and the cable's bend. The specification's reference overmould is 35 long; the Assmann
  plug is 25 of body and 5 of strain relief on a 5 mm cable. **About 60 mm straight out** is an
  estimate for a plug and a gentle bend, not a sourced figure.

The way pads are 14.33 mm above the panel's mounting face in Blue Sea's CAD, and the fingers lie
on them parts face down, so the parts face should be about **14.3 mm off the bulkhead**: 9 mm more
than the plug needs. That holds only if the panel is screwed flat to the bulkhead with nothing
under the chin.

**For Cal to measure**, on the fitted plate or a panel in place:

1. From the bulkhead up to the underside of a way's pad, or of the plate at the chin's edge.
   Wanted: 5.2 mm or more; expect about 14.
2. Whatever stands on the bulkhead below the panel's positive end, between 18 and 32 mm to the
   odd side of the centreline, within 60 mm of the chin's edge: a cable clip, a batten, the feed
   cable's run, the optional printed support.

## What `fit-plate.ts` needs

`fit-plate.ts` throws `unhandled hole shape pill` at line 45: it takes round holes only, and J2's
four stake slots are the yoke's only `pcb_plated_hole`s with `shape: "pill"`. They carry
`hole_width` 0.8, `hole_height` 1.2 (front) or 1.5 (rear) and `ccw_rotation: 180`, and no
`hole_diameter`. The script's `slot()` already draws a round-ended slot of any width and height.

The change, tried on this commit and reverted: in the loop over `pcb_hole` and `pcb_plated_hole`,
keep `circle` as it is, and for `pill` push `slot(h.x, h.y, h.hole_width, h.hole_height)`,
swapping width and height when `ccw_rotation` is 90 or 270 and throwing on any other angle; throw
on every other shape as now. With that it writes 33 holes and slots in 9716 triangles, and the
mesh is closed: every edge is shared by exactly two triangles and none is degenerate.

Two things beside it:

- **`fit-print.ts` has the same gap and does not fail.** Line 30 draws every hole as a circle of
  `hole_diameter / 2`, so the four slots come out as `<circle r="NaN">` and are missing from the
  1:1 print. It needs the same branch, drawing a `<rect>` with `rx` of half the slot's width.
- **The slots do nothing for the fit check.** The stakes stop inside the board, nothing passes
  through, and a 0.8 mm slot is at the limit of what a printer cuts. Skipping `pill` holes would
  pass too. Cutting them is as cheap and keeps the script's promise of every hole and slot, and
  on the paper print they show where the socket stands.

## Not verified

- The plug's centreline height on this socket, to better than ±0.03: the datasheet does not
  dimension it.
- JLC's smallest plated slot and its outline tolerance, against the footprint's 0.80 mm slots.
  The footprint is JLC's own for this part, which is the only evidence here that they build it.
- The 14.3 mm from the parts face to the bulkhead: CAD, and it assumes a flat bulkhead.
- The 60 mm of straight run: an estimate.
- Any plug larger than the specification allows. None was found; none was looked for beyond one
  maker's drawing.
- Overmould limits in releases of the specification before 2.5.
