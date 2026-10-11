<p align="center">
  <img src="docs/assets/banner.svg" alt="Blade Reader: current on every way of a blade fuse panel" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="Licence: CERN-OHL-S-2.0" src="https://img.shields.io/badge/licence-CERN--OHL--S--2.0-e8772e?style=flat-square"></a>
  <img alt="Status: designing the first board" src="https://img.shields.io/badge/status-designing%20the%20first%20board-16191d?style=flat-square">
  <img alt="Input: 12 or 24 V" src="https://img.shields.io/badge/input-12%20%2F%2024%20V-686d73?style=flat-square">
  <img alt="Firmware: ESPHome" src="https://img.shields.io/badge/firmware-ESPHome-686d73?style=flat-square">
</p>

---

**Blade Reader** measures the current on every way of a blade fuse panel and sends it to Home
Assistant. A battery monitor tells you how much power is leaving the battery. Blade Reader tells
you where it is going.

> It reads blade fuses. Any resemblance to a 1982 film is the fault of whoever named it.

> [!NOTE]
> Blade Reader is being designed. No board has been ordered yet, so everything below describes
> the intended design, not a tested one.

## How it works

The board is a **yoke**: one board for all 12 ways, fitted round the positive end of the fuse
panel. An arm runs along each long side, and the chin joins them past the panel's end. Each arm
is shaped like a comb: one finger slides sideways into each way's pocket and is clamped under
the panel's own output screw. Current runs from the panel, along the finger, through a
hall-effect sensor, and out to an M4 nut on the arm, where the circuit's existing ring terminal
lands. No re-crimping, and the panel's cover still goes back on.

- **Sensing:** one hall-effect sensor per way, with its own 0.6 mΩ current path. It is rated to
  30 A per way, and none of the panel's bus current crosses the yoke.
- **Brains:** one ESP32-C3 on the chin, running ESPHome, reporting over Wi-Fi. A yoke is one
  Home Assistant device reading all 12 ways.
- **Power:** taken from whichever ways are live, through a diode on each, with a fuse on the
  board and one ground wire to the negative bus. It accepts 12 V and 24 V systems.
- **Accuracy:** aiming for about ±0.3 A, after zeroing each way in firmware and correcting for
  board temperature. That is enough to find the heater, fridge or inverter responsible for the
  missing amp-hours. It is not a laboratory instrument. A way drawing a few milliamps will read
  as zero.

The first design, rev A, was a 6-way strip, two to a 12-way panel. It was laid out and never
ordered, and is kept at the tag [`rev-a-strip`](https://github.com/XDGFX/blade-reader/tree/rev-a-strip).

## Compatibility

| Fuse panel | Status |
|---|---|
| Blue Sea Systems ST Blade, 12 circuit (5026) | Target. Way pitch 13.36 mm, #8 output screws |
| Blue Sea Systems ST Blade, 6 circuit | Unsupported, but possible, with both arms cut short: see [Installing](#on-a-6-circuit-panel). The outline fits that way (printed plate, 2026-10-11); no cut board has been tried, and nothing is checked for it |
| Generic blade fuse boxes | Wanted. Pitches and terminals vary, so each would need its own outline |

## Installing

No yoke has been built, so these notes come from the design and from a 1.6 mm printed plate of
the outline. The plate was fitted to a Blue Sea ST Blade 12 circuit on 2026-10-11: it dropped on
with all 12 holes lined up, cleared the + stud and the mounting screws, and the cover went on.

The yoke is drawn for a fuse panel mounted positive end down, as Blue Sea draws it. The chin is
then below the panel, the odd ways are on the left with 11 and 12 nearest the chin, and the
silkscreen reads upright. The parts face goes towards the bulkhead and the ring face towards you.
It needs 16.7 mm beside each long side of the panel, 22.7 mm at the lower left where the ESP32's
antenna overhangs, and 13.5 mm below the positive end.

1. **Isolate the battery.** The feed lug has to come off, and the + stud is live until you do.
2. **Strip the positive end.** Take the feed lug off the + stud, lift every circuit's ring
   terminal, and take out all 12 way screws. Keep the lock washer from each screw.
3. **Lower the yoke on, holding it by the chin.** Never carry or press it by an arm: the arms have
   no stiffening, and bending an assembled arm a couple of millimetres can crack its capacitors.
   All 12 fingers go into their pockets together, 9.5 mm fingers into 11.1 mm pockets, with about
   ±0.6 mm of float at the holes.
4. **Refit all 12 way screws**, each with its lock washer, and torque them before anything else
   goes on. They are the yoke's only fixing.
5. **Refit the feed lug with a washer under it**, so that it stands clear of the chin. See below.
6. **Bolt each circuit's ring terminal to its own way's nut**, with an M4 split spring washer
   under the bolt, to 1.0–1.2 N·m. The numbers are on the fingers. Run the ring's tongue straight
   out, away from the panel, and hold it there while you tighten: within about 20° either way.
   The nuts take an M4 ring for 4–6 mm² cable at most. Tie the cables to the bulkhead within
   about 100 mm.
7. **Fit the ground wire**: one wire from the nut marked GND, on the right-hand arm between way
   12 and the chin, to the panel's negative bus. Fit it before plugging anything into the USB
   socket or the programming pads on the panel.
8. **Put the cover back on**, reconnect the battery, and check every torque again after the first
   warm run. The joints clamp FR4, which settles when warm.

### The feed lug and the chin

The feed lug crosses the chin on its way off the + stud, and the whole of the chin's ring face
is GND copper under solder mask. Mask is not insulation: a lug that rests on the chin can scrape
through it, and that joins the feed to the ground wire with no fuse between them. So the lug must
stand clear of the chin, not lie on it. The lug's seat on the stud is level with the parts face,
so a flat lug has to rise by the yoke's 1.6 mm or more: a washer about 2 mm thick under it, which
leaves about 11.9 mm of stud. A lug that steps up from its palm may clear without one; check for
a visible gap all the way across the chin.

How far the feed's field moves the readings of ways 11 and 12 is not known until a built yoke is
bench-checked.

### On a 6 circuit panel

Unsupported, but possible. Clip off the parts between each arm's third and fourth fingers,
counting from the chin, and cut both arms there, which leaves the three fingers nearest the chin
on each side. The plate fitted a Blue Sea ST Blade 6 circuit that way, and its cover went on.

### Untested

- **The feed lug over the chin.** No lug has been tried on the plate or on a yoke. The washer and
  its thickness are worked out from the panel's CAD, not measured.
- **Any clone.** Both panels the plate was fitted to were Blue Sea's. The yoke fixes the row
  spacing at the ST Blade's 84.2 mm.
- **A cut yoke on a 6 circuit panel.** Only the plate was cut. Nothing is laid out or checked
  for it.
- **The yoke's last 6.5 mm.** The chin was shortened from 20 mm to 13.5 after the plate was
  printed, without a reprint. The inner edge and every hole are as printed; how stiff the arms
  are on the shorter chin is not.
- **Everything a plate can't show:** the joints after heat, the room a USB plug needs behind the
  yoke, and Wi-Fi range with the antenna beside way 11's cable.

## Repository

| Path | What |
|---|---|
| [`docs/design.md`](docs/design.md) | The design as decided so far, with the reasoning and the numbers |
| [`docs/research/`](docs/research/) | The research behind each decision: sensors, ADC, terminals and copper, power, JLC assembly, panel dimensions |
| `docs/assets/` | The banner and renders of the board |
| [`board/`](board/) | The yoke's [tscircuit](https://tscircuit.com) source. So far its outline and holes |

The board will be ordered assembled from JLCPCB. The fab files and an ESPHome configuration
will land here as they are made.

## Licence

The hardware design is licensed under the [CERN Open Hardware Licence v2, Strongly
Reciprocal](LICENSE). You may build, modify and sell boards made from it. If you distribute a
modified design, you must publish its source under the same licence.
