// Blade Reader rev A: one 6-way strip.
// Decisions behind every part are in docs/design.md. Part codes are LCSC/JLCPCB.
//
// Board size is a placeholder until the layout ticket draws the comb.

import { CD4051BM96 } from "./imports/CD4051BM96"
import { ESP32_C3_MINI_1_N4 } from "./imports/ESP32_C3_MINI_1_N4"
import { SMTSO4040CTJ } from "./imports/SMTSO4040CTJ"
import { SS210 } from "./imports/SS210"
import { ProgLock } from "./lib/parts"
import { Supply } from "./lib/supply"
import { Way, WAY_PITCH } from "./lib/way"

const WAYS = [1, 2, 3, 4, 5, 6]

const ESP_GND_PINS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
].map((i) => `GND${i}`)

const R_10K = { resistance: "10k", footprint: "0402", supplierPartNumbers: { jlcpcb: ["C25744"] } }

export default () => (
  <board
    width="120mm"
    height="60mm"
    nominalTraceWidth="0.25mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.6mm"
  >
    <schematicsection name="Ways" displayName="Ways 1–6" />
    <schematicsection name="Supply" displayName="Supply" />
    <schematicsection name="Mcu" displayName="ESP32-C3 and programming" />
    <schematicsection name="Adc" displayName="Multiplexer and ADC" />

    {/* ── Ways ─────────────────────────────────────────────────────────────── */}
    {WAYS.map((n) => (
      <Way key={n} n={n} schX={-30} schY={15 - (n - 1) * WAY_PITCH} />
    ))}

    {/* Ground: a ring-terminated wire from this nut to the panel's negative bus. */}
    <SMTSO4040CTJ
      name="N7"
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
      {...R_10K}
      schX={-5}
      schY={-6}
      schRotation={90}
      schSectionName="Adc"
      connections={{ pin2: "net.V3V3", pin1: "net.TEMP" }}
    />
    <transistor
      name="Q1"
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
    <ESP32_C3_MINI_1_N4
      name="U1"
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
      {...R_10K}
      schX={14}
      schY={-6}
      schRotation={90}
      schSectionName="Mcu"
      connections={{ pin2: "net.V3V3", pin1: "net.EN" }}
    />
    <capacitor
      name="C8"
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
    {[
      ["R4", "net.IO2"],
      ["R5", "net.IO8"],
      ["R6", "net.IO9"],
    ].map(([name, net], i) => (
      <resistor
        key={name}
        name={name}
        {...R_10K}
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
      schX={38}
      schY={5}
      schSectionName="Mcu"
      connections={{ anode: "net.PROG_VDD", cathode: "net.VSUP" }}
    />

    {/* ── Test pads ────────────────────────────────────────────────────────── */}
    {[
      ["TP1", "net.IO0"],
      ["TP2", "net.IO1"],
      ["TP3", "net.IO4"],
      ["TP4", "net.V3V3"],
      ["TP5", "net.VSUP"],
      ["TP6", "net.GND"],
    ].map(([name, net], i) => (
      <testpoint
        key={name}
        name={name}
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.5mm"
        schX={30 + i * 2}
        schY={-14}
        schSectionName="Mcu"
        connections={{ pin1: net }}
      />
    ))}
  </board>
)
