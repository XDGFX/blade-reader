---
date: 2026-10-10
issue: 45
map: 40
---

# Yoke: which module and ADC arrangement reads 24 lines on one board

Answers [#45](https://github.com/XDGFX/blade-reader/issues/45) for the yoke map
([#40](https://github.com/XDGFX/blade-reader/issues/40)). *Yoke*, *arm* and *chin* are that map's
working words. The yoke reads 12 sensor outputs, 12 way voltages, a temperature and the supply
voltage: 26 lines. Rev A reads the supply from the way voltages
([#29](https://github.com/XDGFX/blade-reader/issues/29)), and a yoke would want a temperature
sensor on each arm, so 26 is still the working figure.

Prices are USD from the JLCPCB parts API on 2026-10-10, at the 10+ break unless a part has none
below 50, where the 1+ price is given. Stock is JLC's assembly stock on the same day.

## Executive summary

**Recommendation: keep the ESP32-C3-MINI-1-H4X and use four CD4051Bs, one at each end of each
arm, exactly as rev A splits them.** It is rev A's arrangement twice over, with the two commons
doubled. Nothing about a way's column, the channel's lane plan or the mux input order changes.

**Runner-up: the same module with two 16:1 74HC4067PWs on the chin.** It keeps rev A's pin map
whole and empties the arms, but all 12 of an arm's lines then meet at its root, which is one more
lane than rev A's channel holds.

| | A. C3 + 4 × CD4051B, split by end (recommended) | B. C3 + 2 × 74HC4067PW on the chin (runner-up) | C. C6-MINI-1-H4 + 4 × CD4051B | D. C3 + 4 × ADC128S102 (SPI) |
|---|---|---|---|---|
| Parts | C41349510 + 4 × C21379 | C41349510 + 2 × C179326 | C6553337 + 4 × C21379 | C41349510 + 4 × C179666 |
| Price | 2.63 + 4 × 0.26 = **$3.66** | 2.63 + 2 × 0.37 = **$3.37** | 3.91 + 1.03 = $4.94 | 2.63 + 4 × 2.57 = $12.89 |
| JLC class | Module extended; mux preferred, no fee | Module and mux both extended | Module extended; mux preferred | Module and ADC both extended |
| Stock | 301 modules; 128,595 muxes | 301; 12,199 | **0 modules** | 301; 4,300 |
| Module grade | 105 °C | 105 °C | 105 °C | 105 °C |
| Mux or ADC grade | −55 to 125 °C | −40 to 125 °C | −55 to 125 °C | −40 to 105 °C |
| Inputs | 32, 6 spare | 32, 6 spare | 32, 6 spare | 32, 6 spare |
| ADC pins | All 4 clean ones used, none spare | 2 used; GPIO0 spare, GPIO1 on the LED | 4 used, 1 clean spare (3 if the SDIO straps are used) | None used |
| GPIO left over | 1 (GPIO18 or 19, after the LED takes the other) | 2 (GPIO18, 19) | 3 | 2 (GPIO18, 19) |
| ESPHome | `cd74hc4067` with a dummy `pin_s3`, as rev A | `cd74hc4067` as written | Same as A; ESP-IDF only | `adc128s102`, native |
| Rev A column | Unchanged | Unchanged | Unchanged | Unchanged |
| Rev A pin map | Commons and selects stay; GPIO0 and 1 become commons; LED moves | Stays; GPIO10 becomes the fourth select | All new: the pin assignment differs | Selects become SPI |
| Lines at each arm's root, parts on the arm | **5** | 5 | 5 | 5, all digital |
| Lines at each arm's root, parts on the chin | 13 | **13** | 13 | 13 |
| Most lanes in the channel | 11, as rev A | 13 | 11 | 11 |

Each arm also carries 3V3, GND and VSUP in every case.

What decides it:

- **No module reads 26 lines by itself.** The most ADC1 pins on any Wi-Fi module is 10, on the
  ESP32-S3. Every arrangement needs multiplexers or external ADCs, so more ADC pins only buy
  spares.
- **No better 105 °C module can be bought today.** The ESP32-C6-MINI-1-H4 has no stock at JLC or
  LCSC. Every ESP32-S3-MINI-1 and ESP32-C6-WROOM-1 is an 85 °C part.
- **The arms set the choice between A and B.** With a multiplexer at each end of an arm, the
  channel carries what rev A's already carries. With everything on the chin, it must carry 13
  lanes where rev A's has room for 12.
- **The extended fee no longer separates A from B.** JLC lists every MINI-1 module as Standard
  PCBA only ([#41](https://github.com/XDGFX/blade-reader/issues/41)), and that ticket's fee
  figures charge a Standard order per part type whatever its class. If
  [#43](https://github.com/XDGFX/blade-reader/issues/43) finds a way back to Economic, B costs
  one more fee of about $3 an order.
- **External ADCs cost about $9 more a yoke** and fix nothing that rev A's Accuracy decision
  hasn't already dealt with by calibrating each way.

Take B instead if [#48](https://github.com/XDGFX/blade-reader/issues/48) finds the arms can lose
their end ears, since A needs an ear at the open end of each arm for a multiplexer.

## Modules

### Pins

From each module datasheet's pin table and strapping section, and each chip datasheet's
peripheral pin table ([C3-MINI-1][ds-c3mini] v2.2, [C6-MINI-1][ds-c6mini] v1.5,
[C6-WROOM-1][ds-c6wroom] v1.4, [S3-MINI-1][ds-s3mini] v1.7, [S3-WROOM-1][ds-s3wroom] v1.8).

| | C3-MINI-1 | C6-MINI-1 | C6-WROOM-1 | S3-MINI-1 | S3-WROOM-1 |
|---|---|---|---|---|---|
| Size, mm | 13.2 × 16.6 | 13.2 × 16.6 | 18 × 25.5 | 15.4 × 20.5 | 18 × 25.5 |
| GPIO brought out | 15 | 22 | 23 | 39 | 36 |
| ADC1 pins | 5: GPIO0–4 | 7: GPIO0–6 | 7: GPIO0–6 | 10: GPIO1–10 | 10: GPIO1–10 |
| Strapping pins | 2, 8, 9 | 4, 5, 8, 9, 15 | as C6-MINI-1 | 0, 3, 45, 46 | as S3-MINI-1 |
| USB pins | 18, 19 | 12, 13 | 12, 13 | 19, 20 | 19, 20 |
| UART0 TX, RX | 21, 20 | 16, 17 | 16, 17 | 43, 44 | 43, 44 |
| **Clean ADC1 pins** | **4**: 0, 1, 3, 4 | **5**: 0–3, 6 | 5 | **9**: 1, 2, 4–10 | 9 |
| Other free GPIO | 4: 5, 6, 7, 10 | 8 | 9 | 21 or 22 | 19 |

"Clean" leaves out strapping pins. "Other free" also leaves out the USB and UART0 pins. The yoke
has no USB socket, so the two USB pins can serve as plain GPIO on any of them; on the C3, GPIO18
glitches high for 50 µs at power-up ([C3 datasheet][ds-c3], Table 2-2).

- **ADC2 is no use on any of them.** The C3's "is no longer supported, due to hardware
  limitations" ([ESP-IDF, C3][idf-c3]). The S3's "is also used by Wi-Fi" ([ESP-IDF, S3][idf-s3]).
  The C6 has none.
- **The C6's GPIO4 and 5 straps only set the SDIO clock edge** ([C6-MINI-1][ds-c6mini], strapping
  section), so with care it has 7 usable ADC pins.
- **The C6-MINI-1 has the C3-MINI-1's outline and pad pattern but not its pin assignment.** Only
  3V3, EN, IO0–3, IO8, IO9 and UART0 sit on the same pads. IO4–7 and IO10 move, so the way 1
  ear's routing would not carry over even on the strip.

### Temperature grade, price and stock

Grades are from each module datasheet's ordering table. JLC data is from its parts API; the
assembly type is from each JLC part page, read through a summariser and not as a raw field.

| Module | LCSC | Grade | Price, 10+ | Stock | JLC class | Assembly type |
|---|---|---|---|---|---|---|
| ESP32-C3-MINI-1-H4X | C41349510 | 105 °C | 2.63 | 301 | extended | Standard only, X-ray |
| ESP32-C6-MINI-1-H4 | C6553337 | 105 °C | 3.91 | **0** | extended | Standard only, X-ray |
| ESP32-C6-MINI-1-H8 | C42403058 | 105 °C | 12.28 | **0** | extended | Standard only, X-ray |
| ESP32-C6-MINI-1-N4 | C5736265 | 85 °C | 3.51 | **0** | extended | Standard only, X-ray |
| ESP32-C6-MINI-1U-H4 | C20627095 | 105 °C | 3.86 | 2,165 | extended | Economic and Standard, X-ray |
| ESP32-C6-WROOM-1-N8 | C5366877 | 85 °C | 3.76 | 2,669 | extended | Economic and Standard |
| ESP32-C6-WROOM-1-N4 | C6034714 | 85 °C | 3.96 | 377 | extended | Economic and Standard |
| ESP32-S3-MINI-1-N8 | C2913206 | 85 °C | 4.15 | 3,744 | extended | Standard only, X-ray |
| ESP32-S3-MINI-1-N4R2 | C3013941 | 85 °C | 4.48 | 1,103 | extended | Standard only, X-ray |
| ESP32-S3-WROOM-1-N4 | C2913197 | 85 °C | 3.65 | 2,691 | extended | Standard only, X-ray |

- **The 105 °C ESP32-S3 options don't exist at JLC.** The S3-MINI-1-H4R2 was removed from the
  module datasheet in v1.1 ([S3-MINI-1][ds-s3mini], revision history). The S3-WROOM-1-H4 is in
  its datasheet but not listed at JLC.
- **The C6-MINI-1U-H4 is the only C6 in stock at 105 °C**, and it needs an external antenna on a
  connector. It is the one to revisit if the antenna ticket
  ([#47](https://github.com/XDGFX/blade-reader/issues/47)) ends up wanting one.
- **The ESP32-C5-MINI-1 and ESP32-C61-MINI-1 add nothing.** Both are 85 °C only; the C61 has 4
  ADC1 pins, and the C5 has no stock.
- **JLC shows the castellated S3-WROOM-1 as Standard only but the C6-WROOM-1 as Economic.** That
  is odd enough to confirm in the order flow before relying on it;
  [#43](https://github.com/XDGFX/blade-reader/issues/43) owns the question.

### ADC accuracy

Each chip datasheet's ADC characteristics table, after calibration, at the highest attenuation
([C3][ds-c3] v2.4, [C6][ds-c6] v1.5, [S3][ds-s3] v2.2):

| Chip | Total error | Over | DNL / INL, LSB |
|---|---|---|---|
| ESP32-C3 | ±35 mV | 0–2500 mV | ±7 / ±12 |
| ESP32-C6 | ±40 mV | 0–3300 mV | −8…+12 / ±10 |
| ESP32-S3 | ±50 mV | 0–2900 mV | ±4 / ±8 |

None is better than the C3 over the range rev A uses. The C6's figure holds to the rail, where
the C3's stops at 2.5 V; rev A already works round that by pointing each sensor so load current
drives its output down ([#4](https://github.com/XDGFX/blade-reader/issues/4)).

## Multiplexers and external ADCs

Electrical figures are from the manufacturers' datasheets, read on 2026-10-10. Whether JLC places
each under Economic PCBA was not read; all are ordinary leaded packages.

| Part | LCSC | Inputs | Price | Stock | JLC class | Grade | Notes |
|---|---|---|---|---|---|---|---|
| CD4051BM96, SOIC-16 | C21379 | 8 | 0.26 (1+) | 128,595 | **preferred** | −55 to 125 °C | 9.9 × 3.9 body. 470 Ω typical, 1050 Ω max at 5 V; nothing specified at 3.3 V ([TI][ti-4051]) |
| CD4051BPWR, TSSOP-16 | C54587 | 8 | 0.24 (1+) | 26,494 | extended | −55 to 125 °C | 5 × 6.4 over the pins |
| 74HC4051D, SOIC-16 | C9386 | 8 | 0.22 (1+) | 14,521 | extended | not read | |
| 74HC4067PW, TSSOP-24 | C179326 | 16 | 0.37 | 12,199 | extended | −40 to 125 °C | 110 Ω typical, 180 Ω max at 4.5 V; 2–10 V supply ([Nexperia][nx-4067]) |
| CD74HC4067SM96, SSOP-24 | C98457 | 16 | 0.46 | 8,504 | extended | −55 to 125 °C | 8.2 × 7.4. 90 Ω typical at 4.5 V ([TI][ti-4067]) |
| ADC128S102, TSSOP-16 | C179666 | 8, 12-bit SPI | 2.57 | 4,300 | extended | −40 to 105 °C | Reference is its supply. INL ±1 LSB, offset ±2.3 LSB ([TI][ti-adc128]) |
| MCP3208-CI/SL, SOIC-16 | C626764 | 8, 12-bit SPI | 2.87 | 600 | extended | −40 to 85 °C | Reference pin. INL ±2 LSB ([Microchip][mc-3208]) |
| MCP3008-I/SL, SOIC-16 | C2651321 | 8, 10-bit SPI | 2.43 | 2,154 | extended | not read | |
| ADS1115, VSSOP-10 | C37593 | 4, 16-bit I²C | 1.07 | 19,783 | extended | −40 to 125 °C | 4 addresses a bus, 860 SPS ([TI][ti-ads1115]) |
| TLA2528, WQFN-16 | C2866175 | 8, 12-bit I²C | 1.82 | 4,263 | extended | −40 to 85 °C | 8 addresses. **No ESPHome component** ([TI][ti-tla2528]) |
| ADS7828, TSSOP-16 | C701649 | 8, 12-bit I²C | 4.05 | 3,221 | extended | not read | No ESPHome component |
| ADS7953, VQFN-32 | C2670383 | 16, 12-bit SPI | 7.46 | 2,676 | extended | not read | No ESPHome component |

- **C21379 is still the only preferred multiplexer.** No 4051 or 4067 is basic, and the only
  other preferred part in the family is the CD4052B (C6521), a dual 4:1.
- **The CD4051B is unspecified at 3.3 V**, as rev A already accepts: its tables start at 5 V. Its
  on-resistance is why rev A waits 5 ms after each step.
- **The cheapest external ADC with an ESPHome component is the ADC128S102**, at ten times the
  CD4051B's price. It is also the only one rated to 105 °C.

## ESPHome

Read from ESPHome 2026.9.1, the release of 2026-09-29.

- **One `cd74hc4067` hub can serve every multiplexer on shared selects.** Each mux sensor names
  its own `adc` sensor as its source, so four commons on four ADC pins need one hub, not four
  ([component source][eh-mux-src]).
- **Don't give each multiplexer its own hub on the same select pins.** Each hub remembers the
  input it last selected and skips the write when asked for the same one, so a second hub can
  read the wrong input ([`cd74hc4067.cpp`][eh-mux-src]). ESPHome also rejects a pin used twice
  unless `allow_other_uses` is set ([configuration types][eh-pins]). **This applies to rev A's two
  multiplexers as well.**
- **`pin_s3` is still required**, and inputs run 0–15 ([`__init__.py`][eh-mux-src]). A 4051 needs
  a spare GPIO that goes nowhere, as rev A planned. There is no 4051 or general mux component.
- **The `adc` component takes GPIO0–4 on the C3, 0–6 on the C6 and 1–10 on the S3**, and applies
  the factory calibration ([`adc/__init__.py`][eh-adc-src]).
- **ESP-IDF is the default framework, and the only one for the C6** ([ESP32 platform][eh-esp32]).
  The bundled version is 5.5.5, which meets the C3 v1.1's need for 5.2 or later
  ([`esp32/__init__.py`][eh-esp32-src]; [ESP-IDF compatibility][idf-compat]).
- **External ADC components that exist:** `ads1115` (also the ADS1015), `ads1118`, `mcp3008`,
  `mcp3204` (also the MCP3208) and `adc128s102`. **None exists** for the ADS7828, ADS7128,
  TLA2528, ADS7953, AD7490 or MAX1161x.
- **A sweep blocks for the mux delay at each step.** With one hub, the four commons can be read
  at each of 8 steps, so a sweep is 8 steps of 5 ms, not 26. This is worked out from the source;
  the docs give no figure.

## What each arm carries

Counted from rev A's routing in `board/lib/routes.tsx`. The channel is the ring face between the
GND bus and the load copper, 1.0 to 6.3 out, under the sensors. It stays whatever the arm's depth
becomes, because the sensor band doesn't move.

- **Rev A's channel holds 12 lanes and 3V3.** Lanes sit on a 0.35 pitch from 1.45 out, and 3V3
  runs at 5.8. Rev A uses 11 at its fullest point: the three selects and mux 2's common running
  the whole strip, the temperature line, and six lines from three ways.
- **A way's column gives two lines to the channel**, its sensor output and its voltage, and takes
  3V3 and GND from it. No arrangement here changes that.

| Arrangement | Lines crossing each arm's root | Most lanes in the channel |
|---|---|---|
| Two 8:1 on the arm, one at each end | 5: three selects, two commons | 11, as rev A |
| 8:1 at the open end on the arm, the other on the chin corner | 11: three selects, one common, six way lines, temperature | 11, as rev A |
| Everything on the chin | 13: twelve way lines, temperature | **13**, one over |
| One 16:1 on the arm at its root | 5: four selects, one common | **13**, one over, just short of the mux |
| Two SPI ADCs on the arm, one at each end | 5: clock, two data, two selects | 11, as rev A |

Add 3V3, GND and VSUP to each. VSUP is new to the arm's root: the ways' SS210s feed a supply that
is now on the chin.

- **Thirteen lanes can be had**, by moving 3V3 to the parts face, putting the temperature sensor
  on the chin, or tightening the pitch. Each undoes part of what rev A proved. With the
  temperature sensor on the chin it is 12, with no lane to spare.
- **Twelve analogue lines would run beside each other, the longest the length of the arm.** Rev A
  runs one common about 85 mm, so a long analogue line is not new, but there it is one line.
- **The second row in the table is rev A's arm with the chin in place of one ear.** The mux
  nearest the chin can sit either side of the root with nothing else changing.

## The recommendation in detail

**A. ESP32-C3-MINI-1-H4X with four CD4051Bs, split by end.**

| Function | Pin |
|---|---|
| Commons, one a multiplexer | GPIO0, 1, 3, 4, each with 10 nF at the pin |
| Selects, shared by all four | GPIO5, 6, 7 |
| ESPHome's dummy `pin_s3` | GPIO10, unconnected |
| Status LED | GPIO18 or 19 |
| Strapping, UART0 | GPIO2, 8, 9 and GPIO20, 21, as rev A |

- **What survives from rev A:** each way's column, the channel's lane plan, each multiplexer's
  input order, the commons on GPIO3 and 4, the selects, the strapping and programming circuit.
- **What changes:** GPIO0 and 1 become commons, so GPIO0's test pad goes and the LED moves to a
  USB pin. One arm joins the chin at its way 1 end and the other at its way 6 end, so one arm's
  multiplexers are rev A's as drawn and the other's swap ends.
- **Its weakness is that no ADC pin is spare.** Nothing known needs one: the temperature and
  supply go through the six spare multiplexer inputs.
- **It needs an ear at each arm's open end** for a SOIC-16. Rev A's way 6 ear holds one above the
  ground nut, and the ground nut moves to the chin, so the ear can be shallower than rev A's.

**B. The same module with two 74HC4067PWs on the chin** keeps GPIO3 and 4 as commons, GPIO5–7 as
selects and GPIO1 as the LED. GPIO10 becomes a real fourth select, which ESPHome wants anyway, and
GPIO0 stays a spare ADC pin. The arms carry only their columns and can lose their ears. Its price
is the thirteenth lane and, on an Economic order, one more extended fee.

## Not confirmed

- The assembly type of each multiplexer and ADC at JLC. The modules' types were read through a
  page summariser.
- LCSC's own stock for the modules marked "not read" by the reader; JLC's stock matched LCSC's
  wherever both were read.
- That a Standard PCBA order charges preferred and extended parts alike. It comes from
  [#41](https://github.com/XDGFX/blade-reader/issues/41)'s fee table, not from this note's
  reading.
- Whether an arm's open-end ear survives the arm depth ticket
  ([#48](https://github.com/XDGFX/blade-reader/issues/48)). The choice between A and B turns on
  it.
- The 74HC4067PW's body length; its datasheet gives a 4.4 mm body width.

[ds-c3]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf
[ds-c6]: https://www.espressif.com/sites/default/files/documentation/esp32-c6_datasheet_en.pdf
[ds-s3]: https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf
[ds-c3mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf
[ds-c6mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c6-mini-1_mini-1u_datasheet_en.pdf
[ds-c6wroom]: https://www.espressif.com/sites/default/files/documentation/esp32-c6-wroom-1_wroom-1u_datasheet_en.pdf
[ds-s3mini]: https://www.espressif.com/sites/default/files/documentation/esp32-s3-mini-1_mini-1u_datasheet_en.pdf
[ds-s3wroom]: https://www.espressif.com/sites/default/files/documentation/esp32-s3-wroom-1_wroom-1u_datasheet_en.pdf
[idf-c3]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32c3/api-reference/peripherals/adc/adc_oneshot.html
[idf-s3]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/adc/adc_oneshot.html
[idf-compat]: https://github.com/espressif/esp-idf/blob/master/COMPATIBILITY.md
[ti-4051]: https://www.ti.com/lit/ds/symlink/cd4051b.pdf
[ti-4067]: https://www.ti.com/lit/ds/symlink/cd74hc4067.pdf
[nx-4067]: https://assets.nexperia.com/documents/data-sheet/74HC_HCT4067.pdf
[ti-adc128]: https://www.ti.com/lit/ds/symlink/adc128s102.pdf
[mc-3208]: https://ww1.microchip.com/downloads/en/DeviceDoc/21298e.pdf
[ti-ads1115]: https://www.ti.com/lit/ds/symlink/ads1115.pdf
[ti-tla2528]: https://www.ti.com/lit/ds/symlink/tla2528.pdf
[eh-mux-src]: https://github.com/esphome/esphome/tree/2026.9.1/esphome/components/cd74hc4067
[eh-adc-src]: https://github.com/esphome/esphome/blob/2026.9.1/esphome/components/adc/__init__.py
[eh-esp32-src]: https://github.com/esphome/esphome/blob/2026.9.1/esphome/components/esp32/__init__.py
[eh-esp32]: https://esphome.io/components/esp32/
[eh-pins]: https://esphome.io/guides/configuration-types/
