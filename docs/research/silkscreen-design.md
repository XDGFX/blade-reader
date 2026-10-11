# Silkscreen design for the strip

Answers [What makes a strip's silkscreen beautiful, and what can JLC print?](https://github.com/XDGFX/blade-reader/issues/23).
Read 2026-10-09. Lines marked **[unsourced]** come from general knowledge, not a page read.

## Summary

- **Look:** the boards people admire share a few moves. They use one stroke font at two or three
  sizes, align labels to a grid, keep large empty areas, and use exposed gold as a deliberate
  accent. They add one confident playful idea rather than scattered decoration. Matte or gloss
  black with white silk and an ENIG wordmark is the classic restrained version.
- **Colour at JLC:** under Economic PCBA, a 2-layer 1.6 mm board gets ENIG **only in green**. Black,
  blue and purple are HASL only. Black ENIG needs Standard PCBA, which costs about $45–61 more
  per order and needs a panel (70 × 70 mm minimum). JLC lists only gloss "Black", not matte.
  Black costs nothing extra on a bare-board order and adds 2 days.
- **Gold artwork is cheap:** JLC exposes copper wherever the mask has an opening, and it gets the
  surface finish. It costs no more until exposed gold passes 30 % of both faces combined.
- **tscircuit 0.0.2786:** it can draw everything needed on the bottom layer (text, paths, rects,
  circles, SVG and mask openings). Its font has no `·`, `°`, `:` or `%`, and a missing glyph
  disappears silently.
- **Torque:** the panel's 2.03 N·m on the way screw puts about 55–110 MPa on the finger, well under
  FR-4's flatwise compressive strength. A printed way-screw figure is safe but just repeats the
  panel's own spec. The figure the strip owns is the output nut torque, 1.0–1.2 N·m.

## Exemplars and the moves that make them work

- **Boldport (Saar Drimer):** "aesthetics, symmetry and haptics are at least as important as
  function". He moved the fab's production number off the visible face, used two mask colours on
  one board, and used clear mask over copper.
  <https://www.eurocircuits.com/blog/why-working-together-works-for-us-both/>,
  <https://boldport.com/pcbmode>
- **Boldport Nutclough:** each of copper, silk and mask is present or absent, and the combinations
  give shading and depth. <https://hackaday.com/tag/calrec/>
- **Teenage Engineering Pocket Operators:** the bare board is the whole face, with illustrated
  characters in silk, large product numbers and gold pads used as buttons. [unsourced]
- **SparkFun:** mask over copper reads lighter than mask over bare FR-4, so a board has two mask
  tones plus exposed metal. <https://news.sparkfun.com/1176>
- **Trammell Hudson:** design in exactly four colours (FR-4, copper, mask, silk) and keep features
  bold, because fine detail disappears. Silk sits on mask, never on bare copper.
  <https://trmm.net/PCB_art>
- **Adafruit badge guide:** ENIG as the gold accent, a silk outline as a frame, and features of at
  least 5 mm.
  <https://learn.adafruit.com/making-wearable-badge-art-with-printed-circuit-boards>
- **KiCad conventions:** one stroke font throughout, with logo typefaces brought in as polygons.
  <https://klc.kicad.org/general/g1/g1.11.html>
- **Apple, Raspberry Pi:** minimal legends, designators kept in the fab drawing, and a single
  credits line such as "Raspberry Pi 4 Model B © 2018". [unsourced]

**Moves for the strip:**

1. **One type system:** a single stroke font in two or three sizes, with labels in all caps. Only
   the wordmark is a polygon (SVG).
2. **A shared grid and baselines:** align text to the comb's edges and to the way pitch.
3. **Hairline rules** that echo the outline or group content.
4. **Gold as the one accent:** mask openings for the wordmark, and nowhere else at random.
5. **Negative space:** gather labels into blocks.
6. **One credits line:** name, revision, date and licence.
7. **One playful element**, if any.

## What JLC can make

All figures were read 2026-10-09.

**Mask colours.** The capabilities page offers green, purple, red, yellow, blue, white and black.
Only gloss "Black" appears: no JLC page offers matte, and a JLC rep said in 2019 that it wasn't
offered (medium confidence). Every colour except green adds 2 days, and colour itself costs
nothing extra on most orders. Silk is white, except on white mask, where it is black.
<https://jlcpcb.com/capabilities/pcb-capabilities>, <https://cart.jlcpcb.com/quote>,
<https://jlcpcb.com/blog/pcb-solder-mask-colors-performance>,
<https://easyeda.com/forum/topic/Matte-black-soldermask-06523918727340fb9a0c27a7806ec749>

**Economic PCBA, 2-layer, 1.6 mm:** "Green | HASL / ENIG" and "Black | HASL". Blue and purple are
HASL only; red and white are leaded HASL only. Standard PCBA allows any colour and finish, but its
smallest board is 70 × 70 mm.
<https://jlcpcb.com/capabilities/pcb-assembly-capabilities>

**Fixed fees per order** (from <https://jlcpcb.com/help/article/pcb-assembly-price>, updated
2026-09-09). This assumes 6 extended part types and about 25 types in total:

| Option | Setup | Stencil | Feeders | Other | Fixed total |
|---|---|---|---|---|---|
| Green, ENIG, Economic | $8.18 | $1.53 | $18.42 (6 × $3.07) | ENIG ≈ $0.50 | ≈ $28.60 |
| Black, HASL, Economic | $8.18 | $1.53 | $18.42 | none | ≈ $28.10 |
| Black, ENIG, Standard | $25.56 | $8.21 | $38.25 (25 × $1.53) | packing $0.50, ENIG ≈ $0.50, fixture $16.42 if charged, panel | ≈ $73–90 + panel |

The per-joint fee is $0.0016 under both. Whether every Standard order pays the fixture fee is
unclear.

**Silkscreen rules:**
- Line width at least 0.15 mm (0.2 mm recommended).
- Text height at least 0.8 mm (1.0 mm recommended).
- Hollow text needs a stroke of at least 0.2 mm and a height of at least 1.5 mm.
- Keep at least 0.15 mm from pads (0.25 mm recommended).
- Silk on exposed copper is removed.

<https://jlcpcb.com/blog/character-design-specifications>

**Mask openings as artwork.** Openings over copper that isn't a pad are allowed, and the exposed
copper gets the finish. The minimum mask bridge is 0.10 mm on green and 0.13 mm on black, at 1 oz.
Expansion defaults to 0.05 mm a side. ENIG over 30 % of the area (both faces combined) costs
$0.8992/m² for each extra 1 %.
<https://jlcpcb.com/blog/basic-design-of-solder-mask>,
<https://jlcpcb.com/help/article/in-what-cases-will-there-be-charged-extra>

**Multi-colour UV silkscreen.** From $6.71, plus 1 day, artwork as PNG or JPG through EasyEDA. No
page says whether it can be combined with PCBA, and the Economic PCBA page doesn't mention it.
<https://jlcpcb.com/news/multi-color-silkscreen-pcb>

**Order number.** JLC adds no mark by default, and removing one is free. JLC's help page still
describes "Order Number (Specify Position)" with a `JLCJLCJLCJLC` placeholder, but the order form on
2026-10-12 offered only Remove Mark or a 2D barcode, with Remove Mark fixed.
<https://jlcpcb.com/help/article/How-to-mark-on-PCB>

## Authoring in tscircuit 0.0.2786

Sources are under `board/node_modules/`: `@tscircuit/props`, `@tscircuit/core` and
circuit-json-to-gerber 0.0.112, which is bundled in `@tscircuit/cli`.

- **Elements:** `silkscreentext`, `silkscreenpath`, `silkscreenline`, `silkscreenrect`,
  `silkscreencircle` and `silkscreengraphic` all take `layer="bottom"` at board level. Bottom text
  is mirrored in the Gerber by default.
- **Text:**
  - Props: `fontSize` (default 1 mm), nine-point `anchorAlignment`, `pcbRotation`, and
    `isKnockout` with `knockoutPadding`.
  - The stroke is fixed at 0.09 × fontSize. That reaches JLC's 0.15 mm line minimum at about
    1.7 mm, and 0.2 mm at about 2.2 mm.
  - Cap height is 0.7 × fontSize, and every glyph advances 0.692 × fontSize.
- **Glyphs:**
  - Present: `0-9 A-Z a-z ! " # $ ' ( ) * + , - . / < = > [ \ ] ^ _` and space.
  - Missing glyphs are dropped silently but keep their width.
- **SVG:** `silkscreengraphic` takes SVG and turns it into filled Gerber regions. A PNG becomes
  only its bounding box.
- **Mask openings:** `pcbsoldermaskopening` takes a layer and a rect, circle or polygon shape.
  `copperpour` has `coveredWithSolderMask`.
- **Copper text:** `coppertext` uses the same font and honours only `layer`.
- **Clipping:** silk is not clipped to pads or edges, so keep it clear by hand.

## Torque on the finger

- **Way screw:** a #8-32 (Ø4.17 mm) pan head with a lock washer (Ø8.13 OD) and Blue Sea's
  18 in-lb (2.03 N·m) torque ([`fuse-panel-dimensions.md`](fuse-panel-dimensions.md),
  [`way-monitor-terminals-and-copper.md`](way-monitor-terminals-and-copper.md)).
- **Clamp force:** F = T / (K·d). With a nut factor K of 0.2 that is 2.03 / (0.2 × 0.00417) ≈ 2.4 kN.
  For K from 0.15 to 0.3 it ranges from 1.6 to 3.2 kN.
- **Bearing area:** the washer bears on the finger's annulus between the 5.4 mm hole and Ø8.13, which
  is π/4 × (8.13² − 5.4²) ≈ 29 mm².
- **Stress:** about 84 MPa at K = 0.2, between 56 and 112 MPa over the K range. A split lock washer's
  edges raise it locally.
- **FR-4 limit:** typical flatwise compressive strength is about 400 MPa [unsourced; confirm against
  a laminate datasheet]. That leaves a margin of about 3.5 or more, so 2.03 N·m will not crush the
  finger.
- **The real risk is preload loss.** The resin embeds and creeps when warm, more so close to Tg.
  ENIG keeps the faces flat, and HASL would add solder creep on top.
- **Verdict:** printing the way-screw torque is accurate and safe, but it only repeats the panel's
  spec. The strip's own number is the output nut torque, 1.0–1.2 N·m from `design.md`. That one is
  worth printing if the design wants a torque figure.
