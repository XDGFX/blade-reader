/// <reference types="node" />
// A 1.6 mm STL of the bare board, with every hole and slot cut, to 3D print for the fit check on
// a real panel. The STEP from `bun run step` is a plain slab, so it can't be printed for this.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import earcut from "earcut"

type Pt = [number, number]

const THICKNESS = 1.6
const SEGMENTS = 64

// bun scripts/fit-plate.ts [circuit.json] [out.stl]
const [src = "dist/index/circuit.json", out = "fab/yoke-plate.stl"] = process.argv.slice(2)
const circuit: any[] = JSON.parse(readFileSync(src, "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

const area = (r: Pt[]) => r.reduce((a, [x, y], i) => {
  const [nx, ny] = r[(i + 1) % r.length]
  return a + x * ny - nx * y
}, 0) / 2
// Outline anticlockwise and holes clockwise, so every wall below faces outwards.
const wind = (r: Pt[], ccw: boolean) => (area(r) > 0 === ccw ? r : [...r].reverse())

const board = of("pcb_board")[0]
const outline = wind(board.outline.map((p: any): Pt => [p.x, p.y]), true)

const holes: Pt[][] = []
// A slot of length 0 is a round hole. Slots get round ends, as milled: square ones line up
// collinear edges that earcut triangulates into a non-manifold mesh.
const slot = (x: number, y: number, w: number, h: number): Pt[] => {
  const r = Math.min(w, h) / 2
  const [dx, dy] = w > h ? [w / 2 - r, 0] : [0, h / 2 - r]
  return Array.from({ length: SEGMENTS }, (_, i): Pt => {
    const a = (2 * Math.PI * i) / SEGMENTS
    const [cx, cy] = [Math.cos(a), Math.sin(a)]
    return [x + r * cx + Math.sign(cx) * dx, y + r * cy + Math.sign(cy) * dy]
  })
}
for (const c of of("pcb_cutout")) {
  if (c.shape !== "rect") throw new Error(`unhandled cutout shape ${c.shape}`)
  holes.push(slot(c.center.x, c.center.y, c.width, c.height))
}
for (const h of [...of("pcb_hole"), ...of("pcb_plated_hole")]) {
  if ((h.shape ?? h.hole_shape) !== "circle") throw new Error(`unhandled hole shape ${h.shape ?? h.hole_shape}`)
  holes.push(slot(h.x, h.y, h.hole_diameter, h.hole_diameter))
}

const rings = [outline, ...holes.map((r) => wind(r, false))]
const pts = rings.flat()
const holeStarts: number[] = []
let n = outline.length
for (const r of rings.slice(1)) {
  holeStarts.push(n)
  n += r.length
}
const caps = earcut(pts.flat(), holeStarts)

type V = [number, number, number]
const tris: [V, V, V][] = []
const at = (i: number, z: number): V => [pts[i][0], pts[i][1], z]
// earcut winds every triangle the same way, including zero-area ones along the slots' collinear
// edges, so take the winding from the cap's total area rather than triangle by triangle.
let capArea = 0
for (let i = 0; i < caps.length; i += 3) capArea += area([pts[caps[i]], pts[caps[i + 1]], pts[caps[i + 2]]])
for (let i = 0; i < caps.length; i += 3) {
  const [a, b, c] = [caps[i], caps[i + 1], caps[i + 2]]
  const [p, q] = capArea > 0 ? [b, c] : [c, b]
  tris.push([at(a, THICKNESS), at(p, THICKNESS), at(q, THICKNESS)])
  tris.push([at(a, 0), at(q, 0), at(p, 0)])
}
for (const r of rings) {
  r.forEach(([x, y], i) => {
    const [nx, ny] = r[(i + 1) % r.length]
    const [a, b, c, d]: V[] = [[x, y, 0], [nx, ny, 0], [nx, ny, THICKNESS], [x, y, THICKNESS]]
    tris.push([a, b, c], [a, c, d])
  })
}

const buf = Buffer.alloc(84 + 50 * tris.length)
buf.write("Blade Reader fit plate", 0)
buf.writeUInt32LE(tris.length, 80)
tris.forEach((t, i) => {
  const o = 84 + 50 * i
  const [[ax, ay, az], [bx, by, bz], [cx, cy, cz]] = t
  const [ux, uy, uz, vx, vy, vz] = [bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az]
  const nrm = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]
  const len = Math.hypot(...nrm) || 1
  ;[...nrm.map((v) => v / len), ...t.flat()].forEach((v, j) => buf.writeFloatLE(v, o + 4 * j))
})

mkdirSync("fab", { recursive: true })
writeFileSync(out, buf)
console.log(`wrote ${out}: ${rings.length - 1} holes and slots, ${tris.length} triangles`)
