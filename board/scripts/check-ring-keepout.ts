/// <reference types="node" />
// Checks the built board against the ring keepout (GLOSSARY.md): inside a way's keepout, the
// ring face (tscircuit's bottom) may carry only that way's load copper. Vias count on both faces.
// Reports the swung keepout, the goal, and fails on the straight-out keepout, the minimum.
// Run after a routed build: `bun run keepout`.

import { readFileSync } from "node:fs"
import { NUT_Y, wayX, Y_SHIFT } from "../lib/outline"

const circuit: any[] = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

const RING_R = 5
const TONGUE_HALF = 5

/** How far `p` (board coordinates) is inside the keepout of the nut at `cx`, swung ±`swing`°. */
const depthInside = (cx: number, swing: number, x: number, y: number) => {
  const dx = x - cx
  const dy = y - (NUT_Y + Y_SHIFT)
  const d = Math.hypot(dx, dy)
  const ring = RING_R - d
  // Angle from the tongue's straight-out direction (+Y), beyond the swing.
  const beyond = Math.abs(Math.atan2(dx, dy)) - (swing * Math.PI) / 180
  const tongue = beyond <= 0 ? TONGUE_HALF : beyond >= Math.PI / 2 ? -Infinity : TONGUE_HALF - d * Math.sin(beyond)
  return Math.max(ring, tongue)
}

const netName = new Map<string, string>()
for (const n of of("source_net")) netName.set(n.subcircuit_connectivity_map_key, n.name)
const portKey = new Map<string, string>()
const sourcePortKey = new Map(of("source_port").map((p) => [p.source_port_id, p.subcircuit_connectivity_map_key]))
for (const p of of("pcb_port")) portKey.set(p.pcb_port_id, sourcePortKey.get(p.source_port_id))
const pourKey = new Map(of("source_net").map((n) => [n.source_net_id, n.subcircuit_connectivity_map_key]))
const name = (key?: string) => (key && netName.get(key)) ?? key ?? "?"

type Copper = { what: string; key?: string; x: number; y: number; r: number }
const copper: Copper[] = []

for (const t of of("pcb_trace")) {
  const ends = t.route.flatMap((p: any) => [p.start_pcb_port_id, p.end_pcb_port_id]).filter(Boolean)
  const key = portKey.get(ends[0]) ?? portKey.get(t.connectsTo?.[0])
  for (let i = 1; i < t.route.length; i++) {
    const a = t.route[i - 1]
    const b = t.route[i]
    if (a.route_type !== "wire" || b.route_type !== "wire" || a.layer !== "bottom" || b.layer !== "bottom") continue
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.05))
    for (let s = 0; s <= steps; s++) {
      copper.push({ what: "trace", key, x: a.x + ((b.x - a.x) * s) / steps, y: a.y + ((b.y - a.y) * s) / steps, r: a.width / 2 })
    }
  }
}
for (const v of of("pcb_via")) copper.push({ what: "via", key: v.subcircuit_connectivity_map_key, x: v.x, y: v.y, r: v.outer_diameter / 2 })
for (const p of of("pcb_smtpad")) {
  if (p.layer !== "bottom") continue
  copper.push({ what: "pad", key: portKey.get(p.pcb_port_id), x: p.x, y: p.y, r: Math.max(p.width ?? 0, p.height ?? 0, 2 * (p.radius ?? 0)) / 2 })
}
for (const p of of("pcb_copper_pour")) {
  if (p.layer !== "bottom") continue
  for (const v of p.brep_shape.outer_ring.vertices) copper.push({ what: "pour", key: pourKey.get(p.source_net_id), x: v.x, y: v.y, r: 0 })
}

let failed = false
for (const [swing, label, fatal] of [
  [0, "straight-out", true],
  [20, "swung ±20°", false],
  [39, "swung ±39°, where it costs nothing", false],
] as const) {
  const hits = new Map<string, number>()
  for (let n = 1; n <= 6; n++) {
    const own = `S${n}_LOAD`
    for (const c of copper) {
      if (name(c.key) === own) continue
      const depth = depthInside(wayX(n), swing, c.x, c.y) + c.r
      if (depth <= 0) continue
      const k = `way ${n}: ${name(c.key)} ${c.what}`
      hits.set(k, Math.max(hits.get(k) ?? 0, depth))
    }
  }
  console.log(`${label} keepout: ${hits.size ? `${hits.size} intrusions` : "clear"}`)
  for (const [k, depth] of hits) console.log(`  ${k}, ${depth.toFixed(2)} mm in`)
  if (fatal && hits.size) failed = true
}
process.exit(failed ? 1 : 0)
