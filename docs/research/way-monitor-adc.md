---
date: 2026-10-09
issue: 188
map: 178
---

# Way monitor: ESP32 analogue channels and how to extend them

Answers XDGFX/hailey#188: how many hall-sensor outputs one ESP32 can read while Wi-Fi runs, and what it
costs to read more, so the **way monitor** can be one ESP per 6, 12 or 24 **ways**.

Prices are JLCPCB/LCSC unit prices at qty 1, USD, read from the JLCPCB parts API on
2026-10-09. They move; recheck at BOM time. Every part below is **extended** unless marked
*preferred*. No ESP32 chip or module is a basic or preferred part.

## Answer

**One ESP32-C3-MINI-1 plus CD4051B multiplexers, one ESP per 24 ways.** About USD 3.80 for
the ESP and the multiplexers. The multiplexer is a preferred part, so the only extended-part
fee is the one USD 3 for the module.

| Topology | Cheapest build | Parts cost | Extended-part fees |
|---|---|---|---|
| 1 ESP per 24 ways | C3-MINI-1 + 3 × CD4051B (24 ch) | 3.03 + 0.77 = **USD 3.80** | USD 3 (module) |
| 1 ESP per 12 ways (×2) | C3-MINI-1 + 2 × CD4051B (16 ch) each | 2 × 3.55 = **USD 7.10** | USD 3 (one part type) |
| 1 ESP per 6 ways (×4) | C3-MINI-1 + 1 × CD4051B, or C6-MINI-1 alone | 4 × 3.29 = **USD 13.16** | USD 3 |

24 ways on one ESP saves about USD 3.30 against one per panel. The catch is that 12 analogue
lines, or 3 select lines plus 2 multiplexed analogue lines, have to cross between Fuse Panel A
and Fuse Panel B. That is a board-to-board cable decision for XDGFX/hailey#178, not an ADC limit. Per-panel
boards keep one identical design per panel, which the map has already settled.

Native ADC1 channels alone never reach 12. An ESP per 6 ways buys nothing: 4 modules cost
more than 1 module plus 2 multiplexers.

## Usable ADC1 channels with Wi-Fi on

ADC2 is out on every variant that has it:

- **ESP32 (classic) and S3**: "ADC2 is also used by Wi-Fi", and the driver arbitrates
  between them ([ESP-IDF ADC oneshot, ESP32][idf-esp32]; [S3][idf-s3]). The S3 datasheet
  says ADC2 "cannot be used with Wi-Fi simultaneously" ([ESP32-S3 datasheet §4.2.2.1][ds-s3]).
- **C3**: "ADC2 oneshot mode is no longer supported, due to hardware limitations. The results
  are not stable" ([ESP-IDF, C3][idf-c3]); see also the C3 SoC errata.
- **C6**: has a single ADC with up to 7 channels and no ADC2 ([ESP32-C6 datasheet][ds-c6]).

| Variant | ADC1 pins (chip) | Exposed on the cheapest module | Strapping overlap | Total error at max attenuation |
|---|---|---|---|---|
| ESP32 | 8: GPIO32–39 | **6** on WROOM-32E (36, 39, 34, 35, 32, 33) | none | ±60 mV over 150–2450 mV |
| ESP32-C2 (ESP8684) | 5: GPIO0–4 | 5 | — | not checked |
| ESP32-C3 | 5: GPIO0–4 | 5 on C3-MINI-1 | **GPIO2** (pull-up recommended) | ±35 mV over 0–2500 mV |
| ESP32-C6 | 7: GPIO0–6 | 7 on C6-MINI-1 | GPIO4, GPIO5 (floating by default) | ±40 mV over 0–3300 mV |
| ESP32-S3 | 10: GPIO1–10 | 10 on S3-MINI-1 | GPIO3 (JTAG source) | ±50 mV over 0–2900 mV |
| ESP32-H2 | 5 | — | — | no Wi-Fi, so ruled out |

Sources: pin lists from [ESPHome ADC][esphome-adc] and the module datasheets
([WROOM-32E][ds-wroom32e], [C3-MINI-1][ds-c3mini], [C6-MINI-1][ds-c6mini],
[S3-MINI-1][ds-s3mini]). Error figures are each chip datasheet's "ADC characteristics"
table, after factory calibration ([ESP32][ds-esp32] Table 4-4, [C3][ds-c3] §5, [C6][ds-c6]
§5, [S3][ds-s3] §5). DNL/INL are ±7/±12 LSB on ESP32 and C3, −8…+12/±10 LSB on C6, and
±4/±8 LSB on S3. The datasheets suggest averaging several samples to improve DNL.

C3 strapping: "GPIO2 actually does not determine SPI Boot and Joint Download Boot mode, but it
is recommended to pull this pin up due to glitches" ([C3 datasheet, Table 3-3][ds-c3]). Treat
the C3 as **4 clean ADC1 pins** (GPIO0, 1, 3, 4). The design below needs 3, so GPIO2 can stay
pulled up.

Accuracy against the ±0.3 A target: ±35 mV on the C3 is ±0.3 A only if the sensor gives
at least about 117 mV/A. Firmware zeroing removes most of the offset part of that error, so
the real limit is gain error and noise. That limit belongs to the sensor ticket, and depends on
its mV/A figure.

## Ways to add channels

| Option | Channels | LCSC | Price (qty 1) | Status | ESPHome |
|---|---|---|---|---|---|
| **CD4051B** 8:1 mux, 3–20 V | 8 per chip, 1 ADC pin + 3 shared select GPIOs | **C21379** CD4051BM96 | 0.26 | **preferred** (no feeder fee) | `cd74hc4067` component (see caveat) |
| 74HC4051 8:1 mux | 8 | C9386 74HC4051D,653 | 0.21 | extended | same |
| 74HCT4051 8:1 mux (TTL inputs) | 8 | C87239 74HCT4051D,118 | 0.32 | extended | same |
| CD74HC4067 16:1 mux | 16, 1 ADC pin + 4 select | C98457 CD74HC4067SM96 | 0.59 | extended | `cd74hc4067` |
| 74HC4067 16:1 mux | 16 | C179326 74HC4067PW,118 | 0.47 | extended | `cd74hc4067` |
| ADS1115 16-bit I²C ADC | 4 per chip, 4 per bus (16 max) | C37593 ADS1115IDGSR | 1.22 | extended | `ads1115` |
| MCP3008 10-bit SPI | 8 | C2651321 MCP3008T-I/SL | 2.85 | extended | `mcp3008` |
| ADC128S102 12-bit SPI | 8 | C179666 ADC128S102CIMTX/NOPB | 2.89 | extended | `adc128s102` |
| MCP3208 12-bit SPI | 8 | C626764 MCP3208T-CI/SL | 3.33 | extended | `mcp3204` |
| ADS7828 12-bit I²C | 8 | C701649 ADS7828E/2K5 | 4.64 | extended | no component found |

The external ADCs all cost more than a second ESP module per 8 channels, so they only make sense
if the ESP's ADC is not accurate enough. The ADS1115 route for 24 ways is 6 chips (USD 7.32
plus a fee) on two I²C buses.

**Extended-part fee.** JLCPCB charges about USD 3 per extended part type to load feeders
on Economic PCBA. Preferred ("promotional extended") parts are exempt
([JLCPCB PCBA FAQ][jlc-faq]; [assembly price][jlc-price]). On an AUD 40 order this fee
matters as much as the parts do. It is why the preferred CD4051B beats the cheaper 74HC4051.

## Modules (LCSC, qty 1)

| Module | LCSC | USD | Stock | Note |
|---|---|---|---|---|
| ESP32-C3-MINI-1-N4 | C2838502 | 3.03 | 3,897 | **pick** |
| ESP32-C3-WROOM-02-N4 | C2934560 | 3.29 | 10,492 | bigger footprint |
| ESP8684-MINI-1-H4X (ESP32-C2) | C6191511 | 2.48 | 245 | cheapest, but low stock and a cut-down chip |
| ESP32-WROOM-32E-N4 | C701341 | 3.74 | 7,676 | only 6 ADC1 on the module |
| ESP32-C6-MINI-1-N4 | C5736265 | 3.93 | **5** | MINI-1U-H4 C20627095 (4.30) needs an external antenna |
| ESP32-C6-WROOM-1-N8 | C5366877 | 4.22 | 2,738 | |
| ESP32-S3-MINI-1-N8 | C2913206 | 4.71 | 3,782 | |
| ESP32-C3FH4 bare chip | C2858491 | 2.17 | 5,118 | 4 MB flash in package, but needs a crystal, RF matching and an antenna layout: not worth it |

The ESP8684 saves about USD 0.55 against the C3. ESPHome supports the C2 only on ESP-IDF, and
describes it as "a reduced peripheral set" at 120 MHz ([ESPHome ESP32 platform][esphome-esp32]).
With stock at 245 it is not worth the risk for USD 0.55.

## ESPHome caveats

- **Multiplexer component is 16-channel only.** `cd74hc4067` requires `pin_s0`…`pin_s3` and
  `number` 0–15 ([ESPHome cd74hc4067][esphome-mux]). To drive a 4051, give `pin_s3` a spare
  GPIO that isn't wired anywhere and use channels 0–7. Several muxes can share the select pins,
  with one `cd74hc4067` hub per mux, each wrapping its own `adc` sensor.
- **Switch delay** defaults to 2 ms per channel. 24 channels take about 50 ms per sweep, which
  is fine.
- **Set `attenuation: 12db`.** The default is 0 dB, which caps at about 1.1 V. ESPHome
  measured a usable range of about 0.075–3.12 V with `auto` ([ESPHome ADC][esphome-adc]).
  `samples` averages several reads per update, but is ignored when `attenuation: auto`.
- **ADC2 pins** are listed in ESPHome but are not usable with Wi-Fi (see above). Use ADC1 only.
- **C6 and C2** need the ESP-IDF framework in ESPHome. The C3 runs on either framework
  ([ESPHome ESP32][esphome-esp32]).
- **ADS1115**, if used: 4 addresses per bus, 860 SPS default ([ESPHome ADS1115][esphome-ads]).

## Electrical caveats for the multiplexer

- The mux passes only signals between its own rails. If the hall sensors are 5 V ratiometric,
  the mux must run at 5 V too, and the ESP pin needs a divider after it.
- **CD4051B at 5 V needs V_IH ≥ 3.5 V** ([TI CD4051B datasheet][ti-4051]), so a 3.3 V GPIO
  cannot drive its select lines. With 5 V sensors, use the **74HCT4051** (C87239, TTL
  inputs, V_IH 2.0 V) and pay the USD 3 fee. With 3.3 V sensors, the CD4051B runs at 3.3 V
  (rated from 3 V) and the problem goes away.
- CD4051B on-resistance is 470 Ω typical and 1050 Ω maximum at 5 V, and higher at 3.3 V. That
  is harmless into the ESP's sampling input with the 2 ms settle time. The CD74HC4067 is
  90 Ω typical at 4.5 V ([TI CD74HC4067][ti-4067]).

[idf-esp32]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/peripherals/adc/adc_oneshot.html
[idf-s3]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/api-reference/peripherals/adc/adc_oneshot.html
[idf-c3]: https://docs.espressif.com/projects/esp-idf/en/stable/esp32c3/api-reference/peripherals/adc/adc_oneshot.html
[ds-esp32]: https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf
[ds-c3]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf
[ds-c6]: https://www.espressif.com/sites/default/files/documentation/esp32-c6_datasheet_en.pdf
[ds-s3]: https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf
[ds-wroom32e]: https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf
[ds-c3mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c3-mini-1_datasheet_en.pdf
[ds-c6mini]: https://www.espressif.com/sites/default/files/documentation/esp32-c6-mini-1_datasheet_en.pdf
[ds-s3mini]: https://www.espressif.com/sites/default/files/documentation/esp32-s3-mini-1_mini-1u_datasheet_en.pdf
[esphome-adc]: https://esphome.io/components/sensor/adc/
[esphome-mux]: https://esphome.io/components/sensor/cd74hc4067/
[esphome-ads]: https://esphome.io/components/sensor/ads1115/
[esphome-esp32]: https://esphome.io/components/esp32/
[jlc-faq]: https://jlcpcb.com/help/article/pcb-assembly-faqs
[jlc-price]: https://jlcpcb.com/help/article/pcb-assembly-price
[ti-4051]: https://www.ti.com/lit/ds/symlink/cd4051b.pdf
[ti-4067]: https://www.ti.com/lit/ds/symlink/cd74hc4067.pdf
