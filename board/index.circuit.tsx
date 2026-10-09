// Blade Reader rev A: one 6-way strip.
// Decisions behind every part are in docs/design.md. Part codes are LCSC/JLCPCB.
//
// PCB coordinates are explained in lib/outline.tsx. The body is 29 mm deep, with a 10 mm
// extension past each end way. The way 1 end (+X) has the ESP32, its antenna past the board
// end, its small parts and the programming footprint. The way 6 end (−X) has the supply and
// the ground nut. The multiplexer sits behind the slots over way 3, and the test pads behind
// the nuts.

import { CD4051BM96 } from "./imports/CD4051BM96"
import { ESP32_C3_MINI_1_H4X } from "./imports/ESP32_C3_MINI_1_H4X"
import { SMTSO4040CTJ } from "./imports/SMTSO4040CTJ"
import { SS210 } from "./imports/SS210"
import { ProgLock } from "./lib/parts"
import { Supply } from "./lib/supply"
import { BOARD_HALF, CombFeatures, ESP, ESP_ROW_Y, OUTLINE, wayX, Y_SHIFT } from "./lib/outline"
import { Way, WAY_PITCH } from "./lib/way"

const WAYS = [1, 2, 3, 4, 5, 6]

const ESP_GND_PINS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
].map((i) => `GND${i}`)

const R_10K = { resistance: "10k", footprint: "0402", supplierPartNumbers: { jlcpcb: ["C25744"] } }

export default () => (
  <board
    outline={OUTLINE}
    thickness="1.6mm"
    nominalTraceWidth="0.25mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.6mm"
  >
    <schematicsection name="Ways" displayName="Ways 1–6" />
    <schematicsection name="Supply" displayName="Supply" />
    <schematicsection name="Mcu" displayName="ESP32-C3 and programming" />
    <schematicsection name="Adc" displayName="Multiplexer and ADC" />

    <group name="strip" pcbX={0} pcbY={Y_SHIFT}>
      <CombFeatures />

      {/* ── Ways ─────────────────────────────────────────────────────────────── */}
      {WAYS.map((n) => (
        <Way key={n} n={n} x={wayX(n)} schX={-30} schY={15 - (n - 1) * WAY_PITCH} />
      ))}

      {/* Ground: a ring-terminated wire from this nut to the panel's negative bus. */}
      <SMTSO4040CTJ
        name="N7"
        pcbX={-(BOARD_HALF - 5.0)}
        pcbY={6.4}
        schX={-18}
        schY={-24}
        schSectionName="Ways"
        connections={{ pin1: "net.GND" }}
      />

      {/* ── Supply ───────────────────────────────────────────────────────────── */}
      <Supply schX={-8} schY={22} />

      {/* ── Multiplexer and ADC ──────────────────────────────────────────────── */}
      {/* Layout may reorder the ways on X0–X5; firmware follows this schematic. */}
      <CD4051BM96
        name="U2"
        pcbX={wayX(3)}
        pcbY={24.75}
        pcbRotation={0}
        schX={0}
        schY={0}
        schSectionName="Adc"
        connections={{
          X0: "net.WAY1_SENSE",
          X1: "net.WAY2_SENSE",
          X2: "net.WAY3_SENSE",
          X3: "net.WAY4_SENSE",
          X4: "net.WAY5_SENSE",
          X5: "net.WAY6_SENSE",
          X6: "net.TEMP",
          X7: "net.VSUP_SENSE",
          X: "net.ADC",
          A: "net.MUX_S0",
          B: "net.MUX_S1",
          C: "net.MUX_S2",
          INH: "net.GND",
          VEE: "net.GND",
          VSS: "net.GND",
          VDD: "net.V3V3",
        }}
      />
      <capacitor
        name="C9"
        pcbX={-0.6}
        pcbY={27.6}
        pcbRotation={0}
        capacitance="100nF"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C307331"] }}
        schX={0}
        schY={5}
        schRotation={-90}
        schSectionName="Adc"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      {/* At the ADC pin. Settles in under 5 ms per mux step: set ESPHome's mux delay to 5 ms
          or more. The mux's on-resistance isolates it from the CC6905's 2.2 nF load limit. */}
      <capacitor
        name="C10"
        pcbX={42.8}
        pcbY={ESP_ROW_Y}
        pcbRotation={180}
        capacitance="10nF"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C15195"] }}
        schX={5}
        schY={-5}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin1: "net.ADC", pin2: "net.GND" }}
      />
      {/* Diode-connected transistor as the temperature sensor: about 265 µA through R10 gives
          a Vbe near 0.65 V, falling about 2 mV/°C. Only the change since each way was zeroed
          is used, so its part-to-part spread doesn't matter. A basic part, unlike any NTC.
          Wired by pad number: the MMBT3904's SOT-23 is 1 = B, 2 = E, 3 = C, but tscircuit's
          transistor names pin1 collector and pin3 emitter, so its pin labels would be wrong. */}
      <resistor
        name="R10"
        pcbX={-0.6}
        pcbY={26.4}
        pcbRotation={180}
        {...R_10K}
        schX={-5}
        schY={-6}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin2: "net.V3V3", pin1: "net.TEMP" }}
      />
      <transistor
        name="Q1"
        pcbX={-0.6}
        pcbY={3.5}
        pcbRotation={90}
        type="npn"
        footprint="sot23"
        manufacturerPartNumber="MMBT3904"
        supplierPartNumbers={{ jlcpcb: ["C20526"] }}
        schX={-5}
        schY={-9}
        schSectionName="Adc"
        connections={{ pin1: "net.TEMP", pin3: "net.TEMP", pin2: "net.GND" }}
      />
      {/* Supply node: 100k / 6.8k gives about 2.29 V at 36 V. */}
      <resistor
        name="R8"
        pcbX={-0.6}
        pcbY={25.2}
        pcbRotation={0}
        resistance="100k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C25741"] }}
        schX={-2}
        schY={-6}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin2: "net.VSUP", pin1: "net.VSUP_SENSE" }}
      />
      <resistor
        name="R9"
        pcbX={-0.6}
        pcbY={24.0}
        pcbRotation={180}
        resistance="6.8k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C25917"] }}
        schX={-2}
        schY={-9}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin2: "net.VSUP_SENSE", pin1: "net.GND" }}
      />

      {/* ── ESP32-C3 ─────────────────────────────────────────────────────────── */}
      <ESP32_C3_MINI_1_H4X
        name="U1"
        pcbX={ESP.x}
        pcbY={ESP.y}
        pcbRotation={-90}
        schX={22}
        schY={0}
        schSectionName="Mcu"
        connections={{
          "3V3": "net.V3V3",
          EN: "net.EN",
          IO3: "net.ADC",
          IO5: "net.MUX_S0",
          IO6: "net.MUX_S1",
          IO7: "net.MUX_S2",
          IO10: "net.LED",
          IO2: "net.IO2",
          IO8: "net.IO8",
          IO9: "net.IO9",
          IO0: "net.IO0",
          IO1: "net.IO1",
          IO4: "net.IO4",
          RXD0: "net.U0RXD",
          TXD0: "net.U0TXD",
          ...Object.fromEntries(ESP_GND_PINS.map((p) => [p, "net.GND"])),
        }}
      />
      <capacitor
        name="C6"
        pcbX={47.6}
        pcbY={10.2}
        pcbRotation={0}
        capacitance="10uF"
        footprint="0603"
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
        schX={14}
        schY={10}
        schRotation={-90}
        schSectionName="Mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C7"
        pcbX={47.0}
        pcbY={ESP_ROW_Y}
        pcbRotation={0}
        capacitance="100nF"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C307331"] }}
        schX={15.5}
        schY={10}
        schRotation={-90}
        schSectionName="Mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      {/* EN: the module has no RC of its own. Also gives esptool's auto-reset a clean edge. */}
      <resistor
        name="R3"
        pcbX={40.7}
        pcbY={ESP_ROW_Y}
        pcbRotation={0}
        {...R_10K}
        schX={14}
        schY={-6}
        schRotation={90}
        schSectionName="Mcu"
        connections={{ pin2: "net.V3V3", pin1: "net.EN" }}
      />
      <capacitor
        name="C8"
        pcbX={38.6}
        pcbY={ESP_ROW_Y}
        pcbRotation={0}
        capacitance="1uF"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C52923"] }}
        schX={14}
        schY={-9}
        schRotation={90}
        schSectionName="Mcu"
        connections={{ pin1: "net.EN", pin2: "net.GND" }}
      />
      {/* Strapping pins: normal boot needs GPIO2 and GPIO9 high. */}
      {(
        [
          ["R4", "net.IO2", 44.9, ESP_ROW_Y, 0],
          ["R5", "net.IO8", 47.9, 12.8, 0],
          ["R6", "net.IO9", 45.6, 12.8, 0],
        ] as const
      ).map(([name, net, pcbX, pcbY, pcbRotation], i) => (
        <resistor
          key={name}
          name={name}
          {...R_10K}
          pcbX={pcbX}
          pcbY={pcbY}
          pcbRotation={pcbRotation}
          schX={30 + i * 1.5}
          schY={8}
          schRotation={90}
          schSectionName="Mcu"
          connections={{ pin2: "net.V3V3", pin1: net }}
        />
      ))}
      {/* Status LED, ESPHome status_led. */}
      <resistor
        name="R7"
        pcbX={41.4}
        pcbY={10.2}
        pcbRotation={0}
        resistance="1k"
        footprint="0402"
        supplierPartNumbers={{ jlcpcb: ["C11702"] }}
        schX={30}
        schY={-6}
        schSectionName="Mcu"
        connections={{ pin1: "net.LED", pin2: "net.LED_A" }}
      />
      <led
        name="LED1"
        pcbX={44.3}
        pcbY={10.2}
        pcbRotation={0}
        color="red"
        footprint="0603"
        supplierPartNumbers={{ jlcpcb: ["C2286"] }}
        schX={33}
        schY={-8}
        schRotation={-90}
        schSectionName="Mcu"
        connections={{ anode: "net.LED_A", cathode: "net.GND" }}
      />

      {/* ── Programming ──────────────────────────────────────────────────────── */}
      {/* ESP-PROG on its PROG header, power jumper at 5 V. Flash off the panel, or with the
          ground wire fitted. */}
      <ProgLock
        name="J1"
        pcbX={47.3}
        pcbY={5.2}
        pcbRotation={90}
        schX={38}
        schY={0}
        schSectionName="Mcu"
        connections={{
          EN: "net.EN",
          VDD: "net.PROG_VDD",
          TXD: "net.U0RXD",
          GND: "net.GND",
          RXD: "net.U0TXD",
          IO0: "net.IO9",
        }}
      />
      {/* Stops a live strip back-feeding 12–24 V into the ESP-PROG. */}
      <SS210
        name="D2"
        pcbX={43.6}
        pcbY={5.2}
        pcbRotation={270}
        schX={38}
        schY={5}
        schSectionName="Mcu"
        connections={{ anode: "net.PROG_VDD", cathode: "net.VSUP" }}
      />

      {/* ── Test pads ────────────────────────────────────────────────────────── */}
      {/* One behind each nut, clear of the copper paths beside it. */}
      {(
        [
          ["TP1", "net.IO0", 1],
          ["TP2", "net.IO1", 2],
          ["TP3", "net.IO4", 3],
          ["TP4", "net.V3V3", 4],
          ["TP5", "net.VSUP", 5],
          ["TP6", "net.GND", 6],
        ] as const
      ).map(([name, net, way], i) => (
        <testpoint
          key={name}
          name={name}
          footprintVariant="pad"
          padShape="circle"
          padDiameter="1.5mm"
          pcbX={wayX(way)}
          pcbY={19.6}
          schX={30 + i * 2}
          schY={-14}
          schSectionName="Mcu"
          connections={{ pin1: net }}
        />
      ))}
    </group>
  </board>
)
