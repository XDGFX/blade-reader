# Design basis

The decisions taken so far, with enough of the reasoning and numbers to judge them. The detail
and sources are in [`research/`](research/). The decisions were made in the private Hailey repo,
whose issue numbers appear in the research notes as `XDGFX/hailey#NNN`.

Prices are USD from JLCPCB/LCSC on 2026-10-09, at 10–50 quantity.

## Requirements

- Measure the current on every way of a 12-way blade fuse panel. Every way gets a sensor,
  spare ways included.
- About ±0.3 A is good enough. Very small loads reading as zero is accepted.
- Don't limit the panel: 30 A per way, 100 A per panel.
- Existing #8 / M4 ring terminals must fit without re-crimping. The panel cover must still fit.
- Report to Home Assistant over Wi-Fi via ESPHome.
- Accept 12 V and 24 V systems.
- Cheap, and fully assembled by JLCPCB, with no hand soldering.

## Decisions

| Area | Decision | Why |
|---|---|---|
| Topology | Identical, standalone 6-way strips, two per 12-way panel, each with its own ESP32 | Cables between strips cost about the same as three more ESPs. Standalone strips also avoid a ground-drop offset and a single point of failure. Accepted costs: about 1 W more standby draw, and one HA device per strip |
| Mechanical | A comb. Each finger, 9.5 mm wide, slides sideways into a way's pocket at screw-pad height and is clamped under the panel's own #8 screw, through a 5.4 mm round hole. The strip sits outside the panel edge and needs about 40 mm of space beside it. Parts face down, ring face up, so rings are screwed on from above. Outline: [comb geometry](assets/comb-outline-rev-a.svg) | Barriers stand 4–8.5 mm above the screw pads, so a flat board can't lie under all six screws. A 1.6 mm finger leaves about 4 mm of thread engaged ([dimensions](research/fuse-panel-dimensions.md)). 9.5 mm and 5.4 mm also fit the Blue Sea clones. A hole rather than an open slot, because the old rings have to come off the screws anyway; the hole keeps the tip solid and the strip captive ([#8](https://github.com/XDGFX/blade-reader/issues/8)) |
| Fixing | The six way screws are the only required fixing. The body has two M3 holes (3.2 mm) near its outer corners, each with a 12 × 12 mm zone on the parts face that has no parts or copper, and a Ø8 mm zone on the ring face that has no copper. An optional 3D-printed block, screwed to the bulkhead with #8 countersunk screws, can take M3 bolts through these holes to carry the body. Install notes: fit the strip and torque all six way screws first, then fit the output rings; tie output cables to the bulkhead within about 100 mm | Six clamped screws hold the strip in the panel's plane with a wide margin, and the round holes keep it captive while any screw is in. The weak case is the body bending. Pushing down to drive an output bolt or pulling a cable puts about 2–4 N·m on the finger roots, roughly 80–160 MPa against FR4's roughly 400 MPa. No SMT standoff comes in the 14.3 mm needed, and they are extended parts (about $3.30–3.60), so the holes cost nothing and keep a printed block possible. The block itself is designed later ([#9](https://github.com/XDGFX/blade-reader/issues/9)) |
| Sensor | Cross Chip CC6905S8-3FB030 (C41421490), $0.56: 3.3 V, ±30 A, 44 mV/A, 0.6 mΩ max (0.45 W at 30 A) | Cheapest stocked 30 A part, and it runs from 3.3 V, so no 5 V rail or dividers. It has no factory temperature compensation; see Accuracy ([sensors](research/way-monitor-current-sensor.md)) |
| ADC | ESP32-C3-MINI-1 (C2838502), $2.67, plus one CD4051B 8:1 multiplexer (C21379, preferred part, no fee). Six ways, one NTC and one spare channel | The C3 has only 4 clean ADC1 channels with Wi-Fi on. The ESP32-C2 would save about $0.70 a strip, but its stock is thin and its ESPHome support weaker ([ADC](research/way-monitor-adc.md)) |
| Output terminal | Sinhoo SMT M4 nut (C2916378), $0.17. The ring clamps onto a copper pad | Assembled with everything else. The current flows ring to pad, so the nut's missing current rating barely matters. Torque about 1.0–1.2 N·m. Lever terminals cost $2+ and would mean re-terminating ([terminals](research/way-monitor-terminals-and-copper.md)) |
| Copper | Full-width pours on both layers, stitched with vias, along each way's roughly 20 mm path. 1 oz is fine. No bus current on the board | IPC-2152 widths for a long 30 A trace don't apply to a 20 mm path |
| Power | Every way feeds the supply through its own SS210 diode (C14996, basic), tapped before its sensor. Then a 1 A SMD fuse (Littelfuse 0466001, C151135), an SMBJ33A TVS (C19077586, preferred) and a TI LMR51610X buck (C20539658), 65 V rated. Ground is a wire from an M4 SMT nut to the negative bus. No jumper | The strip runs while any of its ways has a live fuse, works on either side of the panel, and its own draw stays out of every way's reading. The diodes also block reverse polarity. JLC has no basic or preferred fuse or PTC, so the fuse's $3 fee is unavoidable. The XL1509 was dropped because no TVS stays off at 29.2 V (24 V LiFePO4) and also clamps below its 45 V limit. For the same two fees, the LMR51610X costs about $0.80 more and is about 13 points more efficient ([#6](https://github.com/XDGFX/blade-reader/issues/6), [power](research/way-monitor-power-supply.md); its cable-supply section is superseded) |
| Pin map and programming | CD4051B common on GPIO3 with 10 nF at the pin, selects on GPIO5–7, INH to GND. Mux inputs: six ways, the NTC, and a 100 kΩ / 6.8 kΩ divider from the supply node. Status LED on GPIO10. GPIO0, 1 and 4 to test pads. Flashed with an Espressif ESP-PROG through an empty 2×3 2.54 mm footprint with offset "lock" holes: a header is pushed in, not soldered. Its VDD (ESP-PROG on 5 V) feeds the supply node through an SS210. No USB-C, no buttons. Flash off the panel, or with the ground wire fitted; update over Wi-Fi on the panel | Wi-Fi updates make a wired port a first-flash and recovery tool, so it shouldn't cost a part fee. Every USB-C socket and pin header at JLC is extended. The ESP-PROG's auto-reset makes BOOT and RESET buttons unnecessary. A product would buy pre-flashed modules instead ([#7](https://github.com/XDGFX/blade-reader/issues/7), [ESP32-C3 research](https://github.com/XDGFX/blade-reader/issues/4)) |
| Accuracy | One-off zero and gain calibration per way. An NTC per strip (Murata NCP15XH103F03RC, C77131, extended: JLC has no basic or preferred NTC) on a spare multiplexer channel for temperature correction, with the ESP32-C3's internal sensor as a backup. Automatic re-zeroing when a way sits steady near zero | The CC6905's offset can drift up to ±0.45 A over its full temperature range |
| Ordering | One strip design: order 5 bare boards, have 4 assembled. Economic PCBA | Identical strips avoid the multi-design surcharge a mixed panel would carry ([JLC](research/jlc-panelised-assembly.md)) |
| Tooling | tscircuit 0.0.2786, pinned exactly in `board/package.json`. `board/bun.lock` is the real pin, because the CLI it pulls in floats. Run everything with `bun run` in `board/`: `build` is the DRC gate, `fab` builds and then writes Gerbers, BOM and CPL to `board/fab/`, and `step` writes the board solid for Fusion. Don't use the global `tsci`, which runs the global CLI, or `tsci export` alone, which skips the DRC. Use polygon pours for current paths (its autorouter narrows wide traces), keep copper out of the ESP32's antenna area, and check every rotation in JLC's assembly preview | Shown to work in a trial run with these exact parts ([#5](https://github.com/XDGFX/blade-reader/issues/5)). The scaffold builds a placeholder board end to end ([#10](https://github.com/XDGFX/blade-reader/issues/10)) |

## Open

- The layout in tscircuit. The schematic is in `board/` ([#11](https://github.com/XDGFX/blade-reader/issues/11)).
- Board rules: JLC trace and via minimums, the antenna keepout, edge clearance.
- Generic blade fuse box compatibility: their terminal pitch and style.
- A design-rule check, a review of JLC's assembly preview, and a final costing before ordering.
- ESPHome configuration, once a board exists.
