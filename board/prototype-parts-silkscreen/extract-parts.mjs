// PROTOTYPE (issue #28): pulls the parts face (tscircuit's top layer) out of circuit.json into
// SVG-ready mm, seen from the parts face without mirroring: x = X + 52.01, y = 19.25 − Y, so the
// fingers point down and way 1 is on the right.
import fs from "fs"
const [src, out] = process.argv.slice(2)
const d = JSON.parse(fs.readFileSync(src, "utf8"))
const r3 = v => Math.round(v * 1000) / 1000
const P = p => [r3(p.x + 52.01), r3(19.25 - p.y)]
const by = t => d.filter(e => e.type === t)
const srcName = Object.fromEntries(by("source_component").map(s => [s.source_component_id, s.name]))
const comp = Object.fromEntries(by("pcb_component").map(c => [c.pcb_component_id, srcName[c.source_component_id]]))
const rot = (cx, cy, w, h, deg) => {
  const a = (-deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a)
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [r3(cx + x * c - y * s), r3(cy + x * s + y * c)])
}
const board = by("pcb_board")[0]
const pads = by("pcb_smtpad").filter(p => p.layer === "top").map(p => {
  const name = comp[p.pcb_component_id], pin = (p.port_hints || [])[0]
  const [x, y] = P(p)
  if (p.shape === "circle") return { n: name, pin, c: [x, y, r3(p.radius)] }
  if (p.shape === "polygon") return { n: name, pin, poly: p.points.map(P) }
  const r = p.shape === "rotated_pill" ? p.radius : p.corner_radius || 0
  return { n: name, pin, poly: rot(x, y, p.width, p.height, p.ccw_rotation || 0), r: r3(r), w: p.width, h: p.height, deg: p.ccw_rotation || 0, x, y }
})
const comps = by("pcb_component").filter(c => srcName[c.source_component_id]).map(c => {
  const [x, y] = P(c.center)
  return { n: srcName[c.source_component_id], x, y, w: r3(c.width), h: r3(c.height), rot: c.rotation }
})
const geom = {
  outline: board.outline.map(P),
  holes: by("pcb_plated_hole").map(h => ({ x: P(h)[0], y: P(h)[1], r: r3(h.outer_diameter / 2), h: r3(h.hole_diameter / 2), n: comp[h.pcb_component_id] })),
  slots: by("pcb_cutout").map(c => ({ x: P(c.center)[0], y: P(c.center)[1], w: c.width, h: c.height })),
  pours: by("pcb_copper_pour").filter(p => p.layer === "top").map(p => [p.brep_shape.outer_ring, ...(p.brep_shape.inner_rings || [])].map(r => r.vertices.map(P))),
  vias: by("pcb_via").map(v => [...P(v), r3(v.outer_diameter / 2)]),
  pads,
  courtyards: [
    ...by("pcb_courtyard_rect").map(c => ({ n: comp[c.pcb_component_id], poly: rot(...P(c.center), c.width, c.height, c.ccw_rotation || 0) })),
    ...by("pcb_courtyard_outline").map(c => ({ n: comp[c.pcb_component_id], poly: c.outline.map(P) })),
  ],
  bodies: by("pcb_fabrication_note_path").filter(f => f.layer === "top").map(f => ({ n: comp[f.pcb_component_id], poly: f.route.map(P) })),
  // The footprints' own silk, as tscircuit draws it today: outlines, pin-1 marks and designators.
  silk: {
    paths: by("pcb_silkscreen_path").filter(s => s.layer === "top").map(s => ({ n: comp[s.pcb_component_id], w: s.stroke_width, pts: s.route.map(P) })),
    circles: by("pcb_silkscreen_circle").filter(s => s.layer === "top").map(s => ({ n: comp[s.pcb_component_id], c: [...P(s.center), r3(s.radius)], w: s.stroke_width })),
    text: by("pcb_silkscreen_text").filter(s => s.layer === "top").map(s => ({ n: comp[s.pcb_component_id], t: s.text, at: P(s.anchor_position), s: r3(s.font_size), rot: s.ccw_rotation || 0 })),
  },
  comps,
}
fs.writeFileSync(out, JSON.stringify(geom))
console.log(Object.entries(geom).map(([k, v]) => `${k} ${Array.isArray(v) ? v.length : Object.values(v).map(a => a.length)}`).join(", "))
