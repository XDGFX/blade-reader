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

import { CLAMP_Y, type Pt, wayX } from "./outline"
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
  1: { volts: { lane: 9, to: ".U2 > .X3" }, sense: { lane: 10, to: ".U2 > .X0" } },
  2: { volts: { lane: 7, to: ".U2 > .X4" }, sense: { lane: 8, to: ".U2 > .X1" } },
  3: { volts: { lane: 5, to: ".U2 > .X5" }, sense: { lane: 6, to: ".U2 > .X2" } },
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
  // The caps' GND runs down the sensor's +X side, clear of the sense via inside it.
  const G = P + 2.2
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
          pins to the GND pin: the caps sit above the pins, so this is the shortest return.
          Way 1's goes to the ear's GND instead, past C41. */}
      <Route
        from={cap(2, 2)}
        to="net.GND"
        maxLength={12}
        paths={[
          [
            cap(2, 2),
            cap(1, 2),
            cap(3, 2),
            ...(n === 1
              ? [".C41 > .pin2", { x: 40.8, y: 8.36 }]
              : [{ x: G, y: 8.21 }, { x: G, y: 2.095 }, pin("GND")]),
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
        maxLength={18}
        paths={[[cap(1, 1), down({ x: P, y: 6.55 }), { x: P, y: V3V3_Y }, { x: n === 1 ? 40.0 : sensePinX(n - 1), y: V3V3_Y }]]}
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
            ...intoLane({ x: P + 1.6, y: entryY(line.sense.lane) }, line.sense.lane, dir, dir > 0 ? 40.0 : -41.0),
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
            ...intoLane({ x: b - 5.86, y: entryY(line.volts.lane) }, line.volts.lane, dir, dir > 0 ? 40.0 : -41.0),
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
        to=".U2 > .X6"
        width={LANE_WIDTH}
        paths={[[".Q1 > .pin3", ...intoLane({ x: -0.4, y: 5.1 }, 4, 1, 40.0)]]}
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
  </>
)
