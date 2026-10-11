// The chin's own routes and its GND pour: the supply along the even half of the outer edge,
// VSUP and 3V3 to the even arm, and mux 2's grounds. The lines that cross the chin and the
// module's pins are not routed yet.
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
}

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
        path={[".C112 > .pin2", EVEN_BUS_VIA, ...down(EVEN_BUS_ON), [EVEN_BUS_ON[0], POUR_FROM.even + 2 * MARGIN]]}
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
    </>
  )
}
