/// <reference types="node" />
// Finishes the solder paste in a built circuit.json, in place, before the Gerbers are exported
// from it: replaces tscircuit's paste (70 % of every pad, and a disc over every plated hole) with
// an aperture just inside each placed part's pad and a ring on each nut's land, then checks them. Exits 1 on a failure.
//
// Usage: bun scripts/paste.ts [circuit.json] [gerber dir]. Given a Gerber directory, it also
// checks the exported layers against the circuit.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"

const [file = "dist/index/circuit.json", gerbers] = process.argv.slice(2)

type Pt = { x: number; y: number }
type Poly = Pt[]

// The figures and their sources are in docs/design.md under Solder paste.
/** How far each aperture sits inside its pad, per side. */
const INSET = 0.025
/** An aperture never opens less of its pad than this. */
const MIN_COVER = 0.8

/** The output nut's paste: arcs of a ring on its land, clear of the hole. */
const NUT = { inner: 3.5, outer: 4.5, segments: 4, gap: 0.6 }

let circuit: any[] = JSON.parse(readFileSync(file, "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)
const sources: Record<string, any> = Object.fromEntries(of("source_component").map((s) => [s.source_component_id, s]))
const components: Record<string, any> = Object.fromEntries(of("pcb_component").map((c) => [c.pcb_component_id, c]))
const source = (id: string) => sources[components[id]?.source_component_id]
const name = (id: string): string => source(id)?.name ?? "?"
/** JLC places it: only a placed part's pads are pasted. */
const placed = (id: string) => !!source(id)?.supplier_part_numbers?.jlcpcb?.length && !components[id].do_not_place

const turn = (p: Pt, c: Pt, deg: number): Pt => {
  const a = (deg * Math.PI) / 180
  return { x: c.x + p.x * Math.cos(a) - p.y * Math.sin(a), y: c.y + p.x * Math.sin(a) + p.y * Math.cos(a) }
}
const arc = (r: number, from: number, to: number, n: number): Poly =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / n
    return { x: r * Math.cos(a), y: r * Math.sin(a) }
  })
/** A w × h rectangle about the origin with corners of radius r. */
const rounded = (w: number, h: number, r: number): Poly => {
  if (r <= 0) return [-1, 1].flatMap((sy) => [-sy, sy].map((sx) => ({ x: (sx * w) / 2, y: (sy * h) / 2 })))
  const q = Math.PI / 2
  return [0, 1, 2, 3].flatMap((i) => {
    const cx = (i === 0 || i === 3 ? 1 : -1) * (w / 2 - r)
    const cy = (i < 2 ? 1 : -1) * (h / 2 - r)
    return arc(r, i * q, (i + 1) * q, 8).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  })
}
const area = (poly: Poly) =>
  Math.abs(poly.reduce((s, p, i) => s + p.x * poly[(i + 1) % poly.length].y - poly[(i + 1) % poly.length].x * p.y, 0)) / 2

/** A pad's outline, drawn `inset` inside its edge. */
const outline = (p: any, inset = 0): Poly => {
  if (p.shape === "polygon") {
    if (!inset) return p.points
    // Pull each vertex towards the centroid: close enough to an inset for a near-square pad.
    const c = { x: 0, y: 0 }
    for (const q of p.points) (c.x += q.x / p.points.length), (c.y += q.y / p.points.length)
    return p.points.map((q: Pt) => {
      const d = Math.hypot(q.x - c.x, q.y - c.y)
      return { x: c.x + ((q.x - c.x) * (d - inset * Math.SQRT2)) / d, y: c.y + ((q.y - c.y) * (d - inset * Math.SQRT2)) / d }
    })
  }
  const round = p.shape === "circle"
  const w = (round ? p.radius * 2 : p.width) - 2 * inset
  const h = (round ? p.radius * 2 : p.height) - 2 * inset
  const r = round || p.shape.endsWith("pill") ? Math.min(w, h) / 2 : 0
  return rounded(w, h, r).map((q) => turn(q, p, p.ccw_rotation ?? 0))
}

// Gerber's rotation command (%LR%) is one some CAM tools ignore, and tscircuit flashes a pad
// turned a quarter with it. Such a pad is the same rectangle with its sides swapped.
for (const p of of("pcb_smtpad")) {
  if (p.shape !== "rotated_rect" || p.ccw_rotation % 90 !== 0) continue
  if (p.ccw_rotation % 180 !== 0) [p.width, p.height] = [p.height, p.width]
  p.shape = "rect"
  delete p.ccw_rotation
}

const pads = of("pcb_smtpad")
const paste: any[] = []
const add = (pad: any, points: Poly) =>
  paste.push({
    type: "pcb_solder_paste",
    pcb_solder_paste_id: `pcb_solder_paste_${paste.length}`,
    shape: "polygon",
    layer: pad.layer,
    points,
    pcb_component_id: pad.pcb_component_id,
    ...(pad.pcb_smtpad_id ? { pcb_smtpad_id: pad.pcb_smtpad_id } : {}),
  })
for (const pad of pads) {
  if (!placed(pad.pcb_component_id)) continue
  add(pad, outline(pad, INSET))
}
// A nut's land is round. The USB socket's stake slots are plated holes too, and take no paste.
const nuts = of("pcb_plated_hole").filter((h) => h.shape === "circle" && placed(h.pcb_component_id))
for (const nut of nuts) {
  const step = (2 * Math.PI) / NUT.segments
  for (let i = 0; i < NUT.segments; i++) {
    // The gap is the same width at both radii, so each end of a segment is a chord offset.
    const ends = (r: number) => [i * step + Math.asin(NUT.gap / 2 / r), (i + 1) * step - Math.asin(NUT.gap / 2 / r)]
    const [a0, a1] = ends(NUT.outer)
    const [b0, b1] = ends(NUT.inner)
    const points = [...arc(NUT.outer, a0, a1, 16), ...arc(NUT.inner, b1, b0, 16)].map((p) => ({ x: nut.x + p.x, y: nut.y + p.y }))
    add({ layer: components[nut.pcb_component_id].layer, pcb_component_id: nut.pcb_component_id }, points)
  }
}
circuit = [...circuit.filter((e) => e.type !== "pcb_solder_paste"), ...paste]
writeFileSync(file, JSON.stringify(circuit, null, 2))

const fails: string[] = []
const at = (p: Pt) => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`
const inside = (p: Pt, poly: Poly) => {
  let c = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [a, b] = [poly[i], poly[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c
  }
  return c
}
const segDist = (p: Pt, a: Pt, b: Pt) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
/** Distance from a point to a polygon; 0 inside it. */
const reach = (p: Pt, poly: Poly) =>
  inside(p, poly) ? 0 : Math.min(...poly.map((a, i) => segDist(p, a, poly[(i + 1) % poly.length])))

// No part is placed on the ring face, so nothing is pasted there.
for (const s of paste) if (s.layer !== "top") fails.push(`paste on the ${s.layer} layer at ${at(s.points[0])}`)

// Paste stays out of every drilled hole, and off a land that takes no part (a way-screw hole).
// A slot is taken as a circle of its length.
const holes = [
  ...of("pcb_plated_hole").map((h) => ({
    ...h,
    r: (h.shape !== "circle" ? Math.max(h.hole_width, h.hole_height) : placed(h.pcb_component_id) ? h.hole_diameter : h.outer_diameter) / 2,
  })),
  ...of("pcb_hole").map((h) => ({ ...h, r: h.hole_diameter / 2 })),
  ...of("pcb_via").map((h) => ({ ...h, r: h.hole_diameter / 2 })),
]
for (const s of paste) {
  for (const h of holes) {
    if (reach(h, s.points) < h.r) fails.push(`${name(s.pcb_component_id)} paste at ${at(s.points[0])} is over the hole at ${at(h)}`)
  }
}

// Each aperture lies on its own pad, and opens enough of it.
const byId = Object.fromEntries(pads.map((p) => [p.pcb_smtpad_id, p]))
const pasted = new Set<string>()
for (const s of paste) {
  const who = name(s.pcb_component_id)
  if (!placed(s.pcb_component_id)) fails.push(`${who} is not placed, but is pasted at ${at(s.points[0])}`)
  const pad = byId[s.pcb_smtpad_id]
  if (!pad) continue
  pasted.add(pad.pcb_smtpad_id)
  const land = outline(pad)
  const off = Math.max(...s.points.map((p: Pt) => (inside(p, land) ? 0 : reach(p, land))))
  if (off > 1e-6) fails.push(`${who} paste at ${at(pad)} runs ${off.toFixed(3)} off its pad`)
  const cover = area(s.points) / area(land)
  if (cover < MIN_COVER) fails.push(`${who} paste at ${at(pad)} opens ${(cover * 100).toFixed(0)} % of its pad`)
}
for (const pad of pads) {
  if (placed(pad.pcb_component_id) && !pasted.has(pad.pcb_smtpad_id)) fails.push(`${name(pad.pcb_component_id)} pad at ${at(pad)} has no paste`)
}
for (const nut of nuts) {
  const ring = paste.filter((s) => s.pcb_component_id === nut.pcb_component_id && !s.pcb_smtpad_id)
  if (ring.length !== NUT.segments) fails.push(`${name(nut.pcb_component_id)} has ${ring.length} paste segments`)
  for (const s of ring) {
    const far = Math.max(...s.points.map((p: Pt) => Math.hypot(p.x - nut.x, p.y - nut.y)))
    if (far > nut.outer_diameter / 2 + 1e-6) fails.push(`${name(nut.pcb_component_id)} paste runs off its land`)
  }
}

if (gerbers) {
  const read = (layer: string) => {
    const path = `${gerbers}/${layer}`
    if (!existsSync(path)) fails.push(`${path} missing`)
    return existsSync(path) ? readFileSync(path, "utf8").split("\n") : []
  }
  // Paste is exported as regions only: one per aperture on the parts face, none on the ring face.
  for (const [layer, want] of [["F_Paste.gbr", paste.length], ["B_Paste.gbr", 0]] as const) {
    const lines = read(layer)
    const regions = lines.filter((l) => l.startsWith("G36")).length
    const flashes = lines.filter((l) => /D03\*$/.test(l)).length
    if (regions !== want || flashes) fails.push(`${layer} has ${regions} regions and ${flashes} flashes; expected ${want} and 0`)
  }
  for (const layer of readdirSync(gerbers).filter((f) => f.endsWith(".gbr"))) {
    if (read(layer).some((l) => /^%LR(?!0\*%)/.test(l))) fails.push(`${layer} uses the %LR% rotation command`)
  }
  // tscircuit's fabrication layer draws with a zero-size aperture, past the board edge.
  if (existsSync(`${gerbers}/F_Fab.gbr`)) fails.push(`${gerbers}/F_Fab.gbr should not be sent`)
}

const total = paste.reduce((s, p) => s + area(p.points), 0)
console.log(`paste: ${paste.length} apertures, ${total.toFixed(1)} mm² on the parts face; ${nuts.length} nuts ringed`)
if (fails.length) {
  console.error(fails.join("\n"))
  process.exit(1)
}
