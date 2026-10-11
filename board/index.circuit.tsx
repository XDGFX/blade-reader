// The yoke: one board for all 12 ways of a 12-way ST Blade. So far outline and holes only: no
// schematic, placement or routing.
//
// Panel coordinates, in mm, as the research notes give them: `a` runs along the fuse panel from
// its positive end, so the chin is at negative a, and `c` runs across from the centreline.
// PCB coordinates are seen from the parts face (tscircuit's top) with the chin at the top:
// X = c mirrored, which the symmetric outline hides, and Y = A_MID − a.

import { finger, CLAMP_Y, END, WAY_PITCH_PCB, type Pt } from "./lib/outline"

const PANEL_HALF = 84.2 / 2
/** Arm depth from the panel edge, and the output nut row's distance out from it (#48, revised). */
export const ARM_DEPTH = 16.7
const NUT_OUT = 10.7
export const HALF_WIDTH = PANEL_HALF + ARM_DEPTH

/** Ways 11–12 to ways 1–2, along. */
export const WAYS_A = [0, 1, 2, 3, 4, 5].map((k) => 27.83 + k * WAY_PITCH_PCB)
/** The arms' open end: where the last way's column ends. No ear, so every multiplexer is on the chin. */
export const A_OPEN = WAYS_A[5] + WAY_PITCH_PCB / 2
/** Where the ear past ways 11–12 ends and the arm steps 1 mm clear of the panel's side. */
const A_EAR = WAYS_A[0] - END
const DECK_CLEARANCE = 1

// The chin wraps the panel's positive end. It lies in the feed lug's own height band, so the lug
// and cable have to pass over the ring face.
// The panel's positive end in plan, as fuse_block_12 has it over its whole height: one half,
// across then along. Flat for 4.5 either side of the centreline, bowed back 3.8 by 39 across,
// then turned into the side within about 4.
export const PANEL_END: Pt[] = [
  [0, 0.05], [4.5, 0.05], [13, 0.41], [20, 1.0], [25, 1.56], [30, 2.21], [35, 3.04], [38, 3.56],
  [39, 3.77], [39.5, 3.91], [40, 4.18], [40.5, 4.48], [41, 4.9], [41.5, 5.48], [42, 6.43], [PANEL_HALF, 8],
].map(([x, y]) => ({ x, y }))
/** The chin's inner edge: the panel's end, DECK_CLEARANCE off it all the way round. */
const INNER: Pt[] = PANEL_END.map((p, i) => {
  // Each point moves out along the mean of its two edges' normals; the ends' are the centreline's and the side's.
  const normal = (a: Pt, b: Pt) => {
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    return { x: (b.y - a.y) / len, y: -(b.x - a.x) / len }
  }
  const n0 = i === 0 ? { x: 0, y: -1 } : normal(PANEL_END[i - 1], p)
  const n1 = i === PANEL_END.length - 1 ? { x: 1, y: 0 } : normal(p, PANEL_END[i + 1])
  const k = DECK_CLEARANCE / (1 + n0.x * n1.x + n0.y * n1.y)
  return { x: p.x + (n0.x + n1.x) * k, y: p.y + (n0.y + n1.y) * k }
})
/** The chin's inner edge on the centreline. */
const A_CHIN_FLOOR = INNER[0].y
export const CHIN_DEPTH = 20
export const A_OUTER = A_CHIN_FLOOR - CHIN_DEPTH
/** Each outer corner of the chin is cut back this far across and along. */
export const CHAMFER = { across: 35, along: 12 }
/** The cut across each arm's outer corner at the open end. */
const END_CHAMFER = 4

// The +c half of the outline, from the chin's inner edge on the centreline to its outer edge.
const half = (): Pt[] => {
  // Rev A's finger, walked the other way: its X is a, its Y is outboard of the panel edge.
  const fingers = WAYS_A.flatMap((a) => finger(a).reverse().map((p) => ({ x: PANEL_HALF + p.y, y: p.x })))
  return [
    ...INNER,
    { x: PANEL_HALF + DECK_CLEARANCE, y: A_EAR },
    { x: PANEL_HALF, y: A_EAR + DECK_CLEARANCE },
    ...fingers,
    { x: PANEL_HALF, y: A_OPEN },
    { x: HALF_WIDTH - END_CHAMFER, y: A_OPEN },
    { x: HALF_WIDTH, y: A_OPEN - END_CHAMFER },
    { x: HALF_WIDTH, y: A_OUTER + CHAMFER.along },
    { x: HALF_WIDTH - CHAMFER.across, y: A_OUTER },
  ]
}

const A_MID = (A_OUTER + A_OPEN) / 2
/** Panel coordinates to PCB coordinates. */
export const pcb = (c: number, a: number): Pt => ({ x: -c, y: A_MID - a })

const right = half()
export const OUTLINE = [...right, ...right.slice(1).reverse().map((p) => ({ x: -p.x, y: p.y }))].map((p) =>
  pcb(p.x, p.y),
)

const sides = [1, -1] as const
/** Way screw holes, 8.52 into the panel. */
export const CLAMPS = sides.flatMap((s) => WAYS_A.map((a) => pcb(s * (PANEL_HALF + CLAMP_Y), a)))
/** Output nuts. */
export const NUTS = sides.flatMap((s) => WAYS_A.map((a) => pcb(s * (PANEL_HALF + NUT_OUT), a)))

/** A point on the chamfer at side `s`: `along` from its middle towards the side edge, `out` past it. */
const onChamfer = (s: 1 | -1, along: number, out: number): Pt => {
  const len = Math.hypot(CHAMFER.across, CHAMFER.along)
  const [uc, ua] = [CHAMFER.across / len, CHAMFER.along / len]
  return pcb(
    s * (HALF_WIDTH - CHAMFER.across / 2 + uc * along + ua * out),
    A_OUTER + CHAMFER.along / 2 + ua * along - uc * out,
  )
}
const box = (s: 1 | -1, mid: number, half: number, inboard: number, out: number): Pt[] =>
  [[-half, -inboard], [half, -inboard], [half, out], [-half, out], [-half, -inboard]].map(([u, n]) =>
    onChamfer(s, mid + u, n),
  )

// ESP32-C3-MINI-1 square to the chamfer at −X, its 11.2 mm pad area on the board and its antenna
// 5.4 past the chamfer (#47). It sits 4 mm towards the side edge from the chamfer's middle, which
// keeps the antenna inside the bounding rectangle.
const MODULE_WIDTH = 13.2
const ANTENNA = 5.4
const KEEPOUT = 15
const MODULE_AT = 4
export const MODULE = box(1, MODULE_AT, MODULE_WIDTH / 2, 11.2, ANTENNA)
/** No nut, inductor, test pad or tall part within 15 mm of the antenna. */
export const ANTENNA_KEEPOUT = box(1, MODULE_AT, MODULE_WIDTH / 2 + KEEPOUT, KEEPOUT, ANTENNA)

/** The one ground nut, 7 mm in from the middle of the other chamfer. */
export const GROUND_NUT = onChamfer(-1, 0, -7)
/** JLC tooling holes, Ø1.152: one on the chin near the ground nut, one at the far arm's open end, clear of every ring keepout. */
export const TOOLING = [pcb(-18, A_OUTER + 2.5), pcb(PANEL_HALF + 3, A_OPEN - 2.5)]

const Drill = ({ name, at, diameter }: { name: string; at: Pt; diameter: number }) => (
  <hole name={name} pcbX={at.x} pcbY={at.y} diameter={diameter} />
)

export default () => (
  <board outline={OUTLINE} thickness="1.6mm" routingDisabled>
    {CLAMPS.map((at, i) => (
      <Drill key={`clamp${i}`} name={`CLAMP${i + 1}`} at={at} diameter={5.4} />
    ))}
    {[...NUTS, GROUND_NUT].map((at, i) => (
      <Drill key={`nut${i}`} name={`NUT${i + 1}`} at={at} diameter={6.4} />
    ))}
    {TOOLING.map((at, i) => (
      <Drill key={`tool${i}`} name={`TOOL${i + 1}`} at={at} diameter={1.152} />
    ))}
    <pcbnotepath route={MODULE} />
    <pcbnotepath route={ANTENNA_KEEPOUT} />
  </board>
)
