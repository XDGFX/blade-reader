// The geometry of one way's finger, shared by every way of the yoke. Dimensions from
// docs/design.md (Mechanical, Fixing).
//
// Finger coordinates, in mm: Y runs outboard from the panel edge (Y 0), so the finger is at
// negative Y, and X runs along the panel. index.circuit.tsx turns them onto each arm.

export const WAY_PITCH_PCB = 13.36

const NUT_PAD_RADIUS = 4.685

/** How far the board runs past an end way's centre, along the panel's side. */
export const END = WAY_PITCH_PCB / 2 + NUT_PAD_RADIUS + 0.565

const FINGER_WIDTH = 9.5
const FINGER_LENGTH = 13.0
const TIP_RADIUS = 0.5
const ROOT_RADIUS = 1.0

/** The way screw's hole centre, 8.52 mm into the panel. */
export const CLAMP_Y = -8.52

export type Pt = { x: number; y: number }

// Quarter arc from angle a0 to a1 (degrees), centre (cx, cy).
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 4): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })

/** Finger `cx`'s edge from the panel edge at its +X root, round the tip, to its −X root. */
export const finger = (cx: number): Pt[] => {
  const l = cx + FINGER_WIDTH / 2 // right side, walked first (outline runs towards −X)
  const r = cx - FINGER_WIDTH / 2
  const tip = -FINGER_LENGTH
  return [
    ...arc(l + ROOT_RADIUS, -ROOT_RADIUS, ROOT_RADIUS, 90, 180),
    ...arc(l - TIP_RADIUS, tip + TIP_RADIUS, TIP_RADIUS, 0, -90),
    ...arc(r + TIP_RADIUS, tip + TIP_RADIUS, TIP_RADIUS, -90, -180),
    ...arc(r - ROOT_RADIUS, -ROOT_RADIUS, ROOT_RADIUS, 0, 90),
  ]
}
