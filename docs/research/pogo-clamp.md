# What the pogo clamp needs round J1

The dimensions of the 2.54 mm double-row 6P pogo clamp (AliExpress
[1005004869027755](https://www.aliexpress.com/item/1005004869027755.html)) and what they ask of
J1 on the chin ([#77](https://github.com/XDGFX/blade-reader/issues/77)). Checked on 2026-10-11.
Nobody here has a clamp, so every figure is from published material; nothing was measured on a
part. Anything not read from a page is marked **[unsourced]**.

**The clamp is not registered to the board edge: it is slid on and lined up by eye.** So its
uncertain dimensions decide how deep J1 may sit and what must stay clear, not where the pads
must be. Rev A's position (3.9 mm from the edge) is well inside what it reaches.

## Sources

| | Source | What it gives | How good |
|---|---|---|---|
| A | The listing itself: its title and six gallery photos. The description and any text would not load | The construction: a black sprung clip, the pins held in two small PCBs screwed to one jaw, a flat pad on the other. No dimensions | Photos only |
| B | [Ohm Cat "PCB dedicated burn-in test clamp" datasheet](https://cdn-shop.adafruit.com/product-files/5434/C17220-001+datasheet.pdf), hosted by Adafruit and linked from its [product 5434](https://www.adafruit.com/product/5434). Page 9 is a side view of a double-row clamp with four printed dimensions; pages 14–17 draw the P75 probe and R75 sleeve | The only printed dimensions found | A maker's drawing, of a red clamp of the same pattern. The dimension lines are drawn over a photo, and do not agree with the pin pitch in it to better than 8 % |
| C | Adafruit [5433](https://www.adafruit.com/product/5433) (1×6, 2.54 mm) and 5434: one printed figure, and photos [side-on beside a US quarter](https://cdn-shop.adafruit.com/1200x900/5433-02.jpg) and [end-on](https://cdn-shop.adafruit.com/1200x900/5433-04.jpg) | Scale: the quarter (24.26 mm) and the six pins (12.7 mm over five pitches) | Scaled from photos, about ±0.5 mm. A single-row clamp, same body |
| D | [TinyTronics 2×3 clamp](https://www.tinytronics.nl/en/tools-and-mounting/measuring/accessories/test-probe-with-clamp-pogo-pin-2x3p): tip Ø1.3, stroke 2.5, and two photos | Shows the 2×3 pin layout | Printed, but only two figures |
| E | [eBay 225992507218](https://www.ebay.com/itm/225992507218) (probe P75-E2, needle Ø1.3, sleeve R75-3W) and [Gotronik's P75-E2](https://www.gotronik.pl/igla-testowa-pomiarowa-p75-e2-1-pin-kartapdf-8483.html) (16.5 long, 2.50 full stroke, 100 g) | The probe | Read from search snippets only; the pages refused the fetch |

That the black AliExpress clamp is the red one in another colour is judged from the photos:
the same stepped handle, pivot screw, spring and two-PCB pin stack. No source says so.

Not found: any dimensioned drawing of the black clamp, a stated board thickness or jaw opening,
a review or teardown with measurements, or a measured 3D model.
[puzrin/pogo_pins_clip](https://github.com/puzrin/pogo_pins_clip) and
[Thingiverse 3638401](https://www.thingiverse.com/thing:3638401) are printed clips of other
designs. Amazon, eBay and AliExpress pages returned no product text.

## Dimensions

All in mm. "Far row" is the pin row at the jaw's tip, deepest into the board; "near row" is the
one towards the handle and the board edge.

| Dimension | Value | Range across sources | From | Confidence |
|---|---|---|---|---|
| Pin layout, double-row 6P | 3 pins across the jaw, 2 rows along the reach | – | Photos, A, B and D | High |
| Overall length | 62.5 | 62.5 printed; 63.9 scaled against the quarter | B, C | High |
| Far row to the tip of the back jaw's plastic | 0–2 | 0 in B's drawing; 1.9 scaled | B, C | Medium |
| Far row to the front edge of the pin PCBs and of the back jaw's pad | 2–2.5 | 1.7 scaled from B; 2.6 scaled from C | B, C | Medium |
| Deepest reach: near row to where the jaws close | 13.5 | 13.5 printed (16 for the far row); 18–20 scaled from C; Adafruit prints "max depth 25 mm", which scales as pin to pivot | B, C | Medium: take 13.5 |
| Pin jaw width | 16.2 PCB, 15.3 plastic | One photo, of the 1×6 clamp. The 2×3's PCB is as wide as its jaw or wider (A, D) | C, scaled | Medium |
| Back jaw width | 15.3 plastic, with a PCB pad about 16 wide on it | One photo | C, scaled | Medium |
| Back jaw thickness, pad face to underside | 6 | 6 printed | B | High |
| Pin PCB underside above the pin tips, pins free | 5–6 | 5.1 scaled from C; 5.9 scaled from B | B, C | Medium |
| Screw and nut under the pin PCBs | Starts 3.8–6 behind the near row, hangs to 3.3–4.3 above the pin tips | Scaled from B and C | B, C | Low |
| Pin jaw's height off the board | About 27, more with the ribbon's housing on top | One photo | C, scaled | Low |
| Pin travel | 2.5 full | 2.5 in B, D and E | B, D, E | High |
| Pin force | 100 g a pin as standard, 0.6 kg for six | 60, 180 and 220 g are options | B, E | Medium |
| Pin tip | Cone to a point, head Ø1.3 | B says Ø1.5 is its default at 2.54 pitch; D and E say Ø1.3 | B, D, E | Medium |
| Pin barrel and sleeve | Ø1.02 in a Ø1.32 sleeve, Ø1.4 drill | – | B | High |
| Board thickness it opens to | Not published. About 5 between pin tips and pad, from the handle gap and lever arms in C's side photo **[unsourced]** | – | – | Low. B shows it clamped on boards of ordinary thickness |

Two things follow that were not expected:

- **Nothing passes the pins.** The pins stand at the very tip of both jaws, so the jaw covers
  the board from the edge to about 2.5 mm past the far row and no further.
- **The back jaw's pad is a PCB with a plated hole under every pin**, bare metal, each about
  Ø1.8 on the 2.54 grid (C's end-on photo). It presses on the ring face directly behind J1.

The pins swing on the pivot as they compress, so the tips scrub along the reach by an estimated
0.15–0.4 mm over the full 2.5 mm **[unsourced]**: a 2.5 mm arc about a pivot roughly 29 mm away
and 2–5 mm above the board, scaled from C.

## Layout rule

- **Orientation.** J1's rows run parallel to the chin's outer edge, three pads along the edge,
  two rows deep, and the clamp comes on square to the edge.
- **Distance from the edge.** The pins reach a row anywhere from the edge to 13.5 mm in (near
  row) and 16 mm (far row) as printed. Use no more than **10 mm for the far row**, which leaves
  3.5 mm for the drawing's error. To keep the clamp's screw and nut hanging off the board
  rather than over it, keep the **near row within 3.5 mm of the edge**: then the far row is at
  6.0 or less. Rev A's rows, at 2.6 and 5.2, meet both.
- **Parts face, under the pin jaw.** A box **18 mm wide** (9 either side of J1's centre) from
  the edge to **9.5 mm in**, or to 4.9 past J1's centre line if J1 sits deeper. That is the
  16.2 mm pin PCB plus 0.9 a side for the hand, and the far row plus 2.5 of PCB plus 1. Nothing
  but pads and masked traces between the pads and the edge, or within 1.5 mm of a pad. If the
  chin needs the rest of the box, parts up to 2.0 mm high may stand in it: the pin PCB stays
  2.6 mm or more above the board with the pins fully home. The 74HC4067PW fits under that; the
  WROOM-02 does not.
- **Ring face, under the back jaw.** The same 18 × 9.5 mm box, flat: no nut, bolt head or
  washer, and no ring terminal or tongue that is fitted while flashing. That includes the
  ground nut's ring, since the board may be flashed with the ground wire on. Masked copper of
  any net is fine. No bare copper of two different nets inside the box, because a plated hole
  in the jaw's pad could join them. A ring keepout may overlap the box: the keepout limits
  which nets lie there, and the jaw only needs it flat and empty when the clamp is on.
- **Room to work.** The back jaw is 6 mm thick and the pin jaw stands about 27 mm off the parts
  face, so the yoke is flashed off the fuse panel, parts face up.

## Options for J1

Because the clamp is placed by hand, a second row of pads or a wider pad buys tolerance for the
hand, not for the clamp's unknown dimensions. The unknowns are covered by the keep-clear. What
is left to insure is the clamp not working at all.

| | Pads | Tolerance for the pins, along the reach / across | Fallback if the clamp fails | Costs |
|---|---|---|---|---|
| 1 | Rev A: six Ø1.5 round, parts face only | ±0.75 / ±0.75 | Six wires soldered to the pads | Nothing |
| 2 | Ovals 1.5 × 2.0 along the reach | ±1.0 / ±0.75 | As 1 | Nothing. 0.54 mm between the rows |
| 3 | **Long pads, 1.5 × 3.85**, each running outwards from 0.25 to 4.1 mm from J1's centre line | ±1.0 / ±0.75 | A surface-mount 2×3 header soldered on by hand | J1 grows from 6.6 × 4.0 to 6.6 × 8.2. Its centre line must sit 4.4–4.75 from the edge |
| 4 | Plated holes, 1.0 mm, for a through-hole 2×3 header | The cone tips centre themselves in the holes | A through-hole header, the sturdiest | Bare lands on the ring face, which is why rev A dropped it under way 1's ring keepout ([#26](https://github.com/XDGFX/blade-reader/issues/26)); the back jaw's bare plated holes then press on them; a pin in a hole is said to contact less surely than on a flat pad ([Codidact](https://electrical.codidact.com/posts/280454)) |
| 5 | Castellated edge | – | – | Not possible: an edge takes one row, and the clamp's pins come down on a face |

Option 3's pads are KiCad's own land for a vertical surface-mount 2×3 header, which spans 0.95
to 4.1 mm either side of the centre line
([`PinHeader_2x03_P2.54mm_Vertical_SMD`](https://gitlab.com/kicad/libraries/kicad-footprints/-/blob/master/Connector_PinHeader_2.54mm.pretty/PinHeader_2x03_P2.54mm_Vertical_SMD.kicad_mod),
pads 3.15 × 1.0 at ±2.525), widened to 1.5 and run 0.7 further in so the pins' ±1.27 falls on
them. The two rows grow in opposite directions, so the extra length adds nothing for the clamp
beyond the ±1.0 the inner ends give.

Every pin header at JLC is an extended part, about $3 an order (`docs/design.md`, Pin map and
programming). In options 3 and 4 the header is not on the BOM: the pads are left unpasted, as
rev A's are, and a header is soldered on by hand only if the clamp lets Cal down. So neither
adds a fee. Having JLC fit one would cost the fee and put a 9 mm post on every board for a
first-flash tool; not worth it.

## Recommendation

**Option 3, with its centre line 4.6 mm from the chin's outer edge**, rows parallel to the
edge, parts face only, unpasted, and the 18 × 9.5 mm box kept on both faces.

- The pads then end 0.5 mm from the edge and the pin rows land 3.3 and 5.9 mm in, against the
  3.5 and 10 mm limits.
- The ring face is untouched, so no ring keepout is disturbed and the back jaw's bare holes
  bear on mask.
- If the clamp is a poor fit or fails, a surface-mount header or six wires go on the same pads.
- It costs 4.2 mm more of the chin's depth than rev A's J1 and no money.

If the chin cannot spare the depth, fall back to option 2 at rev A's 3.9 mm; the keep-clear is
the same.

## Residual risk

- **The clamp bought may not be the one drawn.** The printed dimensions are another maker's,
  matched by eye. A wider or deeper jaw is covered by about 1 mm in each direction and no more.
- **The jaw opening is unpublished.** That it takes a 1.6 mm board rests on photos of it in
  use, not on a figure.
- **The screw and nut are the least certain figure**, and stainless. If they sit further
  forward than scaled, they come over the pads' outer ends, 0.8–1.8 mm up with the pins fully
  home. They would have to touch two pads to matter.
- **Whether the holes in the back jaw's pad are joined to each other** is unknown. Keeping
  bare copper of two nets out of the box makes it not matter.
- **The pins are sharp cones** and will mark HASL pads and scratch mask if dragged. Harmless
  for a tool used once or twice a board.

All of it is settled by ten minutes with calipers once a clamp arrives, which is after the
order: the keep-clear is the only part that cannot be changed then.
