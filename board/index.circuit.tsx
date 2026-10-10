// Blade Reader rev A: one 6-way strip.
// Decisions behind every part are in docs/design.md. Part codes are LCSC/JLCPCB.
//
// PCB coordinates are explained in lib/outline.tsx. The body is 28.0 mm deep, with an ear past
// each end way. The way 1 ear (+X) has the ESP32 low down, antenna past the board end, with
// mux 1 and its small parts above it. The way 6 ear (−X) has the ground nut low down and mux 2
// above it. Everything else sits in the band behind the nuts: the programming footprint over
// way 1, test pads over way 2, then the supply over ways 4–6.

import { CD4051BM96 } from "./imports/CD4051BM96"
import { ESP32_C3_WROOM_02_N4 } from "./imports/ESP32_C3_WROOM_02_N4"
import { SMTSO4040CTJ } from "./imports/SMTSO4040CTJ"
import { SS210 } from "./imports/SS210"
import { GroundCopper, WayCopper } from "./lib/copper"
import { FP_0402, FP_0603, FP_LED_0603, FP_SOT23, ProgPads } from "./lib/parts"
import { Routes } from "./lib/routes"
import { Silkscreen } from "./lib/silkscreen"
import { Supply } from "./lib/supply"
import {
  DEPTH,
  ESP,
  ESP_ROW_Y,
  espPinX,
  GROUND_NUT,
  MUX_2,
  OUTLINE,
  wayX,
  X_SHIFT,
  Y_SHIFT,
} from "./lib/outline"
import { dividerAt, Way, WAY_PITCH } from "./lib/way"

const WAYS = [1, 2, 3, 4, 5, 6]

// The way 1 ear's small parts: [X, Y above the module's lands, rotation].
// The caps for 3V3, EN and IO4 stand above their lands, courtyards against the module's, with
// mux 1 beside them. The pocket past mux 1 at the board end takes the parts whose lines come up
// between the module's outboard lands: IO3's cap, the LED and its resistor and the IO2 pull-up,
// then the module's bulk cap and mux 1's cap on the 3V3 line round the outboard edge. The EN,
// IO8 and IO9 pull-ups stand beside the module's blind end, on the lines to J1.
const CAP_ROW = 1.21
const EAR: Record<string, readonly [number, number, number]> = {
  C7: [espPinX(0), CAP_ROW, 90],
  C8: [espPinX(1), CAP_ROW, 90],
  C10: [espPinX(2), CAP_ROW, 90],
  U2: [43.8, 4.24, 180],
  C41: [espPinX(2), 3.9, -90],
  R7: [52.2, 3.3, 0],
  LED1: [51.8, 4.6, 180],
  R4: [52.2, 5.9, 0],
  C6: [51.5, 7.1, 180],
  C9: [49.6, 5.81, 90],
  R3: [38.14, -0.4, 180],
  R6: [38.7, -7.93, -90],
  R5: [38.7, -9.89, 90],
}
const ear = (name: string) => {
  const [pcbX, dy, pcbRotation] = EAR[name]
  return { pcbX, pcbY: ESP_ROW_Y + dy, pcbRotation }
}
/** J1 keeps its distance from the outboard edge, which is the pogo clamp's reach. */
const J1_Y = DEPTH - 3.9

// Between ways 3 and 4, above the channel, so way 3's divider stands beside its diode like the
// others and its line can drop into the channel.
const Q1 = { x: -0.4, y: 7.8 }

const divider = (n: number) => dividerAt(n, wayX(n))

const R_10K = { resistance: "10k", footprint: FP_0402, supplierPartNumbers: { jlcpcb: ["C25744"] } }

export default () => (
  <board
    outline={OUTLINE}
    thickness="1.6mm"
    solderMaskColor="black"
    silkscreenColor="white"
    nominalTraceWidth="0.25mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.6mm"
    defaultViaTenting="top_and_bottom_tented"
    pcbStyle={{ viaHoleDiameter: "0.3mm", viaPadDiameter: "0.6mm" }}
    routeRemaining={false}
  >
    <schematicsection name="Ways" displayName="Ways 1–6" />
    <schematicsection name="Supply" displayName="Supply" />
    <schematicsection name="Mcu" displayName="ESP32-C3 and programming" />
    <schematicsection name="Adc" displayName="Multiplexers and ADC" />

    <group name="strip" pcbX={X_SHIFT} pcbY={Y_SHIFT}>

      {/* ── Ways ─────────────────────────────────────────────────────────────── */}
      {WAYS.map((n) => (
        <Way
          key={n}
          n={n}
          x={wayX(n)}
          divider={divider(n)}
          schX={-30}
          schY={15 - (n - 1) * WAY_PITCH}
        />
      ))}
      {WAYS.map((n) => (
        <WayCopper key={n} n={n} cx={wayX(n)} dividerVia={{ x: divider(n).x, y: 0.8 }} />
      ))}
      <GroundCopper />
      <Routes dividers={WAYS.map(divider)} />

      {/* Ground: a ring-terminated wire from this nut to the panel's negative bus. */}
      <SMTSO4040CTJ
        name="N7"
        pcbX={GROUND_NUT.x}
        pcbY={GROUND_NUT.y}
        schX={-18}
        schY={-24}
        schSectionName="Ways"
        connections={{ pin1: "net.GND" }}
      />

      {/* ── Supply ───────────────────────────────────────────────────────────── */}
      <Supply schX={-8} schY={22} />

      {/* ── Multiplexers and ADC ─────────────────────────────────────────────── */}
      {/* Mux 1, for ways 1–3 and the temperature, above the module. Its inputs are in the order
          the lines come up under the module (lib/routes.tsx), so none cross. Firmware follows
          this schematic. X5 is the spare. */}
      <CD4051BM96
        name="U2"
        {...ear("U2")}
        schX={0}
        schY={0}
        schSectionName="Adc"
        connections={{
          X3: "net.S1_SENSE",
          X7: "net.S1_VOLTS",
          X0: "net.S2_SENSE",
          X1: "net.S2_VOLTS",
          X6: "net.S3_SENSE",
          X2: "net.S3_VOLTS",
          X4: "net.TEMP",
          X5: "net.GND",
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
        {...ear("C9")}
        capacitance="100nF"
        footprint={FP_0402}
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
        {...ear("C10")}
        capacitance="10nF"
        footprint={FP_0402}
        supplierPartNumbers={{ jlcpcb: ["C15195"] }}
        schX={5}
        schY={-5}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin1: "net.ADC", pin2: "net.GND" }}
      />
      {/* The same for mux 2's common, on GPIO3. GPIO3 is on the module's panel-edge row, with no
          room beside it, so its line crosses under the module on the ring face to the cap in
          the pocket. */}
      <capacitor
        name="C41"
        {...ear("C41")}
        capacitance="10nF"
        footprint={FP_0402}
        supplierPartNumbers={{ jlcpcb: ["C15195"] }}
        schX={5}
        schY={-20}
        schRotation={90}
        schSectionName="Adc"
        connections={{ pin1: "net.ADC2", pin2: "net.GND" }}
      />
      {/* Diode-connected transistor as the temperature sensor: about 265 µA through R10 gives
          a Vbe near 0.65 V, falling about 2 mV/°C. Only the change since each way was zeroed
          is used, so its part-to-part spread doesn't matter. A basic part, unlike any NTC.
          Wired by pad number: the MMBT3904's SOT-23 is 1 = B, 2 = E, 3 = C, but tscircuit's
          transistor names pin1 collector and pin3 emitter, so its pin labels would be wrong. */}
      <resistor
        name="R10"
        pcbX={Q1.x + 0.4}
        pcbY={Q1.y + 2.6}
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
        pcbX={Q1.x}
        pcbY={Q1.y}
        pcbRotation={-90}
        type="npn"
        footprint={FP_SOT23}
        manufacturerPartNumber="MMBT3904"
        supplierPartNumbers={{ jlcpcb: ["C20526"] }}
        schX={-5}
        schY={-9}
        schSectionName="Adc"
        connections={{ pin1: "net.TEMP", pin3: "net.TEMP", pin2: "net.GND" }}
      />
      {/* Mux 2, for ways 4–6, in the way 6 ear above the ground nut. VDD and the selects face
          the panel edge. Its inputs are in the order the lines leave the channel
          (lib/routes.tsx), so none cross. X5 and X7 are the spares: with INH, VEE and VSS they
          make an all-GND run at the row's −X end, so nothing escapes into the corner kept
          clear for the parts-face silk. */}
      <CD4051BM96
        name="U4"
        pcbX={MUX_2.x}
        pcbY={MUX_2.y}
        pcbRotation={180}
        schX={0}
        schY={-16}
        schSectionName="Adc"
        connections={{
          X3: "net.S4_SENSE",
          X0: "net.S4_VOLTS",
          X1: "net.S5_SENSE",
          X6: "net.S5_VOLTS",
          X4: "net.S6_SENSE",
          X2: "net.S6_VOLTS",
          X5: "net.GND",
          X7: "net.GND",
          X: "net.ADC2",
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
        name="C40"
        pcbX={MUX_2.x + 3.7}
        pcbY={9.3}
        pcbRotation={180}
        capacitance="100nF"
        footprint={FP_0402}
        supplierPartNumbers={{ jlcpcb: ["C307331"] }}
        schX={0}
        schY={-11}
        schRotation={-90}
        schSectionName="Adc"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />

      {/* ── ESP32-C3 ─────────────────────────────────────────────────────────── */}
      {/* GPIO4 is the only ADC1 pin on the module's outboard row, so it reads mux 1 and GPIO3
          reads mux 2. The selects run GPIO7, 6, 5 for A, B, C, so their lines nest on the way to
          both muxes. GPIO0, GPIO10, GPIO18 and GPIO19 are unused. */}
      <ESP32_C3_WROOM_02_N4
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
          IO4: "net.ADC",
          IO7: "net.MUX_S0",
          IO6: "net.MUX_S1",
          IO5: "net.MUX_S2",
          IO1: "net.LED",
          IO2: "net.IO2",
          IO8: "net.IO8",
          IO9: "net.IO9",
          IO3: "net.ADC2",
          RXD: "net.U0RXD",
          TXD: "net.U0TXD",
          GND: "net.GND",
          EP: "net.GND",
        }}
      />
      <capacitor
        name="C6"
        {...ear("C6")}
        capacitance="10uF"
        footprint={FP_0603}
        supplierPartNumbers={{ jlcpcb: ["C19702"] }}
        schX={14}
        schY={10}
        schRotation={-90}
        schSectionName="Mcu"
        connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
      />
      <capacitor
        name="C7"
        {...ear("C7")}
        capacitance="100nF"
        footprint={FP_0402}
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
        {...ear("R3")}
        {...R_10K}
        schX={14}
        schY={-6}
        schRotation={90}
        schSectionName="Mcu"
        connections={{ pin2: "net.V3V3", pin1: "net.EN" }}
      />
      <capacitor
        name="C8"
        {...ear("C8")}
        capacitance="1uF"
        footprint={FP_0402}
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
          ["R4", "net.IO2"],
          ["R5", "net.IO8"],
          ["R6", "net.IO9"],
        ] as const
      ).map(([name, net], i) => (
        <resistor
          key={name}
          name={name}
          {...R_10K}
          {...ear(name)}
          schX={30 + i * 1.5}
          schY={8}
          schRotation={90}
          schSectionName="Mcu"
          connections={{ pin2: "net.V3V3", pin1: net }}
        />
      ))}
      {/* Status LED, ESPHome status_led, on GPIO1. */}
      <resistor
        name="R7"
        {...ear("R7")}
        resistance="1k"
        footprint={FP_0402}
        supplierPartNumbers={{ jlcpcb: ["C11702"] }}
        schX={30}
        schY={-6}
        schSectionName="Mcu"
        connections={{ pin1: "net.LED", pin2: "net.LED_A" }}
      />
      <led
        name="LED1"
        {...ear("LED1")}
        color="red"
        footprint={FP_LED_0603}
        supplierPartNumbers={{ jlcpcb: ["C2286"] }}
        schX={33}
        schY={-8}
        schRotation={-90}
        schSectionName="Mcu"
        connections={{ anode: "net.LED_A", cathode: "net.GND" }}
      />

      {/* ── Programming ──────────────────────────────────────────────────────── */}
      {/* ESP-PROG through a pogo clamp on J1's pads, power jumper at 5 V. The clamp slides on
          from the board edge, so J1's column stays clear to the edge. Flash off the panel, or
          with the ground wire fitted. */}
      <ProgPads
        name="J1"
        pcbX={wayX(1)}
        pcbY={J1_Y}
        pcbRotation={0}
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
        pcbX={wayX(2)}
        pcbY={20.55}
        pcbRotation={0}
        schX={38}
        schY={5}
        schSectionName="Mcu"
        connections={{ anode: "net.PROG_VDD", cathode: "net.VSUP" }}
      />

      {/* ── Test pads ────────────────────────────────────────────────────────── */}
      {/* Behind way 2's nut, 3V3 on the way 1 side, where its trace arrives from the ear. */}
      {(
        [
          ["TP4", "net.V3V3", wayX(2) + 2.5, 24.4, 1.5],
          ["TP5", "net.VSUP", wayX(2), 24.4, 1.5],
          ["TP6", "net.GND", wayX(2) - 2.5, 24.4, 1.5],
        ] as const
      ).map(([name, net, pcbX, pcbY, diameter], i) => (
        <testpoint
          key={name}
          name={name}
          footprintVariant="pad"
          padShape="circle"
          padDiameter={`${diameter}mm`}
          pcbX={pcbX}
          pcbY={pcbY}
          schX={30 + i * 2}
          schY={-14}
          schSectionName="Mcu"
          connections={{ pin1: net }}
        />
      ))}
    </group>

    <Silkscreen />
  </board>
)
