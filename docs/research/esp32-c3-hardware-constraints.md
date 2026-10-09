---
date: 2026-10-09
issue: 4
map: 1
---

# ESP32-C3-MINI-1: hardware constraints on the schematic and layout

Answers XDGFX/blade-reader#4: which pins of the ESP32-C3-MINI-1 the **strip** can use for the
CD4051B multiplexer and the ADC, which to leave alone, the minimum boot, reset and decoupling
circuit, and the antenna keepout. It feeds the pin map and the programming-interface ticket.

[`way-monitor-adc.md`](way-monitor-adc.md) already settles that ADC2 is out with Wi-Fi on,
that ADC1 is GPIO0–4, that GPIO2 should stay pulled up (leaving 4 clean ADC1 pins), the ±35 mV
error at 12 dB, and the ESPHome multiplexer caveats. None of that is repeated here.

## Sources

| Short name | Document | Version |
|---|---|---|
| Module DS | [ESP32-C3-MINI-1 & MINI-1U Datasheet][ds-mini] | v2.2 |
| Chip DS | [ESP32-C3 Series Datasheet][ds-c3] | v2.4 |
| TRM | [ESP32-C3 Technical Reference Manual][trm] | v1.4 |
| HDG | ESP Hardware Design Guidelines, ESP32-C3: [Schematic Checklist][hdg-sch], [PCB Layout Design][hdg-pcb] | v1.8 (2025-06-05), read 2026-10-09 |
| IDF JTAG | [ESP-IDF, Configure Other JTAG Interfaces (ESP32-C3)][idf-jtag] | stable, read 2026-10-09 |

## Answer

**Pin map candidate.** Multiplexer common to **GPIO3** (ADC1_CH3). Select lines S0–S2 on
**GPIO5, GPIO6, GPIO7**. **GPIO10** as the dummy `pin_s3` ESPHome needs, or a status LED.
That leaves GPIO0, GPIO1 and GPIO4 free, all three ADC1-capable, for a supply-voltage divider
or a second multiplexer later.

**Leave alone:** GPIO2, GPIO8 and GPIO9 (strapping, pulled up). GPIO18 and GPIO19 (USB). GPIO20
and GPIO21 (UART0). GPIO11–17 aren't on the module's pins at all.

**Minimum circuit on the strip:**

- EN: 10 kΩ to 3V3 and 1 µF to GND.
- GPIO9: 10 kΩ pull-up, plus a button or pads to GND for download mode. No large capacitor.
- GPIO2 and GPIO8: 10 kΩ pull-ups each.
- 3V3 pin: 10 µF plus 0.1 µF.
- A 3.3 V rail good for at least 500 mA.

**Antenna:** put the module at a corner or end of the strip, with its antenna end beyond the
board edge. Keep copper, parts and traces off every layer under the antenna, and leave about
15 mm clear of anything metal around it.

## Pins

The MINI-1 brings out 15 GPIOs: 0–10, 18–21. GPIO11–17 are not on the module's pads
(Module DS Table 3-1). They belong to the in-package flash, and "the pins for flash
communication cannot be used externally for other purposes" (HDG, Schematic Checklist > Flash).

The chip datasheet sorts GPIOs into priorities (Chip DS §2.3.4, Peripheral Pin Assignment):

- **Priority 2, free to use:** GPIO0, 1, 3, 10.
- **Priority 3, use with caution:** strapping (2, 8, 9), USB Serial/JTAG (18, 19), pad JTAG
  (4–7), UART0 (20, 21), VDD_SPI (11).
- **Priority 4, not for use:** GPIO12–17 (flash).

| GPIO | Module pin | Functions (Module DS Table 3-1) | Constraint | Use on the strip |
|---|---|---|---|---|
| 0 | 12 | ADC1_CH0, XTAL_32K_P | Free. 32 kHz crystal pin; there's no crystal, so it's a GPIO (HDG, RTC Clock Source) | Spare ADC |
| 1 | 13 | ADC1_CH1, XTAL_32K_N | Free, as GPIO0 | Spare ADC |
| 2 | 5 | ADC1_CH2 | Strapping; pull up | 10 kΩ pull-up only |
| 3 | 6 | ADC1_CH3 | Free | **Multiplexer common** |
| 4 | 18 | ADC1_CH4, MTMS | Pad JTAG, unused by default (below) | Spare ADC |
| 5 | 19 | ADC2_CH0, MTDI | Pad JTAG, unused by default. ADC2 is out with Wi-Fi on | **S0** |
| 6 | 20 | MTCK | Pad JTAG. Weak pull-up at reset; 5 ns low glitch at power-up | **S1** |
| 7 | 21 | MTDO | Pad JTAG. 5 ns low glitch at power-up | **S2** |
| 8 | 22 | — | Strapping; pull up | 10 kΩ pull-up. Usable later as an output, if it isn't pulled low at reset |
| 9 | 23 | — | Strapping (BOOT); weak pull-up | 10 kΩ pull-up, BOOT button or pads |
| 10 | 16 | FSPICS0 | Free. 5 ns low glitch at power-up | ESPHome dummy `pin_s3`, or LED |
| 18 | 26 | USB_D− | USB Serial/JTAG by default. 50 µs high glitch at power-up | USB programming |
| 19 | 27 | USB_D+ | USB Serial/JTAG by default; USB pull-up enabled after reset | USB programming |
| 20 | 30 | U0RXD | UART0 download and ROM log. 5 ns low glitch | Leave for programming |
| 21 | 31 | U0TXD | UART0 download and ROM log | Leave for programming |

Reset states are from Chip DS Table 2-1, and the glitches from Chip DS Table 2-2, Power-Up
Glitches on Pins. The glitches don't matter for multiplexer select lines: at worst, the
multiplexer passes the wrong way for a few nanoseconds during power-up.

**Pad JTAG (GPIO4–7) is free by default.** "By default, ESP32-C3 JTAG interface is connected
to the built-in USB_SERIAL_JTAG peripheral". The pads carry JTAG only after an eFuse is burnt
(IDF JTAG, Configure eFuses; TRM eFuse table, `EFUSE_JTAG_SEL_ENABLE`, `EFUSE_DIS_USB_JTAG`).
Leaving those eFuses alone keeps GPIO4–7 ordinary GPIOs. The CPU can still be debugged over
USB.

**GPIO18 and GPIO19** are the USB Serial/JTAG controller by default. To use them as GPIOs they
must be reconfigured, and their pull-ups come from the USB pull-up control (Chip DS Table 2-1,
note 5). Keep them for USB: that gives flashing, logs and JTAG over one connector with no
USB-UART bridge. Espressif's reference circuit puts a 0 Ω resistor in series with each line
and leaves footprints for capacitors to GND (Module DS §9, Figure 9-1: R4, R6, C5, C6). The
layout rules are 90 Ω ±10 % differential, routed as a matched pair over continuous ground,
with as few vias as possible (HDG, PCB Layout > USB).

**UART0 (GPIO20, GPIO21)** is the other download port, and the ROM prints its boot log there
by default (Module DS §4.2). Bring it to test pads so a board with a USB fault can still be
flashed. For signals the board uses itself, Espressif advises a UART other than UART0
(HDG, Schematic Checklist > UART). The 499 Ω series resistor on U0TXD is already inside the
module (Module DS §8, R2).

## Strapping pins and boot

GPIO2, GPIO8 and GPIO9 are sampled when EN goes high. They must hold their levels for at least
3 ms after EN rises (t_H; setup time t_SU is 0) (Module DS §4, Table 4-2).

| Pin | Default (Module DS Table 4-1) | Normal boot (SPI Boot) | Download (Joint Download Boot) | Fit on the strip |
|---|---|---|---|---|
| GPIO2 | Floating | 1 | 1 | 10 kΩ pull-up |
| GPIO8 | Floating | Any | **1** | 10 kΩ pull-up |
| GPIO9 | Weak pull-up (~45 kΩ) | 1 | **0** | 10 kΩ pull-up, plus a button or pads to GND |

Boot modes are from Module DS Table 4-3, which notes that GPIO2 "actually does not determine
SPI Boot and Joint Download Boot mode, but it is recommended to pull this pin up due to
glitches". Joint Download Boot accepts both USB-Serial-JTAG and UART0. The 10 kΩ values come
from the reference circuit (Module DS Figure 9-1: R9 on IO2, R8 on IO8, JP2 from IO9 to GND).

GPIO8 matters only when entering download mode. If it floated low, the chip couldn't enter
Joint Download Boot, so it gets a real pull-up. GPIO8 also gates the UART0 ROM log when the
`EFUSE_UART_PRINT_CONTROL` eFuse is burnt (Table 4-4). Left unburnt, as here, GPIO8 is ignored
for printing.

For GPIO9 the HDG says: "It is recommended to place a pull-up resistor at the GPIO9 pin" and
"Do not add high-value capacitors at GPIO9, or the chip may enter download mode" (HDG,
Schematic Checklist > Strapping Pins).

With USB connected, esptool can usually put the chip into download mode without the button,
over the USB Serial/JTAG controller. That belongs to the programming-interface ticket. The
BOOT pads cost nothing and recover a board whose firmware has broken USB.

## Power-up, reset and decoupling

**EN (CHIP_EN, module pin 8)** must not float (Module DS Table 3-1; HDG, Chip Power-up and
Reset Timing). The rails must be stable for at least 50 µs before EN rises (t_STBL), and a
reset needs EN held below 0.25 × VDD for at least 50 µs (t_RST) (Module DS §4.3, Table 4-6).
The recommended RC is "usually R = 10 kΩ and C = 1 µF", adjusted to the supply's power-up
(Module DS §9; HDG, same section). The module has an ESD diode on EN but no RC inside
(Module DS §8, D1), so the RC goes on the strip.

The HDG adds that slow rise or fall, frequent power cycling, or an unstable supply can defeat
the RC, and suggests reserving a supply monitor with a threshold of about 3.0 V for those
cases. The strip's supply is a buck converter on a battery-backed bus, which isn't one of
those cases. Treat a supervisor footprint as optional. The reference circuit's reset button
is SW1 from EN to GND, with C4 = 0.1 µF (Module DS Figure 9-1); on a strip, pads will do.

**Supply.** 3.0–3.6 V, absolute maximum 3.6 V, and the external supply must deliver at least
0.5 A (Module DS Tables 6-1 and 6-2). Peak TX current is 350 mA at 802.11b, 20.5 dBm (Table 6-4).
The HDG agrees: "the output current is no less than 500 mA".

**Decoupling.** Inside the module, the chip already has its own decoupling: 10 µF and
2 × 0.1 µF on VDD33, 1 µF and 10 nF on VDDA, and 0.1 µF and 1 µF near VDD_SPI (Module DS §8).
The base board needs:

- **10 µF + 0.1 µF at the module's 3V3 pin** (Module DS Figure 9-1, C1 and C2).
- **An ESD diode and at least 10 µF at the main power entrance** (HDG, Schematic Checklist
  > Power Supply). On the strip, that is the buck output. The buck's own output capacitors
  probably cover the 10 µF if they sit close; place the ESD diode there too.
- 3.3 V traces at least 25 mil (0.64 mm) wide where they're the main supply (HDG, PCB Layout >
  Power Supply). A pour does better.

**The module's EPAD** (pin 49) needn't be soldered, but soldering it helps heat flow. Too much
paste lifts the module off its other pads (Module DS §9). JLC's stencil will decide this; keep
the vias shown in the land pattern (Module DS Figure 11-1).

## ADC input filter and the multiplexer

The HDG asks for "a 0.1 µF filter capacitor between ESP pins and ground when using the ADC
function" (HDG, Schematic Checklist > ADC). With a multiplexer, that capacitor sits after the
switch. On every channel change it must charge from the previous way's voltage through the
CD4051B's on-resistance, plus the sensor's output resistance.

*Derived, not from Espressif:* at 5 V the CD4051B's on-resistance is up to 1050 Ω, and more at
3.3 V. Take 2 kΩ: τ = 0.2 ms, and settling to 12 bits takes about 8τ, or 1.7 ms. ESPHome's
default switch delay is 2 ms, which leaves almost no margin. Two options:

- put each way's RC filter on the sensor output, before the multiplexer, with only about
  10 nF at the ADC pin;
- or keep 0.1 µF at the pin and set `delay` to 5 ms or more. Six ways plus the NTC then take
  about 35 ms per sweep, which is still fine.

The CC6905's limit on capacitive load also needs checking at schematic time.

**Sensor swing against the calibrated range.** Also derived, and outside this ticket's
question. Espressif quotes ±35 mV only over 0–2500 mV at 12 dB (Chip DS §5.5, Table 5-6). If
the CC6905 rests at 1.65 V with no current and moves 44 mV/A, then +30 A reaches about
2.97 V. That is outside the calibrated range above about +19 A, while −30 A (0.33 V) stays
inside it. The fix is to orient each sensor, or route its current path, so that load current
drives the output **below** mid-rail. Check this against the CC6905 datasheet.

## Antenna keepout and module placement

The MINI-1 measures 13.2 × 16.6 × 2.4 mm (Module DS §10.1, Figure 10-1). The PCB antenna sits
along the short edge beyond the GND row of pins 38–48, marked "Keepout Zone" in Figure 3-1.
From the land pattern (Figure 11-1), about 4.6 mm of the module's length at that end has no
pads: 16.6 − 11.2 − 0.8 mm. The module datasheet sends the placement rules to the HDG
(Module DS §3.1 Note A, §11.2).

Rules from HDG, PCB Layout > General Principles of PCB Layout for Modules:

1. **Antenna beyond the board edge.** "Place the module's on-board PCB antenna outside the base
   board, and the feed point of the antenna close to the edge of the base board." Of the
   placement figures, only the two corner positions are marked as recommended: the module at a
   corner, with its antenna beyond the edge and the feed point at the corner. Positions centred
   on an edge, or with the feed point away from the corner, are not recommended.
2. **If the antenna cannot overhang,** keep the feed point at the edge anyway. Cut the board
   away on both sides of the antenna and below it. Never place the module mid-board with a
   cut-out on all four sides.
3. **Clearance area** (Figure "Keepout Zone for ESP32-C3 Module's Antenna"): at least 15 mm
   either side of the antenna region and 15 mm beyond it. The figure draws the antenna region
   6 mm deep; it is a generic drawing.
4. **Ground beside the antenna.** "Sufficient ground copper and dense ground vias should be
   placed on the base board near the antenna."
5. **The enclosure, and anything near it.** "A clearance of at least 15 mm is recommended in
   all directions" once the board is installed.
6. **Noisy lines away from the antenna.** Keep the USB port, USB-to-serial parts and UART
   lines, "including traces, vias, test points, header pins", as far from the antenna as
   possible, and surround UART traces with ground copper (HDG, PCB Layout > RF and UART).
7. **Two layers are fine.** Keep components off the bottom layer and traces there to a minimum,
   with "a complete GND plane for the chip, RF, and crystal" (HDG, General Principles of PCB
   Layout for the Chip). Here that means a solid ground pour under the module body, except
   under the antenna.

For the strip: the module belongs at one end of the strip, at the outer corner away from the
fingers, with the antenna overhanging the end or the outer long edge. The panel's bus bars,
the M4 studs, the 30 A pours and any metal bulkhead are all ground or metal in the antenna's
near field. Rule 5's 15 mm applies to them as much as to an enclosure. Rule 3 also bars all
copper from the clearance area, including the 30 A current-path pours.

## Open for the pin-map and programming tickets

- Whether to wire GPIO0, 1 and 4 to anything: a divider for supply voltage on one of them is
  cheap.
- Whether GPIO10 drives an LED or is left unconnected as ESPHome's dummy `pin_s3`.
- The USB connector, and whether the strip gets one at all or only pads (programming ticket).
- The ADC filter placement above, and the CC6905's orientation for the calibrated range.

[ds-mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf
[ds-c3]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf
[trm]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_technical_reference_manual_en.pdf
[hdg-sch]: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/schematic-checklist.html
[hdg-pcb]: https://docs.espressif.com/projects/esp-hardware-design-guidelines/en/latest/esp32c3/pcb-layout-design.html
[idf-jtag]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32c3/api-guides/jtag-debugging/configure-other-jtag.html
