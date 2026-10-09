---
researched: 2026-10-09
for: "XDGFX/hailey#189 (map XDGFX/hailey#178)"
---

# Way monitor: output terminals and copper for 30 A per way

What the way monitor uses to take an existing #8 ring terminal at 30 A, and how much copper
it needs to carry the current from the panel screw to that terminal. The constraints come
from XDGFX/hailey#178. The board is JLC-assembled with no hand soldering. The whole order has to come in
around AUD 40 (about USD 26). It fits 12 ways at 13.35 mm pitch with about 11 mm clear per
way, and the existing #8 crimps are not redone.

Prices are LCSC/JLC single-order prices in USD on 2026-10-09, taken from the JLC parts API
and the LCSC product pages. Stock moves, so re-check them before ordering.

## Answer in brief

- **Output terminal:** use **XUNPU PCB-05-M4 (LCSC C53433121)**. It is a through-hole M4
  power terminal rated 40 A, 8 mm wide, and costs USD 0.32 each at 10+. It fits the 13.35 mm
  pitch with about 3 mm to spare. The budget fallback is a **Sinhoo SMTSO4040CTJ SMT M4 nut
  (C2916378)** at USD 0.17. It is the cheapest option, but nobody has rated it for current.
- **Lever or push-in terminal:** not worth it. The only 30 A+ one that fits a way is the
  **WAGO 2606-1101 (C3817133)** or 2606-3101 (C3309410). Each is USD 2.11 to 2.17,
  10.35 mm wide and barely stocked. It would also mean cutting off every existing ring
  crimp, which XDGFX/hailey#178 rules out.
- **Copper:** a long trace needs far more width than a way has. IPC-2152 asks for about
  66 mm at 1 oz or 33 mm at 2 oz for 30 A with a 20 °C rise. What makes the board workable is
  that the current path is only about 20 mm long. That calls for solid pours the full width
  of the way on **both layers**, stitched with vias, and preferably 2 oz.
- **Bus current:** keep it off the board. 100 A would need 180 mm or more of 2 oz copper.
- **2 oz price:** JLC does not publish the uplift. It shows only in the live quote, so it is
  still to be confirmed (see below).

## 1. Terminal that takes the existing #8 ring

The board's input is the panel's own #8-32 screw, clamping a plated ring pad on the board,
so the input needs no part. The part is needed on the output: the existing ring lug moves to
a threaded terminal on the board. M4 suits a #8 ring, as XDGFX/hailey#178 already settled.

### Candidates on LCSC

| Part | LCSC | Type | Rating | Footprint | Price (USD) | Stock | Fits 13.35 mm? |
|---|---|---|---|---|---|---|---|
| **XUNPU PCB-05-M4** | **C53433121** | THT, 4 legs, 1.0 mm brass, tin | **40 A** | 8 × 8 mm body, 11 mm tall, legs on a 5 × 7 mm grid | 0.41 (1+), 0.32 (10+) | 654 | Yes, 8 mm wide |
| XUNPU PCB-01-M4 | C53433116 | THT, 4 legs, 0.8 mm brass | 35 A; M4 torque 1.0 N·m | 8 × 8 mm, 8.5 mm tall, legs on a 5 × 7.2 mm grid | 0.30 (5+), 0.24 (50+) | 490 | Yes |
| Sinhoo SMTSO4040CTJ | C2916378 | SMT round nut, brass C3604 | **Not rated** | Ø8.74 mm flange, M4 × 4 mm thread, Ø6.22 spigot into the board | 0.17 (5+), 0.16 (50+) | 790 | Yes, 8.74 mm |
| BZXC BSMTSOM430BTR | C20617217 | SMT nut, M4 × 3 mm | Not rated | Ø8.74 mm | 0.13 | 986 | Yes, but less thread |
| Würth REDCUBE 7466104R | C5525515 | SMT, M4 | 50 A | — | 4.85 (1+), 4.18 (10+) | **16** | Yes, but USD 100 for 24 and too few in stock |
| Würth 7466004 (WP-SMBU) | C5523879 | SMT bush, M4 through-thread | 50 A; 1.2 N·m | — | 3.22 | **0** | — |
| Keystone 8196 / 8197 | C238176 / C238177 | THT | 30 A | — | 1.29 to 1.56 | 103 / 2 | **No:** 10-32 screw, which will not pass a #8 ring |
| Keystone 8191 | C238175 | THT | 15 A, 6-32 | — | 0.58 | 606 | No: underrated |

Sources: the XUNPU drawings for
[PCB-05](https://www.lcsc.com/datasheet/C53433121.pdf) (rated current 40 A, brass T1.0 mm,
tin) and [PCB-01](https://www.lcsc.com/datasheet/C53433116.pdf) (35 A, M4 torque 1.0 N·m,
−40 to 125 °C); the
[Sinhoo SMTSO4040CTJ drawing](https://www.lcsc.com/datasheet/C2916378.pdf) (brass C3604,
bright tin, 700 per reel, based on the PEM SMTSO); the
[Würth 7466004 datasheet](https://www.we-online.com/components/products/datasheet/7466004.pdf)
(I<sub>R</sub> 50 A at 20 °C, tightening torque 1.2 N·m, and "operating current depends on
PCB, cable lug and cross section of the cable"); and the Keystone catalogue page served as
the [LCSC 8196 datasheet](https://www.lcsc.com/datasheet/C238176.pdf) (8196/8197 rated 30 A
with a 10-32 × .375 screw).

### Choosing between them

- **Rated vs unrated.** The XUNPU terminals are the only cheap M4 parts with a current
  rating. The SMT nuts are mechanical standoffs and carry no rating. Würth rates a
  similar-sized SMT brass bush at 50 A, which suggests the nut geometry can carry 30 A. That
  is an inference, not a rating, and it depends on the solder fillet under the flange.
- **Cost for 24 terminals** under JLC's
  [PCBA fees](https://jlcpcb.com/help/article/pcb-assembly-price) (last updated 2026-09-09):
  - XUNPU PCB-05-M4: USD 7.70 for parts, plus 96 THT joints at USD 0.0164 (USD 1.57), plus
    the USD 3.58 per-order hand-soldering charge, plus USD 3.07 Economic feeder loading if JLC
    charges it on a THT extended part. That comes to roughly **USD 13 to 16**.
  - SMT nut: USD 4.10 for parts, plus USD 3.07 feeder loading, which comes to roughly
    **USD 7**.
  - On a USD 26 budget, that USD 6 to 9 gap matters. The hand-soldering charge is per order,
    so if anything else on the board is THT, the gap narrows.
- **Torque.** The panel's #8-32 screws are specified at 18 in-lb (2.03 N·m) (Blue Sea's
  catalogue figure for the ST Blade screw terminals). The new board terminal must be
  tightened lower: 1.0 N·m for XUNPU and 1.2 N·m for Würth. Note it on the fitting
  instructions. An SMT nut takes the torque through its solder joint alone. The XUNPU
  terminal's four through-hole legs take it better.
- **JLC capability.** Through-hole assembly is available under both Economic and Standard
  PCBA. Economic is single-sided and limited to 0.8 to 1.6 mm boards
  ([JLC assembly capabilities](https://jlcpcb.com/capabilities/pcb-assembly-capabilities)).

**Recommendation:** use XUNPU PCB-05-M4 if it fits the budget, because it is rated and
mechanically robust. Drop to SMTSO4040CTJ only if the order total forces it, and treat its
current capacity as unverified until a bench test at 30 A.

## 2. In-line lever or push-in terminals

| Part | LCSC | Actuation | Rating | Width (1 pole) | Price (USD) | Stock |
|---|---|---|---|---|---|---|
| WAGO 2606-1101 | C3817133 | Lever | 41 A IEC; listed at 31 A by LCSC and DigiKey | 10.3 mm | 2.11 (10+) | 0 |
| WAGO 2606-3101 | C3309410 | Lever | As above | 10.35 mm | 2.17 (10+) | 26 |
| Kefa KF206-7.5 | C475239 (2-pole only) | Push-button | 41 A IEC, 27 A UL, 6 mm² | P + 1 mm: 8.5 mm for 1 pole, 16 mm for 2 poles | 0.82 (2P, 10+) | 107 |

Sources: WAGO product pages for
[2606-1101](https://www.wago.com/global/pcb-terminal-blocks/pcb-terminal-block/p/2606-1101)
and
[2606-3101](https://www.wago.com/global/pcb-terminal-blocks/pcb-terminal-block/p/2606-3101)
(lever, 6 mm², 7.5 mm pitch). WAGO's pages do not show the rating, so the 41 A figure and
the width come from distributor listings (RS, Radiolocman), and LCSC/RS give 31 A instead.
The [Kefa KF206-7.5 drawing](https://www.lcsc.com/datasheet/C475239.pdf) gives UL 27 A,
IEC 41 A and a pusher opening force of at least 8 N; LCSC stocks only 2-pole and wider
versions.

**Verdict: not an upgrade.**

- The terminal accepts bare or ferruled wire, so every existing ring crimp would need cutting
  off. That breaks a constraint XDGFX/hailey#178 has already settled.
- At USD 50 or more for 24 WAGO terminals, the cost alone exceeds the whole budget, and LCSC
  stock is 0 and 26.
- The width only just fits: 10.35 mm in an 11 mm clear way.
- The cheap Kefa clone is push-button rather than lever, and LCSC does not stock a single
  pole. A 2-pole block is 16 mm wide, which does not fit a 13.35 mm way.
- The convenience gain is small. A way is changed rarely, and an M4 nut needs only a
  screwdriver.

## 3. Copper for 30 A per way

### What IPC says for a long trace

The widths below are for an isolated trace, from the IPC-2152 generic curve fit
(A = (117.555·ΔT^−0.913 + 1.15) · I^(0.84·ΔT^−0.108 + 1.159), in mil², as used by the
[smps.us calculator](https://www.smps.us/pcb-calculator.html), which reproduces the IPC chart
within about 3 %). The legacy IPC-2221 external-layer formula, i = 0.048·ΔT^0.44·A^0.725, is
shown for comparison; smps.us notes that it overstates what external traces can carry.
Copper thickness is taken as 35 µm per oz.

| Current | ΔT | 1 oz IPC-2152 | 2 oz IPC-2152 | 1 oz IPC-2221 ext | 2 oz IPC-2221 ext |
|---|---|---|---|---|---|
| 30 A | 20 °C | 66 mm | 33 mm | 21.5 mm | 10.7 mm |
| 30 A | 30 °C | 44 mm | 22 mm | 16.8 mm | 8.4 mm |
| 100 A | 30 °C | 359 mm | 179 mm | 89 mm | 44 mm |

A way has about 11 mm of width, so by either standard, **1 oz on one layer cannot carry
30 A** with an ordinary temperature rise. A 10 mm pour on two layers of 2 oz has the same
cross-section as a single 20 mm, 2 oz trace. IPC-2152 puts that at about a 33 °C rise, and
IPC-2221 at about 7 °C.

### Why the board can still work

IPC widths assume a trace long enough for its middle to be thermally isolated. The way
monitor's path is short: panel screw pad, then sensor, then output terminal, about 20 mm. At
each end is a brass terminal and 6 mm²-class cable, which both conduct heat away. The
dissipation is small:

| Copper (10 mm wide × 20 mm long) | Resistance | Loss at 30 A |
|---|---|---|
| 1 oz, one layer | 0.98 mΩ | 0.88 W |
| 1 oz, both layers | 0.49 mΩ | 0.44 W |
| 2 oz, both layers | 0.25 mΩ | 0.22 W |

These figures assume copper resistivity of 1.72 µΩ·cm at 20 °C, which rises about 0.4 % per
°C. The hall sensor's own conductor will probably be the hotter point; check it in the
sensor ticket.

Layout rules this implies:

- Pour each way's path as a solid polygon the full width of the way on **top and bottom**,
  with a dense via field at both terminals and along the path.
- Prefer 2 oz if the quote allows it. With 1 oz, keep the path as short as possible and
  open the solder mask.
- Keep the 3.3 V and signal routing out of the power corridor, except at the sensor.
- An extra 30 A test is cheap: one way at 30 A for 30 minutes, measured with a thermometer
  or IR camera, before the board goes into service.

### Exposed copper with solder, or a bolted link

- **Paste on exposed copper:** JLC applies paste wherever the paste layer has an opening, so
  this needs no extra process. The reflowed layer is thin, though, and tin-based solder
  conducts roughly 7 to 9 times worse than copper. It adds only the equivalent of a few µm
  of copper, so it is not worth relying on.
- **Bolted link or busbar:** this cannot be assembled at JLC and the owner cannot fit one,
  so it is out for per-way current.

### 100 A panel bus

Do not route bus current through the board. 100 A needs 180 mm or more of 2 oz copper
(IPC-2152, 30 °C). The panel's own bus stays the bus. The board carries only each way's
current in series between the panel screw and the new output terminal, plus a thin 24 V
feed (XDGFX/hailey#178).

## 4. JLC 2 oz copper

- **Available:** 1 oz and 2 oz are both standard outer-layer options on two-layer boards,
  and two-layer boards can go up to 4.5 oz. At 2 oz, the minimum trace and space rises from
  0.10 mm to 0.16 mm ([JLC copper weight guide](https://jlcpcb.com/help/article/jlcpcb-copper-weight)).
- **Price uplift: not published.** JLC's copper guide and
  [pricing breakdown](https://jlcpcb.com/blog/pcb-pricing-breakdown) say only that 2 oz
  costs extra and to use the live quote. JLC also adjusted substrate prices from 2026-06-26
  ([notice](https://jlcpcb.com/news/jlcpcb-pcb-pricing-notice)). Pre-2026 anecdotes are not
  reliable figures. Get the uplift by quoting the real outline at 1 oz and 2 oz.
- **With assembly:** a 2020
  [EEVblog thread](https://www.eevblog.com/forum/manufacture/no-2oz-copper-with-jpcpcb-assembly-any-alternatives/)
  reports that JLC refused 2 oz with PCBA. JLC's current assembly capabilities page lists no
  copper-weight restriction, but this is unconfirmed. Toggle 2 oz with PCBA enabled in the
  quote before committing the layout to 2 oz.

## Still open

- The 2 oz uplift in USD, and whether 2 oz is accepted with Economic PCBA. Both need the
  live JLC quote.
- Whether JLC charges the USD 3.07 Economic feeder fee on a THT extended part such as the
  XUNPU terminal.
- A 30 A bench check of whichever terminal is chosen, which is essential if the SMT nut is
  used.
