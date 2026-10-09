// Hand-drawn pours: each way's current path, and GND. Rules from issue #17 (thermal) and #19.
//
// Outlines are in local strip coordinates (lib/outline.tsx), shifted here to the board's,
// because <copperpour> ignores the enclosing group's offset. Each pour stops boardEdgeMargin
// (0.3 mm) inside its own outline, so an outline traced along a routed edge keeps the JLC
// clearance, and pours that meet leave 0.6 mm between them. Pours clear other nets' pads by
// themselves, and the slots by cutoutMargin, but not the fingers' gaps: hence the traced fingers.
// A pour that touches no pad of its net is dropped.
//
// The parts face (tscircuit's top) faces the panel, so it carries the bare copper that seats
// on the way's screw pad. The ring face carries the rings, on the bare nut pads.

import {
  BOARD_HALF,
  DEPTH,
  END,
  finger,
  NUT_Y,
  type Pt,
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
/** The ring face's load copper starts above the bus, leaving room for 3V3 and TEMP. */
const LOAD_BOTTOM = 2.3
/** Ring face load copper round each nut, for the ring's tongue to lie on. */
const RING_R = 6.5
/** The GND band behind the nuts. */
const BAND_BOTTOM = NUT_Y + RING_R
/** The way 1 ear's GND, 0.5 mm clear of way 1's ring face copper. */
const EAR_1 = 40.0

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

/**
 * Way `n`'s line and load copper, centred on `cx`. The line covers the finger on both faces and
 * runs on to IP− on the parts face only. The load runs IP+ → nut on both faces: about 5 mm wide
 * on the parts face, between the diode cathode and the sensor's caps, and full width on the ring
 * face, with a disc round the nut for the ring's tongue.
 */
export const WayCopper = ({ n, cx }: { n: number; cx: number }) => {
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
        outline={toBoard([
          ...circle(cx, NUT_Y, RING_R).filter((p) => p.y > NUT_Y),
          { x: cx - RING_R, y: NUT_Y },
          { x: cx - RING_R, y: LOAD_BOTTOM },
          { x: cx + RING_R, y: LOAD_BOTTOM },
          { x: cx + RING_R, y: NUT_Y },
        ])}
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
    </>
  )
}

/**
 * GND: on the ring face, a bus along the panel edge, both ears and the band behind the nuts,
 * as one ring with a slit through the band; on the parts face, the way 1 ear and a patch under
 * the temperature transistor.
 */
export const GroundCopper = ({ q1 }: { q1: Pt }) => {
  const B = BOARD_HALF
  const ear6 = -(EAR_1 + 0.3) // way 6's ring copper is the mirror of way 1's
  return (
    <>
      <copperpour
        {...pour}
        name="GND_BOTTOM"
        layer="bottom"
        connectsTo="net.GND"
        outline={toBoard([
          { x: 0, y: DEPTH },
          { x: -B + END, y: DEPTH },
          { x: -B, y: DEPTH - END },
          { x: -B, y: 0 },
          { x: B, y: 0 },
          { x: B, y: DEPTH },
          { x: 0, y: DEPTH },
          { x: 0, y: BAND_BOTTOM },
          { x: EAR_1, y: BAND_BOTTOM },
          { x: EAR_1, y: BUS_TOP },
          { x: ear6, y: BUS_TOP },
          { x: ear6, y: BAND_BOTTOM },
          { x: 0, y: BAND_BOTTOM },
        ])}
      />
      <copperpour
        {...pour}
        name="GND_TOP_EAR"
        layer="top"
        connectsTo="net.GND"
        outline={toBoard(rect(EAR_1, 0, B, DEPTH))}
      />
      <copperpour
        {...pour}
        name="GND_TOP_Q1"
        layer="top"
        connectsTo="net.GND"
        outline={toBoard(rect(q1.x - 1.8, 0, q1.x + 1.2, 6.5))}
      />
      {[-0.8, 0.4].map((dx) => (
        <Via key={dx} net="net.GND" x={q1.x + dx} y={0.65} />
      ))}
    </>
  )
}
