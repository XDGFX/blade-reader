// Hand-routed signal traces. The autorouter is off (routeRemaining={false} on the board): it
// can't see the ring keepouts and routes through the hand-drawn pours.
//
// Points are strip coordinates (lib/outline.tsx). Each path is anchored on W1's clamp hole,
// which is unrotated, so `pcbPaths` points are plain offsets from it; the ports at either end
// are given as selectors. The pours clear other nets' traces by 0.3 mm by themselves.
//
// The channel: the ring face from the GND bus (out to 1.0) to the load copper (from 6.3) runs
// the whole strip. Its lanes carry the sense and voltage lines to the multiplexers, the select
// lines and ADC2 between the two ears, and 3V3 along its top. A line drops into the channel
// through a via at the top of the stack at that point, then settles into its lane.

import { CLAMP_Y, ESP_ROW_Y, type Pt, wayX } from "./outline"
import { bandX, SENSOR } from "./way"

const ANCHOR = { x: wayX(1), y: CLAMP_Y }

type Step = Pt | string | { via: Pt; to: "top" | "bottom" }
type Steps = (Step | Step[])[]

const toPathPoint = (s: Step) => {
  if (typeof s === "string") return s
  if ("via" in s) return { x: s.via.x - ANCHOR.x, y: s.via.y - ANCHOR.y, via: true, toLayer: s.to }
  return { x: s.x - ANCHOR.x, y: s.y - ANCHOR.y }
}

const Route = ({
  from,
  to,
  width = 0.2,
  maxLength,
  paths,
}: { from: string; to: string; width?: number; maxLength?: number; paths: Steps[] }) => (
  <trace
    from={from}
    to={to}
    thickness={`${width}mm`}
    maxLength={maxLength}
    pcbPathRelativeTo=".W1 > .pin1"
    pcbPaths={paths.map((p) => (p.flat() as Step[]).map(toPathPoint)) as any}
  />
)

// A via needs a wire point at its position on each side.
const down = (p: Pt): Step[] => [p, { via: p, to: "bottom" }, p]
const up = (p: Pt): Step[] => [p, { via: p, to: "top" }, p]

/** The GND bus on the ring face, out to 1.0: GND vias land at this height. */
const BUS_Y = 0.65
/** 3V3 along the top of the channel. */
const V3V3_Y = 5.8
/** Channel lanes from the bus up, 0.15 wide on a 0.35 pitch. */
const lane = (i: number) => 1.45 + 0.35 * i
const LANE_WIDTH = 0.15
/** A line's via sits just clear of the lane below its own; the line then settles into its lane. */
const entryY = (i: number) => lane(i - 1) + 0.525

/** Drops into lane `i` through a via at `via`, then runs along it in direction `dir` to `x`. */
const intoLane = (via: Pt, i: number, dir: 1 | -1, x: number): Step[] => [
  ...down(via),
  { x: via.x + dir * 0.4, y: lane(i) },
  { x, y: lane(i) },
]

/**
 * Where a lane's line leaves the channel. Towards way 1 it turns outboard on the ring face, in
 * the bundle beside the ESP32: 3V3 nearest way 1, then lanes 10 down to 4, 0.3 apart. Towards
 * way 6 it ends in the way 6 ear.
 */
const bundleX = (i: number) => 41.525 - 0.3 * (i - 4)
const laneEnd = (i: number, dir: 1 | -1) => (dir > 0 ? bundleX(i) : -41.0)

/** The two rows of vias under mux 1's body, one for each row of its pads. */
const MUX_1 = { viaLow: 18.6, viaHigh: 21.15 }
/** X of mux 1's `k`th pad along either row, from the way 1 end. */
const muxX = (k: number) => 41.555 + 1.27 * k

/**
 * Each lane's way on from the bundle to its via under mux 1, on the ring face. Lanes 4–6 turn
 * towards the board end above the select vias and cross under the module to the far side of
 * EN's line; lanes 7–10 and 3V3 step over together, clear of way 1's swung ring keepout, and
 * carry on outboard. Each ends on the parts face, where the route adds its mux pad.
 */
const TAILS: Record<number, Step[]> = {
  4: [{ x: bundleX(4), y: 8.45 }, { x: 46.25, y: 8.45 }, { x: 46.25, y: 20.6 }, { x: muxX(4), y: 20.985 }, ...up({ x: muxX(4), y: MUX_1.viaHigh })],
  5: [{ x: bundleX(5), y: 8.75 }, { x: 45.9, y: 8.75 }, { x: 45.9, y: 20.4 }, { x: muxX(3), y: 20.935 }, ...up({ x: muxX(3), y: MUX_1.viaHigh })],
  6: [{ x: bundleX(6), y: 9.05 }, { x: muxX(3), y: 9.05 }, ...up({ x: muxX(3), y: MUX_1.viaLow })],
  7: [{ x: bundleX(7), y: 10.0 }, { x: muxX(1), y: 12.2 }, ...up({ x: muxX(1), y: MUX_1.viaLow })],
  8: [
    { x: bundleX(8), y: 10.125 },
    { x: 42.19, y: 11.99 },
    { x: 42.19, y: 19.4 },
    { x: 43.6, y: 19.4 },
    { x: muxX(2), y: 19.895 },
    ...up({ x: muxX(2), y: MUX_1.viaHigh }),
  ],
  9: [{ x: bundleX(9), y: 10.25 }, { x: muxX(0), y: 11.78 }, ...up({ x: muxX(0), y: MUX_1.viaLow })],
  10: [
    { x: bundleX(10), y: 10.375 },
    { x: 40.95, y: 11.6 },
    { x: 40.95, y: 19.6 },
    { x: 42.5, y: MUX_1.viaHigh },
    ...up({ x: muxX(1), y: MUX_1.viaHigh }),
  ],
}
/** Where 3V3 comes up from the ring face, beside mux 1. */
const V3V3_VIA: Pt = { x: 40.4, y: 17.0 }
const V3V3_TAIL: Step[] = [{ x: 39.35, y: V3V3_Y }, { x: 39.35, y: 10.55 }, { x: V3V3_VIA.x, y: 11.6 }, ...up(V3V3_VIA)]

/** X of way `n`'s sensor signal pins. */
const sensePinX = (n: number) => bandX(n, wayX(n)) + SENSOR.dx + 2.6

/**
 * Each way's sense and voltage lines: their lane, and the multiplexer input they go to. Ways
 * 1–3 run towards way 1, to mux 1 (U2), and ways 4–6 towards way 6, to mux 2 (U4). A line
 * that joins the channel further from its mux runs in a lower lane, under the vias of the
 * lines that join later. Lanes 0–3 carry the select lines and ADC2 the whole length, and
 * TEMP has lane 4 on the ways 1–3 side.
 */
const LINES: Record<number, { sense: { lane: number; to: string }; volts: { lane: number; to: string } }> = {
  1: { volts: { lane: 9, to: ".U2 > .X4" }, sense: { lane: 10, to: ".U2 > .X2" } },
  2: { volts: { lane: 7, to: ".U2 > .X6" }, sense: { lane: 8, to: ".U2 > .X1" } },
  3: { volts: { lane: 5, to: ".U2 > .X0" }, sense: { lane: 6, to: ".U2 > .X7" } },
  4: { sense: { lane: 4, to: ".U4 > .X0" }, volts: { lane: 5, to: ".U4 > .X3" } },
  5: { sense: { lane: 6, to: ".U4 > .X1" }, volts: { lane: 7, to: ".U4 > .X4" } },
  6: { sense: { lane: 8, to: ".U4 > .X2" }, volts: { lane: 9, to: ".U4 > .X6" } },
}

/**
 * One way's column: the sensor's caps, GND and 3V3, the divider's tap on the line copper, and
 * the sense and voltage lines into the channel.
 */
export const ColumnRoutes = ({ n, divider }: { n: number; divider: Pt }) => {
  const cx = wayX(n)
  const b = bandX(n, cx)
  // The sensor's signal pins, GND (2.095) to VCC (5.905), are at x P, 1.8 long.
  const P = b + SENSOR.dx + 2.6
  const U = `.U1${n}`
  const pin = (name: string) => `${U} > .${name}`
  const cap = (k: 1 | 2 | 3, p: 1 | 2) => `.C${k}${n} > .pin${p}`
  // The caps' GND runs down the sensor's +X side, clear of the sense via inside it. Way 1's
  // via and GND sit closer in, to leave the corridor beside the module to its lines.
  const viaX = P + (n === 1 ? 1.35 : 1.6)
  const G = P + (n === 1 ? 1.9 : 2.2)
  const D = divider.x
  const line = LINES[n]
  const dir = n <= 3 ? 1 : -1
  return (
    <>
      {/* VCC cap, straight down to the pin. */}
      <Route from={cap(1, 1)} to={pin("VCC")} width={0.25} paths={[[cap(1, 1), pin("VCC")]]} />
      {/* VREF cap, down the −X side of the signal pins. */}
      <Route
        from={cap(2, 1)}
        to={pin("VREF")}
        width={0.15}
        paths={[[cap(2, 1), { x: P - 1.15, y: 6.85 }, { x: P - 1.15, y: 3.6 }, { x: P - 0.6, y: 3.365 }, pin("VREF")]]}
      />
      {/* Sense cap, round the +X end of VCC. A filter, not decoupling, so length matters less. */}
      <Route
        from={cap(3, 1)}
        to={pin("VOUT")}
        width={LANE_WIDTH}
        maxLength={4.5}
        paths={[[cap(3, 1), { x: P + 1.3, y: 6.75 }, { x: P + 1.3, y: 4.635 }, pin("VOUT")]]}
      />
      {/* The caps' GND, joined along their outer pads, then round the +X side of the signal
          pins to the GND pin: the caps sit above the pins, so this is the shortest return. */}
      <Route
        from={cap(2, 2)}
        to="net.GND"
        maxLength={12}
        paths={[
          [
            cap(2, 2),
            cap(1, 2),
            cap(3, 2),
            { x: G, y: 8.21 },
            { x: G, y: 2.095 },
            pin("GND"),
          ],
        ]}
      />
      <Route from={pin("GND")} to="net.GND" paths={[[pin("GND"), { x: P + 0.3, y: 1.2 }, down({ x: P + 0.3, y: BUS_Y })]]} />
      {/* 3V3 from the top of the channel, up between the VCC pin and its cap. Each way's drop
          carries the channel's 3V3 on to the next way towards way 1. */}
      <Route
        from={cap(1, 1)}
        to="net.V3V3"
        width={0.3}
        maxLength={n === 1 ? 19 : 18}
        paths={[
          [
            cap(1, 1),
            down({ x: P, y: 6.55 }),
            { x: P, y: V3V3_Y },
            ...(n === 1 ? V3V3_TAIL : [{ x: sensePinX(n - 1), y: V3V3_Y }]),
          ],
        ]}
      />
      {/* Sense and voltage lines into the channel. */}
      <Route
        from={pin("VOUT")}
        to={line.sense.to}
        width={LANE_WIDTH}
        paths={[
          [
            pin("VOUT"),
            { x: P + 1.3, y: 4.635 },
            ...intoLane({ x: viaX, y: entryY(line.sense.lane) }, line.sense.lane, dir, laneEnd(line.sense.lane, dir)),
            ...(dir > 0 ? [...TAILS[line.sense.lane], line.sense.to] : []),
          ],
        ]}
      />
      <Route
        from={`.R1${n} > .pin1`}
        to={line.volts.to}
        width={LANE_WIDTH}
        paths={[
          [
            `.R1${n} > .pin1`,
            { x: b - 5.86, y: 3.59 },
            ...intoLane({ x: b - 5.86, y: entryY(line.volts.lane) }, line.volts.lane, dir, laneEnd(line.volts.lane, dir)),
            ...(dir > 0 ? [...TAILS[line.volts.lane], line.volts.to] : []),
          ],
        ]}
      />
      {/* The divider: its two VOLTS pads joined, and its top pad onto the diode's anode. */}
      <Route
        from={`.R2${n} > .pin2`}
        to={`.R1${n} > .pin1`}
        width={LANE_WIDTH}
        paths={[[`.R2${n} > .pin2`, `.R1${n} > .pin1`]]}
      />
      <Route
        from={`.R1${n} > .pin2`}
        to={`.D1${n} > .anode`}
        paths={[[`.R1${n} > .pin2`, { x: D, y: 5.45 }, { x: b - 5.0, y: 5.45 }, { x: b - 5.0, y: 3.3 }]]}
      />
    </>
  )
}

/**
 * The temperature sensor between ways 3 and 4: Q1's GND joins way 4's cap GND, R10 takes 3V3
 * from the channel up the gap between the two ways' ring-face copper, and TEMP drops into its
 * lane below Q1.
 */
const TempRoutes = () => {
  const g4 = sensePinX(4) + 2.2
  return (
    <>
      <Route from=".Q1 > .pin2" to="net.GND" paths={[[".Q1 > .pin2", { x: g4, y: 8.21 }]]} />
      <Route from=".Q1 > .pin1" to=".R10 > .pin1" width={LANE_WIDTH} paths={[[".Q1 > .pin1", ".R10 > .pin1"]]} />
      <Route
        from=".Q1 > .pin1"
        to=".Q1 > .pin3"
        width={LANE_WIDTH}
        paths={[[".Q1 > .pin1", { x: 1.25, y: 8.94 }, { x: 1.25, y: 6.66 }, ".Q1 > .pin3"]]}
      />
      <Route
        from=".R10 > .pin2"
        to="net.V3V3"
        width={0.25}
        paths={[[".R10 > .pin2", ...down({ x: 0, y: 11.3 }), { x: 0, y: V3V3_Y }]]}
      />
      <Route
        from=".Q1 > .pin3"
        to=".U2 > .X3"
        width={LANE_WIDTH}
        paths={[[".Q1 > .pin3", ...intoLane({ x: -0.4, y: 5.1 }, 4, 1, laneEnd(4, 1)), ...TAILS[4], ".U2 > .X3"]]}
      />
    </>
  )
}

/**
 * The way 1 ear and J1. The ring face carries the long runs: the bundle from the channel to
 * mux 1, the selects from under the module round its board-end side to mux 1's far pins, EN up
 * between mux 1's vias, and the UART outside them all, along the board end and the outboard
 * edge. The parts face keeps the corridor between way 1's column and the module for GND,
 * GPIO9, GPIO8 and the LED's line. J1's pads fix the order lines reach it in: GND under its near
 * row, GPIO9 into IO0, EN between the rows, and the UART from outboard.
 */
const Ear1Routes = () => {
  const esp = (name: string) => `.U1 > .${name}`
  const mux = (name: string) => `.U2 > .${name}`
  // The module's GPIO4–7 drop to the ring face just inside its pads.
  const DROP_X = 42.95
  // Select lines: lane towards mux 2, the X its line runs down to the lane at, and its way
  // round the module to its mux 1 pad (the via under the mux, then the turns back to the drop).
  const selects = [
    { io: "IO7", y: 5.45, lane: 0, x: DROP_X, pin: "C", far: [{ x: muxX(7), y: 20.2 }, { x: 50.7, y: 20.2 }] },
    { io: "IO6", y: 6.25, lane: 1, x: 42.425, pin: "B", far: [{ x: muxX(6), y: 19.85 }, { x: 50.35, y: 19.85 }] },
    { io: "IO5", y: 7.05, lane: 2, x: 42.125, pin: "A", far: [{ x: muxX(5), y: 19.5 }, { x: 50.0, y: 19.5 }] },
  ]
  const gnd = (from: string, steps: Steps[], width = 0.2) => <Route from={from} to="net.GND" width={width} paths={steps} />
  return (
    <>
      {/* ── Ring face ──────────────────────────────────────────────────────── */}
      {selects.flatMap(({ io, y, lane: i, x, pin, far }) => [
        <Route
          key={io}
          from={esp(io)}
          to={`.U4 > .${pin}`}
          width={LANE_WIDTH}
          paths={[[esp(io), ...down({ x: DROP_X, y }), { x, y }, { x, y: lane(i) }, { x: laneEnd(i, -1), y: lane(i) }]]}
        />,
        <Route
          key={pin}
          from={mux(pin)}
          to={esp(io)}
          width={LANE_WIDTH}
          paths={[[mux(pin), ...down({ x: far[0].x, y: 20.6 }), ...far, { x: far[1].x, y }, { x: DROP_X, y }]]}
        />,
      ])}
      {/* ADC2, to mux 2's common. */}
      <Route
        from={esp("IO4")}
        to=".U4 > .X"
        width={LANE_WIDTH}
        paths={[
          [esp("IO4"), ...down({ x: DROP_X, y: 7.85 }), { x: 41.825, y: 7.85 }, { x: 41.825, y: lane(3) }, { x: laneEnd(3, -1), y: lane(3) }],
          [esp("IO4"), { x: 40.95, y: 7.85 }, { x: 40.64, y: 8.3 }, ".C41 > .pin1"],
        ]}
      />
      {/* UART, under the module's panel-edge pads, then the board end and the outboard edge. */}
      <Route
        from={esp("TXD0")}
        to=".J1 > .RXD"
        width={LANE_WIDTH}
        paths={[
          [
            esp("TXD0"),
            ...down({ x: 47.21, y: 2.85 }),
            { x: 51.6, y: 2.85 },
            { x: 51.6, y: 24.65 },
            { x: 44.2, y: 24.65 },
            ...up({ x: 43.6, y: 24.05 }),
            { x: 43.1, y: 24.575 },
            { x: 35.94, y: 24.575 },
            ".J1 > .RXD",
          ],
        ]}
      />
      <Route
        from={esp("RXD0")}
        to=".J1 > .TXD"
        width={LANE_WIDTH}
        paths={[
          [
            esp("RXD0"),
            ...down({ x: 46.41, y: 2.85 }),
            { x: 46.41, y: 3.45 },
            { x: 51.25, y: 3.45 },
            { x: 51.25, y: 24.3 },
            { x: 44.7, y: 24.3 },
            ...up({ x: 44.35, y: 24.05 }),
            { x: 44.35, y: 24.9 },
            { x: 33.4, y: 24.9 },
            ".J1 > .TXD",
          ],
        ]}
      />
      {/* EN: its RC at the pin, then up between mux 1's vias and round to J1. */}
      <Route
        from={esp("EN")}
        to=".J1 > .EN"
        width={LANE_WIDTH}
        paths={[
          [
            esp("EN"),
            ...down({ x: 44.81, y: 12.7 }),
            { x: 44.81, y: 21.9 },
            { x: 42.85, y: 21.9 },
            ...up({ x: 42.85, y: 24.05 }),
            ".R3 > .pin1",
          ],
          [
            ".R3 > .pin1",
            { x: 37.2, y: 24.05 },
            { x: 37.2, y: 21.6 },
            { x: 30.86, y: 21.6 },
            ".J1 > .EN",
          ],
          [esp("EN"), ".C8 > .pin1"],
        ]}
      />

      {/* ── Corridor, parts face ───────────────────────────────────────────── */}
      {/* GND to J1 carries on from way 1's cap return. */}
      {gnd(".J1 > .GND", [
        [
          ".J1 > .GND",
          { x: 33.4, y: 19.1 },
          { x: 37.75, y: 19.1 },
          { x: 37.75, y: 16.6 },
          { x: 38.35, y: 16.0 },
          { x: 38.35, y: 8.5 },
          { x: 39.4, y: 8.5 },
          { x: 39.4, y: 8.21 },
          ".C31 > .pin2",
        ],
      ])}
      <Route
        from={esp("IO9")}
        to=".J1 > .IO0"
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO9"),
            { x: 39.775, y: 3.85 },
            { x: 39.775, y: 8.84 },
            { x: 38.725, y: 8.84 },
            { x: 38.725, y: 16.15 },
            { x: 38.3, y: 16.575 },
            ".R6 > .pin1",
          ],
          [".R6 > .pin1", { x: 38.3, y: 20.33 }, ".J1 > .IO0"],
        ]}
      />
      <Route
        from={esp("IO8")}
        to=".R5 > .pin1"
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO8"),
            { x: 40.075, y: 4.65 },
            { x: 40.075, y: 9.14 },
            { x: 39.025, y: 9.14 },
            { x: 39.025, y: 16.3 },
            { x: 38.85, y: 16.475 },
            ".R5 > .pin1",
          ],
        ]}
      />
      {/* The LED's line runs out between C41's pads. */}
      <Route
        from={esp("IO10")}
        to=".R7 > .pin1"
        width={LANE_WIDTH}
        paths={[[esp("IO10"), { x: 39.335, y: 9.45 }, { x: 39.335, y: 14.7 }, ".R7 > .pin1"]]}
      />
      <Route from=".R7 > .pin2" to=".LED1 > .anode" paths={[[".R7 > .pin2", ".LED1 > .anode"]]} />
      <Route from={esp("IO0")} to=".TP1 > .pin1" width={LANE_WIDTH} paths={[[esp("IO0"), ".TP1 > .pin1"]]} />
      <Route from={esp("IO1")} to=".TP2 > .pin1" width={LANE_WIDTH} paths={[[esp("IO1"), ".TP2 > .pin1"]]} />
      {gnd(".C41 > .pin2", [[".C41 > .pin2", { x: 40.64, y: 10.7 }, { x: 41.0, y: 11.05 }, esp("GND4")]])}

      {/* ── Above the module ───────────────────────────────────────────────── */}
      <Route from={esp("IO2")} to=".R4 > .pin1" width={LANE_WIDTH} paths={[[esp("IO2"), ".R4 > .pin1"]]} />
      <Route
        from={esp("IO3")}
        to={mux("X")}
        width={LANE_WIDTH}
        paths={[
          [esp("IO3"), { x: 46.41, y: 14.55 }, { x: 45.52, y: 14.55 }, ".C10 > .pin1"],
          [".C10 > .pin1", { x: 45.52, y: 15.87 }, { x: muxX(2), y: 15.87 }, mux("X")],
        ]}
      />
      {gnd(".C10 > .pin2", [[".C10 > .pin2", mux("X5")]])}
      {gnd(".C8 > .pin2", [
        [".C8 > .pin2", ".LED1 > .cathode"],
        [".LED1 > .cathode", { x: 42.75, y: 14.55 }, esp("GND3")],
      ])}
      {gnd(".C7 > .pin2", [
        [".C7 > .pin2", esp("GND1")],
        [".C7 > .pin2", mux("VSS")],
      ])}
      {/* Mux 1's GND pins: 3V3 comes down between them, so they join under it on the ring face. */}
      {gnd(mux("INH"), [
        [mux("INH"), { x: muxX(5), y: 18.45 }, ...down({ x: 47.27, y: 18.75 }), ...up({ x: muxX(6), y: 18.75 }), mux("VEE")],
        [mux("X5"), { x: muxX(4), y: 18.45 }, { x: 47.27, y: 18.75 }],
        [mux("VSS"), { x: muxX(7), y: 18.75 }, { x: muxX(6), y: 18.75 }],
      ])}
      {/* GND for C9 and C6, up between the LED's pads and along mux 1's end. */}
      {gnd(esp("GND3"), [
        [esp("GND3"), { x: 42.225, y: 14.35 }, { x: 42.225, y: 15.87 }, { x: 41.0, y: 15.87 }, { x: 41.0, y: 21.9 }, ".C9 > .pin2"],
        [".C6 > .pin2", { x: 41.0, y: 20.725 }],
      ])}
      {/* 3V3: up from the ring face at its via, to the pull-ups, C6 and mux 1, then under mux 1 and
          down between its GND pins to the module. */}
      <Route
        from=".R5 > .pin2"
        to="net.V3V3"
        width={0.3}
        paths={[
          [".R5 > .pin2", V3V3_VIA],
          [".R5 > .pin2", ".R6 > .pin2"],
          [".R6 > .pin2", ".C6 > .pin1"],
          [".R6 > .pin2", { x: 39.4, y: 19.3 }, ".R3 > .pin2"],
          [".R3 > .pin2", ".C9 > .pin1"],
          [".C9 > .pin1", mux("VDD")],
          [mux("VDD"), { x: muxX(0), y: 19.9 }, { x: 48.54, y: 19.9 }, { x: 48.54, y: 15.95 }, ".R4 > .pin2"],
          [".R4 > .pin2", ".C7 > .pin1"],
          [esp("3V3"), { x: 48.81, y: ESP_ROW_Y }],
        ]}
      />
    </>
  )
}

export const Routes = ({ dividers }: { dividers: Pt[] }) => (
  <>
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <ColumnRoutes key={n} n={n} divider={dividers[n - 1]} />
    ))}
    <TempRoutes />
    <Ear1Routes />
  </>
)
