// One way: finger → CC6905 → output nut, plus the way's diode into the supply node.

import { CC6905S8_3FB030 } from "../imports/CC6905S8_3FB030"
import { SMTSO4040CTJ } from "../imports/SMTSO4040CTJ"
import { SS210 } from "../imports/SS210"
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
export const Way = ({ n, schX, schY }: { n: number; schX: number; schY: number }) => (
  <>
    <Finger name={`W${n}`} schX={schX} schY={schY} schSectionName="Ways" />
    <CC6905S8_3FB030
      name={`U1${n}`}
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
    <SMTSO4040CTJ name={`N${n}`} schX={schX + 12} schY={schY} schSectionName="Ways" />
    <trace from={`.W${n} > .LINE`} to={`net.WAY${n}_LINE`} />
    <trace from={`.N${n} > .pin1`} to={`net.WAY${n}_LOAD`} />

    {/* Tapped before the sensor, so the strip's own draw stays out of the reading. */}
    <SS210
      name={`D1${n}`}
      schX={schX + 3}
      schY={schY + 2}
      schRotation={90}
      schSectionName="Ways"
      connections={{ anode: `net.WAY${n}_LINE`, cathode: "net.VSUP" }}
    />

    <capacitor
      name={`C1${n}`}
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
