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

import { CLAMP_Y, MUX_2, NUT_Y, type Pt, wayX } from "./outline"
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
/** A two-layer path walked from its other end: a path takes its first layer from where it starts. */
const back = (steps: Step[]): Step[] =>
  [...steps]
    .reverse()
    .map((s): Step => (typeof s === "object" && "via" in s ? { via: s.via, to: s.to === "top" ? "bottom" : "top" } : s))

/** The GND bus on the ring face, out to 1.0: GND vias land at this height. */
const BUS_Y = 0.65
/** 3V3 along the top of the channel. */
const V3V3_Y = 5.8
/** Channel lanes from the bus up, 0.15 wide on a 0.35 pitch. */
const lane = (i: number) => 1.45 + 0.35 * i
const LANE_WIDTH = 0.15
/** A line's via sits just clear of the lane below its own; the line then settles into its lane. */
const entryY = (i: number) => lane(i - 1) + 0.525

/** Drops into lane `i` through a via at `via`, then runs along it in direction `dir` to its end. */
const intoLane = (via: Pt, i: number, dir: 1 | -1): Step[] => [
  ...down(via),
  { x: via.x + dir * 0.4, y: lane(i) },
  ...laneEnd(i, dir),
]

/** The way 1 ear is not routed yet: lines towards it stop here, short of the ear's GND. */
const EAR_1_STOP = 39.4

/** X of way `n`'s sensor signal pins. */
const sensePinX = (n: number) => bandX(n, wayX(n)) + SENSOR.dx + 2.6

/**
 * Each way's sense and voltage lines: their lane, and the multiplexer input they go to. Ways
 * 1–3 run towards way 1, to mux 1 (U2), and ways 4–6 towards way 6, to mux 2 (U4). A line
 * that joins the channel further from its mux runs in a lower lane, under the vias of the
 * lines that join later. Lanes 0–3 carry the select lines and ADC2 the whole length, and
 * TEMP has lane 4 on the ways 1–3 side. Way 6's voltage line has no lane: it reaches mux 2 on
 * the parts face.
 */
const LINES: Record<number, { sense: { lane: number; to: string }; volts: { lane?: number; to: string } }> = {
  1: { volts: { lane: 9, to: ".U2 > .X4" }, sense: { lane: 10, to: ".U2 > .X2" } },
  2: { volts: { lane: 7, to: ".U2 > .X6" }, sense: { lane: 8, to: ".U2 > .X1" } },
  3: { volts: { lane: 5, to: ".U2 > .X0" }, sense: { lane: 6, to: ".U2 > .X7" } },
  4: { sense: { lane: 4, to: ".U4 > .X3" }, volts: { lane: 5, to: ".U4 > .X0" } },
  5: { sense: { lane: 6, to: ".U4 > .X1" }, volts: { lane: 7, to: ".U4 > .X6" } },
  6: { sense: { lane: 8, to: ".U4 > .X4" }, volts: { to: ".U4 > .X2" } },
}

// The way 6 ear. The lanes turn outboard through the gap between the ground nut and way 6's
// copper, lane i at gapX(i), and fan out under mux 2 (U4) on the ring face to a via beside
// each pad. The lowest lane turns innermost, so it reaches the pad furthest along the strip.

/** X of lane `i` where it runs outboard past the ground nut. */
const gapX = (i: number) => -41.7 + 0.35 * i
/** X of U4's pad column `j`, counted from the way 6 end. Halves fall between two pads. */
const u4X = (j: number) => MUX_2.x + 4.445 - 1.27 * j
/** Between U4's pad rows, just above the panel-side row. */
const U4_VIA_Y = MUX_2.y - 1.07
/** Where 3V3 leaves the top of the channel for the parts face, between the lanes and way 6's VSUP. */
const V3V3_EAR = { x: -38.35, y: 8.65 }
/** C40's GND via, beside the ground nut and clear of the lanes. */
const GND_EAR = { x: -43.0, y: 9.3 }
/** tscircuit holds a trace from a capacitor's pin to 1 mm unless told otherwise; this covers the short runs. */
const CAP_RUN = 5

/** Lane `i` from the end of its run along the channel to the via at its U4 pad. */
const fan6 = (i: number): Step[] => {
  const x = gapX(i)
  const start = { x, y: lane(i) + 0.3 }
  // Lanes 0–6 nest round the corner, from the panel-side row's far end back. ADC2, lane 3,
  // comes up between two of that row's vias and crosses to the outboard row on the parts face.
  if (i <= 6) {
    const level = 10.5 + 0.35 * i
    const col = u4X(i < 3 ? 7 - i : i === 3 ? 4.5 : 8 - i)
    const turn = [start, { x, y: level - 0.3 }, { x: x - 0.3, y: level }, { x: col + 0.3, y: level }, { x: col, y: level + 0.3 }]
    return i === 3
      ? [...turn, ...up({ x: col, y: 14.3 }), { x: col + 0.3, y: 14.6 }, { x: u4X(2.5), y: 14.6 }, { x: u4X(2), y: 15.235 }]
      : [...turn, ...up({ x: col, y: U4_VIA_Y })]
  }
  // The last two carry straight on to the outboard row.
  if (i === 7) return [start, { x, y: 12.75 }, { x: x - 0.75, y: 13.5 }, ...up({ x: u4X(1), y: 13.5 })]
  return [start, { x, y: 13.745 }, ...up({ x: u4X(0), y: 14.1 })]
}

/** A line's last step onto its mux pad; a line towards mux 1 has none yet. */
const atMux = (pad: string, dir: 1 | -1): Step[] => (dir < 0 ? [pad] : [])
/** Lane `i` on from its run along the channel in direction `dir`, to the via at its mux pad. */
const laneEnd = (i: number, dir: 1 | -1): Step[] =>
  dir > 0 ? [{ x: EAR_1_STOP, y: lane(i) }] : [{ x: gapX(i) + 0.3, y: lane(i) }, ...fan6(i)]

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
  const voltsLane = line.volts.lane
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
            { x: n === 1 ? EAR_1_STOP : sensePinX(n - 1), y: V3V3_Y },
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
            ...intoLane({ x: viaX, y: entryY(line.sense.lane) }, line.sense.lane, dir),
            ...atMux(line.sense.to, dir),
          ],
        ]}
      />
      {voltsLane !== undefined && (
        <Route
          from={`.R1${n} > .pin1`}
          to={line.volts.to}
          width={LANE_WIDTH}
          paths={[
            [
              `.R1${n} > .pin1`,
              { x: b - 5.86, y: 3.59 },
              ...intoLane({ x: b - 5.86, y: entryY(voltsLane) }, voltsLane, dir),
              ...atMux(line.volts.to, dir),
            ],
          ]}
        />
      )}
      {/* The divider: its GND pad to its via (lib/copper.tsx), its two VOLTS pads joined, and
          its top pad onto the diode's anode. */}
      <Route from={`.R2${n} > .pin1`} to="net.GND" paths={[[`.R2${n} > .pin1`, { x: D, y: 0.8 }]]} />
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
        paths={[[".Q1 > .pin3", ...intoLane({ x: -0.4, y: 5.1 }, 4, 1)]]}
      />
    </>
  )
}

/** The select lines and ADC2: their lanes, and mux 2's pad at the far end. */
const SHARED = [
  { net: "net.MUX_S2", pad: ".U4 > .C" },
  { net: "net.MUX_S1", pad: ".U4 > .B" },
  { net: "net.MUX_S0", pad: ".U4 > .A" },
  { net: "net.ADC2", pad: ".U4 > .X" },
]

const Ear6Routes = () => (
  <>
    {/* Lanes 0–3, from where the way 1 ear's routing will pick them up. */}
    {SHARED.map(({ net, pad }, i) => (
      <Route
        key={net}
        from={pad}
        to={net}
        width={LANE_WIDTH}
        paths={[[pad, ...back(laneEnd(i, -1)), { x: EAR_1_STOP, y: lane(i) }]]}
      />
    ))}
    {/* Way 6's voltage line stays on the parts face: past the ground nut, between C40's pads
        and up into the pad above them. */}
    <Route
      from=".R16 > .pin1"
      to={LINES[6].volts.to}
      width={LANE_WIDTH}
      paths={[
        [
          ".R16 > .pin1",
          { x: -41.05, y: 3.59 },
          { x: -41.35, y: 3.89 },
          { x: -41.35, y: 8.1 },
          { x: -41.05, y: 8.4 },
          { x: -40.3, y: 8.4 },
          { x: -40.0, y: 8.7 },
          { x: -40.0, y: 9.75 },
          { x: -40.35, y: 10.1 },
          LINES[6].volts.to,
        ],
      ]}
    />
    {/* 3V3: down from the output caps between two of U4's outboard pads to VDD, on to C40,
        then through a via to the top of the channel. */}
    <Route
      from=".C4 > .pin1"
      to=".U4 > .VDD"
      width={0.25}
      maxLength={12}
      paths={[
        [
          ".C4 > .pin1",
          { x: -38.5, y: 19.5 },
          { x: u4X(0.5), y: 18.11 },
          { x: u4X(0.5), y: 13.3 },
          { x: -39.4, y: 12.81 },
          ".U4 > .VDD",
        ],
      ]}
    />
    <Route
      from=".C40 > .pin1"
      to=".U4 > .VDD"
      width={0.3}
      maxLength={3}
      paths={[[".C40 > .pin1", { x: -39.35, y: 9.9 }, ".U4 > .VDD"]]}
    />
    <Route
      from=".C40 > .pin1"
      to="net.V3V3"
      width={0.3}
      maxLength={16}
      paths={[
        [
          ".C40 > .pin1",
          { x: -38.9, y: 9.2 },
          ...down(V3V3_EAR),
          { x: V3V3_EAR.x, y: V3V3_Y + 0.3 },
          { x: V3V3_EAR.x + 0.3, y: V3V3_Y },
          { x: sensePinX(6), y: V3V3_Y },
        ],
      ]}
    />
    {/* GND: C40 to a via beside the ground nut; U4's five GND pads joined along their row,
        with two vias to the ear's ring-face GND. */}
    <Route from=".C40 > .pin2" to="net.GND" maxLength={CAP_RUN} paths={[[".C40 > .pin2", ...down(GND_EAR)]]} />
    {["VSS", "VEE", "INH", "X5", "X7"].slice(1).map((pin, i, rest) => {
      const from = `.U4 > .${i ? rest[i - 1] : "VSS"}`
      return <Route key={pin} from={from} to={`.U4 > .${pin}`} width={0.3} paths={[[from, `.U4 > .${pin}`]]} />
    })}
    {/* The ground nut itself, from the parts face of its pad to C40's via. */}
    <Route from=".N7 > .pin1" to="net.GND" width={0.4} paths={[[".N7 > .pin1", GND_EAR]]} />
    <Route from=".U4 > .INH" to="net.GND" width={0.3} paths={[[".U4 > .INH", ...down({ x: u4X(5), y: 18.6 })]]} />
    <Route from=".U4 > .X7" to="net.GND" width={0.3} paths={[[".U4 > .X7", ...down({ x: u4X(3), y: 18.6 })]]} />
  </>
)

// VSUP. Each way's diode feeds a riser up the −X side of its nut to a trunk just behind the
// nuts, which runs under the supply parts to F1; D2 and TP5 hang off its way 1 end.

/** The trunk, 0.3 clear of the nuts' pads. */
const VSUP_Y = 19.1
/** Between ways 6 and 5 the trunk drops, to let the buck's GND and feedback lines over it. */
const VSUP_LOW = 18.5
/** A point over way 6's nut at `r` from its centre: L1's pads leave little room above the nut. */
const over6 = (r: number, x: number): Pt => ({ x, y: NUT_Y + Math.sqrt(r * r - (x - wayX(6)) ** 2) })

const VsupRoutes = () => {
  const cathode = (n: number) => `.D1${n} > .cathode`
  // Ways 1–3's diodes sit 1 mm nearer their nut, and Q1's trace runs beside way 3's riser.
  const riser = (n: number): Step[] =>
    n <= 3 ? [cathode(n), { x: wayX(n) - 5.03, y: 8.2 }] : [cathode(n), { x: wayX(n) - 5.1, y: 7.6 }]
  return (
    <>
      <Route
        from={cathode(1)}
        to=".D2 > .cathode"
        width={0.25}
        paths={[[...riser(1), { x: wayX(1) - 5.03, y: VSUP_Y }, { x: wayX(2) - 2.2, y: VSUP_Y }, ".D2 > .cathode"]]}
      />
      <Route
        from={cathode(2)}
        to=".D2 > .cathode"
        width={0.25}
        paths={[[...riser(2), { x: wayX(2) - 5.03, y: VSUP_Y }, { x: wayX(2) - 2.2, y: VSUP_Y }]]}
      />
      <Route from={cathode(3)} to="net.VSUP" width={0.25} paths={[[...riser(3), { x: wayX(3) - 5.03, y: VSUP_Y }]]} />
      <Route from={cathode(4)} to="net.VSUP" width={0.3} paths={[[...riser(4), { x: wayX(4) - 5.1, y: VSUP_Y }]]} />
      <Route from={cathode(5)} to="net.VSUP" width={0.3} paths={[[...riser(5), { x: wayX(5) - 5.1, y: VSUP_LOW }]]} />
      {/* Way 6's goes up the one-trace gap between U4 and the nut, then over the nut under L1. */}
      <Route
        from={cathode(6)}
        to="net.VSUP"
        width={0.3}
        paths={[
          [
            cathode(6),
            { x: -37.7, y: 7.6 },
            { x: -37.7, y: 10.9 },
            { x: wayX(6) - 5.1, y: 11.7 },
            { x: wayX(6) - 5.1, y: 17.4 },
            { x: -37.2, y: 18.7 },
            { x: -35.2, y: 18.7 },
          ],
        ]}
      />
      <Route
        from={cathode(6)}
        to="net.VSUP"
        width={0.2}
        paths={[
          [
            { x: -35.2, y: 18.7 },
            ...[-34.37, -33.9, wayX(6), -32.95, -32.5, -32.05, -31.634].map((x) => over6(4.95, x)),
            { x: -31.0, y: VSUP_LOW },
            { x: -28.8, y: VSUP_LOW },
          ],
        ]}
      />
      {/* The trunk, from F1 both ways. Past way 5's nut it drops under R1. */}
      <Route
        from=".F1 > .pin1"
        to="net.VSUP"
        width={0.3}
        paths={[
          [".F1 > .pin1", { x: -3.555, y: VSUP_Y }, { x: wayX(2) - 5.03, y: VSUP_Y }],
          [
            { x: -3.555, y: VSUP_Y },
            { x: -21.2, y: VSUP_Y },
            { x: -22.0, y: 18.7 },
            { x: -22.4, y: VSUP_LOW },
            { x: -28.8, y: VSUP_LOW },
          ],
        ]}
      />
      {/* TP5. */}
      <Route
        from=".D2 > .cathode"
        to=".TP5 > .pin1"
        width={0.3}
        paths={[[".D2 > .cathode", { x: 18.6, y: 21.3 }, { x: 18.79, y: 21.9 }, { x: 18.79, y: 23.5 }, ".TP5 > .pin1"]]}
      />
      <Route from=".D2 > .anode" to=".J1 > .VDD" width={0.3} paths={[[".D2 > .anode", ".J1 > .VDD"]]} />
    </>
  )
}

// The supply, in the band behind ways 4–6. VIN runs along the outboard side from F1 to the
// buck. GND has no ring-face copper here (ring keepout), so it runs as a spine along the
// outboard edge from the output caps to TP6, with a branch down between L1's pads to the buck.

/** The GND spine, and where it squeezes past L1's pads. */
const SPINE_Y = 24.85
const SPINE_L1_Y = 24.96
/** The spine's branch to the buck, down between L1's pads. */
const BRANCH_X = -32.6

const SupplyRoutes = () => (
  <>
    {/* VIN: F1 round the outboard side of D1's GND pad, D1, then the input caps and U3. */}
    <Route
      from=".F1 > .pin2"
      to=".C1 > .pin1"
      width={0.4}
      paths={[[".F1 > .pin2", { x: -6.445, y: 22.6 }, { x: -7.8, y: 23.95 }, { x: -18.0, y: 23.95 }, ".C1 > .pin1"]]}
    />
    <Route from=".D1 > .pin1" to="net.VIN" width={0.6} paths={[[".D1 > .pin1", { x: -15.322, y: 23.95 }]]} />
    <Route from=".C1 > .pin1" to=".C2 > .pin1" width={0.6} maxLength={CAP_RUN} paths={[[".C1 > .pin1", ".C2 > .pin1"]]} />
    <Route from=".C2 > .pin1" to=".U3 > .EN" width={0.5} maxLength={CAP_RUN} paths={[[".C2 > .pin1", ".U3 > .EN"]]} />
    <Route from=".U3 > .EN" to=".U3 > .VIN" width={0.5} paths={[[".U3 > .EN", ".U3 > .VIN"]]} />
    {/* SW to L1, with the bootstrap cap across U3's end. */}
    <Route from=".U3 > .SW" to=".L1 > .pin1" width={0.6} paths={[[".U3 > .SW", { x: -29.3, y: 23.85 }, ".L1 > .pin1"]]} />
    <Route from=".C3 > .pin2" to=".U3 > .SW" width={0.3} paths={[[".C3 > .pin2", { x: -25.35, y: 23.85 }]]} />
    <Route from=".U3 > .CB" to=".C3 > .pin1" width={0.25} paths={[[".U3 > .CB", ".C3 > .pin1"]]} />
    {/* Feedback: the divider under U3, sensing 3V3 at L1 by a line over way 6's nut. */}
    <Route from=".U3 > .FB" to=".R1 > .pin1" width={LANE_WIDTH} paths={[[".U3 > .FB", ".R1 > .pin1"]]} />
    <Route from=".R1 > .pin1" to=".R2 > .pin2" width={LANE_WIDTH} paths={[[".R1 > .pin1", ".R2 > .pin2"]]} />
    <Route
      from=".L1 > .pin2"
      to=".R1 > .pin2"
      width={LANE_WIDTH}
      paths={[
        [
          ".L1 > .pin2",
          { x: -34.6, y: 20.4 },
          { x: -33.95, y: 19.75 },
          ...[wayX(6), -32.5, -31.634].map((x) => over6(5.295, x)),
          { x: -31.0, y: 19.0 },
          { x: -22.41, y: 19.0 },
          { x: -22.11, y: 19.3 },
          ".R1 > .pin2",
        ],
      ]}
    />
    {/* 3V3 from L1 to the output caps. */}
    <Route
      from=".L1 > .pin2"
      to=".C4 > .pin1"
      width={1.0}
      maxLength={CAP_RUN}
      paths={[[".L1 > .pin2", { x: -36.5, y: 20.3 }, ".C4 > .pin1"]]}
    />
    <Route from=".L1 > .pin2" to=".C5 > .pin1" width={1.0} paths={[[".L1 > .pin2", ".C5 > .pin1"]]} />
    {/* GND round the buck: U3 under its own body to C2, the divider, C1, then D1. */}
    <Route
      from=".U3 > .GND"
      to=".C2 > .pin2"
      width={0.4}
      maxLength={CAP_RUN}
      paths={[[".U3 > .GND", { x: -23.1, y: 22.15 }, { x: -20.9, y: 22.15 }, ".C2 > .pin2"]]}
    />
    <Route from=".R2 > .pin1" to=".C2 > .pin2" width={0.3} maxLength={CAP_RUN} paths={[[".R2 > .pin1", ".C2 > .pin2"]]} />
    <Route from=".C2 > .pin2" to=".C1 > .pin2" width={0.4} maxLength={CAP_RUN} paths={[[".C2 > .pin2", ".C1 > .pin2"]]} />
    <Route
      from=".C1 > .pin2"
      to=".D1 > .pin2"
      width={0.4}
      paths={[[".C1 > .pin2", { x: -17.75, y: 19.9 }, { x: -11.0, y: 19.9 }, ".D1 > .pin2"]]}
    />
    {/* The output caps' GND: joined, and down to the ear's ring-face GND by a via each. */}
    <Route from=".C4 > .pin2" to=".C5 > .pin2" width={0.8} maxLength={CAP_RUN} paths={[[".C4 > .pin2", ".C5 > .pin2"]]} />
    <Route
      from=".C4 > .pin2"
      to="net.GND"
      width={0.4}
      maxLength={CAP_RUN}
      paths={[[".C4 > .pin2", ...down({ x: -42.6, y: 20.05 })]]}
    />
    <Route from=".C5 > .pin2" to="net.GND" width={0.4} paths={[[".C5 > .pin2", ...down({ x: -42.9, y: 22.35 })]]} />
    {/* The spine: wide from the caps to L1, 0.2 past L1's pads, then on to TP6. */}
    <Route
      from=".C5 > .pin2"
      to="net.GND"
      width={0.5}
      paths={[[".C5 > .pin2", { x: -41.063, y: 24.3 }, { x: -40.713, y: 24.65 }, { x: -37.8, y: 24.65 }]]}
    />
    <Route
      from=".C5 > .pin2"
      to="net.GND"
      width={0.2}
      paths={[
        [
          { x: -37.8, y: 24.65 },
          { x: -37.31, y: 24.65 },
          { x: -37.0, y: SPINE_L1_Y },
          { x: -28.9, y: SPINE_L1_Y },
          { x: -28.79, y: SPINE_Y },
        ],
      ]}
    />
    <Route
      from=".TP6 > .pin1"
      to="net.GND"
      width={0.3}
      paths={[[".TP6 > .pin1", { x: 17.09, y: SPINE_Y }, { x: -28.79, y: SPINE_Y }]]}
    />
    {/* The branch: between L1's pads, under its SW pad above the feedback line, to U3. */}
    <Route
      from=".U3 > .GND"
      to="net.GND"
      width={0.2}
      paths={[
        [
          { x: BRANCH_X, y: SPINE_L1_Y },
          { x: BRANCH_X, y: 19.62 },
          over6(5.64, -31.634),
          { x: -29.0, y: 19.36 },
          { x: -28.41, y: 19.95 },
        ],
      ]}
    />
    <Route
      from=".U3 > .GND"
      to="net.GND"
      width={0.3}
      paths={[[".U3 > .GND", { x: -23.1, y: 19.95 }, { x: -28.41, y: 19.95 }]]}
    />
  </>
)

export const Routes = ({ dividers }: { dividers: Pt[] }) => (
  <>
    {[1, 2, 3, 4, 5, 6].map((n) => (
      <ColumnRoutes key={n} n={n} divider={dividers[n - 1]} />
    ))}
    <TempRoutes />
    <Ear6Routes />
    <VsupRoutes />
    <SupplyRoutes />
  </>
)
