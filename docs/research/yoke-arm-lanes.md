# Yoke: the lines along each arm, and the open end

For [Do the arms carry all 12 ways' lines to multiplexers on the chin?](https://github.com/XDGFX/blade-reader/issues/65),
part of the [yoke map](https://github.com/XDGFX/blade-reader/issues/40). Worked on paper on
2026-10-10 from rev A's lane plan in `board/lib/routes.tsx`, the revised column in
`docs/research/yoke-arm-depth/gap.ts` (branch `prototype/yoke-arm-depth`) and the outline in
`board/yoke.circuit.tsx` (branch `explore/yoke`). Nothing here is placed or routed. *Yoke*, *arm*
and *chin* are the map's working words.

## Summary

- **The lines fit, on the lane plan rev A already uses, if each way's sensor sits on the chin
  side of its finger.** Then the fullest point under any nut carries 11 lanes of the 12 that fit,
  the same as rev A.
- **Thirteen lines are only together at the arm's root**, past the last nut, where nothing pinches
  them. Along the arm the count tapers: each way adds its two lines as it is passed.
- **The arm turned 180° is the problem on both counts.** Its sensors sit on the open-end side of
  their fingers, so the last one overhangs the open end by 3.75, and every way's own two lines
  pass under its own nut: 13 lanes under the nut nearest the chin, where 12 fit.
- **That arm's column can be mirrored, but not for free.** A SOIC cannot be mirrored, only turned,
  so on the mirrored arm load current runs IP+ → IP− and VOUT rises with load, where rev A fits
  the sensor backwards so that it falls. Unscaled, that arm stops reading at about 19 A.
- **Recommendation: mirror it, and divide that arm's six sense lines on the chin** (twelve 0402
  resistors beside the multiplexer). The arms stay as drawn, 16.7 deep and ending 6.68 past
  ways 1–2.
- **Multiplexers: two 74HC4067PWs, one at each arm's root**, over four CD4051Bs. $2.79 more on
  the order, for a third of the area on the chin and two ADC pins back.

## Where the lanes are pinched

The channel is the ring face between the GND bus (out to 1.0) and the ring keepouts. Rev A's lanes
are 0.15 wide on a 0.35 pitch from 1.45 out, with 3V3 at 5.8.

With the nut row at 10.68, each ring keepout (a Ø10 ring about the nut) comes down to 5.68 out at
the nut's centre. Swinging the tongue ±20° or ±39° does not bring it lower. The keepout's lower
edge, by distance along the arm from the nut's centre:

| Along | 0 | 1.0 | 1.5 | 2.0 | 3.0 | 4.0 |
|---|---|---|---|---|---|---|
| Keepout starts, mm out | 5.68 | 5.78 | 5.91 | 6.10 | 6.68 | 7.68 |

So the pinch is about 4 mm long under each nut, six times an arm. Between nuts the ring face is
free to about 10 out, which is where lines drop in.

Lanes that fit under a nut:

| Lane plan | Lanes | Top trace to the keepout |
|---|---|---|
| Rev A's: 0.35 pitch from 1.45 | **12** | 0.31 |
| 0.35 pitch from 1.375, hard against the bus's 0.3 clearance | 13 | 0.03 |
| 0.30 pitch from 1.45 (0.15 trace, 0.15 gap, the board's own clearance rule) | 14 | 0.26 |

Rev A's 3V3 at 5.8 is inside the keepout for about 1.6 either side of each nut's centre, so on the
yoke it takes a lane or dips under each nut. It is counted as a lane below.

## How many lanes each nut sees

Nuts are numbered from the chin. A way's sense line starts at its sensor's signal pins and its
voltage line at the divider under its finger root; both are on the sensor's side of the nut. The
parts face under the nut is that way's line and load copper, so neither can cross there.

| Nut from the chin | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Sensors on the chin side: 2 for each way further out, and 3V3 | **11** | 9 | 7 | 5 | 3 | 1 |
| Sensors on the open-end side: the way's own 2 as well | **13** | 11 | 9 | 7 | 5 | 3 |

- **Chin side:** 11 of rev A's 12. A temperature sensor part-way along that arm adds one lane under
  the nuts between it and the chin, which makes 12 of 12; at the arm's root it adds none.
- **Open-end side:** 13, one more than rev A's plan holds. It fits only on a plan with no spare
  (13 of 13) or at 0.30 pitch (13 of 14).

Twelve analogue lines run side by side for up to 67 mm. Only one is read at a time and the rest sit
at steady voltages, and rev A already runs lanes 0.2 apart the length of the strip.

## Which arm is which

The column as drawn keeps rev A's handedness: sensor on the +X side of its way seen from the parts
face, IP pins towards −X, IP− nearest the panel. Turned onto the yoke, +X points at the chin on
the arm at PCB −X (the module's side in `yoke.circuit.tsx`) and at the open end on the arm at
PCB +X (the ground nut's side). So the ground nut's arm is the one that overhangs and the one
with 13 lanes.

## The open end: three ways out

| | Mirror that arm's column (recommended) | Grow that arm | Mirror, no divider |
|---|---|---|---|
| Arm | As drawn, both ends alike | About 4.3 longer at the open end: the yoke is 127.6 long and no longer symmetric | As drawn |
| Lanes under the fullest nut | 11 of 12, rev A's plan | 13: no spare at 0.35, or one spare at 0.30 | 11 of 12 |
| Sensor | Turned 180°, current IP+ → IP−, VOUT rises to 2.97 V at 30 A | As rev A on both arms | As left |
| Extra parts | 12 × 0402 on the chin, basic, under $0.05 | None | None |
| Reading | 23 % coarser on that arm; sign and scale differ by arm | Same on all 12 ways | That arm reads to about 19 A only |
| Layout work | Two columns to place and route, not one turned 180° | One column | Two columns |
| Cal's ruling that the arms carry nothing past ways 1–2 | Kept | Broken by a sensor, on one arm | Kept |

- **Why the mirror reverses the current.** Mirrored, the sensor's IP pins must still face its own
  finger and nut, which takes the part turned 180°. That puts IP+ nearest the panel and IP−
  nearest the nut. Keeping rev A's direction (finger → IP− → IP+ → nut) would cross the line and
  load copper over each other, and the ring face under them is the channel. On two layers the
  current has to run the other way.
- **Why that needs a divider.** `board/lib/way.tsx` fits the sensor backwards because the
  ESP32-C3's ADC is accurate only to about 2.5 V, and VOUT rising from 1.65 V at 44 mV/A passes
  that at about 19 A.
- **Where the divider goes.** Anywhere along the line, so on the chin at the multiplexer's input,
  not in the column. About 10 kΩ over 33 kΩ gives 0.77: 1.27 V at rest and 2.28 V at 30 A. Each
  way's one-off zero and gain calibration takes up the ratio. One divider after the multiplexer's
  common would do it in 2 resistors, but then the multiplexer's on-resistance is part of the
  ratio and drifts the gain, and with a 16:1 part it scales that arm's voltage lines too.
- **Growing the arm instead** keeps one column and one polarity, and is the fallback if the
  mirrored column will not place.

## Multiplexers on the chin

Prices and status are JLC's on 2026-10-10, at the quantity for 2 assembled yokes of a 5-board
order, from [`yoke-cost.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-cost/docs/research/yoke-cost.md).
The rest is from [`yoke-module-and-adc.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-module-and-adc/docs/research/yoke-module-and-adc.md).

| | 2 × 74HC4067PW (recommended) | 4 × CD4051B |
|---|---|---|
| LCSC, price | C179326, $0.48 | C21379, $0.26 |
| JLC status | Extended: $3.07 on the order | Preferred: no fee |
| Cost on the order | **$2.79 more**, with its caps counted | |
| Package | TSSOP-24, 7.8 × 6.4 over the pins | SOIC-16, courtyard 10.6 × 7.9 |
| Area on the chin | About 115 mm² | About 335 mm² |
| Module pins | 4 selects, 2 commons: 2 ADC pins used, GPIO0 spare | 3 selects, 4 commons: all 4 clean ADC pins used |
| At 3.3 V | Inside its 2–10 V supply range; 110 Ω typical at 4.5 V | Nothing specified at 3.3 V; 470 Ω typical at 5 V, which is why rev A waits 5 ms a step |
| ESPHome | `cd74hc4067` as written | `cd74hc4067` with a dummy fourth select |
| Proven on rev A | No | Yes |
| Across the chin from the far arm | 4 selects, 1 common | 3 selects, 2 commons |

Each arm brings 12 lines to its own corner of the chin, so a 16:1 part at each root takes one
arm whole, with four inputs over for the temperature and the supply voltage. The difference is $1.40 an
assembled yoke, nearly all of it the fee. It buys the smaller footprint on a chin that Cal wants as compact as it can be
and that also holds the supply, the module, the programming pads and the ground nut, and it
returns the ADC pin that the four-part arrangement has no spare of.

The pin counts were made for the ESP32-C3-MINI-1. The WROOM-02 chosen since brings out the same
15 GPIO.

## If the lanes had not fitted

For the record, since the recommended arrangement needs none of these.

| Way out | Cost |
|---|---|
| Tighter lanes, 0.30 pitch | Nothing in money: 14 lanes. Less margin than rev A proved |
| Deeper arm | 0.35 an arm for each extra lane, so 0.7 on the yoke's width |
| Four layers | $20–35 more on the board and green only under Economic PCBA (`docs/design.md`, Routing) |
| Ears back, with a multiplexer in each | 12 mm past ways 1–2 on each arm, against Cal's ruling; 5 lines at each root |

## Not checked

- Placed or routed in tscircuit. The mirrored column in particular is a paper claim.
- Where each line's via lands. Under the sensor's body, between its pin rows, is the likely place.
- That the chin holds the multiplexers with everything else. This map draws no placement.
- The CC6905's output driving a 43 kΩ divider. The datasheet's load figure was not read.
- The costing in [Cost the yoke against two strips](https://github.com/XDGFX/blade-reader/issues/51)
  assumes four CD4051Bs. Two 74HC4067PWs make the yoke's $74.78 into $77.57, and the twelve
  resistors add a few cents.
