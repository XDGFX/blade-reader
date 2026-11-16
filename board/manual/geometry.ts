// The manual's geometry: the yoke from index.circuit.tsx and the ST Blade from
// docs/research/fuse-panel-dimensions.md, in panel coordinates.
//
// X = c, across from the centreline (odd ways at +c); Y = a, along from the positive end;
// Z = h, up from the panel's mounting face. All in mm.

import { ARM_DEPTH, CLAMPS, GROUND_NUT, J1_AT, MODULE, NUTS, OUTLINE, PANEL_END, WAYS_A, YOKE, pcb } from "../index.circuit"
import { ringFace } from "../lib/ring-face"

export type V = [number, number, number]
export type P2 = [number, number]

// ── The fuse panel ──────────────────────────────────────────────────────────────────────

export const HALF = 84.2 / 2
export const LENGTH = 164.4
export const DECK = 12.7
export const PAD = 14.33
export const LIP = 12.6
export const FUSE_TOP = 26.21
export const POCKET_HALF = 11.11 / 2
export const PITCH = 13.36
/** Where the pockets end, at the fuse holder wall. */
export const INNER_C = HALF - 14.5
/** Where the pad starts, in from the long edge. */
export const LIP_C = HALF - 3.2
export const SCREW_INSET = 8.52
export const STUD_A = 11.33
export const NEG_STUD_A = 153
export const NEG_SCREWS_A = [113.54, 124.62, 135.69]
export const MOUNTS = [12.8, 151.6].flatMap((a) => [31.8, -31.8].map((c): P2 => [c, a]))
/** A barrier's top, sloping down from the fuse holder wall to the long edge. */
export const barrierTop = (c: number) => 22.9 + ((Math.abs(c) - INNER_C) / (HALF - INNER_C)) * (18.7 - 22.9)
/** A way screw's centre, way 1 to 12: odd ways at +c, 11 and 12 nearest the positive end. */
export const wayAt = (n: number): P2 => [(n % 2 ? 1 : -1) * (HALF - SCREW_INSET), WAYS_A[5 - Math.floor((n - 1) / 2)]]

/** The positive end's outline, a as a function of c. */
export const endA = (c: number) => {
  const x = Math.min(Math.abs(c), HALF)
  for (let i = 1; i < PANEL_END.length; i++) {
    const p = PANEL_END[i - 1]
    const q = PANEL_END[i]
    if (x <= q.x) return p.y + ((x - p.x) / (q.x - p.x)) * (q.y - p.y)
  }
  return PANEL_END[PANEL_END.length - 1].y
}

export type Row = { a0: number; a1: number; kind: "deck" | "wall" | "pocket" }

/** The panel cut along a into decks, walls (barriers) and pockets, positive end first. */
export const ROWS: Row[] = (() => {
  const rows: Row[] = [{ a0: 0, a1: 20.2, kind: "deck" }]
  let a = 20.2
  for (const w of WAYS_A) {
    rows.push({ a0: a, a1: w - POCKET_HALF, kind: "wall" })
    rows.push({ a0: w - POCKET_HALF, a1: w + POCKET_HALF, kind: "pocket" })
    a = w + POCKET_HALF
  }
  rows.push({ a0: a, a1: 108.2, kind: "wall" }, { a0: 108.2, a1: 141.2, kind: "pocket" })
  rows.push({ a0: 141.2, a1: 144.5, kind: "wall" }, { a0: 144.5, a1: LENGTH, kind: "deck" })
  return rows
})()

/** The panel cut across c: lip, pad, fuse block, pad, lip. */
export const C_BREAKS = [-HALF, -LIP_C, -INNER_C, INNER_C, LIP_C, HALF]

/** The top of the cell in row `row` and column `ci`, at c. */
export const cellTop = (row: Row, ci: number, c: number) => {
  if (row.kind === "deck") return DECK
  const mid = (C_BREAKS[ci] + C_BREAKS[ci + 1]) / 2
  if (Math.abs(mid) < INNER_C) return FUSE_TOP
  if (row.kind === "wall") return barrierTop(c)
  return Math.abs(mid) > LIP_C ? LIP : PAD
}

// ── The yoke ────────────────────────────────────────────────────────────────────────────

export const BOARD = 1.6
const A_MID = pcb(0, 0).y
export const toPanel = (p: { x: number; y: number }): P2 => [-p.x, A_MID - p.y]
export const YOKE_OUTLINE = OUTLINE.map(toPanel)
/** The WROOM-02 on the parts face, 3.2 tall, its antenna past the odd arm's edge. */
export const MODULE_BOX = MODULE.slice(0, 4).map(toPanel)
export const MODULE_HEIGHT = 3.2
export const CLAMP_HOLES = CLAMPS.map(toPanel)
export const CLAMP_HOLE_R = 5.4 / 2
export const OUTPUT_NUTS = NUTS.map(toPanel)
export const GND_NUT = toPanel(GROUND_NUT)
export const PROG_PADS = toPanel(J1_AT)
/** The USB-C socket's middle on the chin's outer edge, on the parts face (J2). */
export const CHIN_A = Math.min(...YOKE_OUTLINE.map((p) => p[1]))
export const USB_C: P2 = [25, CHIN_A]
/** A terminal: the SMT nut (SMTSO-M4) on the parts face, and its tinned pad and hole on the ring face. */
export const NUT = { r: 8.74 / 2, height: 4, pad: 4.685, hole: 6.4 / 2 }
/** How far out from the panel's edge the output nuts sit, and how deep the arm is. */
export const NUT_OUT = Math.abs(OUTPUT_NUTS[0][0]) - HALF
export { ARM_DEPTH }
/** A hexagon of `flats` across flats, centred on (c, a), a corner pointing along +c when `turn` is 0. */
export const hexagon = (c: number, a: number, flats: number, turn = 0): P2[] => {
  const r = flats / Math.sqrt(3)
  return Array.from({ length: 6 }, (_, i) => [c + r * Math.cos((i * Math.PI) / 3 + turn), a + r * Math.sin((i * Math.PI) / 3 + turn)])
}
/** The ring face's silkscreen, as the board has it: strokes of a width, and fills with holes. */
export const SILK = (() => {
  const art = ringFace(YOKE)
  const at = (p: { x: number; y: number }) => toPanel(p)
  return {
    strokes: art.strokes.map((s) => ({ pts: s.pts.map(at), w: s.w })),
    fills: art.fills.map((rings) => rings.map((r) => r.map(at))),
  }
})()
/** The tinned land round each finger's clamp hole. */
export const CLAMP_LAND_R = 4.065
