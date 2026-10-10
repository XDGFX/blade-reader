// The yoke's outline: one board for all 12 ways of a 12-way ST Blade. An exploration for
// issue #40, outline and holes only: no schematic, placement or routing.
//
// Panel coordinates, in mm, as the research notes give them: `a` runs along the fuse panel from
// its positive end, so the chin is at negative a, and `c` runs across from the centreline.
// PCB coordinates are seen from the parts face (tscircuit's top) with the chin at the top:
// X = c mirrored, which the symmetric outline hides, and Y = A_MID − a.

import { finger, NUT_Y, CLAMP_Y, END, WAY_PITCH_PCB, type Pt } from "./lib/outline"

const PANEL_HALF = 84.2 / 2
/** Arm depth from the panel edge (#48). */
export const ARM_DEPTH = 20
export const HALF_WIDTH = PANEL_HALF + ARM_DEPTH

/** Ways 11–12 to ways 1–2, along. */
export const WAYS_A = [0, 1, 2, 3, 4, 5].map((k) => 27.83 + k * WAY_PITCH_PCB)
/** The arms' open end: rev A's ear past the last way, which holds a multiplexer. */
export const A_OPEN = WAYS_A[5] + END
/** Where the ear past ways 11–12 ends and the arm steps 1 mm clear of the panel's side. */
const A_EAR = WAYS_A[0] - END
const DECK_CLEARANCE = 1

// The chin wraps the panel's positive end, straight across. It lies in the feed lug's own height
// band, so the lug and cable have to pass over the ring face.
/** The chin's inner edge, this far past the panel's end: the allowance for a clone's longer end. */
const A_CHIN_FLOOR = -2
export const CHIN_DEPTH = 10
export const A_OUTER = A_CHIN_FLOOR - CHIN_DEPTH

const INSIDE_RADIUS = 1

// The +c half of the outline, from the chin's inner edge on the centreline to its outer corner.
const half = (): Pt[] => {
  const cArm = PANEL_HALF + DECK_CLEARANCE
  const corner = Array.from({ length: 5 }, (_, i) => {
    const t = (Math.PI / 2) * (i / 4)
    return {
      x: cArm - INSIDE_RADIUS + INSIDE_RADIUS * Math.sin(t),
      y: A_CHIN_FLOOR + INSIDE_RADIUS - INSIDE_RADIUS * Math.cos(t),
    }
  })
  // Rev A's finger, walked the other way: its X is a, its Y is outboard of the panel edge.
  const fingers = WAYS_A.flatMap((a) => finger(a).reverse().map((p) => ({ x: PANEL_HALF + p.y, y: p.x })))
  return [
    { x: 0, y: A_CHIN_FLOOR },
    ...corner,
    { x: cArm, y: A_EAR },
    { x: PANEL_HALF, y: A_EAR + DECK_CLEARANCE },
    ...fingers,
    { x: PANEL_HALF, y: A_OPEN },
    { x: HALF_WIDTH, y: A_OPEN },
    { x: HALF_WIDTH, y: A_OUTER },
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
/** Output nuts, 14.0 out from the panel edge. */
export const NUTS = sides.flatMap((s) => WAYS_A.map((a) => pcb(s * (PANEL_HALF + NUT_Y), a)))

// ESP32-C3-MINI-1 in the chin's outer corner at −X, 1 mm in from the side edge, its 11.2 mm pad
// area on the board and its antenna 5.4 past the outer edge (#47). The antenna's feed is at the
// footprint's −X end as read from the datasheet drawing, which puts it at this corner.
const MODULE_WIDTH = 13.2
const ANTENNA = 5.4
const KEEPOUT = 15
const moduleInner = HALF_WIDTH - 1 - MODULE_WIDTH
export const MODULE = { center: pcb(HALF_WIDTH - 1 - MODULE_WIDTH / 2, A_OUTER + 5.6 - ANTENNA / 2), width: MODULE_WIDTH, height: 16.6 }
/** No nut, inductor, test pad or tall part, and no outward step in the edge, within 15 mm of the antenna. */
export const ANTENNA_KEEPOUT = {
  center: pcb((HALF_WIDTH + moduleInner - KEEPOUT) / 2, A_OUTER + (KEEPOUT - ANTENNA) / 2),
  width: HALF_WIDTH - moduleInner + KEEPOUT,
  height: KEEPOUT + ANTENNA,
}

/** The one ground nut, in the chin's other outer corner. */
export const GROUND_NUT = pcb(-(HALF_WIDTH - 7), A_OUTER + 7)
/** JLC tooling holes, Ø1.152: one beside the ground nut, one in the far arm's ear, clear of every ring keepout. */
export const TOOLING = [pcb(-(PANEL_HALF + 4), A_OUTER + 2.5), pcb(PANEL_HALF + 3, A_OPEN - 2.5)]

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
    <silkscreenrect pcbX={MODULE.center.x} pcbY={MODULE.center.y} width={MODULE.width} height={MODULE.height} />
    <silkscreenrect
      pcbX={ANTENNA_KEEPOUT.center.x}
      pcbY={ANTENNA_KEEPOUT.center.y}
      width={ANTENNA_KEEPOUT.width}
      height={ANTENNA_KEEPOUT.height}
    />
  </board>
)
