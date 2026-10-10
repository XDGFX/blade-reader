---
date: 2026-10-10
issue: 51
map: 40
---

# What the yoke costs against two strips

Answers XDGFX/blade-reader#51: on a JLC order of 5 with 2 assembled, what the yoke costs in total
and each, against rev A's strips; what covering one 12-way fuse panel and two costs under each;
and the standby power difference.

*Yoke*, *arm* and *chin* are the working words of the map (XDGFX/blade-reader#40) and are not in
the glossary. Prices are USD, read from JLCPCB on **2026-10-10** unless marked otherwise. Every
figure is marked **read** (from a JLC page or endpoint today), **carried over** (from an earlier
note) or **estimated**. Nothing here is a quote: JLC prices an order only once the Gerbers, BOM
and CPL are uploaded, which needs a login. Shipping and tax are left out.

## Executive summary

| | Yoke, 5 bare, 2 assembled | Strips, 5 bare, 2 assembled | Strips, 5 bare, 4 assembled |
|---|---|---|---|
| Module and assembly | WROOM-02-N4, Economic | WROOM-02-N4, Economic | WROOM-02-N4, Economic |
| Bare boards | 12.80 | 7.30 | 7.30 |
| Fixed assembly fees | 28.13 | 28.13 | 28.13 |
| Solder joints | 1.29 | 0.76 | 1.52 |
| Parts | 32.56 | 21.13 | 42.27 |
| **Order total** | **74.78** | **57.32** | **79.22** |
| Each assembled | 37.39 a yoke | 28.66 a strip | 19.80 a strip |
| Fuse panels covered | 2 | 1 | 2 |
| **Per fuse panel covered** | **37.39** | **57.32** | **39.61** |

- **Two fuse panels: the yoke order is $4.44 cheaper** ($74.78 against $79.22).
- **One fuse panel: the strips are $17.46 cheaper** ($57.32 against $74.78). JLC assembles a
  minimum of 2, so the one-panel yoke order comes with a second assembled yoke. That spare costs
  $16.92 in parts and joints. The strip order has no assembled spare. Like for like, one panel
  plus a full assembled spare, the comparison is the two-panel one: the yoke is $4.44 cheaper.
- **Past the first order's fixed costs, a yoke saves $5.33 a fuse panel**: $19.48 against $24.81
  for two strips, in parts, joints and bare board. Of that, $4.85 is parts: one module ($3.29),
  one supply ($1.27), one ground nut ($0.17) and the small parts round the module.
- **The module decides far more than the shape.** If the yoke kept the ESP32-C3-MINI-1-H4X that
  XDGFX/blade-reader#45 chose, it would need Standard PCBA and the same order would be
  **$121.88**, $47.10 more. See [Which module](#which-module-the-existing-decisions-point-to).
- **Standby: the yoke draws 0.09–0.33 W less per fuse panel**, which is 180–650 mAh a day from a
  12 V battery. All of it is the second module. The sensors draw the same either way and are most
  of the total. This is from datasheets; nothing has been measured, because no strip is built.
  The "about 1 W" in `docs/design.md` and the map is not supported: see
  [Standby power](#standby-power).
- **The outline has moved since the ticket was written.** It is now 124.2 × 123.31 mm, not
  124.2 × 149.23, and 5 bare yokes are $12.80, not about $15.40.
- **Two things are open and change the figures a little.** Which multiplexers the yoke uses
  (XDGFX/blade-reader#65): two 74HC4067s in place of four CD4051Bs add $2.79 an order. And whether
  a WROOM-02 fits the chin's corner: the outline on `explore/yoke` draws the MINI-1.

## What was read, and how

| Figure | Status | Source |
|---|---|---|
| Bare-board prices | Read | JLC's quote calculator, without a login, from typed length and width.[^calc] It reproduces the $7.20 and $16.40 of the earlier note |
| Assembly fee schedule | Read | JLC's assembly price page, "Last updated on Sep 09, 2026".[^price] Unchanged from `jlc-panelised-assembly.md` |
| Part prices, stock, extended and preferred status, X-ray flag | Read | JLC's parts catalogue, by LCSC code.[^parts] |
| Which assembly type takes each module | Carried over | `economic-pcba-wifi-mcu.md`, read 2026-10-10. Today's catalogue reply still marks C41349510 as needing X-ray and no WROOM-02 code |
| The assembly charge on a real BOM | Not read | The calculator returns no assembly price without an uploaded BOM. Fees here are the schedule applied to the BOM |
| Minimum quantities and attrition | Estimated | See [What is left out](#what-is-left-out) |
| Shipping | Carried over, not included | `jlc-panelised-assembly.md`, 2026-10-09 |
| Standby currents | Datasheet | Espressif, TI and Cross Chip. Nothing measured |

## Bare boards

Read from the calculator for 5 boards, 2 layers, FR-4, 1.6 mm, 1 oz, black mask, white silk,
lead-free HASL, one design, default build time.[^calc] JLC charges the bounding rectangle.

| Outline | Size, mm | Engineering | Board | Finish | **5 boards** | Each | Calculator weight |
|---|---|---|---|---|---|---|---|
| Strip, as on `main` (WROOM-02 ear) | 105.81 × 41.0 | 4.00 | 2.10 | 1.20 | **7.30** | 1.46 | 200 g |
| Strip, before the WROOM-02 | 104 × 38.5 | 4.00 | 2.00 | 1.20 | 7.20 | 1.44 | 189 g |
| Yoke, as on `explore/yoke` (d460378) | 124.2 × 123.31 | 4.00 | 7.40 | 1.40 | **12.80** | 2.56 | 389 g |
| Yoke, square chin (d0758d1) | 124.2 × 118.56 | 4.00 | 7.10 | 1.40 | 12.50 | 2.50 | 378 g |
| Yoke, as the ticket gave it | 124.2 × 149.23 | 4.00 | 9.00 | 1.50 | 14.50 | 2.90 | 441 g |
| Yoke, 10 boards | 124.2 × 123.31 | 4.00 | 14.80 | 1.80 | 20.60 | 2.06 | 651 g |

- **The strip's size** is from `board/lib/outline.tsx` on `main` at 26c0b71: 53.8 + 52.01 long,
  and a 28.0 body plus 13.0 of finger. The WROOM-02 ear cost $0.10 an order.
- **The yoke's size** is from the second correction on XDGFX/blade-reader#49: chin 20 deep with
  its outer corners cut at 45°, no ears at the arms' open ends, antenna inside the rectangle.
- **Per fuse panel** the bare yoke is $2.56 against $2.92 for two strips, so $0.36 cheaper. Per
  order it is $5.50 dearer.
- **No price step** lies between the two. The only one is at 102 × 102 mm, which the strip has
  already passed (`yoke-jlc-limits.md` on `research/yoke-jlc-limits`).
- **Not confirmed, as before:** that a loaded Gerber is priced on its outline's extents, and
  whether JLC's review adds a routing fee for either outline.

## Assembly fees

Read from JLC's price table.[^price]

| Fee | Economic | Standard |
|---|---|---|
| Setup | 8.18 | 25.56, one side |
| Stencil | 1.53 | 8.21, one side |
| Part types | 3.07 per extended type; basic and preferred free | 1.53 per type, basic or extended |
| SMT joints | 0.0016 each | 0.0016 each |
| X-ray | 1.64 a part, 1–10 parts | 1.64 a part, 1–10 parts |
| Packing | Free | 0.50 + 0.00003 × board area in cm² |
| Stencil storage | None | 4.93, not counted here |
| Large size, over 650 cm² | 57.46 | 57.46 |

- **Two assembled is the minimum** on both, and the table has no charge for ordering the minimum.
  The $0.48 "single board assembly surcharge" is for Standard bulk orders.
- **Size and shape change no assembly fee** below 650 cm². The yoke's rectangle is 153 cm².
- **The yoke and the strip pay the same fixed fees on Economic: $28.13.** Both have the same six
  extended part types: the module, the sensor, the nut, the fuse, the buck and the inductor. The
  yoke's two extra CD4051Bs are a preferred part.
- **On Standard, the yoke's fixed fees are $75.80:** 25.56 + 8.21 + 25 types × 1.53 + 2 × 1.64
  X-ray + 0.50 packing. Stencil storage is listed for Standard and left out, as
  `economic-pcba-wifi-mcu.md` left it out; whether it is charged on a first order was not found.
- **Not confirmed, carried over:** whether X-ray is charged per part or per board.

## Parts

Read today.[^parts] The price is the tier for the quantity the order buys, so a part's price can
differ from `docs/design.md`'s 10–50 figure. "Ext" is an extended part, which carries the $3.07
fee per type on Economic; "pref" is a preferred part and "basic" a basic one, neither with a fee.

| Part | LCSC | Status | Stock | Price | A strip | A yoke |
|---|---|---|---|---|---|---|
| CC6905S8-3FB030 sensor | C41421490 | ext | 4,939 | 0.6369 at 10–29 | 6 | 12 |
| ESP32-C3-WROOM-02-N4 | C2934560 | ext | 10,425 | 3.2949 at 1–9 | 1 | 1 |
| SMTSO4040CTJ M4 nut | C2916378 | ext | 770 | 0.1704 at 1–49 | 7 | 13 |
| LMR51610XDBVR buck | C20539658 | ext | 1,389 | 0.6678 at 1–9 | 1 | 1 |
| 0466001.NRHF 1 A fuse | C151135 | ext | 60,958 | 0.0965 | 1 | 1 |
| SWPA6045S220MT 22 µH | C83454 | ext | 41,284 | 0.0852 | 1 | 1 |
| CD4051BM96 multiplexer | C21379 | pref | 119,498 | 0.2582 at 1–49 | 2 | 4 |
| SMBJ33A TVS | C19077586 | pref | 73,187 | 0.0502 | 1 | 1 |
| SS210 diode | C14996 | basic | 720,557 | 0.0323 | 7 | 13 |
| 22 µF 1206 | C12891 | basic | 654,797 | 0.1172 | 2 | 2 |
| 2.2 µF 1206 | C50254 | basic | 271,371 | 0.0859 | 1 | 1 |
| 100 nF 0805 | C28233 | basic | 1,161,043 | 0.0329 | 1 | 1 |
| 10 µF 0603 | C19702 | basic | 10,423,919 | 0.0305 | 1 | 1 |
| 100 nF 0402 | C307331 | basic | 16,116,545 | 0.0093 | 10 | 18 |
| 1 nF 0402 | C1523 | basic | 3,197,057 | 0.0043 | 12 | 24 |
| 10 nF 0402 | C15195 | basic | 3,602,149 | 0.0050 | 2 | 4 |
| 1 µF 0402 | C52923 | basic | 7,320,497 | 0.0087 | 1 | 1 |
| 100 kΩ 0402 | C25741 | basic | 8,073,677 | 0.0024 | 6 | 12 |
| 6.8 kΩ 0402 | C25917 | pref | 125,665 | 0.0015 | 6 | 12 |
| 10 kΩ 0402 | C25744 | basic | 19,764,876 | 0.0034 | 5 | 5 |
| 75 kΩ 0402 | C25798 | pref | 34,442 | 0.0030 | 1 | 1 |
| 24 kΩ 0402 | C25769 | pref | 72,897 | 0.0027 | 1 | 1 |
| 1 kΩ 0402 | C11702 | basic | 8,310,822 | 0.0035 | 1 | 1 |
| MMBT3904 | C20526 | basic | 333,150 | 0.0116 | 1 | 1 |
| KT-0603R LED | C2286 | basic | 7,296,926 | 0.0076 | 1 | 1 |
| **Parts** | | | | | **10.57** | **16.28** |
| Part types, extended | | | | | 25, 6 | 25, 6 |
| Solder joints | | | | | 237 | 403 |

Other parts priced for the options below:

| Part | LCSC | Status | Stock | Price |
|---|---|---|---|---|
| ESP32-C3-MINI-1-H4X | C41349510 | ext, Standard only, X-ray | 276 | 2.9529 at 1–9, 2.6255 at 10–29 |
| ESP32-C3-WROOM-02-H4 | C2944070 | ext | 150 | 3.3747 at 1–9 |
| DOIT ESPC3-20-N4 | C19949074 | ext | 688 | 2.3926 at 1–9 |
| 74HC4067PW 16:1 | C179326 | ext | 12,172 | 0.4789 at 1–9 |

### How the yoke's BOM is derived

The strip's BOM is `board/fab/blade-reader/bom.csv` from the last `fab` run, with the module
changed to the WROOM-02-N4 that `main` now places. The yoke's is that BOM with these rules. None
of it is placed or routed.

| Block | Rev A strip | Yoke | Rule |
|---|---|---|---|
| Per way: sensor, nut, SS210, 100 kΩ and 6.8 kΩ divider, 100 nF and two 1 nF | 6 sets | 12 sets | Doubled. Rev A's column is kept as it is |
| Supply: fuse, TVS, 2.2 µF, 100 nF 0805, buck and its 100 nF, inductor, two feedback resistors, two 22 µF | 1 | 1 | Shared. One 1 A buck covers 12 sensors at 13 mA and the module's 345 mA peak, about 0.5 A; `way-monitor-power-supply.md` sized the same buck for 24 sensors |
| Module, with its 10 µF, 100 nF, 1 µF, EN and three strapping pull-ups, LED and its resistor | 1 | 1 | Shared |
| Programming footprint J1 and its SS210 | 1 | 1 | Shared. J1 is bare pads, not a part |
| Ground nut | 1 | 1 | Shared, so 13 nuts against 14 |
| Multiplexer, each with 100 nF and a 10 nF at its common | 2 | 4 | As XDGFX/blade-reader#45 chose. The same count as two strips, so nothing saved |
| Temperature sensor: MMBT3904 and its 10 kΩ | 1 | 1 | Assumed one. A second, for the other arm, would add $0.015 |
| Test pads, tooling holes | — | — | Not parts |

### Extended part fees

Each of the six extended types costs $3.07 an order, so $18.42. Over 2 yokes that is $9.21 a
yoke, which is $9.21 a fuse panel; over 4 strips it is $4.61 a strip and also $9.21 a fuse panel.
Over 2 strips it is $9.21 a strip, $18.42 a fuse panel. The fee is the same for both shapes, so
it does not favour either; it favours assembling more boards per order.

## The comparison

Economic PCBA, WROOM-02-N4, four CD4051Bs on the yoke. Order total is bare boards, fixed
assembly fees, joints and parts, before shipping and tax.

| | (a) Yoke, 5 bare, 2 assembled | (b) Strips, 5 bare, 2 assembled | (c) Strips, 5 bare, 4 assembled |
|---|---|---|---|
| Bare boards | 12.80 | 7.30 | 7.30 |
| Setup and stencil | 9.71 | 9.71 | 9.71 |
| Extended part fees | 18.42 | 18.42 | 18.42 |
| Joints | 1.29 | 0.76 | 1.52 |
| Parts | 32.56 | 21.13 | 42.27 |
| **Order total** | **74.78** | **57.32** | **79.22** |
| Each assembled | 37.39 | 28.66 | 19.80 |
| Bare boards left over | 3 yokes | 3 strips | 1 strip |

(c) is the ordering plan in `docs/design.md`.

### Covering fuse panels

| | Yoke | Strips | Difference |
|---|---|---|---|
| One 12-way fuse panel | 74.78, order (a), with one assembled yoke spare | 57.32, order (b), no assembled spare | Strips $17.46 cheaper |
| Two 12-way fuse panels | 74.78, order (a), no assembled spare | 79.22, order (c), no assembled spare | Yoke $4.44 cheaper |
| One fuse panel and a full assembled spare | 74.78, order (a) | 79.22, order (c) | Yoke $4.44 cheaper |
| Each further fuse panel on the same order | 19.48 | 24.81 | Yoke $5.33 cheaper |

- **What the spare is worth.** JLC will not assemble one. So a one-panel yoke order always buys
  a second assembled yoke, for $16.92 more in parts and joints than assembling one would cost if
  JLC allowed it. Two strips for one panel are already the minimum, so that order buys no spare.
  The $17.46 gap for one panel is almost exactly the spare yoke.
- **Whether the spare has value** depends on the user. It covers a second fuse panel, or stands
  by for a failed yoke. A failed strip is replaced by one strip at about half the cost, but only
  if a spare strip was assembled, which order (b) does not do.
- **The further-panel figure** is one yoke's parts, joints and a fifth of the bare-board order,
  against the same for two strips. It leaves out the fixed fees, which the first boards have
  paid. An order of 5 yokes, all assembled, is $120.21, or $24.04 a fuse panel.

### The options still open

| Change | Order (a) becomes | Difference |
|---|---|---|
| Two 74HC4067PWs in place of four CD4051Bs (XDGFX/blade-reader#65) | 77.57 | +2.79: one more extended type at 3.07, less 0.21 in parts and 0.08 in joints |
| WROOM-02-H4 (105 °C) in place of the N4 | 74.94 | +0.16 |
| DOIT ESPC3-20-N4 in place of the N4 | 72.98 | −1.80 |
| MINI-1-H4X under Standard PCBA | 121.88 | +47.10 |

## Which module the existing decisions point to

The ticket asks for the BOM "for the chosen module and ADC arrangement". The decisions on record
do not agree on what that is.

| Decision | Says | When |
|---|---|---|
| XDGFX/blade-reader#45, yoke module and ADC | ESP32-C3-MINI-1-H4X with four CD4051Bs, one at each end of each arm. "No better 105 °C module can be bought" | 2026-10-10, with #41 still open |
| XDGFX/blade-reader#41, Economic or Standard | Aim for a module Economic PCBA can place: the WROOM-02 footprint. Standard with the MINI-1 is the fallback | 2026-10-10 |
| XDGFX/blade-reader#54, WROOM-02 trial | ESP32-C3-WROOM-02-N4 (C2934560), Economic PCBA. Cal accepts the 85 °C rating, which reverses XDGFX/blade-reader#18 | 2026-10-10 |
| XDGFX/blade-reader#58, merged to `main` at 26c0b71 | Rev A's way 1 ear is placed round the WROOM-02-N4. Body 28.0 deep | 2026-10-10 |
| XDGFX/blade-reader#49, second correction | The yoke loses the ears at the arms' open ends, so every multiplexer goes on the chin. Reopens #45's arrangement as XDGFX/blade-reader#65 | 2026-10-10 |

- **Rev A today** is the WROOM-02-N4 on Economic PCBA. `docs/design.md` still names the
  MINI-1-H4X in its ADC, Body and Pin map rows; XDGFX/blade-reader#59 is to update it.
- **For the yoke, the decisions point to the WROOM-02 on Economic.** #41's reason, about $47–49
  an order, applies to the yoke unchanged, and #45's reason for the MINI-1, the 105 °C rating,
  is the one #54 gave up for rev A. #45 says its runner-up's extended fee "is no penalty" under
  Standard, so it was written with #41 still open.
- **Nothing has decided it for the yoke.** No ticket says the yoke takes the WROOM-02, and the
  outline on `explore/yoke` draws the MINI-1: 13.2 wide, 11.2 of pads on the board, antenna 5.4
  past the chamfer. The WROOM-02 is 18 × 20 with a 6.0 antenna section. Whether it fits the
  chin's corner, 14.8 mm from chamfer to the arm's inside corner, is not checked.
- **The 85 °C rating was accepted for the strip**, on XDGFX/blade-reader#17's pessimistic case at
  40 °C ambient. A yoke has one module beside twice the ways' heat on one board, and the chin is
  next to the + stud. Whether the strip's thermal case carries over is not checked.

Both are priced:

| | Yoke, WROOM-02-N4, Economic | Yoke, MINI-1-H4X, Standard |
|---|---|---|
| Bare boards | 12.80 | 12.80 |
| Fixed assembly fees | 28.13 | 75.80 |
| Joints | 1.29 | 1.40 |
| Parts, 2 yokes | 32.56 | 31.88 |
| **Order total** | **74.78** | **121.88** |
| Each yoke, and per fuse panel | 37.39 | 60.94 |
| Against strips (c) for two fuse panels, 79.22 | −4.44 | +42.66 |

The same strips on Standard with the MINI-1 would be $128.92 for 4, so the yoke is cheaper than
strips for two fuse panels under either assembly type. The assembly type moves the total by ten
times what the shape does.

## Standby power

"Standby" here is the board powered and connected to Wi-Fi with no load on any way. The sensors'
supply current does not depend on the current they measure, so it is also the running draw.

### What differs

| Consumer | Two strips | Yoke | Each, at 3.3 V | Source |
|---|---|---|---|---|
| CC6905 sensors | 12 | 12 | 10 mA typ, 13 mA max | Carried over, CC6905 datasheet rev 1.3 via `way-monitor-power-supply.md` |
| Module, Wi-Fi receiving | 2 | 1 | 82 mA | Read, ESP32-C3-WROOM-02 datasheet v1.7, Table 6-4[^wroom] |
| Module, modem-sleep, CPU at 160 MHz | 2 | 1 | 23–28 mA typ | Read, same, Table 6-5 |
| LMR51610X quiescent, at the input | 2 | 1 | 26.5 µA typ, 40 max | Read, TI LMR51610 datasheet[^lmr] |
| Temperature sensor bias | 2 | 1 | 0.27 mA | `docs/design.md` |
| CD4051B quiescent | 4 | 4 | µA | Carried over |
| Voltage dividers, 106.8 kΩ per way | 12 | 12 | 0.11 mA at 12 V, from the way | Ohm's law |

Only the module differs by enough to count. The second buck's quiescent current and the second
temperature sensor add about 1 mW between them.

### The difference

Taken through the buck at 87 % (`way-monitor-power-supply.md`, read off TI's efficiency curve)
and the way's SS210 at about 0.5 V.

| One module less | At 3.3 V | At a 12 V supply | At a 24 V supply | From a 12 V battery |
|---|---|---|---|---|
| Receiving all the time (the upper bound) | 271 mW | 325 mW, 27 mA | 318 mW, 13 mA | 650 mAh a day |
| Modem-sleep, 28 mA | 92 mW | 111 mW, 9.2 mA | 108 mW, 4.5 mA | 220 mAh a day |
| Modem-sleep, 23 mA | 76 mW | 91 mW, 7.6 mA | 89 mW, 3.7 mA | 180 mAh a day |

Whole-panel totals at 12 V, with the sensors at their typical 10 mA:

| | Two strips | Yoke | Saved |
|---|---|---|---|
| Receiving all the time | 1.12 W, 2,250 mAh a day | 0.80 W, 1,600 mAh a day | 0.33 W, 29 % |
| Modem-sleep, 28 mA | 0.70 W, 1,390 mAh a day | 0.59 W, 1,170 mAh a day | 0.11 W, 16 % |

- **The sensors are 0.47 W of either total** at 12 V (120 mA at 3.3 V), and the yoke saves none
  of it.
- **Which row applies** depends on ESPHome's Wi-Fi power saving and on how often the firmware
  samples. The real figure lies between the rows. It is not measured.
- **"About 1 W"** is what `docs/design.md`'s Topology row and the map give for the saving. Even
  with the radio receiving all the time, one module is 0.33 W at 12 V. The 1.2 W in
  `way-monitor-power-supply.md` is the average for all 24 sensors and one module on 24 V, of
  which the sensors are 0.8 W. The 1 W figure looks to be that total, not the difference.
- **All datasheet figures, at 25 °C.** No strip is built, so none of this is measured. The first
  built strip gives the real figure with one current reading in its ground wire.

## What is left out

- **Shipping and tax.** JLC's calculator puts 5 bare yokes at 389 g on the full rectangle and 5
  strips at 200 g. The yoke's real board is under half its rectangle (70.5 cm² of 153.2). On the
  rates carried over from 2026-10-09, Global Standard Direct Line to Australia is $6.89 at 200 g,
  $7.68 at 300 g and $9.62 at 500 g, so the yoke order costs perhaps $1–3 more to ship. The
  504 g that XDGFX/blade-reader#46 warned of was for 135 × 165 mm; at today's size the order
  should stay in the 0.5 kg band with its parts, which is an estimate.
- **Minimum quantities and attrition.** JLC bills small parts in minimum lots (20 for an 0402,
  5 for an SS210) and adds a few for loss. Estimated from the catalogue's lot and loss fields at
  $3.50–4.10 an order, and the same within $0.60 for every order here, so it does not move the
  comparison. Not confirmed against a real quote.
- **Anything JLC's review adds:** a routing fee for either outline, a charge for a U-shaped
  outline, or tooling holes. None is published.
- **A printed support, wires and washers.** Outside the JLC order for both shapes.
- **Stock.** 770 nuts are in stock: 26 for the yoke order, 28 for strips (c). 276 of the
  MINI-1-H4X and 150 of the WROOM-02-H4 remain.

## Not confirmed

- That the WROOM-02 fits the yoke's chin, and that its 85 °C rating holds there.
- The real assembly quote. It needs the yoke's Gerbers, BOM and CPL, which do not exist.
- Whether X-ray is charged per part or per board, and whether Standard's stencil storage applies
  to a first order.
- The module's real average current under ESPHome.
- The yoke's part count beyond the rules above: it has no schematic yet.

[^calc]: `POST https://cart.jlcpcb.com/api/overseas-shop-cart/v1/shoppingCart/calculationGoodsCostsNew`, the endpoint behind the price shown at <https://cart.jlcpcb.com/quote>, called without a login on 2026-10-10. The request carries `pcbGoodsRequest` (layers, length, width, quantity, 1.6 mm, `Black`, `LeadFree HASL-RoHS`), `calculationCostsType: 1`, and `orderServiceConfigVos` filled with the default option of each service from `POST …/shoppingCart/quereyOrderService`. Without that list the endpoint answers "System error". The reply's `orderCountTolls` gives `projectMoney` (engineering), `stencilMoney` (board), `adornPutMoney` (finish) and their total, `dummyMoney`
[^price]: <https://jlcpcb.com/help/article/pcb-assembly-price>, "Last updated on Sep 09, 2026", read 2026-10-10
[^parts]: `GET https://cart.jlcpcb.com/shoppingCart/smtGood/getComponentDetail?componentCode=<code>` for prices, stock, `componentLibraryType` and `xrayFlag`, and `POST https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList` for `preferredComponentFlag`. The same data as <https://jlcpcb.com/partdetail/C41349510> and its siblings. Read 2026-10-10
[^wroom]: <https://www.espressif.com/sites/default/files/documentation/esp32-c3-wroom-02_datasheet_en.pdf>, v1.7, §6.4. The modem-sleep table is excerpted there from the ESP32-C3 series datasheet (v2.4, Table 5-8)
[^lmr]: <https://www.ti.com/lit/ds/symlink/lmr51610.pdf>, electrical characteristics, I<sub>Q(VIN)</sub> non-switching, PFM variant
