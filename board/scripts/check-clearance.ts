/// <reference types="node" />
// Checks the built board's hand routing. Fails if copper of two nets on one face is closer than
// 0.15 mm: pads, vias, plated holes and traces. Pours clear other nets by themselves, so they
// are not measured. Then lists every net that is still in more than one piece, counting a pad
// or via inside a pour of its own net as joined to it, which the build's own check does not.
// That list doesn't fail the check while part of the board is unrouted.
// Run after a routed build: `bun run clearance`.

import { readFileSync } from "node:fs"
import { Y_SHIFT } from "../lib/outline"

const MIN = 0.15

const circuit: any[] = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

type P = { x: number; y: number }
/** A point, a segment or a polygon, grown by `r`. Coordinates are the strip's (lib/outline.tsx). */
type Shape = { net: string; layer: string; what: string; pts: P[]; r: number }

const strip = ({ x, y }: P): P => ({ x, y: y - Y_SHIFT })
const sourcePort = new Map(of("source_port").map((p) => [p.source_port_id, p]))
const sourceComponent = new Map(of("source_component").map((p) => [p.source_component_id, p]))
const pcbPort = new Map(of("pcb_port").map((p) => [p.pcb_port_id, p]))
const sourceTrace = new Map(of("source_trace").map((p) => [p.source_trace_id, p]))
const netByKey = new Map(of("source_net").map((n) => [n.subcircuit_connectivity_map_key, n.name]))
const netById = new Map(of("source_net").map((n) => [n.source_net_id, n.name]))
const netName = (key?: string) => (key && netByKey.get(key)) ?? key

const shapes: Shape[] = []
for (const p of of("pcb_smtpad")) {
  const port = sourcePort.get(pcbPort.get(p.pcb_port_id)?.source_port_id)
  const component = sourceComponent.get(port?.source_component_id)?.name
  const what = `${component}.${port?.name}`
  // An unconnected pad is a net of its own, except against its own part's pads.
  const net = netName(port?.subcircuit_connectivity_map_key) ?? `unconnected:${component}`
  const pad = { net, layer: p.layer, what }
  if (p.shape === "polygon") shapes.push({ ...pad, pts: p.points.map(strip), r: 0 })
  else if (p.shape === "circle") shapes.push({ ...pad, pts: [strip(p)], r: p.radius })
  else {
    const turned = Math.abs((p.ccw_rotation ?? 0) % 180) === 90
    const [w, h] = turned ? [p.height, p.width] : [p.width, p.height]
    const c = strip(p)
    if (p.shape.includes("pill")) {
      const r = Math.min(w, h) / 2
      const [dx, dy] = w > h ? [w / 2 - r, 0] : [0, h / 2 - r]
      shapes.push({ ...pad, pts: [{ x: c.x - dx, y: c.y - dy }, { x: c.x + dx, y: c.y + dy }], r })
    } else {
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => ({ x: c.x + (sx * w) / 2, y: c.y + (sy * h) / 2 }))
      shapes.push({ ...pad, pts: corners, r: 0 })
    }
  }
}
for (const layer of ["top", "bottom"]) {
  for (const h of of("pcb_plated_hole")) {
    const port = sourcePort.get(pcbPort.get(h.pcb_port_id)?.source_port_id)
    const net = netName(port?.subcircuit_connectivity_map_key) ?? "?"
    shapes.push({ net, layer, what: "hole", pts: [strip(h)], r: (h.outer_diameter ?? h.outer_width) / 2 })
  }
  for (const v of of("pcb_via")) {
    shapes.push({ net: netName(v.subcircuit_connectivity_map_key) ?? "?", layer, what: "via", pts: [strip(v)], r: v.outer_diameter / 2 })
  }
}
for (const t of of("pcb_trace")) {
  const source = sourceTrace.get(t.source_trace_id)
  const net = netName(source?.subcircuit_connectivity_map_key) ?? "?"
  for (let i = 1; i < t.route.length; i++) {
    const [a, b] = [t.route[i - 1], t.route[i]]
    if (a.route_type !== "wire" || b.route_type !== "wire" || a.layer !== b.layer) continue
    shapes.push({ net, layer: a.layer, what: `trace ${source?.display_name ?? t.pcb_trace_id}`, pts: [strip(a), strip(b)], r: a.width / 2 })
  }
}

const pointToSegment = (p: P, a: P, b: P) => {
  const [dx, dy] = [b.x - a.x, b.y - a.y]
  const len = dx * dx + dy * dy
  const t = len ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
const crosses = (a: P, b: P, c: P, d: P) => {
  const side = (p: P, q: P, r: P) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b)
}
const segmentToSegment = (a: P, b: P, c: P, d: P) =>
  crosses(a, b, c, d) ? 0 : Math.min(pointToSegment(a, c, d), pointToSegment(b, c, d), pointToSegment(c, a, b), pointToSegment(d, a, b))
const edges = (s: Shape): [P, P][] =>
  s.pts.length < 3 ? [[s.pts[0], s.pts[s.pts.length - 1]]] : s.pts.map((p, i) => [p, s.pts[(i + 1) % s.pts.length]])
const inside = (p: P, polygon: P[]) => {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = [polygon[i], polygon[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}
/** The gap between two shapes' copper; negative when they overlap. */
const gap = (s: Shape, t: Shape) => {
  if (s.pts.length > 2 && inside(t.pts[0], s.pts)) return -1
  if (t.pts.length > 2 && inside(s.pts[0], t.pts)) return -1
  let d = Infinity
  for (const [a, b] of edges(s)) for (const [c, e] of edges(t)) d = Math.min(d, segmentToSegment(a, b, c, e))
  return d - s.r - t.r
}

// ── Clearance ────────────────────────────────────────────────────────────────────────────────
const close = new Map<string, number>()
for (let i = 0; i < shapes.length; i++) {
  for (let j = i + 1; j < shapes.length; j++) {
    const [s, t] = [shapes[i], shapes[j]]
    if (s.layer !== t.layer || s.net === t.net) continue
    const d = gap(s, t)
    // Coordinates are sums of decimals, so a drawn 0.15 can come out a hair under.
    if (d >= MIN - 1e-6) continue
    const key = `${s.layer}: ${s.what} (${s.net}) to ${t.what} (${t.net})`
    close.set(key, Math.min(close.get(key) ?? Infinity, d))
  }
}
console.log(`clearance under ${MIN} mm: ${close.size || "none"}`)
for (const [key, d] of [...close].sort((a, b) => a[1] - b[1])) console.log(`  ${d.toFixed(3)} mm  ${key}`)

// ── Connectivity ─────────────────────────────────────────────────────────────────────────────
const pours = of("pcb_copper_pour").map((p, i) => ({
  id: `pour ${i}`,
  net: netById.get(p.source_net_id),
  layer: p.layer,
  outer: p.brep_shape.outer_ring.vertices.map(strip) as P[],
  holes: (p.brep_shape.inner_rings ?? []).map((r: any) => r.vertices.map(strip)) as P[][],
}))
const parent = new Map<string, string>()
const find = (a: string): string => {
  const p = parent.get(a) ?? a
  if (p === a) return a
  const root = find(p)
  parent.set(a, root)
  return root
}
const join = (a: string, b: string) => parent.set(find(a), find(b))

// A via or plated hole is one node on both faces.
const nodes = shapes.map((s, i) => ({ id: `shape ${i}`, shape: s }))
const through = new Map<string, string>()
for (const n of nodes) {
  const s = n.shape
  if (s.what !== "via" && s.what !== "hole") continue
  const key = `${s.pts[0].x},${s.pts[0].y}`
  const other = through.get(key)
  if (other) join(n.id, other)
  else through.set(key, n.id)
}
for (let i = 0; i < nodes.length; i++) {
  for (let j = i + 1; j < nodes.length; j++) {
    const [a, b] = [nodes[i].shape, nodes[j].shape]
    if (a.net === b.net && a.layer === b.layer && gap(a, b) <= 0.001) join(nodes[i].id, nodes[j].id)
  }
}
for (const n of nodes) {
  for (const p of pours) {
    if (p.net !== n.shape.net || p.layer !== n.shape.layer) continue
    if (n.shape.pts.some((q) => inside(q, p.outer) && !p.holes.some((h) => inside(q, h)))) join(n.id, p.id)
  }
}
const pieces = new Map<string, Map<string, string[]>>()
for (const n of nodes) {
  const s = n.shape
  if (s.what === "via" || s.what.startsWith("trace") || s.net.startsWith("unconnected:")) continue
  const byRoot = pieces.get(s.net) ?? new Map<string, string[]>()
  pieces.set(s.net, byRoot)
  byRoot.set(find(n.id), [...(byRoot.get(find(n.id)) ?? []), s.what])
}
const split = [...pieces].filter(([, byRoot]) => byRoot.size > 1)
console.log(`nets in more than one piece: ${split.length || "none"}`)
for (const [net, byRoot] of split) {
  console.log(`  ${net}: ${byRoot.size} pieces`)
  for (const pads of [...byRoot.values()].sort((a, b) => b.length - a.length)) {
    console.log(`    ${pads.length > 8 ? `${pads.slice(0, 8).join(" ")} … (${pads.length})` : pads.join(" ")}`)
  }
}

process.exit(close.size ? 1 : 0)
