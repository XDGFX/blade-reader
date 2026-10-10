# Research

The investigations behind [`../design.md`](../design.md), copied from the Hailey repo where they
were done. They record what was found at the time. Where a later decision overrides one, the
design basis says so; the notes themselves are not rewritten.

| File | What |
|---|---|
| [`way-monitor-current-sensor.md`](way-monitor-current-sensor.md) | 30 A hall sensors at LCSC, compared on price, error and heat. Also the shunt alternative |
| [`way-monitor-adc.md`](way-monitor-adc.md) | ESP32 ADC channels with Wi-Fi on, and multiplexer and external ADC costs |
| [`way-monitor-terminals-and-copper.md`](way-monitor-terminals-and-copper.md) | M4 board terminals, lever terminals, and copper for 30 A |
| [`way-monitor-power-supply.md`](way-monitor-power-supply.md) | Current budget, regulator and input protection. Its 65 V sizing and its 3.3 V-over-cable sections are superseded |
| [`jlc-panelised-assembly.md`](jlc-panelised-assembly.md) | JLC fees and panel rules, and shipping to Australia |
| [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md) | Blue Sea ST Blade 12-way, measured from CAD |
| [`silkscreen-design.md`](silkscreen-design.md) | Silkscreen exemplars, JLC mask colours and fees, tscircuit silk authoring, torque on the finger |
| [`cable-aperture-sensing.md`](cable-aperture-sensing.md) | Sensing current around each output cable instead of through the board. Not pursued |
| [`economic-pcba-wifi-mcu.md`](economic-pcba-wifi-mcu.md) | Which Wi-Fi modules and chips JLC places under Economic PCBA, and what each costs the way 1 ear |
| [`feed-cable-stray-field.md`](feed-cable-stray-field.md) | Whether the CC6905 is differential, and the error the feed cable's field puts on the sensors nearest the positive end, by cable route |

"Way monitor" was the working name before the project became Blade Reader.
