---
researched: 2026-10-09
for: "XDGFX/hailey#198 (map XDGFX/hailey#178)"
---

# Way monitor: 24 V to 3.3 V supply

Which regulator the **way monitor**'s main strip uses to make 3.3 V from the 24 V house bus,
and what protects it. The main strip holds an ESP32-C3-MINI-1. Across the four strips there
are 24 CC6905S8-3FB030 hall sensors and 4 CD4051B multiplexers. The supply is taken from one **way** with a jumper or
solder bridge. The board is JLC-assembled.

Prices are JLCPCB/LCSC unit prices at qty 1, in USD, read from the JLCPCB parts API on
2026-10-09. "Preferred" means promotional extended, which is exempt from the USD 3 fee for
each extended part type ([JLCPCB PCBA FAQ][jlc-faq]). Stock moves, so recheck at BOM time.

## Answer in brief

- **Budget:** 0.66 A peak and about 0.33 A typical. Size the supply for **0.81 A**, which is
  Espressif's 0.5 A module minimum plus 24 sensors at their maximum.
- **Regulator:** a **TI LMR51610XDBVR (C20539658)**. It is a 65 V, 1 A synchronous buck in
  SOT-23-6, needs only ceramic capacitors, and is about 87 % efficient here. The supply BOM
  costs **USD 1.32** in parts plus **USD 6** in fees (the IC and the inductor), so
  **USD 7.32** in all.
- **The fee can't be avoided:** JLC has **no basic or preferred power inductor** and no basic
  or preferred SMD electrolytic. Every buck pays at least one extended fee, for its
  inductor. The preferred XL1509-ADJ saves only about USD 0.80 once its inductor and
  electrolytic are paid for, and no TVS can protect it (see below).
- **Protection:** an SS210 series Schottky for reverse polarity, then an SMBJ33A TVS. Make
  the fuse the panel's own: jumper the board to a **way fitted with a 1–2 A blade**. If no
  such way is free, add a 60 V PTC (C54874024), which costs USD 0.08 plus a third USD 3 fee.

## Current budget

| Load | Qty | Typical | Maximum | Source |
|---|---|---|---|---|
| ESP32-C3-MINI-1, Wi-Fi RX | 1 | 82 mA | — | [C3-MINI-1 datasheet v2.2][c3mini] Table 6-4 |
| ESP32-C3-MINI-1, Wi-Fi TX peak (802.11b, 20.5 dBm) | 1 | — | 350 mA | same |
| CC6905S8-3FB030, I<sub>CC</sub> at V<sub>CC</sub> 3.3 V | 24 | 10 mA (240 mA) | 13 mA (312 mA) | [CC6905 datasheet rev 1.3][cc6905], supply section |
| CD4051B, quiescent | 4 | µA | 150 µA at 85 °C (0.6 mA) | [TI CD4051B][ti-4051] |
| NTC dividers, one per strip (10 k + 10 k assumed) | 4 | 0.17 mA (0.7 mA) | same | Ohm's law |
| **Main strip total** | | **≈ 325 mA** | **≈ 663 mA** | |
| **Each lite strip** (6 sensors, 1 mux, 1 NTC) | | 60 mA | **79 mA** | |

Espressif also gives a minimum supply rating: "Current delivered by external power supply"
of **0.5 A** ([C3-MINI-1 datasheet][c3mini], recommended operating conditions). Design to
0.5 A + 312 mA = **0.81 A**. A 1 A buck covers that. A 0.6 A part does not.

At 24 V input that is about 0.11 A peak. On average it is about 1.2 W, or roughly 29 Wh
(1.2 Ah at 24 V) a day from the house bank. Most of it is the sensors: 24 × 10 mA × 3.3 V is
0.8 W.

The CC6905's output is **fixed, not ratiometric**. Its zero point comes from an internal
1.65 V reference (V<sub>REF</sub> 1.60–1.70 V for the 3.3 V series). A sag in V<sub>CC</sub>
therefore does not move the zero. The sensor runs from 3.0 V to 3.6 V and its undervoltage
lockout releases at 2.8 V ([CC6905 datasheet][cc6905]).

## What JLC stocks as basic or preferred

From the JLCPCB parts API, filtering on basic + preferred:

- **DC-DC converters: 8 parts in all.** Only three are bucks rated for a 24 V bus:
  - XL1509-5.0E1 (C61063, basic, 40 V, USD 0.24)
  - XL1509-ADJE1 (C74192, preferred, 40 V, USD 0.27)
  - TI LM2596SX-5.0 (C10002, preferred, 40 V, TO-263, USD 1.12)

  The rest are rated too low or are crude: TPS5430 (C9864, basic) is 36 V, TPS54331 is
  28 V, MC34063 is rated 0–70 °C, and LM2576 is 52 kHz in TO-263.
- **Power inductors: none.** The only basic or preferred inductors are multilayer chip
  parts rated in milliamps.
- **SMD aluminium electrolytics and polymer capacitors: none.** The only basic tantalums are
  10 µF/16 V and 100 µF/6.3 V TAJ parts with an ESR of 1.7–3 Ω.
- **PTCs and chip fuses: none.**
- **TVS and Schottky diodes: plenty preferred** (hongjiacheng SMBJ/SMAJ, SS-series).

So a buck pays at least one USD 3 fee, for its inductor. Once that is true, the cheapest
safe design is the best extended IC paired with all-basic ceramics.

## Options compared

| Option | IC (LCSC, status, USD) | V<sub>IN</sub> max (abs) | Efficiency at 3.3 V | External parts | Parts USD | Fees | Verdict |
|---|---|---|---|---|---|---|---|
| **A. LMR51610X sync buck** | C20539658, ext, 0.67 | 65 V (70 V) | ~87 % at 24 V, 0.3–0.5 A (TI Fig 7-1) | 22 µH, 2 × 22 µF MLCC, 2.2 µF + 100 nF in, 100 nF boot, 2 resistors | **1.32** | 2 (IC, L) | **Recommended** |
| B. XL1509-ADJ async buck | C74192, **preferred**, 0.27 | 40 V (45 V) | 74 % (12 V in, 3 V, 2 A) | 47 µH, 220–330 µF low-ESR electrolytic, Schottky, 2 resistors | ~0.50 | 2 (L, e-cap) | No TVS fits; see below |
| B′. XL1509-ADJ with basic tantalums | same | same | same | 3 × 100 µF/6.3 V TAJ (C16133, 1.7 Ω each) | ~1.2 | 1 (L) | ~0.25 V ripple; not the datasheet's low-ESR cap |
| C. XL1509-5.0 then AMS1117-3.3 | C61063 basic + C6186 basic | 40 V | ~55 % overall | as B, plus an LDO burning 1.1 W at peak | ~0.75 | 2 | Worse on every count |
| D. Integrated module (TPSM365R6, 65 V) | C20346008, ext, 6.53 | 65 V | — | caps only | 6.6 | 1 | 0.6 A, too small, and dearer |
| E. Cheap 60 V current-mode clone | e.g. LGS5145EP C22470481, ext, 0.19 | 60 V | not checked | like A | ~0.85 | 2 | Saves USD 0.48; datasheet not checked |

**Why not the XL1509 (option B)?** It is the only preferred buck, but its absolute maximum
input is **45 V** ([XL1509 datasheet rev 2.0][xl1509]). A TVS must stay off at the 29.2 V
charge voltage, so its stand-off has to be at least 30 V. An SMBJ30A then clamps at
**48.4 V** at its rated pulse current, which is above 45 V. No TVS sits between 29.2 V and
45 V. The XL1509 is also a bipolar switch with 1.2 V saturation, at 150 kHz. It needs a 47 µH
inductor and an electrolytic (XLSEMI's table lists 220–330 µF tantalum or electrolytic for
3.3 V). Neither of those is basic or preferred, so it ends up paying two fees anyway. Option
A costs about USD 0.80 more, and in return gets 20 V of headroom over the TVS clamp, 13
points of efficiency, and a much smaller footprint.

**An LDO after the buck?** Not needed. LMR51610 ripple with the values below is a few mV
(about 0.33 A peak-to-peak ripple current into roughly 30 µF of effective ceramic). The
ESP's ADC error is ±35 mV (XDGFX/hailey#188). An LDO stage would need a higher intermediate rail and
would burn up to 1 W.

## Recommended circuit and BOM

```
way ── jumper ── F1 (opt.) ── D1 SS210 (A→K) ──┬── VIN, EN (U1)
                                               ├── D2 SMBJ33A (K to VIN, A to GND)
                                               └── C1 2.2 µF ∥ C2 100 nF to GND
U1 SW ── L1 22 µH ── 3V3 ──┬── C4, C5 22 µF to GND
                            └── R1 75 k ── FB ── R2 24 k ── GND
U1 CB ── C3 100 nF ── SW
```

V<sub>OUT</sub> = 0.8 V × (1 + 75 k / 24 k) = **3.30 V** (V<sub>REF</sub> 0.8 V ±1.5 %, TI
§8.3). With 1 % resistors, expect 3.22–3.38 V. Tie EN to VIN (EN max is V<sub>IN</sub> +
0.3 V). Use the PFM version (X). The FPWM version (XF) costs USD 1.21 and stock is 272.

| Ref | Part | LCSC | Status | USD | Why |
|---|---|---|---|---|---|
| U1 | TI LMR51610XDBVR, 4–65 V, 1 A, 400 kHz, SOT-23-6 | C20539658 | extended | 0.667 | Stock 7,722 |
| L1 | Sunlord SWPA6045S220MT, 22 µH, I<sub>sat</sub> 2.2 A, 89 mΩ, 6 × 6 mm | C83454 | extended | 0.085 | TI Table 9-1 (22 µH for 3.3 V, 1 A). I<sub>sat</sub> is above the 1.95 A maximum current limit |
| D1 | MDD SS210, 100 V 2 A Schottky, SMA | C14996 | basic | 0.032 | Reverse polarity. About 0.5 V and 50 mW at 0.11 A |
| D2 | hongjiacheng SMBJ33A, 600 W, V<sub>RWM</sub> 33 V, clamps 53.3 V at 11.3 A | C19077586 | preferred | 0.050 | Off at 29.2 V. Clamps under the LMR51610's 65 V rating |
| C1 | 2.2 µF 50 V X7R 1206 | C50254 | basic | 0.086 | TI: at least 2.2 µF input |
| C2 | 100 nF 100 V X7R 0805 | C28233 | basic | 0.033 | High-frequency input bypass, at the pins |
| C3 | 100 nF 50 V X7R 0402 | C307331 | basic | 0.009 | Bootstrap; TI asks for 16 V or more |
| C4, C5 | 22 µF 25 V X5R 1206 | C12891 | basic | 2 × 0.173 | TI table: 22 µF/16 V. Two of them cover DC-bias loss |
| R1 | 75 kΩ 1 % 0402 | C25798 | preferred | 0.003 | R<sub>FBT</sub> |
| R2 | 24 kΩ 1 % 0402 | C25769 | preferred | 0.003 | R<sub>FBB</sub> |
| | **Total** | | | **1.32** | **+ USD 6 fees** (U1, L1) |
| F1 (opt.) | JDT ASMD1206-020-60V PTC, 0.2 A hold, 0.46 A trip, 60 V | C54874024 | extended | 0.084 | Only if no small-fused way is free. Adds USD 3 |

TI's design example puts 100 V input capacitors on a 65 V design, which is twice the maximum
input. Here the bus is 29.2 V and the caps are rated 50 V. The TVS only takes them past 50 V
during a clamp, which is brief and within what MLCCs survive. 100 V 2.2 µF parts exist, but
none is basic.

Losses at the 0.66 A peak are about 0.33 W, with about 40 mW of that in L1's DCR. In a
SOT-23-6 that is a junction rise of a few tens of degrees, and the average load is half the
peak.

## Input protection

Order on the board: **jumper → (F1) → D1 → D2 → C1/C2 → U1.**

- **Fuse.** The way's blade fuse is sized for that way's load, which can be up to 30 A. That
  does nothing for a shorted MLCC or a failed TVS on a 1 mm trace. The free fix is to bridge
  the board to a **way that carries a 1–2 A blade**. A spare position does the job, since
  the panel design covers all 12 ways. A PTC is the fallback (above). Nothing in JLC's
  basic or preferred range does this job.
- **Reverse polarity:** D1 in series. A P-FET would be lossless, but the only basic P-FETs
  (AO3401A, SI2301) are 20–30 V parts and need a zener gate clamp. At 0.11 A the diode's
  loss doesn't matter. D2 sits after D1, so reverse polarity never reaches it. D1 also blocks
  negative transients.
- **TVS:** the bus is LiFePO4 with an Orion XS B2B between it and the alternator
  (`docs/reference/alternator-charging-options.md`). That keeps alternator load dump off
  the house bus. What remains is inductive kick from pumps and compressors, and charger
  overshoot if the BMS disconnects while charging. Both are low energy while the battery
  holds the bus. SMBJ33A (600 W, 10/1000 µs) covers that with 12 V of margin under 65 V.
  SMBJ30A (C19077584, clamps 48.4 V) would also suit the LMR51610. Its stand-off is closer
  to the 29.2 V charge voltage.

[jlc-faq]: https://jlcpcb.com/help/article/pcb-assembly-faqs
[c3mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf
[cc6905]: https://datasheet.lcsc.com/datasheet/pdf/81a1e0bc6663e21b6354e013ad7b1200.pdf?productCode=C41421490
[ti-4051]: https://www.ti.com/lit/ds/symlink/cd4051b.pdf
[ti-lmr51610]: https://www.ti.com/lit/ds/symlink/lmr51610.pdf
[xl1509]: https://datasheet.lcsc.com/datasheet/pdf/1dee0cefe60d4918a226de351b533c0a.pdf?productCode=C74192

Sources not linked inline: LMR51610 figures come from [TI's datasheet][ti-lmr51610]
(SLUSEY1; the LCSC copy is the Chinese ZHCSQJ7A): §7.1 absolute maximum ratings, §7.5
electrical characteristics (I<sub>HS_PK(OC)</sub> 1.25–1.95 A, t<sub>ON_MIN</sub> 80 ns),
Fig 7-1 efficiency, Table 9-1 L and C<sub>OUT</sub>, and §9.2.2 input and bootstrap
capacitors. The TVS, diode, inductor and capacitor ratings are from the JLC/LCSC part
listings.
