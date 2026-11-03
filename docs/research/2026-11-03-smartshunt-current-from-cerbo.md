---
date: 2026-11-03
issue: 105
map: 103
---

# Reading the SmartShunt's current from the Cerbo for gain trims

Answers #105: how a script on the Mac mini (or the Mac) can read the 300 A SmartShunt's battery
current from Hailey's Cerbo GX, how often, at what resolution, and with what timestamps. The
reading is matched against one **way**'s load step to derive that way's gain trim.

## Answer

**Use MQTT on the Cerbo (dbus-flashmq, port 1883) and read the SmartShunt's own battery service,
not the system summary.** Subscribe to `N/<portal ID>/battery/<instance>/Dc/0/Current`, send a
keepalive to `R/<portal ID>/keepalive` every 30 s, and timestamp each message on arrival at the
Mac.

| | MQTT (recommended) | Modbus TCP |
|---|---|---|
| Enable | Settings → Services → MQTT | Settings → Services → Modbus TCP (off by default) |
| Address | topic `N/<portal ID>/battery/<instance>/Dc/0/Current` | unit ID = device instance, register 261 |
| Encoding | JSON `{"value": <float>}` | int16, signed, scale 10 (0.1 A) |
| Resolution | whatever the D-Bus value holds (see open question) | **0.1 A**, fixed by the register |
| Rate | pushed on change, so at most once per VE.Direct update (about 1 s) | polled; faster polling only re-reads the same value |
| Timestamp | none in the payload | none |
| Housekeeping | keepalive within 60 s | none |

MQTT is the better route: it is pushed, so the arrival time is close to the change, and it
does not cut the value to 0.1 A the way the Modbus register does. Modbus is the fallback for a
client that can't do MQTT.

**Rate, resolution and timestamps.** The SmartShunt sends a new reading over VE.Direct once a
second and resolves 0.01 A. No route carries a timestamp, so the time is when the Mac receives
the message. The Mac sees a shunt step up to about 1 s after it happened. An ESPHome way reading
published about every second has the same uncertainty, so a single step can only be lined up to
within ±1–2 s. That is fine if the trim compares **plateaus, not edges**: hold the load on and
off for about 10–20 s each, repeat several cycles, average each plateau on both sides, and take
the gain as Δ(way current) ÷ Δ(shunt current). The shunt's offset (under 10 mA) cancels in the
difference. Its ±0.4 % accuracy is the floor on the trim.

Confidence: high on the MQTT and Modbus mechanics (read from Victron's source repos). Medium on
the end-to-end rate and resolution at the Mac. The Venus VE.Direct driver is not public, so what
it keeps of the 0.01 A reading has to be checked on the van (below).

## How the SmartShunt reaches the Cerbo in Hailey

The SmartShunt (SHU300A) sits on the battery negative, between the JK BMS and the negative bus
bar, so it sees the whole battery current
(`~/git/hailey/electrical/CONTEXT.md`, `src/main_electrical.yml`). It reports to the Cerbo over
a VE.Direct cable on one of the Cerbo's three VE.Direct ports, alongside the MPPT and the Orion
XS (`CONTEXT.md`, "VE.Direct": 3.3 V UART, 19200 baud).

On the Cerbo it appears as a `com.victronenergy.battery` service. The JK BMS also reaches the
Cerbo over a serial link (`CONTEXT.md`, "Cerbo GX"), so there may be **two** battery services.
Pick the SmartShunt's instance by its product name rather than assuming one. Don't read
`system/0/Dc/Battery/Current` either: that follows whichever battery monitor the Cerbo has
selected.

## MQTT details

Source: `victronenergy/dbus-flashmq` README, commit `57aceb0`. dbus-flashmq replaced the Python
`dbus-mqtt` from Venus OS v3.20 (`dbus-mqtt` README).

- **Broker.** "FlashMQ is accessible on the local network at TCP port 1883 and/or 8883
  (depending on your security settings)." Enable it under Settings → Services → MQTT.
- **Topics.** `N/<portal ID>/<service_type>/<device instance>/<D-Bus path>`. For the shunt that
  is `N/<portal ID>/battery/<instance>/Dc/0/Current`. The portal ID is shown under Settings → VRM
  online portal. To discover it and the instance, subscribe to `N/+/battery/+/ProductName` after
  a keepalive.
- **Payload.** "The payload of the D-Bus value is wrapped in a dictionary and converted to json",
  e.g. `{"value": 936}`. Invalid values are `{"value": null}`. There is no per-value timestamp.
  The only epoch-like number is the payload of `N/<portal ID>/full_publish_completed`.
- **Rate.** "When a value on the D-Bus changes, the plugin will initiate a publish." The README
  gives no throttle for change-driven publishes, so the rate is set by how often the VE.Direct
  driver updates D-Bus. Full republishes (after a keepalive) are capped at three a second.
- **Keepalive.** Publish to `R/<portal ID>/keepalive`. "Keep-alive timeout is 60 seconds." The
  first keepalive with an empty payload triggers a full publish of every topic. After that,
  send `{ "keepalive-options" : ["suppress-republish"] }` on a timer. The README's example loop
  uses 30 s. Messages are not retained, so a client that connects late sees nothing until it
  sends a keepalive.

A minimal check from the Mac (portal ID and Cerbo address filled in):

```sh
mosquitto_pub -h <cerbo> -t 'R/<portal ID>/keepalive' -m ''
mosquitto_sub -h <cerbo> -v -t 'N/<portal ID>/battery/+/Dc/0/Current' -t 'N/<portal ID>/battery/+/ProductName'
```

## Modbus TCP details

Sources: `victronenergy/dbus_modbustcp` at commit `205bf75`, files `attributes.csv` and
`unitid2di.csv`; Victron's Modbus TCP FAQ (`victronenergy.com/live/ccgx:modbustcp_faq`).

- **Enable.** Off by default; Settings → Services → Modbus TCP. Standard Modbus TCP port 502.
  That port number is the protocol default; the FAQ does not state it.
- **Register.** `com.victronenergy.battery,/Dc/0/Current,d,A DC,261,int16,10,R`: holding register
  261, signed 16-bit, divide by 10. So **0.1 A steps** whatever the shunt measures. Voltage is
  register 259 (uint16, ÷100).
- **Unit ID.** The unit ID is the device instance (`unitid2di.csv`, e.g. unit 226 ↔ instance
  279, "Cerbo GX VE.Direct port 1 (ttyS7)"; ports 2 and 3 are instances 278 and 277). The GX
  lists the mapping under Settings → Services → Modbus TCP → Available services.
- **Rate.** The FAQ says nothing about refresh rate. The register reads the current D-Bus
  value, so it can't be fresher than MQTT, and polling adds up to one poll interval of lag.

## The SmartShunt itself

- **VE.Direct text mode.** "The device transmits blocks of data at 1 second intervals." Field
  `I` is battery current in mA, positive when charging, negative when discharging
  (VE.Direct Protocol 3.33, "Message format" and field `I`). The SmartShunt is one of the listed
  products.
- **HEX mode.** The BMV-7xx HEX protocol, which Victron staff say applies to the SmartShunt, has
  two current registers: `0xED8F` (int16, 0.1 A) and `0xED8C` (int32, 1 mA). Which one the Venus
  driver reads, and whether it uses text or HEX mode, is not documented publicly.
- **Specification** (SmartShunt manual, "Technical data"): current resolution ±0.01 A, current
  accuracy ±0.4 %, offset under 10 mA on the 300 A model. The manual gives no measurement or
  filtering rate beyond the 1 s VE.Direct block.

## Other routes considered

- **Directly over VE.Direct.** A USB VE.Direct cable on the Mac would give the raw 1 s text
  blocks with mA resolution and no Cerbo in between. But the shunt has one VE.Direct port and
  the Cerbo already uses it. Only worth it if the Cerbo turns out to round to 0.1 A.
- **SSH to the Cerbo and read D-Bus.** With root access enabled,
  `dbus -y com.victronenergy.battery.ttyS<n> /Dc/0/Current GetValue` reads the value the
  others publish. It is no faster, but it is the quickest way to see the stored precision.
- **Bluetooth Instant Readout** from the SmartShunt. Not looked into: it needs the device's
  encryption key and a BLE receiver near the shunt, and offers nothing for a one-off
  calibration that MQTT doesn't.

## Open question to check on the van

How many decimals does `Dc/0/Current` carry on D-Bus? Run the `mosquitto_sub` above with a
steady load of a few amps. If values move in 0.01 A (or finer) steps, MQTT carries the shunt's
full resolution. If they move only in 0.1 A steps, the driver is rounding (likely reading
`0xED8F`). Then use larger steps (≥5 A, so 0.1 A is ≤2 %) and longer plateaus, whose averages
smooth the quantisation while background loads vary, or read the shunt directly over VE.Direct
for the trim session.

Also keep background loads steady during a trim: the shunt measures the whole battery, so the
fridge cycling or the MPPT charging mid-plateau looks like a step. Run with solar and the Orion
off where possible, and throw out any cycle whose off-plateaus disagree.

## Sources

- dbus-flashmq README: <https://github.com/victronenergy/dbus-flashmq> (commit `57aceb0`)
- dbus-mqtt README (deprecation note): <https://github.com/victronenergy/dbus-mqtt>
- dbus_modbustcp `attributes.csv`, `unitid2di.csv`:
  <https://github.com/victronenergy/dbus_modbustcp> (commit `205bf75`)
- Victron Modbus TCP FAQ: <https://www.victronenergy.com/live/ccgx:modbustcp_faq>
- VE.Direct Protocol 3.33:
  <https://www.victronenergy.com/upload/documents/VE.Direct-Protocol-3.33.pdf>
- BMV-7xx HEX protocol: <https://www.victronenergy.de/upload/documents/BMV-7xx-HEX-Protocol.pdf>
  (register summary read via search, not the PDF itself)
- SmartShunt manual, technical data:
  <https://www.victronenergy.com/media/pg/SmartShunt/en/technical-data.html>
- Hailey wiring: `~/git/hailey/electrical/CONTEXT.md`, `src/main_electrical.yml`
