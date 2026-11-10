---
date: 2026-10-10
issue: 43
map: 1
---

# Wi-Fi microcontrollers JLC can place under Economic PCBA

Answers [#43](https://github.com/XDGFX/blade-reader/issues/43), for the decision in
[#41](https://github.com/XDGFX/blade-reader/issues/41): which Wi-Fi microcontroller parts JLCPCB
will place under Economic PCBA, and what each would cost the strip.

Every assembly type, library class, stock figure and price below was read on 2026-10-10 from
JLC's own part page (`https://jlcpcb.com/partdetail/<code>`, the "PCBA Type" row) and from the
data behind it,[^api] unless a row says otherwise. Prices are USD for 1–9 pieces. Stock moves:
recheck before ordering.

## Executive summary

**There is a real Economic option, and it is a module, not the bare chip.** JLC lists the
castellated ESP32-C3-WROOM-02 as "Economic and Standard". It is the same ESP32-C3 with the same
pin names, so the pin map, firmware and first flash do not change. Its cost is size: 18 × 20 mm
against the MINI-1's 13.2 × 16.6 mm, so the body grows.

Ranked, for 4 strips. "Fees" are the fixed assembly fees: Economic with six extended part types
is $28.13, Standard is $78.58 ([Costs](#costs-both-ways)).

| # | Option | JLC code, class, stock | Rated | Part × 4 | Fees | Total | What it costs the design |
|---|---|---|---|---|---|---|---|
| 1 | **ESP32-C3-WROOM-02-H4** | C2944070, extended, 150 | 105 °C | $13.50 | $28.13 | **$41.63** | Way 1 ear re-laid out. Body about 30.3 deep (cap is 30), or about 28.4 with mux 1 in TSSOP for one more $3.07 fee. Strip about 3 mm longer at the way 1 end. Antenna tip about 3.4 mm nearer the panel's bus screws. Schematic, firmware and flashing unchanged |
| 2 | ESP32-C3-WROOM-02-N4 | C2934560, extended, 10,432 | 85 °C | $13.18 | $28.13 | $41.31 | As 1, but back to the 85 °C rating that #18 moved away from. The fallback if the H4's 150 run out |
| 3 | Bare ESP32-C3FH4, chip-down | C2858491, extended, 4,951 | 105 °C | about $9.50 with its parts | $34.27–37.34 | $43–47 | Fits the ear as it stands, and the 5.4 mm antenna overhang goes. Adds a crystal, an RF match, an antenna and 2–3 extended part types. The antenna is untuned and untested on a two-layer board, with no network analyser to tune it. A new schematic block and the hardest routing on the board |
| 4 | ESP32-C6-MINI-1U-H4 | C20627095, extended, 2,165 | 105 °C | $17.24 | $28.13 + $6.56 X-ray | $51.93 + antennas | Fits the ear. But it is the same hidden-pad package as the MINI-1, JLC's listing looks like an oversight ([the rule](#the-rule)), it needs a U.FL antenna on a lead fitted by hand, and the pin map and firmware target change |
| 5 | DOIT ESPC3-20-N4 (WROOM-02 footprint) | C19949074, extended, 688 | 85 °C | $9.57 | $28.13 | $37.70 | As 2, with a third-party module in place of Espressif's. Saves $3.60 an order |
| — | A. Standard PCBA, current MINI-1-H4X | C41349510, extended, 301 | 105 °C | $11.81 | $78.58 | $90.39 | No layout change. Needs rails on the comb (#41) |
| — | B. Economic, MINI-1-H4X soldered by hand | bought from LCSC | 105 °C | about $11.81 + postage | $25.06 | about $37 + postage | No layout change. Four hidden-pad modules soldered by Cal |

**Recommendation: option 1, the ESP32-C3-WROOM-02-H4**, if the order must be Economic. It is
the only candidate that keeps the chip, the 105 °C rating, the certified antenna and joints
that can be seen, and it saves about $49 an order against Standard. What it costs is a re-layout
of the way 1 ear and a body at or just over the 30 mm cap, so **run a placement trial before
committing**: the fit figures here are arithmetic from the datasheet and `board/`, not a routed
layout.

Two cheap things to do first:

1. **Ask JLC support whether C41349510 can go on an Economic order.** JLC publishes no rule that
   explains the flag, its help page says to ask about Standard-only parts, and it lists the
   near-identical ESP32-C6-MINI-1U-H4 as Economic. A yes costs nothing and leaves the board alone.
2. **Weigh the re-layout against $49.** #41 recommended Standard on that ground. This note
   changes one thing in it: option C is now a known part with a known price.

The bare chip is **not** recommended: it costs more than the module once its extended parts are
counted, and it swaps a certified antenna for an RF design nobody can measure. The ESP8266
modules are out: one ADC input, 0–1 V. No ESP32-C2 or ESP32-C6 part is both Economic and an easy
fit ([Candidates](#candidates)).

## The rule

**JLC publishes no rule. "PCBA Type" is a flag set part by part, and the only way to know is to
read each part's page.**

- The part page's tooltip, shown only on Standard-only parts, reads: "Due to limits in package
  (0201), temperature and other certain conditions, this part is only available for Standard PCBA
  service."[^tip]
- The help page on BOM matching says only that such parts are "exclusive to Standard PCBA orders"
  and "If you have questions regarding standard-only components, please contact customer support
  for verification".[^bom]
- **X-ray is not the reason.** The capabilities table gives X-ray as "Yes (only for certain
  parts, such as BGA)" for Economic and Standard alike, and the price table charges it the same
  under both: $1.64 a piece for 1–10 pieces.[^cap] [^price] JLC's FAQ says it X-rays "packages
  with hidden or inaccessible solder joints—such as BGA, QFN, and LGA".[^cap]
- The Economic limits JLC does publish are: smallest package 0402, IC pin pitch 0.4 mm, BGA pitch
  0.5 mm, single-sided, reflow at 255 ± 5 °C "not adjustable" (Standard runs 240 ± 5 °C).[^cap]
  None of them names module size, height, weight, pad position or moisture level. The fixed 255 °C
  reflow may be the tooltip's "temperature", but JLC does not say so.

What the listings show (all read from the pages):

| Pattern | Evidence | Exceptions |
|---|---|---|
| Espressif MINI modules (pads all under the body) are Standard-only, with X-ray on all but the ESP8684 | ESP32-C3-MINI-1 and -1U (five codes), ESP32-C6-MINI-1 (two), ESP32-S3-MINI-1 and -1U (four), ESP32-S2-MINI-2, ESP8684-MINI-1 (two), ESP32-C5-MINI-1 | **ESP32-C6-MINI-1U-H4 (C20627095) is "Economic and Standard" with X-ray required.** ESP8684-MINI-1U-H4 (C7497295, no stock) is Economic with no X-ray flag |
| Castellated modules are mostly Economic | ESP32-C3-WROOM-02 (three codes), ESP32-C6-WROOM-1 (two), all six DOIT ESPC3, Ai-Thinker ESP-12F, ESP-12S, ESP-07S, ESP-01F, ESP-C3-12F-4M, ESP-C3-13-4M, ESP-C3-32S-4M | Standard-only all the same: Ai-Thinker ESP-12E (C89297), ESP-C3-12F-2M (C2847302), ESP-C3-M1 C3FH4 (C2925151), Ai-WB2-01F (C7472335), ESP-WROOM-02D-N2 (C3013929), DOIT ESPC5-12E-H4 (C52139917). Nearly every ESP32-WROOM-32 and every ESP32-S3-WROOM-1 code is too, going by the flag in JLC's search data: those pages were not opened |
| Bare QFN chips are Economic | ESP32-C3, ESP32-C3FH4, ESP32-C3FN4, ESP32-C6, ESP8684H4X, ESP8285, ESP8266EX, ESP32-C5HF4 | ESP8685H2 (C2922573, no stock) is Standard-only |

So "castellated means Economic" is a tendency, not a rule: the same module in a different flash
size or from a different reel can carry the other flag. **Read the flag for the exact code on the
day of the order.**

## Candidates

Assembly type was read directly from the page for every row. No row is inferred. All are extended
parts: JLC has no basic or preferred Wi-Fi module or chip. "Std" is Standard-only, "Eco" is
Economic and Standard.

### ESP32-C3 modules

| Part | Code | PCBA | Stock | 1–9 | 10+ | Body, pads | Antenna | Rated | Flash |
|---|---|---|---|---|---|---|---|---|---|
| ESP32-C3-MINI-1-H4X (current) | C41349510 | Std, X-ray | 301 | 2.95 | 2.63 | 13.2 × 16.6, pads under body | PCB | 105 °C | 4 MB |
| ESP32-C3-MINI-1-H4 | C2934569 | Std, X-ray | 721 | 3.05 | 2.73 | same | PCB | 105 °C | 4 MB |
| ESP32-C3-MINI-1-N4 | C2838502 | Std, X-ray | 3,602 | 3.04 | 2.67 | same | PCB | 85 °C | 4 MB |
| ESP32-C3-MINI-1U-H4 | C3013922 | Std, X-ray | 815 | 3.50 | 3.14 | 13.2 × 12.5, pads under body | U.FL | 105 °C | 4 MB |
| ESP32-C3-MINI-1U-N4 | C2911374 | Std, X-ray | 1,949 | 3.14 | 2.80 | same | U.FL | 85 °C | 4 MB |
| **ESP32-C3-WROOM-02-H4** | **C2944070** | **Eco** | **150** | **3.37** | 3.02 | 18 × 20, castellated | PCB | 105 °C | 4 MB |
| **ESP32-C3-WROOM-02-N4** | **C2934560** | **Eco** | **10,432** | **3.29** | 2.90 | 18 × 20, castellated | PCB | 85 °C | 4 MB |
| ESP32-C3-WROOM-02U-N4 | C2926676 | Eco | 73 | 3.08 | 2.75 | 18 × 14.3, castellated | U.FL | 85 °C | 4 MB |
| DOIT ESPC3-02-N2 | C19949070 | Eco | 63 | 2.39 | 2.02 | 17.3 × 15, 11 edge fingers at 2.0 mm | PCB | 105 °C | 2 MB |
| DOIT ESPC3-12-N4 | C19949072 | Eco | 65 | 2.27 | 1.90 | 24 × 16, 22 castellated pads at 2.0 mm (ESP-12 pattern) | PCB | 85 °C | 4 MB |
| DOIT ESPC3-12E-N4 | C19949073 | Eco | 55 | 2.35 | 1.98 | 24 × 16 | U.FL | 85 °C | 4 MB |
| DOIT ESPC3-20-N4 | C19949074 | Eco | 688 | 2.39 | 2.02 | 20 × 18, castellated (WROOM-02 pattern) | PCB | 85 °C | 4 MB |
| DOIT ESPC3-20E-N4 | C19949075 | Eco | 22 | 2.39 | 2.02 | 20 × 18 | U.FL | 85 °C | 4 MB |
| DOIT ESPC3-32-N4 | C19949076 | Eco | 65 | 2.39 | 2.02 | 25.5 × 18 | PCB | 85 °C | 4 MB |

Body sizes, pads and ratings are from the makers' datasheets.[^ds] [^doit] Where JLC's listing
disagrees, the datasheet is used: JLC lists the WROOM-02U-N4 at 105 °C, but N4 parts are 85 °C.
Both WROOM-02 versions carry a plain ESP32-C3 with a separate 4 MB flash chip inside the can, and
have 18 edge pads at 1.5 mm pitch plus one ground pad under the body.

- **The DOIT ESPC3-02 is out.** It is the nearest in size to the MINI-1, but it brings out only
  EN, GPIO4–7 and GPIO18–21: one ADC1 pin and no GPIO9, so neither the two multiplexer commons
  nor the boot pin can be wired.[^doit]
- The DOIT ESPC3-12, -20 and -32 bring out EN, GPIO0–10 and GPIO18–21, like the WROOM-02. Their
  datasheets give a working range of −40 to 85 °C.[^doit]

Listed but with no stock, so not orderable today: Ai-Thinker ESP-C3-12F-4M (C2838647, Eco),
ESP-C3-13-4M (C2838648, Eco), ESP-C3-32S-4M (C2838650, Eco), ESP-C3-01M-4M (C2838649, Eco,
hand-soldered), ESP-C3-M1 C3FN4 (C2925149, Eco) and C3FH4 (C2925151, Std), ESP-C3-12F-2M
(C2847302, Std); Espressif ESP8685-WROOM-05-H2 (C3013927, Eco); Wireless-tag WT32C3-01N
(C7463264, Eco) and WT32C3-S2 (C5345905, Eco); Seeed XIAO ESP32C3 (C19189385, Eco). JLC lists no
WeAct or SuperMini ESP32-C3 board as a stocked part, only customers' own consigned parts.

### Other families

| Part | Code | PCBA | Stock | 1–9 | Body, pads | Antenna | Rated | Why not |
|---|---|---|---|---|---|---|---|---|
| ESP32-C6-MINI-1U-H4 | C20627095 | **Eco**, X-ray | 2,165 | 4.31 | 13.2 × 12.5, pads under body | U.FL | 105 °C | See option 4 |
| ESP32-C6-MINI-1-N4, -H4 | C5736265, C6553337 | Std, X-ray | 0 | 3.94, 4.57 | 13.2 × 16.6 | PCB | 85, 105 °C | Standard-only, no stock |
| ESP32-C6-WROOM-1-N8, -N4 | C5366877, C6034714 | Eco | 2,669, 377 | 4.22, 4.41 | 18 × 25.5, castellated | PCB | 85 °C | Larger than the WROOM-02, dearer, 85 °C, new pin map |
| ESP8684-MINI-1-H4X (ESP32-C2) | C6191511 | Std | 245 | 2.48 | 13.2 × 16.6 | PCB | 105 °C | Standard-only |
| DOIT ESPC2-02, -05, -12, -12E, -M1 | C19949078–82 | Eco | 542–966 | 1.58–2.11 | 17.3 × 15 to 24 × 16 | PCB or U.FL | 105 °C | ESP32-C2. None brings out GPIO8, and the ESPC2-02 has one ADC1 pin. ESP-IDF only in ESPHome, and a 26 MHz crystal needs its own build setting. ESPC2-02 is listed for hand-soldering |
| DOIT ESPC5-12-H4 (ESP32-C5) | C52139916 | Eco | 655 | 4.14 | 24 × 16 | PCB | JLC lists 125 °C; datasheet not read | Larger, dearer, new chip family |
| ESP32-S3-MINI-1 and -1U | C2913206 and three more | Std, X-ray | 134–3,744 | 4.71–4.98 | 15.4 × 20.5 or 15.4 × 15.4 | PCB or U.FL | 85 °C, one 105 °C | Standard-only |
| Seeed XIAO ESP32-C6 | C27675191 | Eco | 110 | 7.60 | 21 × 17.8, castellated | U.FL | not listed | A dev board with its own regulator and USB-C. Dearer and larger |
| Ai-Thinker ESP-12F (ESP8266) | C82891 | Eco | 18,740 | 2.82 | 24 × 16, castellated | PCB | 85 °C | One ADC input |
| Ai-Thinker ESP-07S (ESP8266) | C82895 | Eco | 5,854 | 3.72 | 17 × 16, castellated | U.FL | 85 °C (JLC lists 125) | One ADC input |
| Ai-Thinker ESP-01F (ESP8285) | C2764054 | Eco | 7,325 | 2.73 | 11 × 10 | none on module | 85 °C | One ADC input |
| DOIT ESP-M1, ESP-M2 (ESP8266) | C19949056, C19949057 | Eco | 966, 411 | 2.10, 1.71 | 15 × 12.3, 20 × 12.3 | U.FL, PCB | 105 °C | One ADC input |

The ESP8266 and ESP8285 have a single ADC input with a 0–1 V range.[^adc] The strip needs two
multiplexer commons read at up to 3.3 V, so an ESP8266 would mean a 16:1 multiplexer or a third
switch, a divider on the common, and a 10-bit converter in place of the C3's 12 bits. That is a
redesign of the ADC, for a module no smaller than the WROOM-02. Not pursued.

### Bare chips

| Part | Code | PCBA | Stock | 1–9 | Package | Rated | Flash |
|---|---|---|---|---|---|---|---|
| ESP32-C3 | C2838500 | Eco | 7,214 | 1.85 | QFN-32, 5 × 5 | 105 °C | none: add a flash chip |
| **ESP32-C3FH4** | C2858491 | Eco | 4,951 | 2.17 | QFN-32, 5 × 5 | 105 °C | 4 MB in package |
| ESP32-C3FN4 | C2848860, C5143572 | Eco | 0 | 1.89, 1.47 | QFN-32, 5 × 5 | 85 °C | 4 MB in package |
| ESP8685H4 | C4944062 | Eco | 0 | 1.80 | QFN-28, 4 × 4 | 105 °C | 4 MB in package |
| ESP8684H4X (ESP32-C2) | C48929155 | Eco | 717 | 1.14 | QFN-24, 4 × 4 | 105 °C | 4 MB in package |
| ESP32-C6 | C5364646 | Eco | 252 | 2.50 | QFN-40, 5 × 5 | 105 °C | none |

What a chip-down ESP32-C3FH4 needs around it, from Espressif's hardware design
guidelines:[^hdg]

- **Crystal:** 40 MHz, ±10 ppm, with two load capacitors chosen by test and a series inductor
  on XTAL_P (24 nH to start).
- **RF match:** a C-L-C network at the chip, 1.2–1.8 pF, 2.0–3.0 nH and 1.8–1.2 pF. Espressif
  draws it in 0201, which Economic PCBA does not place: 0402 is its smallest. A second C-L-C at
  the antenna is recommended.
- **RF trace:** 50 Ω on the outer layer, no vias, with unbroken ground beneath it.
- **Antenna:** a chip antenna or one drawn in copper. Espressif says a PCB antenna must be
  checked by simulation and test.
- **Power:** 10 µF where 3.3 V arrives; 10 µF and a filter inductor rated 500 mA or more at the
  two VDD3P3 pins; 100 nF at VDD3P3_RTC and at VDD3P3_CPU; 1 µF at VDD_SPI.
- **CHIP_EN:** 10 kΩ and 1 µF. **Strapping:** GPIO2, 8 and 9, as now.
- **Flash:** in the package on the ESP32-C3FH4. The plain ESP32-C3 needs a flash chip on
  GPIO12–17.
- **Layout:** at least nine ground vias under the chip, the crystal at least 2 mm from its pin
  with no vias on its traces, UART kept away from the antenna.
- **Layers:** four are recommended. Two "can also be used", with unbroken ground under the chip,
  the RF trace and the crystal. Espressif notes that it makes no two-layer module itself.

That is about 20 passives and a crystal. At JLC, all Economic:

| Part | Example | Class | 1–9 |
|---|---|---|---|
| 40 MHz crystal, 3225 or 2016 | C284179 (3225, ±10 ppm, 85 °C), C20885029 (2016, 85 °C) | extended | 0.08 |
| 2.4 GHz chip antenna, 3216 | Walsin RFANT3216120A5T, C127629 (85 °C) | extended | 0.11 |
| or Johanson 2450AT18A100E | C89334 (125 °C) | extended | 1.03 |
| RF matching inductor, 0402 | Murata LQG15HS2N0S02D, C18216 (value set by tuning) | extended | 0.02 |
| Decoupling and matching capacitors, resistors | the strip's existing 0402 values where they match | basic, or one more type each | — |

No 40 MHz crystal at JLC is basic or preferred, and none found is rated past 85 °C, so the 105 °C
chip would sit beside an 85 °C crystal. That is two or three more extended part types than
today ($6.14–9.21 an order): the crystal, the inductor, and a chip antenna unless the antenna is
drawn in copper.

## Fit

How each candidate fitted the strip's way 1 ear is left out, since the yoke places its module on
the chin; it is in this note's git history.

**Chip-down antenna.** The antenna needs an area at the board end with no copper on either face.
A 3216 chip antenna wants roughly 5 × 10 mm clear; an inverted-F drawn in copper wants about
6 × 16 mm. Either way the board end moves out by about 5–6 mm, into the space the MINI-1's
antenna overhangs today, so the strip's outline grows to about 110 mm while its reach along the
panel stays about the same. The ring face in the ear carries the GND bus, which would have to
stop short of that area. On a two-layer 1.6 mm board a 50 Ω trace over ground is about 3 mm
wide, so the feed has to be a short coplanar run instead, and its impedance is then set by a gap
JLC etches to its own tolerance.

Espressif asks for a module's PCB antenna to sit outside the board, feed point nearest the
edge, as the MINI-1's does now and the WROOM-02's would.[^hdg]

**Pins.** The strip uses GPIO3 and GPIO4 (ADC1) for the commons, GPIO5–7 for the selects, GPIO1
for the LED, GPIO2, 8 and 9 as strapping pins, GPIO20 and 21 for UART0, and EN.

| Candidate | Pins |
|---|---|
| ESP32-C3-WROOM-02, DOIT ESPC3-20 and -12 | All present under the same names: EN, GPIO0–10, 18–21. Nothing changes in the schematic but the footprint |
| Bare ESP32-C3FH4 | All present. Same chip as inside the MINI-1 |
| ESP32-C6-MINI-1U | ADC1 is GPIO0–6, so the commons and selects can stay. UART0 moves to GPIO16 and 17. Boot is still GPIO9 with GPIO8. GPIO15 is a new strapping pin that must not float. ESPHome supports the C6 on ESP-IDF only, which is what the strip uses already.[^esphome] A different firmware target |
| DOIT ESPC3-02 | GPIO4–7 and 18–21 only. Not usable |

First flash is the same for every ESP32-C3 option: ESP-PROG through J1, UART0, EN and GPIO9.

## Costs both ways

Fixed assembly fees, from JLC's price table (updated 2026-09-09):[^price]

| | Economic | Standard |
|---|---|---|
| Setup | 8.18 | 25.56 |
| Stencil | 1.53 | 8.21 |
| Part types | 6 extended × 3.07 = 18.42 | 25 types × 1.53 = 38.25 |
| X-ray, 4 modules × 1.64 | — | 6.56 |
| **Total** | **28.13** | **78.58** |

The strip has six extended part types today, the module among them
([#18](https://github.com/XDGFX/blade-reader/issues/18)). A replacement module is still one
extended type, so options 1, 2 and 5 leave the fees at $28.13. Bare-board price is left out: it is
not quoted yet, and a strip 3 mm longer and 5 mm deeper should not move it far.

| Option | Fees | Parts × 4 | Total | Against Standard with the MINI-1 ($90.39) | What else it costs |
|---|---|---|---|---|---|
| 1. WROOM-02-H4 | 28.13 | 13.50 | 41.63 | −48.76 | Ear re-layout: new footprint, the module's pads move, mux 1 and its parts move outboard, the UART, selects and ADC lines are re-routed, silk follows. `fit-check` and the printed plate change with the outline. Firmware, pin names, flashing and ESPHome are unchanged |
| 1 with TSSOP mux 1 | 31.20 | 13.50 + 0.94 | 45.64 | −44.75 | Keeps the body under 30. Two multiplexer part types unless mux 2 changes too |
| 2. WROOM-02-N4 | 28.13 | 13.18 | 41.31 | −49.08 | As 1, at 85 °C: #17's pessimistic case passes that at 40 °C ambient |
| 3. Chip-down C3FH4, chip antenna | 37.34 | about 9.50 | about 46.80 | about −43.60 | A new RF design: 50 Ω feed, matching network and antenna on a two-layer 1.6 mm board, untuned. No modular certification, which matters only if strips are ever sold. Risk of a respin if range is poor: one respin costs more than the saving |
| 3 with a copper antenna | 34.27 | about 9.10 | about 43.40 | about −47.00 | As above, and the antenna's length is tuned by cutting copper |
| 4. C6-MINI-1U-H4 | 28.13 + 6.56 | 17.24 | 51.93 + antennas | about −36 | JLC may refuse it at review. Hidden joints as now, though X-rayed. Four antennas and leads bought and fitted. New pin map and firmware target |
| 5. DOIT ESPC3-20-N4 | 28.13 | 9.57 | 37.70 | −52.69 | As 2, with DOIT's antenna and datasheet in place of Espressif's |
| A. Standard, MINI-1-H4X | 78.58 | 11.81 | 90.39 | 0 | Rails on the comb, not yet confirmed (#41). Black ENIG becomes possible |
| B. Hand-soldered MINI-1-H4X | 25.06 | about 11.81 + LCSC postage | about 37 + postage | about −53 | Four modules with every pad hidden, soldered on a hot plate beside 0402s. No inspection, awkward rework |

Against hand-soldering, option 1 costs about $5 more and has JLC place and reflow the part.

## Could not confirm

- **Why the MINI-1 is Standard-only.** JLC publishes no rule beyond the tooltip. Whether support
  would allow C41349510 on an Economic order is not known: ask.
- **Whether JLC would place the ESP32-C6-MINI-1U-H4 under Economic.** Its page says "Economic and
  Standard" and "X-ray Inspection: Required". Every sibling is Standard-only, so the flag may be
  corrected at any time, or at order review.
- **Whether X-ray is charged on an Economic order**, and whether "pcs" in the price table counts
  parts or boards. The table gives the same rate under both services.
- **The fit.** No footprint was placed in `board/`. The growth figures are datasheet sizes set
  against today's coordinates. The antenna section of the WROOM-02 is taken as 6 mm.
- **The WROOM-02's ground pad.** It has one pad under the body besides its 18 edge pads. Whether
  Espressif allows it to be left unsoldered was not read. If it is soldered, that one joint is
  hidden; the 18 that carry signals and power are not.
- **DOIT modules.** Their land patterns were read for the ESPC3-02, -12, -20 and -32 only. No
  DOIT datasheet shows a ground pad under the body. The ESPC5 datasheet was not read.
- **ADC with Wi-Fi on, for the ESP32-C2 and ESP32-C6.** No statement found either way. It does
  not bear on the recommendation.
- **Bare-board price** for the larger outline, and **the Economic quote itself**: neither was
  run through JLC's quote form with the new part.
- **Stock on the day.** 150 WROOM-02-H4 is thin. JLC's search data was read once, on 2026-10-10.
- **A 40 MHz crystal rated to 105 °C** at JLC: none found by search, which is not proof there is
  none.

[^api]: The page's "PCBA Type" row, and `GET https://cart.jlcpcb.com/shoppingCart/smtGood/getComponentDetail?componentCode=<code>`, whose `componentProductType` is 0 for "Economic and Standard" and 2 for "Standard Only" on all 92 parts checked against their pages. Candidates were found with `POST https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`.
[^tip]: Tooltip text in the part page's script, for example <https://jlcpcb.com/partdetail/C41349510>. The X-ray tooltip reads: "In order to ensure the soldering quality, X-ray inspection is required for components, like BGA, QFN, or other lead-less package types, whose soldering joints are hidden after assembly."
[^bom]: <https://jlcpcb.com/help/article/common-bom-and-cpl-matching-issues-and-explanations> (updated 2026-09-09)
[^cap]: <https://jlcpcb.com/capabilities/pcb-assembly-capabilities> (no date on the page)
[^price]: <https://jlcpcb.com/help/article/pcb-assembly-price> (updated 2026-09-09)
[^ds]: Espressif datasheets: <https://www.espressif.com/sites/default/files/documentation/esp32-c3-wroom-02_datasheet_en.pdf> (covers the 02U), <https://www.espressif.com/sites/default/files/documentation/esp32-c6-mini-1_mini-1u_datasheet_en.pdf>, <https://www.espressif.com/sites/default/files/documentation/esp32-c6-wroom-1_wroom-1u_datasheet_en.pdf>, <https://www.espressif.com/sites/default/files/documentation/esp8684-mini-1_mini-1u_datasheet_en.pdf>, <https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf>, <https://www.espressif.com/sites/default/files/documentation/esp32-c6_datasheet_en.pdf>. Ai-Thinker datasheets as hosted by LCSC: ESP-12F <https://datasheet.lcsc.com/datasheet/pdf/bb52afb9b0bdd84eff3377bbb6814e0f.pdf>, ESP-07S <https://datasheet.lcsc.com/datasheet/pdf/7513321298517e965d5982e302800bf0.pdf>, ESP-01F <https://datasheet.lcsc.com/datasheet/pdf/a7619ed162f63f997ebebf3d40925334.pdf>.
[^doit]: DOIT datasheets as hosted by LCSC: ESPC3-02 <https://datasheet.lcsc.com/datasheet/pdf/e246eedd6df1817cf9c8f1e120d12fef.pdf>, ESPC3-12 <https://datasheet.lcsc.com/datasheet/pdf/5ec6ea0cb5242bf83cfcf0b4daf1190e.pdf>, ESPC3-20 <https://datasheet.lcsc.com/datasheet/pdf/08573c029ce0d84ddb688682bfd0e0be.pdf>. The rest are linked from each part's LCSC page. The ESPC3-02's sheet names the chip as both "ESP8685H2/H4" and "ESP32-C3FH4".
[^hdg]: <https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/schematic-checklist.html> and <https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/pcb-layout-design.html>
[^adc]: <https://esphome.io/components/sensor/adc/>
[^esphome]: <https://esphome.io/components/esp32/>
