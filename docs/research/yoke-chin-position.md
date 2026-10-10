# Yoke chin position

Where the chin of the yoke goes on a Blue Sea ST Blade 12-way, and what it must clear. Answers
[#44](https://github.com/XDGFX/blade-reader/issues/44), part of the yoke map
[#40](https://github.com/XDGFX/blade-reader/issues/40). Yoke, arm and chin are that map's working
words. Checked 2026-10-10.

## Summary

**Recommendation: the chin goes past the end of the fuse panel, and no part of the yoke lies over
the deck.** Its inner edge is set back from the + stud by the rigid length of the feed lug, so it
is an arc and not a straight line 2 mm off the end.

| Option | What it costs | Verdict |
|---|---|---|
| Over the deck | 1.6 mm under the yoke, so no parts on the parts face there. It lies in the feed lug's sweep in every direction, covers both mounting screws and sits under the cover's end wall | No |
| Past the end, inner edge straight, 2 mm off the end | Shortest yoke, about 135 wide by 109 + chin depth long. Works only if the feed lug's barrel passes above 16.4 mm height. Blue Sea's drawing puts the lug seat at about 14–15.4 mm, so it almost certainly does not | Only if Cal's measurement says so |
| Past the end, inner edge on an arc round the + stud | About 29 mm longer with a 40 mm lug. The feed cable still crosses the ring face, but only where it is flexible | **Yes** |
| Both (past the end, with webs over the deck corners) | The webs gain nothing but stiffness and bring back every over-the-deck cost | No |

Two things decide the outline and neither is in the repo: the height of the + stud's lug seat, and
the length of Cal's feed lug. Both are caliper readings on the real panel, listed under
[To measure](#to-measure).

One finding changes the question. A chin that joins two arms round the positive end closes off
every direction the feed cable can leave in, apart from straight up. **The chin cannot clear the
feed cable in plan. It can only clear it in height**, with the cable passing over the ring face.
The yoke sits at the lug's own level, so the cable has to climb to do it.

## Axes

As in [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md), plus one:

- **Along** (a): from the positive end. Negative values are past the end.
- **Across** (c): from the panel's centreline. The long edges are at ±42.10.
- **Height**: up from the mounting face, which is the bulkhead.

Each figure is marked **CAD** (measured in the Fusion `fuse_block_12` model, as recorded in
`fuse-panel-dimensions.md` or [#13](https://github.com/XDGFX/blade-reader/issues/13)), **DS**
(dimensioned on Blue Sea's drawing[^dwg]), **scaled** (scaled off that drawing or judged from Blue
Sea's photographs[^photo], so rough), **inferred** (worked out here) or **unknown**.

## What is at the positive end

| Feature | Value | Source |
|---|---|---|
| Panel outline | 164.40 × 84.20 | CAD; DS 164.39 × 84.20 |
| Deck | a 0–20.2, full width, flat at 12.7 height. The last 8 mm towards the end is rounded over | CAD |
| First barrier | a 20.0–22.3, rising to 18.7–22.9 height | inferred from CAD: way 11–12 screw at 27.83, pocket 11.11 wide, barrier 2.25 |
| + stud | a 11.45, c 0. #10-32, about Ø4.8, top at 26.2 height | CAD; thread from the product page[^spec] |
| Stud to the end, to each long edge, to the first barrier | 11.45, 42.10, 8.6 | inferred from CAD |
| Lug seat (the face of the + bus plate the lug lands on) | About 14–15.4 height, roughly level with the way pads. Scaled off a 480-pixel drawing, ±1 mm. Not to be designed to | scaled |
| Stud boss size, + bus plate outline | Not in the repo. #13 records that the internal bus bar is not modelled, so the plate may not be in the Fusion model at all | unknown |
| Mounting screws, #8 or M4 | 63.50 across and 138.66 along, so c ±31.75 and a 12.87 if centred on the length | DS; "centred" is inferred |
| Mounting screw heads | In round recesses in the deck corners, below deck level | scaled (photo) |
| Model's corner holes | Ø3.15 on 75.6 × 148.6 and Ø2.84 on 53.84 × 125.96. Neither is the DS mounting pattern. Both lie inside the panel outline | CAD; still not reconciled |
| Cover outline in plan | Inside the 164.39 × 84.20 outline: the drawing's overall dimensions are the base's | DS |
| Cover at the positive end | An end wall with an opening for the feed cable. Its lower edge height and the opening's size are not dimensioned anywhere | scaled (photo); dimensions unknown |
| Yoke underside and ring face | 14.33 and 15.93 height: the pad top plus 1.6 mm | CAD + nominal thickness |
| Gap between the deck and the yoke's underside | 1.63 | inferred from CAD |
| Yoke's underside to the bulkhead, clear of the panel | 14.33. The ESP32 on a rev A strip leaves 11.84 | CAD (#13) |

## The feed lug and cable

Blue Sea rates the panel at 100 A[^spec], so the feed can be as large as 35 mm² (2 AWG). No lug
datasheet was checked: the figures below are typical values, and Cal's own lug replaces them.

| Quantity | Typical value | Source |
|---|---|---|
| Tongue width | about 17 | inferred |
| Rigid length R, from the stud centre to the end of the heat shrink | about 40 | inferred |
| Drop: how far the barrel's underside hangs below the tongue's underside | 0 for a flat-seated lug, about 5 for a tube lug with heat shrink | inferred |
| Cable diameter | about 11–12 | inferred |

Blue Sea's own installation photograph[^photo] shows both ways out of an ST Blade end: the positive
feed straight out past the end, and the negative cable sideways across the deck corner and over a
mounting screw. So "whichever way" is the half-circle of directions from one long edge, round
the end, to the other.

In that half-circle the rigid lug sweeps a half-disc of radius R about the stud, at heights from
(seat − drop) upwards: about 9–15 mm up to about 23 mm with the typical figures. The yoke's
14.33–15.93 mm lies inside that range, so the lug and the yoke cannot share plan area.

- Straight out, the rigid lug reaches a = 11.45 − R, which is −28.6 for R = 40.
- Sideways, it reaches c = ±R. For R up to 42 that stays inside the panel's long edge, so it never
  meets an arm.

Beyond the rigid length the cable is flexible and has to pass over the ring face, which means
climbing by 15.93 + 0.5 − (seat − drop): about 1–2.5 mm for a flat-seated lug and 6–7.5 mm for a
tube lug. How much run a 35 mm² cable needs for that was not sourced. The printed plate will show it.

## Over the deck: rejected

- **No room for parts.** 1.63 mm between the deck and the parts face (inferred from CAD). The
  ESP32 and the supply cannot go there, which is the point of a chin-heavy yoke.
- **No path past the stud.** Towards the ways there is 8.6 mm from the stud centre to the first
  barrier, all of it under a 17 mm tongue and across the + bus plate. Towards the end there is
  11.45 mm, 8 of it rounded over, under the lug whenever the feed leaves straight out.
- **It is inside the lug's sweep** in every direction, at the lug's own height.
- **It covers the mounting screws** at a 12.87, c ±31.75 (DS), so the fuse panel could not be
  unscrewed from the bulkhead with the yoke fitted.
- **The cover's end wall comes down over it.** Height unknown.

The same holds for webs over the deck corners, so "both" is rejected too.

## Past the end: the envelope

The yoke stays off the panel's footprint from the first barrier to the end. In plan:

| Edge | Position | Source |
|---|---|---|
| Arm inner edge along the ways | c = ±42.10, the panel edge, as on rev A (`board/lib/outline.tsx`, Y 0). The side wall leans in 0.1–0.8 below it | CAD |
| Arm inner edge beside the deck, a < 20 | c = ±43.1 or further out. 1 mm clear of the edge, because nothing needs it close there | inferred |
| Chin inner edge, floor | a ≤ −2.0 everywhere: the 0.6 mm float of the 5.4 mm holes plus 1.4 mm for a clone whose end is longer | inferred; the clone's end is unknown |
| Chin inner edge, lug arc | Outside a circle of radius R + 2 about the stud (a 11.45, c 0). For R = 40: a ≤ −30.6 at c 0, −28 at ±15, −25 at ±22, −18 at ±30, −12 at ±35, −2 at ±40. A chamfered outline through those points will do | inferred |
| Inner corners | Radius 1.0 at least, as the comb's roots. Larger is better for stiffness | inferred |
| Chin outer edge | No limit from the panel. Cal has ample bulkhead past the positive end; the distance is not recorded | settled in #40; figure unknown |

In height:

| Clearance | Value | Source |
|---|---|---|
| Parts face to the bulkhead | 14.33, everywhere on the chin and on the arms beside the deck | CAD |
| Parts face to the panel's end wall and side walls | Rev A keeps parts 1.5–3.1 off the side wall. Hold 1.5 to the end wall too | CAD (#13); the end figure is inferred |
| Ring face | No parts, no nuts and no bare copper on the chin, nor on the arms where a < 20. The feed cable lies on it | inferred |
| Feed cable over the ring face | Its underside at 16.4 or higher: 15.93, plus 0.16 for board thickness tolerance, plus 0.3 | inferred |
| Stud boss | No clearance to hold: the yoke stays at least 13 mm from the stud in plan | inferred from CAD |
| Mounting screws | No clearance to hold: they are inside the panel outline, 10 mm in from the edge. A screwdriver still reaches them from above | DS |
| Cover | No clearance to hold at the chin: it is outside the cover in plan. The arms leave under the cover's side skirt exactly as a strip does, which #13 accepted on a printed plate | DS; #13 |

What this does to the outline:

- **Size.** With rev A's arms the yoke is about 135.2 wide (84.2 + 2 × 25.5). Its length is 106.6
  (to way 1–2 plus a 12 mm ear) plus the setback plus the chin's depth. The straight chin's
  setback is 2; the arc's is 30.6. A 10 mm chin gives about 119 and 147 mm.
- **The corners are the place for the chin's parts.** The arc leaves the two corner blocks beside
  the deck untouched: a −2 to 20, outboard of c ±43.1, each 22 mm long by the arm's depth, with
  14.33 mm under them. The supply, the ESP32 and the programming pads can sit there, and the chin
  proper shrinks to a bridge that carries traces. That is for the arm depth and antenna tickets to
  judge.
- **The straight chin** is the same envelope with the lug arc removed. It is right only if the
  lug's barrel already passes above 16.4 mm, which needs the seat at 16.4 or higher with a
  flat-seated lug and about 21.5 with a tube lug.

## To measure

None of these is in the repo. The Fusion MCP server was not connected for this ticket.

1. **Lug seat height**: the top face of the + bus plate at the stud, above the mounting face or
   above the deck. A caliper reading on the real panel. Check whether the plate is in
   `fuse_block_12` at all.
2. **Cal's feed lug**: tongue width, length from the hole centre to the end of the heat shrink
   (R), how far the barrel's underside sits below the tongue's, and the cable diameter.
3. **Stud boss** in `fuse_block_12`: its outline and height. The recommended envelope does not
   depend on it.
4. **Cover, positive end**: the height of the end wall's lower edge, the size of the feed opening,
   and whether the cover stays inside the base's outline. The fit ticket's printed plate checks
   the last one directly.
5. **Mounting screws**: confirm c ±31.75, a 12.87 on the real panel, since the model's holes
   disagree with the drawing.
6. **Clone**: its width, and the distance from its positive end to ways 11–12, against 84.20 and
   27.83.
7. **Free bulkhead past the positive end** on Cal's install, in millimetres.

[^spec]: Blue Sea Systems, ST Blade 12 Circuits with Negative Bus and Cover, PN 5026, product
    page: <https://www.bluesea.com/products/5026>. The live page refuses automated requests, so
    it was read from the Internet Archive copy of 2026-04-13:
    <https://web.archive.org/web/20260413180356/https://www.bluesea.com/products/5026/ST_Blade_Fuse_Block_-_12_Circuits_with_Negative_Bus_and_Cover>.
    Positive bus #10-32 stud, 100 A per panel, mounting #8 (M4) screw.
[^dwg]: Blue Sea Systems, dimensioned drawing for PN 5026, linked from that page:
    <https://d2pyqm2yd3fw2i.cloudfront.net/files/resources/dimensioned_drawing/5026.jpg>. It
    dimensions 164.39, 84.20, 38.57, 63.50 and 138.66 mm only. Blue Sea's wiring diagram for
    5026 and 5031 has no dimensions.
[^photo]: Blue Sea Systems product photographs for PN 5026, linked from that page:
    <https://dh778tpvmt77t.cloudfront.net/images/products/5026_install.jpg> (installed, no cover)
    and <https://dh778tpvmt77t.cloudfront.net/images/products/5026_2016small.jpg> (with the
    cover beside it).
