/// <reference types="node" />
// A 1:1 SVG of the yoke for the fit check on a real panel, seen from the ring face as fitted,
// chin down. Print at 100 % (no "fit to page"). To 3D print the plate, use fit-plate.ts's STL
// instead.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs"

const circuit: any[] = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)

// Ring face view: mirror X, and SVG Y runs down.
const vx = (x: number) => -x
const vy = (y: number) => -y
const f = (n: number) => n.toFixed(3)

const board = of("pcb_board")[0]
const MARGIN = 10
const W = board.width + 2 * MARGIN
const TOP = -board.height / 2 - MARGIN
const H = board.height + MARGIN + 46

const out: string[] = []
const path = board.outline.map((p: any, i: number) => `${i ? "L" : "M"}${f(vx(p.x))} ${f(vy(p.y))}`).join(" ") + " Z"
out.push(`<path d="${path}" class="cut"/>`)

for (const c of of("pcb_cutout")) {
  out.push(`<rect x="${f(vx(c.center.x) - c.width / 2)}" y="${f(vy(c.center.y) - c.height / 2)}" width="${c.width}" height="${c.height}" class="cut"/>`)
}
for (const h of [...of("pcb_hole"), ...of("pcb_plated_hole")]) {
  if ((h.shape ?? h.hole_shape) === "pill") {
    if ((h.ccw_rotation ?? 0) % 90 !== 0) throw new Error(`unhandled slot turned ${h.ccw_rotation}`)
    const turned = (h.ccw_rotation ?? 0) % 180 !== 0
    const [w, l] = turned ? [h.hole_height, h.hole_width] : [h.hole_width, h.hole_height]
    out.push(`<rect x="${f(vx(h.x) - w / 2)}" y="${f(vy(h.y) - l / 2)}" width="${f(w)}" height="${f(l)}" rx="${f(Math.min(w, l) / 2)}" class="cut"/>`)
    continue
  }
  out.push(`<circle cx="${f(vx(h.x))}" cy="${f(vy(h.y))}" r="${h.hole_diameter / 2}" class="cut"/>`)
  if (h.outer_diameter) out.push(`<circle cx="${f(vx(h.x))}" cy="${f(vy(h.y))}" r="${h.outer_diameter / 2}" class="pad"/>`)
}
for (const p of of("pcb_smtpad").filter((p) => p.layer === "top" && p.shape === "rect")) {
  out.push(`<rect x="${f(vx(p.x) - p.width / 2)}" y="${f(vy(p.y) - p.height / 2)}" width="${p.width}" height="${p.height}" class="under"/>`)
}

// Scale check: a 50 mm bar and a 20 mm square, measured with a rule after printing.
const sy = board.height / 2 + 12
const sx = -board.width / 2
out.push(`<line x1="${f(sx)}" y1="${f(sy)}" x2="${f(sx + 50)}" y2="${f(sy)}" class="cut"/>`)
out.push(`<text x="${f(sx)}" y="${f(sy + 4)}">50 mm</text>`)
out.push(`<rect x="${f(sx + 60)}" y="${f(sy - 4)}" width="20" height="20" class="cut"/>`)
out.push(`<text x="${f(sx + 60)}" y="${f(sy + 19)}">20 mm square</text>`)
out.push(`<text x="${f(sx)}" y="${f(sy + 25)}">Blade Reader rev B, ring face up. Print at 100 %.</text>`)
out.push(`<text x="${f(sx)}" y="${f(sy + 29)}">Dashed: parts-face pads, underneath.</text>`)

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${f(W)}mm" height="${f(H)}mm" viewBox="${f(-W / 2)} ${f(TOP)} ${f(W)} ${f(H)}">
<style>
.cut{fill:none;stroke:#000;stroke-width:0.2}
.pad{fill:none;stroke:#b06000;stroke-width:0.15}
.under{fill:none;stroke:#888;stroke-width:0.1;stroke-dasharray:0.6 0.4}
text{font:2.5px sans-serif;fill:#000}
</style>
${out.join("\n")}
</svg>
`
mkdirSync("fab", { recursive: true })
writeFileSync("fab/blade-reader-fit-print.svg", svg)
console.log("wrote fab/blade-reader-fit-print.svg")
