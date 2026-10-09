---
researched: 2026-10-09
for: "Whether the strip could sense current at the panel's own screw, without a second set of M4 terminals"
---

# Sensing current around the output cable

Could each way's current be measured without passing it through the board? That would remove
the comb finger and the output M4 nuts, so each ring goes back on the panel's own screw. The
CC6905 can't do this: it is an in-line sensor, so the current has to flow through its IP pins.
Measuring at the panel's own terminal means a different way of sensing.

**Verdict: not pursued.** The current design stays. Sensing around the cable is plausible, but it
costs about four times as much per way, needs its own supply wire, and is less accurate. Nothing
in `../design.md` changes.

Prices are USD on 2026-10-09, from distributor listings found by web search. None of these
parts was confirmed at LCSC.

## Options considered

1. **The fuse as a shunt.** Read the voltage across each fuse. Rejected without detailed
   research:
   - The signal is a few mV on top of 12–24 V.
   - Fuse resistance changes with temperature and self-heating, and includes the fuse-to-holder
     contact.
   - Every fuse change needs recalibration.
2. **A sensor with no core, near the ring or cable.** A wire 5 mm away gives about 40 µT per amp,
   less than the Earth's field. The next way, 13 mm away, adds about 15 µT per amp. Crosstalk
   can be calibrated out, but the calibration fails as soon as a cable moves. Rejected.
3. **A Hall sensor with a ferrite core around each output cable.** Researched below.

## Sensors with a core

| Part | Hole | Body | Price | Supply | Notes |
|---|---|---|---|---|---|
| Winson WCS1800 | 9.0 mm round | not found | about $3 (single, India) | 3.0–12 V, output scales with supply | 60 mV/A at 5 V. Offset not found. [Datasheet](https://www.mikrocontroller.net/attachment/442611/WCS1800_Datasheet.pdf) |
| LEM HO 10-P/SP33 | 8 × 8 mm | 23.9 × 12 × 20.9 mm | $11.26 (1), $9.77 (10) | 3.3 V | ±1.4 %. [Digi-Key 398-1175-ND](https://www.digikey.com/en/products/detail/lem-usa-inc/HO-10-P-SP33/4990656) |
| Honeywell CSLW6B5 | not found | 16.2 × 10 mm | $10–15 | 5 V | 15 mV/A |
| YHDC HSTS016L (split core) | about 16 mm | about 56 × 31 × 30 mm | about $14 | 5 V | Far too big for a 13.4 mm pitch |
| Gapped ferrite core + Allegro [ACS37503](https://www.allegromicro.com/en/products/sense/current-sensor-ics/field-current-sensors/acs37503) | your choice | your choice | cheap | 3.3 or 5 V | ±5 mV offset, ±1 % sensitivity. Built for sensing in a core gap |

- **LEM HLSR doesn't qualify.** It has a built-in primary conductor, not an open hole.
- **No small split-core DC sensor exists.** The search found none with a window under about
  16 mm. Coreless TMR clip-on sensors start at 100 A.
- **No closed-core part needs splitting.** The old rings already come off the screws during
  install, so each one can go through its sensor on the way back.

**Crosstalk is negligible with a core.** A 1.5 mm core gap sees about 8.4 mT from its own cable at
10 A. A 10 A neighbour at 13.4 mm gives about 150 µT. So crosstalk stays well under 1 %. These
are estimates, not measurements. Without a core, the sensor picks up roughly 30 % of the
neighbour's field.

**The ring has to fit through the hole.** One listing puts a #8 ring for 16–14 AWG at 0.32"
(8.1 mm) wide and about 0.8 mm thick. Expect about 9–9.5 mm wide for 12–10 AWG, though this is
unverified. A 9 mm round hole is marginal for that. An 8 × 8 mm square hole is 11.3 mm across
the diagonal, so the ring would have to go through at an angle. Only a fit test with real
rings would settle it.

## Compared with the current design

Gains:
- No way current goes through the board. That removes the 0.45 W per way at 30 A, the heavy
  copper and the comb finger.
- The six output M4 nuts go. Each ring goes back on the panel's own screw.

Losses:
- **Cost.** About $3 a way (WCS1800) or $10 (LEM), against about $0.73 for the CC6905 and its
  nut. The parts are probably not stocked at LCSC, so they would be hand-soldered.
- **Power.** The strip powers itself by tapping each way before its sensor, which needs the way
  current on the board. With sensors around the cables, the strip needs its own supply wire.
- **Accuracy.** After an overcurrent, the core stays slightly magnetised and leaves an offset.
  As an example, the HLSR specifies ±0.25 A after 10× its rated current. On top of that comes
  the Hall IC's offset drift with temperature. A split core's joint also varies, which changes
  sensitivity. Re-zeroing would cover some of this.
- **Mounting.** The strip would have to hold six sensors around the cables beside the panel,
  not clamp under the screws, so it would need a new fixing.

## Unverified

- The WCS1800's body size, offset spec and any LCSC listing.
- The CSLW6B5's hole size.
- The width and barrel diameter of a 12–10 AWG #8 ring.
