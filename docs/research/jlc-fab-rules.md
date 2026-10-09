---
date: 2026-10-09
issue: 3
map: 1
---

# JLC fab rules and options for the strip

Answers XDGFX/blade-reader#3: which JLCPCB fabrication rules and order options the strip should
use, and whether any of them moves the board off JLC's cheapest tier or out of Economic PCBA.

Everything here was read from JLC's own pages on **2026-10-09**. The rigid PCB capabilities page
carries no update date. The help articles are marked "Last updated on Sep 09, 2026". Prices are
USD. JLC does not publish the 2 oz or ENIG uplift as a table: both only show in the live quote
with the real Gerber loaded, so those two figures are still open (see [Open](#open)).

## Answer

- **Order options:** 2 layers, FR-4, **1.6 mm**, green, **ENIG**, 1 oz outer copper, Economic
  PCBA. 2 oz only if the quote shows it is cheap *and* accepted with Economic PCBA.
- **Rules for the layout:** the table below. In short: 0.15/0.15 mm traces, 0.3/0.6 mm vias,
  0.3 mm copper to any routed edge, R1.0 mm at the root of each slot between fingers.
- **Thickness:** 1.6 mm is the only thickness that keeps every option open. Economic PCBA takes
  0.8–1.6 mm; a 2.0 mm board would need Standard PCBA.[^pcba] JLC's tolerance is ±10 %, so a
  finger is 1.44–1.76 mm thick.[^cap]
- **Finish:** ENIG. It is flat, puts no solder layer under the clamp, and Economic PCBA accepts
  it on a 2-layer, 1.6 mm green board.[^pcba] The cost is small but quote-only. OSP is free but
  not offered with Economic PCBA.
- **Nothing in the recommended set leaves Economic PCBA.** ENIG and 2 oz each add a fee to the
  bare board. Choices that *would* leave Economic: 2.0 mm thickness, OSP, ENIG on a colour other
  than green, castellated holes or plated edges, V-cut.[^pcba]

## Rules table

"JLC minimum" is JLC's published limit for a 2-layer, 1 oz board.[^cap] "Use" is the value to
set in tscircuit. It leaves margin, and none of it triggers a surcharge.

| Rule | JLC minimum | Use | Note |
|---|---|---|---|
| Trace width / spacing, 1 oz | 0.10 / 0.10 mm | **0.15 / 0.15 mm** | Current paths are polygon pours, not traces (`design.md`) |
| Trace width / spacing, 2 oz | 0.16 / 0.16 mm | **0.20 / 0.20 mm** | JLC's copper guide advises over 8 mil at 2 oz[^cu] |
| Via hole / diameter | 0.15 / 0.25 mm (costs more) | **0.3 / 0.6 mm** | Holes ≥ 0.3 mm are JLC's "standard holes"[^extra]. 0.2–0.25 mm holes cost more below 0.45 mm diameter[^cap] |
| Via hole to via hole | 0.2 mm | 0.3 mm | For stitching arrays in the pours |
| PTH annular ring | 0.18 mm (0.25 recommended), 0.254 at 2 oz | **0.25 mm** | Applies to the M4 nut's pads if they are plated |
| Pad to track | 0.10 mm | 0.15 mm | |
| SMD pad to pad, different nets | 0.15 mm | 0.15 mm | |
| PTH to track | 0.28 mm (0.35 recommended) | 0.35 mm | |
| Via hole to track | 0.20 mm | 0.25 mm | |
| NPTH to track | 0.20 mm | 0.30 mm | |
| Copper to routed board edge or slot | 0.20 mm | **0.30 mm** | Outline tolerance is ±0.2 mm, so 0.2 mm copper can end up at the edge. Applies all round each finger and the slots between them |
| Internal corner radius, routed outline | about R0.5 mm (1.0 mm bit) | **R1.0 mm** | See [Outline](#outline-the-comb) |
| Non-plated slot width | 1.0 mm | — | The finger gap is about 2.9 mm |
| Non-plated hole | 0.50 mm | — | |
| Plated slot width | 0.50 mm, length ≥ 2 × width | — | |
| Soldermask bridge | 0.10 mm (green, 1 oz), 0.20 mm (2 oz) | 0.10 mm / 0.20 mm | |
| Soldermask opening | 1:1 with pad allowed; 0.09 mm from opening to a neighbouring trace | 1:1 | LDI upgraded June 2025 |
| Silkscreen | line ≥ 0.15 mm, text ≥ 1.0 mm tall, 0.15 mm from pads | same | |
| Component body to board edge | 2.5 mm | 2.5 mm | From the assembly T&C, see `jlc-panelised-assembly.md` |
| Outline tolerance | ±0.2 mm regular, ±0.1 mm high precision | regular | The finger is 10.5 mm in an 11.11 mm pocket, so ±0.2 mm still fits |

## Outline (the comb)

- JLC routes outlines and non-plated slots by CNC. The smallest non-plated slot is 1.0 mm,
  "made by CNC",[^cap] and JLC's outline guide gives internal corner radii of "≥0.5–1.0 mm to
  match router capabilities" (blog, 2026-05-15).[^outline] A concave corner drawn sharper than
  the bit's radius comes back rounded anyway, or is flagged in DFM.
- Use **R1.0 mm** at the root of each slot between fingers. That is twice the minimum, and it
  also relieves the stress where a clamped finger meets the body.
- Rectangular slots without rounded corners are "not supported".[^cap]
- Put the outline and every slot on the board-outline layer as one closed shape.[^outline]
- **Routing fee:** JLC charges extra when slots wider than 1.0 mm add up to 120 m of routed path
  per square metre of board (80 m/m² for 0.8–1.0 mm slots).[^extra] A rough comb (an 80 × 40 mm
  body with six 10.5 × 20 mm fingers) has about 0.48 m of outline on about 0.0045 m², so about
  100–110 m/m². That is under the line, but not by much. The article counts "slot" knife travel,
  and it is unclear whether the outer outline counts. Check the quote once the outline exists,
  and avoid adding extra slots.

## Thickness

- FR-4 thicknesses are 0.4/0.6/0.8/1.0/1.2/1.6/2.0 mm. For boards of 1.0 mm or more the
  tolerance is ±10 %, so 1.6 mm comes out at 1.44–1.76 mm.[^cap]
- Economic PCBA accepts 0.8–1.6 mm only.[^pcba]
- At the worst case of 1.76 mm, the #8 screw loses about 0.16 mm more thread than the nominal
  4 mm engaged (`fuse-panel-dimensions.md`). That still leaves about 3.8 mm.
- **Keep 1.6 mm.** A thicker finger would leave Economic PCBA and reduce thread engagement.

## Copper weight

- 2-layer outer copper options: 1, 2, 2.5, 3.5, 4.5 oz.[^cap][^cu]
- 2 oz raises the minimums: trace/space 0.16 mm, annular ring 0.254 mm, mask bridge 0.20 mm.[^cap]
  None of the strip's parts needs finer than that.
- **Cost:** not published. JLC says only that the price comes from the online calculator, and
  the quote API refused a request without a parsed Gerber ("PCB Abnormal pricing",
  2026-10-09). Read it from the quote once the layout exists: quote the outline at 1 oz and at 2 oz.
- **Economic PCBA with 2 oz:** the PCBA capabilities page lists no copper-weight limit for
  Economic. Its spec table restricts only layers, thickness, colour and finish.[^pcba] An older
  forum report said JLC refused 2 oz with assembly (`way-monitor-terminals-and-copper.md`).
  Unconfirmed either way: toggle 2 oz with PCBA on in the quote before relying on it.
- `design.md` already settles on 1 oz with full-width pours on both layers. 2 oz would halve the
  path resistance (0.49 to 0.25 mΩ per way, `way-monitor-terminals-and-copper.md`). It is an
  improvement, not a requirement.

## Surface finish

Both sides of each finger are clamped: the bottom onto the panel's terminal pad, the top under
the #8 screw head and lock washer. The M4 output pad is clamped by the ring terminal. So the
finish sits in three bolted current joints per way.

| Finish | Flatness (JLC) | Economic PCBA | Cost (JLC, 2026-10-09) |
|---|---|---|---|
| HASL, leaded or lead-free | "variations in coating thickness across the pad surface", about 1–40 µm[^sf] | Yes, every thickness and colour[^pcba] | Base price |
| ENIG | "flat coating of uniform thickness"; nickel 3–6 µm, gold 1 or 2 µin[^sf] | Yes, but only 2-layer, 1.6 mm, **green**[^pcba] | "approximately $20 per square meter" premium (news, 2026-07-30)[^osp]. Plus $0.8992/m² per 1 % of exposed copper above 30 % of both sides combined (1 µin gold)[^extra] |
| OSP | Flat[^osp] | **No.** Not in the Economic table[^pcba] | Free on 2+ layers[^osp] |

- **Recommendation: ENIG.** HASL leaves an uneven solder layer of up to 40 µm on the clamped
  pads. Solder under a constant clamp load creeps, so the screw loses preload over time. This
  is general bolted-joint practice, not something JLC states. ENIG is flat, with a hard nickel
  layer under the clamp. OSP is flat and free, but it is ruled out by Economic PCBA, and once
  the coating is gone the copper is bare.
- **Cost estimate, not a quote:** five strips at about 80 × 60 mm are about 0.024 m². At
  $20/m², that is about **$0.50 per order**. Even 20 points of exposed copper above the 30 %
  line adds only 0.024 × 0.8992 × 20 ≈ **$0.43**. Any per-order minimum JLC applies would only
  show in the quote. JLC also says ENIG "is no longer offered as a free surface finish option"
  on the $2 prototype price.[^osp]
- Keep exposed copper modest anyway: mask everything except the clamp pads, the solder pads and
  any test points.
- ENIG ties the board to **green** for Economic PCBA.

## Cheapest tier and Economic PCBA

| Choice | Stays on the base board price? | Stays in Economic PCBA? |
|---|---|---|
| 2 layers, FR-4, 1.6 mm, green | Yes | Yes |
| ENIG | No, small area-based fee | Yes (green, 1.6 mm only) |
| 2 oz | No, fee quote-only | Unconfirmed |
| Vias ≥ 0.3 mm hole | Yes | n/a |
| Vias 0.2–0.25 mm hole under 0.45 mm diameter, or 0.15 mm | No | n/a |
| Slots ≤ 1.0 mm wide, or a long routed path | Routing fee past 80 / 120 m/m² | n/a |
| 2.0 mm thickness, OSP, castellated holes, plated edges, V-cut | — | **No** |

Economic PCBA also needs single-sided placement, at least 0402 parts and at least 0.4 mm IC
pitch. Edge rails and fiducials are not needed.[^pcba]

## Open

- The 2 oz and ENIG uplifts in USD. Both need the real outline in the quote. Quote 1 oz HASL,
  1 oz ENIG and 2 oz ENIG, with PCBA on.
- Whether 2 oz is accepted with Economic PCBA. Same quote.
- Whether the routing fee counts the outer outline. Check the quote once the comb is drawn.

[^cap]: <https://jlcpcb.com/capabilities/pcb-capabilities>, rigid PCB section, read 2026-10-09 (no update date on the page)
[^pcba]: <https://jlcpcb.com/capabilities/pcb-assembly-capabilities>, technical capabilities and "PCB Specs for Economic PCB Assembly" tables, read 2026-10-09
[^cu]: <https://jlcpcb.com/help/article/jlcpcb-copper-weight>, last updated 2026-09-09
[^sf]: <https://jlcpcb.com/help/article/jlcpcb-surface-finish>, last updated 2026-09-09
[^extra]: <https://jlcpcb.com/help/article/in-what-cases-will-there-be-charged-extra>, last updated 2026-09-09: routing fee (section 3), small holes (section 4), ENIG area over 30 % (section 5)
[^osp]: <https://jlcpcb.com/news/jlcpcb-pcb-osp-finish>, dated 2026-07-30
[^outline]: <https://jlcpcb.com/blog/pcb-board-outline>, published 2026-05-15. A JLC blog post, not a capabilities page; the 1.0 mm minimum CNC slot on the capabilities page is consistent with it
