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
> Five rev B boards have been built, and two have been in service since November 2026. See
> [Untested](#untested) for what the install hasn't shown yet.

## How it works

Blade Reader is one board for all 12 ways, fitted round the positive end of the fuse panel. An
arm runs along each long side, and the two join past the panel's end. Each arm
is shaped like a comb: one finger slides sideways into each way's pocket and is clamped under
the panel's own output screw. Current runs from the panel, along the finger, through a
hall-effect sensor, and out to an M4 nut on the arm, where the circuit's existing ring terminal
lands. No re-crimping, and the panel's cover still goes back on.

- **Sensing:** one hall-effect sensor per way, on its own current path: about 1.1 mΩ of the
  board's copper and up to 0.6 mΩ in the sensor. It is rated to 30 A per way, and none of the
  panel's bus current crosses the board.
- **Brains:** one ESP32-C3 past the panel's end, running ESPHome, reporting over Wi-Fi. Each
  Blade Reader is one Home Assistant device reading all 12 ways.
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
| Blue Sea Systems ST Blade, 6 circuit | Unsupported, but possible, with both arms cut short: see [below](#on-a-6-circuit-panel). The outline fits that way (printed plate, 2026-10-11); no cut board has been tried, and nothing is checked for it |
| Other blade fuse panels | Wanted. Pitches and terminals vary, so each would need its own outline |

### On a 6 circuit panel

Unsupported, but possible. Clip off the parts between each arm's third and fourth fingers,
counting from the joined end, and cut both arms there, which leaves the three fingers nearest
that end on each side. The plate fitted a Blue Sea ST Blade 6 circuit that way, and its cover went on.

## Installing

**Got one? [Start here: the manual](https://xdgfx.github.io/blade-reader/).** It goes from
the box to every circuit in Home Assistant.

Before you buy, check the space round the panel. With the panel mounted positive end down, as
Blue Sea draws it, Blade Reader needs 16.7 mm beside each long side, 22.7 mm at the lower left
where the ESP32's antenna overhangs, and 13.5 mm below the positive end.

### Untested

- **Other feed lugs.** The first install's lugs cleared the board without a washer. The washer
  for a flat lug is worked out from the panel's CAD, not tried.
- **Any clone.** Both panels the plate was fitted to were Blue Sea's. The board fixes the row
  spacing at the ST Blade's 84.2 mm.
- **A cut board on a 6 circuit panel.** Only the plate was cut. Nothing is laid out or checked
  for it.
- **The joints over time.** The first boards went into service in November 2026, so the joints
  haven't yet been through a season of heat. Keep checking the torques after the first warm runs.
- **Wi-Fi beyond 5 m.** The antenna sits beside way 11's cable; it holds a connection at 4–5 m,
  and nothing further has been tried.

## Repository

| Path | What |
|---|---|
| [`docs/design.md`](docs/design.md) | The design as decided, with the reasoning and the numbers |
| [`docs/research/`](docs/research/) | The research behind each decision: sensors, ADC, terminals and copper, power, the Wi-Fi module, panel dimensions |
| `docs/assets/` | The banner and renders of the board |
| [`board/`](board/) | The board's [tscircuit](https://tscircuit.com) source: placed and routed, with every check passing. Its Gerbers, BOM and CPL are in `board/fab/` |
| [`manual/`](manual/) | The manual's page, published at [xdgfx.github.io/blade-reader](https://xdgfx.github.io/blade-reader/). Its drawings are drawn from the board by `board/manual/` |

The first five boards were ordered assembled from JLCPCB on 2026-10-12. The ESPHome firmware and
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
