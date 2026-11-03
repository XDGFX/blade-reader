# Firmware

How the yoke's firmware behaves. The reasoning is in the tickets linked from each section, and the summary is the Firmware and Accuracy rows of [`docs/design.md`](../design.md). It's being built under [Spec: Blade Reader firmware](https://github.com/XDGFX/blade-reader/issues/117). Until those tickets land, the first-flash config in [`firmware/`](../../firmware/) does none of this: it reads every way against the nominal zero and gain.

Terms are as in [`GLOSSARY.md`](../../GLOSSARY.md).

## Structure

ESPHome, with one external component, `blade_reader`. The YAML holds the board:

- pins and the mux channel map
- Wi-Fi, API (with `reboot_timeout: 0s`), OTA and safe mode
- the green `status_led`
- the stock `web_server` page
- the over-temperature threshold
- `preferences: flash_write_interval: 5min`

The component owns the sweep, zeroing, temperature tracking, gain trims, energy, faults, the red LED and the publish rule. Inside it, a hardware-free **core** takes one finished sweep and returns what to publish, the LED pattern and what to store. A thin **glue** layer drives the mux and ADC, maps the core's output onto ESPHome entities, and stores records in flash. The core is unit-tested on a Mac. The glue is checked on a bench yoke. ([#111](https://github.com/XDGFX/blade-reader/issues/111))

Ways are generic, numbered 1–12. The board holds no way names, fuse ratings or over-current limits; those live in Home Assistant.

## Sweep

Both muxes share one select. For each channel: set the select, wait 2 ms, then average 64 samples from each arm's ADC pin. A full pass takes about 140 ms (about 7 Hz), split into steps so ESPHome's loop is never blocked. A sample at the ADC rail is flagged as clipped. ([#106](https://github.com/XDGFX/blade-reader/issues/106))

## Way states

| State | Rule |
| --- | --- |
| Live way | 6 V or more |
| Dead way | below 2 V |
| Between | keeps its previous state |
| Empty way | dead since boot, since the last Clear faults, or since a No supply period; never a fault |

The thresholds are fixed and suit both 12 V and 24 V. ([#108](https://github.com/XDGFX/blade-reader/issues/108))

## Current

```
I = (Vout − zero_now) / 44 mV/A × trim
zero_now = zero + tempco × (Vbe_now − Vbe_at_zero)
```

An unzeroed way uses the nominal 1.65 V zero with no tempco.

## Zero

- **Rule:** a way that is dead for 5 s, then the mean of the next 10 s (about 70 sweeps). If the way goes live part-way, the attempt is dropped and the old zero kept. The rule is the same at install and in service. ([#113](https://github.com/XDGFX/blade-reader/issues/113))
- Ways re-zero only when dead, never when they merely sit steady near 0 A, which would hide a standby drain.
- The new zero, the smoothed Vbe at that moment, and when it was taken replace the stored ones and are written to flash at once.
- To redo one way, pull its fuse for 15 s.

### Install mode

Install mode starts at boot if any way has no zero. It ends when all 12 have one or 1 h after boot, and returns at the next boot if any are still missing. It changes only the LED. The README's install steps give the fuse swaps. The board-level **Not zeroed** reading says `None` or, for example, `Not zeroed: 3, 7`. It's never a fault.

## Temperature tracking

([#109](https://github.com/XDGFX/blade-reader/issues/109))

- **Source:** the even arm's diode for every way, falling back to the chin's if the even arm's Vbe is outside a plausible range. The ESP32's internal sensor isn't used. Vbe is smoothed with a time constant of about 1 minute.
- **Tempco:** starts at 0 for each way.
- **Learning:** a sample is taken at a re-zero at least 10 K from the stored zero's temperature. Samples are blended with a moving average weighted about ¼, and the tempco is clamped to ±5 mA/K.
- **Confidence gate:** the tempco is applied only once the way has 3 samples that agree in sign and are within ±2 mA/K of each other. Until then 0 is applied.
- **Self-check:** at every re-zero with ΔT ≥ 3 K, the firmware logs:
  - way
  - ΔT
  - the measured zero
  - the zero the tempco predicted
  - the uncorrected zero

  If the tempco does worse than no correction on 2 checks in a row, it and its sample count reset to 0.
- There is no radio-heat correction and no correction for self-heating at high current.

## Gain

The gain is nominal: 44 mV/A. Each way has a trim, which starts at 1.0. The API action `set_gain_trim(way, trim)` sets it, rejecting and logging anything outside 0.90–1.10. Nothing on the board or in this repo works the trims out yet. ([#110](https://github.com/XDGFX/blade-reader/issues/110))

## Energy

Each way keeps a signed 64-bit integer total, integrated from V × I on every sweep. It's published in Wh, with `device_class: energy` and `state_class: total`. Being signed, noise around 0 A cancels rather than piling up. ([#111](https://github.com/XDGFX/blade-reader/issues/111))

## Faults

No fault latches. Each clears itself once its cause has cleared and held steady. ([#108](https://github.com/XDGFX/blade-reader/issues/108))

| Fault | Raised | Cleared |
| --- | --- | --- |
| Blown fuse (way) | a live way is dead for 1 s while another way stays live | the way is live for 5 s, or Clear faults |
| Over range (way) | \|I\| > 30 A for 1 s, or straight away on a clipped reading | 5 s at ≤ 30 A with no clipping |
| Over temperature (board) | the hottest diode reaches the threshold (85 °C) | 5 K below the threshold |

- A pulled fuse counts as blown. Voltage alone decides.
- A sensor stuck at a rail clips the ADC, so it shows as over range. A sensor stuck mid-range isn't detected.
- **No supply:** no way is live, which is only possible on USB. No blown-fuse faults are raised, and the panel voltage reads 0 V. When a way comes back, the board starts afresh as if it had just booted.
- **Clear faults** (button): clears every fault, and every dead way becomes an empty way. A fault whose cause is still present comes straight back.
- **Fault text:** `OK`, `No supply`, or each fault joined by `; `, board faults first, then ways in ascending order. For example: `Over temperature 87 °C; Way 3 blown; Way 9 over range`. It fits in 255 characters.

There are no per-way over-current limits, no 20 A derating when hot, and no panel total on the board. Home Assistant does those.

## Red LED

The component owns the red LED. Highest priority first:

1. Fast blink (about 4 Hz): a zero is being taken.
2. Steady: any fault is active.
3. Slow blink (about 1 Hz): install mode, and a live way is still unzeroed.
4. Off.

Green is ESPHome's `status_led`. ([#113](https://github.com/XDGFX/blade-reader/issues/113))

## What is published

| Entity | Per | Notes |
| --- | --- | --- |
| Current (A) | way | |
| Power (W) | way | from the same sweep's V and I |
| Energy (Wh) | way | `state_class: total` |
| Blown fuse | way | binary sensor |
| Panel voltage | board | median of live ways; 0 V under No supply |
| Fault text | board | |
| Not zeroed | board | |
| Diode temperatures | board | chin, odd arm, even arm |
| Voltage | way | hidden diagnostic |
| Gain trim | way | hidden diagnostic |
| Zero (mV from nominal), its temperature and time | way | hidden diagnostics |
| Grounded spares | board | hidden diagnostics, to watch the radio-related zero shift |

- **Publish rule:** within about 1 s of a meaningful change (a threshold above the arm's noise), otherwise every 30 s. Current and power are always sent together.
- **Actions:** `set_gain_trim(way, trim)`, and `dump_state`, which logs every way's stored record.
- **Buttons:** Clear faults, factory reset, restart.
- The web page is ESPHome's stock one. It's the install and fault-finding aid. ([#116](https://github.com/XDGFX/blade-reader/issues/116) is future work.)

## Flash

([#111](https://github.com/XDGFX/blade-reader/issues/111), [#113](https://github.com/XDGFX/blade-reader/issues/113))

- The component uses fixed keys of its own, not ESPHome's name-hashed ones.
- **Each way's record** holds the zero, the Vbe at the zero, the zero's time, the tempco and its sample count, the self-check streak and the trim. Each field has a format version.
- **Energy** has a separate record per way.
- **When records are written:**
  - Zeros and trims: as soon as they change.
  - Tempcos, self-check state and energy: on the 5-minute batch, flushed before a reboot or OTA update.
  - Power loss or a crash loses up to 5 minutes of energy.
- **Format changes:** only the changed field resets to its default (no zero, tempco 0, trim 1.0). Energy is untouched. There are no migrations.
- **Kept and wiped:** stored values survive OTA and USB updates and a move to another panel. Factory reset wipes them, and the next boot is in install mode.
- Fault state and readings are not stored.

## Known errors

These are not corrected. ([#114](https://github.com/XDGFX/blade-reader/issues/114), [#110](https://github.com/XDGFX/blade-reader/issues/110), [#109](https://github.com/XDGFX/blade-reader/issues/109))

| Error | Size |
| --- | --- |
| Feed stray field, on the ways nearest where the feed leaves | about −0.24 A at a 100 A feed |
| Crosstalk: way *n* reads part of finger *n*+2's current | up to about −0.18 A beside a 30 A neighbour |
| Way 12's floor with the radio busy | about 50 mA |
| Nominal gain (CC6905 ±3 %) | inside ±0.3 A below about 10 A; up to ±0.9 A at 30 A |
| Radio-related zero shift | 5–17 mA on the even arm |
