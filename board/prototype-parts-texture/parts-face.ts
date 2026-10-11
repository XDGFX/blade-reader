// PROTOTYPE, throwaway: takes on the yoke's parts-face silkscreen, for issue #86 follow-up.
// Run in board/, after a build: bun prototype-parts-texture/parts-face.ts, then open
// parts-face.html beside it and switch with ?variant=a|b|c or the bar at the bottom.
//
// Everything is drawn in the view's coordinates, in mm: the parts face as the board lies when it
// is turned over from the ring face, chin down. View x = −X and view y = Y of the PCB's.

import { readFileSync, writeFileSync } from "node:fs"
import { VARIANTS } from "./variants"
import type { Art } from "../lib/silkscreen"

type Pt = { x: number; y: number }
const f = (n: number) => n.toFixed(3)
const V = (p: Pt): Pt => ({ x: -p.x, y: p.y })

const circuit: any[] = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const of = (t: string) => circuit.filter((e) => e.type === t)
const names: Record<string, string> = Object.fromEntries(of("source_component").map((s) => [s.source_component_id, s.name]))
const comps = of("pcb_component")
const owner: Record<string, string> = Object.fromEntries(comps.map((c) => [c.pcb_component_id, names[c.source_component_id]]))

const C = { bench: "#d6d0c4", mask: "#0b0c0d", edge: "#3b3e42", silk: "#f4f3ee", tin: "#c9cdd1", body: "#2a2d31", bodyLine: "#4a4e54", hole: "#d6d0c4", label: "#e0a030" }

const d = (pts: Pt[], close = false) => `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join("L")}${close ? "Z" : ""}`
const rectPts = (cx: number, cy: number, w: number, h: number, deg = 0): Pt[] => {
  const a = (deg * Math.PI) / 180
  return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) =>
    V({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) }),
  )
}

const base = (bodies: boolean, labels: boolean) => {
  const out: string[] = []
  const board = of("pcb_board")[0]
  out.push(`<path d="${d(board.outline.map(V), true)}" fill="${C.mask}" stroke="${C.edge}" stroke-width="0.15"/>`)
  for (const p of of("pcb_smtpad").filter((p) => p.layer === "top")) {
    if (p.shape === "circle") { const c = V(p); out.push(`<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(p.radius)}" fill="${C.tin}"/>`) }
    else out.push(`<path d="${d(p.shape === "polygon" ? p.points.map(V) : rectPts(p.x, p.y, p.width, p.height, p.ccw_rotation ?? 0), true)}" fill="${C.tin}"/>`)
  }
  for (const h of of("pcb_plated_hole")) {
    const c = V(h)
    if (h.shape === "circle") out.push(`<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(h.outer_diameter / 2)}" fill="${C.tin}"/><circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(h.hole_diameter / 2)}" fill="${C.hole}"/>`)
    else out.push(`<rect x="${f(c.x - h.outer_width / 2)}" y="${f(c.y - h.outer_height / 2)}" width="${f(h.outer_width)}" height="${f(h.outer_height)}" rx="${f(h.outer_width / 2)}" fill="${C.tin}"/><rect x="${f(c.x - h.hole_width / 2)}" y="${f(c.y - h.hole_height / 2)}" width="${f(h.hole_width)}" height="${f(h.hole_height)}" rx="${f(h.hole_width / 2)}" fill="${C.hole}"/>`)
  }
  for (const h of of("pcb_hole")) { const c = V(h); out.push(`<circle cx="${f(c.x)}" cy="${f(c.y)}" r="${f(h.hole_diameter / 2)}" fill="${C.hole}"/>`) }
  if (bodies) {
    // Fitted parts, as their courtyards: what the silk has to be read around.
    const dnp = new Set(["J1", "J3", "TP4", "TP5", "TP6"])
    for (const c of of("pcb_courtyard_outline")) if (!dnp.has(owner[c.pcb_component_id])) out.push(`<path d="${d(c.outline.map(V), true)}" fill="${C.body}" fill-opacity="0.82" stroke="${C.bodyLine}" stroke-width="0.08"/>`)
    for (const c of of("pcb_courtyard_rect")) if (!dnp.has(owner[c.pcb_component_id])) out.push(`<path d="${d(rectPts(c.center.x, c.center.y, c.width, c.height, c.ccw_rotation ?? 0), true)}" fill="${C.body}" fill-opacity="0.82" stroke="${C.bodyLine}" stroke-width="0.08"/>`)
  }
  if (labels) for (const c of comps) { const p = V(c.center); out.push(`<text x="${f(p.x)}" y="${f(p.y)}" font-size="0.9" fill="${C.label}" text-anchor="middle" font-family="monospace">${owner[c.pcb_component_id]}</text>`) }
  return out.join("")
}

const silk = (a: Art) =>
  [
    ...a.strokes.map((s) => `<path d="${d(s.pts)}" fill="none" stroke="${C.silk}" stroke-width="${f(s.w)}" stroke-linecap="round" stroke-linejoin="round"/>`),
    ...a.fills.map((rings) => `<path d="${rings.map((r) => d(r, true)).join("")}" fill="${C.silk}" fill-rule="evenodd"/>`),
  ].join("")

const sheet = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-66 -60 132 120"><rect x="-66" y="-60" width="132" height="120" fill="${C.bench}"/>${inner}</svg>`

const dir = "prototype-parts-texture"
writeFileSync(`${dir}/base.svg`, sheet(base(true, true)))
for (const [key, v] of Object.entries(VARIANTS)) {
  writeFileSync(`${dir}/${key}-bare.svg`, sheet(base(false, false) + silk(v.art)))
  writeFileSync(`${dir}/${key}.svg`, sheet(base(true, false) + silk(v.art)))
}
console.log(`wrote ${Object.keys(VARIANTS).length} variants`)

// A rough clearance count, 0.25 from top pads and holes by sampled points; scripts/silk.ts is the real check.
const boxes = [
  ...of("pcb_smtpad").filter((p) => p.layer === "top" && p.shape !== "circle").map((p) => {
    const q = p.shape === "polygon" ? p.points.map(V) : rectPts(p.x, p.y, p.width, p.height, p.ccw_rotation ?? 0)
    const xs = q.map((p: Pt) => p.x), ys = q.map((p: Pt) => p.y)
    return { n: owner[p.pcb_component_id], x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
  }),
]
const rounds = [
  ...of("pcb_smtpad").filter((p) => p.layer === "top" && p.shape === "circle").map((p) => ({ n: owner[p.pcb_component_id], ...V(p), r: p.radius })),
  ...of("pcb_plated_hole").map((h) => ({ n: owner[h.pcb_component_id], ...V(h), r: (h.outer_diameter ?? Math.max(h.outer_width, h.outer_height)) / 2 })),
  ...of("pcb_hole").map((h) => ({ n: "hole", ...V(h), r: h.hole_diameter / 2 })),
]
for (const [key, v] of Object.entries(VARIANTS)) {
  const hits = new Map<string, number>()
  const test = (p: Pt, half: number) => {
    for (const b of boxes) {
      const g = Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.y0 - p.y, 0, p.y - b.y1)) - half
      if (g < 0.25 - 1e-6) hits.set(b.n, Math.min(hits.get(b.n) ?? 9, g))
    }
    for (const c of rounds) {
      const g = Math.hypot(p.x - c.x, p.y - c.y) - c.r - half
      if (g < 0.25 - 1e-6) hits.set(c.n, Math.min(hits.get(c.n) ?? 9, g))
    }
  }
  const walk = (pts: Pt[], half: number, closed: boolean) => {
    const n = closed ? pts.length : pts.length - 1
    for (let i = 0; i < Math.max(n, 1); i++) {
      const [a, b] = [pts[i], pts[(i + 1) % pts.length]]
      const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 0.05))
      for (let k = 0; k <= steps; k++) test({ x: a.x + ((b.x - a.x) * k) / steps, y: a.y + ((b.y - a.y) * k) / steps }, half)
    }
  }
  for (const s of v.art.strokes) walk(s.pts, s.w / 2, false)
  for (const g of v.art.fills) for (const r of g) walk(r, 0, true)
  console.log(key, hits.size ? [...hits].map(([n, g]) => `${n} ${g.toFixed(2)}`).join(", ") : "clear of every pad")
}

const meta = Object.entries(VARIANTS).map(([key, v]) => ({ key, name: v.name, notes: v.notes }))
writeFileSync(
  `${dir}/parts-face.html`,
  `<!doctype html><meta charset="utf-8"><title>PROTOTYPE: yoke parts-face silkscreen (#86 follow-up)</title>
<style>
body{margin:0;background:#1b1c1e;color:#eee;font:14px/1.4 system-ui}
header{padding:10px 16px}header b{font-size:16px}#notes{color:#bbb;max-width:110ch}
#stage{overflow:auto;height:calc(100vh - 150px);text-align:center}#stage img{width:var(--w,100%)}
footer{position:fixed;bottom:0;left:0;right:0;background:#000c;padding:8px;display:flex;gap:8px;justify-content:center;align-items:center}
button{font:inherit;padding:6px 14px;border-radius:6px;border:1px solid #666;background:#2a2b2e;color:#eee;cursor:pointer}
button.on{background:#f4f3ee;color:#111}
</style>
<header><b>PROTOTYPE · a texture across the parts face, seen chin down</b> <span id="state"></span><div id="notes"></div></header>
<div id="stage"><img id="img"></div>
<footer><span id="bar"></span><span>|</span><button id="bodies"></button><button id="zoom"></button></footer>
<script>
const V=${JSON.stringify(meta)};const q=new URLSearchParams(location.search)
let s={variant:q.get("variant")||"f",bodies:q.get("bodies")!=="0",zoom:q.get("zoom")==="1"}
function draw(){const v=V.find(x=>x.key===s.variant)||V[0]
img.src=v.key+(s.bodies?"":"-bare")+".svg";stage.style.setProperty("--w",s.zoom?"300%":"100%")
notes.textContent=v.notes;state.textContent="· "+v.name+" · parts "+(s.bodies?"fitted":"off")+" · "+(s.zoom?"3×":"fit")
bar.innerHTML="";for(const x of V){const b=document.createElement("button");b.textContent=x.name;b.className=x.key===v.key?"on":"";b.onclick=()=>{s.variant=x.key;draw()};bar.append(b," ")}
bodies.textContent=s.bodies?"Hide parts":"Show parts";zoom.textContent=s.zoom?"Fit":"Zoom 3×"
history.replaceState(0,"","?variant="+v.key+"&bodies="+(s.bodies?1:0)+"&zoom="+(s.zoom?1:0))}
bodies.onclick=()=>{s.bodies=!s.bodies;draw()};zoom.onclick=()=>{s.zoom=!s.zoom;draw()};draw()
</script>`,
)
