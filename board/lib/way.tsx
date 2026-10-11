// One way: finger → CC6905 → output nut, plus the way's diode into the supply node.
//
// Only the finger and the nut are placed, on the yoke's own holes. Everything else in the column
// waits for the arm's layout; the strip's column is at the tag rev-a-strip.

import { CC6905S8_3FB030 } from "../imports/CC6905S8_3FB030"
import { SMTSO4040CTJ } from "../imports/SMTSO4040CTJ"
import { SS210 } from "../imports/SS210"
import type { Pt } from "./outline"
import { Finger, FP_0402 } from "./parts"

// Schematic spacing between ways.
export const WAY_PITCH = 8

/**
 * The column for sensor `n` (S1–S12). Net `Sn_LINE` is the fuse panel's side (the finger),
 * `Sn_LOAD` the load's side (the output nut), `Sn_SENSE` the sensor output and `Sn_VOLTS` the
 * way's voltage, divided down, to the multiplexer.
 *
 * Unmirrored, the sensor is fitted backwards: load current runs IP− → IP+, so VOUT falls from
 * 1.65 V as load rises and stays inside the ESP32-C3's ADC range, which is accurate only up to
 * about 2.5 V (CC6905 datasheet rev 1.3, p. 41: IP+ → IP− raises VOUT). A SOIC can't be mirrored,
 * so on the mirrored arm the current runs IP+ → IP− and VOUT rises to 2.97 V at 30 A; that arm's
 * sense lines are divided at their multiplexer.
 */
export const Way = ({
  n,
  finger,
  nut,
  mirrored,
  schX,
  schY,
  section,
}: { n: number; finger: Pt; nut: Pt; mirrored: boolean; schX: number; schY: number; section: string }) => (
  <>
    <Finger name={`W${n}`} pcbX={finger.x} pcbY={finger.y} schX={schX} schY={schY} schSectionName={section} />
    <CC6905S8_3FB030
      name={`U1${n}`}
      schX={schX + 6}
      schY={schY}
      schSectionName={section}
      connections={{
        IP_NEG1: `net.S${n}_${mirrored ? "LOAD" : "LINE"}`,
        IP_NEG2: `net.S${n}_${mirrored ? "LOAD" : "LINE"}`,
        IP_POS1: `net.S${n}_${mirrored ? "LINE" : "LOAD"}`,
        IP_POS2: `net.S${n}_${mirrored ? "LINE" : "LOAD"}`,
        VCC: "net.V3V3",
        GND: "net.GND",
        VOUT: `net.S${n}_SENSE`,
      }}
    />
    <SMTSO4040CTJ name={`N${n}`} pcbX={nut.x} pcbY={nut.y} schX={schX + 14} schY={schY} schSectionName={section} />
    <trace from={`.W${n} > .LINE`} to={`net.S${n}_LINE`} />
    <trace from={`.N${n} > .pin1`} to={`net.S${n}_LOAD`} />

    {/* Tapped before the sensor, so the board's own draw stays out of the reading. */}
    <SS210
      name={`D1${n}`}
      schX={schX + 3}
      schY={schY + 2}
      schRotation={90}
      schSectionName={section}
      connections={{ anode: `net.S${n}_LINE`, cathode: "net.VSUP" }}
    />

    {/* Way voltage: 100k / 6.8k gives about 2.29 V at 36 V. Tapped before the sensor, so its
        current stays out of the reading. */}
    <resistor
      name={`R1${n}`}
      resistance="100k"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C25741"] }}
      schX={schX + 3}
      schY={schY - 1}
      schRotation={90}
      schSectionName={section}
      connections={{ pin2: `net.S${n}_LINE`, pin1: `net.S${n}_VOLTS` }}
    />
    <resistor
      name={`R2${n}`}
      resistance="6.8k"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C25917"] }}
      schX={schX + 3}
      schY={schY - 3}
      schRotation={90}
      schSectionName={section}
      connections={{ pin2: `net.S${n}_VOLTS`, pin1: "net.GND" }}
    />

    <capacitor
      name={`C1${n}`}
      capacitance="100nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C307331"] }}
      maxDecouplingTraceLength="3mm"
      schX={schX + 9}
      schY={schY + 2}
      schRotation={-90}
      schSectionName={section}
      connections={{ pin1: `.U1${n} > .VCC`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C2${n}`}
      capacitance="1nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C1523"] }}
      maxDecouplingTraceLength="5mm"
      schX={schX + 9}
      schY={schY - 2}
      schRotation={-90}
      schSectionName={section}
      connections={{ pin1: `.U1${n} > .VREF`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C3${n}`}
      capacitance="1nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C1523"] }}
      schX={schX + 10.5}
      schY={schY - 2}
      schRotation={-90}
      schSectionName={section}
      connections={{ pin1: `net.S${n}_SENSE`, pin2: "net.GND" }}
    />
  </>
)
