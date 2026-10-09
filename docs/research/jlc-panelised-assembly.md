---
date: 2026-10-09
issue: 197
map: 178
---

# JLC assembly of a snap-apart panel of different boards

Answers XDGFX/hailey#197: what JLCPCB charges to fabricate and assemble the **way monitor** as one
self-made panel (a main strip with the ESP32-C3 and three lite strips, joined by mouse bites),
which panel rules apply, and how that compares with ordering the strips as separate designs.

Fees are USD from JLCPCB's help and capability pages, all marked "Last updated on Sep 09,
2026" unless noted, and shipping read from JLC's quote API on 2026-10-09. JLC says fees "may
vary slightly due to exchange rate fluctuations". Recheck in the quote before ordering.

## Answer

- **Yes, it counts as multiple designs.** Boards with different copper, silkscreen or mask that
  can be separated "no matter by v-cut, millings, or drill holes" are different designs, and
  identical boards separated and delivered as individuals count too.[^dd] So expect
  **Different Design = 4** (main plus three lite), possibly 2 if JLC's engineer counts the
  three identical lite strips once.[^dd2] The bare-board surcharge is not published. JLC says
  only that it is "calculated on our website by selecting the number of designs".[^extra]
- **PCBA works on it.** JLC lists a PCBA **panel fee of USD 8.21**, Economic and Standard,
  "when the number of panelized designs is greater than 1".[^price] It also states that "if
  your order needs SMT, then the SMT panel will also be charged with different design
  fees".[^extra] One combined BOM and CPL covering the whole panel goes in with the option
  "Complete File, just proceed with my own files".[^bom] Designators must be unique across the
  panel.
- **Economic PCBA fits.** Panel 10 × 10 to 250 × 250 mm, mouse bites only (no V-cut), edge
  rails and fiducials "not necessary", 2–50 assembled.[^cap] The four strips (about 80 mm each
  plus comb fingers) fit with plenty of room.
- **Panel against separate orders:** the panel saves a second setup fee and stencil, and
  charges each extended part once. It adds the USD 8.21 panel fee and the unpublished
  different-design surcharge. See [Cost against two separate designs](#cost-against-two-separate-designs).
- **Cheapest shipping to Australia:** Global Standard Direct Line, **USD 6.10–9.62 up to
  0.5 kg**, 10–14 business days. DHL Express is USD 21.09 flat to 0.5 kg, 2–4 days.

## Assembly fees

From JLC's PCBA price table.[^price]

| Fee | Economic | Standard |
|---|---|---|
| Setup | **8.18** | 25.56 single-sided, 51.12 double |
| Stencil | **1.53** | 8.21 single-sided, 16.42 double |
| Panel fee (more than 1 design) | **8.21** | 8.21 |
| Extended part feeder loading | **3.07** per extended part type | 1.53 per part type, basic or extended |
| SMT joints | 0.0016 per joint | 0.0016 per joint (to 50,000) |
| Hand-soldering labour | 3.58 per order | 3.58 per order |
| Confirm parts placement | 0.45 | 0.45 |
| Stencil storage | none | 4.93 |
| Minimum per board | none | 0.48 per board |
| Handling fee | none | tops the Standard–Economic gap up to 14.93 |

- Basic parts carry no feeder fee on Economic. "Promotional Extended Parts" are also exempt
  from feeder loading on Economic (order form text).[^form]
- Stencil: paste files panelled by the customer are free under 5 designs; at 5 or more, USD
  4.20. If JLC panels the paste, USD 4.20 per design above 2.[^extra]
- Economic PCBA is single-sided only, and "Only $8 set-up fee. The minimum board dimension
  is 10*10mm".[^form]

## Panel rules

| Rule | Value | Source |
|---|---|---|
| Delivery format | "Panel by Customer" for a self-made panel, at most **10 designs**. Self-panelised as "Single PCB", at most 5 or JLC may cancel | [^order] |
| Different Design field | "How many different designs in your files separated by v-cuts, mouse bites or milling slots"; a free-entry box for more than 4 | [^form] |
| Panel size, Economic | 10 × 10 to 250 × 250 mm | [^cap] |
| Panel size, Standard | 70 × 70 to 250 × 250 mm | [^cap] |
| Panel separation, Economic | mouse bites only. "V-cut is not supported in Economic Assembly" | [^cap] [^panel] |
| Assembled quantity | Economic 2–50, Standard 2–80,000. Order 5 boards, assemble as few as 2 | [^cap] [^form] |
| Minimum PCB quantity | 5 | [^form] |
| Mouse bites | holes 0.5–0.8 mm, 0.2–0.3 mm between holes, breakaway tab at least 5 mm, board spacing 1.6 or 2 mm. No minimum panel size for mouse-bite panels | [^caps] |
| V-cut (Standard only) | straight, edge to edge, panel 70 × 70 to 475 × 475 mm, at least 0.6 mm thick, 0.4 mm copper clearance, extra cost if a piece is under 15 mm on a side | [^caps] [^panel] |
| Edge rails | Economic "not necessary". Standard needs them, at least 5 mm. Delivered attached by default | [^cap] [^rails] |
| Tooling holes | 2 mm non-plated on 5 mm rails for SMT. If none are given, JLC adds two 1.152 mm holes on opposite corners | [^caps] [^form] |
| Fiducials | 1 mm bare copper, mask opening 2 mm, 3–4 near the edges, 3.35 mm clear of the edge, or centred 3.85 mm from the panel edge on a rail. JLC adds them to rails, not to each piece | [^rails] [^caps] [^panel] |
| Component to board edge | component body at least 2.5 mm from the board edge | [^tc] |

The 2.5 mm edge clearance matters for the comb. JLC adds 5 mm rails automatically "because
they are needed to increase component–to-board-edge clearances".[^form] Reading this
together with the T&C, the edge in question is the panel's outer edge on the conveyor, not
the mouse-bite joins inside it. Putting 5 mm rails on the two long sides of the panel
satisfies it whatever sits near the strip edges. This is inference: confirm in the DFM
review.

The tscircuit trial (XDGFX/hailey#190) produces one board. A panel of four outlines with mouse-bite tabs
has to be drawn as one board with routed slots and the tab holes. That is a layout task for
XDGFX/hailey#178.

## Cost against two separate designs

Fixed fees only, Economic, one assembled set. Bare-board prices and joint costs are left out
because they depend on the layout. Assumes three extended part types on the main strip
(ESP32-C3 module, CC6905, M4 nut C2916378) and two on the lite strips (CC6905, M4 nut). The
CD4051B is preferred (`way-monitor-adc.md`).

| Item | One panel, 4 designs | Two orders (main, lite) |
|---|---|---|
| Setup | 8.18 | 16.36 |
| Stencil | 1.53 | 3.06 |
| Panel fee | 8.21 | 0 |
| Extended feeders | 3 × 3.07 = 9.21 | (3 + 2) × 3.07 = 15.35 |
| Bare-board different-design surcharge | quote only | 0 |
| Second bare-board order | 0 | one extra engineering fee |
| **Fixed fees known** | **27.13** | **34.77** |

The panel is about USD 7.60 ahead before the bare-board surcharge, and the separate route
also pays a second board order. The surcharge decides it. The only JLC-hosted figure is a
2023 customer question reporting **USD 19 extra for 2 designs**.[^qa] That is a customer's
report, not a JLC price. At that level the two routes are close. Put the panel in the quote
form with Different Design set to 4, then 2, and read the PCB line before choosing.

Minimum quantities favour the panel. 2 assembled panels give two complete 24-way sets. The
separate route needs at least 2 mains and 3 lite strips assembled.

## Shipping to Australia

From JLC's quote API on 2026-10-09, USD, for Australia. The rates are the same ones the quote
page's "Shipping Estimate" shows.[^ship] JLC's help pages publish no rate table.[^shiphelp]

| Weight | Global Standard Direct Line (10–14 days) | UPS Express Saver (5–7) | DHL Express (2–4) | FedEx Express (5–7) |
|---|---|---|---|---|
| 100 g | **6.10** | 9.80 | 21.09 | 28.73 |
| 200 g | **6.89** | 9.80 | 21.09 | 28.73 |
| 300 g | **7.68** | 9.80 | 21.09 | 28.73 |
| 500 g | **9.62** | 9.80 | 21.09 | 28.73 |
| 750 g | 12.33 | **11.15** | 23.99 | 34.36 |
| 1 kg | 14.30 | **11.15** | 23.99 | 34.36 |

- Global Standard Direct Line is capped at 1.5 kg. Sea freight does not serve orders this
  small.
- Above about 0.5 kg, UPS Express Saver is both cheaper and faster.
- A small PCBA order of 5 panels around 100 × 100 mm should come in under 0.5 kg. JLC's quote
  shows the real weight.
- JLC's DHL delivery stats for Australia: 92 % delivered within 5 business days, 98 % within 7.
  UPS: 91 % and 98 %.[^ship]

[^dd]: <https://jlcpcb.com/help/article/different-design-in-your-pcb-files>
[^dd2]: The order form's Different Design field asks how many designs are "separated by v-cuts, mouse bites or milling slots" (<https://cart.jlcpcb.com/quote>), while <https://jlcpcb.com/help/article/different-design-in-your-pcb-files> says "This additional charge only applies if the PCBs on a panel are different."
[^extra]: <https://jlcpcb.com/help/article/in-what-cases-will-there-be-charged-extra>
[^price]: <https://jlcpcb.com/help/article/pcb-assembly-price>
[^bom]: <https://jlcpcb.com/help/article/common-bom-and-cpl-matching-issues-and-explanations>
[^cap]: <https://jlcpcb.com/capabilities/pcb-assembly-capabilities> (no update date on the page)
[^caps]: <https://jlcpcb.com/capabilities/Capabilities>, panelisation section
[^panel]: <https://jlcpcb.com/help/article/pcb-panelization>
[^rails]: <https://jlcpcb.com/help/article/how-to-add-edge-rails-fiducials-for-pcb-assembly-order>
[^tc]: <https://jlcpcb.com/help/article/Terms-and-Conditions-of-JLCPCB-Assembly-Service>, section 2
[^order]: <https://jlcpcb.com/help/article/instructions-for-ordering>, section 14
[^form]: Order form text, read from the quote page's own scripts at <https://cart.jlcpcb.com/quote> on 2026-10-09
[^qa]: <https://jlcpcb.com/help/answers/detail/216-Multiple-designs-on-a-single-PCB>, a customer question dated 2023-12-27 with no JLC reply
[^ship]: `POST https://cart.jlcpcb.com/api/overseas-shop-cart/v1/shoppingCart/calculateGoodsFreight`, the endpoint behind <https://cart.jlcpcb.com/quote>'s shipping estimate, with country AU
[^shiphelp]: <https://jlcpcb.com/help/article/how-much-does-shipping-cost>, <https://jlcpcb.com/shipping>
