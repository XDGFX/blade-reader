---
date: 2026-11-03
issue: 104
map: 103
---

# Does the CC6905's output follow its supply?

Answers #104 for the CC6905S8-3FB030 (LCSC C41421490), the yoke's hall sensor.

## Answer

**No. The zero and the sensitivity are both fixed, not ratiometric.** The zero is the VREF
pin's voltage, which is a factory-trimmed internal reference (1.65 V nominal). The sensitivity is
a fixed 44 mV/A, and stays 44 mV/A even when VREF is driven from outside. The datasheet gives the
transfer function in absolute millivolts, with no V<sub>CC</sub> term, and nowhere uses the word
"ratiometric" ([datasheet rev 1.3][ds], pp. 42–44).

So a way's zero does not measure the 3.3 V rail, and the firmware can't correct gain from it.
The rail has no share of the gain error to correct anyway: the ESP32-C3's ADC also measures
against an internal reference, not the rail. Per-way zero and gain calibration
(`docs/design.md`, Accuracy) remains the way to remove these errors.

Confidence: **high** that the part is specified as fixed. The datasheet gives no supply-rejection
figure, though, so how far the zero moves across V<sub>CC</sub> 3.0–3.6 V is not stated. Only a
bench test with a variable supply would put a number on it.

## What the datasheet says

All from Cross Chip's datasheet rev 1.3 (2024-09-18, the latest in its revision history), as
served by LCSC for C41421490 ([ds]).

| Item | Figure | Where |
|---|---|---|
| Zero, V<sub>OUT(Q)</sub>, 25 °C, I<sub>P</sub> = 0 | 1.64 / 1.65 / 1.66 V (min / typ / max) | 3FB030 table, p. 11 |
| Zero drift, ΔV<sub>OUT(Q)</sub>, −40…125 °C | ±20 mV | p. 11 |
| V<sub>OUT</sub> − V<sub>REF</sub> (V<sub>OE</sub>), 25 °C | ±5 mV | p. 11 |
| V<sub>OE</sub> drift, −40…125 °C | ±20 mV | p. 11 |
| VREF output, 3.3 V bidirectional series | 1.60 / 1.65 / 1.70 V | general table, p. 6 |
| VREF after factory trim | "nominal value error ≤ 5 mV" | p. 42 |
| Sensitivity | 44 mV/A typ, no min or max | p. 11 |
| Sensitivity error at room temperature | ±1 % | front page features (all variants) |
| Sensitivity error, −10…125 °C / −40…−10 °C | ±2.5 % / ±3.5 % | p. 11 |
| Total output error at 30 A, −10…125 °C / −40…−10 °C | ±3 % / ±4 % | p. 11 |
| Noise, I<sub>P</sub> = 0 | 10 mV (stated as rms) | p. 11 |
| Supply, 3.3 V series | 3.0–3.6 V, UVLO release 2.8 V | p. 6 |
| Linear output range at 3.3 V | 0.33–2.97 V (±1.32 V about the zero) | pp. 43, 45 |

The sensitivity error at 25 °C is only in the front-page feature list; the 3FB030 table gives
none for 25 °C. Take ±1 % as typical, not a guaranteed limit.

## The VREF pin

Pin 6. It has two modes (p. 42):

- **Output mode** (the yoke's case: VREF carries only its filter capacitor to GND). VREF is the
  internal reference, factory-trimmed to within 5 mV of 1.65 V. It can source 2.8 mA and sink
  6 mA typical; Cross Chip recommends loading it no more than 2 mA. V<sub>OUT</sub> =
  1650 mV + I<sub>P</sub> × 44 mV/A (p. 43).
- **Input mode**. An external source stronger than VREF's buffer (Cross Chip suggests ±10 mA
  drive) overrides it, anywhere in 0–4 V. Then V<sub>OUT</sub> = V<sub>REF</sub> +
  I<sub>P</sub> × 44 mV/A, and "the sensitivity of CC6905 remains unchanged" (pp. 42, 44).

This is the strongest sign the part is not ratiometric. The quiescent output follows VREF, not
V<sub>CC</sub>, and the gain is set inside the signal chain independently of either.

A ratiometric design could be made from it: drive VREF from a divider on the ADC's reference.
That only helps when the ADC is itself ratiometric to the same rail, which the ESP32-C3's is not.

## The bench zeros

Idle zeros near 1.638 V sit 2 mV under the 1.64 V minimum for V<sub>OUT(Q)</sub>. That is well
inside the ESP32-C3's ±35 mV total ADC error at 12 dB attenuation
(`way-monitor-adc.md`, from Espressif's datasheet), so the readings can't separate sensor offset
from ADC offset. On the even arm the 0.820 divider's resistor tolerance adds to it, but that is a
ratio of resistors and also does not depend on the rail. Had the part been ratiometric, a
1.638 V zero would imply a 3.276 V rail; nothing in the datasheet supports reading it that way.

Every source of that 12 mV (sensor V<sub>OE</sub> and VREF trim, ADC offset, divider ratio) is
fixed per way at a given temperature, so the per-way zero calibration already removes it. Gain
needs a known current per way, as `docs/design.md` already decides.

## Open

- **Supply rejection is unspecified.** To measure it, power one sensor from a bench supply at
  3.0, 3.3 and 3.6 V and log V<sub>OUT</sub> with a meter at 0 A. Not needed for the yoke, whose
  rail is regulated; only worth doing if the rail is ever expected to move.

## Sources

- Cross Chip, CC6905 datasheet rev 1.3, served by LCSC for C41421490:
  [ds]. Pages cited above: 6 (electrical parameters), 11 (CC6905S8-3FB030 table), 42 (VREF
  input and output), 43–44 (transfer functions), 45 (offset definition, output range).
- `docs/research/way-monitor-adc.md`: ESP32-C3 ADC error at 12 dB attenuation.
- `docs/research/way-monitor-power-supply.md` reached the same "fixed, not ratiometric" reading
  from the same datasheet; this note confirms it with page references and the VREF input-mode
  statement.

[ds]: https://datasheet.lcsc.com/datasheet/pdf/81a1e0bc6663e21b6354e013ad7b1200.pdf?productCode=C41421490
