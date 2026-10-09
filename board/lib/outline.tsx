// The comb: outline, divider slots, support holes and keepouts. Dimensions from
// docs/design.md (Mechanical, Fixing, Body) and issues #8, #9, #15 and #21.
//
// PCB coordinates, in mm: Y runs outboard from the panel edge (Y 0), so the fingers are at
// negative Y. X runs along the strip, centred, as seen from the parts face (tscircuit's top),
// so way 1 is at +X. The design docs give x from the way 1 end looking at the ring face:
// X = 40.08 − x. The outline is symmetric in X, so only the parts' sides are affected.

import { Fragment } from "react"

export const WAY_PITCH_PCB = 13.36
export const LENGTH = 6 * WAY_PITCH_PCB // 80.16, the ways' span
export const DEPTH = 27.5

/** Body past each end way, along the panel's side: 21.15 mm of panel lies past the strip. */
export const END = 20

const HALF = LENGTH / 2
/** X of the board's way 1 end; the way 6 end is at −BOARD_HALF. */
export const BOARD_HALF = HALF + END
const FINGER_WIDTH = 9.5
const FINGER_LENGTH = 13.0
const TIP_RADIUS = 0.5
const ROOT_RADIUS = 1.0

/** Centre X of way `n` (1–6). */
export const wayX = (n: number) => HALF - WAY_PITCH_PCB / 2 - (n - 1) * WAY_PITCH_PCB

/** The way screw's hole centre, 8.52 mm into the panel. */
export const CLAMP_Y = -8.52

/** Output nut centres. */
export const NUT_Y = 14

// ESP32-C3-MINI-1 at the way 6 end, lying along the strip (rotated 90°), antenna past the end
// of the board. Its 11.2 mm pad area is on the board, 0.7 mm in from the outboard edge so
// RXD and TXD can leave along it. The footprint's origin is 5.6 mm from that area's ends.
export const ESP = { x: -(BOARD_HALF - 5.6), y: DEPTH - 0.7 - 6.6 }

/** Support hole zone: 12 × 12, in the panel-edge corner at each end. */
const ZONE = 12
export const M3_Y = ZONE / 2

type Pt = { x: number; y: number }

// Quarter arc from angle a0 to a1 (degrees), centre (cx, cy).
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 4): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })

const finger = (cx: number): Pt[] => {
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

// tscircuit centres the board's bounding box on the origin for its checks, so the parts sit
// in a group shifted by this much and the outline is shifted to match.
export const Y_SHIFT = -(DEPTH - FINGER_LENGTH) / 2

const COMB: Pt[] = [
  { x: -BOARD_HALF, y: DEPTH },
  { x: BOARD_HALF, y: DEPTH },
  { x: BOARD_HALF, y: 0 },
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => finger(wayX(n))),
  { x: -BOARD_HALF, y: 0 },
]

export const OUTLINE = COMB.map(({ x, y }) => ({ x, y: y + Y_SHIFT }))

/** Divider slots: centre Y and length. Parts stay 1.5 mm clear of them. */
export const SLOT = { y: 15.5, length: 11 }
const SLOT_XS = [1, 2, 3, 4, 5].map((k) => HALF - k * WAY_PITCH_PCB)
const M3_XS = [BOARD_HALF - ZONE / 2, -(BOARD_HALF - ZONE / 2)]

export const CombFeatures = () => (
  <>
    {/* Divider slots between the nuts, for an optional clip-on printed divider. */}
    {SLOT_XS.map((x) => (
      <Fragment key={x}>
        <cutout shape="rect" width="1.7mm" height={`${SLOT.length}mm`} pcbX={x} pcbY={SLOT.y} />
      </Fragment>
    ))}

    {/* M3 holes for the optional support block: no parts or copper in a 12 × 12 zone on the
        parts face, no copper within Ø8 on the ring face. */}
    {M3_XS.map((x) => (
      <Fragment key={x}>
        <hole diameter="3.2mm" pcbX={x} pcbY={M3_Y} />
        <keepout shape="rect" width={`${ZONE}mm`} height={`${ZONE}mm`} pcbX={x} pcbY={M3_Y} layer="top" />
        <keepout shape="circle" radius="4mm" pcbX={x} pcbY={M3_Y} layer="bottom" />
      </Fragment>
    ))}
  </>
)
