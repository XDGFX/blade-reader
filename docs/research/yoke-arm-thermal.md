---
date: 2026-10-11
issue: 74
map: 71
---

# Yoke arm thermal: do the 16.7 mm arm's rules and derating differ from rev A's?

Re-runs the rev A strip estimate ([#17](https://github.com/XDGFX/blade-reader/issues/17),
`strip-thermal.md` on `research/strip-thermal`) on the yoke's arm, with the same sheet model,
the same sinks and the same pessimistic and optimistic bounds, so the two compare directly.
Temperatures are **rises over ambient** unless stated. Every figure is an estimate from a
simplified model of a column that has not been placed or routed.

## Answer in brief

- **The derating holds as written:** 30 A a way and 100 A a panel up to 40 °C in free air; 20 A
  a way above 40 °C or in a closed locker. The yoke runs **about 4–9 K hotter** than rev A at
  the sensor with a whole arm loaded, and about the same with one way loaded. At 20 A the
  pessimistic package rise is +41 K against rev A's +39 K, so 20 A is still good to 60 °C.
- **The margin at 30 A is thinner.** The central package rise with six ways at 30 A is about
  **+67 K**, against rev A's +60 K. Rev A's own bench trigger for 2 oz copper was +65 K. The
  bench test matters more on the yoke than it did on the strip.
- **Layout rules: the same five, reworded for the new column** (§5). Solid stitched pours, no
  thermal relief and mask over them all stay. What changes is where the copper can be: the
  path from finger to nut is on the parts face only and about 5.9 mm wide.
- **1 oz stays, with 2 oz as the fallback.** 2 oz takes about 17 K off the sensor pads. It is
  harder to adopt than on rev A: JLC's 2 oz minimum trace is 0.16 mm and the arm's lanes are
  0.15 mm on a plan with one lane spare (§5).
- **The WROOM-02-N4's 85 °C limit is safe on the chin**, and safer than rev A's ear: **+22 K**
  with an arm at 30 A (rev A +29 K), **+37 K** pessimistic with all twelve ways at 30 A (rev A
  +48 K). That is 77 °C at 40 °C ambient. About half of the central figure is the module's own
  0.3 W. **Keep the module's body 15 mm or more from the nearest sensor's body**; the outline
  as drawn gives about 17 mm.
- **Neighbours couple more on one side.** A way at 30 A puts +10 K on the sensor of the next
  way out from the chin (28 % of its own rise), against +6 to +7 K on rev A.

## 1. What the rev A estimate was actually run on

Three things in the rev A note matter for a like-for-like comparison.

- **It was run on a 40 mm body, not 25.5.** `strip-thermal-model.py` builds an 80.16 × 40 mm
  body with the nut row 16 out, slots between the nuts and the module behind the nuts: the
  design basis of 2026-10-09. The body later shrank to 25.5 and then 28.0 with the module in
  the way 1 ear, and the estimate was not re-run. So this note runs rev A three ways: as
  estimated, at 25.5 and at 28.0 (nut row 14 out, no slots, no module on the body).
- **Body depth barely moves the sensor.** Six ways at 30 A give +46 K at 40 mm, +45 K at 25.5
  and +45 K at 28.0. The path's own resistance and the sinks at its two ends set the
  temperature; the board behind the nuts adds little. That is also why the 16.7 mm arm costs
  less than its area suggests.
- **The copper resistance table does not add up to its total.** Its rows sum to 0.94 mΩ
  (0.19 + 0.12 + 0.38 + 0.20 + 0.05) and the total is given as "about 0.75 mΩ (estimate
  0.5–1.0)". The model ran at 0.75. This note keeps 0.75 for rev A and works the yoke's figure
  as a difference from it (§2).

The model here ([`yoke-arm-thermal-model.py`](yoke-arm-thermal-model.py)) holds both
geometries and reproduces the rev A note's table from its defaults: +46 K sensor pads, +35 K
nuts and +29 K module with six ways at 30 A; +74, +57 and +48 K pessimistic.

## 2. Inputs

Unchanged from the rev A note, and not re-read from the datasheets here:

| Quantity | Value | Source |
|---|---|---|
| CC6905 conductor | 0.5 mΩ typ, 0.6 mΩ max at 25 °C, +3900 ppm/K | Cross Chip CC6905 datasheet rev1.3, as recorded in `strip-thermal.md` §1 |
| CC6905 limits | 125 °C ambient, 165 °C junction. No θJA or θJC | Same |
| Package over pads | +10 to +17 K at 0.5 W, inferred from the datasheet's demo board. +14 K central and +17 K pessimistic at 30 A, scaled by I² | `strip-thermal.md` §4 |
| Air, wire, panel | h 10 W/m²·K a face (7–12); wire fin 0.02 W/K at +15 K (0 to +25); panel link 0.1 W/K at +20 K (0 to +40), both scaled by I² | `strip-thermal.md` §3 |
| Module | ESP32-C3-WROOM-02-N4, −40 to 85 °C ambient, 0.3 W | `docs/design.md`, ADC row; [Espressif datasheet](https://www.espressif.com/sites/default/files/documentation/esp32-c3-wroom-02_datasheet_en.pdf), rating as recorded in `economic-pcba-wifi-mcu.md` |

New for the yoke:

| Quantity | Value | Source |
|---|---|---|
| Outline | 117.6 × 122.3 mm, arms 16.7 deep, nut row 10.68 out, chin 20 deep, chamfers 35 × 12 | `board/yoke.circuit.tsx` on `explore/yoke` |
| Column | Sensor in the gap beside its finger, body centred 4 out, on the column's boundary. Diode in the neck between two nuts. Line and load copper below the nut, about 5.9 wide | [#48](https://github.com/XDGFX/blade-reader/issues/48), revised resolution; `gap.ts` on `prototype/yoke-arm-depth` |
| Sensor side | On the chin side of its finger on both arms, so the way nearest the chin has its sensor on the 5.25 mm of arm between its finger and the chin | [#65](https://github.com/XDGFX/blade-reader/issues/65) |
| Module | On one chamfer of the chin. Modelled as 18 mm wide with 14 of its 20 mm on the yoke, where the outline draws the MINI-1. Its nearest corner is then about 17 mm from the nearest sensor's body (inferred) | `yoke.circuit.tsx`; map [#71](https://github.com/XDGFX/blade-reader/issues/71), which leaves the corner open |
| 2 oz at JLC | Minimum trace and space 0.16 mm, 0.20 advised; price only in the live quote | `jlc-fab-rules.md` on `research/jlc-fab-rules` |

### Copper per way

| | Rev A as estimated | Rev A, 25.5 body | Rev A, 28.0 body (`main`) | Yoke arm |
|---|---|---|---|---|
| Board per way: 13.36 × depth, plus a 9.5 × 13 finger | 658 mm² | 464 mm² | 498 mm² | **347 mm²** |
| Against rev A as estimated | — | 71 % | 76 % | 53 % |
| Finger to nut, along the current | about 20 mm | about 20 mm | about 20 mm | about 12 mm, with a turn |

The model takes all of that board as copper on both faces, as the rev A estimate did. On the
yoke a loaded arm also has the chin and, through it, the other arm; they take little, because
the board's spreading length is about 37 mm.

### Copper resistance per way (estimate)

By the rev A note's table, changing only what the column changes:

| Piece | Rev A | Yoke |
|---|---|---|
| Finger, both faces, from the screw head's edge | 7.4 mm to the IP pins: 0.19 mΩ | 4.4 mm to the panel edge: 0.11 mΩ |
| Finger root sideways to the IP pins, parts face only (the ring face is the channel), about 0.4 □ | — | 0.20 mΩ |
| IP pins to the nut pad | 5.1 mm, both faces: 0.12 mΩ | About 2–3 mm, parts face only, about 0.3 □: 0.15 mΩ |
| Crowding at the pins, spreading at the clamp and nut, vias | unchanged | unchanged |
| **Difference** | | **+0.15 mΩ** |

So the yoke is taken at **0.90 mΩ** where rev A is 0.75 (range 0.6–1.2 against 0.5–1.0). The
results also give the yoke at 0.75, to separate the geometry from the resistance. Rev A as
built already carries part of this: its design row has the line on the parts face only for
about 4 mm below IP−, adding about 0.1 W at 30 A.

## 3. Results

Sensor pads are the hottest way's. Package is pads plus the package-over-pad rise. "One way"
is a way in the middle of the row (way 3).

### Central

| Case | Rev A as estimated (40) | Rev A at 28.0 | Yoke, 0.75 mΩ | **Yoke, 0.90 mΩ** |
|---|---|---|---|---|
| Six adjacent at 30 A: pads | +46 | +45 | +50 | **+53** |
| Six adjacent at 30 A: package | +60 | +59 | +64 | **+67** |
| Six adjacent at 30 A: nut pads | +35 | +35 | +37 | **+40** |
| One way at 30 A: pads | +35 | +28 | +34 | **+36** |
| One way at 30 A: package | +49 | +42 | +48 | **+50** |
| Six adjacent at 20 A: pads | +20 | +19 | +21 | **+22** |
| Six adjacent at 20 A: package | +26 | +25 | +27 | **+28** |
| One way at 20 A: pads | +15 | +12 | +14 | **+15** |
| One way at 20 A: package | +21 | +18 | +20 | **+21** |
| Loss per way at 30 A | 1.32 W | 1.32 W | 1.32 W | 1.49 W |

Rev A at 25.5 is within 0.5 K of rev A at 28.0 in every row. Rev A's one-way figure falls at
28.0 because the model there has no slots between the nuts, so the heat spreads sideways.

More yoke cases, at 0.90 mΩ:

| Case | Hottest pads | Module |
|---|---|---|
| The way nearest the chin alone at 30 A | +41 | +19 |
| 3 × 30 A + 10 A on the ways nearest the chin (100 A) | +51 | +22 |
| 100 A over one arm (16.7 A each) | +15 | +13 |
| 100 A over all twelve ways (8.3 A each) | +5 | +11 |
| All twelve at 30 A (360 A, an envelope far past the panel's rating) | +53 | +23 |
| Idle, module only | +2 | +11 |

With a whole arm loaded, its end ways run cooler than the middle: +48 K nearest the chin and
+51 K at the open end, against +53 K.

### Bounds and variants

| Case | Rev A as estimated | Yoke |
|---|---|---|
| Pessimistic, six at 30 A: pads / package | +74 / +91 | **+83 / +100** (+78 / +95 at rev A's resistance) |
| Pessimistic, one way at 30 A: pads | +55 | +54 |
| Pessimistic, six at 20 A: pads / package | +31 / +39 | **+34 / +41** |
| Pessimistic, 3 × 30 A + 10 A: pads | not run | +80 |
| Optimistic, six at 30 A: pads | +23 | +29 |
| 2 oz, six at 30 A: pads | +32 (as estimated), +31 (28.0) | **+36** (+59 pessimistic) |
| 2 oz, one way at 30 A: pads | +26 | +25 |
| Ring face under the sensors at half copper (lanes, not pour), six at 30 A: pads | not run | +56 |

Pessimistic is h 7, CC6905 0.6 mΩ, copper at the top of its range, panel +40 K, wire +25 K;
optimistic is h 12, copper at the bottom of its range, panel and wire at ambient.

At 40 °C ambient, six at 30 A puts the yoke's package at about 107 °C central and 140 °C
pessimistic (rev A: 100 and 130 °C). Both are inside the CC6905's 165 °C junction limit. The
pessimistic figure is at the top of the 130–140 °C the rev A note gives for standard FR-4's
glass transition. At 20 A and 60 °C ambient the pessimistic package is about 101 °C.

### Neighbour coupling

One way at 30 A, rise at its neighbours' sensor pads:

| | Loaded way | Neighbour towards the chin (rev A: lower number) | Neighbour away from the chin | Two ways off |
|---|---|---|---|---|
| Rev A as estimated | +35 | +6 | +4 (the MMBT3904's island is between them) | +1 to +2 |
| Rev A at 28.0 | +28 | +7 | +6 | +2 to +3 |
| **Yoke** | **+36** | **+5** | **+10** | +2 to +3 |

- On the yoke each sensor's signal side faces the line and load copper of the next way
  towards the chin, across the pours' clearance. So a loaded way heats the sensor of the next
  way out, the one whose body stands beside its finger root: 28 % of its own rise, against
  17–25 % on rev A.
- At the CC6905's worst-case offset slope (4.5 mA/K, `strip-thermal.md` §5) +10 K is up to
  45 mA on an idle neighbour. It is small, and the same I² term corrects it if firmware
  includes the neighbour.
- This is heat only. The loaded way's copper passing about 1 mm from the next sensor's body is
  also a stray-field question, which this note does not assess.

## 4. The module on the chin

The module's figure is the hottest board under it, its own 0.3 W included, as in the rev A
note. Its limit is 85 °C in the air immediately outside it.

| Case | Rev A (module behind the nuts) | Yoke |
|---|---|---|
| Idle | +8 | +11 (+12 pessimistic) |
| Six adjacent at 30 A | +29 | **+22** |
| Pessimistic, six at 30 A | +48 | **+35** |
| Pessimistic, twelve at 30 A | — | **+37** |
| Pessimistic, 3 × 30 A + 10 A nearest the chin | — | +35 |
| Pessimistic, twelve at 20 A | — | +22 |

- **At 40 °C and 30 A a way: 77 °C pessimistic**, 8 K inside the limit. Rev A's pessimistic
  case was 88 °C, which is why the derating note was tied to the 85 °C module.
- **Above 40 °C the note's 20 A applies:** +22 K pessimistic, so 82 °C at 60 °C ambient.
- **How far from the nearest way.** With the module unpowered, the load alone puts this on
  the arm's root, by distance towards the chin from the nearest sensor's body:

  | Distance | 2 mm | 5 mm | 10 mm | 15 mm | 20 mm | 30 mm |
  |---|---|---|---|---|---|---|
  | Six at 30 A, central | +23 | +20 | +17 | +15 | +13 | +11 |
  | Six at 30 A, pessimistic | +39 | +35 | +30 | +27 | +24 | +21 |
  | Twelve at 30 A, pessimistic | +40 | +36 | +32 | +29 | +26 | +24 |

  Add the module's own +11 to +12 K. At 15 mm the pessimistic total is about +41 K, so 81 °C
  at 40 °C; at 5 mm it is about +48 K, which passes 85 °C. **15 mm from the nearest sensor's
  body to the module's body is the floor; the outline's 17 mm or so is enough.** Sliding the
  module 10 mm along the chamfer towards the arm costs 3 K (+25 K central).
- The chin's ground pour is what spreads the module's own heat. Keep it whole on both faces
  round the module, outside the antenna's keepout.

## 5. Layout rules

Rev A's rules, from `strip-thermal.md` §6 and the Copper row of `docs/design.md`, and what
the yoke does to each:

| Rule | Rev A | Yoke |
|---|---|---|
| Solid pours along the way's path, both faces, nothing routed across | Finger 8.9 wide on both faces; body 7.5 and 5 wide on the parts face | **Holds, with less room.** Finger as rev A. From the finger root to the nut only the parts face is free (the ring face is the channel from 1.3 out), and it is about 5.9 wide. Give it all of that width, with nothing across it. The caps under the next finger's root take about 3 of that finger's 8.9 on the parts face ([#48](https://github.com/XDGFX/blade-reader/issues/48)): keep the ring face whole there |
| No thermal relief on the IP pins or the nut pad | Yes | **Unchanged** |
| Stitching, 0.3 mm tented vias | 10 at the clamp, 8 above IP+, 5 round the nut | **Unchanged at the clamp and the nut.** At the pins only the pair nearest the panel can reach ring-face copper, in the 1.0 mm between the panel edge and the channel; stitch there if the placed column leaves room |
| Mask over the pours, bare only where the panel and rings clamp | Yes | **Unchanged** |
| Way copper stops 0.5 short of the module's ground | At the ear | **Unchanged in size, new place:** the way nearest the chin has its sensor on the arm's root, with the chin's ground on its signal side. That ground is a useful sink (that way runs about 5 K cooler), so pour it up to the 0.5 clearance and do not run way copper onto the chin |
| Clearance between ways' pours | 0.5 in the sensor band | **Unchanged.** More would not help: the coupling in §3 comes from the sensor standing beside its neighbour's copper, not from the gap's width |
| 1 oz | "1 oz is fine", 2 oz if a package passes +65 K on the bench | **1 oz, with the same trigger, now more likely to be met** (below) |

### 1 oz against 2 oz

| | 1 oz (recommended) | 2 oz |
|---|---|---|
| Six at 30 A, pads | +53 (+83 pessimistic) | +36 (+59 pessimistic) |
| One way at 30 A, pads | +36 | +25 |
| Module, six at 30 A | +22 | +16 |
| Lanes | 0.15 mm on a 0.35 pitch, as [#65](https://github.com/XDGFX/blade-reader/issues/65) planned | 0.16 mm minimum, 0.20 advised. At 0.16 on a 0.35 pitch the 12 lanes still fit, with the gap down from 0.20 to 0.19. At 0.20 / 0.20 they need 4.6 mm under each nut where about 4.2 is free, so the arm grows by about 0.4 or loses a lane |
| Other minimums | — | Annular ring 0.254, mask bridge 0.20 |
| Cost | — | Not published; read from the live quote, and check it is accepted with Economic PCBA |

2 oz buys about 17 K at the hottest sensor, more than on rev A (13 K), because more of the
yoke's path is on one face. It is not free on this arm. The recommendation is to route at
1 oz with the lanes drawn 0.16 wide, which costs nothing now and leaves 2 oz open at the fab
release without re-routing.

## 6. Recommendation

1. **Keep the derating note unchanged** for the yoke: 30 A a way and 100 A a panel up to 40 °C
   in free air; 20 A a way above 40 °C or in a closed locker. Change "expect a way at 30 A to
   run about 40–60 °C above ambient at its sensor" to **about 50–70 °C**.
2. **Keep the WROOM-02-N4.** The H4 is no longer needed for the temperature; keep it as the
   order-time swap the design basis already lists.
3. **Place the module 15 mm or more from the nearest sensor's body.**
4. **Carry rev A's layout rules over as the table in §5 words them**, and draw the arm's lanes
   0.16 wide so 2 oz stays open.
5. **Stay at 1 oz**, and decide 2 oz from the bench, by rev A's own trigger.
6. **Firmware, for the ticket that owns it:** a temperature sensor on the chin sees only about
   +11 to +15 K of an arm whose sensors are at +53 K, so the I² term per way carries nearly
   all of the correction on the yoke. Add the neighbour term from §3 to it.

If the bench shows a package over +65 K, the choices are 2 oz, or lowering the 30 A threshold
from 40 °C to about 35 °C, which takes back the 4–9 K the arm costs and is free.

## 7. What only a bench test can settle

In order of how much each moves the answer:

- **The panel terminal's temperature at 30 A.** As on rev A it is most of the spread between
  +29 and +83 K. The fuse's own 2.5 W is there whatever the yoke does.
- **The package's rise over its pads.** Still inferred from one demo board; the datasheet
  gives no θJA.
- **The placed column's resistance.** 0.90 mΩ is a paper figure for a column that has not been
  placed. It is worth 3 K at the pads for each 0.15 mΩ. Measure the drop from screw to nut at
  a known current on the first yoke.
- **The run to take:** way 3 or 4 of one arm alone at 30 A for 30 minutes, then three adjacent
  ways at 30 A plus one at 10 A, the ways nearest the chin. Thermocouples or IR on a CC6905's
  package, the next sensor out from it, a nut and the module's can, with the yoke fitted to a
  panel with its fuses and load cables.
- **Closed lockers.** h of 7 W/m²·K is the pessimistic end of free air, not an enclosure.

## 8. Not checked

- The CC6905 and WROOM-02 datasheets were not re-read; their figures are taken from the notes
  cited in §2.
- The model's module is where the outline draws the MINI-1. Which corner the WROOM-02 takes,
  and how much of it overhangs, is still open on the map.
- The diode, the caps and the VSUP trunk are not in the model, and neither is the ground nut.
- Stray field from a neighbour's copper beside each sensor (§3).
- JLC's 2 oz price for this outline.
