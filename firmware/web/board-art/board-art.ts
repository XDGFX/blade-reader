// SPDX-License-Identifier: AGPL-3.0-or-later
// Board art: the yoke's ring face as fitted (chin down, odd ways left), seen through a clear board.
// tscircuit's PCB frame is the parts face from above, Y up, chin up. Plotting X, Y straight into
// SVG's y-down frame mirrors it once, which is the ring face seen as fitted.
// Writes the art and the points the page places readings by into firmware/web/page.js. Run once
// per board revision, from board/ after `bun run build`:
//   bun ../firmware/web/board-art/board-art.ts dist/index/circuit.json
import { circD, rectD, type Sub } from "./shapes"
import { A_OPEN, pcb } from "../../../board/index.circuit.tsx"

const src = process.argv[2]
const c: any[] = JSON.parse(await Bun.file(src).text())
const of = (t: string) => c.filter((e) => e.type === t)

const f = (v: number) => {
  const r = Math.round(v * 100) / 100
  return (Object.is(r, -0) ? 0 : r).toString().replace(/^(-?)0\./, "$1.")
}
type P = { x: number; y: number }
/** Hundredths of a mm as a short decimal. */
const n = (h: number) => f(h / 100)
/** A separator before an argument, dropped where a minus sign or a leading point does the job. */
const sep = (a: string) => (a[0] === "-" ? a : " " + a)
/** Subpaths into one path's data, each moved to relative to where the last ended. */
const join = (subs: Sub[]) => {
  let o = ""
  let at: Sub | null = null
  for (const s of subs) {
    o += at ? `m${n(s.x - at.ex)}${sep(n(s.y - at.ey))}${s.body}` : `M${n(s.x)}${sep(n(s.y))}${s.body}`
    at = s
  }
  return o
}

// Drop points within tol of the line through their neighbours (Douglas–Peucker).
const simplify = (pts: P[], tol = 0.015): P[] => {
  if (pts.length < 3) return pts
  const [a, b] = [pts[0], pts[pts.length - 1]]
  const L = Math.hypot(b.x - a.x, b.y - a.y)
  let [imax, dmax] = [0, 0]
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]
    const d = L < 1e-9 ? Math.hypot(p.x - a.x, p.y - a.y) : Math.abs((b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y)) / L
    if (d > dmax) [imax, dmax] = [i, d]
  }
  if (dmax <= tol) return [a, b]
  return [...simplify(pts.slice(0, imax + 1), tol).slice(0, -1), ...simplify(pts.slice(imax), tol)]
}
// A subpath in relative commands, at 0.01 mm, with where it starts and ends.
const d = (pts: P[], close = false, tol = 0.015): Sub => {
  const s = simplify(pts, tol)
  let q = s.map((p) => ({ x: Math.round(p.x * 100), y: Math.round(p.y * 100) }))
  q = q.filter((p, i) => i === 0 || p.x !== q[i - 1].x || p.y !== q[i - 1].y)
  let body = ""
  let cmd = ""
  for (let i = 1; i < q.length; i++) {
    const [dx, dy] = [q[i].x - q[i - 1].x, q[i].y - q[i - 1].y]
    const [c, args] = dy === 0 ? ["h", n(dx)] : dx === 0 ? ["v", n(dy)] : ["l", n(dx) + sep(n(dy))]
    body += (c === cmd ? sep(args) : c + args)
    cmd = c
  }
  if (q.length === 1) body = "h0"
  const end = close ? q[0] : q[q.length - 1]
  return { x: q[0].x, y: q[0].y, body: body + (close ? "z" : ""), ex: end.x, ey: end.y }
}

// ── Nets ──
const netName = new Map<string, string>()
for (const n of of("source_net")) netName.set(n.subcircuit_connectivity_map_key, n.name)
const netById = new Map(of("source_net").map((n) => [n.source_net_id, n.subcircuit_connectivity_map_key]))
const spKey = new Map(of("source_port").map((p) => [p.source_port_id, p.subcircuit_connectivity_map_key]))
const ppKey = new Map(of("pcb_port").map((p) => [p.pcb_port_id, spKey.get(p.source_port_id)]))
const stKey = new Map(of("source_trace").map((t) => [t.source_trace_id, t.subcircuit_connectivity_map_key]))
const wayOfKey = (k?: string) => {
  const m = k && netName.get(k)?.match(/^S(\d+)_(LINE|LOAD)$/)
  return m ? +m[1] : 0
}
const srcComp = new Map(of("source_component").map((s) => [s.source_component_id, s]))
const pcbComp = new Map(of("pcb_component").map((p) => [p.pcb_component_id, p]))
const compName = (id: string) => srcComp.get(pcbComp.get(id)?.source_component_id)?.name as string | undefined
const byName = new Map(of("pcb_component").map((p) => [srcComp.get(p.source_component_id)?.name, p]))

// Buckets: [way][class][stroke width or "" for fills] → subpaths. Way 0 is everything else.
const B: Record<number, Record<string, Record<string, Sub[]>>> = {}
const put = (w: number, cls: string, s: Sub, width = "") => ((((B[w] ??= {})[cls] ??= {})[width] ??= []).push(s))
// Pours stay one <path> each: same-net pours may overlap, and their holes need evenodd.
const pours: Record<number, Record<string, string[]>> = {}

// ── Copper ──
for (const t of of("pcb_trace")) {
  const w = wayOfKey(stKey.get(t.source_trace_id))
  let run: P[] = []
  let cur: { layer: string; width: number } | null = null
  const flush = () => {
    if (cur && run.length > 1) put(w, cur.layer === "top" ? "cu-parts" : "cu-ring", d(run), f(cur.width))
    run = []
  }
  for (const p of t.route) {
    if (p.route_type !== "wire") {
      flush()
      cur = null
      continue
    }
    if (cur && (cur.layer !== p.layer || cur.width !== p.width)) {
      const last = run[run.length - 1]
      flush()
      if (last) run.push(last)
    }
    cur = { layer: p.layer, width: p.width }
    run.push(p)
  }
  flush()
}
for (const p of of("pcb_copper_pour")) {
  const w = wayOfKey(netById.get(p.source_net_id))
  const b = p.brep_shape
  const s = join([b.outer_ring, ...(b.inner_rings ?? [])].map((r: any) => d(r.vertices, true, 0.01)))
  ;((pours[w] ??= {})[p.layer === "top" ? "cu-parts" : "cu-ring"] ??= []).push(s)
}

// ── Pads and holes ──
for (const p of of("pcb_smtpad")) {
  const w = wayOfKey(ppKey.get(p.pcb_port_id))
  const s =
    p.shape === "rect" || p.shape === "rotated_rect"
      ? rectD(p.x, p.y, p.width, p.height, 0, p.ccw_rotation ?? 0)
      : p.shape === "rotated_pill" || p.shape === "pill"
        ? rectD(p.x, p.y, p.width, p.height, p.radius ?? Math.min(p.width, p.height) / 2, p.ccw_rotation ?? 0)
        : p.shape === "circle"
          ? circD(p.x, p.y, p.radius)
          : d(p.points, true, 0.005)
  put(w, "pad", s)
}
for (const h of of("pcb_plated_hole")) {
  const w = wayOfKey(ppKey.get(h.pcb_port_id))
  if (h.shape === "circle") {
    put(w, "pad", circD(h.x, h.y, h.outer_diameter / 2))
    put(0, "hole", circD(h.x, h.y, h.hole_diameter / 2))
  } else {
    put(w, "pad", rectD(h.x, h.y, h.outer_width, h.outer_height, Math.min(h.outer_width, h.outer_height) / 2))
    put(0, "hole", rectD(h.x, h.y, h.hole_width, h.hole_height, Math.min(h.hole_width, h.hole_height) / 2))
  }
}
for (const h of of("pcb_hole")) put(0, "hole", circD(h.x, h.y, h.hole_diameter / 2))
// Vias as zero-length round-capped strokes, stroke width = land diameter.
for (const v of of("pcb_via")) put(wayOfKey(v.subcircuit_connectivity_map_key), "via", d([v]), f(v.outer_diameter))

// ── Bodies on the parts face ──
const skip = /^(W\d+|J1|TP\d+)$/
for (const o of of("pcb_courtyard_outline"))
  if (o.layer === "top" && !skip.test(compName(o.pcb_component_id) ?? "")) put(0, "comp", d(o.outline, true, 0.02))
for (const r of of("pcb_courtyard_rect"))
  if (r.layer === "top") put(0, "comp", rectD(r.center.x, r.center.y, r.width, r.height, 0, r.ccw_rotation ?? 0))

// ── Ring-face silk ──
for (const s of of("pcb_silkscreen_path")) if (s.layer === "bottom") put(0, "silk", d(s.route, false, 0.04), f(s.stroke_width))
for (const g of of("pcb_silkscreen_graphic"))
  if (g.layer === "bottom")
    for (const r of [g.brep_shape.outer_ring, ...(g.brep_shape.inner_rings ?? [])]) put(0, "silk", d(r.vertices, true, 0.01))

// ── Assemble ──
const board = of("pcb_board")[0]
const xs = board.outline.map((p: P) => p.x)
const ys = board.outline.map((p: P) => p.y)
const pad = 1
const vb = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + 2 * pad, h: Math.max(...ys) - Math.min(...ys) + 2 * pad }

/** One class's group: a stroked path per width, then its fills. */
const layer = (w: number, cls: string) => {
  const g = B[w]?.[cls] ?? {}
  const strokes = Object.entries(g)
    .filter(([wd]) => wd)
    .map(([wd, ss]) => `<path fill="none" stroke-width="${wd}" d="${join(ss)}"/>`)
  const fills = [...(pours[w]?.[cls] ?? []), ...(g[""] ? [join(g[""])] : [])].map(
    (s) => `<path stroke="none" d="${s}"/>`,
  )
  const body = [...strokes, ...fills].join("")
  return body ? `<g class="${cls}">${body}</g>` : ""
}
const ways = Array.from({ length: 12 }, (_, i) => i + 1)
const art = [
  `<path class="outline" d="${join([d(board.outline, true, 0.005)])}"/>`,
  layer(0, "comp"),
  layer(0, "cu-parts"),
  layer(0, "pad"),
  ...ways.map((w) => `<g id="w${w}">${["cu-parts", "pad", "cu-ring", "via"].map((k) => layer(w, k)).join("")}</g>`),
  layer(0, "cu-ring"),
  layer(0, "via"),
  layer(0, "hole"),
  layer(0, "silk"),
].join("")

// ── Points, in mm as [x, y] ──
const xy = (p: P) => [+f(p.x), +f(p.y)]
const at = (name: string) => xy(byName.get(name)!.center)
const [o1, o2] = [pcb(42.1, 0), pcb(-42.1, A_OPEN)]
const points = {
  viewBox: { x: +f(vb.x), y: +f(vb.y), width: +f(vb.w), height: +f(vb.h) },
  // The finger's tip is 13.0 into the panel from its edge and the way screw 8.52, so the tip is
  // 4.48 beyond the screw towards the centreline.
  ways: Object.fromEntries(
    ways.map((n) => {
      const [x, y] = at(`W${n}`)
      return [n, { ring: at(`N${n}`), screw: [x, y], tip: [+f(x - Math.sign(x) * 4.48), y] }]
    }),
  ),
  faultLed: at("LED2"),
  statusLed: at("LED1"),
  // The fuse panel's opening between the arms.
  opening: { x: +f(Math.min(o1.x, o2.x)), y: +f(Math.min(o1.y, o2.y)), width: +f(Math.abs(o1.x - o2.x)), height: +f(Math.abs(o1.y - o2.y)) },
}

// ── Into the page, between its markers ──
const START = "// <board-art>"
const END = "// </board-art>"
const region = [
  `${START} Written by board-art/board-art.ts from the routed circuit.json. Don't edit by hand.`,
  "// The ring face: copper, pads, holes and silk, with each way's power path as <g id=\"wN\">.",
  `const ART = \`${art}\`;`,
  `const BOARD = ${JSON.stringify(points)};`,
  END,
].join("\n")
const page = `${import.meta.dir}/../page.js`
const text = await Bun.file(page).text()
const [a, b] = [text.indexOf(START), text.indexOf(END)]
if (a < 0 || b < a) throw new Error(`${page} has no ${START} … ${END} region`)
await Bun.write(page, text.slice(0, a) + region + text.slice(b + END.length))
console.log(`board art: ${art.length} bytes into ${page}`)
