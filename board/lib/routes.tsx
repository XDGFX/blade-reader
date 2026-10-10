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

import { CLAMP_Y, ESP_ROW_Y, espPinX, MUX_2, NUT_Y, type Pt, wayX } from "./outline"
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

// The way 1 ear. The ring face under the module carries what runs outboard, each line in its
// own column: 3V3 nearest way 1, GPIO9 and GPIO8, the lanes to mux 1, the selects, then
// GPIO3, GPIO4, GPIO2 and GPIO1 to the pocket at the board end. The parts face under the module
// carries what runs along the strip, to the blind end and on to J1.

/** Mux 1 (U2), and X of its pad column `j` from the way 1 end. Halves fall between two pads. */
const MUX_1 = { x: 43.8, y: ESP_ROW_Y + 4.24 }
const u2X = (j: number) => MUX_1.x - 4.445 + 1.27 * j
/** The two rows of vias between mux 1's rows of pads, one beside each row. */
const U2_NEAR_Y = MUX_1.y - 1.34
const U2_FAR_Y = MUX_1.y + 1.36
/** The vias just inside the module's outboard lands. */
const LAND_VIA_Y = ESP_ROW_Y - 2.15
/** X of lane `i`'s column under the module: the highest lane turns outboard first. */
const colX = (i: number) => 42.75 + 0.35 * (10 - i)
/** The selects' columns, lane 0 nearest the board end. */
const selectX = (i: number) => 47.45 - 0.75 * i
/** Where ADC2 comes up from lane 3 to the parts face, between the lanes' columns and the selects'. */
const ADC2_VIA: Pt = { x: 45.4, y: 3.2 }
/** 3V3's column up from the channel, and its two vias: the pull-ups', then the module's. */
const V3V3_X = 39.95
const V3V3_PULLUPS_Y = 10.59
const V3V3_MODULE_Y = 13.65

/** The column of mux 1's pads that each lane's line goes to, and the gap it takes to the far row. */
const FAN_1: Record<number, { col: number; gap?: number }> = {
  10: { col: 3 },
  9: { col: 4, gap: 3.5 },
  8: { col: 4 },
  7: { col: 5 },
  6: { col: 6, gap: 5.5 },
  5: { col: 6 },
  4: { col: 7, gap: 6.5 },
}

/**
 * Lane `i` from the end of its run along the channel, up its column under the module and
 * across to the via at its mux 1 pad. The columns step over together at 45°, the one nearest
 * the board end first, so they keep their spacing.
 */
const fan1 = (i: number): Step[] => {
  const x = colX(i)
  const { col, gap } = FAN_1[i]
  const to = u2X(gap ?? col)
  const y = 19.6 - 0.1 * (10 - i)
  const start = [{ x: x - 0.3, y: lane(i) }, { x, y: lane(i) + 0.3 }, { x, y }, { x: to, y: y + to - x }]
  if (gap === undefined) return [...start, ...up({ x: to, y: U2_NEAR_Y })]
  const far = u2X(col)
  return [...start, { x: to, y: 23.4 }, { x: far, y: 23.4 + far - to }, ...up({ x: far, y: U2_FAR_Y })]
}

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
  1: { volts: { lane: 9, to: ".U2 > .X7" }, sense: { lane: 10, to: ".U2 > .X3" } },
  2: { volts: { lane: 7, to: ".U2 > .X1" }, sense: { lane: 8, to: ".U2 > .X0" } },
  3: { volts: { lane: 5, to: ".U2 > .X2" }, sense: { lane: 6, to: ".U2 > .X6" } },
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

/** Lane `i` on from its run along the channel in direction `dir`, to the via at its mux pad. */
const laneEnd = (i: number, dir: 1 | -1): Step[] =>
  dir > 0 ? fan1(i) : [{ x: gapX(i) + 0.3, y: lane(i) }, ...fan6(i)]

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
      <Route from={cap(2, 2)} to={cap(1, 2)} maxLength={CAP_RUN} paths={[[cap(2, 2), cap(1, 2)]]} />
      <Route from={cap(1, 2)} to={cap(3, 2)} maxLength={CAP_RUN} paths={[[cap(1, 2), cap(3, 2)]]} />
      <Route
        from={cap(3, 2)}
        to={pin("GND")}
        maxLength={12}
        paths={[[cap(3, 2), { x: G, y: 8.21 }, { x: G, y: 2.095 }, pin("GND")]]}
      />
      <Route from={pin("GND")} to="net.GND" paths={[[pin("GND"), { x: P + 0.3, y: 1.2 }, down({ x: P + 0.3, y: BUS_Y })]]} />
      {/* 3V3 from the top of the channel, up between the VCC pin and its cap. Each way's drop
          carries the channel's 3V3 on to the next way towards way 1, and way 1's carries it on
          up beside the module, then under it on the parts face to its 3V3 land. */}
      <Route
        from={cap(1, 1)}
        to={n === 1 ? ".U1 > .3V3" : "net.V3V3"}
        width={0.3}
        maxLength={n === 1 ? 60 : 18}
        paths={[
          [
            cap(1, 1),
            down({ x: P, y: 6.55 }),
            { x: P, y: V3V3_Y },
            ...(n === 1
              ? [
                  { x: V3V3_X - 0.3, y: V3V3_Y },
                  { x: V3V3_X, y: V3V3_Y + 0.3 },
                  ...up({ x: V3V3_X, y: V3V3_MODULE_Y }),
                  { x: espPinX(0), y: V3V3_MODULE_Y },
                  ".U1 > .3V3",
                ]
              : [{ x: sensePinX(n - 1), y: V3V3_Y }]),
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
            line.sense.to,
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
              line.volts.to,
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
        to=".U2 > .X4"
        width={LANE_WIDTH}
        paths={[[".Q1 > .pin3", ...intoLane({ x: -0.4, y: 5.1 }, 4, 1), ".U2 > .X4"]]}
      />
    </>
  )
}

/** The select lines and ADC2: their lanes, mux 2's pad at one end and the module's land at the other. */
const SHARED = [
  { net: "net.MUX_S2", pad: ".U4 > .C", land: ".U1 > .IO5" },
  { net: "net.MUX_S1", pad: ".U4 > .B", land: ".U1 > .IO6" },
  { net: "net.MUX_S0", pad: ".U4 > .A", land: ".U1 > .IO7" },
  { net: "net.ADC2", pad: ".U4 > .X", land: ".U1 > .IO3" },
]

const Ear6Routes = () => (
  <>
    {/* Lanes 0–3, the whole strip. In the way 1 ear each select turns up its column to a via
        just inside its land; ADC2 comes up short of them and runs along the inner ends of the
        unused GPIO18 and GPIO19 lands to GPIO3. */}
    {SHARED.map(({ net, pad, land }, i) => (
      <Route
        key={net}
        from={pad}
        to={land}
        width={LANE_WIDTH}
        paths={[
          [
            pad,
            ...back(laneEnd(i, -1)),
            ...(i < 3
              ? [
                  { x: selectX(i) - 0.3, y: lane(i) },
                  { x: selectX(i), y: lane(i) + 0.3 },
                  ...up({ x: selectX(i), y: LAND_VIA_Y }),
                  ...(i === 1 ? [] : [{ x: espPinX(3 + i), y: ESP_ROW_Y - 1.4 }]),
                ]
              : [
                  { x: ADC2_VIA.x - 0.3, y: lane(i) },
                  { x: ADC2_VIA.x, y: lane(i) + 0.3 },
                  ...up(ADC2_VIA),
                  { x: ADC2_VIA.x + 0.9, y: 2.3 },
                  { x: espPinX(3), y: 2.3 },
                ]),
            land,
          ],
        ]}
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

/**
 * The way 1 ear and J1, apart from the lanes. The lines to J1 leave the module's blind end in
 * the order J1's pads take them: GPIO9 nearest the nut, then the UART, 3V3 and EN. They pass
 * the nut side by side, step over together behind it and run up past J1's near row.
 */
const Ear1Routes = () => {
  const esp = (name: string) => `.U1 > .${name}`
  const mux = (name: string) => `.U2 > .${name}`
  const land = (i: number, y: number): Pt => ({ x: espPinX(i), y })
  // The module's lands: the outboard row's inner ends, and the panel-edge row's.
  const INNER = ESP_ROW_Y - 1.4
  const PANEL = 2.0
  // The columns up the ring face to the pocket, between the outboard lands: GPIO3, GPIO2, GPIO1.
  const gapX = (i: number) => espPinX(i + 0.5)
  const column = (i: number): Step[] => [...down({ x: gapX(i), y: 2.75 }), ...up({ x: gapX(i), y: LAND_VIA_Y })]
  // The pocket's parts.
  const POCKET = { c41: 23.91, r7: 22.8, led: 24.1, r4: 25.4, c6: 26.6, c9: 24.8 }
  // 3V3 round the pocket: up the board end, along the outboard edge, down beside mux 1.
  // The pull-ups beside the blind end: their column, and where GPIO8 and GPIO9 reach them.
  const PULLUPS = { x: 38.7, io8: 9.1, io9: 12.08 }
  // The six lines to J1, counted from the nut: X of each where it passes the nut, and where it
  // turns to step over behind the nut, the one nearest the nut first.
  const pastNut = (k: number) => [38.35, 38.7, 39.05, 39.4, V3V3_X, 40.4][k]
  const behindNut = (k: number, x: number): Step[] => {
    const y = [16.05, 16.15, 16.25, 16.35, 16.4, 16.45][k]
    return [
      { x: pastNut(k), y },
      { x, y: y + pastNut(k) - x },
    ]
  }
  const RISER_X = 53.3
  const EDGE_Y = 27.45
  const DOWN_X = 48.9
  const gnd = (from: string, via: Pt, width = 0.3) => (
    <Route from={from} to="net.GND" width={width} maxLength={CAP_RUN} paths={[[from, ...down(via)]]} />
  )
  return (
    <>
      {/* ── Selects to mux 1, parts face ───────────────────────────────────── */}
      {/* Each leaves its land outboard, between two of mux 1's pads, and runs back along the
          strip between the mux's rows to its pad. */}
      {[
        { io: "IO7", pin: "A", gap: 4.5, col: 2, y: 22.95 },
        { io: "IO6", pin: "B", gap: 5.5, col: 1, y: 23.3 },
        { io: "IO5", pin: "C", gap: 6.5, col: 0, y: 23.65 },
      ].map(({ io, pin, gap, col, y }) => (
        <Route
          key={io}
          from={esp(io)}
          to={mux(pin)}
          width={LANE_WIDTH}
          paths={[
            [
              esp(io),
              ...(io === "IO5" ? [{ x: 47.95, y: ESP_ROW_Y - 0.2 }, { x: u2X(gap), y: ESP_ROW_Y + 0.22 }] : [{ x: u2X(gap), y: ESP_ROW_Y + 0.25 }]),
              { x: u2X(gap), y },
              { x: u2X(col), y },
              mux(pin),
            ],
          ]}
        />
      ))}

      {/* ── Mux 1's common ─────────────────────────────────────────────────── */}
      {/* Its cap at the land, then the ring face: out past the pocket, along the outboard edge
          and back to a via at the mux's pad. */}
      <Route from={esp("IO4")} to=".C10 > .pin1" width={0.25} maxLength={CAP_RUN} paths={[[esp("IO4"), ".C10 > .pin1"]]} />
      <Route
        from={esp("IO4")}
        to={mux("X")}
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO4"),
            ...down(land(2, 16.55)),
            land(2, 18.6),
            { x: 50.3, y: 19.2 },
            { x: 50.3, y: 26.8 },
            { x: 49.85, y: 27.25 },
            { x: u2X(5) + 0.35, y: 27.25 },
            { x: u2X(5), y: 26.9 },
            ...up({ x: u2X(5), y: U2_FAR_Y }),
            mux("X"),
          ],
        ]}
      />
      {/* The spare input and the mux's own GND pins, joined along their row, with a via. */}
      {["VSS", "VEE", "INH", "X5"].slice(1).map((pin, i, rest) => {
        const from = mux(i ? rest[i - 1] : "VSS")
        return <Route key={pin} from={from} to={mux(pin)} width={0.3} paths={[[from, mux(pin)]]} />
      })}
      <Route from={mux("X5")} to="net.GND" width={0.3} paths={[[mux("X5"), ...down({ x: u2X(3), y: U2_FAR_Y })]]} />

      {/* ── The pocket ─────────────────────────────────────────────────────── */}
      <Route
        from={esp("IO3")}
        to=".C41 > .pin1"
        width={LANE_WIDTH}
        maxLength={60}
        paths={[[esp("IO3"), land(3, PANEL), ...column(2), { x: gapX(2), y: 21.6 }, { x: gapX(2) + 0.1, y: 21.7 }, { x: gapX(2) + 0.1, y: POCKET.c41 }, ".C41 > .pin1"]]}
      />
      <Route
        from={esp("IO2")}
        to=".R4 > .pin1"
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO2"),
            land(2, PANEL),
            ...column(1),
            { x: gapX(1), y: 21.7 },
            { x: 50.35, y: 21.8 },
            { x: 50.35, y: POCKET.r4 - 0.6 },
            { x: 50.95, y: POCKET.r4 },
            ".R4 > .pin1",
          ],
        ]}
      />
      <Route
        from={esp("IO1")}
        to=".R7 > .pin1"
        width={LANE_WIDTH}
        paths={[[esp("IO1"), land(1, PANEL), ...column(0), { x: gapX(0), y: 21.9 }, { x: 51.75, y: 22.3 }, ".R7 > .pin1"]]}
      />
      <Route from=".R7 > .pin2" to=".LED1 > .anode" width={0.25} paths={[[".R7 > .pin2", ".LED1 > .anode"]]} />
      {/* EN's cap, and 3V3's, at their lands. */}
      <Route from={esp("EN")} to=".C8 > .pin1" width={0.25} maxLength={CAP_RUN} paths={[[esp("EN"), ".C8 > .pin1"]]} />
      <Route from={esp("3V3")} to=".C7 > .pin1" width={0.4} maxLength={CAP_RUN} paths={[[esp("3V3"), ".C7 > .pin1"]]} />
      {/* 3V3 round the pocket to the pull-up, the bulk cap, mux 1's cap and its VDD. */}
      <Route
        from=".C7 > .pin1"
        to={mux("VDD")}
        width={0.25}
        maxLength={60}
        paths={[
          [
            ".C7 > .pin1",
            { x: RISER_X, y: 20.2 },
            { x: RISER_X, y: EDGE_Y },
            { x: DOWN_X + 0.3, y: EDGE_Y },
            { x: DOWN_X, y: EDGE_Y - 0.3 },
            { x: DOWN_X, y: 24.6 },
            { x: DOWN_X - 0.3, y: 24.3 },
            { x: DOWN_X - 0.3, y: 22.9 },
            { x: u2X(7), y: 22.9 },
            mux("VDD"),
          ],
        ]}
      />
      <Route from=".R4 > .pin2" to="net.V3V3" width={0.25} paths={[[".R4 > .pin2", { x: RISER_X, y: POCKET.r4 }]]} />
      <Route from=".C6 > .pin1" to="net.V3V3" width={0.4} maxLength={CAP_RUN} paths={[[".C6 > .pin1", { x: RISER_X, y: POCKET.c6 }]]} />
      <Route from=".C9 > .pin1" to="net.V3V3" width={0.25} maxLength={CAP_RUN} paths={[[".C9 > .pin1", { x: DOWN_X, y: POCKET.c9 }]]} />
      {/* GND: a via for each piece of the pocket's pour that the lines cut off. */}
      {gnd(".C7 > .pin2", { x: espPinX(0), y: 21.75 })}
      {gnd(".C8 > .pin2", { x: 50.9, y: 22.45 })}
      <Route from=".LED1 > .cathode" to="net.GND" width={0.25} paths={[[".LED1 > .cathode", { x: 50.9, y: 22.45 }]]} />
      {gnd(".C9 > .pin2", { x: 49.6, y: 26.45 })}
      <Route from=".C6 > .pin2" to=".C9 > .pin2" width={0.3} maxLength={CAP_RUN} paths={[[".C6 > .pin2", ".C9 > .pin2"]]} />
      {gnd(".C10 > .pin2", { x: espPinX(2), y: 22.05 })}
      <Route from=".C41 > .pin2" to="net.GND" width={0.3} maxLength={CAP_RUN} paths={[[".C41 > .pin2", { x: espPinX(2), y: 22.05 }]]} />

      {/* ── The blind end and J1 ───────────────────────────────────────────── */}
      {/* GPIO8 and GPIO9 cross to the blind end on the ring face, clear of the UART, and come
          up beside their pull-ups. */}
      <Route
        from={esp("IO8")}
        to=".R5 > .pin1"
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO8"),
            land(6, INNER - 0.05),
            { x: 43.25, y: 17.6 },
            { x: 42.5, y: 17.6 },
            { x: 42.2, y: 17.3 },
            ...down({ x: 42.2, y: 16.5 }),
            { x: 42.2, y: 11.3 },
            { x: 41.2, y: 10.3 },
            ...up({ x: 41.2, y: PULLUPS.io8 }),
            ".R5 > .pin1",
          ],
        ]}
      />
      <Route
        from={esp("IO9")}
        to=".R6 > .pin1"
        width={LANE_WIDTH}
        paths={[
          [
            esp("IO9"),
            land(7, INNER - 0.05),
            ...down({ x: 41.5, y: LAND_VIA_Y }),
            ...up({ x: 41.5, y: PULLUPS.io9 }),
            ".R6 > .pin1",
          ],
        ]}
      />
      {/* The pull-ups' 3V3, from the lower of the riser's two vias. */}
      <Route from=".R5 > .pin2" to=".R6 > .pin2" width={0.25} paths={[[".R5 > .pin2", ".R6 > .pin2"]]} />
      <Route
        from=".R5 > .pin2"
        to="net.V3V3"
        width={0.25}
        paths={[[".R5 > .pin2", { x: PULLUPS.x, y: V3V3_PULLUPS_Y }, ...down({ x: V3V3_X, y: V3V3_PULLUPS_Y })]]}
      />
      {/* The six lines past the nut: J1's GND from way 1's cap return, GPIO9, the UART, 3V3 and EN. */}
      <Route
        from=".C31 > .pin2"
        to=".J1 > .GND"
        width={LANE_WIDTH}
        maxLength={30}
        paths={[
          [
            ".C31 > .pin2",
            { x: 38.15, y: 8.21 },
            { x: 38.15, y: 12.65 },
            { x: pastNut(0), y: 12.85 },
            ...behindNut(0, 35.0),
            ".J1 > .GND",
          ],
        ]}
      />
      <Route
        from=".R6 > .pin1"
        to=".J1 > .IO0"
        width={LANE_WIDTH}
        paths={[[".R6 > .pin1", ...behindNut(1, 36.25), { x: 36.25, y: 22.25 }, ".J1 > .IO0"]]}
      />
      {/* UART: up from the panel-edge lands under the module, then to J1 between its rows. */}
      <Route
        from={esp("RXD")}
        to=".J1 > .TXD"
        width={LANE_WIDTH}
        paths={[
          [
            esp("RXD"),
            { x: 42.2, y: 12.4 },
            { x: 41.9, y: 12.7 },
            { x: pastNut(2) + 0.3, y: 12.7 },
            { x: pastNut(2), y: 13.0 },
            ...behindNut(2, 36.6),
            { x: 36.6, y: 20.1 },
            { x: 36.95, y: 20.45 },
            { x: 36.95, y: 23.63 },
            { x: 36.65, y: 23.93 },
            { x: wayX(1), y: 23.93 },
            ".J1 > .TXD",
          ],
        ]}
      />
      <Route
        from={esp("TXD")}
        to=".J1 > .RXD"
        width={LANE_WIDTH}
        paths={[
          [
            esp("TXD"),
            land(6, PANEL + 0.2),
            { x: 42.55, y: 3.35 },
            { x: 42.55, y: 12.7 },
            { x: 42.2, y: 13.05 },
            { x: pastNut(3) + 0.3, y: 13.05 },
            { x: pastNut(3), y: 13.35 },
            ...behindNut(3, 36.95),
            { x: 36.95, y: 20.0 },
            { x: 37.3, y: 20.35 },
            { x: 37.3, y: 23.97 },
            { x: 37.0, y: 24.27 },
            { x: wayX(1) + 2.54, y: 24.27 },
            ".J1 > .RXD",
          ],
        ]}
      />
      {/* 3V3 for TP4: from the riser's upper via past the EN pull-up, over J1's outboard row,
          down between its columns and on between its rows. */}
      <Route
        from=".R3 > .pin2"
        to="net.V3V3"
        width={0.2}
        paths={[[".R3 > .pin2", ...[...behindNut(4, 37.63)].reverse(), { x: V3V3_X, y: V3V3_MODULE_Y }]]}
      />
      <Route
        from=".R3 > .pin2"
        to=".TP4 > .pin1"
        width={0.2}
        paths={[
          [
            ".R3 > .pin2",
            { x: 37.63, y: 19.7 },
            { x: 37.7, y: 19.77 },
            { x: 37.7, y: 26.15 },
            { x: 37.4, y: 26.45 },
            { x: 32.43, y: 26.45 },
            { x: 32.13, y: 26.15 },
            { x: 32.13, y: 24.4 },
            { x: 31.83, y: 24.1 },
            { x: 23.6, y: 24.1 },
            ".TP4 > .pin1",
          ],
        ]}
      />
      {/* EN: under the module from its land, past its pull-up, and round J1's outboard row. */}
      <Route
        from={esp("EN")}
        to=".R3 > .pin1"
        width={LANE_WIDTH}
        paths={[[esp("EN"), land(1, 14.3), { x: pastNut(5), y: 14.3 }, ...behindNut(5, 38.65), ".R3 > .pin1"]]}
      />
      <Route
        from=".R3 > .pin1"
        to=".J1 > .EN"
        width={LANE_WIDTH}
        paths={[
          [
            ".R3 > .pin1",
            { x: 38.65, y: 19.7 },
            { x: 38.1, y: 20.25 },
            { x: 38.1, y: 26.5 },
            { x: 37.8, y: 26.8 },
            { x: wayX(1) - 2.54, y: 26.8 },
            ".J1 > .EN",
          ],
        ]}
      />
      {/* The module's GND land and ground pad, each to a via beside it (lib/copper.tsx). */}
      <Route from={esp("GND")} to="net.GND" width={0.3} paths={[[esp("GND"), { x: 40.75, y: 17.1 }]]} />
      <Route from={esp("EP")} to="net.GND" width={0.3} paths={[[esp("EP"), { x: espPinX(3), y: 11.29 }]]} />
    </>
  )
}

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
    <Ear1Routes />
    <Ear6Routes />
    <VsupRoutes />
    <SupplyRoutes />
  </>
)
