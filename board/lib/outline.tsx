// The comb: outline, divider lanes and ring keepouts. Dimensions from
// docs/design.md (Mechanical, Fixing, Body) and issues #8, #9, #15 and #21.
//
// PCB coordinates, in mm: Y runs outboard from the panel edge (Y 0), so the fingers are at
// negative Y. X runs along the strip, centred, as seen from the parts face (tscircuit's top),
// so way 1 is at +X. The design docs give x from the way 1 end looking at the ring face:
// X = 40.08 − x. The way 1 ear is longer than the way 6 ear, so the whole strip is shifted by
// X_SHIFT to centre the outline's bounding box.

export const WAY_PITCH_PCB = 13.36
export const LENGTH = 6 * WAY_PITCH_PCB // 80.16, the ways' span
/** Set by the way 1 ear: the module's lands out to 19.5, mux 1's pads 0.52 above them, and 0.54 to the edge. */
export const DEPTH = 28.0

/** Output nut centres. */
export const NUT_Y = 14
const NUT_PAD_RADIUS = 4.685

/** The way 6 ear past its end way, along the panel's side. */
export const END = WAY_PITCH_PCB / 2 + NUT_PAD_RADIUS + 0.565

const HALF = LENGTH / 2
/** The way 6 end is at −BOARD_HALF. */
export const BOARD_HALF = HALF + END
/**
 * X of the board's way 1 end. The way 1 ear is 1.79 mm longer than the way 6 ear: the module's
 * 14.0 mm on the board starts 1.0 mm from way 1's sense cap (pad edge at X 38.82).
 */
export const BOARD_END_1 = 53.8
/** Centres the outline's bounding box in X; the strip's group and everything outside it shift by this. */
export const X_SHIFT = -(BOARD_END_1 - BOARD_HALF) / 2
const FINGER_WIDTH = 9.5
const FINGER_LENGTH = 13.0
const TIP_RADIUS = 0.5
const ROOT_RADIUS = 1.0

/** Centre X of way `n` (1–6). */
export const wayX = (n: number) => HALF - WAY_PITCH_PCB / 2 - (n - 1) * WAY_PITCH_PCB

/** The way screw's hole centre, 8.52 mm into the panel. */
export const CLAMP_Y = -8.52

/**
 * The ground nut, low in the way 6 ear, a pitch along from way 6. Its centre is about 16 from
 * way 6's nut, so the rings are further apart than two ways' rings.
 */
export const GROUND_NUT = { x: wayX(6) - WAY_PITCH_PCB, y: NUT_PAD_RADIUS + 0.565 }

// ESP32-C3-WROOM-02 at the bottom of the way 1 ear, lying along the strip (rotated −90°). Its
// antenna line sits on the board end, 7.1 mm from the footprint's origin, so the whole antenna
// overhangs. Its lands reach ESP_LAND mm each side of its centre line, and the panel-edge row
// stops 0.5 mm from the edge. The outboard row is 3V3, EN, IO4–IO9 and GND from the board end;
// the panel-edge row is IO0–IO3, IO19, IO18, TXD, RXD and IO10.
const ESP_LAND = 9.5
export const ESP = { x: BOARD_END_1 - 7.1, y: 0.5 + ESP_LAND }
/** The outboard edge of the module's lands: what stands above the module is placed from here. */
export const ESP_ROW_Y = ESP.y + ESP_LAND
/** X of the module's `i`th outboard land from the board end: 3V3, EN, IO4 … GND. */
export const espPinX = (i: number) => ESP.x + 6 - 1.5 * i

// The way 6 ear holds the ground nut low down and the second multiplexer above it. Its outboard
// corner is chamfered at 45°, 2 mm less than the ear's length each way, which leaves the
// multiplexer about 2 mm clear of the chamfer.
export const CHAMFER = END - 2
/** Centre of the second multiplexer, lying along the strip above the ground nut. */
export const MUX_2 = { x: -43.7, y: 14.17 }

export type Pt = { x: number; y: number }

// Quarter arc from angle a0 to a1 (degrees), centre (cx, cy).
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, steps = 4): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })

/** Finger `cx`'s edge from the body edge at its +X root, round the tip, to its −X root. */
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

// tscircuit centres the board's bounding box on the origin for its checks, so the parts sit
// in a group shifted by this much and the outline is shifted to match.
export const Y_SHIFT = -(DEPTH - FINGER_LENGTH) / 2

const COMB: Pt[] = [
  { x: -BOARD_HALF + CHAMFER, y: DEPTH },
  { x: BOARD_END_1, y: DEPTH },
  { x: BOARD_END_1, y: 0 },
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => finger(wayX(n))),
  { x: -BOARD_HALF, y: 0 },
  { x: -BOARD_HALF, y: DEPTH - CHAMFER },
]

export const OUTLINE = COMB.map(({ x, y }) => ({ x: x + X_SHIFT, y: y + Y_SHIFT }))

// Ring keepout (GLOSSARY.md): a Ø10 ring on the nut with a 10 mm tongue running outboard, swung
// up to ±20°, the goal; straight out is the minimum. Inside it the ring face carries only that
// way's own copper.
const RING_KEEPOUT_R = 5
const SWING = (20 * Math.PI) / 180

/**
 * X of the outer edge of the ring keepout of the way centred on `cx`, swung towards `side`
 * (+1 is +X), at height `y`. Valid above the ring's own disc, from y ≈ 12.3.
 */
export const keepoutEdgeX = (cx: number, side: 1 | -1, y: number) => {
  const x0 = cx + side * RING_KEEPOUT_R * Math.cos(SWING)
  const y0 = NUT_Y - RING_KEEPOUT_R * Math.sin(SWING)
  return x0 + side * Math.tan(SWING) * (y - y0)
}

/**
 * Divider lanes: about 2 mm wide, midway between each pair of nuts, out to the outboard edge.
 * Kept free of parts so a printed divider could slide on from the edge later. Traces may cross.
 */
export const DIVIDER_LANE = { width: 2, xs: [1, 2, 3, 4, 5].map((k) => HALF - k * WAY_PITCH_PCB) }
