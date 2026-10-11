// Hand-routed traces along the arms. The autorouter is off (routeRemaining={false} on the
// board): it can't see the ring keepouts and routes through the hand-drawn pours.
//
// Points are in the column's coordinates (lib/way.tsx): `u` along the arm from the way's centre
// towards the chin, `v` outboard from the panel edge. Each path is anchored on its own way's
// clamp hole, so both arms take the same points and the even arm's come out mirrored. A SOIC
// can't be mirrored, so the sensor's signal pins run GND, VREF, VOUT, VCC outboard on the odd
// arm and VCC, VOUT, VREF, GND on the even arm, and their lines differ. The pours clear other
// nets' traces and vias by 0.3 mm by themselves.
//
// The channel is the ring face from the panel edge to the load copper, 5.8 out. It carries a GND
// bus along the panel edge, a lane for each way's voltage and sense line, and 3V3 along its top.
// A line drops in through a via just above the lanes already there, then settles into its lane.
// Everything stops at the arm's root, ROOT_U past the last way, where the chin takes over.

import { CLAMP_Y, WAY_PITCH_PCB, type Pt } from "./outline"
import { CAPS_U, CHIN_CAPS_U, DIVIDER_U, GAP, PIN_X, ROOT_V, SENSOR_V } from "./way"

type Uv = [number, number]
type Step = Uv | string | { via: Uv; to: "top" | "bottom" }

/** The GND bus on the ring face, 0.5 from the panel edge between the fingers. */
export const BUS_V = 0.65
export const BUS_WIDTH = 0.3
// Channel lanes from the bus out, 0.16 wide and 0.16 apart, so 2 oz copper stays open (#87).
// The pitch keeps the last sense via inboard of the even arm's VREF line.
export const lane = (i: number) => 1.2 + 0.32 * i
export const LANE_WIDTH = 0.16
/** A line's via stands 0.16 clear of the lane below its own. */
const entry = (i: number) => lane(i) + 0.22
// 3V3 has the top of the channel, with its vias 0.3 short of the load copper. Lanes 0–9 are the
// ways'; an eleventh fits below 3V3's vias, and is the chinmost way's voltage line's.
export const V3V3_V = 5.34
export const V3V3_WIDTH = 0.2
const V3V3_VIA_V = 5.2
/** Where the lines stop, past the last way of an arm: short of the step in the inner edge. */
export const ROOT_U = 10.5
/**
 * Where the even arm's line at `v` stops instead. Its channel turns 45° outboard beside the step
 * (lib/root-even.tsx), so the ends lie on the turn's bisector and the lines keep their pitch.
 */
export const evenRootU = (v: number) => 10.85 - Math.tan(Math.PI / 8) * (v - BUS_V)

/** The sensor's signal pins: their centres along the arm, and their pads' ends. */
const PIN_U = GAP + 2.6
const PIN_END = [PIN_U - 0.9, PIN_U + 0.9]
// Under a finger's root each 0402 has one pad towards the body and one into the finger.
const BODY_PAD_V = ROOT_V + 0.51
const FINGER_PAD_V = ROOT_V - 0.51
/** A GND via under a finger's root, just into the finger from the pad it serves. */
const ROOT_VIA_V = FINGER_PAD_V - 0.57
// Columns on the parts face. Under the sensor's body, between the line's strip and the signal
// pins: the voltage line's via, then the even arm's GND and 3V3. Past the signal pins, before
// the next way's copper: the sense line with its via, then the line to the furthest cap.
const VOLTS_U = 6.75
const INNER_GND_U = 7.5
const INNER_U = 7.95
const INNER_V3V3_U = 8.05
const BUS_VIA_U = 9.9
const SENSE_U = 10.65
const FAR_U = 11.3
/** The voltage line's run along the panel edge, under the line copper's corner. */
const EDGE_V = 0.45
/** VSUP's trunk behind the nuts, on the parts face: every ring keepout covers the ring face there. */
const TRUNK_V = 16.05
// tscircuit holds a trace from a capacitor's pin to 1 mm unless told otherwise.
const CAP_RUN = 12

const down = (p: Uv): Step[] => [p, { via: p, to: "bottom" }, p]
const isSteps = (s: Step | Step[]): s is Step[] => Array.isArray(s) && typeof s[0] !== "number"

/**
 * One way's routes: its divider and caps, GND and 3V3 to its sensor, its voltage and sense lines
 * into their lanes and on to the root, and VSUP's trunk on to the next diode. `k` counts ways
 * along the arm from the open end, so way `k` has lanes 2k and 2k+1.
 */
const WayRoutes = ({ n, finger, nut, evenV3v3 }: { n: number; finger: Pt; nut: Pt; evenV3v3: Uv[] }) => {
  const out = Math.sign(nut.x - finger.x)
  const odd = out < 0
  const k = Math.floor((n - 1) / 2)
  const chinmost = k === 5
  const root = (v: number): Uv => [(5 - k) * WAY_PITCH_PCB + (odd ? ROOT_U : evenRootU(v)), v]
  const NEXT = WAY_PITCH_PCB

  const point = ([u, v]: Uv) => ({ x: out * (v - CLAMP_Y), y: u })
  const toPathPoint = (s: Step) => {
    if (typeof s === "string") return s
    if ("via" in s) return { ...point(s.via), via: true, toLayer: s.to }
    return point(s)
  }
  const Route = ({
    from,
    to,
    width = 0.2,
    maxLength,
    path,
  }: { from: string; to: string; width?: number; maxLength?: number; path: (Step | Step[])[] }) => (
    <trace
      from={from}
      to={to}
      thickness={`${width}mm`}
      maxLength={maxLength}
      pcbPathRelativeTo={`.W${n} > .pin1`}
      pcbPaths={[path.flatMap((s) => (isSteps(s) ? s : [s])).map(toPathPoint)] as any}
    />
  )

  const pin = (name: string) => `.U1${n} > .${name}`
  const pinV = (name: keyof typeof PIN_X | "GND") => SENSOR_V + out * (name === "GND" ? 1.905 : PIN_X[name])
  const cap = (c: 1 | 2 | 3, p: 1 | 2) => `.C${c}${n} > .pin${p}`
  // The caps by where they stand under the next finger's root: nearest the sensor, then the
  // sense cap, then the furthest. Beside the chinmost way's pins they keep their pins' order.
  const [near, far] = odd ? ([2, 1] as const) : ([1, 2] as const)
  const nearPin = odd ? "VREF" : "VCC"
  const farPin = odd ? "VCC" : "VREF"
  const volts = `net.S${n}_VOLTS`
  const sense = `net.S${n}_SENSE`

  /** From a pin's outer end to a column past the pins, at `v` on it. */
  const outTo = (name: "VREF" | "VOUT" | "VCC", u: number, v: number): Step[] => {
    const from = pinV(name)
    const run = u - PIN_END[1] - 0.12
    if (Math.abs(v - from) <= run) return [pin(name), [PIN_END[1] + 0.12, from], [u, v]]
    return [pin(name), [u - 0.3, from], [u, from + 0.3 * Math.sign(v - from)], [u, v]]
  }
  /** A cap under the next finger's root, from a column above it. */
  const capFrom = (u: number, at: number): Step[] => [[u, BODY_PAD_V + 0.56], [at, BODY_PAD_V + 0.26]]

  const senseVia: Uv = [SENSE_U, entry(2 * k + 1)]
  const voltsVia: Uv = [VOLTS_U, entry(2 * k)]
  const v3v3Via: Uv = odd && !chinmost ? [FAR_U, V3V3_VIA_V] : [INNER_V3V3_U, V3V3_VIA_V]
  /** Where the next way's 3V3 via stands, seen from this way. */
  const nextV3v3U = NEXT + (odd && k < 4 ? FAR_U : INNER_V3V3_U)

  // The voltage line: along the panel edge under the line copper's corner, to its via under the
  // sensor's body, and into its lane.
  const voltsLine = (
    <Route
      from={`.R2${n} > .pin2`}
      to={volts}
      width={LANE_WIDTH}
      path={[
        `.R2${n} > .pin2`,
        [DIVIDER_U[1], EDGE_V],
        [VOLTS_U - 0.4, EDGE_V],
        [VOLTS_U, EDGE_V + 0.4],
        down(voltsVia),
        [VOLTS_U + 0.4, lane(2 * k)],
        root(lane(2 * k)),
      ]}
    />
  )

  return (
    <>
      {/* The divider: its line pad onto a stitching via in the neck, its two VOLTS pads joined,
          and its GND by a via under the root to the bus, which runs on to the next way's. */}
      <Route
        from={`.R1${n} > .pin2`}
        to={`net.S${n}_LINE`}
        width={0.3}
        path={[`.R1${n} > .pin2`, [2.38, FINGER_PAD_V], [2.0, -1.5]]}
      />
      <Route from={`.R1${n} > .pin1`} to={`.R2${n} > .pin2`} width={LANE_WIDTH} path={[`.R1${n} > .pin1`, `.R2${n} > .pin2`]} />
      <Route
        from={`.R2${n} > .pin1`}
        to="net.GND"
        width={BUS_WIDTH}
        path={[
          `.R2${n} > .pin1`,
          down([DIVIDER_U[1], ROOT_VIA_V]),
          [DIVIDER_U[1], BUS_V],
          // The odd arm's bus ends at way 11's GND via: the edge steps out past it (lib/root.tsx).
          chinmost ? (odd ? [BUS_VIA_U, BUS_V] : root(BUS_V)) : [NEXT + DIVIDER_U[1], BUS_V],
        ]}
      />

      {/* The sensor's GND pin to the bus: straight in on the odd arm, where it is nearest the
          panel, and round the pins' inner ends and under the body on the even arm. */}
      <Route
        from={pin("GND")}
        to="net.GND"
        path={
          odd
            ? [pin("GND"), [BUS_VIA_U, pinV("GND") - 0.62], down([BUS_VIA_U, BUS_V])]
            : [
                pin("GND"),
                [PIN_END[0], pinV("GND")],
                [PIN_END[0] - 0.28, pinV("GND") + 0.28],
                [INNER_GND_U, pinV("GND") + 0.28],
                down([INNER_GND_U, BUS_V]),
              ]
        }
      />

      {/* 3V3 from the top of the channel: its via stands at the VCC pin's end, and the lane runs
          on to the next way's via. */}
      <Route
        from={pin("VCC")}
        to="net.V3V3"
        width={V3V3_WIDTH}
        path={[
          ...(odd && !chinmost
            ? outTo("VCC", FAR_U, V3V3_VIA_V)
            : ([
                pin("VCC"),
                [PIN_END[0], pinV("VCC")],
                [INNER_V3V3_U, pinV("VCC") + (odd ? -0.33 : 0.33)],
                [INNER_V3V3_U, V3V3_VIA_V],
              ] as Step[])),
          { via: v3v3Via, to: "bottom" },
          v3v3Via,
          // On the odd arm 3V3 ends at way 11's via, to leave the root's ring face to the lines.
          ...(chinmost
            ? odd
              ? []
              : [[v3v3Via[0] + 0.2, V3V3_V] as Uv, root(V3V3_V), ...evenV3v3]
            : [[v3v3Via[0] + 0.2, V3V3_V] as Uv, [nextV3v3U - 0.2, V3V3_V] as Uv, [nextV3v3U, V3V3_VIA_V] as Uv]),
        ]}
      />

      {chinmost ? (
        <>
          {/* The last way's caps lie beside their pins. On the odd arm their GND pads are joined
              in a row, which reaches the sensor's GND pin along the panel side; the even arm's
              are joined at its root (lib/root-even.tsx), where way 12's sense line passes
              between them. The voltage line takes the eleventh lane; the sense line starts at
              the root. */}
          {voltsLine}
          <Route from={pin(nearPin)} to={cap(near, 1)} maxLength={CAP_RUN} path={[pin(nearPin), cap(near, 1)]} />
          <Route from={pin("VOUT")} to={cap(3, 1)} width={LANE_WIDTH} maxLength={CAP_RUN} path={[pin("VOUT"), cap(3, 1)]} />
          <Route from={pin(farPin)} to={cap(far, 1)} maxLength={CAP_RUN} path={[pin(farPin), cap(far, 1)]} />
          {odd && (
            <>
              <Route from={cap(near, 2)} to={cap(3, 2)} maxLength={CAP_RUN} path={[cap(near, 2), cap(3, 2)]} />
              <Route from={cap(3, 2)} to={cap(far, 2)} maxLength={CAP_RUN} path={[cap(3, 2), cap(far, 2)]} />
              <Route
                from={pin("GND")}
                to={cap(near, 2)}
                maxLength={CAP_RUN}
                path={[pin("GND"), [CHIN_CAPS_U + 0.51, pinV("GND")], cap(near, 2)]}
              />
            </>
          )}
        </>
      ) : (
        <>
          {/* The caps under the next finger's root. The nearest takes the pin nearest the panel:
              VREF on the odd arm, round the pins' inner ends, and VCC on the even arm, straight
              in. The furthest takes the outboard pin, down a column past the pins' outer ends. */}
          {odd ? (
            <Route
              from={cap(2, 1)}
              to={pin("VREF")}
              width={LANE_WIDTH}
              maxLength={CAP_RUN}
              path={[
                cap(2, 1),
                [CAPS_U[0], BODY_PAD_V + 0.9],
                [CAPS_U[0] - 0.26, BODY_PAD_V + 1.16],
                [INNER_U + 0.45, BODY_PAD_V + 1.16],
                [INNER_U, BODY_PAD_V + 1.61],
                [INNER_U, pinV("VREF")],
                pin("VREF"),
              ]}
            />
          ) : (
            <Route from={cap(1, 1)} to={pin("VCC")} maxLength={CAP_RUN} path={[cap(1, 1), [CAPS_U[0], pinV("VCC")]]} />
          )}
          <Route
            from={pin(farPin)}
            to={cap(far, 1)}
            width={odd ? V3V3_WIDTH : LANE_WIDTH}
            maxLength={CAP_RUN}
            path={[
              // The even arm's VREF steps outboard first, over the top of the sense via.
              ...(odd
                ? outTo("VCC", FAR_U, BODY_PAD_V + 0.56)
                : ([
                    pin("VREF"),
                    [PIN_END[1] - 0.28, pinV("VREF")],
                    [PIN_END[1] + 0.39, pinV("VREF") + 0.67],
                    [FAR_U - 0.3, pinV("VREF") + 0.67],
                    [FAR_U, pinV("VREF") + 0.37],
                    [FAR_U, BODY_PAD_V + 0.56],
                  ] as Step[])),
              ...capFrom(FAR_U, CAPS_U[2]).slice(1),
              cap(far, 1),
            ]}
          />
          {/* The caps' GND pads face into the finger, joined in a row, with a via to the bus. */}
          <Route from={cap(near, 2)} to={cap(far, 2)} maxLength={CAP_RUN} path={[cap(near, 2), cap(3, 2), cap(far, 2)]} />
          <Route
            from={cap(3, 2)}
            to="net.GND"
            maxLength={CAP_RUN}
            path={[cap(3, 2), down([CAPS_U[1], ROOT_VIA_V]), [CAPS_U[1], BUS_V]]}
          />

          {/* The sense line: from the pin to its via, past the pins' outer ends, and into its
              lane; the sense cap hangs off the via's column. */}
          <Route
            from={pin("VOUT")}
            to={sense}
            width={LANE_WIDTH}
            path={[
              ...outTo("VOUT", SENSE_U, senseVia[1]),
              { via: senseVia, to: "bottom" },
              senseVia,
              [SENSE_U + 0.4, lane(2 * k + 1)],
              root(lane(2 * k + 1)),
            ]}
          />
          <Route
            from={cap(3, 1)}
            to={sense}
            width={LANE_WIDTH}
            maxLength={CAP_RUN}
            path={[cap(3, 1), ...capFrom(SENSE_U, CAPS_U[1]).reverse(), senseVia]}
          />

          {voltsLine}

          {/* VSUP: up the neck from the diode, behind the next nut, and down the next neck. */}
          <Route
            from={`.D1${n} > .cathode`}
            to={`.D1${n + 2} > .cathode`}
            width={0.4}
            path={[`.D1${n} > .cathode`, [GAP, TRUNK_V], [NEXT + GAP, TRUNK_V], `.D1${n + 2} > .cathode`]}
          />
        </>
      )}
    </>
  )
}

/**
 * Every way's routes. `ways` gives each way's clamp hole and nut, and `evenV3v3` where the even
 * arm's 3V3 runs on past its root, in way 12's coordinates.
 */
export const Routes = ({ ways, evenV3v3 }: { ways: { n: number; finger: Pt; nut: Pt }[]; evenV3v3: [number, number][] }) => (
  <>
    {ways.map((way) => (
      <WayRoutes key={way.n} {...way} evenV3v3={evenV3v3} />
    ))}
  </>
)
