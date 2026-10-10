---
date: 2026-10-11
issue: 52
map: 40
---

# Yoke or strips

Gathers every answer from the map XDGFX/blade-reader#40 so Cal can choose the first order: one
yoke per 12-way fuse panel, or two rev A strips. The choice Cal made is at the end of the summary.

*Yoke*, *arm* and *chin* are the map's working words and are not in the glossary. Prices are USD,
read from JLCPCB on **2026-10-10**, before shipping and tax. Nothing is a quote. The yoke has an
outline and a plate file only: no schematic, placement or routing. Figures marked *estimate* were
worked on paper in this session.

## Executive summary

| | Yoke | Two rev A strips |
|---|---|---|
| Order of 5 bare, 2 assembled | **$77.57**, covers 2 panels | **$57.32**, covers 1 panel |
| Same, covering 2 panels | $77.57 | $79.22 (5 bare, 4 assembled) |
| Each assembled board | $38.79 a yoke | $28.66 a strip (2), $19.80 (4) |
| Each further panel on the order | $19.48 before the multiplexer change | $24.81 |
| Assembly | Economic PCBA, 6 or 7 extended part types | Economic PCBA, 6 extended part types |
| Width on the panel | 117.6 mm (arms 16.7 from the panel edge) | 140.2 mm (bodies 28.0) |
| Length | 122.3 mm, 21 of it chin past the positive end | 105.8 mm, nothing past either end |
| Output nuts | 10.7 mm from the panel edge | 14.0 mm |
| Home Assistant | One device, 12 ways on one clock | Two devices |
| Standby at 12 V | 0.09–0.33 W less (datasheets, not measured) | Reference |
| State of the design | Outline only; clears the CAD model; plate not printed | Placed, routed, order-ready |
| Install | All 12 screws out, feed lug off, battery isolated | One side at a time, feed untouched |
| Panels it fits | 12-way ST Blade, 84.2 mm between rows | 6-way and 12-way, any row spacing |
| One module failing | Loses 12 ways | Loses 6 |

- **Cost.** The yoke is $1.65 cheaper for two panels and $20.25 dearer for one, where the
  difference buys a spare assembled yoke. Before the change to two 74HC4067PWs it was $74.78:
  $4.44 cheaper and $17.46 dearer. Parts are $4.85 less a panel.
- **What the yoke buys.** 22.6 mm less width, nuts 3.3 mm closer in, way numbers 1–12 in silk
  and in firmware, one ground wire, one Wi-Fi client, one first flash, and one clear canvas for
  the silkscreen on the chin.
- **What it costs.** A harder install, a board that fits one panel width, a layout to do from
  an outline, and one arm whose column is a mirror of the other's with coarser readings.
- **Fit.** The outline clears `fuse_block_12` on both rows, as placed and shifted 0.5 mm each
  way. The printed plate (#50) has not been fitted, so the feed lug, the cover and the clone are
  taken on trust.
- **Risks no plate can retire.** That the chin holds its parts and the arm its lines once
  placed; the mirrored arm's sensors; Wi-Fi range beside the feed cable; accuracy on one ground
  nut; JLC's review of a U outline; flex of the assembled arms.
- **Renders** (`explore/yoke`, drawn by `board/scripts/yoke-view.ts`; the yoke's silk is a first
  take): [both options on the panel, bare and wired][r1], [detail][r2], [the chin's parts][r3].

**Recommendation:** go on the yoke. Cost is close to even, and the yoke is narrower, one device,
numbers its ways and keeps its silkscreen in view once wired. What it risks is the feed lug
passing over the chin and the handling of an assembled board, and a printed plate checks the
first before any money is spent.

**Decision (Cal, 2026-10-11): go.** The first order is the yoke. Neither open ticket held the
decision up: the plate is printed and fitted before the fab order, not before the choice, and
the arms get no stiffening bar. The outline was then refined so the chin's inner edge follows
the panel's end 1 mm off all the way round, which makes the yoke 117.6 × 122.3 mm. The strip
stays order-ready on `main` and is not ordered; whether it is kept for 6-way panels is open.

## What each option is

**Strips** (`docs/design.md`, Topology): identical 6-way strips, two per 12-way panel, each with
its own ESP32-C3-WROOM-02-N4, supply, ground nut and J1. On `main` a strip is 105.8 mm long and
its body is 28.0 mm deep, since the WROOM-02 ear. Older tickets quote 25.5.

**Yoke**, as the map now has it (later rulings applied):

- 117.6 × 122.3 mm bounding box, 69.2 cm² of board before holes, since the refinement after the
  decision; #67 drew it at 117.6 × 123.3 and 69.7 cm².
- Arms 16.7 mm deep, ending 6.68 mm past ways 1–2. The band behind the nuts is gone; each sensor
  sits in the gap beside its finger; the VSUP trunk stays behind the nuts (#48).
- Chin 20 mm deep on the centreline, its inner edge 1 mm off the panel's end as `fuse_block_12` has it in plan (1.2–2 mm in #67), each outer
  corner cut back 35 across and 12 along (#67).
- ESP32-C3-WROOM-02-N4 (C2934560, $3.29, extended) on Economic PCBA, square to one chamfer with
  the antenna pointing away from the panel (#66, #47).
- Two 74HC4067PWs (C179326, $0.48, extended) on the chin, one at each arm's root (#65).
- The ground nut's arm has its column mirrored, so all 12 sensors sit on the chin side (#65).
- The feed lug and cable pass over the chin in height, not round it in plan (Cal's ruling).

## Cost

From #51 and [`yoke-cost.md`][cost]. Economic PCBA, 5 bare boards.

| | Yoke, 2 assembled | Strips, 2 assembled | Strips, 4 assembled |
|---|---|---|---|
| Bare boards | 12.80 | 7.30 | 7.30 |
| Fixed assembly fees | 28.13 | 28.13 | 28.13 |
| Joints | 1.29 | 0.76 | 1.52 |
| Parts | 32.56 | 21.13 | 42.27 |
| Order total, four CD4051Bs (C21379, $0.26, preferred) | 74.78 | 57.32 | 79.22 |
| Two 74HC4067PWs instead (#65) | +2.79 | | |
| **Order total** | **77.57** | **57.32** | **79.22** |

- **Parts:** $16.28 a yoke against $10.57 a strip. The saving is one module ($3.29), one supply
  ($1.27), one ground nut (C2916378, $0.17) and the small parts round the module.
- **The bare yoke was priced at 124.2 × 123.31.** It is now 117.6 wide and the price was not
  re-read. No price step lies between, so expect a few cents less.
- **Left out:** minimum-lot and attrition charges, estimated at $3.50–4.10 an order, and the
  twelve 0402 divider resistors on the chin (under $0.05).
- **Standby:** one module fewer saves 0.09–0.33 W, 180–650 mAh a day at 12 V. The sensors draw
  0.47 W either way. The "about 1 W" in `docs/design.md` is not supported.

## Size and the nuts

- Two strips make the install 84.2 + 2 × 28.0 = 140.2 mm wide. The yoke is 84.2 + 2 × 16.7 =
  117.6, so 11.3 mm less each side.
- The floor on two layers is 15.5–16.5 mm: about 1 at the panel edge, 4.6 for the lines to the
  chin and the 9.3 nut pad. 16.7 is a paper figure, drawn from courtyards
  ([`gap.svg`][gap] on `prototype/yoke-arm-depth`).
- The yoke adds about 21 mm past the positive end, where Cal's install has free bulkhead.

## Signals and the mirrored arm

From #65 and [`yoke-arm-lanes.md`][lanes]. On paper only.

- With every sensor on the chin side, 11 lanes pass under the fullest nut where 12 fit, which is
  rev A's own fill.
- The second arm is the first turned 180°, so its sensors would sit on the open-end side: 13
  lanes, and a 3.75 mm overhang past the open end. Mirroring its column fixes both.
- A SOIC cannot be mirrored, only turned, so current runs forwards through that arm's sensors and
  VOUT rises to 2.97 V at 30 A. A divider of about 0.77 on the chin brings it under the ADC's
  2.5 V. That arm reads 23 % coarser. The CC6905's output into a 43 kΩ divider is unchecked.
- Two columns to lay out, not one. Growing that arm 4.3 mm is the fallback.
- ESPHome: one `cd74hc4067` hub for both multiplexers.

## Fit on the chin (estimate)

- About 2,300 mm² of chin against about 650 mm² of courtyards: the WROOM-02 (18 × 14 on the
  board), two TSSOP-24s, the supply, J1, D2, the LED, Q1, the test pads and the ground nut.
  Roughly 28 %.
- The pinch is the module's corner: 3.5–6 mm between the module and the chin's inner edge, which
  that arm's 12 lines share.
- J1 at the chin's outer edge is clear of every ring keepout, which the strip could not manage.
- Nothing is placed or routed. The outline in `board/yoke.circuit.tsx` still draws the MINI-1.

## Antenna

From #47, with the distances #49's correction gives for the close chin.

- The module's corner is about 57 mm from the + stud and about 48 mm from a feed leaving
  straight out. Espressif asks for 15 mm; detuning stops at about 20.
- The feed must not leave diagonally over the module's corner.
- Which corner the module takes rests on a datasheet drawing, to confirm on the footprint.
- The 100 A does nothing to the radio. Its field may matter to the nearest sensors instead
  (about 11 G, worked out before the chin moved).

## Silkscreen (first take, not a design)

- The arm loses the band behind the nuts, so the 58 mm wordmark per strip, two of the three
  chevrons and the spec plate leave the arms.
- The chin gives one canvas of about 118 × 20–28 mm. It stays visible when wired, apart from a
  13 mm corridor under the feed. On wired strips the wordmark sits under six output cables a side.
- The first take fits the wordmark at 56 mm, split either side of the feed, the five spec plate
  cells, the framed kana sign, a twin frame, GND and the credits line. The ground nut's land is
  what limits the wordmark to 56 mm.
- The yoke can print way numbers 1–12. A strip cannot, because which way a sensor reads depends
  on the side it is fitted.

## Handling and stiffening (paper estimate; #63 is open)

Taking FR-4 at E about 22 GPa and flexural strength about 350 MPa.

- An arm is a 16.7 × 1.6 mm cantilever about 95 mm long: about 0.44 N/mm at its tip, out of plane.
- Breaking one takes about 20 N at the tip, at the first nut hole where 10.3 mm of board is left,
  after roughly 45 mm of bend. A bare board will not snap by accident.
- The real limit is the assembled board. Ceramic capacitors are tested to about 2 mm of flex over
  90 mm, which is under 1 N at an arm's tip.
- In plane the arms are about 100 times stiffer.
- A break-off bar across the open end cannot stay fitted: the wall between ways 1–2 and the
  negative bus stands at 100.2–108.2 mm along, up to 21 mm high, against pads at 14.33.
- JLC (#46): a bar is allowed on mouse bites only, at an unpublished cost. No warp tolerance is
  stated; IPC's 0.75 % is about 1.3 mm on this outline's diagonal. The nut body is 1.65 mm from
  the arm's edge against the 2.5 JLC asks at a conveyor edge.

## Install

- **Yoke:** all 12 way screws out and 12 fingers lowered at once, 9.5 mm fingers into 11.1 mm
  pockets. The holes give about ±0.6 mm of float against a fixed 84.2 mm between rows.
- **The feed lug comes off the + stud**, so the battery is isolated first. Strips leave the feed
  alone and go on a side at a time.
- **The lug has to rise.** Its seat (14.33 mm) is level with the board's parts face, and the
  chin's inner edge is 13.3 mm from the stud. To pass over, the lug rises 1.6 mm or more: likely
  a 2 mm washer under it, with 11.9 mm of stud above the seat. Unverified; #50 is its check.
- One ground wire, not two.

## What is lost

- **6-way panels.** A strip fits one; a yoke cannot.
- **Clones of another width.** The yoke fixes the row spacing at the ST Blade's 84.2 mm. The
  clone's width and positive end are unmeasured; the outline allows 2 mm at the end.
- **Half a failure.** One module, supply or ground wire failing loses 12 ways, not 6. Rev A's
  Topology row counts this, and a ground-drop offset, among its reasons for standalone strips.
- **An order-ready design.** The strip is placed and routed. The yoke's layout is a fresh map.
- No ticket settled what becomes of the strip on a go.

## Benefits not in the map so far

- Way numbers in silk, and fixed in firmware with no per-side setting.
- All 12 ways sampled by one device on one clock, so panel totals need no joining of two devices.
- One ground wire, one Wi-Fi client, one first flash through the pogo clamp.
- J1 clear of every ring keepout; the antenna points away from the panel.
- *Speculative:* the chin lies under the feed, where a Hall sensor might read the whole panel's
  current. Not researched.

## The two open tickets

Cal's view is that neither needs to block the choice.

| Ticket | Would have settled | Taken on trust without it |
|---|---|---|
| #50, print the plate and fit it | That it drops on with all 12 holes in their float; that the lug and cable pass over the chin and what that takes; that the cover still fits; the clone | The Fusion model for the row spacing and the positive end; a 2 mm washer under the lug; a cover that is not modelled; a clone whose end is within 2 mm |
| #63, stiffening | How the arms feel in the hand; whether a bar or a thicker board is needed, and its price | The paper estimate above: no bar, 1.6 mm, and care with the assembled board |

## What only a real board answers

- Wi-Fi range on the panel, detuning as the feed cable moves, and the bulkhead 13.5 mm behind
  the antenna (rev A has the same distance).
- Accuracy with one ground nut for 12 ways, and with the feed's field at the nearest sensors.
- The mirrored arm: placement, and the divided sense lines.
- JLC's review of a U outline on Economic PCBA: routing fee, tooling holes, the arms on its line.
- The WROOM-02's 85 °C rating at the chin's corner, where #45 had chosen a 105 °C module.
- The caps under the finger roots, which rely on 1.7 mm over the pocket's lip. The clone's lip is
  unmeasured.

No rev A boards will exist on a go, so none of this has a strip to compare against.

## Sources

Resolution comments on #44, #45, #46, #47, #48, #49, #51, #53, #65, #66 and #67, read with the
map's ruling of 2026-10-10 applied. Notes, each on its own branch:

- [`yoke-chin-position.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-chin-position/docs/research/yoke-chin-position.md) (`research/yoke-chin-position`)
- [`yoke-module-and-adc.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-module-and-adc/docs/research/yoke-module-and-adc.md) (`research/yoke-module-and-adc`)
- [`yoke-jlc-limits.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-jlc-limits/docs/research/yoke-jlc-limits.md) (`research/yoke-jlc-limits`)
- [`yoke-antenna-placement.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-antenna-placement/docs/research/yoke-antenna-placement.md) (`research/yoke-antenna-placement`)
- [`yoke-arm-depth/`](https://github.com/XDGFX/blade-reader/tree/prototype/yoke-arm-depth/docs/research/yoke-arm-depth) (`prototype/yoke-arm-depth`)
- [`yoke-arm-lanes.md`][lanes] (`research/yoke-arm-lanes`)
- [`yoke-cost.md`][cost] (`research/yoke-cost`)
- [`board/yoke.circuit.tsx`](https://github.com/XDGFX/blade-reader/blob/explore/yoke/board/yoke.circuit.tsx) and [`board/fab/yoke-plate.stl`](https://github.com/XDGFX/blade-reader/blob/explore/yoke/board/fab/yoke-plate.stl) (`explore/yoke`)

[r1]: https://github.com/XDGFX/blade-reader/blob/explore/yoke/docs/assets/yoke-installed.svg
[r2]: https://github.com/XDGFX/blade-reader/blob/explore/yoke/docs/assets/yoke-installed-detail.svg
[r3]: https://github.com/XDGFX/blade-reader/blob/explore/yoke/docs/assets/yoke-chin-parts.svg
[cost]: https://github.com/XDGFX/blade-reader/blob/research/yoke-cost/docs/research/yoke-cost.md
[lanes]: https://github.com/XDGFX/blade-reader/blob/research/yoke-arm-lanes/docs/research/yoke-arm-lanes.md
[gap]: https://github.com/XDGFX/blade-reader/blob/prototype/yoke-arm-depth/docs/research/yoke-arm-depth/gap.svg
