# ST Blade way numbering and orientation

Which long side of the Blue Sea ST Blade 12-way carries the odd ways, which pair is at the
positive end, and which way up Blue Sea means it to be fitted. For the yoke's silk and its
firmware names. Answers [#72](https://github.com/XDGFX/blade-reader/issues/72). Checked
2026-10-11.

## Answer

Seen from the front with the positive end down:

| | Left | Right |
|---|---|---|
| Negative end (top) | 1 | 2 |
| | 3 | 4 |
| | 5 | 6 |
| | 7 | 8 |
| | 9 | 10 |
| Positive end (bottom) | 11 | 12 |

- **Odd ways are on the left, even ways on the right.**
- **Ways 11–12 are the pair nearest the positive end**, and ways 1–2 the pair nearest the
  negative bus. This confirms the axis note in
  [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md).
- On the yoke, the chin is therefore beside ways 11–12, and the numbers count up towards the chin
  on both arms: 1, 3, 5, 7, 9, 11 on the left arm and 2, 4, 6, 8, 10, 12 on the right.

## Where the numbers are

- **Moulded into the base.** Raised numerals 1–12 sit on the centre rib between the two columns of
  fuses: each odd numeral just right of its left-hand fuse slot, each even numeral just left of its
  right-hand slot and a little lower. Read from Blue Sea's own photo of the 5031, the 5026 without
  its cover [1]. The same numerals 1, 3, 5, 7 and 11 are legible on the left column in Blue Sea's
  installed photo of the 5026 [2].
- **Printed on the wiring diagram** in the same places, with the same values [3].
- **The numerals read upright with the positive end down**, as do the moulded Blue Sea logo and the
  moulded + and − marks either side of each stud [1].
- **The cover carries no numbers.** It has twelve label recesses over the ways and one larger
  recess over the negative bus; Blue Sea's photo shows them filled with name labels ("GPS",
  "RADAR", "DC SUB PANEL") [4]. The panel ships with "20 write-on circuit labels" and the recesses
  take Blue Sea's Small Format Labels [5][6]. The label sheet itself was not read, so whether any
  of its labels are numbers is **[unsourced]**.
- The numerals are on the rib between the fuses, so a fitted yoke does not cover them. With the
  cover on they are seen only through the clear cover, behind the labels.

## Orientation

- **Blue Sea states no mounting orientation.** The wiring diagram [3], the product page [5] and
  the sales sheet [6] give the mounting screw size and nothing about which way up. The dimensioned
  drawing and any installation sheet beyond the wiring diagram were not reachable (see Not
  settled).
- **Everything Blue Sea shows is positive end down.** The wiring diagram draws the panel with the
  negative bus at the top and the + stud at the bottom [3]. The product photos stand it the same
  way [1][4]. The installed photo has it on a vertical surface, negative bus up, feed cable entering
  the + stud at the bottom [2]. The moulded text reads upright only that way.
- So positive end down is the shown and implied orientation, not a stated requirement. The map's
  "the panel is fitted positive end down" agrees with it.
- The wiring diagram also shows the feed lug and the negative lug swung to either side or straight
  off the end, with arrows, and asks for a main fuse of 125 A at most ahead of the panel [3].

## Clones

- **The generic LED panel has no way numbers that its sellers show.** Kohree's and Nilight's
  product photos show a centre rib taken up by two columns of LEDs, no numerals, and a cover with
  name labels only [7][8]. OptiFuse's drawing of its own LED panel shows none either [9]. These are
  photos and a drawing at catalogue resolution: small moulded numerals could be missed.
- These panels are drawn and photographed the same way up, negative bus at the top and + stud at
  the bottom [7][8][9].
- **The look-alike of the ST Blade itself** (same body, no LEDs), the clone the fit check uses:
  whether its moulding copies the numerals is **[unsourced]**. No first-party page for one was
  found.
- An unnumbered clone has no numbering to disagree with. Fitting the yoke positive end down gives
  it the Blue Sea's numbering by position.

## Not settled

- **Blue Sea's site refused direct requests** (HTTP 403), and the Wayback Machine was offline. The
  product page was read through a reader proxy; the photos and PDFs came from Blue Sea's own CDN.
  The 5026 dimensioned drawing and the label sheet were not obtained.
- **The 5025 and 5029 were not checked separately.** The 5026/5031 diagram and photos are the
  12-way with negative bus, which is the panel the yoke fits. That the 5029/5034 (12-way, no
  negative bus) and the 6-way models number the same way is **[unsourced]**.

A look at the physical panel and the clone would settle:

1. That the numerals on the panel in hand match the table above (a 10-second check, cover off).
2. Whether the clone has numerals at all, and if so whether 1 is at its negative end on the left.
3. What is on Blue Sea's label sheet.

## Sources

All checked 2026-10-11.

1. Blue Sea, product photo of the 5031:
   https://dh778tpvmt77t.cloudfront.net/images/products/5031.jpg
2. Blue Sea, installed photo on the 5026 page:
   https://dh778tpvmt77t.cloudfront.net/images/products/5026_install.jpg
3. Blue Sea, "ST Blade Fuse Block, 12 Circuits with Negative Bus, PN 5026 / PN 5031, Wiring
   Diagram" (PDF dated 2011-04-18), listed on Blue Sea's instructions page:
   https://d2pyqm2yd3fw2i.cloudfront.net/files/resources/instructions/Wiring-Diagram-5026_5031.pdf
4. Blue Sea, product photo of the 5026 with its cover:
   https://dh778tpvmt77t.cloudfront.net/images/products/5026.jpg
5. Blue Sea, 5026 product page, read through r.jina.ai:
   https://www.bluesea.com/products/5026/ST_Blade_Fuse_Block_-_12_Circuits_with_Negative_Bus_and_Cover
6. Blue Sea, ST Blade sales sheet (PDF dated 2007-02-07):
   https://d2pyqm2yd3fw2i.cloudfront.net/files/resources/sales_sheets/ST_Blade_Fuse_Blocks.pdf
7. Kohree 12-way, main product photo:
   https://www.kohree.com/products/12v-fuse-block-12-way
8. Nilight 12-way, main product photo:
   https://www.nilight.com/products/nilight-12-way-blade-fuse-block-12-circuits-with-negative-bus-fuse-box-holder-with-led-indicator-ato-atc-fuse-panel-waterproof-cover-for-12v-automotive-cars-marine-boats-rvs-trailers-2-years-warranty
9. OptiFuse BLR-I-1212-G datasheet, rev D 05/2025:
   https://www.optifuse.com/optifuse_ecommerce_tools/datasheets/BLR-I-1212-G.pdf
