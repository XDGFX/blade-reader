<p align="center">
  <img src="docs/assets/banner.svg" alt="Blade Reader: current on every way of a blade fuse panel" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="Hardware licence: CERN-OHL-S-2.0" src="https://img.shields.io/badge/hardware%20licence-CERN--OHL--S--2.0-e8772e?style=flat-square"></a>
  <a href="firmware/LICENSE"><img alt="Firmware licence: AGPL-3.0-or-later" src="https://img.shields.io/badge/firmware%20licence-AGPL--3.0--or--later-e8772e?style=flat-square"></a>
  <img alt="Status: rev B in service" src="https://img.shields.io/badge/status-rev%20B%20in%20service-16191d?style=flat-square">
  <img alt="Input: 12 or 24 V" src="https://img.shields.io/badge/input-12%20%2F%2024%20V-686d73?style=flat-square">
  <img alt="Firmware: ESPHome" src="https://img.shields.io/badge/firmware-ESPHome-686d73?style=flat-square">
</p>

---

**Blade Reader** measures the current on every way of a blade fuse panel and sends it to Home
Assistant. A battery monitor tells you how much power is leaving the battery. Blade Reader tells
you where it is going.

> It reads blade fuses. Any resemblance to a 1982 film is the fault of whoever named it.

> [!NOTE]
> Five rev B yokes have been built, and two have been in service since November 2026. See
> [Untested](#untested) for what the install hasn't shown yet.

## How it works

The board is a **yoke**: one board for all 12 ways, fitted round the positive end of the fuse
panel. An arm runs along each long side, and the chin joins them past the panel's end. Each arm
is shaped like a comb: one finger slides sideways into each way's pocket and is clamped under
the panel's own output screw. Current runs from the panel, along the finger, through a
hall-effect sensor, and out to an M4 nut on the arm, where the circuit's existing ring terminal
lands. No re-crimping, and the panel's cover still goes back on.

- **Sensing:** one hall-effect sensor per way, on its own current path: about 1.1 mΩ of the
  yoke's copper and up to 0.6 mΩ in the sensor. It is rated to 30 A per way, and none of the
  panel's bus current crosses the yoke.
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
| Other blade fuse panels | Wanted. Pitches and terminals vary, so each would need its own outline |

## Installing

These notes come from the design, from a 1.6 mm printed plate of the outline, and from the two
yokes in service. Both fitted as drawn, and the arms on the 13.5 mm chin have proved stiff
enough.

The yoke is drawn for a fuse panel mounted positive end down, as Blue Sea draws it. The chin is
then below the panel, the odd ways are on the left with 11 and 12 nearest the chin, and the
silkscreen reads upright. The parts face goes towards the bulkhead and the ring face towards you.
It needs 16.7 mm beside each long side of the panel, 22.7 mm at the lower left where the ESP32's
antenna overhangs, and 13.5 mm below the positive end.

1. **Isolate the battery.** The feed lug has to come off, and the + stud is live until you do.
2. **Strip the positive end.** Take the feed lug off the + stud, lift every circuit's ring
   terminal, and take out all 12 way screws. Keep the lock washer from each screw.
3. **Lower the yoke on.** Handle it gently: it's fragile until it's installed, since the arms have
   no stiffening and bending one a couple of millimetres can crack its capacitors. All 12 fingers go into their pockets together, 9.5 mm fingers into 11.1 mm pockets, with about
   ±0.6 mm of float at the holes.
4. **Refit all 12 way screws**, each with its lock washer, and torque them before anything else
   goes on. They are the yoke's only fixing.
5. **Refit the feed lug, and check it stands clear of the chin.** Some lugs need a washer under
   them; see below.
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
9. **Zero every way (recommended).** Each way needs a zero, read with no current through its
   finger. The board takes one by itself whenever a way is dead, but a way that is live all the
   time in service never gets one unless you do this. A board with any way unzeroed starts in
   install mode, for up to an hour: the red LED blinks slowly while a live way still needs a zero,
   and blinks fast while a zero is being taken. Don't touch a fuse while it blinks fast.
   1. Isolate the battery, take out every fuse but one, and reconnect. The other 11 ways zero
      within about 15 s.
   2. Zero the way with the fuse, in either of two ways. Refit the other 11 fuses, then pull that
      one for 15 s and refit it once the fast blink stops: it shows as a blown fuse, with the red
      LED steady, until it has been back for 5 s. Or move that one fuse to another way, which
      turns the board off while it's out, so the way it left zeroes at the next boot; then refit
      the rest.
   3. It's done when the board's "Not Zeroed" reading says `None` and the red LED stops blinking.

   On the bench, a board on USB with every fuse out zeroes all 12 at once. Zeros survive updates
   and a move to another panel. To redo one way, pull its fuse for 15 s.

### Flashing through the programming pads

The first flash goes in over the USB-C socket. The six pads marked PROG are the recovery route,
for an Espressif ESP-PROG on a pogo clamp, and on rev B their TXD and RXD are crossed: the pad
labelled TXD is wired to the module's RXD and the pad labelled RXD to its TXD, where the
ESP-PROG's header names its pins from the ESP's side. So swap the TXD and RXD leads between the
ESP-PROG and the clamp. EN, VDD, GND and IO0 go straight through. The ESP-PROG's signals stay at
3.3 V whichever way its power jumper is set; set it to 5 V so the board runs off the panel.

### The feed lug and the chin

The feed lug crosses the chin on its way off the + stud, and the whole of the chin's ring face
is GND copper under solder mask. Mask is not insulation: a lug that rests on the chin can scrape
through it, and that joins the feed to the ground wire with no fuse between them. So the lug must
stand clear of the chin, not lie on it.

Whether yours does depends on the lug. The lug's seat on the stud is level with the parts face,
so a flat lug has to rise by the yoke's 1.6 mm or more: a washer about 2 mm thick under it, which
leaves about 11.9 mm of stud. A lug that steps up from its palm may clear without one. The first
install's lugs needed none, but lugs vary: look for a visible gap all the way across the chin
before you put the cover on.

The feed's field moves the reading of whichever way is nearest where the feed leaves the panel,
by up to about −0.24 A at a 100 A feed. That is way 12 when the feed leaves to the right of the
chin. The firmware doesn't correct for it.

### On a 6 circuit panel

Unsupported, but possible. Clip off the parts between each arm's third and fourth fingers,
counting from the chin, and cut both arms there, which leaves the three fingers nearest the chin
on each side. The plate fitted a Blue Sea ST Blade 6 circuit that way, and its cover went on.

### Untested

- **Other feed lugs.** The first install's lugs cleared the chin without a washer. The washer
  for a flat lug is worked out from the panel's CAD, not tried.
- **Any clone.** Both panels the plate was fitted to were Blue Sea's. The yoke fixes the row
  spacing at the ST Blade's 84.2 mm.
- **A cut yoke on a 6 circuit panel.** Only the plate was cut. Nothing is laid out or checked
  for it.
- **The joints over time.** The first yokes went into service in November 2026, so the joints
  haven't yet been through a season of heat. Keep checking the torques after the first warm runs.
- **Wi-Fi beyond 5 m.** The antenna sits beside way 11's cable; it holds a connection at 4–5 m,
  and nothing further has been tried.

## Repository

| Path | What |
|---|---|
| [`docs/design.md`](docs/design.md) | The design as decided, with the reasoning and the numbers |
| [`docs/research/`](docs/research/) | The research behind each decision: sensors, ADC, terminals and copper, power, the Wi-Fi module, panel dimensions |
| `docs/assets/` | The banner and renders of the board |
| [`board/`](board/) | The yoke's [tscircuit](https://tscircuit.com) source: placed and routed, with every check passing. Its Gerbers, BOM and CPL are in `board/fab/` |

The first five yokes were ordered assembled from JLCPCB on 2026-10-12. The ESPHome firmware and
how to flash it are in [`firmware/`](firmware/). How the firmware behaves is in
[`docs/reference/firmware.md`](docs/reference/firmware.md).

## Licence

Blade Reader is under two licences:

- **Hardware** (`board/`): [CERN-OHL-S-2.0](LICENSE). You may build, modify and sell boards made
  from it; if you distribute a modified design, you must publish its source under the same
  licence.
- **Firmware** (`firmware/`): [AGPL-3.0-or-later](firmware/LICENSE). You may use, modify and share
  it; if you distribute modified firmware, or let people use it over a network (its web page), you
  must offer them its source under the same licence.
