# Fuse panel fit dimensions

Fit dimensions of the Blue Sea ST Blade 12-way fuse panel (with negative bus), for laying out the
way monitor that bolts onto its positive output screws (XDGFX/hailey#178). Answers XDGFX/hailey#191.

Source: Fusion document `fuse_block_12`, measured on 2026-10-09 with read-only scripts (bounding
boxes and ray casts). Each value is marked **CAD** (measured), **DS** (datasheet drawing) or
**unknown**.

## The model

- 40 bodies: the base in two pieces, 24 screws, 22 lock washers and the two studs.
- **The cover is not modelled.** Nothing about the cover comes from CAD.
- The screws are modelled seated hard down with no ring terminal under them.

Axes used below:

- **Height** is measured up from the mounting face (the underside of the base).
- **Inset** is measured in from the long side edge the screws sit along.
- **Along** is measured from the positive end, the end with the + stud and ways 11–12.

## Envelope

| Dimension | Value | Source |
|---|---|---|
| Length | 164.40 mm | CAD (DS 164.39) |
| Width | 84.20 mm | CAD (DS 84.20) |
| Base height, no cover | 26.21 mm | CAD |
| Height with cover | 38.57 mm, so the cover adds about 12.4 mm above the base | DS |
| Mounting holes | Four Ø4.4 through holes on a 63.6 × 138.8 mm rectangle (DS 63.50 × 138.66): along 12.8 and 151.6 mm, 31.8 mm either side of the centreline. Each sits in a Ø9 recess with its floor at 8.0 mm height. The Ø3.15 features on 75.6 × 148.6 and the Ø2.84 ones on 53.84 × 125.96 are posts and blind counterbores on the underside, not mounting holes | CAD, 2026-10-10 |

## Positive output screws (the ways)

| Dimension | Value | Source |
|---|---|---|
| Count | 12: six down each long side, ways paired across the panel | CAD |
| Pitch | 13.36 mm (13.360 between centres) | CAD |
| Inset from the long edge | 8.52 mm | CAD |
| Centre to centre across the panel | 67.16 mm | CAD |
| Along, ways 11–12 to ways 1–2 | 27.83, 41.19, 54.55, 67.91, 81.27, 94.63 mm | CAD |
| From the negative end, same screws in reverse | 69.77 to 136.57 mm | CAD |
| Thread | Ø4.17 mm, which is #8 major diameter | CAD; DS says #8-32 |
| Head | Pan head, Ø8.18 mm, 2.9 mm tall | CAD |
| Lock washer | Ø8.13 OD, Ø4.31 ID, about 0.5 mm | CAD |
| Terminal pad top | 14.33 mm height | CAD |
| Head underside, as modelled | 15.14 mm height (pad + washer) | CAD |
| Head top, as modelled | 18.02 mm height | CAD |
| Thread below the pad | 7.1 mm | CAD |

The negative bus has six more screws, three per side at the negative end, 11.07 mm pitch and
8.45 mm inset. The way monitor does not touch them.

## Pocket around each screw

Each screw sits in a pocket between two barriers. The pocket is open to the long side and runs
inwards to the fuse holder wall.

| Dimension | Value | Source |
|---|---|---|
| Clear width between barriers | 11.11 mm at the pad, widening to 11.6 mm at the barrier top (draft) | CAD |
| Barrier thickness | about 2.25 mm | CAD |
| Pocket depth, from the side | From the base edge to the fuse holder wall, inset 0.3 to about 14.5 mm. Screw centre 8.5 mm in | CAD |
| Pad step at the outer end | Pad steps down from 14.3 to about 12.3 mm height in the last 3 mm before the edge | CAD |
| Side wall below the pocket | Solid base side up to about 11.7 mm height; above that the pocket is open to the side | CAD |
| Barrier top | Slopes from 22.9 mm height at the inner end to about 18.7 mm at the outer end | CAD |
| Base top (fuse area) | 26.21 mm height | CAD |

## Panel ends and negative bus

Measured on 2026-10-09 with the same read-only method, for the strip's body length
(XDGFX/blade-reader#15).

| Dimension | Value | Source |
|---|---|---|
| Negative bus screws | Three per side, along 113.54, 124.62, 135.69 mm (11.07 pitch), inset 8.45 mm, pad top 14.32 mm | CAD |
| Negative bus pocket | One shared pocket, along 108.2–141.2 mm, no barriers between the three screws. Open to the long side like a way pocket | CAD |
| Wall between way 1–2 and the negative bus | Along 100.2–108.2 mm, solid up to about 19.4–21 mm height | CAD |
| + stud | On the centreline, along 11.33 mm, Ø4.83 (#10), top at 26.2 mm height | CAD, 2026-10-10 |
| + stud lug seat | 14.33 mm height, the same plane as the way pads. Flat out to Ø10.5, sloping to the 12.7 mm deck at Ø18. The nut (9.14 across corners, 2.9 thick) is modelled 1.6 mm above it | CAD, 2026-10-10 |
| − stud | On the centreline, along 153.0 mm, about Ø4.8, top at 26.2 mm height | CAD |
| Ends | Along 0–20.2 and 144.5–158 mm: a solid side up to about 12.7 mm, with a flat deck at that height, open above apart from the stud boss. The last 8 mm at each end is rounded over | CAD |
| Long sides | Solid up to about 12.6–12.7 mm height along the whole length. They lean in slightly: inset 0.1 at 1 mm height and 0.8 at 12 mm. Nothing protrudes beyond the side edges anywhere | CAD |

Every pocket, way or negative bus, has a 12.6 mm lip at the edge and a groove at about 3 mm
inset down to 11.3 mm. The pad starts at about 3.2 mm inset.

## Cover

| Dimension | Value | Source |
|---|---|---|
| Overall top | 38.57 mm height | DS |
| Wall thickness, inside top height | unknown; about 36 mm if the wall is 2.5 mm | unknown |
| Side cutout size and position | unknown | unknown |
| Head top to cover inside | about 18 mm with the screw as modelled; about 16.5 mm with a 1.5 mm ring terminal under the head | estimate from DS, not CAD |

## Design implications

- **A single board cannot sit flat on the pads under all the screws.** The barriers rise 4 to
  8.5 mm above the pads, so a board spanning ways has to sit above the barrier tops (above
  22.9 mm height at the inner end, 18.7 mm at the outer end), or beside the panel, or reach in
  as fingers no wider than 11.1 mm, one per pocket.
- **Stacking a 1.6 mm board under a screw clears the cover comfortably on height**: ring
  terminal plus board lifts the head about 3 mm, to roughly 21 mm, against a cover inside of
  about 36 mm. What cannot be checked is whether the cover's side skirt and cutouts let a
  board pass out of the side at pad height; that needs the cover.
- The screws have about 7 mm of thread below the pad. A 1.6 mm board plus a ring terminal
  lifts the head about 3 mm and leaves about 4 mm engaged, which should hold, but check a longer #8-32 if the stack
  grows.
- The XUNPU PCB-05-M4 terminal from `way-monitor-terminals-and-copper.md` is 11 mm tall. Fitted
  on a board at pad level it would reach about 27 mm height, above the barriers and below the
  cover's likely inside.

## Not determinable from CAD

- Anything about the cover: wall thickness, side skirt depth, cutout size and position.
- Ring terminal thickness: depends on the crimps actually fitted. Take 1–1.5 mm for typical #8 rings
  until measured.
- Space beside the panel in the cabinet: not in this model; it depends on the cabinet layout.
