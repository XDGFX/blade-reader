// The yoke: one board for all 12 ways of a 12-way ST Blade. The outline, the holes and the
// schematic: the arms are placed, the chin is not, and nothing is routed. Decisions behind
// every part are in docs/design.md. Part codes are LCSC/JLCPCB.
//
// Panel coordinates, in mm, as the research notes give them: `a` runs along the fuse panel from
// its positive end, so the chin is at negative a, and `c` runs across from the centreline.
// PCB coordinates are seen from the parts face (tscircuit's top) with the chin at the top:
// X = c mirrored, which the symmetric outline hides, and Y = A_MID − a.

import { Fragment } from "react"
import { A_74HC4067PW_118 } from "./imports/A_74HC4067PW_118"
import { ESP32_C3_WROOM_02_N4 } from "./imports/ESP32_C3_WROOM_02_N4"
import { SMTSO4040CTJ } from "./imports/SMTSO4040CTJ"
import { SS210 } from "./imports/SS210"
import { TYPE_C_31_M_12 } from "./imports/TYPE_C_31_M_12"
import { finger, CLAMP_Y, END, WAY_PITCH_PCB, type Pt } from "./lib/outline"
import { ExpansionPads, FP_0402, FP_0603, FP_LED_0603, FP_SOT23, ProgPads } from "./lib/parts"
import { Supply } from "./lib/supply"
import { Way, WAY_PITCH } from "./lib/way"

const PANEL_HALF = 84.2 / 2
/** Arm depth from the panel edge, and the output nut row's distance out from it (#48, revised). */
export const ARM_DEPTH = 16.7
const NUT_OUT = 10.7
export const HALF_WIDTH = PANEL_HALF + ARM_DEPTH

/** Ways 11–12 to ways 1–2, along. */
export const WAYS_A = [0, 1, 2, 3, 4, 5].map((k) => 27.83 + k * WAY_PITCH_PCB)
/** The arms' open end: where the last way's column ends. No ear, so every multiplexer is on the chin. */
export const A_OPEN = WAYS_A[5] + WAY_PITCH_PCB / 2
/** Where the ear past ways 11–12 ends and the arm steps 1 mm clear of the panel's side. */
const A_EAR = WAYS_A[0] - END
const DECK_CLEARANCE = 1

// The chin wraps the panel's positive end. It lies in the feed lug's own height band, so the lug
// and cable have to pass over the ring face.
// The panel's positive end in plan, as fuse_block_12 has it over its whole height: one half,
// across then along. Flat for 4.5 either side of the centreline, bowed back 3.8 by 39 across,
// then turned into the side within about 4.
export const PANEL_END: Pt[] = [
  [0, 0.05], [4.5, 0.05], [13, 0.41], [20, 1.0], [25, 1.56], [30, 2.21], [35, 3.04], [38, 3.56],
  [39, 3.77], [39.5, 3.91], [40, 4.18], [40.5, 4.48], [41, 4.9], [41.5, 5.48], [42, 6.43], [PANEL_HALF, 8],
].map(([x, y]) => ({ x, y }))
/** The chin's inner edge: the panel's end, DECK_CLEARANCE off it all the way round. */
const INNER: Pt[] = PANEL_END.map((p, i) => {
  // Each point moves out along the mean of its two edges' normals; the ends' are the centreline's and the side's.
  const normal = (a: Pt, b: Pt) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: (b.y - a.y) / len, y: -(b.x - a.x) / len }
  }
  const n0 = i === 0 ? { x: 0, y: -1 } : normal(PANEL_END[i - 1], p)
  const n1 = i === PANEL_END.length - 1 ? { x: 1, y: 0 } : normal(p, PANEL_END[i + 1])
  const k = DECK_CLEARANCE / (1 + n0.x * n1.x + n0.y * n1.y)
  return { x: p.x + (n0.x + n1.x) * k, y: p.y + (n0.y + n1.y) * k }
})
/** The chin's inner edge on the centreline. */
const A_CHIN_FLOOR = INNER[0].y
export const CHIN_DEPTH = 13.5
export const A_OUTER = A_CHIN_FLOOR - CHIN_DEPTH
/** Each outer corner of the chin is cut back this far across and along. */
export const CHAMFER = { across: 3, along: 3 }
/** The cut across each arm's outer corner at the open end. */
const END_CHAMFER = 4

// The +c half of the outline, from the chin's inner edge on the centreline to its outer edge.
const half = (): Pt[] => {
  // Rev A's finger, walked the other way: its X is a, its Y is outboard of the panel edge.
  const fingers = WAYS_A.flatMap((a) => finger(a).reverse().map((p) => ({ x: PANEL_HALF + p.y, y: p.x })))
  return [
    ...INNER,
    { x: PANEL_HALF + DECK_CLEARANCE, y: A_EAR },
    { x: PANEL_HALF, y: A_EAR + DECK_CLEARANCE },
    ...fingers,
    { x: PANEL_HALF, y: A_OPEN },
    { x: HALF_WIDTH - END_CHAMFER, y: A_OPEN },
    { x: HALF_WIDTH, y: A_OPEN - END_CHAMFER },
    { x: HALF_WIDTH, y: A_OUTER + CHAMFER.along },
    { x: HALF_WIDTH - CHAMFER.across, y: A_OUTER },
  ]
}

const A_MID = (A_OUTER + A_OPEN) / 2
/** Panel coordinates to PCB coordinates. */
export const pcb = (c: number, a: number): Pt => ({ x: -c, y: A_MID - a })

const right = half()
export const OUTLINE = [...right, ...right.slice(1).reverse().map((p) => ({ x: -p.x, y: p.y }))].map((p) =>
  pcb(p.x, p.y),
)

const sides = [1, -1] as const
/** Way screw holes, 8.52 into the panel. */
export const CLAMPS = sides.flatMap((s) => WAYS_A.map((a) => pcb(s * (PANEL_HALF + CLAMP_Y), a)))
/** Output nuts. */
export const NUTS = sides.flatMap((s) => WAYS_A.map((a) => pcb(s * (PANEL_HALF + NUT_OUT), a)))

// WROOM-02 on the odd arm's root, between the chin and way 11: 14 mm of its 20 on the board and
// its 6 mm antenna past the arm's outboard edge. Seen from its top with the antenna up, the
// antenna's feed is at the right, the pin 18 side, and Espressif asks for the feed at the
// board's corner: on this arm that side faces the chin's outer corner, on the even arm it would
// face way 12.
const MODULE_WIDTH = 18
const MODULE_ON_BOARD = 14
/** The module's pad rows are centred this far in from where its antenna starts. */
const MODULE_ORIGIN = 7.1
const ANTENNA = 6
const KEEPOUT = 15
/** The module's middle, along: its antenna ends 15 mm short of way 11's nut land. */
const MODULE_A = -1
/** A box on the odd arm's outboard edge, `half` either side of the module's middle. */
const sideBox = (half: number, inboard: number, out: number): Pt[] =>
  [[-half, -inboard], [half, -inboard], [half, out], [-half, out], [-half, -inboard]].map(([u, n]) =>
    pcb(HALF_WIDTH + n, MODULE_A + u),
  )
export const MODULE = sideBox(MODULE_WIDTH / 2, MODULE_ON_BOARD, ANTENNA)
export const ANTENNA_AREA = sideBox(MODULE_WIDTH / 2, 0, ANTENNA)
/** No nut, inductor, test pad or tall part within 15 mm of the antenna. */
export const ANTENNA_KEEPOUT = sideBox(MODULE_WIDTH / 2 + KEEPOUT, KEEPOUT, ANTENNA + KEEPOUT)

type Place = { pcbX: number; pcbY: number; pcbRotation: number }
/**
 * A place in the module's own frame, as its footprint is drawn: x across its pin rows with pins
 * 10–18 at +x, the chin's side, and y towards the antenna. `turn` is the part's rotation in
 * that frame.
 */
const byModule = (x: number, y: number, turn = 0): Place => {
  const p = pcb(HALF_WIDTH - MODULE_ORIGIN + y, MODULE_A - x)
  return { pcbX: p.x, pcbY: p.y, pcbRotation: 90 + turn }
}
/** A place in panel coordinates, across and along; the rotation is the PCB's. */
const at = (c: number, a: number, pcbRotation = 0): Place => {
  const p = pcb(c, a)
  return { pcbX: p.x, pcbY: p.y, pcbRotation }
}

/** The one ground nut, on the even arm's root. */
export const GROUND_NUT = pcb(-51, -2.5)
/** JLC tooling holes, Ø1.152: one on the chin beside J1's diode, one at the far arm's open end, clear of every ring keepout. */
export const TOOLING = [pcb(-9, A_OUTER + 2.5), pcb(PANEL_HALF + 3, A_OPEN - 2.5)]

/** J1's middle: the pogo clamp's pads, their centre line 4.6 from the chin's outer edge (#77). */
export const J1_AT = pcb(6, A_OUTER + 4.6)
/** Kept clear for the clamp on both faces: 18 along the edge, 9.5 in. */
export const J1_BOX = [[-9, 4.6], [9, 4.6], [9, -4.9], [-9, -4.9], [-9, 4.6]].map(([x, y]) => ({ x: J1_AT.x + x, y: J1_AT.y + y }))

const WAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const ODD = WAYS.filter((n) => n % 2 === 1)
const EVEN = WAYS.filter((n) => n % 2 === 0)
/** Way `n`'s place in CLAMPS and NUTS: odd ways at +c, which is −X, and 11–12 nearest the chin. */
const hole = (n: number) => (n % 2 ? 0 : 6) + 5 - Math.floor((n - 1) / 2)
// The column as rev A drew it has its sensor on the chin side only on the odd arm. The even arm,
// the ground nut's, takes the mirror (#65), so its current runs the other way through its sensors.
const mirrored = (n: number) => n % 2 === 0

const R_10K = { resistance: "10k", footprint: FP_0402, supplierPartNumbers: { jlcpcb: ["C25744"] } }
const C_100N = { capacitance: "100nF", footprint: FP_0402, supplierPartNumbers: { jlcpcb: ["C307331"] } }
const C_10N = { capacitance: "10nF", footprint: FP_0402, supplierPartNumbers: { jlcpcb: ["C15195"] } }

// Diode-connected transistor as a temperature sensor: about 265 µA through the 10k gives a Vbe
// near 0.65 V, falling about 2 mV/°C. Only the change since each way was zeroed is used, so its
// part-to-part spread doesn't matter. A basic part, unlike any NTC.
// Wired by pad number: the MMBT3904's SOT-23 is 1 = B, 2 = E, 3 = C, but tscircuit's transistor
// names pin1 collector and pin3 emitter, so its pin labels would be wrong.
const Temperature = ({
  q,
  r,
  net,
  place,
  schX,
  schY,
}: {
  q: string
  r: string
  net: string
  /** Where the transistor and its resistor stand. The arms' wait for the arm's layout. */
  place?: { q: Place; r: Place }
  schX: number
  schY: number
}) => (
  <>
    <resistor
      name={r}
      {...place?.r}
      {...R_10K}
      schX={schX}
      schY={schY}
      schRotation={90}
      schSectionName="Adc"
      connections={{ pin2: "net.V3V3", pin1: net }}
    />
    <transistor
      name={q}
      {...place?.q}
      type="npn"
      footprint={FP_SOT23}
      manufacturerPartNumber="MMBT3904"
      supplierPartNumbers={{ jlcpcb: ["C20526"] }}
      schX={schX}
      schY={schY - 3}
      schSectionName="Adc"
      connections={{ pin1: net, pin3: net, pin2: "net.GND" }}
    />
  </>
)

// One arm's 16:1 multiplexer. Channel k reads the arm's k-th way from the open end, so Y0 is way
// 1 or 2 and Y5 way 11 or 12, and channel 8 + k reads that way's voltage. Y6 is the arm's
// temperature and Y7 whatever `y7` gives it. Routing may reorder the channels; firmware follows
// this schematic.
const Mux = ({
  name,
  ways,
  sense,
  temperature,
  y7,
  common,
  place,
  schX,
  schY,
}: {
  name: string
  place: Place
  ways: number[]
  sense: (n: number) => string
  temperature: string
  y7: string
  common: string
  schX: number
  schY: number
}) => (
  <A_74HC4067PW_118
    name={name}
    {...place}
    schX={schX}
    schY={schY}
    schSectionName="Adc"
    connections={{
      ...Object.fromEntries(
        ways.flatMap((n, k) => [
          [`Y${k}`, sense(n)],
          [`Y${8 + k}`, `net.S${n}_VOLTS`],
        ]),
      ),
      Y6: temperature,
      Y7: y7,
      Y14: "net.GND",
      Y15: "net.GND",
      Z: common,
      S0: "net.MUX_S0",
      S1: "net.MUX_S1",
      S2: "net.MUX_S2",
      S3: "net.MUX_S3",
      N_E: "net.GND",
      GND: "net.GND",
      VCC: "net.V3V3",
    }}
  />
)

export default () => (
  <board
    outline={OUTLINE}
    thickness="1.6mm"
    solderMaskColor="black"
    silkscreenColor="white"
    routingDisabled
  >
    <schematicsection name="WaysOdd" displayName="Odd ways, 1–11" />
    <schematicsection name="WaysEven" displayName="Even ways, 2–12: the mirrored arm" />
    <schematicsection name="Supply" displayName="Supply" />
    <schematicsection name="Mcu" displayName="ESP32-C3, USB and programming" />
    <schematicsection name="Adc" displayName="Multiplexers, dividers and temperature" />

    {/* ── Ways ─────────────────────────────────────────────────────────────── */}
    {WAYS.map((n) => (
      <Way
        key={n}
        n={n}
        finger={CLAMPS[hole(n)]}
        nut={NUTS[hole(n)]}
        mirrored={mirrored(n)}
        chinmost={n > 10}
        schX={n % 2 ? -68 : -46}
        schY={20 - Math.floor((n - 1) / 2) * WAY_PITCH}
        section={n % 2 ? "WaysOdd" : "WaysEven"}
      />
    ))}

    {/* Ground: a ring-terminated wire from this nut to the panel's negative bus. */}
    <SMTSO4040CTJ
      name="N13"
      pcbX={GROUND_NUT.x}
      pcbY={GROUND_NUT.y}
      schX={-8}
      schY={14}
      schSectionName="Supply"
      connections={{ pin1: "net.GND" }}
    />
    {TOOLING.map((at, i) => (
      <Fragment key={i}>
        <hole name={`TOOL${i + 1}`} pcbX={at.x} pcbY={at.y} diameter={1.152} />
      </Fragment>
    ))}

    {/* ── Supply ───────────────────────────────────────────────────────────── */}
    <Supply schX={-8} schY={24} />

    {/* ── Multiplexers and ADC ─────────────────────────────────────────────── */}
    {/* Mux 1 reads the odd arm and the chin's temperature, on GPIO4. */}
    <Mux
      name="U2"
      place={at(48.2, 15.5, 90)}
      ways={ODD}
      sense={(n) => `net.S${n}_SENSE`}
      temperature="net.TEMP_ODD"
      y7="net.TEMP_CHIN"
      common="net.ADC"
      schX={0}
      schY={2}
    />
    <capacitor
      name="C9"
      {...at(54.3, 19.1)}
      {...C_100N}
      schX={0}
      schY={8}
      schRotation={-90}
      schSectionName="Adc"
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    {/* At the ADC pin. Settles in under 5 ms per mux step: set ESPHome's mux delay to 5 ms
        or more. The mux's on-resistance isolates it from the CC6905's 2.2 nF load limit. */}
    <capacitor
      name="C10"
      {...byModule(-11.2, 2.9, 180)}
      {...C_10N}
      schX={5}
      schY={-4}
      schRotation={90}
      schSectionName="Adc"
      connections={{ pin1: "net.ADC", pin2: "net.GND" }}
    />
    {/* Mux 2 reads the even arm, on GPIO3. */}
    <Mux
      name="U4"
      place={at(-51, 8.5, 90)}
      ways={EVEN}
      sense={(n) => `net.S${n}_MUX`}
      temperature="net.TEMP_EVEN"
      y7="net.GND"
      common="net.ADC2"
      schX={0}
      schY={-18}
    />
    <capacitor
      name="C40"
      {...at(-45.2, 12.1)}
      {...C_100N}
      schX={0}
      schY={-12}
      schRotation={-90}
      schSectionName="Adc"
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    <capacitor
      name="C41"
      {...byModule(11.2, 1.5)}
      {...C_10N}
      schX={5}
      schY={-24}
      schRotation={90}
      schSectionName="Adc"
      connections={{ pin1: "net.ADC2", pin2: "net.GND" }}
    />
    {/* The mirrored arm's sense lines, divided by 0.820 at mux 2: 1.35 V at rest and 2.43 V at
        30 A, under the ADC's 2.5 V (#73). With C41 the divider's 18 kΩ is an 880 Hz low-pass. */}
    {EVEN.map((n, k) => (
      <Fragment key={n}>
        <resistor
          name={`R3${n}`}
          {...at(-47.75 - k * 1.3, 16.6, 90)}
          resistance="22k"
          footprint={FP_0402}
          supplierPartNumbers={{ jlcpcb: ["C25768"] }}
          schX={-16 + k * 1.5}
          schY={-16}
          schRotation={90}
          schSectionName="Adc"
          connections={{ pin2: `net.S${n}_SENSE`, pin1: `net.S${n}_MUX` }}
        />
        <resistor
          name={`R4${n}`}
          {...at(-47.75 - k * 1.3, 14.2, 90)}
          resistance="100k"
          footprint={FP_0402}
          supplierPartNumbers={{ jlcpcb: ["C25741"] }}
          schX={-16 + k * 1.5}
          schY={-19}
          schRotation={90}
          schSectionName="Adc"
          connections={{ pin2: `net.S${n}_MUX`, pin1: "net.GND" }}
        />
      </Fragment>
    ))}
    <Temperature
      q="Q1"
      r="R10"
      net="net.TEMP_CHIN"
      place={{ q: at(-4, -3.2), r: at(-8, -3.2) }}
      schX={-8}
      schY={4}
    />
    <Temperature q="Q2" r="R8" net="net.TEMP_ODD" schX={-11} schY={4} />
    <Temperature q="Q3" r="R9" net="net.TEMP_EVEN" schX={-14} schY={4} />

    {/* ── ESP32-C3 ─────────────────────────────────────────────────────────── */}
    {/* Every pin is used. GPIO4 and GPIO3 read the two multiplexers, GPIO7, 6, 5 and 10 select,
        GPIO18 and GPIO19 are the native USB, and GPIO0, the last clean ADC1 pin, goes to J3 with
        GPIO2. GPIO2, GPIO8 and GPIO9 are the strapping pins, all pulled high. */}
    <ESP32_C3_WROOM_02_N4
      name="U1"
      {...byModule(0, 0)}
      schX={22}
      schY={0}
      schSectionName="Mcu"
      connections={{
        "3V3": "net.V3V3",
        EN: "net.EN",
        IO4: "net.ADC",
        IO3: "net.ADC2",
        IO7: "net.MUX_S0",
        IO6: "net.MUX_S1",
        IO5: "net.MUX_S2",
        IO10: "net.MUX_S3",
        IO1: "net.LED",
        IO8: "net.IO8",
        IO9: "net.IO9",
        IO2: "net.IO2",
        IO0: "net.IO0",
        IO18: "net.USB_DN",
        IO19: "net.USB_DP",
        RXD: "net.U0RXD",
        TXD: "net.U0TXD",
        GND: "net.GND",
        EP: "net.GND",
      }}
    />
    <capacitor
      name="C6"
      {...byModule(-13.75, 3.3, 180)}
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
      {...byModule(-12.5, 5.9, 180)}
      {...C_100N}
      schX={15.5}
      schY={10}
      schRotation={-90}
      schSectionName="Mcu"
      connections={{ pin1: "net.V3V3", pin2: "net.GND" }}
    />
    {/* EN: the module has no RC of its own. Also gives esptool's auto-reset a clean edge. */}
    <resistor
      name="R3"
      {...byModule(-10.75, 5.25, 90)}
      {...R_10K}
      schX={14}
      schY={-6}
      schRotation={90}
      schSectionName="Mcu"
      connections={{ pin2: "net.V3V3", pin1: "net.EN" }}
    />
    <capacitor
      name="C8"
      {...byModule(-12.5, 4.6, 180)}
      capacitance="1uF"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C52923"] }}
      schX={14}
      schY={-9}
      schRotation={90}
      schSectionName="Mcu"
      connections={{ pin1: "net.EN", pin2: "net.GND" }}
    />
    {/* Strapping pins: normal boot needs GPIO2 and GPIO9 high, and a serial download GPIO8 high. */}
    {(
      [
        ["R4", "net.IO2", byModule(11.2, 3.0)],
        ["R5", "net.IO8", byModule(-11.2, -3.0, 180)],
        ["R6", "net.IO9", byModule(-11.2, -4.5, 180)],
      ] as const
    ).map(([name, net, place], i) => (
      <resistor
        key={name}
        name={name}
        {...place}
        {...R_10K}
        schX={30 + i * 1.5}
        schY={8}
        schRotation={90}
        schSectionName="Mcu"
        connections={{ pin2: "net.V3V3", pin1: net }}
      />
    ))}
    {/* Status LED, green, ESPHome status_led, on GPIO1. */}
    <resistor
      name="R7"
      {...byModule(11.2, 4.5)}
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
      {...at(41, -12.6)}
      color="green"
      footprint="0805"
      supplierPartNumbers={{ jlcpcb: ["C2297"] }}
      schX={33}
      schY={-8}
      schRotation={-90}
      schSectionName="Mcu"
      connections={{ anode: "net.LED_A", cathode: "net.GND" }}
    />
    {/* Fault LED, red, lit when GPIO8 is low. From 3V3, because GPIO8 must be high at boot; R5
        is what holds it there, since the LED alone would leave it a diode drop short. */}
    <resistor
      name="R50"
      {...at(34.2, -12.6)}
      resistance="1k"
      footprint={FP_0402}
      supplierPartNumbers={{ jlcpcb: ["C11702"] }}
      schX={30}
      schY={-12}
      schSectionName="Mcu"
      connections={{ pin1: "net.V3V3", pin2: "net.FAULT_A" }}
    />
    <led
      name="LED2"
      {...at(37, -12.6)}
      color="red"
      footprint={FP_LED_0603}
      supplierPartNumbers={{ jlcpcb: ["C2286"] }}
      schX={33}
      schY={-14}
      schRotation={-90}
      schSectionName="Mcu"
      connections={{ anode: "net.FAULT_A", cathode: "net.IO8" }}
    />

    {/* ── USB ──────────────────────────────────────────────────────────────── */}
    {/* The module's native USB: no bridge chip, no auto-reset parts. A 5.1k on each CC pin asks
        the host for 5 V whichever way up the plug is. */}
    <TYPE_C_31_M_12
      name="J2"
      {...at(25, A_OUTER + 4.85, 180)}
      schX={40}
      schY={-12}
      schSectionName="Mcu"
      connections={{
        VBUS1: "net.USB_VBUS",
        VBUS2: "net.USB_VBUS",
        DP1: "net.USB_DP",
        DP2: "net.USB_DP",
        DN1: "net.USB_DN",
        DN2: "net.USB_DN",
        CC1: "net.USB_CC1",
        CC2: "net.USB_CC2",
        GND1: "net.GND",
        GND2: "net.GND",
        EH1: "net.GND",
        EH2: "net.GND",
        EH3: "net.GND",
        EH4: "net.GND",
      }}
    />
    {(["USB_CC1", "USB_CC2"] as const).map((net, i) => (
      <resistor
        key={net}
        name={`R5${i + 1}`}
        {...at(22.2 + i * 5.6, -5.2)}
        resistance="5.1k"
        footprint={FP_0603}
        supplierPartNumbers={{ jlcpcb: ["C23186"] }}
        schX={46 + i * 1.5}
        schY={-16}
        schRotation={90}
        schSectionName="Mcu"
        connections={{ pin2: `net.${net}`, pin1: "net.GND" }}
      />
    ))}
    {/* Stops a live panel back-feeding 12–24 V into the USB host. */}
    <SS210
      name="D3"
      {...at(17.3, -10.5, 90)}
      schX={37}
      schY={-6}
      schSectionName="Mcu"
      connections={{ anode: "net.USB_VBUS", cathode: "net.VSUP" }}
    />

    {/* ── Programming ──────────────────────────────────────────────────────── */}
    {/* The recovery route: an ESP-PROG through a pogo clamp on J1's pads, power jumper at 5 V.
        Flash off the panel, or with the ground wire fitted. */}
    <ProgPads
      name="J1"
      pcbX={J1_AT.x}
      pcbY={J1_AT.y}
      schX={40}
      schY={2}
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
    {/* Stops a live panel back-feeding 12–24 V into the ESP-PROG. */}
    <SS210
      name="D2"
      {...at(-5, -10.5, 90)}
      schX={40}
      schY={7}
      schSectionName="Mcu"
      connections={{ anode: "net.PROG_VDD", cathode: "net.VSUP" }}
    />
    {/* Unpopulated. GPIO2 is a strapping pin: anything that holds it low at power-up stops the
        board booting. */}
    <ExpansionPads
      name="J3"
      {...at(37, -8.5)}
      schX={30}
      schY={-18}
      schSectionName="Mcu"
      connections={{ "3V3": "net.V3V3", GND: "net.GND", IO0: "net.IO0", IO2: "net.IO2" }}
    />

    {/* ── Test pads ────────────────────────────────────────────────────────── */}
    {(
      [
        ["TP4", "net.V3V3"],
        ["TP5", "net.VSUP"],
        ["TP6", "net.GND"],
      ] as const
    ).map(([name, net], i) => (
      <testpoint
        key={name}
        name={name}
        {...at(3 + i * 3, -2.9)}
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.5mm"
        schX={22 + i * 2}
        schY={-12}
        schSectionName="Mcu"
        connections={{ pin1: net }}
      />
    ))}

    <pcbnotepath route={MODULE} />
    <pcbnotepath route={ANTENNA_KEEPOUT} />
    <pcbnotepath route={J1_BOX} />
  </board>
)
