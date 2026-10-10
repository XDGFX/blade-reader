// Hand-drawn pours: each way's current path, and GND. Rules from issue #17 (thermal) and #19.
//
// Outlines are in local strip coordinates (lib/outline.tsx), shifted here to the board's,
// because <copperpour> ignores the enclosing group's offset. Each pour stops boardEdgeMargin
// (0.3 mm) inside its own outline, so an outline traced along a routed edge keeps the JLC
// clearance, and pours that meet leave 0.6 mm between them. Pours clear other nets' pads by
// themselves, but not the fingers' gaps: hence the traced fingers.
// A pour that touches no pad of its net is dropped.
//
// The parts face (tscircuit's top) faces the panel, so it carries the bare copper that seats
// on the way's screw pad. The ring face carries the rings, on the bare nut pads.

import {
  BOARD_HALF,
  CHAMFER,
  DEPTH,
  finger,
  keepoutEdgeX,
  NUT_Y,
  type Pt,
  wayX,
  Y_SHIFT,
} from "./outline"
import { bandX } from "./way"

const pour = {
  clearance: "0.3mm",
  boardEdgeMargin: "0.3mm",
  cutoutMargin: "0.3mm",
  coveredWithSolderMask: true,
} as const

const toBoard = (pts: Pt[]) => pts.map(({ x, y }) => ({ x, y: y + Y_SHIFT }))
const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
]
const circle = (cx: number, cy: number, r: number, steps = 32): Pt[] =>
  Array.from({ length: steps }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / steps),
    y: cy + r * Math.sin((2 * Math.PI * i) / steps),
  }))

/** Where the parts face's bare copper starts, measured into the panel (issue #8). */
const BARE_FROM = -3.0
/** The ring face's line copper stops short of the panel edge, for the bus along it. */
const BUS_TOP = 1.3
/**
 * The ring face's load copper starts above the channel along the panel edge, where the signal
 * lines run (lib/routes.tsx). No load current flows below the IP+ vias.
 */
export const LOAD_BOTTOM = 6.0
/** Ring face load copper round each nut, for the ring's tongue to lie on. */
const RING_R = 6.5
/** The way 1 ear's GND, 0.5 mm clear of way 1's ring face copper. */
const EAR_1 = 40.0
/** Where way 1's ring face copper stops for the 3V3 line at the edge of the bundle. */
const BUNDLE_EDGE = 39.2
/** GND vias under the module, joining the way 1 ear's two faces. */
const EAR_VIAS: Pt[] = [
  { x: 43.6, y: 3.6 },
  { x: 44.5, y: 3.6 },
  { x: 45.4, y: 3.6 },
  { x: 47.4, y: 11.95 },
  { x: 48.6, y: 11.95 },
]
/** The parts face's GND in the band behind the nuts starts above the VSUP trunk. */
const BAND_BOTTOM = 19.3

const Via = ({ net, x, y }: { net: string; x: number; y: number }) => (
  <via
    fromLayer="top"
    toLayer="bottom"
    holeDiameter="0.3mm"
    outerDiameter="0.6mm"
    connectsTo={net}
    pcbX={x}
    pcbY={y}
  />
)

/** Moves a point of way `n`'s ring face copper out of its neighbours' swung ring keepouts. */
const clipToNeighbours = (n: number, { x, y }: Pt): Pt => {
  let cx = x
  if (n > 1) cx = Math.min(cx, keepoutEdgeX(wayX(n - 1), -1, y))
  if (n < 6) cx = Math.max(cx, keepoutEdgeX(wayX(n + 1), 1, y))
  return { x: cx, y }
}

/** Way 6's ring face copper is cut back up to here, beside the ground nut. */
const WAY_6_CUT_TOP = 14.8
/**
 * The cut: the channel's lanes turn outboard there (lib/routes.tsx). It stays outside the
 * ring's straight-out keepout.
 */
const WAY_6_CORNER: Pt[] = [
  { x: wayX(6) - RING_R, y: WAY_6_CUT_TOP },
  { x: -38.8, y: WAY_6_CUT_TOP },
  { x: -38.8, y: 10.5 },
  { x: -38.0, y: 10.5 },
  { x: -38.0, y: LOAD_BOTTOM },
]

/**
 * Way `n`'s line and load copper, centred on `cx`. The line covers the finger on both faces and
 * runs on to IP− on the parts face only. The load runs IP+ → nut on both faces: about 5 mm wide
 * on the parts face, between the diode cathode and the sensor's caps, and full width on the ring
 * face, with a disc round the nut for the ring's tongue.
 */
export const WayCopper = ({ n, cx, dividerVia }: { n: number; cx: number; dividerVia?: Pt }) => {
  // Pad edges from b, the column's shifted centre: diode x −5.35 to −3.35 (anode y 1.6–3.6,
  // cathode 6–8), IP pins −2.5 to −0.7, signal pins 2.7 to 4.5, caps 2.28 to 4.92 (y 6.92–8.48).
  const b = bandX(n, cx)
  const line = `net.S${n}_LINE`
  const load = `net.S${n}_LOAD`
  const tip = finger(cx).filter((p) => p.y < BARE_FROM + 0.3)
  const nutVias = [-135, -112, -90, -68, -45].map((a) => ({
    x: cx + 5.1 * Math.cos((a * Math.PI) / 180),
    y: NUT_Y + 5.1 * Math.sin((a * Math.PI) / 180),
  }))
  return (
    <>
      {/* Parts face, bare from 3.0 mm into the panel to the tip. */}
      <copperpour
        {...pour}
        coveredWithSolderMask={false}
        name={`P${n}_BARE`}
        layer="top"
        connectsTo={line}
        outline={toBoard([
          ...tip,
          { x: cx - 4.75, y: BARE_FROM + 0.3 },
          { x: cx + 4.75, y: BARE_FROM + 0.3 },
        ])}
      />
      {/* Parts face line: the whole finger, under the bare pour, then up to IP−. */}
      <copperpour
        {...pour}
        name={`P${n}_LINE_TOP`}
        layer="top"
        connectsTo={line}
        outline={toBoard([
          ...finger(cx),
          { x: b - 5.65, y: 0 },
          { x: b - 5.65, y: 4.25 },
          { x: b + 2.5, y: 4.25 },
          { x: b + 2.5, y: 0 },
        ])}
      />
      <copperpour
        {...pour}
        name={`P${n}_LINE_BOTTOM`}
        layer="bottom"
        connectsTo={line}
        outline={toBoard(finger(cx))}
      />
      <copperpour
        {...pour}
        name={`P${n}_LOAD_TOP`}
        layer="top"
        connectsTo={load}
        outline={toBoard([
          { x: b - 3.35, y: 4.0 },
          { x: b + 2.28, y: 4.0 },
          { x: b + 2.28, y: 8.65 },
          { x: cx + 4.3, y: 8.65 },
          { x: cx + 4.3, y: 12 },
          { x: cx - 4.3, y: 12 },
          { x: cx - 4.3, y: 8.65 },
          { x: b - 3.35, y: 8.65 },
        ])}
      />
      <copperpour
        {...pour}
        name={`P${n}_LOAD_BOTTOM`}
        layer="bottom"
        connectsTo={load}
        outline={toBoard(
          [
            ...circle(cx, NUT_Y, RING_R).filter((p) => p.y > NUT_Y && (n < 6 || p.x > cx || p.y > WAY_6_CUT_TOP)),
            ...(n === 6 ? WAY_6_CORNER : [{ x: cx - RING_R, y: NUT_Y }, { x: cx - RING_R, y: LOAD_BOTTOM }]),
            // Way 1's corner gives way to the bundle from the channel to mux 1.
            ...(n === 1
              ? [
                  { x: BUNDLE_EDGE, y: LOAD_BOTTOM },
                  { x: BUNDLE_EDGE, y: 11.6 },
                  { x: cx + RING_R, y: 11.6 },
                ]
              : [{ x: cx + RING_R, y: LOAD_BOTTOM }]),
            { x: cx + RING_R, y: NUT_Y },
          ].map((p) => clipToNeighbours(n, p)),
        )}
      />

      {/* Stitching: 10 at the clamp, above the washer; 8 above IP+; 5 below the nut. */}
      {[-1.0, -2.3].flatMap((y) =>
        [-3.6, -1.8, 0, 1.8, 3.6].map((dx) => <Via key={`c${y}${dx}`} net={line} x={cx + dx} y={y} />),
      )}
      {[6.9, 7.9].flatMap((y) =>
        [-2.4, -1.2, 0, 1.2].map((dx) => <Via key={`p${y}${dx}`} net={load} x={b + dx} y={y} />),
      )}
      {nutVias.map(({ x, y }) => (
        <Via key={`n${x}`} net={load} x={x} y={y} />
      ))}
      {/* The voltage divider's GND, down to the bus. */}
      {dividerVia && <Via net="net.GND" x={dividerVia.x} y={dividerVia.y} />}
    </>
  )
}

/**
 * GND: on the ring face, a bus along the panel edge and both ears, cut back to the ring
 * keepouts, so the band behind the nuts has none; on the parts face, the way 1 ear.
 */
export const GroundCopper = () => {
  const B = BOARD_HALF
  const ear6 = -(EAR_1 + 0.3) // way 6's ring copper is the mirror of way 1's
  // Where the end ways' swung ring keepouts cross into the ears.
  const k1 = (y: number) => keepoutEdgeX(wayX(1), 1, y)
  const k6 = (y: number) => keepoutEdgeX(wayX(6), -1, y)
  const yAt = (edge: (y: number) => number, x: number) => {
    const y0 = 10
    return y0 + (x - edge(y0)) / (edge(y0 + 1) - edge(y0))
  }
  // The way 6 keepout's edge meets the chamfer, which runs at 45° from (−B, DEPTH − CHAMFER).
  const yChamfer = yAt((y) => k6(y) - (y - (DEPTH - CHAMFER)), -B)
  return (
    <>
      {/* Ring face: the bus along the panel edge and both ears, out of every ring keepout. */}
      <copperpour
        {...pour}
        name="GND_BOTTOM"
        layer="bottom"
        connectsTo="net.GND"
        outline={toBoard([
          { x: -B, y: 0 },
          { x: B, y: 0 },
          { x: B, y: DEPTH },
          { x: k1(DEPTH), y: DEPTH },
          { x: EAR_1, y: yAt(k1, EAR_1) },
          { x: EAR_1, y: BUS_TOP },
          { x: ear6, y: BUS_TOP },
          { x: ear6, y: yAt(k6, ear6) },
          { x: k6(yChamfer), y: yChamfer },
          { x: -B, y: DEPTH - CHAMFER },
        ])}
      />
      <copperpour
        {...pour}
        name="GND_TOP_EAR"
        layer="top"
        connectsTo="net.GND"
        outline={toBoard(rect(EAR_1, 0, B, DEPTH))}
      />
      {/* The ear's two faces, joined under the module: beside its panel-edge pads, where the
          ring face is still the bus, and above its ground pad, inside the lines round it. */}
      {EAR_VIAS.map(({ x, y }) => (
        <Via key={`e${x}${y}`} net="net.GND" x={x} y={y} />
      ))}
      {/* Parts face: the band behind the nuts, above the VSUP trunk, and the way 6 ear above
          mux 2's outboard pads. L1 and the test pads cut it into pieces, which the GND spine
          (lib/routes.tsx) joins as far as TP6; the piece over way 1 laps the way 1 ear's pour. */}
      <copperpour
        {...pour}
        name="GND_TOP_BAND"
        layer="top"
        connectsTo="net.GND"
        outline={toBoard([
          { x: EAR_1 + 1, y: BAND_BOTTOM },
          { x: EAR_1 + 1, y: DEPTH },
          { x: -B + CHAMFER, y: DEPTH },
          { x: -B, y: DEPTH - CHAMFER },
          { x: -B, y: 15.3 },
          { x: -42.5, y: 15.3 },
          { x: -42.5, y: 18.3 },
          { x: -40.2, y: 18.3 },
          { x: -40.2, y: BAND_BOTTOM },
        ])}
      />
    </>
  )
}

