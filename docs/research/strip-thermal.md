---
researched: 2026-10-09
for: "XDGFX/blade-reader#17"
---

# Strip thermal: does a loaded strip need layout rules or a derating note?

How hot a strip gets with every way loaded, what reaches the MMBT3904 and the ESP32, and what
that means for the layout. Coordinates are the design basis's: x from the way 1 end, y outboard
from the panel edge. Temperatures are **rises over ambient** unless stated.

## Answer in brief

- **Both, and the layout rules are cheap.** The hottest point is each way's own path, not the
  strip as a whole. One way alone at 30 A gets almost as hot as six (sensor pads +38 K against
  +45 K), so the panel's 100 A limit does not protect the hottest way. A derating note cannot be
  avoided at high ambient. A handful of layout rules keeps the 30 A rating honest up to about
  40 °C.
- **Sensor band, six ways at 30 A** (an envelope case: it is 180 A, beyond the panel's 100 A):
  pads **+45 K** central (**+23 to +74 K** range), CC6905 package top about **+60 K** (up to
  about +90 K). At 40 °C ambient that is about 100 °C central, against the CC6905's 125 °C
  ambient and 165 °C junction limits.
- **Nut pads:** **+35 K** central (+15 to +57 K).
- **The panel's realistic 100 A** changes the strip's total heat more than its hottest way:
  - 3 × 30 A + 1 × 10 A on one strip: hottest pads +45 K, ESP32 +21 K.
  - 100 A spread over all 12 ways (8.3 A each): +4 K. Negligible.
  - 100 A over one strip's six ways (16.7 A each): +14 K.
- **ESP32 (y 23.4–40):** **+29 K** with six at 30 A (+48 K pessimistic). The fitted
  **ESP32-C3-MINI-1-N4 is rated to 85 °C ambient, and Espressif marks it NRND**. The
  **ESP32-C3-MINI-1-H4X (C41349510)** is rated to 105 °C and cost **$2.62** at 10–29 against
  the N4's $2.67 (JLC API, 2026-10-09; 347 in stock, extended, same footprint). Recommend the
  swap.
- **MMBT3904:** within about 4 K of the sensor pads when the ways are evenly loaded. It is
  blind to a single loaded way at the far end: with way 1 alone at 30 A it reads +1 K while
  that sensor's die is about +50 K. No single placement fixes that. Fix it in firmware: add an
  I² self-heating term per way (see §5). Keep the placement already decided.
- **Copper:** 1 oz still works (design basis). 2 oz would take about 13 K off the pads (§4).

## 1. Inputs and sources

| Quantity | Value | Source |
|---|---|---|
| CC6905 primary resistance | 0.5 mΩ typ, 0.6 mΩ max, TA 25 °C, IP 2 A, SOP8 | Cross Chip CC6905 datasheet rev1.3, electrical table |
| CC6905 conductor tempco | 3900 ppm/°C ("for every 100 °C… resistance will increase by 39 %") | Same, p. 46 |
| CC6905 limits | Operating ambient TA 125 °C, junction TJ 165 °C (absolute maximum) | Same, absolute maximum ratings |
| CC6905 thermal data | **No θJA or θJC is given.** Only a curve and thermograms of package temperature against IP on the CC6905SO demo board: 1.6 mm FR-4, 4 layers, 2 + 0.5 + 0.5 + 2 oz, 400 mm² of copper per IP net per layer joined by vias, open environment, still air. At 30 A the thermogram's hottest point is 56.4 °C on a 25 °C scale floor, so about +31 K. The curve reads about 70 °C (it starts at about 32 °C at 0 A), so about +38 K. Note: "it is necessary to strengthen heat dissipation or choose Tg high plates according to actual application scenarios" | Same, p. 47 |
| CC6905S8-3FB030 drift | Offset drift ±20 mV over −40 to 125 °C; sensitivity error ±2.5 % over −10 to 125 °C; total ±3 % | Same, p. 11 |
| ESP32-C3-MINI-1 ambient | −40 to 85 °C for the N4 and N4X; −40 to 105 °C for the H4X and H8X. "Ambient temperature specifies the recommended temperature range of the environment immediately outside the Espressif module." N4 is NRND | Espressif ESP32-C3-MINI-1 datasheet v2.2, ordering table and Table 6-2 |
| Fuse panel rating | 30 A per circuit, 100 A per block, 32 V DC | Blue Sea ST Blade [category page](https://www.bluesea.com/products/category/Fuse_Blocks/ST_Blade) and the [5034 page](https://www.bluesea.com/products/5034/ST_Blade_Fuse_Block_-_12_Circuits); the 5026 page itself was blocked (HTTP 403) |
| 30 A blade fuse loss | 84 mV typ at rated current, 1.97 mΩ cold, so about **2.5 W** at 30 A | Littelfuse [ATOF 287 series](https://littelfuse.com/products/fuses/automotive-passenger-car/blade-fuses/287.aspx) (successor to the ATO 257) |
| Copper | ρ = 1.72 µΩ·cm at 20 °C, α = 0.00393 /K, k = 385 W/m·K, 1 oz = 35 µm | Standard values, as in `way-monitor-terminals-and-copper.md` |
| FR-4 | k ≈ 0.3 W/m·K through-plane and laterally, 1.6 mm | Typical; estimate |

Datasheet URLs: CC6905 https://datasheet.lcsc.com/datasheet/pdf/81a1e0bc6663e21b6354e013ad7b1200.pdf;
ESP32-C3-MINI-1 https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf.

## 2. Heat per way

### Sensor

P = I²R. At 30 A, 0.6 mΩ max at 25 °C gives **0.54 W**. With the conductor at 80 °C,
0.6 × (1 + 0.0039 × 55) = 0.73 mΩ, so **0.66 W**. Typical (0.5 mΩ) at 70 °C gives 0.59 mΩ, so
0.53 W. The design basis's 0.45 W is the 25 °C maximum (0.5 mΩ × 900 A², or 0.6 mΩ at about
25 A); hot, it is 20–45 % higher.

### Copper, screw to nut

Sheet resistance of one 1 oz layer: R□ = ρ/t = 1.72×10⁻⁸ / 35×10⁻⁶ = **0.491 mΩ per square**.
Both faces in parallel: **0.246 mΩ/□**.

| Piece | Squares | Resistance |
|---|---|---|
| Finger, from the edge of the screw head (y ≈ −4.4) to the IP+ pins (y ≈ 3), 9.5 mm wide: 7.4 / 9.5 | 0.78 □, both faces | 0.19 mΩ |
| Body, IP− pins (y ≈ 6.5) to the nut pad edge (y ≈ 11.6), about 10.5 mm wide: 5.1 / 10.5 | 0.49 □, both faces | 0.12 mΩ |
| Crowding into pins 1–2 and 3–4 (1.9 mm across, from 10 mm wide), parts face only. A one-sided 2-D constriction is (R□/π)·ln(csc(πa/2W)) = (1/π)·ln(csc(0.30)) = 0.39 □ per side | 0.78 □, one face | 0.38 mΩ |
| Spreading at the screw clamp and the nut pad, about 0.4 □ each, both faces (estimate) | 0.8 □ | 0.20 mΩ |
| Vias: one 0.3 mm via, 20 µm plating, 1.6 mm long: ρL/(πdt) = 1.72×10⁻⁸ × 1.6×10⁻³ / (π × 0.3×10⁻³ × 20×10⁻⁶) = 1.46 mΩ. Ten per field carry half the current | — | about 0.05 mΩ |
| **Total at 20 °C** | | **about 0.75 mΩ (estimate 0.5–1.0)** |

At 30 A: 0.75 mΩ × 900 = 0.68 W, or about **0.8 W** with the copper at about 65 °C
(× 1.18). The earlier note's 0.44 W was the 10 × 20 mm rectangle alone. Crowding at the
sensor pins is the biggest single term. Clamp and ring contact resistance (not included) adds a
little more at the ends.

**Per way at 30 A: about 1.3 W (0.53 sensor + 0.79 copper), up to about 1.7 W at the
pessimistic end.** Six ways: about 8 W, plus the ESP32's roughly 0.3 W.

For comparison, the way's own 30 A fuse dissipates about 2.5 W, more than the strip adds. A
good part of that goes into the output terminal the finger is clamped to.

## 3. How the heat leaves

- **Into the air.** Natural convection plus radiation from solder mask (ε ≈ 0.9) is about
  10 W/m²·K per face; radiation alone is 4εσT³ ≈ 6.7 W/m²·K at 320 K. One way's share of the
  strip (13.36 × 40 mm of body plus about 9.5 × 13 mm of finger, both faces) is about
  0.0013 m², or about **0.013 W/K**. On its own that would mean +100 K. Bare ENIG has ε of
  about 0.05–0.1 and radiates almost nothing, so leave solder mask on everywhere except the
  ring pads.
- **Along the board.** Two 35 µm faces conduct 385 × 70×10⁻⁶ = 0.027 W/K per square. With
  h = 10 W/m²·K on both faces, the spreading length is √(kt / 2h) ≈ 37 mm. The 40 mm body is
  used fairly well, but when every way is hot, each way has only its own share.
- **The output wire as a fin.** 10 AWG (5.26 mm²), insulation OD about 6.5 mm, h about
  10 W/m²·K: G = √(hP·kA) = √(10 × π × 0.0065 × 385 × 5.26×10⁻⁶) ≈ **0.02 W/K**. At 30 A,
  though, the wire makes 30² × 3.27 mΩ/m = 2.9 W/m of its own. In free air that puts it at
  roughly +15 K (estimate), so it is only a weak sink, and only for the strip's excess.
- **The panel through the clamp.** It is clamped metal to metal at 2 N·m, so contact is good.
  But the terminal also takes the fuse's 2.5 W at 30 A, and the bus carries up to 100 A. At
  full load the panel is a **heat source**, not a sink. Its terminal temperature is the
  largest unknown here. The model takes +20 K at 30 A, with 0 K and +40 K as bounds, and
  0.1 W/K from finger to panel.

1-D check, with the ends of a 25 mm, 10 mm-wide, two-face path held at a fixed temperature:
uniform copper heat gives ΔT = PL / 8kA = 0.79 × 0.025 / (8 × 385 × 7×10⁻⁷) = 9 K. The sensor
at mid-length gives PL / 4kA = 0.53 × 0.025 / (4 × 2.7×10⁻⁴) = 12 K. So about **21 K from the
ends to the middle**. The ends are not held, because the sinks are weak, and that is why the
sensor band ends up near +45 K.

IPC-2152 check: one 1 oz face, 10 mm wide (543 mil²) carrying half the current (15 A). The
generic curve fit, A = (117.555·ΔT^−0.913 + 1.15)·I^(0.84·ΔT^−0.108 + 1.159), gives
**ΔT ≈ 41 K** (43 K at 9.5 mm, 39 K at 10.5 mm). That is for a long isolated trace with no
sensor. It agrees in size with the model's +35 K at the nuts and +45 K at the sensor pads.

## 4. Model results

A 2-D steady-state sheet model of the strip on a 0.25 mm grid
([`strip-thermal-model.py`](strip-thermal-model.py), run with
`uv run --with numpy --with scipy python strip-thermal-model.py`). Its geometry is the design
basis's comb:

- six 9.5 mm fingers to y −13, with screw holes at y −8.5
- the 80.16 × 40 mm body, with NPTH slots at y 10.5–21.5 and the antenna notch
- copper on both faces throughout
- 0.5 mm FR-4-only clearances between ways in the sensor band, at y ≈ 22 where way copper meets
  the GND pour, and round the MMBT3904's GND island at x 38.6–41.6, y 1.5–9

Heat sources:

- each sensor on a 4 × 5 mm footprint at y 5.25
- each way's copper loss spread along its path
- the ESP32 at 0.3 W over its footprint
- both resistances follow their temperature coefficients

Sinks: air (h on both faces), a wire fin at each nut and a panel link at each clamp, as in §3.
Ambient 25 °C for the resistance tempcos.

**Central** (h = 10 W/m²·K per face, CC6905 0.5 mΩ, copper 0.75 mΩ, panel +20 K and wire
+15 K at 30 A). Values are rises in K:

| Case | Strip loss | Sensor pads (hottest) | Nut pads (hottest) | MMBT3904 | ESP32 max |
|---|---|---|---|---|---|
| A: six ways at 30 A (180 A, above the panel rating) | 8.2 W | 46 | 35 | 42 | 29 |
| B: ways 1–3 at 30 A, way 4 at 10 A (100 A on one strip) | 4.4 W | 45 | 33 | 23 | 21 |
| B2: ways 2–4 at 30 A, way 5 at 10 A | 4.3 W | 44 | 33 | 38 | 22 |
| C: way 1 alone at 30 A | 1.6 W | 38 | 27 | **1** | 10 |
| C2: way 3 alone at 30 A | 1.6 W | 35 | 25 | 18 | 13 |
| D: 100 A over 12 ways (8.3 A each) | 0.8 W | 4 | 4 | 4 | 9 |
| E: 100 A over one strip's six ways (16.7 A each) | 2.5 W | 14 | 11 | 13 | 14 |
| F: idle, ESP32 only | 0.3 W | 1 | 1 | 1 | 8 |

Sensitivity, case A (and C):

| Variant | Sensor pads | Nut pads | ESP32 max |
|---|---|---|---|
| Pessimistic: h = 7, CC6905 0.6 mΩ, copper 1.0 mΩ, panel +40 K, wire +25 K | 74 (C: 60) | 57 | 48 |
| Optimistic: h = 12, copper 0.5 mΩ, panel and wire at ambient | 23 (C: 20) | 16 | 16 |
| Central, sinks three times stronger (0.06 W/K wire, 0.3 W/K panel) | 37 (C: 32) | 24 | 22 |
| Central, 2 oz copper (and half the copper resistance) | 32 (C: 26) | 28 | 24 |

### Package and die above the pads

The model gives pad copper, not the package. Running the same method on the datasheet's demo
board (5 oz total, 400 mm² per IP net, 0.5 W in the sensor, cable fins) gives about +21 K,
against a measured +31 to +38 K. The gap of **about 10–17 K at 0.5 W** (20–34 K/W) is
taken as the package-over-pad rise (estimate). The die sits beside the conductor in the same
lead frame, so it is taken to be at about the package-top temperature.

| Six at 30 A | Rise | At 25 °C | At 40 °C | At 50 °C |
|---|---|---|---|---|
| CC6905 package, central | about +60 K | 85 °C | 100 °C | 110 °C |
| CC6905 package, pessimistic | about +90 K | 115 °C | 130 °C | 140 °C |
| Nut pads, pessimistic | +57 K | 82 °C | 97 °C | 107 °C |
| ESP32, pessimistic | +48 K | 73 °C | **88 °C** | **98 °C** |

The CC6905 stays below its 165 °C junction limit in every case. In the pessimistic case at
40–50 °C, package and copper pass about 130 °C. That is around the glass transition of
standard FR-4: JLC's capabilities page does not state its standard Tg (checked 2026-10-09),
and 130–140 °C is typical. It is also where the datasheet's "choose Tg high plates" applies.
The ESP32-C3-MINI-1-N4 goes over its 85 °C ambient at 40 °C in the pessimistic case. The H4X
does not.

## 5. MMBT3904: does it track the sensor dies?

- **Even load:** yes. It sits between ways 3 and 4 on a GND island coupled to both ways' pours
  through 0.5 mm of FR-4. In case A it reads +42 K against +46 K at the pads. That is 4 K
  low, and about 15–20 K below the dies once the package rise is added.
- **Uneven load:** no.
  - Way 1 alone at 30 A: the MMBT reads +1 K; the way 1 die is about +50 K.
  - Case B (ways 1–3 loaded, way 6 idle): it reads +23 K, while way 6's die is at +1 K.
  - The board's spreading length (about 37 mm) is close to the distance from the middle to an
    end way (33 mm), so one sensor cannot see both ends.
- **What the error costs.** The CC6905S8-3FB030's offset drift limit is ±20 mV over 100 K
  above 25 °C. Read as a slope, that is at most 0.2 mV/K, or 4.5 mA/K at 44 mV/A.
  - Offset: a 50 K miss costs up to **0.23 A**, or up to 0.1 A for a 22 K miss on a way that
    is re-zeroing beside loaded neighbours.
  - Gain: sensitivity error is ±2.5 % over −10 to 125 °C. Spread linearly that is about
    0.025 %/K, so a 50 K self-heating rise is up to about **1.2 %**, or 0.37 A at 30 A. The
    current offset-only correction does not touch this.
  - These are worst-case datasheet spreads. Typical parts drift much less, and the shape of
    the curves is not given.
- **Recommendation:** keep the placement. Add a firmware term for each way's die:
  - T_die,k ≈ T_MMBT + a·I_k², with a first-order lag of a minute or so.
  - Start with a ≈ 0.05 K/A²: +45–50 K at 30 A, from the table above.
  - If needed, learn a per way from a bench run.
  - Re-zero only after the way and its neighbours have been steady for several minutes. The
    strip's time constant is minutes: about 14 J/K of FR-4 against about 0.18 W/K, so about
    75 s for the board alone, longer with the nuts and wires.
  - More transistors are no fix: all eight CD4051B inputs are used.

## 6. Recommendation

### Layout rules

Add these to the design basis, under Copper and Body.

1. **Way path:** solid pour on both faces from the screw clamp annulus to the nut pad. At least
   9.5 mm wide in the finger and at least 10.5 mm in the body. No signal traces cross it. Pour
   right up to the CC6905's IP pins, with **no thermal relief** on pins 1–4 or the nut pad.
2. **Vias:** stitch both faces at three fields per way, with 0.3 mm or larger drills:
   - at least 8 just outboard of the screw head's Ø8.2 footprint, kept off the clamped
     annulus
   - at least 6 as close as possible to each of the CC6905's IP+ and IP− pin pairs
   - at least 8 round the nut pad, outside the nut's flange

   They carry current to the ring face and heat between the faces.
3. **Solder mask stays on** over the way pours on both faces, except the ring pads and the
   clamp annulus. Bare ENIG radiates about a tenth as well as mask. This replaces the earlier
   suggestion to open the mask.
4. **Way copper ends at the nut pads.** Keep a clearance of 0.5 mm or more between it and the
   GND pour under the ESP32 (y ≈ 22), and don't run way copper past the nut row.
5. **MMBT3904:** as decided. Small GND island, 0.3–0.5 mm clearance to the way 3 and way 4
   pours, on the parts face, with vias to a matching ring-face island.
6. **ESP32:** fit the **ESP32-C3-MINI-1-H4X (C41349510)**. It has a 105 °C rating and is not
   NRND, at about the same price. No more clearance is available in a 40 mm body, and none is
   needed with the H4X.

### Derating note

For the README and the install notes:

> Rated 30 A continuous per way and 100 A per fuse panel, the panel's own limit, at up to 40 °C
> around the strip with free air. Above 40 °C, or in a closed locker, keep each way to 20 A
> continuous. Expect a way at 30 A to run about 40–60 °C above ambient at its sensor.

- 20 A is (20/30)² = 0.44 of the heat. The pessimistic package rise becomes about 40 K, which
  is fine to 60 °C ambient.
- Also add a firmware over-temperature warning from the MMBT3904 at about 85 °C board, plus
  the I² estimate above.

**Bench test before the rating stands:**

1. Way 3 alone at 30 A for 30 minutes, then ways 2–4 at 30 A.
2. Take thermocouples or IR on a CC6905 top (mask-matched emissivity), a nut and the ESP32
   can, and log the MMBT3904 reading.
3. If the package passes about +65 K, go to 2 oz copper. The copper note already preferred
   it, and the model gives about −13 K. That would reopen the design basis's "1 oz is fine".

## 7. Uncertain

All the figures above are estimates from a simplified model. These matter most, in roughly this
order:

- **Panel terminal temperature at 30 A.** It is driven by the fuse's 2.5 W. It accounts for
  most of the spread between +23 and +74 K, and only measurement settles it.
- **Package-over-pad rise.** Inferred from one demo board and two figures that disagree
  (+31 K thermogram, +38 K curve). There is no θJA or θJC.
- **Copper resistance near the pins and contact resistances.** Estimated at 0.5–1.0 mΩ per way
  from geometry that isn't laid out yet.
- **Air.** h of 7–12 W/m²·K, and whether the strip sits in a closed locker.
- **Load wire size and bundling.** 10 AWG in free air was assumed.
- **CC6905 drift shapes.** The datasheet gives limits, not curves, so the error costs in §5 are
  bounds.
- **JLC finished 1 oz thickness.** Taken as 35 µm.
