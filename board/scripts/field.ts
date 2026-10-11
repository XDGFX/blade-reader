/// <reference types="node" />
// Draws the parts face's texture (#88) into lib/art/field.json: contours of the field round the
// twelve ways' currents, cut clear of the pads, the holes, the board's edge and the face's marks
// as they stand in a built circuit.json. Run it again when a part or a mark moves; scripts/silk.ts
// fails until then.
//
// Usage: bun scripts/field.ts [circuit.json], after a build. Coordinates are the parts face's:
// x = −X and y = Y of the board's.

import { readFileSync, writeFileSync } from "node:fs"
import { YOKE } from "../index.circuit"
import { partsMarks } from "../lib/parts-face"

const [file = "dist/index/circuit.json"] = process.argv.slice(2)

type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const V = (p: Pt) => P(-p.x, p.y)

const WIDTH = 0.15
/** JLC's 0.25 from a pad and 0.3 from the edge, from the line's edge, and a margin for the cutter's 0.1 step. */
const PAD = 0.25 + WIDTH / 2 + 0.05
const EDGE = 0.3 + WIDTH / 2 + 0.05
/** Clear space round each mark. */
const HALO = 0.75
/** A contour level every 0.7 of the potential; where they would fall closer than this, every second, fourth or eighth is kept. */
const STEP = 0.7
const SPACING = 1.0
/** Nearly flat ground, where a contour wanders: none is drawn. */
const FLAT = 0.12
/** Shorter pieces are dropped. */
const SHORTEST = 2.5
const CELL = 0.5

const circuit: any[] = JSON.parse(readFileSync(file, "utf8"))
const of = (t: string) => circuit.filter((e) => e.type === t)
const outline: Pt[] = of("pcb_board")[0].outline.map(V)

// ── What the texture keeps off ─────────────────────────────────────────────────────────────

type Box = { x0: number; x1: number; y0: number; y1: number }
const span = (pts: Pt[]): Box => ({
  x0: Math.min(...pts.map((p) => p.x)),
  x1: Math.max(...pts.map((p) => p.x)),
  y0: Math.min(...pts.map((p) => p.y)),
  y1: Math.max(...pts.map((p) => p.y)),
})
const turned = (cx: number, cy: number, w: number, h: number, deg = 0) => {
  const a = (deg * Math.PI) / 180
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) =>
    V(P(cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a))),
  )
}
// Every pad and hole by its bounding box, which is a little more than it needs.
const boxes: Box[] = [
  ...of("pcb_smtpad")
    .filter((p) => p.layer === "top")
    .map((p) =>
      p.shape === "circle"
        ? span(turned(p.x, p.y, 2 * p.radius, 2 * p.radius))
        : p.shape === "polygon"
          ? span(p.points.map(V))
          : span(turned(p.x, p.y, p.width, p.height, p.ccw_rotation ?? 0)),
    ),
]
const rounds = [
  ...of("pcb_plated_hole").map((h) => ({ ...V(h), r: (h.outer_diameter ?? Math.max(h.outer_width, h.outer_height)) / 2 })),
  ...of("pcb_hole").map((h) => ({ ...V(h), r: h.hole_diameter / 2 })),
]

/** Copper the mask leaves bare: the fingers' contact faces. */
const bare: Pt[][] = of("pcb_copper_pour")
  .filter((c) => c.layer === "top" && !c.covered_with_solder_mask)
  .map((c) => c.brep_shape.outer_ring.vertices.map(V))
const bareBoxes = bare.map(span)

const dense = (pts: Pt[], closed: boolean, step: number) => {
  const out: Pt[] = []
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]]
    const k = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step))
    for (let j = 0; j < k; j++) out.push(P(a.x + ((b.x - a.x) * j) / k, a.y + ((b.y - a.y) * j) / k))
  }
  out.push(pts[closed ? 0 : pts.length - 1])
  return out
}
const marks = partsMarks(YOKE)
const near = new Map<string, Pt[]>()
const tile = (x: number, y: number) => `${Math.floor(x)},${Math.floor(y)}`
for (const p of [...marks.strokes.flatMap((s) => dense(s.pts, false, 0.15)), ...marks.fills.flat().flatMap((r) => dense(r, true, 0.15))]) {
  const k = tile(p.x, p.y)
  near.set(k, [...(near.get(k) ?? []), p])
}
const segDist = (p: Pt, a: Pt, b: Pt) => {
  const [dx, dy] = [b.x - a.x, b.y - a.y]
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
/** Whether p is inside a polygon, or within `gap` of its edge. */
const within = (p: Pt, poly: Pt[], gap: number) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = [poly[i], poly[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
    if (segDist(p, a, b) < gap) return { inside: true, edge: true }
  }
  return { inside, edge: false }
}
const blocked = (p: Pt) => {
  const board = within(p, outline, EDGE)
  if (!board.inside || board.edge) return true
  for (let i = 0; i < bare.length; i++) {
    const b = bareBoxes[i]
    if (p.x > b.x0 - PAD && p.x < b.x1 + PAD && p.y > b.y0 - PAD && p.y < b.y1 + PAD && within(p, bare[i], PAD).inside) return true
  }
  for (const b of boxes) if (Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.y0 - p.y, 0, p.y - b.y1)) < PAD) return true
  for (const c of rounds) if (Math.hypot(p.x - c.x, p.y - c.y) < c.r + PAD) return true
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (const m of near.get(tile(p.x + i, p.y + j)) ?? []) if (Math.hypot(p.x - m.x, p.y - m.y) < HALO) return true
  return false
}

// ── The field ──────────────────────────────────────────────────────────────────────────────

// Each way's current runs from its finger out to its nut: a row of line currents along it,
// neighbouring ways and the two arms taken with opposite signs so the contours close round each way.
const sources: { p: Pt; sign: number }[] = []
for (const s of [1, -1])
  YOKE.waysA.forEach((a, k) => {
    for (let d = 30; d <= 53; d++) sources.push({ p: P(s * d, YOKE.pcb(0, a).y), sign: s * (k % 2 ? -1 : 1) })
  })
const potential = (x: number, y: number) => {
  let v = 0
  for (const q of sources) v += q.sign * Math.log(Math.hypot(x - q.p.x, y - q.p.y) + 0.8)
  return v
}

const box = span(outline)
const [nx, ny] = [Math.ceil((box.x1 - box.x0) / CELL), Math.ceil((box.y1 - box.y0) / CELL)]
const at = (i: number, j: number) => P(box.x0 + i * CELL, box.y0 + j * CELL)
const grid: number[][] = []
for (let j = 0; j <= ny; j++) {
  grid.push([])
  for (let i = 0; i <= nx; i++) grid[j].push(potential(at(i, j).x, at(i, j).y))
}

/** Where a level crosses the edge between two grid corners, the same whichever cell asks. */
const crossing = (level: number, i0: number, j0: number, i1: number, j1: number) => {
  if (i0 > i1 || j0 > j1) [i0, j0, i1, j1] = [i1, j1, i0, j0]
  const [a, b] = [grid[j0][i0], grid[j1][i1]]
  const t = (level - a) / (b - a)
  const [p, q] = [at(i0, j0), at(i1, j1)]
  return P(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t)
}

const lines: Pt[][] = []
const levels = Math.ceil(Math.max(...grid.flat().map(Math.abs)) / STEP)
for (let n = -levels; n <= levels; n++) {
  const level = n * STEP + 1e-7
  const segs: [Pt, Pt][] = []
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const corners = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]
      const c = corners.map(([u, v]) => grid[v][u])
      // The contours' spacing here is the level step over the field's slope.
      const slope = Math.hypot(c[1] - c[0] + c[2] - c[3], c[3] - c[0] + c[2] - c[1]) / (2 * CELL)
      if (slope < FLAT) continue
      let stride = 1
      while ((STEP * stride) / slope < SPACING && stride < 64) stride *= 2
      if (n % stride) continue
      const cross: Pt[] = []
      for (let e = 0; e < 4; e++) {
        const [[u0, v0], [u1, v1]] = [corners[e], corners[(e + 1) % 4]]
        if (grid[v0][u0] < level !== grid[v1][u1] < level) cross.push(crossing(level, u0, v0, u1, v1))
      }
      if (cross.length === 2) segs.push([cross[0], cross[1]])
    }
  // Join the cells' pieces end to end into lines.
  const name = (p: Pt) => `${p.x.toFixed(5)},${p.y.toFixed(5)}`
  const ends = new Map<string, number[]>()
  segs.forEach((s, i) => s.forEach((p) => ends.set(name(p), [...(ends.get(name(p)) ?? []), i])))
  const used = new Set<number>()
  const walk = (from: Pt, first: number) => {
    const pts: Pt[] = []
    let [p, i] = [from, first]
    for (;;) {
      used.add(i)
      p = name(segs[i][0]) === name(p) ? segs[i][1] : segs[i][0]
      pts.push(p)
      const next = (ends.get(name(p)) ?? []).find((k) => !used.has(k))
      if (next === undefined) return pts
      i = next
    }
  }
  segs.forEach((s, i) => {
    if (used.has(i)) return
    const forward = walk(s[0], i)
    const back = (ends.get(name(s[0])) ?? []).find((k) => !used.has(k))
    lines.push([...(back === undefined ? [] : walk(s[0], back).reverse()), s[0], ...forward])
  })
}

// Cut each line to its clear runs, drop the short ones and keep a point every 0.5 mm.
const out: number[][] = []
let length = 0
for (const l of lines) {
  let run: Pt[] = []
  const end = () => {
    if ((run.length - 1) * 0.1 >= SHORTEST) {
      out.push(run.filter((_, i) => i % 5 === 0 || i === run.length - 1).flatMap((p) => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]))
      length += (run.length - 1) * 0.1
    }
    run = []
  }
  for (const p of dense(l, false, 0.1)) blocked(p) ? end() : run.push(p)
  end()
}
writeFileSync("lib/art/field.json", `${JSON.stringify({ w: WIDTH, lines: out })}\n`)
console.log(`field: ${out.length} lines, ${(length / 1000).toFixed(2)} m of silk`)
