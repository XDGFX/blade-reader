---
date: 2026-10-10
issue: 47
map: 40
---

# Yoke: where the module sits on the chin and where its antenna points

Answers [#47](https://github.com/XDGFX/blade-reader/issues/47) for the yoke map
([#40](https://github.com/XDGFX/blade-reader/issues/40)). *Yoke*, *arm* and *chin* are that map's
working words. The module is the ESP32-C3-MINI-1-H4X chosen in
[#45](https://github.com/XDGFX/blade-reader/issues/45). Espressif's general rules are already in
`esp32-c3-hardware-constraints.md` (branch `research/esp32-c3-constraints`) and are not repeated;
this note adds the figures it lacks and applies them to the chin.

Axes are those of `yoke-chin-position.md`: **along** (a) from the panel's positive end, negative
past the end; **across** (c) from the centreline; **height** above the bulkhead. Figures marked
*inferred* are worked out here from the closed tickets' geometry. Nothing has been drawn or
placed. All sources were read on 2026-10-10.

## Executive summary

**Recommendation: put the module in an outer corner of the chin, as far from the + stud as the
yoke goes, with its antenna hanging 5.4 mm over the chin's outer edge and pointing away from the
panel.** The antenna is then about 77–85 mm from the stud and at least 42 mm from a feed cable
that leaves straight out or sideways, against the 15 mm Espressif asks for.

| | A. Outer corner, antenna over the chin's outer edge (recommended) | B. Outer corner, antenna over the yoke's side edge (runner-up) | C. Corner block beside the deck, antenna over the side edge | D. Middle of the chin's outer edge |
|---|---|---|---|---|
| Antenna points | Away from the panel, along −a | Sideways, away from the centreline | Sideways | Away from the panel |
| Espressif's placement figure | A ticked corner position, if the right corner is used | A ticked corner position | Ticked only if the feed end is at the chin end | Mid-edge: never ticked |
| Antenna to the + stud | 77–85 mm | about 79–86 mm | about 65 mm | 32 mm plus the chin's depth |
| Antenna to the feed cable | 42 mm if it leaves straight out, 46 mm or more if sideways. Under it only if it leaves at about 20–65° towards that corner | As A | **Under it** when the feed leaves sideways on that side | **Under it** when the feed leaves straight out |
| Antenna to the nearest output ring and cable | 71 mm | about 62 mm | about 3–12 mm, inside the 15 | 60 mm or more |
| Bounding rectangle | 5.4 mm longer, or a 5.4 × 28 mm step in the corner | 5.4 mm wider: 129.6 | 5.4 mm wider | 5.4 mm longer |
| Side clearance on Cal's install | 20 mm from the side edge to the trunking | 14.6 mm from the antenna's tip to the trunking | 14.6 mm | 20 mm |

- **A costs** 5.4 mm of length past the positive end, where the map records ample free
  bulkhead, and one install rule: the feed cable must not leave diagonally over that corner.
- **B costs** 5.4 mm of width instead, on the side where rev A's body was capped for the cable
  trunking. Take it only if length past the end turns out to be the scarcer.
- **C and D are out.** Each puts the antenna directly under one of the two ways Blue Sea's own
  installation photograph shows a cable leaving, and C is also beside the first way's output ring.
- **The 100 A is not a radio problem.** The cable matters to the antenna as a piece of metal,
  the same with no current in it. Its field matters, if at all, to the current sensors nearest
  the positive end.
- **Only a real board can confirm** the range, and whether a metal bulkhead 13.5 mm behind the
  antenna costs more than the 15 mm rule suggests. Rev A's strip has the same bulkhead distance.

The same position holds for the ESP32-C3-WROOM-02
([#43](https://github.com/XDGFX/blade-reader/issues/43),
[#54](https://github.com/XDGFX/blade-reader/issues/54)): only the module's size changes.

## What Espressif asks for

| Rule | Figure | Source |
|---|---|---|
| Module size | 13.2 × 16.6 × 2.4 mm, each ±0.15, on a 0.8 mm module PCB | Module DS[^ds] Fig. 10-1 |
| Antenna strip | The full 13.2 mm width, beyond the pad field. 16.6 − 11.2 = **5.4 mm** long. The 5.4 is a subtraction from the drawing, not a printed dimension, and is what rev A overhangs by. It replaces the 4.6 in the constraints note | Module DS Fig. 11-1; *inferred* |
| Antenna off the board | "It is suggested to place the module's on-board PCB antenna outside the base board, and the feed point of the antenna close to the edge of the base board" | HDG[^hdg], Positioning a Module on a Base Board |
| Which positions | Corner positions with the feed point at the corner are ticked: 3 and 4 for a feed on the right, 1 and 5 for a feed on the left. The mid-edge position 2 is never ticked. "Positions without a mark are not recommended" | HDG, placement figures |
| Which side the MINI-1's feed is on | Not stated anywhere. In the datasheet's top view with the antenna up, the two legs that drop to the ground edge are at the **left** end of the meander | Module DS Fig. 10-1; *inferred from the drawing* |
| If it cannot overhang | Feed point still at the edge; "cut off the base board on both sides of the antenna and below it". Never mid-board with a cut-out on four sides | HDG |
| Clearance on the base board | "Min 15" mm to the left, right and beyond the antenna, with the board cut away there. The figure is a generic module with a 6 mm antenna strip | HDG, Keepout Zone figure |
| Copper and parts | "The antenna area of the module and the area 15 mm outside the antenna should be kept clean (namely no copper, routing, components on it)." The HDG page itself has no sentence about layers | ESP-FAQ[^faq] |
| Once installed | "A clearance of at least 15 mm is recommended in all directions" inside the housing. "Make sure that the module is not covered by any metal shell" | HDG; ESP-FAQ |
| Ground | "Sufficient ground copper and dense ground vias should be placed on the base board near the antenna" | HDG |
| Proof | "The final end product should be tested for throughput and communication range to ensure RF performance" | HDG |
| Link budget | 20.5 dBm out and −98.0 dBm sensitivity at 802.11b 1 Mbps; 19.0 and −92.6 dBm at 11n MCS0. Typical, at the antenna port. The antenna's gain is not given | Module DS Tables 7-2, 7-4 |

Espressif's older ESP-WROOM-02 placement guide (2016) asked for only 5.0 mm round the antenna
and allowed bare board under it.[^w02guide] The current documents say 15 mm and a cut-away, and
those are used here.

## What nearby metal does

No vendor gives a figure for a stud, a lug or a battery cable as such. They all give a distance
to "metal", and they agree on the mechanism: metal in the antenna's near field shifts its
resonant frequency, absorbs power and reshapes its pattern.[^ublox-sim]

| Source | Rule of thumb |
|---|---|
| Espressif HDG and ESP-FAQ | 15 mm clear in all directions; no metal shell over the module |
| u-blox NINA-W1 integration manual[^ublox-sim] | "High / large parts including metal shall not be placed closer than 10 mm to the module's antenna"; 10 mm from a PCB trace antenna to the casing |
| u-blox NINA-W15 datasheet[^ublox-ds] | "Keep a minimum of 10 mm free space from the metal around the antenna including the area below" |
| Taoglas APN-13-8-001[^taoglas] | 4 mm minimum from other metal; "we recommend 20mm or more for best gain and radiation efficiency". Written for 450 MHz to 6 GHz, not 2.4 GHz alone |
| Infineon AN91445[^infineon] | No figure. "No metal is allowed in the antenna near-field"; "the battery cable or mic cable must not cross the antenna trace"; "a plastic casing or a battery cable running nearby can completely detune the antenna" |
| TI DN007[^ti] | No figure. The match is affected by "objects in the antenna nearfield such as mechanical assemblies (housing, batteries, etc.)" |

At 2.44 GHz the wavelength is 122.9 mm. The reactive near field, where an object detunes the
antenna rather than only shadowing it, is commonly taken to end at λ/2π, which is 19.6 mm.[^osha]
So the vendors' 10–20 mm and the physics agree, and this note works to two distances:

- **Under 15–20 mm: detuning.** Keep every piece of metal out. This is the limit that matters.
- **Beyond about 20 mm: shadowing only.** A stud, lug or cable there blocks or reflects in its
  own direction and leaves the match alone. It costs range towards the panel, not the link.

Not verified: Silicon Labs AN853 is reported to say that a large metal plane parallel to an
antenna and closer than about 25 mm cuts gain in every direction. The document could not be
fetched, so the figure is not used. No vendor source was found for the quarter-wave reflector
rule either.

## What 100 A does

**To the radio: nothing.** *Inferred from physics; no vendor says it outright, and the module
datasheet does not mention magnetic fields.* A direct current, with ripple at 50–120 Hz from an
inverter or a few kilohertz from an alternator, has no energy within five orders of magnitude
of 2.4 GHz, so the receiver cannot see it. The field itself is small: B = μ₀I / 2πr gives
1.25 mT at 16 mm from the centre of a cable carrying 100 A, and about 0.4 mT at option A's distance.
The module holds a crystal, flash and air-cored RF parts, none of which a field that size moves.
Espressif's one remark on the subject is to keep "large inductance" parts away from the crystal,
which is about a switching inductor next to it.[^hdg]

**What is real instead:**

- **The cable as metal.** A 35 mm² cable is an 11–12 mm copper bar. Within 15 mm of the antenna
  it detunes it, live or dead. This is what the placement has to avoid.
- **The field at the current sensors.** Allegro puts its integrated sensors' coupling at
  "around 10 to 15 G/A", and says a stray field reads as about 1 A of error per 10 G on a part
  with one Hall element, or about 1 % of that on a differential part.[^allegro] A feed that
  leaves sideways passes about 18 mm from the sensor of the way nearest the positive end, where
  100 A gives about 11 G. *Inferred:* that is up to about 1 A on that one way if the CC6905 has a
  single Hall element and the field lies along its sensitive axis, and about 10 mA if it is
  differential. The repo does not record which it is. The error follows the panel's total load,
  so a zero taken at one load does not hold at another. Rev A is exposed in the same way.
- **Supply noise.** The buck on the chin has to hold Espressif's ripple figure whatever is on
  the 12 or 24 V bus: under 80 mV peak to peak while sending 11n MCS7 and under 120 mV at 11b.
  That limit is from the ESP32 edition of the HDG; the ESP32-C3 edition gives none.[^hdg32] The
  ESP32-C3 edition asks for 500 mA, 10 µF at the power entrance and 0.1 µF at the pin, as rev A
  has.[^hdg]

## The chin envelope

From [#44](https://github.com/XDGFX/blade-reader/issues/44),
[#48](https://github.com/XDGFX/blade-reader/issues/48) and
[#53](https://github.com/XDGFX/blade-reader/issues/53):

- The + stud is at a 11.33, c 0. The lug is taken as rigid for 40 mm from it.
- The yoke's side edges are at c ±62.1 (124.2 wide). The panel's edges are at c ±42.1.
- The chin's inner edge is an arc of radius 42 about the stud: a −30.7 on the centreline, easing
  to a −2 at c ±40. Outboard of c ±43.1 the board runs unbroken from the arm to the chin's outer
  edge, in a band 19 mm wide.
- The chin's outer edge is at a = −30.7 − D, with D the chin's depth on the centreline. D is not
  yet set, so figures below are given for D = 10 and D = 20.
- The parts face is 14.33 above the bulkhead. The module is on it, so its far side is 11.9 from
  the bulkhead and its antenna copper about 13.5.
- The feed cable crosses the ring face with its underside at 16.4 or higher, in any direction
  from one long edge round the end to the other.

## Option A, recommended

**Position.** The module's body lies along the yoke's side edge in one outer corner of the chin,
its 13.2 mm width from about c 48 to c 61 (1 mm in from the side edge, as rev A's is from the
panel edge) and its pad field on the last 11.2 mm of board before the chin's outer edge. The
antenna strip hangs 5.4 mm past that edge.

**Which corner.** The one that puts the feed point at the corner. *If the feed is on the left
as read from the datasheet drawing*, that is the right-hand corner when looking down on the
fitted yoke with the chin at the top. The module is on the parts face, so the view from above
is mirrored. Confirm the feed side on the module's own footprint before the outline is drawn. If
it cannot be confirmed, either corner is still a corner position and far better than C or D.

**Keepout.**

| What | Figure |
|---|---|
| Copper, either layer | None under the antenna strip, which is off the board anyway. Solid ground on both layers under the rest of the module, with vias along the edge the antenna leaves from |
| Board | The chin's outer edge may not step outwards within 15 mm of the module, so from c 33 to the corner. The same holds for the side edge within 15 mm of the outer edge |
| If the antenna must stay inside the bounding rectangle | Step the outer edge back 5.4 mm over the module's width plus 15 mm inboard: a notch 5.4 × 28.2 mm in the corner. This is Espressif's "cut off the base board on both sides" case |
| Parts | Nothing taller than the module, and no nut, inductor or test pad, within 15 mm of the antenna strip. Only the module's own decoupling and strapping parts sit nearer, behind its pad field |
| Ground nut | In the other half of the chin. Its wire runs the length of the panel to the negative bus and must not start beside the antenna |
| Programming pads and UART | At least 15 mm from the antenna, and placed so the pogo clamp slides on from an edge that is not the antenna's corner. Espressif wants UART traces, vias and test points "as far away from the antenna as possible"[^hdg] |
| Tooling hole | The yoke JLC note puts one in a chin corner. Use the other corner. A bare 1.152 mm hole does nothing to the antenna (*inferred*), but it cannot sit under the module |
| In the air | 15 mm clear beyond the antenna and to both sides of it once fitted: no cable, tie, trunking or bracket |

**Distances this leaves** (*inferred*, to the middle of the antenna strip):

| To | D = 10 | D = 20 |
|---|---|---|
| + stud and nut | 77 mm | 85 mm |
| End of a 40 mm lug pointing straight out | 56 mm | 60 mm |
| Feed cable leaving straight out, edge to edge | 42 mm | 42 mm |
| Feed cable leaving sideways, edge to edge | 46 mm | 56 mm |
| Nearest output nut (way 11 or 12's, at a 27.83, c 56.1) | 71 mm | 81 mm |
| Panel's + bus, which starts at the stud | 77 mm or more | 85 mm or more |
| Bulkhead, behind the antenna | 13.5 mm | 13.5 mm |
| Trunking on Cal's install, 40 mm from the panel edge | about 21 mm | about 21 mm |

Every piece of metal on the panel is beyond the 20 mm where detuning stops. What they do is
shadow: the stud, lug, bus and twelve output cables all lie on the panel side, so the antenna
sees best away from the panel and to its own side.

**The one direction to avoid.** The corner lies about 40–45° off straight out, seen from the
stud. A feed cable that leaves between about 20° and 65° off straight out, towards the module's
corner, passes within 15 mm of the antenna or over it, half a millimetre above the ring face.
The install note has to say: lead the feed straight out, sideways, or towards the other corner.
A mark on the ring face over the corner would say it on the board.

**Conflicts.** None with the arc, which lies inboard of c ±40 while the module is outboard of
c 48. Inboard of the module the chin is open board, so the arm's lines pass without going under
it. The tooling hole and the programming pads each want a chin corner or edge, and the other
corner and the rest of the outer edge are free for them.

## The other options

**B, the same corner turned a quarter turn.** The antenna hangs over the side edge. The stud,
lug and cable distances are much as A's. It costs 5.4 mm of width instead of length, and on
Cal's install it leaves 14.6 mm from the antenna's tip to the trunking, which is just inside
Espressif's 15. It is the answer if the outline ticket finds the yoke cannot grow past the end.

**C, in a corner block beside the deck.** The 22 × 19 block holds the module with the antenna
over the side edge. A feed that leaves sideways crosses that block on the ring face, straight
over the module. The first way's output ring and cable, which run outboard from a nut 8 mm
further along, are 3–12 mm from the antenna. Out, unless the chin shrinks to a bridge with no
room for parts.

**D, mid-chin.** It is Espressif's unticked position, and it is under the feed cable when the
feed leaves straight out, which is the direction Blue Sea shows.

**With the WROOM-02.** 18 × 20 mm with a 6 mm antenna strip (figures as taken in
`economic-pcba-wifi-mcu.md`). Option A holds: the overhang becomes 6 mm, the notch 6 × 33, and
the module takes 18 of the 19 mm between the panel's edge line and the side edge, so it has to
sit wholly past the panel's end, at a below −2, where the chin opens out. Its feed side was not
checked.

## What only a real board can confirm

| Question | Why paper can't answer it | Cheap check |
|---|---|---|
| Range and link margin on the panel | Espressif itself says the end product must be tested. The shadow of the panel and its cables depends on where the access point is | Fit the yoke, read ESPHome's Wi-Fi signal sensor, compare with the same board on the bench at the same spot. Rev A's check ([#15](https://github.com/XDGFX/blade-reader/issues/15)) carries over |
| Detuning by the feed cable | The clearances above assume a straight cable and a 40 mm lug | Watch the signal while moving the feed cable across the corner, with no current flowing. A drop of more than a few dB within the "allowed" directions means the corner needs more room |
| A metal bulkhead 13.5 mm behind the antenna | Inside Espressif's 15 mm and at about a ninth of a wavelength, where a reflector works against the antenna. The bulkhead's material on Cal's install is not recorded | Compare the signal with the board on the panel and held 50 mm off it; or slide a sheet of foil behind a board on the bench at 14 mm. A rev A strip answers this today, if one exists |
| That 100 A does nothing to the radio | It is physics, not a measurement | Log the signal and dropped packets with the panel loaded and unloaded. Expect no change |
| Stray field on the sensors nearest the positive end | Depends on the CC6905's Hall arrangement and the lug's direction | With every fuse on that arm pulled, load the other arm and watch the first way's reading against total current |
| Which side the MINI-1's feed is on | Read from a drawing | Look at a module, or its footprint, before the outline is drawn. Not a board question, but still open |

None of these needs a network analyser. A go on the yoke means no rev A boards will exist, so
the bulkhead check moves to the first yoke.

[^ds]: Espressif, *ESP32-C3-MINI-1 & MINI-1U Datasheet* v2.2 (2026-05-06):
    <https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf>
[^hdg]: Espressif, *ESP Hardware Design Guidelines*, ESP32-C3, latest (revision history tops out
    at v1.8, 2025-06-05), PCB Layout Design > General Principles of PCB Layout for Modules
    (Positioning a Module on a Base Board), and Schematic Checklist > Power Supply:
    <https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/pcb-layout-design.html>,
    <https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/schematic-checklist.html>
[^hdg32]: The same guidelines, ESP32 edition, PCB Layout Design > Typical Layout Problems:
    <https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32/pcb-layout-design.html>
[^faq]: Espressif, *ESP-FAQ*, Hardware design, "For modules with PCB antennas, what should be
    noted when I design the PCB and the housing of the antenna?":
    <https://docs.espressif.com/projects/esp-faq/en/latest/hardware-related/hardware-design.html>
[^w02guide]: Espressif, *ESP-WROOM-02 PCB Design and Module Placement Guide* (2016.06):
    <https://www.espressif.com/sites/default/files/documentation/esp-wroom-02_pcb_design_and_module_placement_guide_0.pdf>
[^ublox-sim]: u-blox, *NINA-W1 series System Integration Manual*, UBX-17005730, on-board antenna
    design. Revision and section number not confirmed:
    <https://content.u-blox.com/sites/default/files/NINA-W1_SIM_UBX-17005730.pdf>
[^ublox-ds]: u-blox, *NINA-W15 series Data Sheet*, UBX-18006647 R21, §1.8.2:
    <https://content.u-blox.com/sites/default/files/NINA-W15_DataSheet_UBX-18006647.pdf>
[^taoglas]: Taoglas, *PCB Antenna with Cable Integration Application Note*, APN-13-8-001/A, §5
    and §9:
    <https://www.taoglas.com/assets/application-notes/PCB-Antenna-Application-Note-APN-13-8-001.A.pdf>
[^infineon]: Infineon (Cypress), *AN91445 Antenna Design and RF Layout Guidelines*, 001-91445
    Rev. *H, §12 and §15.1.4:
    <https://www.infineon.com/dgdl/Infineon-AN91445_Antenna_Design_and_RF_Layout_Guidelines-ApplicationNotes-v09_00-EN.pdf?fileId=8ac78c8c7cdc391c017d073e054f6227>
[^ti]: Texas Instruments, *DN007 2.4 GHz Inverted F Antenna*, SWRU120D, §1:
    <https://www.ti.com/lit/an/swru120d/swru120d.pdf>
[^osha]: OSHA Cincinnati Laboratory, *Electromagnetic Radiation: Field Memo* (1990), §VI: "the
    outer boundary of the reactive near-field region is commonly considered to be a distance of
    1/2π times the wavelength":
    <https://www.osha.gov/radiofrequency-and-microwave-radiation/electromagnetic-field-memo>
[^allegro]: Allegro MicroSystems, *Common Mode Field Rejection in Coreless Hall-Effect Current
    Sensor ICs*, 269123-AN Rev. 5 (2023-09-15):
    <https://www.allegromicro.com/-/media/files/application-notes/an269123-common-mode-field-rejection-in-coreless-current-sensor-ics.pdf>
