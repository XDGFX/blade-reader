// Supply: way diodes (in way.tsx) → VSUP → 1 A fuse → VIN → SMBJ33A → LMR51610X → 3V3.
// Circuit and values from docs/research/way-monitor-power-supply.md, "Recommended circuit
// and BOM", with its D1 replaced by the way diodes and its F1 by the fuse (issue #6).
//
// The circuit is the yoke's. The placement is still the strip's and waits for the chin's.
// PCB: a line along the band behind ways 4–6, in the order the current flows towards the way 6
// end: fuse, TVS diode, input caps and buck, then the inductor and output caps. U3 lies with
// VIN and EN towards the input caps and SW towards L1: C2 stands across its VIN end, C3 across
// its SW end, and the feedback divider sits under its FB pin.

import { A_0466001_NRHF } from "../imports/A_0466001_NRHF"
import { LMR51610XDBVR } from "../imports/LMR51610XDBVR"
import { SMBJ33A } from "../imports/SMBJ33A"
import { SWPA6045S220MT } from "../imports/SWPA6045S220MT"
import { FP_0402 } from "./parts"

export const Supply = ({ schX, schY }: { schX: number; schY: number }) => (
  <>
    {/* Inrush: about 2.3 µF of input capacitance charged from 29.2 V puts roughly
        0.002 A²s through the fuse, 5 % of its 0.0423 A²s melting I²t. The buck's
        2.3 ms soft-start keeps the output capacitors' charge current below 0.1 A. */}
    <A_0466001_NRHF
      name="F1"
      pcbX={-5.0}
      pcbY={21.0}
      pcbRotation={180}
      schX={schX}
      schY={schY}
      schSectionName="Supply"
      connections={{ pin1: "net.VSUP", pin2: "net.VIN" }}
    />
    <SMBJ33A
      name="D1"
      pcbX={-13.0}
      pcbY={21.9}
      pcbRotation={0}
      schX={schX + 2.5}
      schY={schY - 2}
      schSectionName="Supply"
      connections={{ C: "net.VIN", A: "net.GND" }}
    />
    <capacitor
      name="C1"
      pcbX={-18.3}
      pcbY={22.5}
      pcbRotation={-90}
      capacitance="2.2uF"
      footprint="1206"
      maxVoltageRating="50V"
      supplierPartNumbers={{ jlcpcb: ["C50254"] }}
      schX={schX + 4}
      schY={schY - 2}
      schRotation={-90}
      schSectionName="Supply"
      connections={{ pin1: "net.VIN", pin2: "net.GND" }}
    />
    <capacitor
      name="C2"
      pcbX={-20.4}
      pcbY={22.95}
      pcbRotation={-90}
      capacitance="100nF"
      footprint="0805"
      maxVoltageRating="100V"
      supplierPartNumbers={{ jlcpcb: ["C28233"] }}
      schX={schX + 5.5}
      schY={schY - 2}
      schRotation={-90}
      schSectionName="Supply"
      connections={{ pin1: "net.VIN", pin2: "net.GND" }}
    />
    <LMR51610XDBVR
      name="U3"
      pcbX={-23.1}
      pcbY={22.5}
      pcbRotation={-90}
      schX={schX + 9}
      schY={schY}
      schSectionName="Supply"
      connections={{
        VIN: "net.VIN",
        // TI SLUSEY1B p. 3: EN can be tied to VIN.
        EN: "net.VIN",
        GND: "net.GND",
        SW: "net.SW",
        FB: "net.FB",
      }}
    />
    <capacitor
      name="C3"
      pcbX={-25.35}
      pcbY={22.5}
      pcbRotation={90}
      capacitance="100nF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C307331"] }}
      maxDecouplingTraceLength="6mm"
      schX={schX + 12}
      schY={schY + 2}
      schRotation={180}
      schSectionName="Supply"
      connections={{ pin1: ".U3 > .CB", pin2: "net.SW" }}
    />
    <SWPA6045S220MT
      name="L1"
      pcbX={-33.0}
      pcbY={22.15}
      pcbRotation={180}
      schX={schX + 14}
      schY={schY}
      schSectionName="Supply"
      connections={{ pin1: "net.SW", pin2: "net.V3V3" }}
    />
    {/* 0.8 V × (1 + 75k / 24k) = 3.30 V */}
    <resistor
      name="R1"
      pcbX={-21.6}
      pcbY={19.85}
      pcbRotation={180}
      resistance="75k"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C25798"] }}
      schX={schX + 16}
      schY={schY - 2}
      schRotation={90}
      schSectionName="Supply"
      connections={{ pin2: "net.V3V3", pin1: "net.FB" }}
    />
    <resistor
      name="R2"
      pcbX={-20.1}
      pcbY={20.3}
      pcbRotation={-90}
      resistance="24k"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C25769"] }}
      schX={schX + 16}
      schY={schY - 4.5}
      schRotation={90}
      schSectionName="Supply"
      connections={{ pin2: "net.FB", pin1: "net.GND" }}
    />
    {[4, 5].map((i) => (
      <capacitor
        key={i}
        name={`C${i}`}
        pcbX={-39.6}
        pcbY={i === 4 ? 20.05 : 22.35}
        pcbRotation={180}
        capacitance="22uF"
        footprint="1206"
        maxVoltageRating="25V"
        supplierPartNumbers={{ jlcpcb: ["C12891"] }}
        schX={schX + 14 + i * 1.5}
        schY={schY - 2}
        schRotation={-90}
        schSectionName="Supply"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
    ))}
  </>
)
