// One way: finger → CC6905 → output nut, plus the way's diode into the supply node.
//
// The column is placed in its own coordinates, in mm: `u` runs along the arm from the way's
// centre towards the chin, and `v` outboard from the panel edge. The strip's column is at the tag
// rev-a-strip.

import { CC6905S8_3FB030 } from "../imports/CC6905S8_3FB030"
import { SMTSO4040CTJ } from "../imports/SMTSO4040CTJ"
import { SS210 } from "../imports/SS210"
import { CLAMP_Y, WAY_PITCH_PCB, type Pt } from "./outline"
import { Finger, FP_0402 } from "./parts"

// Schematic spacing between ways.
export const WAY_PITCH = 8

// The sensor lies in the gap beside its finger, on the chin side, inboard of the nut row, with
// its IP pins towards its own way. The diode stands above it in the neck between two nuts.
const GAP = WAY_PITCH_PCB / 2
// 0.2 inboard of the gap's middle: at 4.0 its outboard pads are 0.8 from the nut's land but
// inside the land's bounding square, which the build reads as an overlap.
const SENSOR_V = 3.8
const DIODE_V = 10.3
// 0402s standing under a finger's root, over the pocket's lip: the divider under its own way's
// finger, the sensor's caps under the next way's, 1 mm apart.
const ROOT_V = -1.37
const DIVIDER_U = [3.0, 4.0]
const CAPS_U = [0, 1, 2].map((i) => WAY_PITCH_PCB - 4.0 + i)
// The way nearest the chin has no next finger: its caps lie beside the sensor's signal pins.
const CHIN_CAPS_U = GAP + 4.8
/** The sensor's VREF, VOUT and VCC pins, across the arm from its centre, towards +X. */
const PIN_X = { VREF: 0.635, VOUT: -0.635, VCC: -1.905 }

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
  chinmost,
  schX,
  schY,
  section,
}: {
  n: number
  finger: Pt
  nut: Pt
  mirrored: boolean
  chinmost: boolean
  schX: number
  schY: number
  section: string
}) => {
  const out = Math.sign(nut.x - finger.x)
  const at = (u: number, v: number) => ({ pcbX: finger.x + out * (v - CLAMP_Y), pcbY: finger.y + u })
  /** A two-pad part's rotation: as given on the unmirrored arm, reflected on the other. */
  const turn = (rotation: number) => (mirrored ? 180 - rotation : rotation)
  const sensor = at(GAP, SENSOR_V)
  // Under the next finger's root the caps stand in the order their pins come, the pin nearest
  // the panel to the cap nearest the sensor, so their lines don't cross.
  const order = (["VREF", "VOUT", "VCC"] as const).slice().sort((a, b) => out * (PIN_X[a] - PIN_X[b]))
  const cap = (pin: keyof typeof PIN_X) =>
    chinmost
      ? { pcbX: sensor.pcbX + PIN_X[pin], pcbY: finger.y + CHIN_CAPS_U, pcbRotation: 90 }
      : { ...at(CAPS_U[order.indexOf(pin)], ROOT_V), pcbRotation: turn(0) }
  return (
  <>
    <Finger name={`W${n}`} pcbX={finger.x} pcbY={finger.y} schX={schX} schY={schY} schSectionName={section} />
    <CC6905S8_3FB030
      name={`U1${n}`}
      {...sensor}
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
      {...at(GAP, DIODE_V)}
      pcbRotation={turn(0)}
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
      {...at(DIVIDER_U[0], ROOT_V)}
      pcbRotation={turn(0)}
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
      {...at(DIVIDER_U[1], ROOT_V)}
      pcbRotation={turn(180)}
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
      {...cap("VCC")}
      capacitance="100nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C307331"] }}
      maxDecouplingTraceLength="8mm"
      schX={schX + 9}
      schY={schY + 2}
      schRotation={-90}
      schSectionName={section}
      connections={{ pin1: `.U1${n} > .VCC`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C2${n}`}
      {...cap("VREF")}
      capacitance="1nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C1523"] }}
      maxDecouplingTraceLength="6mm"
      schX={schX + 9}
      schY={schY - 2}
      schRotation={-90}
      schSectionName={section}
      connections={{ pin1: `.U1${n} > .VREF`, pin2: "net.GND" }}
    />
    <capacitor
      name={`C3${n}`}
      {...cap("VOUT")}
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
}
