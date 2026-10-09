---
researched: 2026-10-09
for: "XDGFX/hailey#187 (map XDGFX/hailey#178)"
---

# Way monitor current sensor

Which integrated-conductor hall sensor to fit, one per way, on the way monitor. The board covers
24 ways (Fuse Panel A and B), 30 A max per way, on the 24 V bus, read by an ESP32 3.3 V ADC.
Target is ±0.3 A absolute, with firmware zeroing each way at no load. Way pitch is 13.35 mm,
with about 11 mm clear per way.

## Recommendation

**JSMSEMI ACS724LLCTR-30AU-T-JSM, LCSC C46596283.** It is a unidirectional 0–30 A clone of
Allegro's ACS724, with a full datasheet that gives max limits. It costs about USD 0.09 a way more
than the cheapest part (CC6900SO-30A) and gives twice the resolution, because the whole output
swing covers 0 to 30 A instead of ±30 A. Fuse panel ways only carry load current, so a
bidirectional part would waste half its swing.

- USD 0.6944 each at 10–29 (USD 16.67 for 24), 0.6505 at 30+ (USD 19.52 for 30). Buy 24.
  Stock was 2032 on 2026-10-09.
- JLC **extended** part. No hall current sensor of any make is a JLC basic part, so every option
  pays the extended-part fee once for the part type.
- Needs a **5 V rail** and a **divider** on each output into the ESP32 (output is 0.5–4.5 V).
  Both are cheap basic parts, but the regulation ticket has to provide 5 V as well as 3.3 V.
- Runner-up: **Cross Chip CC6900SO-30A, C355193**, the cheapest 30 A part on JLC. It only has a
  short-form datasheet, though: no noise figure, no conductor resistance and no max limits. Use it
  only if the extra USD 1–2 matters more than having a spec to design to.
- If a 5 V rail turns out to be expensive: **CC6920BSO-40A, C2880435** runs from 3.3 V and drives
  the ADC directly, at USD 0.94 each and 20 mA supply current per sensor.

### Against ±0.3 A

Once firmware zeroes each way, what remains is gain error, temperature drift and noise.

| Error term (30AU at 5 V, 133.3 mV/A) | Datasheet | In amps |
|---|---|---|
| Zero-current output, unipolar | 0.49–0.51 V | ±0.08 A, removed by zeroing |
| Offset error over temperature | ±8 mV max | ±0.06 A |
| Output noise (30AB, 250 kHz bandwidth) | 8 mV rms typ | ±0.06 A rms unfiltered; FILTER cap and averaging reduce it further |
| Total output error, −40 to 125 °C | ±0.5 % typ, ±1.6 % max | ±0.15 A typ, ±0.48 A max at 30 A |
| Lifetime drift | ±0.5 % typ | ±0.15 A at 30 A |

Low and mid loads meet ±0.3 A comfortably. At a full 30 A, the worst-case gain error (±0.48 A)
goes over the target; the typical figure is well inside it. No part on JLC guarantees ±1 % gain
over temperature, so meeting ±0.3 A at 30 A on every unit needs a one-point gain calibration per
way (a known 10–20 A load) as well as the zero. The output is ratiometric to its 5 V supply and
the ESP32 ADC is not, so put the 5 V rail on its own divider to an ADC pin and correct in
firmware, or the regulator's tolerance becomes gain error too.

### Heat

The datasheet gives 1.2 mΩ typical; LCSC's listing says 1.5 mΩ. At 30 A that is 1.08–1.35 W in
a SOIC-8. Each panel is fed through an 80 A fuse (`docs/log/2026-05-27-main-electrical-final-review.md`),
so worst case per board is two ways at 30 A plus one at 20 A: 2.6–3.3 W across the board.
That is manageable, but it needs heavy copper pours on IP+ and IP−, so ask for 2 oz copper if
the price allows. The JSM datasheet supports 50 A continuous at 25 °C and refers to a derating
curve above that (p. 2).

### Footprint

Standard SOIC-8: 4.9 × 3.9 mm body, 6.0 mm across the leads, pins 1–2 IP+, 3–4 IP−. It fits a
13.35 mm pitch with room for the 100 nF decoupler, the FILTER cap and the output divider. Pin
order matches Allegro's ACS724, so a stock ACS724 footprint works. Isolation is 3 kVrms, far
more than a 24 V system needs.

## Candidates compared

Prices are USD from the JLCPCB parts API on 2026-10-09: 10–29 tier, then 30+ in brackets. All
are SOIC-8 and all are JLC extended.

| Part | LCSC | Price each | Stock | Range, sens. | Supply | Total error | R, heat at 30 A | Notes |
|---|---|---|---|---|---|---|---|---|
| CC6905S8-3FB030 (Cross Chip) | C41421490 | 0.639 (0.560) | 4959 | ±30 A, 44 mV/A | 3.3 V, fixed (VREF pin) | ±3 % | 0.5 typ / 0.6 max mΩ, 0.45 W | Found by a sub-search after the recommendation was written. 3.3 V, so no 5 V rail or dividers; offset drift ±20 mV max (±0.45 A) over −40…125 °C, so zeroing matters; 10 mV "rms" noise figure looks like p-p, unverified |
| CC6900SO-30A (Cross Chip) | C355193 | 0.639 (0.563) | 3015 | ±30 A, 67 mV/A | 5 V | 1 % at 25 °C, 3 % full temp | not stated | Short-form datasheet only; 100 V isolation |
| ACS712ELCTR-30A-T-JSM | C19673781 | 0.693 (0.618) | 5117 | ±30 A, 66.6 mV/A | 4.5–5.5 V | ±3 % max | 1.5 typ / 1.8 max mΩ, 1.35–1.62 W | Zero drift 0.26 mV/°C; 20 mVpp noise |
| **ACS724LLCTR-30AU-T-JSM** | **C46596283** | **0.694 (0.651)** | 2032 | **0–30 A, 133.3 mV/A** | 4.5–5.5 V | ±1.6 % max | 1.2 mΩ, 1.08 W | Recommended |
| ACS724LLCTR-30AB-T-JSM | C20606859 | 0.698 (0.657) | 1814 | ±30 A, 66.7 mV/A | 4.5–5.5 V | ±1.6 % max | 1.2 mΩ, 1.08 W | Bidirectional version of the above |
| ACS712ELCTR-30A-T (XBLW) | C22387049 | 0.758 (0.664) | 2174 | ±30 A, 66.6 mV/A | 4.5–5.5 V | not checked | 1.5 mΩ (listing) | Image-only datasheet, not read |
| ACS711KEXLT-31AB-T (Allegro) | C146412 | 0.961 (0.851) | 792 | ±31 A, 45 mV/A at 3.3 V | 3–5.5 V | ±4 % typ | 0.6 mΩ, 0.54 W | QFN-12 3 × 3; offset ±40 mV typ over temperature |
| CC6920BSO-40A (Cross Chip) | C2880435 | 1.007 (0.945) | 644 | ±40 A, 33 mV/A | 3.0–3.6 V | ±2 % | 0.9 mΩ, 0.81 W | 3.3 V, no divider; offset ±7 mV; 6 mV rms noise; 20 mA each |
| ACS712ELCTR-30A-T (Allegro) | C9932 | 1.169 (1.041) | 5330 | ±30 A, 66 mV/A | 4.5–5.5 V | ±1.5 % typ at 25 °C; 64–68 mV/A over temp | 1.2 mΩ, 1.08 W | Genuine part; offset ±30 mV |
| CC6904SO-30A (Cross Chip) | C521203 | 1.218 (1.080) | 41 | ±30 A, 44 mV/A | 3.3 V | not checked | 1.5 mΩ (listing) | Too little stock |
| CC6920BSO-30A (Cross Chip) | C2880434 | 1.366 (1.218) | 14 | ±30 A, 44 mV/A | 3.0–3.6 V | ±2 % | 0.9 mΩ | Too little stock |
| CH70130AB5PR (Cosemitech) | C455298 | 1.480 (1.317) | 2933 | ±30 A, 66 mV/A | 4.5–5.5 V | not checked | 0.8 mΩ (listing) | Dearer, no advantage |
| ACS725LLCTR-30AB-T (Allegro) | C2688267 | 3.38 (2.98) | 159 | ±30 A, 44 mV/A | 3.0–3.6 V | ±2 % max | 1.2 mΩ | The genuine 3.3 V part; too dear |

Ruled out on stock or price: MCS1802GS-30 and MCS1806GS-3-30 (MPS, 0 in stock), TMCS1108
(USD 1.34+ and 1.8 mΩ), Novosense NSM2012-30 and MT9221 (0 in stock), Melexis MLX91220 (0 in
stock), CC6921 (SOIC-16W, USD 1.57+), and JSM's own 3.3 V ACS725 clones, which JLC does not stock.

### Shunt and amplifier, the non-hall alternative

This is cheaper than any hall part, and it is the fallback if the order goes over budget.

- **3PEAK TP181A1-CR, C2902349.** Common mode −0.3 to 36 V, supply 2.7–30 V, so it runs from
  3.3 V. Gain 50 V/V, offset ±100 µV max, gain error ±1 % max, SC70-6 with a REF pin. USD 0.3158
  at 1–49, 0.2428 at 50+, 35,817 in stock, extended.
- **1 mΩ 2512 shunt, ECSR2512FR001K9, C349181.** ±1 %, 3 W, USD 0.0417, 738 in stock, extended.
  RALEC LR2512-23R001F4 (C312481, USD 0.11, 2275 in stock) is the better-stocked alternative.
  No 1 mΩ or 0.5 mΩ shunt is a JLC basic part.
- About USD 0.36 a way at 24, against 0.69 for the 30AU, so about USD 8 less across the
  board. It does use two extended part types instead of one, so two fees.
- 50 mV/A, and 30 A gives 1.5 V straight into the ADC with no divider and no 5 V rail. The shunt
  dissipates 0.9 W at 30 A, close to the hall part's 1.08 W.
- Offset is 0.1 A before zeroing. Gain error is ±1 % (amplifier) plus ±1 % (shunt), worst case
  ±0.6 A at 30 A, so it needs the same per-way gain calibration as the hall part.
- Costs that the hall part doesn't have: Kelvin sense traces on every shunt, and REF biased a
  few hundred mV off ground, or the output swing limit near 0 V hides the first amp or so.
  It has no isolation, which a 24 V system doesn't need.
- Amplifiers ruled out: TI INA180, INA181 and INA199, and SGMicro SGM8199, all stop at 26 V,
  under the 24 V bus at absorption. INA186 (40 V) costs USD 0.52, and INA240 (80 V) costs
  USD 0.69, too much with a shunt added.

TP181A1 figures come from the third research pass, citing 3PEAK's datasheet Rev A.3
(https://atta.szlcsc.com/upload/public/pdf/source/20240822/33717FE988A80FBE0EF8FFF4BC75D8DD.pdf).
Price and stock were rechecked against the JLC API. Read the datasheet's absolute-max
common-mode figure before choosing this route; it was not checked here.

## Sources

- JLCPCB parts API, price tiers, stock and basic/extended for every LCSC code above, queried
  2026-10-09: `https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`.
  The LCSC product page for each part is `https://www.lcsc.com/product-detail/<code>.html`.
- JSMSEMI ACS72xLLCTR-xxXX-T-JSM datasheet V1.1 (selection guide p. 2, electrical
  characteristics p. 4, 30AU performance p. 9):
  https://datasheet.lcsc.com/datasheet/pdf/712cd4a69f96170a610dd95cbbcaf41c.pdf
- JSMSEMI ACS712ELCTR-XXX-T datasheet (electrical p. 4, 30A accuracy p. 5):
  https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/2402231636_JSMSEMI-ACS712ELCTR-30A-T-JSM_C19673781.pdf
- Cross Chip CC6900 short-form datasheet rev 1.5:
  https://datasheet.lcsc.com/datasheet/pdf/027f5e4bc6eb50ec7a1ab4217dbc57ed.pdf
- Cross Chip CC6920B datasheet (30 A and 40 A performance tables):
  https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/2407171004_Cross-chip-CC6920BSO-40A_C2880435.pdf
- Allegro ACS712 datasheet (x30A performance, p. 5):
  https://datasheet.lcsc.com/datasheet/pdf/7df91466a38445b39531615f47f0d60b.pdf
- Allegro ACS711 datasheet: https://datasheet.lcsc.com/datasheet/pdf/dad4347fe975493a99bead71529d17fb.pdf
- Allegro ACS725 figures: allegromicro.com ACS725 datasheet.
- TI INA180/181/199/186/240 common-mode ranges: ti.com product pages. Shunt ratings: JLC/LCSC
  listings.
- TI TMCS1108 datasheet (30 A only at 25 °C, 1.8 mΩ): https://www.ti.com/lit/ds/symlink/tmcs1108.pdf
