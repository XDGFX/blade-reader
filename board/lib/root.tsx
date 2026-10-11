// The odd arm's root: its lines from where the arm's routes stop (lib/routes.tsx), under the
// module on the ring face, to mux 1 on the chin.
//
// Points are in way 11's column coordinates, as lib/routes.tsx has them: `u` along the arm from
// way 11's centre towards the chin, `v` outboard from the panel edge, so the chin's inner edge is
// at negative v.
//
// Thirteen lines cross the root on the ring face, in lanes 0.32 apart, in the order they leave
// the arm: voltage then sense for ways 1 to 11, then the arm's temperature. Way 11's sense line
// and the temperature come down from the parts face just past the root. The lanes step 0.2
// outboard there, clear of the step in the board's inner edge. The six nearest the panel turn
// along the chin's inner edge and up under the mux's body to its inboard pins; the other seven
// turn straight in to its outboard pins. No line crosses another, which is what sets the mux's
// channel order (index.circuit.tsx).

import { CLAMP_Y, type Pt } from "./outline"
import { LANE_WIDTH, ROOT_U, lane } from "./routes"
import { CHIN_CAPS_U, PIN_X, SENSOR_V } from "./way"

type Uv = [number, number]
type Step = Uv | string | { via: Uv; to: "top" | "bottom" }

/** Where the lanes have finished stepping outboard, and how far. */
const STEPPED_U = ROOT_U + 1
const STEP = 0.2
const stepped = (i: number) => lane(i) + STEP
/** Every corner is cut back this far. */
const CUT = 0.3

/** The mux's pads from its centre: twelve a side on a 0.65 pitch, the sides 6.04 apart. */
const ROW_PITCH = 0.65
const row = (r: number) => (r - 5.5) * ROW_PITCH
/** The lines that go to the inboard pins, and the channel each takes: Y7 down to Y2. */
const INBOARD = 6
// Under the mux's body each inboard line ends in a via level with its pin, the vias 0.6 apart
// so that the next line passes the last one's via.
const STAIR_V = -1.6
const STAIR_PITCH = 0.6
/** The first inboard line's run along the chin's inner edge, from the mux's centre. */
const EDGE_RUN_U = -5.53
// The outboard lines' vias stand between the module and the mux's pads, in two staggered columns.
const OUTBOARD_VIA_V = [4.5, 5.25]

/** Way 11's sense line comes down outboard of its VCC cap, having passed between the caps' pads. */
const SENSE_VIA: Uv = [CHIN_CAPS_U, SENSOR_V - PIN_X.VCC + 1.1]
/** The temperature's via stands between Q2's collector pad and R8. */
const TEMP_VIA: Uv = [9.47, 8.85]
/** Q2's collector pad across, and its base pad along. */
const Q2_CORNER: Uv = [10.93, 9.96]
// tscircuit holds a trace from a capacitor's pin to 1 mm unless told otherwise.
const CAP_RUN = 80

const NETS = [1, 3, 5, 7, 9, 11].flatMap((n) => [`net.S${n}_VOLTS`, `net.S${n}_SENSE`]).concat("net.TEMP_ODD")
/** Mux 1's channels in the order its lines arrive: the net on each of Y0 to Y15. */
export const ODD_CHANNELS = Array.from({ length: 16 }, (_, y) => {
  if (y === 1) return "net.TEMP_CHIN"
  if (y >= 2 && y <= 7) return NETS[7 - y]
  if (y >= 8 && y <= 14) return NETS[y - 2]
  return "net.GND"
})

/** The odd arm's lines to mux 1. `finger` is way 11's clamp hole and `mux` the middle of U2. */
export const OddRoot = ({ finger, mux }: { finger: Pt; mux: Pt }) => {
  const muxU = mux.y - finger.y
  const muxV = finger.x - mux.x + CLAMP_Y

  const point = ([u, v]: Uv) => ({ x: CLAMP_Y - v, y: u })
  const toPathPoint = (s: Step) => {
    if (typeof s === "string") return s
    if ("via" in s) return { ...point(s.via), via: true, toLayer: s.to }
    return point(s)
  }
  const Route = ({
    from,
    to,
    width = LANE_WIDTH,
    maxLength,
    path,
  }: { from: string; to: string; width?: number; maxLength?: number; path: Step[] }) => (
    <trace
      from={from}
      to={to}
      thickness={`${width}mm`}
      maxLength={maxLength}
      pcbPathRelativeTo=".W11 > .pin1"
      pcbPaths={[path.map(toPathPoint)] as any}
    />
  )
  const through = (p: Uv, to: "top" | "bottom"): Step[] => [p, { via: p, to }, p]

  /** From the mux's pin down to the ring face, and along it into lane `i` heading for the arm. */
  const fromMux = (i: number): Step[] => {
    const v = stepped(i)
    if (i < INBOARD) {
      const via: Uv = [muxU + row(1 + i), muxV + STAIR_V + STAIR_PITCH * i]
      const run = muxU + EDGE_RUN_U + 0.32 * i
      return [
        `.U2 > .Y${7 - i}`,
        ...through(via, "bottom"),
        [run + CUT, via[1]],
        [run, via[1] + CUT],
        [run, v - CUT],
        [run - CUT, v],
      ]
    }
    const via: Uv = [muxU + row(i - 5), muxV + OUTBOARD_VIA_V[i % 2]]
    return [`.U2 > .Y${i + 2}`, ...through(via, "bottom"), [via[0], v - CUT], [via[0] - CUT, v]]
  }
  /** A lane's end at the root, where the arm's own route stops. */
  const toArm = (i: number): Step[] => [
    [STEPPED_U, stepped(i)],
    [ROOT_U, lane(i)],
  ]
  /** Along the ring face at 45° from a lane out to a via outboard of it. */
  const fromLane = (i: number, via: Uv, turn = via[0]): Step[] => [
    [turn + (via[1] - stepped(i)), stepped(i)],
    [turn, via[1]],
  ]

  return (
    <>
      {NETS.slice(0, 11).map((net, i) => (
        <Route key={net} from={`.U2 > .Y${i < INBOARD ? 7 - i : i + 2}`} to={net} path={[...fromMux(i), ...toArm(i)]} />
      ))}

      {/* Way 11's sense line: from its cap, between the pads of that cap and of the VCC cap
          beside it, to its via. */}
      <Route
        from=".U2 > .Y13"
        to=".C311 > .pin1"
        maxLength={CAP_RUN}
        path={[
          ...fromMux(11),
          ...fromLane(11, SENSE_VIA),
          ...through(SENSE_VIA, "top"),
          [CHIN_CAPS_U, SENSOR_V - PIN_X.VOUT],
          ".C311 > .pin1",
        ]}
      />

      {/* The arm's temperature: Q2's base and collector joined, on to R8, and down. R8 takes its
          3V3 from way 11's VCC cap. */}
      <Route from=".Q2 > .pin1" to=".Q2 > .pin3" path={[".Q2 > .pin1", Q2_CORNER, ".Q2 > .pin3"]} />
      <Route from=".Q2 > .pin3" to=".R8 > .pin1" path={[".Q2 > .pin3", ".R8 > .pin1"]} />
      <Route
        from=".U2 > .Y14"
        to=".R8 > .pin1"
        path={[...fromMux(12), ...fromLane(12, TEMP_VIA, TEMP_VIA[0] + 2.33), ...through(TEMP_VIA, "top"), ".R8 > .pin1"]}
      />
      <Route from=".R8 > .pin2" to=".C111 > .pin1" width={0.2} maxLength={CAP_RUN} path={[".R8 > .pin2", ".C111 > .pin1"]} />
    </>
  )
}
