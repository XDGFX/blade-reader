/// <reference types="node" />
// Finishes the silk in a built circuit.json, in place, before the Gerbers are exported from it:
// drops the footprints' stock silk and the outline strokes tscircuit adds to each
// <silkscreengraphic>, then checks lib/silkscreen.tsx's silk against JLC's rules. Exits 1 on a
// failure.
//
// Usage: bun scripts/silk.ts [circuit.json] [gerber dir]. Given a Gerber directory, it also
// checks that every line drawn on the silk layers is at least the minimum width.

import { existsSync, readFileSync, writeFileSync } from "node:fs"

const [file = "dist/index/circuit.json", gerbers] = process.argv.slice(2)

/** JLC: silk at least 0.15 wide, 0.25 from exposed copper (recommended), and on the board. */
const MIN_WIDTH = 0.15
const PAD_CLEARANCE = 0.25
const EDGE_CLEARANCE = 0.3

type Pt = { x: number; y: number }
type Poly = Pt[]

let circuit: any[] = JSON.parse(readFileSync(file, "utf8"))
const isSilk = (e: any) => e.type.startsWith("pcb_silkscreen_")
// Board-level silk has no component; a <silkscreengraphic>'s parts carry an empty one.
const stock = (e: any) => isSilk(e) && !!e.pcb_component_id
const graphicOutline = (e: any) => e.type === "pcb_silkscreen_path" && e.pcb_component_id === ""
const dropped = circuit.filter((e) => stock(e) || graphicOutline(e)).length
circuit = circuit.filter((e) => !(stock(e) || graphicOutline(e)))
writeFileSync(file, JSON.stringify(circuit, null, 2))

const of = (type: string) => circuit.filter((e) => e.type === type)
const names: Record<string, string> = Object.fromEntries(
  of("source_component").map((s) => [s.source_component_id, s.name]),
)
const owner: Record<string, string> = Object.fromEntries(
  of("pcb_component").map((c) => [c.pcb_component_id, names[c.source_component_id]]),
)

const circle = (cx: number, cy: number, r: number, n = 32): Poly =>
  Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n),
    y: cy + r * Math.sin((2 * Math.PI * i) / n),
  }))
const rect = (cx: number, cy: number, w: number, h: number, deg = 0): Poly => {
  const a = (deg * Math.PI) / 180
  return [
    [-w / 2, -h / 2],
    [w / 2, -h / 2],
    [w / 2, h / 2],
    [-w / 2, h / 2],
  ].map(([x, y]) => ({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) }))
}

/** Copper the mask leaves bare, per layer, as polygons. */
type Bare = { what: string; layers: string[]; poly: Poly }
const bare: Bare[] = []
for (const p of of("pcb_smtpad")) {
  const what = `${owner[p.pcb_component_id] ?? "?"} pad`
  const poly =
    p.shape === "circle"
      ? circle(p.x, p.y, p.radius)
      : p.shape === "polygon"
        ? p.points
        : rect(p.x, p.y, p.width, p.height, p.ccw_rotation ?? 0)
  bare.push({ what, layers: [p.layer], poly })
}
for (const h of of("pcb_plated_hole")) {
  bare.push({ what: `${owner[h.pcb_component_id] ?? "?"} hole`, layers: ["top", "bottom"], poly: circle(h.x, h.y, h.outer_diameter / 2) })
}
for (const h of of("pcb_hole")) {
  bare.push({ what: "hole", layers: ["top", "bottom"], poly: circle(h.x, h.y, h.hole_diameter / 2) })
}
for (const c of of("pcb_copper_pour").filter((c) => !c.covered_with_solder_mask)) {
  bare.push({ what: "bare pour", layers: [c.layer], poly: c.brep_shape.outer_ring.vertices })
}

// The outline and slots, which silk must stay inside and clear of.
const board = of("pcb_board")[0]
const outline: Poly = board.outline
const slots: Poly[] = of("pcb_cutout").map((c) => rect(c.center.x, c.center.y, c.width, c.height))

const segDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
const cross = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)
}
const segSeg = (a: Pt, b: Pt, c: Pt, d: Pt) =>
  cross(a, b, c, d) ? 0 : Math.min(segDist(a, c, d), segDist(b, c, d), segDist(c, a, b), segDist(d, a, b))
const inside = (p: Pt, poly: Poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = [poly[i], poly[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c
  }
  return c
}
const edges = (poly: Poly, closed: boolean) =>
  poly.slice(0, closed ? poly.length : poly.length - 1).map((p, i) => [p, poly[(i + 1) % poly.length]] as const)
/** Distance between a silk shape (a polyline or a filled ring) and a polygon; 0 if they meet. */
const dist = (shape: Poly, closed: boolean, poly: Poly) => {
  if (inside(shape[0], poly) || (closed && inside(poly[0], shape))) return 0
  let m = Infinity
  for (const [a, b] of edges(shape, closed)) for (const [c, d] of edges(poly, true)) m = Math.min(m, segSeg(a, b, c, d))
  return m
}
const box = (pts: Poly, g = 0) => {
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return [Math.min(...xs) - g, Math.min(...ys) - g, Math.max(...xs) + g, Math.max(...ys) + g]
}
const near = (a: number[], b: number[]) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]

/** The silk to check: each line with its half-width, each filled ring with none. */
type Silk = { layer: string; shape: Poly; closed: boolean; half: number; at: Pt }
const silk: Silk[] = []
const fails: string[] = []
const at = (p: Pt) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`
for (const s of of("pcb_silkscreen_path")) {
  if (s.stroke_width < MIN_WIDTH - 1e-9) fails.push(`line ${s.stroke_width} wide at ${at(s.route[0])}`)
  silk.push({ layer: s.layer, shape: s.route, closed: false, half: s.stroke_width / 2, at: s.route[0] })
}
for (const g of of("pcb_silkscreen_graphic")) {
  for (const r of [g.brep_shape.outer_ring, ...g.brep_shape.inner_rings]) {
    silk.push({ layer: g.layer, shape: r.vertices, closed: true, half: 0, at: r.vertices[0] })
  }
}
for (const t of ["pcb_silkscreen_text", "pcb_silkscreen_circle", "pcb_silkscreen_line", "pcb_silkscreen_rect"]) {
  for (const e of of(t)) fails.push(`${t} at ${at(e.anchor_position ?? e.center ?? e)}: draw it in lib/silkscreen.tsx`)
}

let worst = Infinity
for (const s of silk) {
  const b = box(s.shape, s.half + PAD_CLEARANCE)
  for (const c of bare) {
    if (!c.layers.includes(s.layer) || !near(b, box(c.poly))) continue
    const d = dist(s.shape, s.closed, c.poly) - s.half
    worst = Math.min(worst, d)
    if (d < PAD_CLEARANCE - 1e-6) fails.push(`${s.layer} silk at ${at(s.at)} is ${d.toFixed(3)} from ${c.what}`)
  }
  for (const c of slots) {
    if (!near(b, box(c))) continue
    const d = dist(s.shape, s.closed, c) - s.half
    if (d < EDGE_CLEARANCE) fails.push(`${s.layer} silk at ${at(s.at)} is ${d.toFixed(3)} from a slot`)
  }
  const pts = s.shape
  if (!pts.every((p) => inside(p, outline))) fails.push(`${s.layer} silk at ${at(s.at)} is off the board`)
  else {
    let e = Infinity
    for (const [a, c] of edges(outline, true)) for (const p of pts) e = Math.min(e, segDist(p, a, c))
    if (e - s.half < EDGE_CLEARANCE) fails.push(`${s.layer} silk at ${at(s.at)} is ${(e - s.half).toFixed(3)} from the edge`)
  }
}

// Every draw on a silk layer outside a region must use an aperture of at least the minimum.
if (gerbers) {
  for (const layer of ["F_SilkScreen.gbr", "B_SilkScreen.gbr"]) {
    const path = `${gerbers}/${layer}`
    if (!existsSync(path)) {
      fails.push(`${path} missing`)
      continue
    }
    const sizes: Record<string, number> = {}
    let aperture = ""
    let region = false
    for (const l of readFileSync(path, "utf8").split("\n")) {
      const def = l.match(/^%ADD(\d+)C,([\d.]+)\*%/)
      if (def) sizes[def[1]] = Number(def[2])
      else if (l.startsWith("G36")) region = true
      else if (l.startsWith("G37")) region = false
      else if (/^D(\d+)\*$/.test(l)) aperture = l.slice(1, -1)
      else if (!region && /D0[13]\*$/.test(l) && sizes[aperture] < MIN_WIDTH - 1e-9) {
        fails.push(`${layer} draws with a ${sizes[aperture]} aperture`)
        break
      }
    }
  }
}

const closest = worst === Infinity ? `none within ${PAD_CLEARANCE} mm` : `${worst.toFixed(3)} mm`
console.log(`silk: dropped ${dropped} stock elements; checked ${silk.length} shapes; closest bare copper ${closest}`)
if (fails.length) {
  console.error(fails.join("\n"))
  process.exit(1)
}
