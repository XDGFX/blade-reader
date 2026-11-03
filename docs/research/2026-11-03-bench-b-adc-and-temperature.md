---
date: 2026-11-03
issues: 106, 107, 62
map: 103
---

# Yoke B on panel B: ADC noise, mux settling, zeros, and temperature with the radio busy

Answers [#106](https://github.com/XDGFX/blade-reader/issues/106) (noise, settling, zeros, sweep
rate), [#107](https://github.com/XDGFX/blade-reader/issues/107) (the temperature sensors with the
radio busy) and the stray-field half of [#62](https://github.com/XDGFX/blade-reader/issues/62),
from yoke B fitted to panel B and live, updated over Wi-Fi only. Nothing on the board or the panel
was touched.

## Answer

**#106**

- **Settle 2 ms after each select.** The even arm's sense lines are the slowest: their 18 kΩ
  divider into the 10 nF at the ADC pin settles with τ ≈ 175 µs, so a step from 0 V is still
  −4 mV out at 1 ms and within 1 mV at 2 ms. Every other channel is within 1–2 mV by 0.5 ms.
  ESPHome's `cd74hc4067` default of 2 ms is right; the C10 comment's "under 5 ms" holds.
- **Average N = 64 per channel.** One ADC read takes 52–55 µs. Noise, 1σ, at N = 64: odd arm
  about 1.0–1.4 mV at the ADC (22–32 mA), even arm 0.23–0.36 mV (6–10 mA). The odd arm is about
  six times noisier than the even arm sample for sample: its sense lines reach the mux
  unfiltered, while the even arm's divider and C41 make an 880 Hz low-pass.
- **A full sweep of both muxes takes about 140 ms** at 2 ms settle and N = 64 (16 selects ×
  (2 ms + 2 × 64 × 52 µs)), measured 115–123 ms at 0.5–1 ms settle. That is about 7 sweeps a
  second; split it into 16 steps of about 9 ms so it doesn't block ESPHome's loop.
- **Zeros: one per way, not one global.** The eight ways at 0 V zero between 1.6564 and 1.6661 V
  (mean 1.6618 V): a global zero would leave up to 0.12 A on some ways, against ±0.01–0.02 A of
  repeatability. The nominal 1.65 V reads every way 0.15–0.37 A off. The "about 1.638 V" from the
  first look was not reproduced.
- **ADC offset:** the grounded spares read 0.5 mV (odd) and 1.1 mV (even), steady to 0.1–0.3 mV.
  Too small to correct for currents; the per-way zero absorbs it.

**#107**

- **With the radio busy, against idle, at the same EcoFlow state:** the ESP32's internal sensor
  rises 10.5–11.4 °C, the **odd arm's diode 3.2–3.6 °C**, the chin's 1.6–2.2 °C and the even
  arm's 0.7–0.9 °C. The odd arm reads 2.4–2.9 °C more than the even arm's rise, which is the
  module's heat at 8.1 mm.
- The odd arm's shift is about 0.33 of the ESP32's, the chin's about 0.17 and the even arm's
  about 0.07, so the ESP32's internal reading is a usable proxy for the correction. The ESP32's
  own reading moves within about 3 minutes; the odd arm's within about 10–15.
- The EcoFlow's 8 A on way 7 moved no diode measurably (under 0.3 °C).

**#62**

- **Way 12 moves −0.24 A per 100 A of feed current (±0.05 A, 1 s.e.), way 11 −0.03 A (±0.02 A);
  their difference is −0.21 A per 100 A (±0.07 A).** That fails the 0.1 A per 100 A threshold,
  by about twice, though it rests on 8 A steps scaled 12-fold.
- **Way 5 reads −0.6 % of way 7's current** (−0.60 A per 100 A, ±0.02 A): the next finger's
  field in its sensor, not the feed's. See [Crosstalk](#crosstalk-way-7-into-way-5).
- **The radio moves way 12's reading by −48 mA** the moment it goes busy, and the even arm's
  other ways by −5 to −17 mA. The odd arm doesn't move. The stray-field figures above compare
  only stretches with the radio in one state.

**Panel B as found:** ways 3, 4, 7 and 11 have a fuse in (about 26.6 V on the line). Ways 1,
2, 5, 6, 8, 9, 10 and 12 are at 0 V. Way 11 is listed spare in Hailey's allocation, but has a
2 A fuse in with its load (a tracker) disconnected, so it carries 0 A with the line live. Way 12
is at 0 V as expected.

## Method

A test build, [`firmware/test/bench-b.yaml`](../../firmware/test/bench-b.yaml) with
[`firmware/test/bench.h`](../../firmware/test/bench.h), flashed over Wi-Fi as `blade-reader-b`.
It keeps the normal build's name, API key, encrypted OTA, safe mode and Wi-Fi, so it could be
replaced over Wi-Fi like any update. It drops the way sensors and drives the four selects
(GPIO7, 10, 5, 6) itself, reading both commons (GPIO4 odd, GPIO3 even) through ESPHome's `adc`
sensors as raw counts at 12 dB, one sample per call, converted with ESP-IDF's curve-fitting
calibration. Buttons on its web page start each job, and results go to the log as `B|` lines:

- **Noise:** each select in turn, 5 ms settle, 4096 back-to-back samples on each mux; the
  standard deviation of single samples and of block means of N = 4, 16, 64, 256.
- **Settling:** switch from a source channel (held 3 ms) to a target, wait d µs, read once; 32
  trials per d, against the target's mean after 20 ms. Plus a trace of 48 back-to-back samples
  straight after the switch, averaged over 16 trials.
- **Zeros:** every channel, 1024 samples each after 5 ms, ten passes over 18 s.
- **Sweep:** all 16 selects on both muxes at a given settle and N, timed, against a slow
  reference of each channel.
- **Monitor** (for #107 and #62): one select per 100 ms tick, 2 ms settle, 256 samples on each
  mux; every 10 s the means of all 32 channels (about 1600 samples each) and the ESP32's
  internal temperature go to the log and to a ring in RAM, which is read back afterwards, so a
  radio-idle stretch needs no traffic.

Currents use 44 mV/A. The odd arm reads I = (zero − V) / 0.044; the even arm I = (V / 0.820 −
zero) / 0.044. Temperatures use the normal build's 25 + (0.59 − V) / 0.002.

## Panel B as found

Voltages are each way's divider tap × 15.706. Currents use the per-way zeros below where the way
is at 0 V, and the 1.6618 V mean zero otherwise, so a live way's current is ±0.12 A.

| Way | Hailey's allocation | Line, V | Current, A |
|---|---|---|---|
| 1 | USB_LH | 0.05 | no fuse |
| 2 | USB_RH | 0.06 | no fuse |
| 3 | NETWORKING | 26.5–26.7 | 0.21 (0.18–0.24) |
| 4 | CERBO_GX_ACCESSORIES | 26.7–26.8 | 0.10 (0.06–0.14) |
| 5 | STARLINK | 0.04 | no fuse |
| 6 | LIGHTING_OUTDOOR | 0.06 | no fuse |
| 7 | INVERTER_ECOFLOW | 26.5–26.7 | 7.99 charging, about 0 between |
| 8 | SERVER_MAC_MINI | 0.05 | no fuse |
| 9 | WORKSTATION_MONITOR | 0.03 | no fuse |
| 10 | DESK_LIFT | 0.05 | no fuse |
| 11 | SPARE | 26.6–26.7 | 0 (2 A fuse, load disconnected) |
| 12 | SPARE | 0.04 | no fuse |

So panel B's feed carries about 0.3 A between EcoFlow charges and 8.3 A during them. The EcoFlow
drew a steady 7.99 A (about 213 W), not the 12–15 A expected, and charged for 10–13 minutes
roughly every 27 minutes.

## Noise (#106)

Standard deviation of single samples (N = 1) and of block means of N back-to-back samples, after
5 ms settle. mV at the ADC pin; mA through 44 mV/A (and ÷ 0.820 on the even arm). "Live" ways
carry a real load; their noise includes the load's.

| Channel | Mux, Y | N = 1 | 4 | 16 | 64 | 256 | mA at N = 1 / 16 / 64 / 256 |
|---|---|---|---|---|---|---|---|
| Way 1 current | odd Y6 | 7.32 | 3.69 | 1.93 | 1.02 | 0.55 | 166 / 44 / 23 / 12 |
| Way 3 current (live) | odd Y4 | 7.77 | 4.10 | 2.40 | 1.39 | 0.93 | 177 / 55 / 32 / 21 |
| Way 5 current | odd Y2 | 7.49 | 3.89 | 2.11 | 1.07 | 0.66 | 170 / 48 / 24 / 15 |
| Way 7 current (live) | odd Y9 | 7.26 | 3.62 | 1.85 | 0.99 | 0.53 | 165 / 42 / 23 / 12 |
| Way 9 current | odd Y11 | 7.44 | 3.83 | 1.97 | 0.97 | 0.49 | 169 / 45 / 22 / 11 |
| Way 11 current (live) | odd Y13 | 7.20 | 3.46 | 1.85 | 0.97 | 0.53 | 164 / 42 / 22 / 12 |
| Way 2 current | even Y6 | 0.99 | 0.60 | 0.39 | 0.27 | 0.24 | 27 / 11 / 7.4 / 6.6 |
| Way 4 current (live) | even Y7 | 1.02 | 0.61 | 0.41 | 0.29 | 0.21 | 28 / 11 / 8.0 / 5.9 |
| Way 6 current | even Y4 | 0.94 | 0.56 | 0.35 | 0.23 | 0.18 | 26 / 9.8 / 6.3 / 4.9 |
| Way 8 current | even Y3 | 1.21 | 0.74 | 0.49 | 0.36 | 0.32 | 34 / 14 / 10 / 8.9 |
| Way 10 current | even Y2 | 1.04 | 0.62 | 0.37 | 0.26 | 0.19 | 29 / 10 / 7.2 / 5.2 |
| **Way 12 current** | even Y5 | **3.19** | 2.14 | 1.53 | 1.26 | **1.12** | **88 / 42 / 35 / 31** |
| GND spare | odd Y0 | 0.67 | 0.38 | 0.27 | 0.23 | 0.21 | |
| GND spare | odd Y15 | 0.66 | 0.39 | 0.27 | 0.23 | 0.21 | |
| GND spare | even Y0 | 0.75 | 0.45 | 0.33 | 0.30 | 0.29 | |
| GND spare | even Y12 | 0.76 | 0.38 | 0.20 | 0.11 | 0.06 | |
| Way 1 voltage (0 V) | odd Y7 | 0.73 | 0.43 | 0.30 | 0.27 | 0.26 | |
| Way 4 voltage (live) | even Y10 | 3.07 | 1.76 | 1.20 | 0.97 | 0.85 | |
| Way 7 voltage (live) | odd Y8 | 0.96 | 0.61 | 0.32 | 0.18 | 0.11 | |
| Chin diode | odd Y1 | 2.71 | 1.74 | 1.39 | 1.24 | 1.19 | |
| Odd arm diode | odd Y14 | 0.94 | 0.58 | 0.36 | 0.27 | 0.23 | |
| Even arm diode | even Y8 | 1.22 | 0.70 | 0.50 | 0.43 | 0.41 | |

What it shows:

- **The odd arm's sense noise is the CC6905's own,** about 7.4 mV rms single-sample, the same on
  live and idle ways. It falls close to 1/√N all the way to N = 256 (white), so averaging works:
  N = 64 gives about 23 mA, N = 256 about 12 mA.
- **The even arm's is about a seventh of it,** 0.9–1.2 mV single-sample, because the divider and
  C41 filter it at 880 Hz while it is selected. It falls more slowly than 1/√N, since the ADC's
  own noise (about 0.7 mV, from the GND spares) then dominates, and flattens at 5–9 mA.
- **Way 12 is the exception on the even arm:** three times the noise of its neighbours, and it
  barely averages down (31 mA at N = 256), so it is low-frequency, not ADC noise. Way 12 is the
  way nearest the feed cables. The chin's diode, also near the feed, is likewise noisier than the
  arms' diodes. Either the feed's ripple current or the radio, both of which way 12 is shown to
  pick up below: see [#62](#feed-stray-field-on-ways-11-and-12-62).
- **Way 4's voltage line carries real ripple:** 3.07 mV at the tap is about 48 mV rms on 26.7 V.
- The GND spares read slightly above 0 V, so their spread is partly clipped at 0 counts; read
  them as an upper bound for the ADC's floor, about 0.7 mV single-sample and 0.1–0.3 mV
  averaged.

The monitor's 10 s records (about 1600 samples per channel) show how the zero holds over the
85-minute run. On the 0 A ways, with way 7 not charging, the 10 s records scatter by 4–11 mA
(1σ), except way 12 at 27–35 mA. Each way's mean over a 10-minute stretch held within about
±3 mA of the others in the same radio state, and the even arm's means moved by 5–17 mA (way 12
by 48 mA) between radio idle and radio busy. So the monitor's 10 s average resolves about
10 mA, and a stray effect of a few mA needs many such records.

## Settling (#106)

Error of one sample d µs after the switch, mV against the settled value. The worst case is a
voltage line at 26.7 V (1.70 V at the tap) to one at 0 V.

| From → to | Source impedance | 0 | 20 | 50 | 100 | 200 | 500 | 1000 | 2000 µs |
|---|---|---|---|---|---|---|---|---|---|
| Odd: way 3 V (1.70 V) → way 5 V (0 V) | 6.4 kΩ | 920 | 691 | 457 | 221 | 53 | 2.3 | 1.0 | 0.8 |
| Odd: GND → way 3 V (1.70 V) | 6.4 kΩ | −304 | −223 | −144 | −66 | −20 | −0.1 | 0.2 | 0.7 |
| Odd: way 3 V → GND spare | 0 | 0.8 | 0.5 | 0.3 | 0.5 | 0.5 | 0.6 | 0.4 | 0.1 |
| Odd: GND → way 1 sense (1.67 V) | CC6905 output | −1.0 | 0.3 | 2.0 | 0.1 | −1.3 | −1.8 | −1.2 | 0.0 |
| Odd: GND → chin diode (0.59 V) | 10 kΩ, diode | 2.9 | 2.8 | 3.5 | 2.3 | 2.9 | 3.0 | 2.6 | 3.2 |
| Even: way 4 V (1.71 V) → way 2 V (0 V) | 6.4 kΩ | 906 | 669 | 428 | 204 | 45 | 1.5 | 0.9 | 0.9 |
| Even: GND → way 4 V (1.71 V) | 6.4 kΩ | −861 | −644 | −406 | −177 | −40 | −1.7 | −0.1 | 1.7 |
| Even: GND → way 2 sense (1.36 V) | 18 kΩ divider | −1075 | −951 | −803 | −603 | −346 | −66 | −4.1 | 0.7 |
| Even: way 2 sense → GND spare | 0 | 0.4 | 0.3 | 0.4 | 0.7 | 0.6 | 0.6 | 0.8 | 0.6 |
| Even: GND → even arm diode (0.59 V) | 10 kΩ, diode | 0.3 | 0.4 | 0.6 | 0.6 | 0.7 | 0.7 | 0.6 | 0.7 |

The traces agree: the voltage lines fall by e in about 70 µs (6.4 kΩ × 10 nF = 64 µs) and the
even sense lines in about 175 µs (18 kΩ × 10 nF = 180 µs). The odd sense lines and the diodes
settle within the first sample: the CC6905 and the diode drive the 10 nF hard enough. The odd
chin diode's steady 3 mV offset is the same at every delay, so it is its own wander between the
reference and the trials, not settling.

So 2 ms covers every channel to within 1 mV. 1 ms would do everywhere except a step onto an
even sense line from a channel far from 1.36 V; ordering the sweep so each even sense line
follows another (Y2–Y7 are consecutive) would allow 1 ms there too, but the saving is 16 ms per
sweep, not worth the fragility.

## Sweep rate (#106)

One `adc_oneshot_read` through ESPHome's sensor takes 52–55 µs; a select change 2 µs. A full
sweep of all 16 selects on both muxes:

| Settle | N per channel | Sweep, ms | Worst error vs slow reference, mV |
|---|---|---|---|
| 0 | 1 | 1.7 | 909 (odd Y7, way 1 V after way 1 sense) |
| 50 µs | 16 | 30.2 | 55 |
| 200 µs | 16 | 31.5 | 6.1 |
| 500 µs | 16 | 34.2 | 2.7 |
| 1 ms | 16 | 42.5 | 5.1 (way 12 current, its own noise) |
| 2 ms | 16 | 59.1 | 3.8 (chin diode) |
| 500 µs | 64 | 114.8 | 3.1 |
| 1 ms | 64 | 123.1 | 3.4 |

At 2 ms and N = 64 a sweep is 16 × (2 + 6.7) ≈ 140 ms. ESPHome's 50 ms loop warning means it
should run as one select per loop pass (about 9 ms), not one blocking sweep: one sweep then takes
16 loop passes, still several a second at the default 16 ms loop, far more than the 1 s
publishing needs. The remaining errors at 0.5–2 ms are noise at N = 16, not settling.

## Zeros (#106)

Each way's sense line at 0 A, ten passes of 1024 samples over 18 s. Zero = V on the odd arm,
V / 0.820 on the even arm. **Ways 3, 4 and 7 carry load, so their "zeros" were measured and are
discarded**; they are left out below. Way 11 is kept as a 0 A way with its line live.

| Way | Arm | Zero, V | Spread over 10 passes, mV (1σ) | Current at the nominal 1.65 V, A |
|---|---|---|---|---|
| 1 | odd | 1.6661 | 0.54 | −0.37 |
| 2 | even | 1.6635 | 0.27 | +0.31 |
| 5 | odd | 1.6596 | 0.42 | −0.22 |
| 6 | even | 1.6647 | 0.41 | +0.33 |
| 8 | even | 1.6626 | 0.14 | +0.29 |
| 9 | odd | 1.6584 | 0.35 | −0.19 |
| 10 | even | 1.6628 | 0.21 | +0.29 |
| 12 | even | 1.6564 | 1.04 | +0.15 |
| 11 (0 A, line live) | odd | 1.6626 | 0.41 | −0.29 |

- Over the eight 0 V ways: mean 1.6618 V, range 1.6564–1.6661 V (9.7 mV, 0.22 A), standard
  deviation 3.3 mV (0.075 A).
- **Way 11, at 0 A with 26.6 V on its line, zeroes at 1.6626 V,** inside the odd arm's 0 V
  range (1.6584–1.6661) and 0.8 mV from the mean. So the line voltage doesn't shift a zero by
  more than the part-to-part spread, about ±4 mV (±0.1 A). A smaller shift can't be ruled out
  from one way; zeroing one way at 0 V and again live at 0 A would settle it.
- The odd arm's three (1.6584–1.6661) and the even arm's five (1.6564–1.6647) overlap, so there is
  no arm offset to take out; the even arm's zeros also carry its divider's 1 % tolerance, which
  a per-way zero absorbs along with the CC6905's own offset spread.
- A global zero of 1.6618 V would leave ways 12, 1 and 9 at −0.12, −0.10 and +0.08 A. Per-way
  zeros repeat to 0.14–1.04 mV (3–24 mA), so they are worth having, as the map's "re-zero only
  at 0 V" already assumes.
- The first look's ~1.638 V was not reproduced on any way. Whatever it was read from, the
  calibrated ADC on yoke B puts the CC6905's zero 6–16 mV above 1.65 V, not below it.

## Temperature with the radio busy (#107)

The monitor ran throughout, recording every 10 s. Four phases, back to back from 19:39 AEST:

| Phase | Length | Radio |
|---|---|---|
| A | 20 min | Idle: no client connected, no requests |
| B | 25 min | Busy |
| C | 20 min | Idle |
| D | 20 min | Busy |

Busy meant, all at once from the Mac on the same hotspot: an API log stream; two `/events`
streams; four loops of `GET /sensor/…` (about 34 requests a second in all); and two pings of
1400 bytes every 100 ms. Idle meant nothing at all; the ring in RAM was read back afterwards. The
test build sets `api: reboot_timeout: 0s`, because the first attempt's idle phase rebooted the
board after 15 minutes without an API client and its data was lost.

The EcoFlow charged during all four phases, so each phase gives a stretch with way 7 off (under
1 A) and one with it charging (over 7 A). Means over the last 10 minutes of each phase, °C:

| Phase | Way 7 | ESP32 | Chin | Odd arm | Even arm | Records |
|---|---|---|---|---|---|---|
| A idle | off | 36.77 | 24.62 | 28.41 | 23.84 | 28 |
| A idle | 8 A | 36.48 | 24.68 | 28.39 | 23.93 | 25 |
| B busy | off | 47.25 | 26.73 | 32.05 | 24.62 | 21 |
| B busy | 8 A | 47.29 | 26.84 | 31.98 | 24.60 | 33 |
| C idle | off | 35.20 | 24.48 | 27.16 | 23.54 | 9 |
| C idle | 8 A | 35.31 | 24.35 | 27.25 | 23.51 | 44 |
| D busy | off | 46.58 | 26.14 | 30.77 | 24.41 | 42 |
| D busy | 8 A | 46.12 | 25.92 | 30.48 | 24.35 | 12 |

Busy minus the idle phase before it, at the same EcoFlow state, °C:

| Pair | Way 7 | ESP32 | Chin | Odd arm | Even arm | Odd − even |
|---|---|---|---|---|---|---|
| B − A | off | +10.5 | +2.1 | +3.6 | +0.8 | +2.9 |
| B − A | 8 A | +10.8 | +2.2 | +3.6 | +0.7 | +2.9 |
| D − C | off | +11.4 | +1.7 | +3.6 | +0.9 | +2.7 |
| D − C | 8 A | +10.8 | +1.6 | +3.2 | +0.8 | +2.4 |

What it shows:

- **The odd arm's diode reads 3.2–3.6 °C high with the radio busy;** the even arm's, 0.7–0.9 °C,
  which is about what the board as a whole warms. The difference, 2.4–2.9 °C, is the module's
  heat reaching the odd arm's root, as `docs/design.md` expected.
- **The chin's diode moves 1.6–2.2 °C,** half the odd arm's. It sits nearer the module than the
  even arm's.
- **The ESP32's internal sensor moves 10.5–11.4 °C** and settles within about 3 minutes; the odd
  arm's rise is about two-thirds done in 5 minutes and creeps on for 15–20. Against the ESP32's
  own shift the odd arm moves about 0.33 × as much, the chin 0.17 × and the even arm 0.07 ×.
  A firmware correction of the form T − k × (T_ESP32 − T_ESP32 at idle) would take out most of
  it, but the odd arm lags the ESP32 by several minutes.
- **The EcoFlow's 8 A on way 7 doesn't show,** under 0.3 °C on any diode, in any phase. So
  these figures are the radio's alone. A larger load near a sensor (way 11 or 12, or way 7 at
  30 A) would show; that is #87's question.
- **Absolute readings:** idle, the chin and the even arm read 23.5–24.7 °C and the odd arm
  27.2–28.4 °C. There was no reference thermometer, and yoke B is in the truck, not in the
  bench room the 0.59 V reference came from, so read only the deltas. Between idle A and idle C
  every reading fell 0.2–1.5 °C: ambient drift, and A followed half an hour of testing.
- How busy the radio is in service matters: Home Assistant's API connection and 1 s publishing
  are far lighter than this load, so expect a smaller shift there. These figures are an upper
  bound.

The rest of #107's question, against a reference thermometer, is still open.

## Feed stray field on ways 11 and 12 (#62)

From the same monitor run. **Geometry:** on panel B the positive and negative feed cables leave
together, in the same direction: with the chin at the bottom, off to the right. With the chin at
the bottom the odd ways are on the left and the even on the right, with 11 and 12 nearest the
chin, so way 12 is nearest the feed and way 11 furthest from it. The cables' exact path over the
chin wasn't recorded. Both are 0 A ways: way 12 at 0 V, way 11 live with its load disconnected,
so way 11 is the control and 12 − 11 is the stray-field signal. Because the two cables carry
equal and opposite currents side by side, their fields should mostly cancel, and the
0.045 A per 100 A estimate was for a single cable.

The feed current is the sum of all twelve ways' currents. Only the EcoFlow changed it: a step of
7.96–7.99 A at each start and end of a charge. Seven steps fell inside one radio phase each. For
each, the mean of every 0 A way over 20–140 s before the step against 20–140 s after it, so heat
(minutes) has little time to act and the radio state is the same on both sides:

| Step at (s) | Phase | Feed step, A | Way 11, mA | Way 12, mA |
|---|---|---|---|---|
| 258 | A idle | +7.96 | −0.8 | −22.4 |
| 896 | A idle | −7.98 | −0.6 | +15.9 |
| 1754 | B busy | +7.98 | −8.1 | +1.5 |
| 2491 | B busy | −7.99 | +6.2 | +18.5 |
| 3425 | C idle | +7.99 | −1.9 | −20.9 |
| 4235 | D busy | −7.96 | −1.9 | +34.5 |
| 4993 | D busy | +7.98 | −3.2 | −24.0 |

Scaled to 100 A of feed, mean ± 1 standard error over the seven steps:

| Way | Per 100 A of feed |
|---|---|
| **12** (nearest the feed) | **−0.24 ± 0.05 A** |
| 11 (furthest) | −0.03 ± 0.02 A |
| **12 − 11** | **−0.21 ± 0.07 A** |
| 1, 2, 6, 8, 9, 10 (controls) | −0.03 to +0.01 A, each ± 0.01–0.03 |
| 5 | −0.60 ± 0.02 A: see below |

Comparing whole plateaus instead (each charging plateau against the idle ones either side,
60 s trimmed at each edge) gives way 12 −0.12 A per 100 A, but with a scatter of ±0.3 A
between pairs, because several plateaus straddle a radio change, which moves way 12 by 48 mA
(below). The step method is the one to trust.

**So the stray field fails the 0.1 A per 100 A threshold on way 12, by about twice.** Six of
the seven steps agree in sign and size (15–35 mA per 8 A); the one inside busy B is the
outlier. Caveats: it rests on 8 A steps, so the 100 A figure is a 12-fold extrapolation, and
on a field that is linear in current; and part of what way 12 sees may be the panel's own bus
carrying way 7's current from the feed stud, not only the cables. Way 11 shows nothing
significant, so the effect is on the feed's side of the yoke, as the geometry predicts. A
check at a larger step (an inverter load of 50–100 A) would make it certain.

### Crosstalk: way 7 into way 5

Way 5, at 0 A, reads 47 mA lower whenever way 7 carries 8 A: −0.60 ± 0.02 A per 100 A, or
−0.6 % of the neighbour's current, at every one of the seven steps. Way 9, on way 7's other
side, doesn't move (−0.03 ± 0.02). Each CC6905 lies in the gap on the chin side of its own
finger, so way 5's sensor sits beside way 7's finger, and way 7's sensor beside way 9's. It is
not the multiplexer: the monitor reads way 5 (odd Y2) straight after the chin's diode (Y1), not
after way 7 (Y9). At 30 A next door that is −0.18 A on way n from way n + 2, which bears on #87
and on the gain trims: a way's trim from a load step will be off unless its chin-side neighbour
was steady. A firmware correction (subtract 0.006 × the chin-side neighbour's current) would
take it out, once measured on more ways and on the even arm, where panel B had no switching
load.

### The radio and way 12

With the radio busy, way 12 reads about 48 mA lower (−47 and −50 mA in the two busy phases),
and the even arm's other 0 A ways 5–17 mA lower; the odd arm's ways move by less than 5 mA. The
step comes within the first 10 s record of each change, so it is electrical, not heat. Way 12 is
also three times noisier than its neighbours (see [Noise](#noise-106)). Why way 12 is so much more
sensitive than its neighbours isn't known from this; it is the even arm's way nearest the chin.
For fault thresholds, treat way 12's floor as
about 50 mA, not 10.

## Test configs

- [`firmware/test/bench-b.yaml`](../../firmware/test/bench-b.yaml): the test build. Same name,
  key, OTA, safe mode and Wi-Fi as `blade-reader.yaml`, plus `api: reboot_timeout: 0s` so a
  radio-idle stretch over 15 minutes doesn't reboot it (the first idle run did).
- [`firmware/test/bench.h`](../../firmware/test/bench.h): the jobs and the monitor.

Build and update as for the normal firmware, from `firmware/test/` with its own copy of
`secrets.yaml`: `esphome -s name blade-reader-b -s friendly_name "Blade Reader B" run
bench-b.yaml --device <ip> --no-logs`. Yoke B was put back on `firmware/blade-reader.yaml`
afterwards.
