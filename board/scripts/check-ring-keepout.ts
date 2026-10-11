/// <reference types="node" />
// Checks the built board against the ring keepout (GLOSSARY.md): inside a nut's keepout, the
// ring face (tscircuit's bottom) may carry only that nut's own net, a way's load or the ground
// nut's GND. Vias and plated holes count on both faces. The keepout is a Ø10 ring round the nut
// and a 10 mm wide tongue running outboard, away from the yoke's centreline, on both arms.
// Reports the swung keepout, the goal, and fails on the straight-out keepout, the minimum.
// Run after a build: `bun run keepout`, or give it another circuit.json.

import { readFileSync } from "node:fs"

const RING_R = 5
const TONGUE_HALF = 5
/** How closely an edge of copper is walked. */
const STEP = 0.05

const circuit: any[] = JSON.parse(readFileSync(process.argv[2] ?? "dist/index/circuit.json", "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

type P = { x: number; y: number }
const sourcePort = new Map(of("source_port").map((p) => [p.source_port_id, p]))
const sourceComponent = new Map(of("source_component").map((p) => [p.source_component_id, p]))
const pcbPort = new Map(of("pcb_port").map((p) => [p.pcb_port_id, p]))
const sourceTrace = new Map(of("source_trace").map((p) => [p.source_trace_id, p]))
const netByKey = new Map(of("source_net").map((n) => [n.subcircuit_connectivity_map_key, n.name]))
const netById = new Map(of("source_net").map((n) => [n.source_net_id, n.name]))
const netName = (key?: string): string => (key && netByKey.get(key)) ?? key ?? "?"
const portOf = (e: any) => sourcePort.get(pcbPort.get(e.pcb_port_id)?.source_port_id)

/** A nut and the one net its ring may lie on. Its tongue runs out along `out`, ±1 in X. */
type Nut = { label: string; net: string; x: number; y: number; out: number }
const nuts: Nut[] = []
for (const h of of("pcb_plated_hole")) {
  const port = portOf(h)
  if (!/^N\d+$/.test(sourceComponent.get(port?.source_component_id)?.name ?? "")) continue
  const net = netName(port?.subcircuit_connectivity_map_key)
  const way = net.match(/^S(\d+)_LOAD$/)
  nuts.push({ label: way ? `way ${way[1]}` : "ground nut", net, x: h.x, y: h.y, out: Math.sign(h.x) })
}
nuts.sort((a, b) => (parseInt(a.label.slice(4)) || 99) - (parseInt(b.label.slice(4)) || 99))
const ways = nuts.filter((n) => n.label !== "ground nut").length
if (ways !== 12 || nuts.length !== 13 || nuts[12].net !== "GND") {
  console.error(`keepout: expected twelve output nuts and a ground nut on GND, found ${nuts.map((n) => `${n.label} (${n.net})`).join(", ") || "none"}`)
  process.exit(2)
}

/** How far a point is inside `nut`'s keepout, swung ±`swing`°; negative outside it. */
const depthInside = (nut: Nut, swing: number, p: P) => {
  const along = (p.x - nut.x) * nut.out
  const across = p.y - nut.y
  const d = Math.hypot(along, across)
  // Angle from the tongue's straight-out direction, beyond the swing.
  const beyond = Math.abs(Math.atan2(across, along)) - (swing * Math.PI) / 180
  const tongue = beyond <= 0 ? TONGUE_HALF : beyond >= Math.PI / 2 ? -Infinity : TONGUE_HALF - d * Math.sin(beyond)
  return Math.max(RING_R - d, tongue)
}

/** Ring-face copper as points to test, each grown by `r`; `polygon` where it is a filled area. */
type Copper = { what: string; net: string; pts: P[]; r: number; polygon?: P[]; holes?: P[][] }
const copper: Copper[] = []

/** Points every STEP along a line or, when `closed`, round a polygon. */
const walk = (pts: P[], closed = false): P[] => {
  const out: P[] = [pts[0]]
  for (let i = 1; i < pts.length + (closed ? 1 : 0); i++) {
    const [a, b] = [pts[i - 1], pts[i % pts.length]]
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / STEP))
    for (let s = 1; s <= steps; s++) out.push({ x: a.x + ((b.x - a.x) * s) / steps, y: a.y + ((b.y - a.y) * s) / steps })
  }
  return out
}
const turn = (c: P, deg: number, pts: [number, number][]): P[] => {
  const [cos, sin] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)]
  return pts.map(([x, y]) => ({ x: c.x + x * cos - y * sin, y: c.y + x * sin + y * cos }))
}

for (const h of of("pcb_plated_hole")) {
  const port = portOf(h)
  const what = `${sourceComponent.get(port?.source_component_id)?.name ?? "?"} hole`
  const net = netName(port?.subcircuit_connectivity_map_key)
  if (h.shape === "circle") {
    copper.push({ what, net, pts: [{ x: h.x, y: h.y }], r: h.outer_diameter / 2 })
    continue
  }
  // A pill or a pad round a hole: a line down its length, grown by half its width.
  const [w, l] = [h.outer_width ?? h.rect_pad_width, h.outer_height ?? h.rect_pad_height]
  const r = Math.min(w, l) / 2
  const ends: [number, number][] = w > l ? [[-(w / 2 - r), 0], [w / 2 - r, 0]] : [[0, -(l / 2 - r)], [0, l / 2 - r]]
  copper.push({ what, net, pts: walk(turn(h, h.ccw_rotation ?? 0, ends)), r })
}
for (const v of of("pcb_via")) {
  copper.push({ what: "via", net: netName(v.subcircuit_connectivity_map_key), pts: [{ x: v.x, y: v.y }], r: v.outer_diameter / 2 })
}
for (const t of of("pcb_trace")) {
  const source = sourceTrace.get(t.source_trace_id)
  const net = netName(source?.subcircuit_connectivity_map_key)
  for (let i = 1; i < t.route.length; i++) {
    const [a, b] = [t.route[i - 1], t.route[i]]
    if (a.route_type !== "wire" || b.route_type !== "wire" || a.layer !== "bottom" || b.layer !== "bottom") continue
    copper.push({ what: `trace ${source?.display_name ?? t.pcb_trace_id}`, net, pts: walk([a, b]), r: a.width / 2 })
  }
}
for (const p of of("pcb_smtpad")) {
  if (p.layer !== "bottom") continue
  const port = portOf(p)
  const component = sourceComponent.get(port?.source_component_id)?.name
  const pad = { what: `${component}.${port?.name} pad`, net: netName(port?.subcircuit_connectivity_map_key) }
  if (p.shape === "circle") copper.push({ ...pad, pts: [{ x: p.x, y: p.y }], r: p.radius })
  else if (p.shape === "polygon") copper.push({ ...pad, pts: walk(p.points, true), r: 0, polygon: p.points })
  else if (p.shape.includes("pill")) {
    const r = Math.min(p.width, p.height) / 2
    const ends: [number, number][] = p.width > p.height ? [[-(p.width / 2 - r), 0], [p.width / 2 - r, 0]] : [[0, -(p.height / 2 - r)], [0, p.height / 2 - r]]
    copper.push({ ...pad, pts: walk(turn(p, p.ccw_rotation ?? 0, ends)), r })
  } else {
    const [w, h] = [p.width / 2, p.height / 2]
    const polygon = turn(p, p.ccw_rotation ?? 0, [[-w, -h], [w, -h], [w, h], [-w, h]])
    copper.push({ ...pad, pts: walk(polygon, true), r: 0, polygon })
  }
}
for (const p of of("pcb_copper_pour")) {
  if (p.layer !== "bottom") continue
  const pour = { what: "pour", net: netById.get(p.source_net_id) ?? "?" }
  if (p.shape === "rect") {
    const [w, h] = [p.width / 2, p.height / 2]
    const polygon = turn(p.center, p.rotation ?? 0, [[-w, -h], [w, -h], [w, h], [-w, h]])
    copper.push({ ...pour, pts: walk(polygon, true), r: 0, polygon })
    continue
  }
  const polygon: P[] = p.shape === "polygon" ? p.points : p.brep_shape.outer_ring.vertices
  const holes: P[][] = p.shape === "polygon" ? [] : (p.brep_shape.inner_rings ?? []).map((ring: any) => ring.vertices)
  copper.push({ ...pour, pts: [polygon, ...holes].flatMap((ring) => walk(ring, true)), r: 0, polygon, holes })
}

const inside = (p: P, polygon: P[]) => {
  let hit = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [a, b] = [polygon[i], polygon[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit
  }
  return hit
}

let failed = false
for (const [swing, label, fatal] of [
  [0, "straight-out", true],
  [20, "swung ±20°", false],
  [39, "swung ±39°, where it costs nothing", false],
] as const) {
  const hits = new Map<string, number>()
  for (const nut of nuts) {
    for (const c of copper) {
      if (c.net === nut.net) continue
      let depth = -Infinity
      for (const p of c.pts) depth = Math.max(depth, depthInside(nut, swing, p) + c.r)
      // An area whose edge is nowhere near can still cover the nut itself.
      if (c.polygon && inside(nut, c.polygon) && !c.holes?.some((hole) => inside(nut, hole))) depth = Math.max(depth, RING_R)
      if (depth <= 0) continue
      const k = `${nut.label}: ${c.net} ${c.what}`
      hits.set(k, Math.max(hits.get(k) ?? 0, depth))
    }
  }
  console.log(`${label} keepout: ${hits.size ? `${hits.size} intrusions` : "clear"}`)
  for (const [k, depth] of hits) console.log(`  ${k}, ${depth.toFixed(2)} mm in`)
  if (fatal && hits.size) failed = true
}
process.exit(failed ? 1 : 0)
