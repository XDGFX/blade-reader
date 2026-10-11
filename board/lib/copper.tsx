// Hand-drawn pours: each way's current path, finger → sensor → output nut. Rules from issues
// #17 and #74 (thermal) and #19.
//
// Shapes are the copper's own edges, in the column's coordinates (lib/way.tsx): `u` along the
// arm from the way's centre towards the chin, `v` outboard from the panel edge. Both arms take
// the same shapes, the even arm's mirrored: on either arm the sensor's two IP pins nearest the
// panel are the line's and the two outboard are the load's.
//
// <copperpour> stops boardEdgeMargin inside its outline and doesn't follow the board's edge, so
// each shape is grown by that margin and keeps its own distance from the edge. Pours clear other
// nets' pads by themselves. A pour that touches no pad of its net is dropped.
//
// The parts face (tscircuit's top) faces the panel, so it carries the bare copper that seats on
// the way's screw pad. The ring face carries the rings, on the bare nut lands.

import { Fragment } from "react"
import { CLAMP_Y, WAY_PITCH_PCB, type Pt } from "./outline"

const MARGIN = 0.3
const pour = {
  clearance: `${MARGIN}mm`,
  boardEdgeMargin: `${MARGIN}mm`,
  cutoutMargin: `${MARGIN}mm`,
  coveredWithSolderMask: true,
} as const

/** A closed shape moved out by `d` on every side. Counter-clockwise in (u, v). */
const grow = (pts: Pt[], d: number): Pt[] =>
  pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length]
    const b = pts[(i + 1) % pts.length]
    const normal = (from: Pt, to: Pt) => {
      const len = Math.hypot(to.x - from.x, to.y - from.y)
      return { x: (to.y - from.y) / len, y: -(to.x - from.x) / len }
    }
    const n0 = normal(a, p)
    const n1 = normal(p, b)
    const k = d / (1 + n0.x * n1.x + n0.y * n1.y)
    return { x: p.x + (n0.x + n1.x) * k, y: p.y + (n0.y + n1.y) * k }
  })

const uv = (pts: number[][]): Pt[] => pts.map(([x, y]) => ({ x, y }))
const rect = (u0: number, v0: number, u1: number, v1: number) => uv([[u0, v0], [u1, v0], [u1, v1], [u0, v1]])

// The finger's copper: the finger less 0.3 a side.
const FINGER_HALF = 4.45
const TIP = -12.7
/** Where the parts face's bare copper starts, measured into the panel (issue #8). */
const BARE_FROM = -3.0
/** The ring face's line copper stops short of the panel edge, for what runs along it. */
const RING_LINE_TOP = -0.3
// Under the finger's root the parts face keeps only a neck, between the last way's caps and
// this way's divider, which keep their lines' room out to the finger's edges.
const ROOT_FROM = -2.9
const NECK = [-1.4, 2.4]
// Between the line's IP pins and the load's.
const LINE_TOP = 3.65
const LOAD_FROM = 3.95
/** The IP pins' outer ends. The sensor's body is beyond, then its signal pins. */
const IP_END = 4.98
// The diode's anode is outboard of the load's pins, so the line reaches it by a strip under the
// sensor's body, beside the IP pins. It starts 1.3 out: the way's voltage line leaves the
// divider along the panel edge below it.
const STRIP = { from: 1.3, u: [5.3, 6.1], to: 9.1 }
const NUT_V = 10.7
/**
 * The ring face's load copper starts above the lanes, 1.45–5.4 out, where the signal lines run.
 * No load current flows on that face below the load's vias.
 */
const RING_LOAD_FROM = 5.8
const RING_HALF = 6.2
// The neighbours' ring keepouts, swung 20°, cut the outboard corners.
const RING_CORNER = { u: 5.55, v: 14.6 }
export const ARM_EDGE = 16.7
/** The cut across the arm's outer corner at its open end, as the outline has it. */
const OPEN_END = { u: -WAY_PITCH_PCB / 2, chamfer: 4 }

const LINE_PARTS = uv([
  [-FINGER_HALF, TIP],
  [FINGER_HALF, TIP],
  [FINGER_HALF, ROOT_FROM],
  [NECK[1], ROOT_FROM],
  [NECK[1], 0.9],
  [IP_END, 0.9],
  [IP_END, STRIP.from],
  [STRIP.u[1], STRIP.from],
  [STRIP.u[1], STRIP.to],
  [STRIP.u[0], STRIP.to],
  [STRIP.u[0], LINE_TOP],
  [NECK[0], LINE_TOP],
  [NECK[0], ROOT_FROM],
  [-FINGER_HALF, ROOT_FROM],
])
// From the load's IP pins straight on to the nut's land, and no wider: the next sensor's signal
// lines pass on the far side, and VSUP's trunk behind the nut.
const LOAD_PARTS = rect(NECK[0], LOAD_FROM, IP_END, NUT_V)
/** The ring face under the ring and its tongue. `open` is the way at the arm's open end. */
const loadRing = (open: boolean) => {
  const edge = ARM_EDGE - MARGIN
  // The chamfer runs at 45° from the open end, `chamfer` short of the outboard edge.
  const cut = ARM_EDGE - OPEN_END.chamfer - OPEN_END.u - MARGIN * Math.SQRT2
  return uv([
    [-RING_HALF, RING_LOAD_FROM],
    [RING_HALF, RING_LOAD_FROM],
    [RING_HALF, RING_CORNER.v],
    [RING_CORNER.u, edge],
    ...(open
      ? [[edge - cut, edge], [-RING_HALF, cut - RING_HALF]]
      : [[-RING_CORNER.u, edge], [-RING_HALF, RING_CORNER.v]]),
  ])
}

// Stitching, 0.3 mm tented vias. The line's are in the neck, where the ring face's share comes
// across before that face stops; the load's stand between its pins and the nut, 0.4 outside the
// land. The clamp hole and the nut's barrel join the faces too.
const LINE_VIAS = [-2.4, -1.5, -0.6].flatMap((v) => [-1.0, 0, 1.0, 2.0].map((u) => ({ x: u, y: v })))
const LOAD_VIAS = [-62, -50, -38, -26].map((deg) => ({
  x: 5.1 * Math.cos((deg * Math.PI) / 180),
  y: NUT_V + 5.1 * Math.sin((deg * Math.PI) / 180),
}))

/**
 * Way `n`'s line and load copper. The line covers the finger on both faces and runs on to its IP
 * pins and the diode's anode on the parts face only. The load runs from its IP pins to the nut
 * on the parts face, and covers the ring face under the ring and its tongue.
 */
export const WayCopper = ({ n, finger, nut, open }: { n: number; finger: Pt; nut: Pt; open: boolean }) => {
  const out = Math.sign(nut.x - finger.x)
  const at = ({ x: u, y: v }: Pt) => ({ x: finger.x + out * (v - CLAMP_Y), y: finger.y + u })
  const outline = (shape: Pt[]) => grow(shape, MARGIN).map(at)
  const line = `net.S${n}_LINE`
  const load = `net.S${n}_LOAD`
  const vias = (net: string, places: Pt[]) =>
    places.map(at).map(({ x, y }) => (
      <Fragment key={`${x},${y}`}>
        <via
          fromLayer="top"
          toLayer="bottom"
          holeDiameter="0.3mm"
          outerDiameter="0.6mm"
          connectsTo={net}
          pcbX={x}
          pcbY={y}
        />
      </Fragment>
    ))
  return (
    <>
      {/* Parts face, bare from 3.0 mm into the panel to the tip. */}
      <copperpour
        {...pour}
        coveredWithSolderMask={false}
        name={`P${n}_BARE`}
        layer="top"
        connectsTo={line}
        outline={outline(rect(-FINGER_HALF, TIP, FINGER_HALF, BARE_FROM))}
      />
      <copperpour {...pour} name={`P${n}_LINE_TOP`} layer="top" connectsTo={line} outline={outline(LINE_PARTS)} />
      <copperpour
        {...pour}
        name={`P${n}_LINE_BOTTOM`}
        layer="bottom"
        connectsTo={line}
        outline={outline(rect(-FINGER_HALF, TIP, FINGER_HALF, RING_LINE_TOP))}
      />
      <copperpour {...pour} name={`P${n}_LOAD_TOP`} layer="top" connectsTo={load} outline={outline(LOAD_PARTS)} />
      <copperpour
        {...pour}
        name={`P${n}_LOAD_BOTTOM`}
        layer="bottom"
        connectsTo={load}
        outline={outline(loadRing(open))}
      />
      {vias(line, LINE_VIAS)}
      {vias(load, LOAD_VIAS)}
    </>
  )
}
