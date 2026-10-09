// One way: finger → CC6905 → output nut, plus the way's diode into the supply node.

import { CC6905S8_3FB030 } from "../imports/CC6905S8_3FB030"
import { SMTSO4040CTJ } from "../imports/SMTSO4040CTJ"
import { SS210 } from "../imports/SS210"
import { CLAMP_Y, NUT_Y, type Pt } from "./outline"
import { Finger } from "./parts"

// Schematic spacing between ways.
export const WAY_PITCH = 6

/**
 * The column for sensor `n` (S1–S6). Net `Sn_LINE` is the fuse panel's side (the finger),
 * `Sn_LOAD` the load's side (the output nut), `Sn_SENSE` the sensor output to the
 * multiplexer and `Sn_VOLTS` the way's voltage, divided down, to the multiplexer.
 *
 * The sensor is fitted backwards: load current runs IP− → IP+, so VOUT falls from 1.65 V as
 * load rises. The ESP32-C3's ADC is accurate only up to about 2.5 V, which positive current
 * would leave above about +19 A (CC6905 datasheet rev 1.3, p. 41: IP+ → IP− raises VOUT).
 */
// PCB column, relative to the way's centre X. The sensor band is Y 1.5–9; parts stay 1 mm
// clear of the panel side wall and out of the divider lanes. The sensor's IP pins face −X,
// IP− towards the finger, so current runs straight up the column: finger → IP− → IP+ → nut.
// The diode sits beside IP−, anode down on the line copper. VCC, GND and the sensor's caps sit
// above its signal pins.
export const SENSOR = { dx: 1.0, y: 4.0 }
const DIODE = { dx: -4.35, y: 4.8 }
// The voltage divider stands beside the diode, outboard of the line copper: the 6.8k low, its
// GND end on a via down to the ring face's bus, and the 100k above it, its top end tapping the
// line copper.
const DIVIDER_STACK = 1.9
/** The divider's 6.8k centre beside way `n`'s diode, for the way centred on `x`. */
export const dividerAt = (n: number, x: number): Pt => ({ x: bandX(n, x) - 6.7, y: 2.2 })
const CAP_Y = 7.7
// Ways 1–3 shift their sensor band towards the way 1 end and ways 4–6 towards the way 6
// end, which opens room for the temperature transistor between ways 3 and 4.
const BAND_SHIFT = 0.5
export const bandX = (n: number, x: number) => x + (n <= 3 ? BAND_SHIFT : -BAND_SHIFT)

export const Way = ({
  n,
  x,
  divider,
  schX,
  schY,
}: { n: number; x: number; divider: Pt; schX: number; schY: number }) => (
  <>
    <Finger name={`W${n}`} pcbX={x} pcbY={CLAMP_Y} schX={schX} schY={schY} schSectionName="Ways" />
    <CC6905S8_3FB030
      name={`U1${n}`}
      pcbX={bandX(n, x) + SENSOR.dx}
      pcbY={SENSOR.y}
      pcbRotation={-90}
      schX={schX + 6}
      schY={schY}
      schSectionName="Ways"
      connections={{
        IP_NEG1: `net.S${n}_LINE`,
        IP_NEG2: `net.S${n}_LINE`,
        IP_POS1: `net.S${n}_LOAD`,
        IP_POS2: `net.S${n}_LOAD`,
        VCC: "net.V3V3",
        GND: "net.GND",
        VOUT: `net.S${n}_SENSE`,
      }}
    />
    <SMTSO4040CTJ name={`N${n}`} pcbX={x} pcbY={NUT_Y} schX={schX + 12} schY={schY} schSectionName="Ways" />
    <trace from={`.W${n} > .LINE`} to={`net.S${n}_LINE`} />
    <trace from={`.N${n} > .pin1`} to={`net.S${n}_LOAD`} />

    {/* Tapped before the sensor, so the strip's own draw stays out of the reading. */}
    <SS210
      name={`D1${n}`}
      pcbX={bandX(n, x) + DIODE.dx}
      pcbY={DIODE.y}
      pcbRotation={-90}
      schX={schX + 3}
      schY={schY + 2}
      schRotation={90}
      schSectionName="Ways"
      connections={{ anode: `net.S${n}_LINE`, cathode: "net.VSUP" }}
    />

    {/* Way voltage: 100k / 6.8k gives about 2.29 V at 36 V. Tapped before the sensor, so its
        current stays out of the reading. */}
    <resistor
      name={`R1${n}`}
      pcbX={divider.x}
      pcbY={divider.y + DIVIDER_STACK}
      pcbRotation={90}
      resistance="100k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25741"] }}
      schX={schX + 3}
      schY={schY - 1}
      schRotation={90}
      schSectionName="Ways"
      connections={{ pin2: `net.S${n}_LINE`, pin1: `net.S${n}_VOLTS` }}
    />
    <resistor
      name={`R2${n}`}
      pcbX={divider.x}
      pcbY={divider.y}
      pcbRotation={90}
      resistance="6.8k"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C25917"] }}
      schX={schX + 3}
      schY={schY - 3}
      schRotation={90}
      schSectionName="Ways"
      connections={{ pin2: `net.S${n}_VOLTS`, pin1: "net.GND" }}
    />

    {/* tscircuit skips all autorouting if a cap's pin-to-pin trace can't meet its default
        1 mm limit; these pads are 1.3 mm from the sensor's. */}
    <capacitor
      name={`C1${n}`}
      pcbX={bandX(n, x) + 3.6}
      pcbY={CAP_Y}
      pcbRotation={90}
      capacitance="100nF"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C307331"] }}
      maxDecouplingTraceLength="3mm"
      schX={schX + 9}
      schY={schY + 2}
      schRotation={-90}
      schSectionName="Ways"
      connections={{ pin1: `.U1${n} > .VCC`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C2${n}`}
      pcbX={bandX(n, x) + 2.6}
      pcbY={CAP_Y}
      pcbRotation={90}
      capacitance="1nF"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C1523"] }}
      maxDecouplingTraceLength="5mm"
      schX={schX + 9}
      schY={schY - 2}
      schRotation={-90}
      schSectionName="Ways"
      connections={{ pin1: `.U1${n} > .VREF`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C3${n}`}
      pcbX={bandX(n, x) + 4.6}
      pcbY={CAP_Y}
      pcbRotation={90}
      capacitance="1nF"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C1523"] }}
      schX={schX + 10.5}
      schY={schY - 2}
      schRotation={-90}
      schSectionName="Ways"
      connections={{ pin1: `net.S${n}_SENSE`, pin2: "net.GND" }}
    />
  </>
)
