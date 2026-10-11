// The chin's own routes and its GND pour: the supply along the even half of the outer edge,
// VSUP and 3V3 to both arms and the module, mux 2's grounds, and the lines that cross the chin
// along its inner edge. The module's pins are not routed yet.
//
// Points are PCB coordinates, in mm, as lib/supply.tsx places its parts.
//
// The ring face is GND from the chin's inner edge to its outer edge, poured, with the ground
// nut in it; the parts face has no pour. A GND pad reaches the pour by a via beside it.

import { Fragment } from "react"
import type { Pt } from "./outline"

type Xy = [number, number]
type Step = Xy | string | { via: Xy; to: "top" | "bottom" }

const MARGIN = 0.3
/** Where the pour stops on each arm's root: short of the odd arm's lanes, and of mux 2's lines. */
const POUR_FROM = { odd: 28.5, even: 36.2 }
// tscircuit holds a trace from a capacitor's pin to 1 mm unless told otherwise.
const CAP_RUN = 80

/** VSUP up the even arm's outboard edge, outside mux 2's divided lines. */
const VSUP_X = 58.25
/** 3V3 from the output capacitors along the chin, under the supply's parts. */
const V3V3_Y = 50.2
/** 3V3 over the ground nut's land, between it and the fuse, and down its outboard side. */
const OVER_NUT_Y = 51.1
const PAST_NUT_X = 56.5
/** 3V3 down the inner edge to mux 2's capacitor. */
const INNER_X = 43.55
/** Where the even arm's 3V3 lane stops on the ring face (lib/root-even.tsx), and the via that feeds it. */
const EVEN_V3V3_END: Xy = [57.77, 30.58]
const EVEN_V3V3_VIA: Xy = [57.3, 37.6]
/** The VIN rail, from the fuse over the TVS diode's GND pad to the input capacitors and the buck. */
const VIN_Y = 55.44
/** The even arm's GND bus comes up to this via (lib/root-even.tsx); a second one carries it on to the pour. */
const EVEN_BUS_VIA: Xy = [43.99, 28.8]
const EVEN_BUS_ON: Xy = [43.99, 29.6]
/** GND along the inboard ends of mux 2's pads, and under its body beside the outboard ones. */
const MUX_INBOARD_X = 46.85
const MUX_UNDER_X = 52.9

/** GND vias into the pour, each beside the pad it serves. */
const GND_VIAS: Record<string, Xy> = {
  U3: [29.9, 51.25],
  C1a: [34.2, 51.4],
  C1b: [35.2, 51.4],
  D1a: [41.8, 51.3],
  D1b: [42.8, 51.3],
  C4: [10.75, 51.53],
  C5: [10.75, 53.83],
  muxInboard: [46.3, 37.0],
  muxOutboard: [52.3, 39.505],
  nut: [45.5, 45.93],
  Q1: [1.45, 47.1],
  TP6: [-10.35, 46.85],
  C6: [-55.0, 28.95],
  oddRoot: [-52.6, 29.3],
}
/** The even arm's bus leaves the ring face here, cut off from the pour by the lines along the inner edge. */
const EVEN_BUS_UP: Xy = [44.25, 37.3]

/**
 * The lines along the inner edge, on the ring face, in order from the edge: an order that lets
 * each one end at both multiplexers without crossing another. Hugging the edge, they cut
 * nothing off the pour but the even arm's bus.
 */
const LANES = { S2: 0, S3: 1, ADC2: 2, S1: 3, S0: 4, TEMP: 5 }
const LANE_0 = 0.45
const LANE_PITCH = 0.32
const LANE_WIDTH = 0.16
/** A corner's cut. */
const CUT = 0.3
/** The inner edge's last point the lanes follow, on each half, before they leave it for a multiplexer. */
const LAST = 5
/**
 * At mux 2 each lane leaves the edge at `y`, past the edge's point `past`. The selects end in
 * vias: S2 and S3 west of ADC2, with stubs over it to the inboard pins, S1 and S0 east of it.
 */
const AT_MUX2 = {
  S2: { past: 12, y: 38.855, via: [44.2, 38.855] as Xy },
  S3: { past: 12, y: 39.66, via: [44.2, 39.66] as Xy },
  ADC2: { past: 11, y: 40.3 },
  S1: { past: 11, y: 40.7, via: [45.4, 40.2] as Xy },
  S0: { past: 11, y: 41.1, via: [46.2, 41.1] as Xy },
}
/** ADC2 runs on up the root, east of the even arm's bus, to where lib/root-even.tsx leaves it. */
const ADC2_X = 44.85
const ADC2_END: Xy = [46.4, 35.605]
/** S1 and S0 pass between mux 2 and the ground nut on the parts face, and round to the outboard pins' ends. */
const S1_Y = 40.2
const S0_Y = 40.6
const S1_X = 55.3
const S0_X = 55.75
/** At mux 1 each lane turns down the ring face east of the inboard pins, at this x. */
const AT_MUX1 = { S2: -34.3, S3: -33.98, ADC2: -33.66, S1: -33.1, S0: -32.5, TEMP: -31.95 }
/** S2 and S3 run on under mux 1's body to vias beside their pins. */
const S2_VIA: Xy = [-39.95, 49.955]
const S3_VIA: Xy = [-39.1, 50.605]
/** ADC2 passes below mux 1 and under the module to a via between GPIO3's pad and C41. */
const ADC2_Y = 51.45
const ADC2_VIA: Xy = [-53.2, 54.39]
/** The chin's temperature joins the lanes at a via between Q1's base and collector pads. */
const TEMP_VIA: Xy = [4.0, 47.3]

/** VSUP and 3V3 along the outer edge on the ring face, VSUP outermost, and up the odd arm's outboard edge under the module. */
const VSUP_TRUNK = { y: 57.3, x: -58.3 }
const V3V3_TRUNK = { y: 56.5, x: -57.6 }
/** 3V3 steps in between the USB socket's stakes, where only VSUP fits outside them. */
const STAKES = { y: 53.76, from: -17.5, to: -32.74 }
/** VSUP comes down the odd arm on the parts face (lib/routes.tsx) and goes to the ring face above the module. */
const ODD_VSUP: Xy = [-58.15, 27.0]
/** VSUP comes back to the parts face below the fuse. */
const FUSE_VIA: Xy = [49.6, 54.1]
/** D2 and D3 each reach the trunk by a via on it, outside J1's box. */
const D2_X = 6.7
const D3_X = -15.6
const DIODE_VIA_Y = 57.25
/** 3V3 leaves the output capacitors for the ring face here. */
const V3V3_DOWN: Xy = [14.863, 55.45]
/** 3V3 comes up between the module's 3V3 pad and R3. */
const MODULE_V3V3: Xy = [-57.6, 34.46]
/** 3V3 runs on above the pour to a via beside R8, for the odd arm; R5, R6 and C6 branch off it. */
const ODD_V3V3_Y = 27.9
const R8_VIA: Xy = [-51.5, 27.2]
const PULLUP_VIA: Xy = [-47.95, 32.72]
const C6_VIA: Xy = [-53.95, 31.0]
/** VSUP to TP5 and 3V3 to TP4, on the parts face between the test pads and J1. */
const TP_V3V3_Y = 48.25
const TP_VSUP_Y = 48.7

/**
 * The chin's routes and pour. `nut` is the ground nut, `inner` the chin's inner edge from the
 * centreline to the odd arm's side, and `corner` the cut across the odd arm's outer corner,
 * from the side to the outer edge.
 */
export const Chin = ({ nut, inner, corner }: { nut: Pt; inner: Pt[]; corner: [Pt, Pt] }) => {
  const point = ([x, y]: Xy) => ({ x: x - nut.x, y: y - nut.y })
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
  }: { from: string; to: string; width?: number; maxLength?: number; path: Step[] }) => (
    <trace
      from={from}
      to={to}
      thickness={`${width}mm`}
      maxLength={maxLength}
      pcbPathRelativeTo=".N13 > .pin1"
      pcbPaths={[path.map(toPathPoint)] as any}
    />
  )
  const down = (p: Xy): Step[] => [p, { via: p, to: "bottom" }, p]
  const up = (p: Xy): Step[] => [p, { via: p, to: "top" }, p]

  /** The odd half's inner edge moved `d` into the board, as index.circuit.tsx moves the panel's end out. */
  const inset = (d: number): Xy[] =>
    inner.map((p, i) => {
      const normal = (a: Pt, b: Pt) => {
        const len = Math.hypot(b.x - a.x, b.y - a.y)
        return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len }
      }
      const n0 = i === 0 ? { x: 0, y: 1 } : normal(p, inner[i - 1])
      const n1 = i === inner.length - 1 ? { x: -1, y: 0 } : normal(inner[i + 1], p)
      const k = d / (1 + n0.x * n1.x + n0.y * n1.y)
      return [p.x + (n0.x + n1.x) * k, p.y + (n0.y + n1.y) * k]
    })
  const lane = (name: keyof typeof LANES) => inset(LANE_0 + LANES[name] * LANE_PITCH)
  /** A lane from where it leaves the edge at mux 2, round the even half and along the odd half. */
  const run = (name: keyof typeof AT_MUX2): Xy[] => {
    const pts = lane(name)
    const { past, y } = AT_MUX2[name]
    const [a, b] = [pts[past], pts[past + 1]]
    const leave: Xy = [-(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0])), y]
    const even = pts.slice(1, past + 1).map(([x, v]): Xy => [-x, v])
    return [leave, ...even.reverse(), ...pts.slice(0, LAST + 1)]
  }
  /** A lane's turn off the edge and down beside mux 1. */
  const turn = (name: keyof typeof LANES): Xy[] => {
    const [a, b] = [lane(name)[LAST], lane(name)[LAST + 1]]
    const x = AT_MUX1[name]
    const y = a[1] + ((x + CUT - a[0]) / (b[0] - a[0])) * (b[1] - a[1])
    return [[x + CUT, y], [x, y + CUT]]
  }

  const mirror = (p: Pt) => ({ x: -p.x, y: p.y })
  const side = inner[inner.length - 1].x
  // <copperpour> stops boardEdgeMargin inside its outline, so the board's own edge serves.
  const pour = [
    ...inner,
    { x: side, y: POUR_FROM.odd },
    { x: corner[0].x, y: POUR_FROM.odd },
    ...corner,
    ...corner.map(mirror).reverse(),
    { x: -corner[0].x, y: POUR_FROM.even },
    { x: -side, y: POUR_FROM.even },
    ...inner.slice(1, -1).map(mirror).reverse(),
  ]

  return (
    <>
      <copperpour
        name="P_CHIN_GND"
        layer="bottom"
        connectsTo="net.GND"
        clearance={`${MARGIN}mm`}
        boardEdgeMargin={`${MARGIN}mm`}
        cutoutMargin={`${MARGIN}mm`}
        coveredWithSolderMask
        outline={pour}
      />
      {Object.entries(GND_VIAS).map(([name, [x, y]]) => (
        <Fragment key={name}>
          <via fromLayer="top" toLayer="bottom" holeDiameter="0.3mm" outerDiameter="0.6mm" connectsTo="net.GND" pcbX={x} pcbY={y} />
        </Fragment>
      ))}

      {/* ── VSUP and VIN ─────────────────────────────────────────────────────── */}
      {/* The even arm's trunk, from way 12's diode up the outboard edge and in to the fuse. */}
      <Route
        from=".D112 > .cathode"
        to=".F1 > .pin1"
        width={0.4}
        path={[".D112 > .cathode", [VSUP_X, 22.28], [VSUP_X, 50.6], [56.37, 52.48], ".F1 > .pin1"]}
      />
      <Route
        from=".F1 > .pin2"
        to=".C1 > .pin1"
        width={0.5}
        maxLength={CAP_RUN}
        path={[".F1 > .pin2", [46.555, VIN_Y], [34.7, VIN_Y], ".C1 > .pin1"]}
      />
      <Route from=".D1 > .pin1" to="net.VIN" width={0.5} path={[".D1 > .pin1", [37.678, VIN_Y]]} />
      <Route from=".C1 > .pin1" to=".C2 > .pin1" width={0.5} maxLength={CAP_RUN} path={[".C1 > .pin1", ".C2 > .pin1"]} />
      <Route from=".C2 > .pin1" to=".U3 > .EN" width={0.5} maxLength={CAP_RUN} path={[".C2 > .pin1", ".U3 > .EN"]} />
      <Route from=".U3 > .EN" to=".U3 > .VIN" width={0.5} path={[".U3 > .EN", ".U3 > .VIN"]} />

      {/* ── The buck ─────────────────────────────────────────────────────────── */}
      <Route from=".U3 > .SW" to=".L1 > .pin1" width={0.5} path={[".U3 > .SW", [22.9, 55.33], ".L1 > .pin1"]} />
      <Route from=".C3 > .pin2" to="net.SW" width={0.3} maxLength={CAP_RUN} path={[".C3 > .pin2", [27.65, 55.33]]} />
      <Route from=".C3 > .pin1" to=".U3 > .CB" maxLength={CAP_RUN} path={[".C3 > .pin1", [27.65, 52.63], ".U3 > .CB"]} />
      <Route from=".U3 > .FB" to=".R1 > .pin1" path={[".U3 > .FB", [31.2, 52.3], [31.91, 51.6], ".R1 > .pin1"]} />
      <Route from=".R1 > .pin1" to=".R2 > .pin2" path={[".R1 > .pin1", ".R2 > .pin2"]} />
      <Route from=".L1 > .pin2" to=".C5 > .pin1" width={0.8} maxLength={CAP_RUN} path={[".L1 > .pin2", ".C5 > .pin1"]} />
      <Route from=".C5 > .pin1" to=".C4 > .pin1" width={0.8} maxLength={CAP_RUN} path={[".C5 > .pin1", ".C4 > .pin1"]} />

      {/* ── 3V3 to the even arm ──────────────────────────────────────────────── */}
      {/* From the output capacitors under the supply, over the ground nut and down its outboard
          side, to a via above mux 2's divided lines and on down the ring face to the arm's lane. */}
      <Route
        from=".C4 > .pin1"
        to="net.V3V3"
        width={0.25}
        maxLength={CAP_RUN}
        path={[
          ".C4 > .pin1",
          [14.863, V3V3_Y],
          [INNER_X, V3V3_Y],
          [INNER_X + OVER_NUT_Y - V3V3_Y, OVER_NUT_Y],
          [PAST_NUT_X, OVER_NUT_Y],
          [PAST_NUT_X, EVEN_V3V3_VIA[1] + EVEN_V3V3_VIA[0] - PAST_NUT_X],
          ...down(EVEN_V3V3_VIA),
          [EVEN_V3V3_END[0], EVEN_V3V3_VIA[1] - (EVEN_V3V3_END[0] - EVEN_V3V3_VIA[0])],
          EVEN_V3V3_END,
        ]}
      />
      {/* The feedback divider senses the output on that line. */}
      <Route from=".R1 > .pin2" to="net.V3V3" path={[".R1 > .pin2", [30.89, V3V3_Y]]} />
      {/* Mux 2's capacitor, down the inner edge, and on to R9 and the mux's VCC pin. */}
      <Route
        from=".C40 > .pin1"
        to="net.V3V3"
        width={0.3}
        maxLength={CAP_RUN}
        path={[".C40 > .pin1", [44.0, 32.33], [INNER_X, 32.78], [INNER_X, V3V3_Y]]}
      />
      <Route from=".C40 > .pin1" to=".R9 > .pin2" maxLength={CAP_RUN} path={[".C40 > .pin1", [45.3, 31.0], ".R9 > .pin2"]} />

      {/* ── GND ──────────────────────────────────────────────────────────────── */}
      <Route from=".U3 > .GND" to="net.GND" width={0.3} path={[".U3 > .GND", GND_VIAS.U3]} />
      <Route from=".C2 > .pin2" to=".R2 > .pin1" width={0.3} maxLength={CAP_RUN} path={[".C2 > .pin2", ".R2 > .pin1"]} />
      <Route from=".C1 > .pin2" to=".R2 > .pin1" width={0.3} maxLength={CAP_RUN} path={[".C1 > .pin2", ".R2 > .pin1"]} />
      <Route from=".C1 > .pin2" to="net.GND" width={0.4} maxLength={CAP_RUN} path={[".C1 > .pin2", GND_VIAS.C1a]} />
      <Route from=".C1 > .pin2" to="net.GND" width={0.4} maxLength={CAP_RUN} path={[".C1 > .pin2", GND_VIAS.C1b]} />
      <Route from=".D1 > .pin2" to="net.GND" width={0.5} path={[".D1 > .pin2", GND_VIAS.D1a]} />
      <Route from=".D1 > .pin2" to="net.GND" width={0.5} path={[".D1 > .pin2", GND_VIAS.D1b]} />
      <Route from=".C4 > .pin2" to=".C5 > .pin2" width={0.8} maxLength={CAP_RUN} path={[".C4 > .pin2", ".C5 > .pin2"]} />
      <Route from=".C4 > .pin2" to="net.GND" width={0.5} maxLength={CAP_RUN} path={[".C4 > .pin2", GND_VIAS.C4]} />
      <Route from=".C5 > .pin2" to="net.GND" width={0.5} maxLength={CAP_RUN} path={[".C5 > .pin2", GND_VIAS.C5]} />

      {/* The nut's land joins the faces by itself; this ties it to the pour on the parts face too. */}
      <Route from=".N13 > .pin1" to="net.GND" width={0.5} path={[".N13 > .pin1", GND_VIAS.nut]} />

      {/* The even arm's bus: from its via beside way 12's capacitor to a second via, and up the
          ring face inside the inner edge to the pour. */}
      <Route
        from=".C112 > .pin2"
        to="net.GND"
        width={0.3}
        maxLength={CAP_RUN}
        path={[
          ".C112 > .pin2",
          EVEN_BUS_VIA,
          ...down(EVEN_BUS_ON),
          [EVEN_BUS_ON[0], POUR_FROM.even + 2 * MARGIN],
          ...up(EVEN_BUS_UP),
          GND_VIAS.muxInboard,
        ]}
      />
      {/* Mux 2's inboard GND pads and its capacitor, joined past the pads' ends. */}
      <Route
        from=".U4 > .N_E"
        to="net.GND"
        path={[".U4 > .N_E", [MUX_INBOARD_X, 38.205], [MUX_INBOARD_X, GND_VIAS.muxInboard[1]], GND_VIAS.muxInboard]}
      />
      <Route
        from=".U4 > .Y12"
        to="net.GND"
        path={[".U4 > .Y12", [MUX_INBOARD_X, 35.605], [MUX_INBOARD_X, GND_VIAS.muxInboard[1]]]}
      />
      <Route
        from=".C40 > .pin2"
        to="net.GND"
        maxLength={CAP_RUN}
        path={[".C40 > .pin2", [45.71, 32.86], [MUX_INBOARD_X, 34.0], [MUX_INBOARD_X, 35.605]]}
      />
      {/* Its outboard ones, joined under the body. */}
      <Route from=".U4 > .GND" to="net.GND" path={[".U4 > .GND", GND_VIAS.muxOutboard]} />
      <Route from=".U4 > .Y1" to=".U4 > .GND" path={[".U4 > .Y1", [MUX_UNDER_X, 36.905], [MUX_UNDER_X, 39.505]]} />
      <Route from=".U4 > .Y0" to="net.GND" path={[".U4 > .Y0", [MUX_UNDER_X, 37.555]]} />
      {/* Q1 and TP6, each by a via below the lanes. */}
      <Route from=".Q1 > .pin2" to="net.GND" path={[".Q1 > .pin2", [1.75, 45.68], [1.45, 45.98], GND_VIAS.Q1]} />
      <Route from=".TP6 > .pin1" to="net.GND" width={0.3} path={[".TP6 > .pin1", GND_VIAS.TP6]} />
      {/* The odd arm's bus, from way 11's capacitor over the root's lanes to a via in the pour. */}
      <Route
        from=".C111 > .pin2"
        to="net.GND"
        maxLength={CAP_RUN}
        path={[".C111 > .pin2", [-48.315, 28.1], [-52.0, 28.1], [-52.6, 28.7], GND_VIAS.oddRoot]}
      />
      {/* The odd arm's temperature sensor and the module's capacitors, by one via above C6. */}
      <Route
        from=".Q2 > .pin2"
        to=".C6 > .pin2"
        maxLength={CAP_RUN}
        path={[".Q2 > .pin2", [-55.5, 24.63], [-55.8, 24.93], [-55.8, 29.055], ".C6 > .pin2"]}
      />
      <Route from=".C6 > .pin2" to="net.GND" width={0.3} maxLength={CAP_RUN} path={[".C6 > .pin2", GND_VIAS.C6]} />
      <Route from=".C8 > .pin2" to=".C6 > .pin2" maxLength={CAP_RUN} path={[".C8 > .pin2", ".C6 > .pin2"]} />
      <Route from=".C7 > .pin2" to=".C8 > .pin2" maxLength={CAP_RUN} path={[".C7 > .pin2", ".C8 > .pin2"]} />

      {/* ── The lines along the inner edge ───────────────────────────────────── */}
      <Route
        from=".U4 > .S2"
        to=".U2 > .S2"
        width={LANE_WIDTH}
        path={[
          ".U4 > .S2",
          ...down(AT_MUX2.S2.via),
          ...run("S2"),
          ...turn("S2"),
          [AT_MUX1.S2, S2_VIA[1] - CUT],
          [AT_MUX1.S2 - CUT, S2_VIA[1]],
          ...up(S2_VIA),
          ".U2 > .S2",
        ]}
      />
      <Route
        from=".U4 > .S3"
        to=".U2 > .S3"
        width={LANE_WIDTH}
        path={[
          ".U4 > .S3",
          [AT_MUX2.S3.via[0] + AT_MUX2.S3.via[1] - 39.505, 39.505],
          ...down(AT_MUX2.S3.via),
          ...run("S3"),
          ...turn("S3"),
          [AT_MUX1.S3, S3_VIA[1] - CUT],
          [AT_MUX1.S3 - CUT, S3_VIA[1]],
          ...up(S3_VIA),
          ".U2 > .S3",
        ]}
      />
      <Route
        from=".U4 > .S1"
        to=".U2 > .S1"
        width={LANE_WIDTH}
        path={[
          ".U4 > .S1",
          [S1_X - CUT, 38.855],
          [S1_X, 38.855 + CUT],
          [S1_X, S1_Y - CUT],
          [S1_X - CUT, S1_Y],
          ...down(AT_MUX2.S1.via),
          [AT_MUX2.S1.via[0] - (AT_MUX2.S1.y - S1_Y), AT_MUX2.S1.y],
          ...run("S1"),
          ...turn("S1"),
          ...up([AT_MUX1.S1, 49.955]),
          ".U2 > .S1",
        ]}
      />
      <Route
        from=".U4 > .S0"
        to=".U2 > .S0"
        width={LANE_WIDTH}
        path={[
          ".U4 > .S0",
          [S0_X - CUT, 38.205],
          [S0_X, 38.205 + CUT],
          [S0_X, S0_Y - CUT],
          [S0_X - CUT, S0_Y],
          [AT_MUX2.S0.via[0] + AT_MUX2.S0.via[1] - S0_Y, S0_Y],
          ...down(AT_MUX2.S0.via),
          ...run("S0"),
          ...turn("S0"),
          ...up([AT_MUX1.S0, 49.305]),
          ".U2 > .S0",
        ]}
      />
      {/* ADC2, from GPIO3's capacitor back to where the even root leaves it. */}
      <Route from=".U1 > .IO3" to=".C41 > .pin1" maxLength={CAP_RUN} path={[".U1 > .IO3", ".C41 > .pin1"]} />
      <Route
        from=".C41 > .pin1"
        to="net.ADC2"
        width={LANE_WIDTH}
        maxLength={CAP_RUN}
        path={[
          ".C41 > .pin1",
          ...down(ADC2_VIA),
          [ADC2_VIA[0], ADC2_Y + CUT],
          [ADC2_VIA[0] + CUT, ADC2_Y],
          [AT_MUX1.ADC2 - CUT, ADC2_Y],
          [AT_MUX1.ADC2, ADC2_Y - CUT],
          ...turn("ADC2").reverse(),
          ...run("ADC2").reverse(),
          [ADC2_X - CUT, AT_MUX2.ADC2.y],
          [ADC2_X, AT_MUX2.ADC2.y - CUT],
          [ADC2_X, ADC2_END[1] + CUT],
          [ADC2_X + CUT, ADC2_END[1]],
          ADC2_END,
        ]}
      />
      {/* The chin's temperature: Q1's base and collector joined at the via, and R10 beside them. */}
      <Route
        from=".Q1 > .pin1"
        to=".U2 > .Y1"
        width={LANE_WIDTH}
        path={[
          ".Q1 > .pin1",
          ...down(TEMP_VIA),
          [TEMP_VIA[0] - (TEMP_VIA[1] - lane("TEMP")[0][1]), lane("TEMP")[0][1]],
          ...lane("TEMP").slice(0, LAST + 1),
          ...turn("TEMP"),
          ...up([AT_MUX1.TEMP, 48.005]),
          ".U2 > .Y1",
        ]}
      />
      <Route from=".Q1 > .pin3" to=".Q1 > .pin1" width={LANE_WIDTH} path={[".Q1 > .pin3", TEMP_VIA, ".Q1 > .pin1"]} />
      <Route from=".R10 > .pin1" to=".Q1 > .pin3" width={LANE_WIDTH} path={[".R10 > .pin1", ".Q1 > .pin3"]} />

      {/* ── VSUP round the outer edge ────────────────────────────────────────── */}
      {/* From way 11's diode down the odd arm, under the module's antenna edge, along the chin
          outside the USB socket's stakes and up to the fuse. */}
      <Route
        from=".D111 > .cathode"
        to=".F1 > .pin1"
        width={0.4}
        path={[
          ".D111 > .cathode",
          [ODD_VSUP[0], 22.28],
          ...down(ODD_VSUP),
          [VSUP_TRUNK.x, ODD_VSUP[1] + ODD_VSUP[0] - VSUP_TRUNK.x],
          [VSUP_TRUNK.x, 54.6],
          [-55.6, VSUP_TRUNK.y],
          [FUSE_VIA[0] - CUT, VSUP_TRUNK.y],
          [FUSE_VIA[0], VSUP_TRUNK.y - CUT],
          ...up(FUSE_VIA),
          ".F1 > .pin1",
        ]}
      />
      <Route
        from=".D2 > .cathode"
        to="net.VSUP"
        width={0.3}
        path={[".D2 > .cathode", [D2_X - CUT, 51.73], [D2_X, 51.73 + CUT], ...down([D2_X, DIODE_VIA_Y]), [D2_X, VSUP_TRUNK.y]]}
      />
      <Route
        from=".D3 > .cathode"
        to="net.VSUP"
        width={0.3}
        path={[".D3 > .cathode", [D3_X - CUT, 51.73], [D3_X, 51.73 + CUT], ...down([D3_X, DIODE_VIA_Y]), [D3_X, VSUP_TRUNK.y]]}
      />
      {/* TP5, from D2 under TP4 and up between the two test pads. */}
      <Route
        from=".TP5 > .pin1"
        to=".D2 > .cathode"
        width={0.25}
        path={[
          ".TP5 > .pin1",
          [-4.5, 46.33],
          [-4.15, 46.68],
          [-4.15, TP_VSUP_Y - 0.45],
          [-3.7, TP_VSUP_Y],
          [4.05, TP_VSUP_Y],
          [4.3, TP_VSUP_Y + 0.25],
          [4.3, 51.0],
          ".D2 > .cathode",
        ]}
      />

      {/* ── 3V3 to the module and the odd arm ────────────────────────────────── */}
      {/* The trunk, inside VSUP, to a via at the module's 3V3 pad. */}
      <Route
        from=".C5 > .pin1"
        to="net.V3V3"
        width={0.5}
        maxLength={CAP_RUN}
        path={[
          ".C5 > .pin1",
          ...down(V3V3_DOWN),
          [V3V3_DOWN[0] - (V3V3_TRUNK.y - V3V3_DOWN[1]), V3V3_TRUNK.y],
          [STAKES.from, V3V3_TRUNK.y],
          [STAKES.from - (V3V3_TRUNK.y - STAKES.y), STAKES.y],
          [STAKES.to + (V3V3_TRUNK.y - STAKES.y), STAKES.y],
          [STAKES.to, V3V3_TRUNK.y],
          [-55.41, V3V3_TRUNK.y],
          [V3V3_TRUNK.x, 54.31],
          ...up(MODULE_V3V3),
        ]}
      />
      <Route from=".R3 > .pin2" to=".U1 > .pin1" width={0.4} path={[".R3 > .pin2", MODULE_V3V3, ".U1 > .pin1"]} />
      <Route from=".C7 > .pin1" to=".R3 > .pin2" width={0.3} maxLength={CAP_RUN} path={[".C7 > .pin1", ".R3 > .pin2"]} />
      {/* On up the ring face and across above the pour to R8, which the arm's lane starts from. */}
      <Route
        from=".R8 > .pin2"
        to="net.V3V3"
        width={0.3}
        path={[".R8 > .pin2", ...down(R8_VIA), [R8_VIA[0], ODD_V3V3_Y], [V3V3_TRUNK.x, ODD_V3V3_Y], MODULE_V3V3]}
      />
      {/* The strapping pull-ups, by a via between their pads so the parts face stays open above them. */}
      <Route from=".R5 > .pin2" to=".R6 > .pin2" width={0.25} path={[".R5 > .pin2", ".R6 > .pin2"]} />
      <Route
        from=".R5 > .pin2"
        to="net.V3V3"
        width={0.25}
        path={[
          ".R5 > .pin2",
          ...down(PULLUP_VIA),
          [PULLUP_VIA[0], ODD_V3V3_Y + PULLUP_VIA[0] - R8_VIA[0]],
          [R8_VIA[0], ODD_V3V3_Y],
        ]}
      />
      {/* The module's bulk capacitor: the EN column shuts it off from the 3V3 pad on the parts face. */}
      <Route
        from=".C6 > .pin1"
        to="net.V3V3"
        width={0.3}
        maxLength={CAP_RUN}
        path={[".C6 > .pin1", ...down(C6_VIA), [V3V3_TRUNK.x, C6_VIA[1]]]}
      />
      {/* 3V3 between the USB socket's stakes cuts the lower pair off from the pour: each is tied to
          the one above it on the parts face. */}
      <Route from=".J2 > .EH1" to=".J2 > .EH2" path={[".J2 > .EH1", ".J2 > .EH2"]} />
      <Route from=".J2 > .EH4" to=".J2 > .EH3" path={[".J2 > .EH4", ".J2 > .EH3"]} />
      {/* TP4 and R10, from the output capacitors' line. */}
      <Route
        from=".TP4 > .pin1"
        to="net.V3V3"
        path={[
          ".TP4 > .pin1",
          [-3.0, 46.85],
          [-1.6, TP_V3V3_Y],
          [10.25, TP_V3V3_Y],
          [10.25 + V3V3_Y - TP_V3V3_Y, V3V3_Y],
          [14.863, V3V3_Y],
        ]}
      />
      <Route from=".R10 > .pin2" to="net.V3V3" path={[".R10 > .pin2", [8.51, 47.2], [8.51 + TP_V3V3_Y - 47.2, TP_V3V3_Y]]} />
    </>
  )
}
