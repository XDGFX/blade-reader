---
date: 2026-10-10
issue: 46
map: 40
---

# JLC limits for the yoke

Answers XDGFX/blade-reader#46: will JLCPCB make and assemble a U-shaped board of about
135 × 125 mm, with two arms about 100 mm long, as a single board on Economic PCBA, and what does
the shape cost against rev A's strip.

*Yoke*, *arm* and *chin* are the working words of the map (XDGFX/blade-reader#40) and are not in
the glossary yet. Everything here was read from JLC's own pages on **2026-10-10**; help articles
are marked "Last updated on Sep 09, 2026" unless noted. Prices are USD. This note adds to
[`jlc-panelised-assembly.md`](jlc-panelised-assembly.md) and to the fab rules note for
XDGFX/blade-reader#3 (on the `research/jlc-fab-rules` branch), and does not repeat their tables.

## Answer

**Yes, on paper, with conditions.** Nothing JLC publishes rules the yoke out of Economic PCBA as
a single board, and nothing JLC publishes mentions a U-shaped or concave outline at all. So the
yes rests on size, thickness, colour and finish limits that the yoke meets, and on JLC's
silence about shape. The engineer's review after ordering is the only real confirmation.

- **Size:** Economic PCBA takes a single board from 10 × 10 to 470 × 500 mm. The 250 × 250 mm
  limit applies to panels only.[^pcba] The yoke is far inside both.
- **Rails, fiducials, panel:** "Not necessary" on Economic. Tooling holes are "a must", and JLC
  adds them if the file has none.[^pcba][^tool] No fee is published for either.
- **Black, lead-free HASL, 1.6 mm, 2 layers:** stays on Economic, 2–50 assembled. The table has
  no size condition.[^pcba]
- **Price:** JLC charges the bounding rectangle. Five bare yokes are **$13.70** against
  **$7.20** for five strips, so $6.50 more per order, and level per fuse panel ($2.74 against
  $2.88 for two strips).[^calc] The one size step, the special price up to 102 × 102 mm, is
  already lost by rev A's 104 mm strip.[^extra] Assembly fees do not change with size or shape
  below 650 cm²; the yoke's rectangle is 169 cm².[^price] See [Price effect](#price-effect).
- **Warp:** JLC publishes no warp tolerance and no guidance on long arms. A break-off bar across
  the open end is allowed on Economic only with mouse bites, and whether it changes the price
  is not published. See [Warp and the open end](#warp-and-the-open-end).

## What the size and shape limits say

| Limit | Economic PCBA | Standard PCBA | Yoke, 135 × 125 mm |
|---|---|---|---|
| Single board size | 10 × 10 to 470 × 500 mm | 70 × 70 to 460 × 500 mm | Inside both |
| Panel size | 10 × 10 to 250 × 250 mm | 70 × 70 to 250 × 250 mm | Not a panel |
| Delivery format | Single PCB, panel with mouse bites | Single PCB, panel with mouse bites or V-cut | Single PCB |
| Edge rails | Not necessary | Necessary, at least 5 mm | None needed on Economic |
| Fiducials | Not necessary | Necessary | None needed on Economic |
| Thickness | 0.8–1.6 mm | No limit | 1.6 mm |
| 1.6 mm black | Lead-free or leaded HASL, 2–50 assembled | Any finish | Lead-free HASL, 2 assembled |
| Assembled sides | One | Either or both | One |

All rows are from JLC's PCBA capabilities page.[^pcba] The page has no update date.

- **Bare board:** 2-layer FR-4 runs from 3 × 3 to 670 × 600 mm. Routed outline tolerance is
  ±0.2 mm.[^cap] Across the yoke that tolerance applies to the spacing between the two rows of
  holes too: drilled holes are placed more accurately than the routed edge, so the 84.2 mm row
  spacing is set by drilling, not routing. That is inference from the two tolerances, not a JLC
  statement.
- **The open middle is outline, not a cut-out.** The U is open at one end, so the gap between
  the arms is part of the outer outline. JLC's rules for slots and routed edges are the ones
  that apply: 0.2 mm copper to a routed edge, rounded inside corners, and everything on the
  outline layer.[^cap][^order] JLC's outline guide says irregular perimeters "increase CNC
  routing time and scrap rates", and names no limit.[^outline]
- **How Economic boards are run.** JLC says "for economic assembly, as boards will be panelised
  and put into production at one time, so we need to separate the boards after assembly", with
  "a tolerance of about 0.2mm when routing the boards for depanelizing".[^faq2] So JLC holds
  the yoke in its own production panel through paste, placement and reflow, and routes it free
  afterwards. That is why Economic needs no rails from the customer. It also means the arms
  are not hanging free in the oven. How JLC tabs a U into its panel is not published.
- **Standard PCBA** would take the yoke as a single board without a panel, since it is over
  70 × 70 mm. That removes the 3-up panel that black ENIG needed for the strip
  (XDGFX/blade-reader#24), though the Standard fees remain. Standard needs 5 mm rails and
  fiducials; JLC's terms say it picks an edge-rail method itself where a Standard board has
  none.[^tc]

## Rules the outline must obey

Rules 1–8 come from JLC's pages. Rules 9–11 are precautions drawn from them, and are marked.

| # | Rule | Value | Source |
|---|---|---|---|
| 1 | Bounding rectangle | Within 470 × 500 mm for Economic. Keep it within 250 × 250 mm so a panel stays possible | [^pcba] |
| 2 | Thickness, layers, colour, finish | 1.6 mm, 2 layers, black, HASL. 2.0 mm or black ENIG leaves Economic | [^pcba] |
| 3 | All parts on one face | Economic is single-sided | [^pcba] |
| 4 | Inside corners | Rounded. R1.0 at finger roots as on rev A, and at the two corners where the arms meet the chin. "Rectangular holes and slots without rounded corners are not supported" | [^cap] [^outline] |
| 5 | Copper to routed edge | 0.2 mm minimum, 0.3 mm used. JLC asks 0.3 mm on Economic for traces and parts, for its depanelling cut | [^cap] [^faq2] |
| 6 | Part body to board edge | 2.5 mm in the assembly terms. Rev A's reading of this (it is the conveyor edge) carries over; an arm 15 mm deep has two such edges 15 mm apart | [^tc] |
| 7 | Tooling holes | Two or three Ø1.152 mm non-plated holes, 0.148 mm mask expansion, "in opposite corners of the PCB and as far apart from one another as practical". JLC adds its own if they are missing or wrong, wherever it chooses | [^tool] |
| 8 | Outline drawing | One closed shape, with slots and cut-outs on the outline layer | [^order] |
| 9 | Tooling hole positions (precaution) | Put them in ourselves: one in a chin corner and one at the far arm's tip, clear of every ring keepout and of the clamp pads. On a U, JLC's default "opposite corners" could land in a ring keepout | Inference from [^tool] |
| 10 | Copper balance (precaution) | Keep the two faces' copper within about 30 % of each other on each arm. JLC's terms name copper balance as what sets warp in reflow | [^tc] [^warp] |
| 11 | Break-off bar, if used (precaution) | Mouse bites, not V-cut: holes 0.5–0.8 mm, tab at least 5 mm wide, 1.6 or 2 mm gap to the board. No copper, silk or mask difference on the bar | [^cap] [^panel] |

Nothing in JLC's pages gives a minimum width for a narrow section of board, a maximum length
for an unsupported arm, or a ratio between them.

## Price effect

### Bare board

- **How size is charged.** JLC's help pages do not say whether it charges the bounding
  rectangle or the true area. Its calculator charges the rectangle: see
  [Calculator prices](#calculator-prices).
- **The one published size step:** "For a single PCB that is within or equal to 102*102mm,
  there is a special price charged only."[^extra] Rev A's strip is 104.06 × 38.5 mm with its
  fingers (`board/lib/outline.tsx`), so it is already 2 mm over on its long side. A panelised
  board also loses the special price.[^extra]
- **Large board fees** start at 650 cm² or a 600 mm side. Neither applies.[^extra]
- **Routing fee.** Charged when the slot path reaches 120 m per m² of board, for slots over
  1.0 mm wide.[^extra] The yoke has about 1.1 m of routed edge (520 mm outside, 280 mm round the
  inside of the U, 310 mm of finger sides). That is about 65 m/m² on the 169 cm² bounding
  rectangle and about 120 m/m² on the roughly 92 cm² of real board. JLC does not say which
  area it uses or whether the outer outline counts as slot. Rev A's strip comes out at about
  100 m/m² the same way, so rev A's quote answers this for both.

### Calculator prices

JLC's price calculator answers without a login and without a Gerber, from typed dimensions.[^calc]
Read on 2026-10-10 for 5 boards, 2 layers, FR-4, 1.6 mm, 1 oz, black mask, white silk,
lead-free HASL, single board, one design. USD, before shipping, tax and assembly.

| Size, mm | Engineering | Board | Finish | **Total, 5 boards** | Note |
|---|---|---|---|---|---|
| 104 × 25.5 | 4.00 | 1.30 | 1.20 | **6.50** | Rev A's body alone, as the ticket gave it |
| 104 × 38.5 | 4.00 | 2.00 | 1.20 | **7.20** | Rev A's strip with its fingers |
| 100 × 100 | special | special | 1.30 | **5.30** | Special price |
| 102 × 102 | special | special | 1.30 | **5.30** | Special price, the last size that gets it |
| 103 × 103 | 4.00 | 5.20 | 1.30 | **10.50** | |
| 135 × 100 | 4.00 | 6.50 | 1.40 | **11.90** | |
| 135 × 125 | 4.00 | 8.20 | 1.50 | **13.70** | The yoke |
| 150 × 125 | 4.00 | 9.10 | 1.50 | **14.60** | |
| 135 × 125, 10 boards | 4.00 | 16.30 | 1.90 | **22.20** | |

- **The price follows length × width.** Outside the special price, the board fee is about
  $0.049 per cm² of the typed rectangle for 5 boards, at every size tried. The calculator takes
  no outline or area, so the open middle of the U is paid for. With a Gerber loaded JLC reads
  the size from the file; that it then takes the outline's extents, not its area, is inference.
- **The only step is at 102 × 102 mm.** Past it the price jumps by $5.20 and then climbs
  smoothly. Rev A's strip is already past it, at 104 mm long, so the yoke crosses no step the
  strip has not crossed.
- **Black costs nothing.** Green gave the same totals at 100 × 100 and 135 × 125. Black's
  default build time is 3 days against green's 2.
- **Yoke against strips:** 5 yokes cost **$13.70** against **$7.20** for 5 strips, $6.50 more
  per order. Per fuse panel it is level: one yoke is $2.74, two strips are $2.88. Five yokes
  cover five panels; five strips cover two and a half.
- **Weight:** the calculator puts 5 bare yokes at 420 g on the full rectangle, against 189 g
  for 5 strips. The real U is a little over half its rectangle. Both stay in the 0.5 kg
  shipping band of `jlc-panelised-assembly.md` ($6.10–9.62 to Australia).

The column names are a reading of the calculator's reply, whose fields are not labelled in
English: the three add up to the total in every row. The figures are for a plain rectangle.
They leave out anything JLC's review adds for the outline, the routing fee above all.

### Assembly

No Economic assembly fee depends on board size or shape below 650 cm² ("Large Size", $57.46,
"charged when PCB area > 650 cm²").[^price] Setup $8.18, stencil $1.53 with no size steps, and
$3.07 per extended part type are as in `jlc-panelised-assembly.md`. The panel fee of $8.21
applies only "when the number of panelized designs > 1", so a single yoke does not pay it.

The yoke is one design against one strip design, so both pay one setup and one stencil. The
yoke's saving is in parts, which XDGFX/blade-reader#40's cost ticket prices: one module and one
supply for 12 ways, and each extended part type still charged once.

Per 12-way panel the comparison is one yoke against two strips. Rev A's order of 5 strips with 4
assembled fits two panels. A yoke order of 5 with 2 assembled also fits two panels, with three
bare boards spare.

## Warp and the open end

- **JLC states no warp tolerance.** The capabilities page has none.[^cap] JLC's blog cites the
  IPC figure of 0.75 % for boards with surface-mount parts, measured as the highest point off a
  flat plate over the diagonal, and claims "standard boards routinely achieve ≤0.5% warpage";
  it calls neither a guarantee.[^warp] The IPC document itself was not read: it is not free.
- **What 0.75 % means here.** The yoke's diagonal is 184 mm, so 0.75 % is 1.4 mm and 0.5 % is
  0.9 mm. Rev A's strip, at 111 mm, gets 0.8 mm and 0.6 mm. The method assumes a rectangle; JLC
  says nothing about how it would measure a U.
- **Who carries the risk.** JLC's assembly terms: "Board warping may occur during reflow
  processing", and it depends on the design's copper balance.[^tc] No remedy is tied to it.
- **Long arms.** JLC gives no rule. Its one relevant article is about V-cut panels: where
  milling leaves an area "suspended from one end", it deforms in the V-cut machine, and the fix
  shown is "extra process borders for support".[^irregular] That describes a customer-made
  panel under V-cut, not a single routed board.
- **In use** the yoke is pulled flat by 12 screws onto the panel's pads, so warp of a
  millimetre matters less than it does for a free-standing board. The exposure is before that:
  in the post, and when the board is handled by one arm.

### A break-off bar across the open end

| Question | Finding |
|---|---|
| Allowed on a single-board Economic order? | With mouse bites, yes: Economic's delivery formats are "Single PCB, Panel with mouse bites". **V-cut is not supported in Economic assembly**[^pcba][^panel] |
| Does it count as a second design? | Not by JLC's definition, which turns on boards whose "traces/silkscreen/solder mask" differ. A bare bar has none. JLC's page does not mention rails, frames or waste pieces, so this is a reading, not a statement[^dd] |
| Does it cost more? | Not published. No fee names it. It adds about 0.2 m of routed path, which pushes the routing-fee figure up. An engineer could treat the file as "Panel by Customer"; with one design that carries no panel fee on the assembly side[^price] |
| Does it help? | It ties the arm tips together through shipping and handling, and holds the row spacing until the board is fitted. In JLC's own process the arms are already held by JLC's panel[^faq2] |
| Who removes it? | The customer. JLC charges "additional post-processing fees" to remove edge rails, amount not published[^rails] |

The bar is a design choice for the map's stiffness question, not something JLC asks for. The
cheap test is to order without one and look at the five boards.

## Not confirmed

- Whether JLC's engineer accepts a U on Economic without asking for a bar or a panel. No page
  says yes or no. Only an order, or a question to JLC support with the outline attached,
  settles it.
- Whether the routing fee applies: which area JLC divides the routed path by, and whether the
  outer outline counts. Its fee table is an image and was not read.
- That a loaded Gerber is priced on its outline's extents, as typed dimensions are.
- The order form's own wording on rails and tooling holes for a single irregular board. The
  form's scripts were not read this time; `jlc-panelised-assembly.md` has what was read on
  2026-10-09.
- Any fee for a mouse-bite bar on a single-board order.
- JLC's warp tolerance for a 1.6 mm, 2-layer board, and how it is measured on a U.
- Where JLC puts tooling holes when it adds its own to a U.

[^pcba]: <https://jlcpcb.com/capabilities/pcb-assembly-capabilities>, capabilities table and "PCB Specs for Economic PCB Assembly", read 2026-10-10 (no update date on the page)
[^cap]: <https://jlcpcb.com/capabilities/pcb-capabilities>, read 2026-10-10 (no update date on the page)
[^tool]: <https://jlcpcb.com/help/article/How-to-add-tooling-holes-for-PCB-assembly-order>
[^extra]: <https://jlcpcb.com/help/article/in-what-cases-will-there-be-charged-extra>. The fee tables for the routing fee and small boards are images and were not read
[^price]: <https://jlcpcb.com/help/article/pcb-assembly-price>
[^calc]: `POST https://cart.jlcpcb.com/api/overseas-shop-cart/v1/shoppingCart/calculationGoodsCostsNew`, the endpoint behind the price shown at <https://cart.jlcpcb.com/quote>, called without a login on 2026-10-10 with typed length and width
[^tc]: <https://jlcpcb.com/help/article/Terms-and-Conditions-of-JLCPCB-Assembly-Service>
[^faq2]: <https://jlcpcb.com/help/article/pcb-assembly-faqs-part-2>, "Reminder for economic assembly design"
[^order]: <https://jlcpcb.com/help/article/instructions-for-ordering>
[^panel]: <https://jlcpcb.com/help/article/pcb-panelization>
[^rails]: <https://jlcpcb.com/help/article/how-to-add-edge-rails-fiducials-for-pcb-assembly-order>
[^dd]: <https://jlcpcb.com/help/article/different-design-in-your-pcb-files>
[^outline]: <https://jlcpcb.com/blog/pcb-board-outline>, published 2026-05-15, updated 2026-09-09. A JLC blog post, not a capabilities page
[^warp]: <https://jlcpcb.com/blog/pcb-warpage-control>, published 2026-03-12. A JLC blog post; its IPC figures are JLC's citation and its 0.5 % is a claim, not a tolerance
[^irregular]: <https://jlcpcb.com/blog/panelization-with-issues-irregular-shapes>, published 2024-03-26. A JLC blog post
