/// <reference types="node" />
// Checks the built board's copper clearance: on each face, the gap between any two traces, vias,
// pads or plated holes on different nets. Pours are left out: they clear other nets by 0.3 mm by
// themselves (lib/copper.tsx). Pads of one part are not checked against each other. Fails under
// MIN_CLEARANCE, and lists the tightest gaps above it.
// Run after a build: `bun run clearance`.

import { readFileSync } from "node:fs"
import { Y_SHIFT } from "../lib/outline"

/** The routing rule (docs/design.md, Routing). */
const MIN_CLEARANCE = 0.15
/** Gaps under this are listed, tightest first, so a marginal one can be seen. */
const LIST_BELOW = 0.2
const EPS = 1e-6

const circuit: any[] = JSON.parse(readFileSync(process.argv[2] ?? "dist/index/circuit.json", "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

type Pt = { x: number; y: number }
/** A convex outline grown by `r`: one point is a circle, two a round-ended stroke. */
type Shape = { pts: Pt[]; r: number; layers: string[]; net: string; part?: string; what: string }

const netName = new Map<string, string>(of("source_net").map((n) => [n.subcircuit_connectivity_map_key, n.name]))
const name = (key: string) => netName.get(key) ?? key.replace(/^.*connectivity_/, "")
const sourcePort = new Map(of("source_port").map((p) => [p.source_port_id, p]))
const sourceComponent = new Map(of("source_component").map((c) => [c.source_component_id, c.name]))
const partName = new Map(of("pcb_component").map((c) => [c.pcb_component_id, sourceComponent.get(c.source_component_id)]))
const portNet = new Map<string, string>()
const portLabel = new Map<string, string>()
for (const p of of("pcb_port")) {
  const s = sourcePort.get(p.source_port_id)
  if (s?.subcircuit_connectivity_map_key) portNet.set(p.pcb_port_id, s.subcircuit_connectivity_map_key)
  portLabel.set(p.pcb_port_id, `${partName.get(p.pcb_component_id) ?? "?"}.${s?.name ?? "?"}`)
}
const traceNet = new Map(of("source_trace").map((t) => [t.source_trace_id, t.subcircuit_connectivity_map_key]))

const rotated = (cx: number, cy: number, deg: number, pts: Pt[]) => {
  const a = (deg * Math.PI) / 180
  return pts.map(({ x, y }) => ({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) }))
}
const box = (w: number, h: number): Pt[] => [
  { x: -w / 2, y: -h / 2 },
  { x: w / 2, y: -h / 2 },
  { x: w / 2, y: h / 2 },
  { x: -w / 2, y: h / 2 },
]

const shapes: Shape[] = []

for (const p of of("pcb_smtpad")) {
  const net = portNet.get(p.pcb_port_id) ?? `unconnected ${p.pcb_smtpad_id}`
  const base = { layers: [p.layer], net, part: p.pcb_component_id, what: `${portLabel.get(p.pcb_port_id) ?? "pad"} pad` }
  if (p.shape === "circle") shapes.push({ ...base, pts: [{ x: p.x, y: p.y }], r: p.radius })
  else if (p.shape === "polygon") shapes.push({ ...base, pts: p.points, r: 0 })
  else if (p.shape === "pill" || p.shape === "rotated_pill") {
    // A stroke along the long side, as wide as the short one.
    const r = Math.min(p.width, p.height) / 2
    const half = Math.max(p.width, p.height) / 2 - r
    const ends = p.width >= p.height ? [{ x: -half, y: 0 }, { x: half, y: 0 }] : [{ x: 0, y: -half }, { x: 0, y: half }]
    shapes.push({ ...base, pts: rotated(p.x, p.y, p.ccw_rotation ?? 0, ends), r })
  } else shapes.push({ ...base, pts: rotated(p.x, p.y, p.ccw_rotation ?? 0, box(p.width, p.height)), r: 0 })
}
for (const h of of("pcb_plated_hole")) {
  if (h.shape !== "circle") throw new Error(`check-clearance: plated hole shape ${h.shape} is not handled`)
  const port = h.pcb_port_id ?? h.pcb_port_ids?.[0]
  shapes.push({
    pts: [{ x: h.x, y: h.y }],
    r: h.outer_diameter / 2,
    layers: ["top", "bottom"],
    net: portNet.get(port) ?? `unconnected ${h.pcb_plated_hole_id}`,
    part: h.pcb_component_id,
    what: `${portLabel.get(port) ?? partName.get(h.pcb_component_id) ?? "?"} hole`,
  })
}
for (const v of of("pcb_via")) {
  shapes.push({
    pts: [{ x: v.x, y: v.y }],
    r: v.outer_diameter / 2,
    layers: ["top", "bottom"],
    net: v.subcircuit_connectivity_map_key ?? `unconnected ${v.pcb_via_id}`,
    what: "via",
  })
}
for (const t of of("pcb_trace")) {
  const net = traceNet.get(t.source_trace_id) ?? `unconnected ${t.pcb_trace_id}`
  for (let i = 0; i < t.route.length; i++) {
    const a = t.route[i]
    if (a.route_type === "via") {
      shapes.push({ pts: [{ x: a.x, y: a.y }], r: 0.3, layers: ["top", "bottom"], net, what: "via" })
      continue
    }
    const b = t.route[i + 1]
    if (!b || b.route_type !== "wire" || a.layer !== b.layer) continue
    shapes.push({ pts: [{ x: a.x, y: a.y }, { x: b.x, y: b.y }], r: Math.min(a.width, b.width) / 2, layers: [a.layer], net, what: "trace" })
  }
}

const segmentGap = (a: Pt, b: Pt, c: Pt, d: Pt) => {
  const toSegment = (p: Pt, s: Pt, e: Pt) => {
    const [dx, dy] = [e.x - s.x, e.y - s.y]
    const len2 = dx * dx + dy * dy
    const t = len2 ? Math.max(0, Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / len2)) : 0
    return Math.hypot(p.x - s.x - t * dx, p.y - s.y - t * dy)
  }
  const side = (p: Pt, q: Pt, s: Pt) => Math.sign((q.x - p.x) * (s.y - p.y) - (q.y - p.y) * (s.x - p.x))
  if (side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0) return 0
  return Math.min(toSegment(a, c, d), toSegment(b, c, d), toSegment(c, a, b), toSegment(d, a, b))
}
const edges = (pts: Pt[]): [Pt, Pt][] =>
  pts.length === 1 ? [[pts[0], pts[0]]] : pts.length === 2 ? [[pts[0], pts[1]]] : pts.map((p, i) => [p, pts[(i + 1) % pts.length]])
const inside = (p: Pt, pts: Pt[]) => {
  if (pts.length < 3) return false
  let hit = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [a, b] = [pts[i], pts[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}
const gap = (a: Shape, b: Shape) => {
  if (inside(a.pts[0], b.pts) || inside(b.pts[0], a.pts)) return -Infinity
  let best = Infinity
  for (const [p, q] of edges(a.pts)) for (const [s, e] of edges(b.pts)) best = Math.min(best, segmentGap(p, q, s, e))
  return best - a.r - b.r
}
const bounds = (s: Shape) => {
  const xs = s.pts.map((p) => p.x)
  const ys = s.pts.map((p) => p.y)
  return [Math.min(...xs) - s.r, Math.max(...xs) + s.r, Math.min(...ys) - s.r, Math.max(...ys) + s.r]
}

const boxes = shapes.map(bounds)
// The worst gap for each pair of things, so a long trace beside a pad is one line.
const worst = new Map<string, { gap: number; at: Pt }>()
for (let i = 0; i < shapes.length; i++) {
  for (let j = i + 1; j < shapes.length; j++) {
    const [a, b] = [shapes[i], shapes[j]]
    if (a.net === b.net || (a.part && a.part === b.part)) continue
    if (!a.layers.some((l) => b.layers.includes(l))) continue
    const [A, B] = [boxes[i], boxes[j]]
    if (A[0] - B[1] > LIST_BELOW || B[0] - A[1] > LIST_BELOW || A[2] - B[3] > LIST_BELOW || B[2] - A[3] > LIST_BELOW) continue
    const g = gap(a, b)
    if (g >= LIST_BELOW - EPS) continue
    const key = [`${name(a.net)} ${a.what}`, `${name(b.net)} ${b.what}`].sort().join(" / ")
    if (g < (worst.get(key)?.gap ?? Infinity)) worst.set(key, { gap: g, at: a.pts[0] })
  }
}

const found = [...worst].sort((a, b) => a[1].gap - b[1].gap)
const failures = found.filter(([, w]) => w.gap < MIN_CLEARANCE - EPS)
console.log(`clearance: ${shapes.length} shapes; ${failures.length} gaps under ${MIN_CLEARANCE} mm, ${found.length - failures.length} more under ${LIST_BELOW} mm`)
// Positions are strip coordinates (lib/outline.tsx).
for (const [key, w] of found) {
  const where = `near (${w.at.x.toFixed(2)}, ${(w.at.y - Y_SHIFT).toFixed(2)})`
  console.log(`  ${w.gap < MIN_CLEARANCE - EPS ? "FAIL" : "    "} ${Number.isFinite(w.gap) ? w.gap.toFixed(3) : "overlap"} ${key} ${where}`)
}
process.exit(failures.length ? 1 : 0)
