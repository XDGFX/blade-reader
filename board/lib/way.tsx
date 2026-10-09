// One way: finger → CC6905 → output nut, plus the way's diode into the supply node.

import { CC6905S8_3FB030 } from "../imports/CC6905S8_3FB030"
import { SMTSO4040CTJ } from "../imports/SMTSO4040CTJ"
import { SS210 } from "../imports/SS210"
import { CLAMP_Y, NUT_Y } from "./outline"
import { Finger } from "./parts"

// Schematic spacing between ways.
export const WAY_PITCH = 6

/**
 * Way `n` (1–6). Net `WAYn_LINE` is the fuse panel's side (the finger), `WAYn_LOAD` the
 * load's side (the output nut) and `WAYn_SENSE` the sensor output to the multiplexer.
 *
 * The sensor is fitted backwards: load current runs IP− → IP+, so VOUT falls from 1.65 V as
 * load rises. The ESP32-C3's ADC is accurate only up to about 2.5 V, which positive current
 * would leave above about +19 A (CC6905 datasheet rev 1.3, p. 41: IP+ → IP− raises VOUT).
 */
// PCB column, relative to the way's centre X. The sensor band is Y 1.5–9; parts stay 1 mm
// clear of the panel side wall and 1.5 mm clear of the divider slots. The sensor's IP pins
// face −X, IP− towards the finger, so current runs straight up the column: finger → IP− →
// IP+ → nut. The diode sits beside IP−, anode down on the line copper. Its cathode (VSUP)
// leaves up the −X side of the nut and VOUT up the +X side, one trace each between the nut
// pad and the slot. VCC, GND and the sensor's caps sit above its signal pins.
const SENSOR = { dx: 1.0, y: 4.0 }
const DIODE = { dx: -4.35, y: 4.8 }
const CAP_Y = 7.7
// Ways 1–3 shift their sensor band towards the way 1 end and ways 4–6 towards the way 6
// end, which opens room for the temperature transistor between ways 3 and 4.
const BAND_SHIFT = 0.5
const bandX = (n: number, x: number) => x + (n <= 3 ? BAND_SHIFT : -BAND_SHIFT)

export const Way = ({ n, x, schX, schY }: { n: number; x: number; schX: number; schY: number }) => (
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
        IP_NEG1: `net.WAY${n}_LINE`,
        IP_NEG2: `net.WAY${n}_LINE`,
        IP_POS1: `net.WAY${n}_LOAD`,
        IP_POS2: `net.WAY${n}_LOAD`,
        VCC: "net.V3V3",
        GND: "net.GND",
        VOUT: `net.WAY${n}_SENSE`,
      }}
    />
    <SMTSO4040CTJ name={`N${n}`} pcbX={x} pcbY={NUT_Y} schX={schX + 12} schY={schY} schSectionName="Ways" />
    <trace from={`.W${n} > .LINE`} to={`net.WAY${n}_LINE`} />
    <trace from={`.N${n} > .pin1`} to={`net.WAY${n}_LOAD`} />

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
      connections={{ anode: `net.WAY${n}_LINE`, cathode: "net.VSUP" }}
    />

    <capacitor
      name={`C1${n}`}
      pcbX={bandX(n, x) + 3.6}
      pcbY={CAP_Y}
      pcbRotation={90}
      capacitance="100nF"
      footprint="0402"
      supplierPartNumbers={{ jlcpcb: ["C307331"] }}
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
      connections={{ pin1: `net.WAY${n}_SENSE`, pin2: "net.GND" }}
    />
  </>
)
