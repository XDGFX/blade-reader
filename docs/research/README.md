# Research

The investigations behind [`../design.md`](../design.md). They record what was found at the
time. Where a later decision overrides one, the design basis says so. Parts that bore only on
the strip, rev A, are left out; they are at the tag `rev-a-strip`.

`XDGFX/hailey#NNN` refers to an issue in a private repo, where the earliest notes were written.

| File | What |
|---|---|
| [`way-monitor-current-sensor.md`](way-monitor-current-sensor.md) | 30 A hall sensors at LCSC, compared on price, error and heat. Also the shunt alternative |
| [`way-monitor-adc.md`](way-monitor-adc.md) | ESP32 ADC channels with Wi-Fi on, and multiplexer and external ADC costs |
| [`way-monitor-terminals-and-copper.md`](way-monitor-terminals-and-copper.md) | M4 board terminals, lever terminals, and copper for 30 A |
| [`way-monitor-power-supply.md`](way-monitor-power-supply.md) | Current budget, regulator and input protection. Its 65 V sizing is superseded |
| [`fuse-panel-dimensions.md`](fuse-panel-dimensions.md) | Blue Sea ST Blade 12-way, measured from CAD |
| [`other-panel-dimensions.md`](other-panel-dimensions.md) | Narva 54450BL and the generic LED panel against the Blue Sea's fit figures. Neither fits as drawn |
| [`silkscreen-design.md`](silkscreen-design.md) | Silkscreen exemplars, JLC mask colours and fees, tscircuit silk authoring, torque on the finger |
| [`economic-pcba-wifi-mcu.md`](economic-pcba-wifi-mcu.md) | Which Wi-Fi modules and chips JLC places under Economic PCBA, and what each costs |
| [`yoke-or-strips.md`](yoke-or-strips.md) | One yoke per 12-way panel against two strips, and why the yoke was chosen |
| [`usb-socket-edge-and-plug.md`](usb-socket-edge-and-plug.md) | The TYPE-C-31-M-12's datasheet edge line against the socket as placed, the room a USB-C plug needs off the bulkhead, and what the fit scripts need for its stake slots |

"Way monitor" was the working name before the project became Blade Reader.
