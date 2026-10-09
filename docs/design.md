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
| Mechanical | A comb. Each finger, about 10.5 mm wide, slides sideways into a way's pocket at screw-pad height and is clamped under the panel's own #8 screw. The strip sits outside the panel edge and needs about 40 mm of space beside it | Barriers stand 4–8.5 mm above the screw pads, so a flat board can't lie under all six screws. A 1.6 mm finger leaves about 4 mm of thread engaged ([dimensions](research/fuse-panel-dimensions.md)) |
| Sensor | Cross Chip CC6905S8-3FB030 (C41421490), $0.56: 3.3 V, ±30 A, 44 mV/A, 0.6 mΩ max (0.45 W at 30 A) | Cheapest stocked 30 A part, and it runs from 3.3 V, so no 5 V rail or dividers. It has no factory temperature compensation; see Accuracy ([sensors](research/way-monitor-current-sensor.md)) |
| ADC | ESP32-C3-MINI-1 (C2838502), $2.67, plus one CD4051B 8:1 multiplexer (C21379, preferred part, no fee). Six ways, one NTC and one spare channel | The C3 has only 4 clean ADC1 channels with Wi-Fi on. The ESP32-C2 would save about $0.70 a strip, but its stock is thin and its ESPHome support weaker ([ADC](research/way-monitor-adc.md)) |
| Output terminal | Sinhoo SMT M4 nut (C2916378), $0.17. The ring clamps onto a copper pad | Assembled with everything else. The current flows ring to pad, so the nut's missing current rating barely matters. Torque about 1.0–1.2 N·m. Lever terminals cost $2+ and would mean re-terminating ([terminals](research/way-monitor-terminals-and-copper.md)) |
| Copper | Full-width pours on both layers, stitched with vias, along each way's roughly 20 mm path. 1 oz is fine. No bus current on the board | IPC-2152 widths for a long 30 A trace don't apply to a 20 mm path |
| Power | XL1509-class buck, 45 V rated (e.g. C41364883), with a TVS sized below that and an on-board 2 A SMD fuse (e.g. Littelfuse 0466002, C3105). Power comes from one of the strip's own ways via a jumper or solder bridge, plus a ground wire to the negative bus | On a battery-backed house bus, at most 29.2 V for 24 V LiFePO4, 45 V is ample. A 12 V input must also work ([power](research/way-monitor-power-supply.md); its 65 V sizing and cable-supply sections are superseded) |
| Accuracy | One-off zero and gain calibration per way. An NTC per strip on a spare multiplexer channel for temperature correction, with the ESP32-C3's internal sensor as a backup. Automatic re-zeroing when a way sits steady near zero | The CC6905's offset can drift up to ±0.45 A over its full temperature range |
| Ordering | One strip design: order 5 bare boards, have 4 assembled. Economic PCBA | Identical strips avoid the multi-design surcharge a mixed panel would carry ([JLC](research/jlc-panelised-assembly.md)) |
| Tooling | tscircuit, version pinned. Use polygon pours for current paths (its autorouter narrows wide traces), keep copper out of the ESP32's antenna area, and check every rotation in JLC's assembly preview | Shown to work in a trial run with these exact parts |

## Open

- The schematic and layout in tscircuit.
- Board rules: JLC trace and via minimums, the antenna keepout, edge clearance.
- Generic blade fuse box compatibility: their terminal pitch and style.
- A design-rule check, a review of JLC's assembly preview, and a final costing before ordering.
- ESPHome configuration, once a board exists.
