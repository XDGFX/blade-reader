// The comb: outline, divider slots, support holes and keepouts. Dimensions from
// docs/design.md (Mechanical, Fixing, Body) and issues #8, #9 and #15.
//
// PCB coordinates, in mm: Y runs outboard from the panel edge (Y 0), so the fingers are at
// negative Y. X runs along the strip, centred, as seen from the parts face (tscircuit's top),
// so way 1 is at +X. The design docs give x from the way 1 end looking at the ring face:
// X = 40.08 − x. The outline is symmetric in X, so only the parts' sides are affected.

import { Fragment } from "react"

export const WAY_PITCH_PCB = 13.36
export const LENGTH = 6 * WAY_PITCH_PCB // 80.16
export const DEPTH = 40

const HALF = LENGTH / 2
const FINGER_WIDTH = 9.5
const FINGER_LENGTH = 13.0
const TIP_RADIUS = 0.5
const ROOT_RADIUS = 1.0

/** Centre X of way `n` (1–6). */
export const wayX = (n: number) => HALF - WAY_PITCH_PCB / 2 - (n - 1) * WAY_PITCH_PCB

/** The way screw's hole centre, 8.52 mm into the panel. */
export const CLAMP_Y = -8.52

/** Output nut centres. */
export const NUT_Y = 16

// ESP32-C3-MINI-1: body 13.2 wide, from Y 23.4 to the outboard edge, antenna end outboard.
// The footprint's origin is 5.6 mm above the body's inboard end.
export const ESP_Y = 23.4 + 5.6
const NOTCH_HALF = 6.6
const NOTCH_Y = 35

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
  { x: -HALF, y: DEPTH },
  { x: -NOTCH_HALF, y: DEPTH },
  { x: -NOTCH_HALF, y: NOTCH_Y },
  { x: NOTCH_HALF, y: NOTCH_Y },
  { x: NOTCH_HALF, y: DEPTH },
  { x: HALF, y: DEPTH },
  { x: HALF, y: 0 },
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => finger(wayX(n))),
  { x: -HALF, y: 0 },
]

export const OUTLINE = COMB.map(({ x, y }) => ({ x, y: y + Y_SHIFT }))

const SLOT_XS = [1, 2, 3, 4, 5].map((k) => HALF - k * WAY_PITCH_PCB)
const M3_XS = [HALF - 7, -(HALF - 7)]
const M3_Y = 33

export const CombFeatures = () => (
  <>
    {/* Divider slots between the nuts, for an optional clip-on printed divider. */}
    {SLOT_XS.map((x) => (
      <Fragment key={x}>
        <cutout shape="rect" width="1.7mm" height="11mm" pcbX={x} pcbY={NUT_Y} />
      </Fragment>
    ))}

    {/* M3 holes for the optional support block: no parts or copper in a 12 × 12 zone on the
        parts face, no copper within Ø8 on the ring face. */}
    {M3_XS.map((x) => (
      <Fragment key={x}>
        <hole diameter="3.2mm" pcbX={x} pcbY={M3_Y} />
        <keepout shape="rect" width="12mm" height="12mm" pcbX={x} pcbY={M3_Y} layer="top" />
        <keepout shape="circle" radius="4mm" pcbX={x} pcbY={M3_Y} layer="bottom" />
      </Fragment>
    ))}

    {/* Antenna: no copper on either face beside the notch or under the 0.4 mm of antenna
        area that overhangs the board, 2 mm wider than the module on each side. */}
    {(["top", "bottom"] as const).map((layer) => (
      <Fragment key={layer}>
        <keepout
          shape="rect"
          width={`${2 * NOTCH_HALF + 4}mm`}
          height={`${DEPTH - (ESP_Y + 5.6)}mm`}
          pcbX={0}
          pcbY={(DEPTH + ESP_Y + 5.6) / 2}
          layer={layer}
          excludeRefs={[".U1"]}
        />
      </Fragment>
    ))}
  </>
)
