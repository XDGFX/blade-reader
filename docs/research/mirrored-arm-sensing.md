# Yoke: what the mirrored arm's reversed sensors cost

For [What does running the current backwards through one arm's sensors cost?](https://github.com/XDGFX/blade-reader/issues/73),
part of the [yoke map](https://github.com/XDGFX/blade-reader/issues/71). Worked on paper on
2026-10-11 from the CC6905 datasheet, Espressif's ESP32-C3 datasheet and reference manual, and
rev A's schematic (`board/lib/way.tsx`). Nothing is built or measured. Prices and stock are from
the JLCPCB parts API on 2026-10-11.

## Summary

- **The premise in [#65](https://github.com/XDGFX/blade-reader/issues/65) holds.** The
  CC6905S8-3FB030 is bidirectional, rests at 1.65 V and moves 44 mV/A, up for current
  IP+ → IP− and down for IP− → IP+. Its output is linear from 0.33 V to 2.97 V, which is
  exactly ±30 A. The sensor itself loses nothing run either way.
- **The cost is all at the ADC.** The ESP32-C3 is specified to 2.5 V. Rev A's direction falls
  from 1.65 V to 0.33 V and fits whole. The mirrored arm rises to 2.97 V and passes 2.5 V at
  **19.3 A**.
- **Recommendation: divide the mirrored arm's six sense lines only, 22 kΩ over 100 kΩ (0.820),
  at the multiplexer's inputs.** Both are JLC basic 0402s, about $0.03 a yoke, no fee. That arm
  then reads 1.35 V at rest and 2.43 V at 30 A.
- **What that arm loses against rev A:** 18 % of its signal (36.1 mV/A against 44), so every
  ADC-side error is 22 % larger in amps: about 30 mA a count against 24, and the ADC's ±35 mV is
  ±0.97 A against ±0.80 A before calibration. Sensor noise, offset drift and gain drift are
  unchanged in amps. Its top few amps also depend on the 3.3 V rail, which rev A's do not.
- **Do not divide the other arm to match.** It would give up the same 18 % for nothing: the two
  arms' slopes have opposite signs whatever is done, so the firmware already needs each way's
  own zero and gain.
- **Two corrections to #65.** A 0.77 divider is 23 % less signal, which is 30 % coarser, not
  23 %. And the open question there is closed: the CC6905 drives any load of 1.5 kΩ or more, so a
  43 kΩ or 122 kΩ divider is no burden.
- **Worth a separate look, not part of this recommendation:** the 6 dB ADC range, and the
  unidirectional CC6905S8-3FU030 on the mirrored arm. Either could make a way read better than
  rev A's. See Options.

## The sensor

All from the CC6905 datasheet rev 1.3 ([CC6905][cc6905]).

| | Figure | Where |
|---|---|---|
| Type | Bidirectional, ±30 A | p. 11, p. 43 |
| Transfer | VOUT = 1650 mV + 44 mV/A × I<sub>P</sub> | p. 43 |
| Positive current | IP+ (pins 1–2) to IP− (pins 3–4) | p. 41 |
| Zero-current output | 1.64 / 1.65 / 1.66 V at 25 °C, ±20 mV over −40 to 125 °C | p. 11 |
| Linear output range | 0.33 V to 2.97 V at 3.3 V, so ±1.32 V about 1.65 V | p. 43, p. 45 |
| Beyond it | "Could still work until VSAT, but performance deteriorated". No figure for VSAT | p. 45 |
| Supply | 3.0 / 3.3 / 3.6 V, 10 mA typical | p. 6 |
| Output | "Fixed output": the zero and the sensitivity do not follow the supply. No supply-rejection figure | p. 1 |
| Load on VOUT | 1.5 kΩ minimum to GND; filter capacitor 1 nF typical, 2.2 nF maximum | p. 6 |
| Noise | 10 mV rms at zero current, which is 0.23 A rms | p. 11 |
| Sensitivity error | ±2.5 % from −10 to 125 °C; total error at 30 A ±3.0 % | p. 11 |

±1.32 V at 44 mV/A is ±30.0 A, so the part has no margin past 30 A in either direction. The
datasheet says there is "a certain margin" for manufacturing and advises against using it
(p. 43).

## The ADC

- **Specified range.** At the highest attenuation the calibrated result has a total error of
  ±35 mV over an "effective measurement range" of 0 to 2500 mV. The three lower ranges, 0–750,
  0–1050 and 0–1300 mV, are ±10 mV ([C3 datasheet v2.4][c3-ds], Table 5-6).
- **Linearity.** DNL ±7 LSB and INL ±12 LSB, measured with a 100 nF capacitor on the pin, at
  25 °C with Wi-Fi off (Table 5-5).
- **Count size.** 12 bits span 0 to V<sub>ref</sub>/k, with V<sub>ref</sub> 1100 mV by design
  and k about 25 % at 12 dB and 50 % at 6 dB ([C3 reference manual v1.4][c3-trm], §34.2.3.2).
  That is a nominal 4400 mV full scale and **1.07 mV a count at 12 dB**, 0.54 mV at 6 dB. The
  real full scale on a given chip was not read **[unsourced]**. Every mA-a-count figure here
  rests on it; the ratios between the cases do not.

## Each direction on a 3.3 V supply

| | Rev A's direction (IP− → IP+) | Mirrored, undivided | Mirrored, 22 kΩ / 100 kΩ |
|---|---|---|---|
| At the ADC pin, 0 A | 1.65 V | 1.65 V | 1.352 V |
| At the ADC pin, 30 A | 0.33 V | 2.97 V | 2.434 V |
| Sensor headroom from rest | 1.32 V down, 30 A | 1.32 V up, 30 A | 1.32 V up, 30 A |
| ADC headroom from rest | 1.65 V down, more than the sensor's | 0.85 V up, **19.3 A** | 1.15 V up, 31.8 A |
| Usable range | 30 A | 19.3 A | 30 A |
| Reverse current readable | 19.3 A | 30 A | 30 A |
| Signal at the pin | 44 mV/A | 44 mV/A | 36.1 mV/A |
| One count, nominal | 24.4 mA | 24.4 mA | 29.8 mA |
| ADC total error, ±35 mV | ±0.80 A | ±0.80 A | ±0.97 A |
| ADC INL, ±12 LSB (estimate) | ±0.29 A | ±0.29 A | ±0.36 A |
| Sensor noise | 0.23 A rms | 0.23 A rms | 0.23 A rms |

The ADC rows are before each way's zero and gain calibration, which takes out most of the total
error but not the INL. A count is not the practical floor either: the sensor's noise is about
nine counts rms, so averaging resolves below one.

**The supply matters on the mirrored arm only.** The buck is set to 3.30 V and is expected
between 3.22 and 3.38 V (`way-monitor-power-supply.md`). The sensor's zero and slope are fixed,
so rev A's 30 A always lands at 0.33 V. The mirrored arm's 30 A lands at 2.97 V, which is 0.33 V
under a 3.30 V rail. If the linear range keeps that 0.33 V from the rail, a 3.22 V supply ends
it at 2.89 V, or **28.2 A** (estimate: the datasheet gives the range at 3.3 V only). Above that
the sensor still works, less accurately.

## The divider

**22 kΩ on top (C25768), 100 kΩ to ground (C25741): ratio 0.820.** Both 0402, 1 %,
100 ppm/°C, JLC basic, $0.0024 each at quantity 1, 740,000 and 8.1 million in stock. Twelve
resistors, $0.03 a yoke, no fee. The 100 kΩ is already on the BOM; the 22 kΩ is a new line.

- **Why 0.820.** The ratio must put the sensor's top at or under 2.5 V. Nominally that is
  2.5 / 2.97 = 0.842. With the zero at its 1.68 V maximum and the gain 3 % high, 30 A is 3.04 V,
  which needs 0.822. At 0.820 that worst case is 2.49 V, and 2.50 V with both resistors at their
  limits. A higher ratio gains under 3 % more signal and puts the worst case outside the range.
- **Against #65's 10 kΩ over 33 kΩ (0.767).** Same parts count, both basic. 0.820 keeps 7 %
  more signal; 0.767 leaves 0.17 V more room at the top. Either works. 10 kΩ (C25744) and 33 kΩ
  (C25779) are both basic.
- **Load on the sensor.** 122 kΩ, against a 1.5 kΩ minimum: 24 µA at 30 A.
- **Source resistance.** 18 kΩ into the 10 nF at the multiplexer's common is a 180 µs time
  constant, settled to a count in about 1.5 ms (estimate), inside the 5 ms rev A waits after each
  step. Rev A's voltage lines already come from a 6.4 kΩ divider.
- **A gain.** The same RC is a low-pass at about 880 Hz. The sensor's own output capacitor is
  capped at 2.2 nF, so rev A cannot filter this hard. Noise on the divided arm should be lower
  than on the other (estimate, not measured).
- **Tolerance and drift.** 1 % resistors move the ratio ±0.36 %, taken up by each way's gain
  calibration. At 100 ppm/°C each the ratio can drift 36 ppm/°C, 0.2 % over 60 °C, against the
  sensor's own ±2.5 %.
- **Where.** On the chin at the multiplexer's inputs, as #65 has it. One divider after the
  common would scale that arm's voltage and temperature lines too.

## Should both arms be divided alike?

No.

- **The firmware cannot treat the 12 ways alike anyway.** One arm's reading falls with load and
  the other's rises. Each way already has its own zero and gain (`docs/design.md`, Accuracy), and
  a gain of −44 or +36 mV/A is the same code.
- **It costs the good arm 18 % of its signal** and 12 more resistors, to make the two slopes
  equal and opposite.
- **The one thing it would buy** is the RC filter on both arms. If the divided arm proves
  quieter on the first board, a series resistor on the other arm's lines would do that without
  giving up signal.

## What is lost against rev A

On the six mirrored ways, with the divider:

- **Signal:** 36.1 mV/A against 44, 18 % less.
- **ADC-side error in amps, 22 % more:** a count is 29.8 mA against 24.4; the uncalibrated
  ±35 mV is ±0.97 A against ±0.80 A; INL is about ±0.36 A against ±0.29 A.
- **The top of the range leans on the supply:** linear to 30 A at 3.30 V, to about 28 A at
  3.22 V (estimate). Rev A's direction does not depend on the rail.
- **30 A sits at the top of the ADC's range**, 2.43 V of 2.5 V, not at 0.33 V.
- **Unchanged in amps:** sensor noise, zero drift (±20 mV, ±0.45 A) and gain drift, because the
  divider scales them with the signal.
- **Parts:** 12 resistors and one new BOM line.

On the six unmirrored ways, nothing: they are rev A's way.

## Options

| | A. Divide the mirrored arm, 12 dB (recommended) | B. Divide both arms alike, 12 dB | C. Divide both arms, 6 dB range | D. 3FU030 on the mirrored arm |
|---|---|---|---|---|
| Unmirrored arm | 44 mV/A, 24.4 mA a count, ±0.80 A | 36.1 mV/A, 29.8 mA, ±0.97 A | 33.8 mV/A, 15.9 mA, ±0.30 A | As A |
| Mirrored arm | 36.1 mV/A, 29.8 mA, ±0.97 A | As A | 18.2 mV/A, 29.6 mA, ±0.55 A | 72.1 mV/A, 14.9 mA, ±0.49 A |
| Dividers | 22k / 100k on six lines | 22k / 100k on twelve | 10k / 33k on one arm, 47k / 33k on the other | 22k / 100k on six lines |
| Cost a yoke | $0.03 | $0.06 | $0.05, and the voltage dividers change | $0.03, plus a $3 fee an order |
| Catch | None found | Loses signal for nothing | Untested; moves the voltage and temperature lines too | Two sensor types; arms differ 2 to 1 |

The ± figures are the ADC's datasheet total error in amps, before calibration.

- **C, the 6 dB range.** Its full scale is half as large, so a count is half the size, and its
  stated error is ±10 mV, not ±35 mV. The unmirrored arm only has to bring its 1.65 V rest under
  1.3 V (10 kΩ over 33 kΩ, 1.27 V), so it would read finer and truer than rev A. The mirrored arm
  has to bring 2.97 V under 1.3 V (47 kΩ over 33 kΩ, 0.4125, 1.23 V at 30 A) and comes out level
  with A on resolution and better on stated error. The catches: a multiplexer's lines share one
  ADC pin, so that arm's voltage and temperature lines move to 6 dB as well and the 100 kΩ /
  6.8 kΩ voltage divider must be re-cut for 1.3 V; the unmirrored arm's rest sits 11 mV under
  the range's top at worst; and whether ESPHome can change attenuation per multiplexer channel
  was not checked **[unsourced]**. It revises the ADC and Accuracy rows of `docs/design.md`, so
  it wants its own ticket.
- **D, the unidirectional part.** CC6905S8-3FU030 (C41421500, extended, $0.555 at 30, 4,583 in
  stock) rests at 0.33 V and moves 88 mV/A for 0 to 30 A, IP+ → IP− ([CC6905][cc6905], p. 13
  and p. 43). That is the mirrored arm's direction, and only that arm's. It tops out at
  the same 2.97 V, so it takes the same divider, and reads twice as finely with ±2 % total error
  against ±3 %. It adds a second extended part type ($3 an order, $0.75 a board at 4) and leaves
  the two arms a factor of two apart. Its zero sits at the bottom edge of the linear range, so a
  negative offset has nowhere to go.
- **Not viable: moving the zero through VREF.** The part accepts an external reference from 0 to
  4 V at unchanged sensitivity (p. 42), so a 1.15 V reference would put 30 A at 2.47 V with no
  divider. It needs a source that can sink more than the pin's own 2.8 mA drive, ±10 mA
  recommended, for each of six sensors: a buffer, not a resistor.

## Recommendation

Take A. Mirror the arm as #65 decided, fit 22 kΩ over 100 kΩ on each of its six sense lines at
the multiplexer, leave the other arm's lines undivided, and let each way's calibration carry its
own sign and gain. Budget the mirrored ways at 22 % more ADC error than rev A's, and treat their
top two amps as supply-dependent.

If the mirrored arm's coarser reading matters once a board is on the bench, C is the one to try
first: it is resistor values and one firmware setting, and it would improve both arms.

## Not checked

- The ADC's real full scale, noise and linearity at 12 dB and 6 dB. Count sizes are nominal.
- The sensor's saturation voltage and how its linear range moves with the supply.
- The 74HC4067's leakage and on-resistance at 3.3 V into an 18 kΩ source.
- Settling and noise through the divider, on a board.
- ESPHome's handling of attenuation per multiplexer channel.

## Sources

- [CrossChip CC6905 datasheet rev 1.3][cc6905]: ordering table p. 3, electrical parameters p. 6,
  CC6905S8-3FB030 table p. 11, input current p. 41, VREF p. 42, output characteristic p. 43,
  output operating range p. 45.
- [ESP32-C3 Series Datasheet v2.4][c3-ds], §5.5, Tables 5-5 and 5-6.
- [ESP32-C3 Technical Reference Manual v1.4][c3-trm], §34.2.3.2.
- JLCPCB parts API, 2026-10-11, for C25768, C25741, C25744, C25779, C25792 and C41421500:
  `https://jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`.
- In the repo: `board/lib/way.tsx`, `docs/design.md` (Sensor, ADC, Power, Accuracy),
  `docs/research/way-monitor-power-supply.md` (the 3.3 V rail's tolerance), and
  [`yoke-arm-lanes.md`](https://github.com/XDGFX/blade-reader/blob/research/yoke-arm-lanes/docs/research/yoke-arm-lanes.md)
  on `research/yoke-arm-lanes`.

[cc6905]: https://datasheet.lcsc.com/datasheet/pdf/81a1e0bc6663e21b6354e013ad7b1200.pdf?productCode=C41421490
[c3-ds]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_datasheet_en.pdf
[c3-trm]: https://www.espressif.com/sites/default/files/documentation/esp32-c3_technical_reference_manual_en.pdf
