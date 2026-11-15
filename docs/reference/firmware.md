# Firmware

How the yoke's firmware behaves. The reasoning is in the tickets linked from each section, and the summary is the Firmware and Accuracy rows of [`docs/design.md`](../design.md). The spec is [Spec: Blade Reader firmware](https://github.com/XDGFX/blade-reader/issues/117), and the component is in [`firmware/`](../../firmware/).

Terms are as in [`GLOSSARY.md`](../../GLOSSARY.md).

## Structure

ESPHome, with one external component, `blade_reader`. The YAML holds the board:

- pins and the mux channel map
- Wi-Fi, API (with `reboot_timeout: 0s`), OTA and safe mode
- the green `status_led`
- the yoke's own web page, from `firmware/web/`, behind `auth`
- the over-temperature threshold
- `preferences: flash_write_interval: 5min`

The component owns the sweep, zeroing, temperature tracking, gain trims, energy, faults, the red LED and the publish rule. Inside it, a hardware-free **core** takes one finished sweep and returns what to publish, the LED pattern and what to store. A thin **glue** layer drives the mux and ADC, maps the core's output onto ESPHome entities, and stores records in flash. The core is unit-tested on a Mac. The glue is checked on a bench yoke. ([#111](https://github.com/XDGFX/blade-reader/issues/111))

Ways are generic, numbered 1–12. The board holds no way names, fuse ratings or over-current limits; those live in Home Assistant.

## Sweep

Both muxes share one select. For each channel: set the select, wait 2 ms, then average 64 samples from each arm's ADC pin. A full pass takes about 140 ms (about 7 Hz), split into steps so ESPHome's loop is never blocked. A sample at the ADC rail is flagged as clipped. ([#106](https://github.com/XDGFX/blade-reader/issues/106))

## Way states

| State | Rule |
| --- | --- |
| Live way | 6 V or more without a break for 1 s; live from the first of those readings |
| Dead way | below 2 V |
| Between | keeps its previous state |
| Empty way | dead since boot, since the last Clear faults, or since a No supply period; never a fault |

The thresholds are fixed and suit both 12 V and 24 V. ([#108](https://github.com/XDGFX/blade-reader/issues/108))

A way that was dead turns live only after 1 s at 6 V, so one noisy reading can't make an empty way look fitted and then blown. On yoke A, bouncing a lighting controller's connector on way 5 put one sweep at 6 V on way 9, which had no fuse in it, and it read blown. A real fuse holds its voltage far longer, and a fuse fitted onto a short blows within one sweep, so nothing the yoke could catch before is lost. Since the live spell is dated from its first reading at 6 V, a refitted fuse still clears Blown fuse 5 s after it goes in. Cal decided this after that fault, keeping the thresholds of #108.

## Current

```
I = (Vout − zero_now) / 44 mV/A × trim     even ways (2, 4, …, 12)
I = (zero_now − Vout) / 44 mV/A × trim     odd ways (1, 3, …, 11)
zero_now = zero + tempco × (Vbe_now − Vbe_at_zero)
```

Vout is the sensor's output, after undoing the even arm's 0.820 divider. The odd arm's sensors are fitted reversed, so their output falls as load rises; the even arm's rises. A load reads positive on both arms. The zero, the tempco and the self-check are all in terms of Vout, so the published zero (mV from nominal) and a tempco read the other way round on the odd arm: a zero above nominal there is a negative current offset.

An unzeroed way borrows a zero from its own arm (odd ways 1, 3, …, 11; even ways 2, 4, …, 12): the median of the stored zeros of the ways there that have one, in Vout, taking the mean of the middle two when their count is even. If no way on its arm has a zero, it uses the nominal 1.65 V. A borrowed zero takes no tempco. It's worked out afresh from the stored zeros as they change, and nothing is stored for it: it's never the way's own zero, so the way still counts as unzeroed for Not Zeroed and install mode, and its Zero diagnostics stay unavailable. Cal decided this after testing on yoke B, where every way zeroed 7–16 mV above the nominal 1.65 V, an offset the whole arm seems to share.

## Zero

- **Rule:** a way that is dead for 5 s, then the mean of the next 10 s (about 70 sweeps). If the way goes live part-way, the attempt is dropped and the old zero kept. The rule is the same at install and in service. ([#113](https://github.com/XDGFX/blade-reader/issues/113))
- Ways re-zero only when dead, never when they merely sit steady near 0 A, which would hide a standby drain.
- The new zero, the smoothed Vbe at that moment, and when it was taken replace the stored ones and are written to flash at once.
- A way zeros 5 s into each dead spell, then every hour it stays dead, by the same rule: the mean of the 10 s before, dropped if the way goes live. The red LED blinks fast for those 10 s. Cal added the hourly re-zero after review of [#117](https://github.com/XDGFX/blade-reader/issues/117), replacing one zero per dead spell, so an empty way keeps up with drift; each is one flash write.
- To redo one way, pull its fuse for 15 s.

### Install mode

Install mode starts at boot if any way has no zero. It ends when all 12 have one or 1 h after boot, and returns at the next boot if any are still missing. It changes only the LED. The [manual](https://xdgfx.github.io/blade-reader/) gives the steps: zero on the desk, then pull one way's fuse to redo it. The board-level **Not Zeroed** reading lists the ways without a zero, for example `3, 4, 7, 11`, or says `None`. It's never a fault.

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

The gain is nominal: 44 mV/A. Each way has a trim, which starts at 1.0. The API action `set_gain_trim(way, trim)` sets it, rejecting and logging anything outside 0.90–1.10. A trim loaded from flash outside that range is logged at boot and the way uses 1.0. Nothing on the board or in this repo works the trims out yet. ([#110](https://github.com/XDGFX/blade-reader/issues/110))

## Energy

Each way keeps a signed 64-bit integer total in mWs, integrated from V × I on every sweep. It's published in Wh, with `device_class: energy` and `state_class: total`, alongside the way's current and power. Being signed, noise around 0 A cancels rather than piling up; being an integer, a large total still gains a standby-sized sweep. `dump_state` logs each total in mWs. An unzeroed way counts from boot, against its borrowed or nominal zero. Cal decided this after testing on yoke B, replacing the earlier rule that held a way's total until its first zero. ([#111](https://github.com/XDGFX/blade-reader/issues/111))

## Faults

No fault latches. Each clears itself once its cause has cleared and held steady. ([#108](https://github.com/XDGFX/blade-reader/issues/108))

| Fault | Raised | Cleared |
| --- | --- | --- |
| Blown fuse (way) | a live way is dead for 1 s while another way stays live | the way is live for 5 s, or Clear faults |
| Over range (way) | \|I\| > 30 A for 1 s, or straight away on a clipped reading | 5 s at ≤ 30 A with no clipping |
| Over temperature (board) | the hottest diode reaches the threshold (85 °C) | 5 K below the threshold |

- A pulled fuse counts as blown. Voltage alone decides.
- A sensor stuck at a rail clips the ADC, so it shows as over range. A sensor stuck mid-range isn't detected.
- **No supply:** no way is live, which is only possible on USB. It isn't a fault, so it doesn't light the red LED. No blown-fuse faults are raised, and the panel voltage reads 0 V. When a way comes back, the yoke starts afresh as if it had just booted.
- **Clear faults** (button): clears every fault, and every dead way becomes an empty way. A fault whose cause is still present comes straight back.
- **Fault text:** `OK`, or its parts joined by `; `: `No supply` first, then over temperature, then each kind of way fault with every way that has it, in ascending order. One way reads `Way`, more read `Ways`. For example: `Over temperature 87 °C; Ways 3, 7 blown; Way 9 over range`, or `No supply; Way 9 over range` for a sensor stuck at a rail on USB. Even with every fault raised it fits in Home Assistant's 255 characters, so nothing is cut off. Cal chose the grouping and No supply's place after review of [#117](https://github.com/XDGFX/blade-reader/issues/117), replacing one part per way fault, a bare `No supply` that hid any faults, and a `; …` cut-off.

There are no per-way over-current limits, no 20 A derating when hot, and no panel total on the board. Home Assistant does those.

## Red LED

The component owns the red LED. Highest priority first:

1. Fast blink (about 4 Hz): a zero is being taken.
2. Steady: any fault is active.
3. Slow blink (about 1 Hz): install mode, and a live way is still unzeroed.
4. Off.

No supply isn't a fault and has no pattern of its own: on USB alone the red LED is off unless one of the above holds. Cal kept this after review of [#117](https://github.com/XDGFX/blade-reader/issues/117).

Green is ESPHome's `status_led`. ([#113](https://github.com/XDGFX/blade-reader/issues/113))

## What is published

Names are grouped as `Group: Item`, so a way's entities sort together in Home Assistant.

| Entity | Per | Notes |
| --- | --- | --- |
| `Way n: Current` (A) | way | |
| `Way n: Power` (W) | way | from the same sweep's V and I |
| `Way n: Energy` (Wh) | way | `state_class: total` |
| `Way n: Blown Fuse` | way | binary sensor |
| `Way n: Live` | way | binary sensor, `device_class: power`; the way's live state |
| `Panel Voltage` | board | median of live ways; 0 V under No supply |
| `Fault Text` | board | |
| `Not Zeroed` | board | the ways without a zero, e.g. `3, 4, 7, 11`, or `None` |
| `Temperature: Chin`, `Temperature: Odd Arm`, `Temperature: Even Arm` | board | the diodes |
| `Temperature: ESP32`, `Wi-Fi Signal`, `Firmware`, `Uptime` | board | ESPHome's own; the web page counts install mode down from `Uptime` |
| `Way n: Voltage` | way | hidden diagnostic |
| `Way n: Gain Trim` | way | hidden diagnostic |
| `Way n: Zero` (mV from nominal), `Way n: Zero Temperature`, `Way n: Zero Time` | way | hidden diagnostics |
| `Spare: Odd Arm`, `Spare: Even Arm` | board | grounded spares; hidden diagnostics, to watch the radio-related zero shift |

- **Publish rule:** within about 1 s of a meaningful change (a threshold above the arm's noise), otherwise every 30 s. Current and power are always sent together. Blown fuse and Live go out on the sweep they change, with no heartbeat.
- **Blown fuse and Live together** tell what is in a way. Cal added Live after testing on yoke B. Under No supply every way reads off on both.

  | Live | Blown fuse | The way |
  | --- | --- | --- |
  | on | off | fuse in |
  | off | off | empty way |
  | off | on | blown, or pulled until Clear faults |
- **Actions:** `set_gain_trim(way, trim)`, and `dump_state`, which logs every way's stored record.
- **Buttons:** `Clear Faults`, `Factory Reset`, `Restart`.
- **Web page:** see [Web page](#web-page).

## Web page

The yoke serves its own page at `http://<name>.local`, the install and fault-finding aid with or without Home Assistant. It's embedded in the firmware, so it needs no internet, and `auth` (digest, with the login from `secrets.yaml`) covers the page, `/events` and the buttons. The generic image, flashed from the browser, has no login ([#136](https://github.com/XDGFX/blade-reader/issues/136)). ([#116](https://github.com/XDGFX/blade-reader/issues/116), [#126](https://github.com/XDGFX/blade-reader/issues/126), [#127](https://github.com/XDGFX/blade-reader/issues/127))

- **Files:** `firmware/web/page.js` and `page.css`, embedded with `web_server`'s `js_include` and `css_include` (`js_url` and `css_url` empty). Plain JS, no build step. They are about 27 KB gzipped, 15 KB of it the board art.
- **Board art:** the ring face drawn as fitted, from the routed `circuit.json`, with each way's power path as `<g id="wN">`. `firmware/web/board-art/board-art.ts` writes it into the marked region of `page.js`; run it again for each board revision.
- **What it shows:** the status first (All OK, the fault text with Clear Faults, No supply, or how many ways have a zero); in install mode, which live ways to pull, which dead ones are zeroing, and when install mode ends, from `Uptime`; each way's copper lit by its state, its current, power or state beside its finger, and a popover with its diagnostics; the panel voltage, total current and the three temperatures.
- **Entities:** found by name from the `/events` stream, nothing hard-coded beyond the names in What is published. A state message names its entity in `id` as `domain/Name`. Over range is read from the fault text. Tempco isn't published, so the page doesn't show it. Zero Time is the seconds after the boot it was taken in, shown as such, not as an age.
- **Read-only** apart from Clear Faults, Restart and Factory Reset, the last two behind a confirm.
- **Trying it without a yoke:** open `firmware/web/try.html`; `fake-events.js` stands in for the yoke with Normal, Install mode, Faults and No supply. Neither is served by the yoke.
- **Tests:** the page's model runs under `node --test` as part of `make -C firmware test`.
- **Upkeep:** re-test the page after any ESPHome release that touches the `web_server` API.

## Flash

([#111](https://github.com/XDGFX/blade-reader/issues/111), [#113](https://github.com/XDGFX/blade-reader/issues/113))

- The component uses fixed keys of its own, not ESPHome's name-hashed ones.
- **Each way's record** holds the zero, the Vbe at the zero, the zero's time, the tempco and its sample count, the self-check streak and the trim. Each field has a format version.
- **Energy** has a separate record per way.
- **When records are written:**
  - Zeros and trims: as soon as they change. Tempcos and self-check state change only at a re-zero, so they go with it.
  - Energy: on the 5-minute batch, flushed before a reboot or OTA update.
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
