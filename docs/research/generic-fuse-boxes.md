# Generic blade fuse boxes

Which generic blade fuse boxes the rev A comb can fit, and the cheapest change to the comb that
widens it. Answers #2 (part of #1). Researched on 2026-10-09 from listings and datasheets on the
web. No generic box has been measured in hand.

Each figure carries its source and a confidence: **high** (a manufacturer's dimensioned drawing
or datasheet), **medium** (a listing that states the figure), **low** (inferred or remembered).

## Summary

- **Blue Sea ST Blade clones** (snap cover, screw outputs on both long sides, negative bus) are
  the only generic family close enough for the comb. Their outer sizes match the Blue Sea to
  within about 1 mm. The way pitch, inferred from those sizes, is 13.36–13.6 mm, and the outputs
  are M4 screws. Sources: Maplin SE61692 and Enerdrive EA-FB-07.
- **Generic LED boxes with a bus bar** (Jaycar SZ2031/2, Nilight-style) have a pitch of about
  16.8 mm. Push-on spade boxes have about 15–18 mm, unevenly spaced, and the Bussmann 15600 has
  15.75 mm. None of these is a tweak; they need a later strip variant.
- **The tweak:** make the fingers narrower (10.5 → about 9.5 mm) and the screw slot wider (to
  about 5.4 mm). Then a comb on 13.36 mm pitch can sit in a box that is up to about 13.6 mm,
  with the pitch error split either side of the centre. An M4 screw passes any slot that a #8
  passes.
- **What it costs the Blue Sea fit:** the head of each screw bears on a smaller area of copper,
  the strip can move about ±0.6 mm sideways until the screws are tight, and the current path is
  about 10 % narrower. None of these looks significant. It costs nothing on the BOM.
- **Before committing:** buy one 12-way clone (about $20) and measure its pitch, pocket width,
  barrier height and screw-pad height. Every geometry figure for the generic boxes below is
  inferred or missing.

## How the pitch was inferred

Few listings give the pitch. Where they don't, it is taken from the difference in length between
the 6-way and 12-way versions of a box, divided by three, since each long side gains three ways.
The method gives exactly the CAD figure when applied to Blue Sea's own sizes: 5025 is
124.31 mm long and 5026 is 164.39 mm, and (164.39 − 124.31) / 3 = 13.36 mm. On the generic
boxes, a 1 mm error in either length moves the result by about 0.3 mm, so these pitches are
**low** confidence.

## Families

### Blue Sea ST Blade (reference)

| Item | Value | Source | Conf. |
|---|---|---|---|
| Pitch | 13.36 mm | CAD, [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md); inference above agrees | High |
| Outputs | #8-32 pan screws with captive star washers, both long sides. Bus studs #10-32 | Blue Sea 5025 drawing [1] | High |
| 5025, 6-way with negative bus | 124.31 × 84.20 × 38.57 mm | Blue Sea 5025 drawing [1] | High |
| 5026, 12-way with negative bus | 164.4 × 84.2 × 38.6 mm | Reseller [2] | Medium |
| 5028, 6-way, no negative | 4⅞ × 3 5⁄16 × 1½ in | West Marine [3] | Medium |
| 5032, split bus | 164.4 × 84.2 × 38.6 mm | Nautasea [4] | Medium |
| Pocket, barriers, pad height | 11.11 mm clear, 2.25 mm barriers, pad 14.33 mm above the mounting face | CAD, [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md) | High |

The ST Blade Compact (5045 4-way, 5046 8-way) has #8-32 outputs along **one** side only. Its
drawing could not be read (bluesea.com refused the fetch), so its pitch is unknown [15].

### Blue Sea clones: screw outputs, clear cover, negative bus

The generic box most often bought for vans: Maplin SE61692, Enerdrive EA-FB-07, and very likely
the box behind many Nilight, MICTUNING and WUPP "with negative bus and cover" listings, which
give no drawings.

| Item | Value | Source | Conf. |
|---|---|---|---|
| 6-way | 124.5 × 84.3 × 38.0 mm | Maplin [5] | Medium |
| 12-way | 165.3 × 84.3 × 38.0 mm; Enerdrive gives 164 × 84 × 39 mm | Maplin [6], Enerdrive [7] | Medium |
| Pitch | About 13.6 mm from the Maplin lengths; 13.36 mm if it is a straight copy, which the Enerdrive length suggests | Inferred | Low |
| Outputs | M4 screws, both long sides. M5 bus studs | Maplin [5][6] | Medium |
| Pocket width, barrier height, pad height | Not found | — | — |
| Price | About $20–25 (£17.41) for the 12-way | Maplin [6] | Medium |

The obsolete Littelfuse 880066 (AFC series, 12-way with negative bus) is listed at 164 mm long,
which suggests the same body [8]. Low confidence.

### LED boxes with a bus bar

Two rows of six fuses with LEDs between them, outputs on both long sides, bus studs at one end.
Jaycar/Powertech SZ2031 and SZ2032, Maplin SE60702, Nilight-style LED listings.

| Item | Value | Source | Conf. |
|---|---|---|---|
| 6-way | 87.75 × 85 × 36.5 mm (Jaycar: 88 × 85 × 37) | Listings [9][10] | Medium |
| 12-way | 138.25 × 85 × 36.5 mm (Maplin: 139.7 × 85.5 × 36.6) | Listings [9][11] | Medium |
| Pitch | About 16.8 mm | Inferred | Low |
| Outputs | M4 studs (some listings say screws). M5 main stud; Nilight quotes M6 | Wiltronics [10], Nilight [12] | Medium |
| Price | About $15–20 | Listings | Medium |

### Push-on spade boxes

Cheap clip-together boxes with 6.3 mm quick-connect spades at both ends of each fuse.

| Item | Value | Source | Conf. |
|---|---|---|---|
| 8-way | 153.3 × 52.8 × 41.5 mm with lid; fixing holes about 144 mm apart | Maplin dimensioned datasheet [13] | High for this part |
| Pitch | Uneven: about 15.05 mm within a pair, 18.0 mm between pairs | Same drawing, from its spans | Medium |
| Outputs | 6.3 mm spades along both long sides | Same | Medium |
| Price | About $9 | Maplin [13] | Medium |

There is no screw to clamp a finger under, so the comb cannot fit these at all.

### Bussmann/Eaton 15600 and 15602

| Item | Value | Source | Conf. |
|---|---|---|---|
| Pitch | 0.62 in (15.75 mm) | Bussmann datasheet BIF 2064 [14] | High |
| Outputs | 0.250 × 0.032 in quick-connect spades along both long sides. #10-32 input stud. No cover | Same | High |
| Size | 85.59 mm wide, base 20.32 mm tall; 10-way 3.75 in long | Same, and a reseller | High / medium |

### Ancor

No Ancor blade box with a dimensioned drawing was found.

## The tweak and what it costs

The rev A comb has fingers about 10.5 mm wide on 13.36 mm pitch. Each has a slot open to its
tip for a #8 screw (design.md). If the strip is centred on a 6-way side of a box with a 13.6 mm
pitch, the outer fingers are off by 2.5 × 0.24 = 0.6 mm. That cannot be absorbed at present: the
Blue Sea pocket leaves only about 0.3 mm each side of a 10.5 mm finger, and a slot sized for the
screw leaves almost none.

| Change | From | To | Why |
|---|---|---|---|
| Finger width | About 10.5 mm | About 9.5 mm | Leaves about 0.8 mm each side in the Blue Sea pocket, enough for the 0.6 mm offset if the clone pocket is no narrower |
| Slot width | About #8 clearance (4.2–4.5 mm) | About 5.4 mm | Lets an outer finger sit 0.6 mm off the screw. M4 (4.0 mm) is smaller than #8 (4.17 mm), so it passes any slot a #8 passes |

What this costs the Blue Sea fit:

- **Clamping area.** The Ø8.18 mm pan head and Ø8.13 mm washer bear on a narrower band of copper
  either side of a wider slot. Each side of the slot shrinks from about 3 mm to 2 mm wide. The
  ring terminal under the head still spreads the load. Use a flat washer if the contact proves
  poor.
- **Location.** The strip can shift about ±0.6 mm sideways until the screws are torqued. That's
  harmless, but the strip is no longer located by the slots alone.
- **Copper.** The current path at the finger becomes about 10 % narrower, over a few
  millimetres. At 30 A on a path about 20 mm long, that's negligible.
- **Cost.** None: it's an outline change.

Unknowns that could still sink the clone fit, and which need a box in hand:

- **Pocket width.** If the clone's pocket is narrower than about 11 mm, the 9.5 mm finger has
  less room than calculated.
- **Pad height and barrier height.** The finger enters at pad height, so a different pad height
  moves the whole strip up or down. That is fine if the strip is held only by the screws, but
  not if anything else on it fixes its height.
- **Screw length.** M4 screws in a cheap box may be shorter than Blue Sea's #8. 1.6 mm of board
  plus a ring terminal must still leave enough thread engaged.
- **The cover.** Whether the clone's cover clears the fingers where they pass out of the side.

## Sources

1. Blue Sea 5025 dimensioned drawing, reseller copy:
   https://www.solar4rvs.com.au/products/blue-sea-blade-fuse-block-holder-6-circuits-with-n
2. https://nautasea.com/?p=7514
3. https://www.westmarine.com/blue-sea-systems-st-blade-fuse-block-6-circuits-with-cover-6557466.html
4. https://nautasea.com/product/blue-sea-systems-5032-bss
5. https://pro.maplin.co.uk/products/6-way-automotive-standard-blade-fuse-box-with-negative-busbar-100a
6. https://pro.maplin.co.uk/products/12-way-automotive-standard-blade-fuse-box-with-negative-busbar-100a
7. https://www.mygenerator.com.au/product/enerdrive-fuse-block-12-circuit-with-negative-bus-and-cover
8. https://littelfuse.com/products/dc-power-distribution-modules/unsealed-pdm/afc.aspx
9. https://ifsworld.co.za/product/fuse-box-1in-12o-negative-bus-led-indicator and
   https://www.waerchzueg.ch/en/products/12-pole-fuse-box-holder-with-led-indicator-lamp-incl-negative-distributor-up-to-32v
10. https://www.wiltronics.com.au/product/74203/6-way-fuse-block-with-bus-bar/ and
    https://jaycar.com.au/12-way-fuse-block-with-bus-bar/p/SZ2032
11. https://pro.maplin.co.uk/products/12-way-standard-blade-fuse-fuse-box-with-negative-busbar-32vdc-100a
12. https://ibspot.com/products/nilight-12-way-fuse-block-with-negative-bus-12v-blade-fuse-holder-atc-ato
13. Maplin 8-way spade box datasheet: https://cdn.shopify.com/s/files/1/0695/1347/8453/files/483470.pdf
14. Bussmann 15600 datasheet (BIF 2064): https://cdn.components.ru/media/PDF/571043.pdf
15. https://bluesea.com/products/5045 (drawing not read: the site refused the fetch)
