// Draws the yoke and two rev A strips fitted to a 12-way ST Blade, seen from the ring face as
// installed, for issue #52. The strips' outline, holes and silk are read from a built
// circuit.json of the strip, which is the tag rev-a-strip: check it out as a worktree and run
// `bun run silk` in its board/. The yoke's outline is index.circuit.tsx and its silk is
// lib/ring-face.ts. Run in board/: bun scripts/yoke-view.ts <strip circuit.json>
//
// Everything is drawn in panel coordinates, in mm: c across from the centreline and a along
// from the positive end. The sheets are drawn as the panel is fitted, positive end down.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { ringFace } from "../lib/ring-face"
import type { Art } from "../lib/silkscreen"
import {
  ANTENNA_AREA,
  ANTENNA_KEEPOUT,
  CLAMPS,
  GROUND_NUT,
  HALF_WIDTH,
  J1_BOX,
  MODULE,
  NUTS,
  OUTLINE,
  PANEL_END,
  TOOLING,
  WAYS_A,
  YOKE,
  pcb,
} from "../index.circuit"

type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const f = (n: number) => n.toFixed(3)

const PANEL = { half: 42.1, length: 164.4, inset: 8.52 }
const PITCH = 13.36

const C = {
  bulkhead: "#d6d0c4",
  panel: "#24272b",
  deck: "#1a1c1f",
  pad: "#aab0b5",
  mask: "#08090a",
  edge: "#3b3e42",
  silk: "#f4f3ee",
  tin: "#c9cdd1",
  tinDark: "#8d9297",
  brass: "#b79a4c",
  hole: "#101113",
  red: "#b3261e",
  black: "#141414",
}

// ── SVG helpers ────────────────────────────────────────────────────────────────────────────

const d = (pts: Pt[], close = false) => `M${pts.map((p) => `${f(p.x)} ${f(p.y)}`).join("L")}${close ? "Z" : ""}`
const poly = (pts: Pt[], fill: string, extra = "") => `<path d="${d(pts, true)}" fill="${fill}" ${extra}/>`
const disc = (p: Pt, r: number, fill: string, extra = "") =>
  `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(r)}" fill="${fill}" ${extra}/>`
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = "") =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${extra}/>`
const stroke = (pts: Pt[], colour: string, w: number, extra = "", cap = "round") =>
  `<path d="${d(pts)}" fill="none" stroke="${colour}" stroke-width="${f(w)}" stroke-linecap="${cap}" stroke-linejoin="round" ${extra}/>`

const silk = (a: Art, m: (p: Pt) => Pt = (p) => p) =>
  [
    ...a.strokes.map((s) => stroke(s.pts.map(m), C.silk, s.w)),
    ...a.fills.map((rings) => `<path d="${rings.map((r) => d(r.map(m), true)).join("")}" fill="${C.silk}" fill-rule="evenodd"/>`),
  ].join("")

const bbox = (a: Art) => {
  const pts = [...a.strokes.flatMap((s) => s.pts), ...a.fills.flat(2)]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}

// ── The fuse panel ─────────────────────────────────────────────────────────────────────────

const FUSES = ["#c8a165", "#b3261e", "#2f6fb5", "#d8b62a", "#e8e6df", "#3f8f4a"]
const sides = [1, -1] as const

const panel = () => {
  const h = PANEL.half
  const L = PANEL.length
  // Both ends drawn as the positive end is measured.
  const end = [...PANEL_END.slice(1).reverse().map((p) => P(-p.x, p.y)), ...PANEL_END]
  const body = poly([...end, ...end.reverse().map((p) => P(p.x, L - p.y))], C.panel, 'stroke="#000" stroke-width="0.3"')
  const out: string[] = [body]
  // The raised fuse deck between the pockets.
  out.push(rect(-(h - 14.5), 20.2, 2 * (h - 14.5), 80, C.deck, 'rx="1"'))
  for (const s of sides) {
    WAYS_A.forEach((a, i) => {
      // The pocket's pad, 3.2 to 14.5 in from the side, between two barriers.
      const x = s > 0 ? h - 14.5 : -h + 3.2
      out.push(rect(x, a - 5.55, 11.3, 11.1, C.pad))
      // The way's blade fuse.
      const fx = s > 0 ? 3 : -22
      out.push(rect(fx, a - 2.6, 19, 5.2, FUSES[(i + (s > 0 ? 0 : 3)) % 6], 'rx="0.8" opacity="0.92"'))
      out.push(rect(fx + 5.5, a - 1.6, 8, 3.2, "#ffffff", 'rx="0.4" opacity="0.25"'))
    })
    // The negative bus pocket and its three screws.
    out.push(rect(s > 0 ? h - 14.5 : -h + 3.2, 108.2, 11.3, 33, C.pad))
    for (const a of [113.54, 124.62, 135.69]) out.push(screw(P(s * (h - 8.45), a), 4.09))
    // Mounting screws in their recesses.
    for (const a of [12.8, 151.6]) {
      out.push(disc(P(s * 31.8, a), 4.5, C.deck))
      out.push(screw(P(s * 31.8, a), 3.4))
    }
  }
  // The studs on their bosses.
  for (const a of [11.33, 153]) {
    out.push(disc(P(0, a), 9, C.deck))
    out.push(disc(P(0, a), 5.25, C.pad))
  }
  return out.join("")
}

/** A pan head screw seen end on. */
function screw(p: Pt, r: number) {
  const k = r * 0.5
  return (
    disc(p, r, C.tin, `stroke="${C.tinDark}" stroke-width="0.2"`) +
    stroke([P(p.x - k, p.y), P(p.x + k, p.y)], C.tinDark, 0.5) +
    stroke([P(p.x, p.y - k), P(p.x, p.y + k)], C.tinDark, 0.5)
  )
}

/** A hex nut on a stud. */
const stud = (p: Pt) => {
  const hex = [0, 1, 2, 3, 4, 5].map((i) => P(p.x + 4.57 * Math.cos((i * Math.PI) / 3), p.y + 4.57 * Math.sin((i * Math.PI) / 3)))
  return poly(hex, C.tin, `stroke="${C.tinDark}" stroke-width="0.2"`) + disc(p, 2.4, C.tinDark)
}

/** A bare output nut: its tinned land, the nut's thread through the hole. */
const nut = (p: Pt) => disc(p, 4.685, C.tin) + disc(p, 3.2, C.brass) + disc(p, 1.65, C.hole)
/** The tinned land round a way screw's hole, then the screw. */
const clamp = (p: Pt) => disc(p, 4.065, C.tin) + screw(p, 4.09)

// ── Rings and cables ───────────────────────────────────────────────────────────────────────

const WIRE = ["#b3261e", "#b3261e", "#2f5f9e", "#b3261e", "#c9a227", "#b3261e"]

/** A ring terminal on the nut at p, its wire leaving along unit vector u to distance len. */
const ringTerminal = (p: Pt, u: Pt, len: number, colour: string, wire = 3.4) => {
  const at = (t: number, n = 0) => P(p.x + u.x * t - u.y * n, p.y + u.y * t + u.x * n)
  const tongue = [at(0, -2.9), at(7.5, -2.9), at(7.5, 2.9), at(0, 2.9)]
  const barrel = [at(7.5, -2.6), at(18, -2.6), at(18, 2.6), at(7.5, 2.6)]
  return (
    stroke([at(18), at(len)], colour, wire, "", "butt") +
    stroke([at(18), at(len)], "#ffffff", wire * 0.18, 'opacity="0.25"', "butt") +
    poly(tongue, C.tin) +
    disc(p, 4.9, C.tin, `stroke="${C.tinDark}" stroke-width="0.15"`) +
    poly(barrel, colour, 'stroke="#000" stroke-width="0.15" stroke-opacity="0.4"') +
    screw(p, 3.5)
  )
}

/** The feed or return cable on a stud, leaving along the panel's length. */
const feed = (a: number, dir: 1 | -1, to: number, colour: string) => {
  const y = (t: number) => a + dir * t
  return (
    rect(-5.6, Math.min(y(34), to), 11.2, Math.abs(to - y(34)), colour) +
    rect(-1, Math.min(y(34), to), 1.6, Math.abs(to - y(34)), "#ffffff", 'opacity="0.2"') +
    rect(-6.5, Math.min(y(0), y(15)), 13, 15, C.tin) +
    disc(P(0, a), 7.2, C.tin, `stroke="${C.tinDark}" stroke-width="0.15"`) +
    rect(-6.6, Math.min(y(15), y(36)), 13.2, 21, colour, 'rx="1" stroke="#000" stroke-width="0.15" stroke-opacity="0.4"') +
    stud(P(0, a))
  )
}

// ── Two strips, from the strip's built circuit.json ────────────────────────────────────────

type El = Pt & Record<string, any>
const stripJson = process.argv[2]
if (!stripJson) throw new Error("usage: bun scripts/yoke-view.ts <the strip's circuit.json, built from rev-a-strip>")
const strip: El[] = JSON.parse(readFileSync(stripJson, "utf8"))
const stripHoles = strip.filter((e) => e.type === "pcb_plated_hole")
const stripClamps = stripHoles.filter((e) => e.hole_diameter < 6)
const stripNuts = stripHoles.filter((e) => e.hole_diameter > 6)
/** The panel's edge and way 1, in the strip's board coordinates. */
const EDGE_Y = stripClamps[0].y + PANEL.inset
const WAY1_X = Math.max(...stripClamps.map((e) => e.x))
const stripOutline: Pt[] = strip.find((e) => e.type === "pcb_board")!.outline
const STRIP_END = Math.max(...stripOutline.map((p) => p.x))
export const STRIP_DEPTH = Math.max(...stripOutline.map((p) => p.y)) - EDGE_Y

/**
 * The strip's board coordinates to the panel's, for the strip on side s. Both are turns of the
 * ring face, so the right strip has its way 1 end at the positive end and the left at the other.
 */
const stripAt = (s: 1 | -1) => (p: Pt) =>
  s > 0
    ? P(PANEL.half + (p.y - EDGE_Y), WAYS_A[0] + WAY1_X - p.x)
    : P(-PANEL.half - (p.y - EDGE_Y), WAYS_A[5] - WAY1_X + p.x)

const stripBoard = (s: 1 | -1, wired: boolean) => {
  const m = stripAt(s)
  const out: string[] = []
  // The WROOM-02's antenna, past the way 1 end; the module itself is under the board.
  const ant = [P(STRIP_END, -6.5), P(STRIP_END + 6, -6.5), P(STRIP_END + 6, 11.5), P(STRIP_END, 11.5)]
  out.push(poly(ant.map(m), "#15301f", `stroke="${C.edge}" stroke-width="0.2"`))
  out.push(poly(stripOutline.map(m), C.mask, `stroke="${C.edge}" stroke-width="0.25"`))
  const bottom = strip.filter((e) => e.layer === "bottom")
  out.push(
    silk(
      {
        strokes: bottom.filter((e) => e.type === "pcb_silkscreen_path").map((e) => ({ pts: e.route, w: e.stroke_width })),
        fills: bottom
          .filter((e) => e.type === "pcb_silkscreen_graphic")
          .map((e) => [e.brep_shape.outer_ring, ...(e.brep_shape.inner_rings ?? [])].map((r) => r.vertices)),
      },
      m,
    ),
  )
  for (const h of stripClamps) out.push(clamp(m(h)))
  const ways = stripNuts.filter((h) => Math.abs(h.x) < WAY1_X + 1)
  const ground = stripNuts.find((h) => !ways.includes(h))!
  ways.forEach((h, i) => out.push(wired ? ringTerminal(m(h), P(s, 0), 60, WIRE[i]) : nut(m(h))))
  out.push(wired ? ringTerminal(m(ground), P(s * 0.5, s * 0.866), 70, C.black, 2.6) : nut(m(ground)))
  return out.join("")
}

// ── The yoke ───────────────────────────────────────────────────────────────────────────────

const A0 = pcb(0, 0).y
/** The yoke's PCB coordinates, seen from the parts face, to the panel's. */
const yokeAt = (p: Pt) => P(-p.x, A0 - p.y)

const EDGE = HALF_WIDTH - PANEL.half
const G = yokeAt(GROUND_NUT)

const yokeBoard = (wired: boolean) => {
  const out: string[] = []
  // The WROOM-02's antenna, 6 mm past the odd arm's outboard edge; the module itself is under the board.
  out.push(poly(ANTENNA_AREA.map(yokeAt), "#15301f", `stroke="${C.edge}" stroke-width="0.2"`))
  out.push(poly(OUTLINE.map(yokeAt), C.mask, `stroke="${C.edge}" stroke-width="0.25"`))
  out.push(silk(ringFace(YOKE), yokeAt))
  for (const t of TOOLING) out.push(disc(yokeAt(t), 0.576, C.bulkhead))
  for (const h of CLAMPS) out.push(clamp(yokeAt(h)))
  NUTS.forEach((h, i) => {
    const p = yokeAt(h)
    out.push(wired ? ringTerminal(p, P(Math.sign(p.x), 0), 60, WIRE[i % 6]) : nut(p))
  })
  out.push(wired ? ringTerminal(G, P(Math.sign(G.x) * 0.5, -0.866), 60, C.black, 2.6) : nut(G))
  return out.join("")
}

// ── What the chin carries ──────────────────────────────────────────────────────────────────

// The chin's placement, read from the yoke's own build: each part's courtyard and pads on the
// parts face, seen through the board from the ring face so it lines up with the other views.
const yokeJson = "dist/index/circuit.json"
const yoke: El[] = existsSync(yokeJson) ? JSON.parse(readFileSync(yokeJson, "utf8")) : []
const KIND = { ic: "#4f8fd6", power: "#e0863a", passive: "#9aa3ad", pad: "#d8c25a" }
const kindOf = (name: string): keyof typeof KIND =>
  /^(J1|TP)/.test(name) ? "pad" : /^(F|L|D|U3|C[1-5]$|N13)/.test(name) ? "power" : /^(U|Q|J2)/.test(name) ? "ic" : "passive"
/** Parts worth naming at this scale. */
const NAMED = /^(U\d|J\d|L1|D\d|F1|Q1|LED\d|N13)$/
const SMALL = 'font-family="Helvetica, Arial, sans-serif" font-size="1.5" text-anchor="middle" fill="#fff"'

const padShape = (e: El): Pt[] => {
  const [w, h] = e.shape === "circle" ? [e.radius, e.radius] : [(e.width ?? e.outer_width ?? e.outer_diameter) / 2, (e.height ?? e.outer_height ?? e.outer_diameter) / 2]
  const a = ((e.ccw_rotation ?? 0) * Math.PI) / 180
  return e.shape === "polygon"
    ? e.points
    : [[-w, -h], [w, -h], [w, h], [-w, h]].map(([x, y]) => P(e.x + x * Math.cos(a) - y * Math.sin(a), e.y + x * Math.sin(a) + y * Math.cos(a)))
}

const chinParts = () => {
  const out = [`<g opacity="0.4">${yokeBoard(false)}</g>`]
  // Upright on a sheet drawn positive end down.
  const label = (p: Pt, name: string) =>
    `<text x="${f(p.x)}" y="${f(p.y + 0.5)}" transform="rotate(180 ${f(p.x)} ${f(p.y)})" ${SMALL}>${name}</text>`
  const dashed = (pts: Pt[], colour: string) => stroke(pts.map(yokeAt), colour, 0.2, 'stroke-dasharray="1 0.8"', "butt")
  out.push(dashed(ANTENNA_KEEPOUT, "#7fd18b"), dashed(J1_BOX, KIND.pad))
  out.push(poly(MODULE.map(yokeAt), KIND.ic, `fill-opacity="0.35" stroke="${KIND.ic}" stroke-width="0.2"`))
  const names = new Map(yoke.filter((e) => e.type === "source_component").map((e) => [e.source_component_id, e.name as string]))
  // A way's own parts wait for the arm's layout.
  const onArm = /^(W\d+|N([1-9]|1[0-2])|U1\d+|D1\d+|R[12]\d+|C[123]\d+|Q[23]|R[89])$/
  const labels: string[] = []
  for (const c of yoke.filter((e) => e.type === "pcb_component")) {
    const name = names.get(c.source_component_id)!
    if (onArm.test(name) && !/^(R10|C10)$/.test(name)) continue
    const mine = yoke.filter((e) => e.pcb_component_id === c.pcb_component_id)
    const pads = mine.filter((e) => e.type === "pcb_smtpad" || e.type === "pcb_plated_hole")
    const kind = kindOf(name)
    for (const e of mine.filter((e) => e.type === "pcb_courtyard_outline"))
      out.push(poly(e.outline.map(yokeAt), KIND[kind], `fill-opacity="0.3" stroke="${KIND[kind]}" stroke-width="0.12"`))
    for (const e of pads) out.push(poly(padShape(e).map(yokeAt), KIND[kind], 'fill-opacity="0.95"'))
    if (NAMED.test(name)) labels.push(label(yokeAt(c.center), name === "U1" ? "WROOM-02" : name))
  }
  return out.join("") + labels.join("")
}

// ── Sheets ─────────────────────────────────────────────────────────────────────────────────

type View = { x0: number; y0: number; w: number; h: number }
const FULL: View = { x0: -98, y0: -44, w: 196, h: 222 }

const scene = (kind: "strips" | "yoke", wired: boolean) =>
  [
    panel(),
    kind === "strips" ? sides.map((s) => stripBoard(s, wired)).join("") : yokeBoard(wired),
    wired ? feed(11.33, -1, FULL.y0, C.red) + feed(153, 1, FULL.y0 + FULL.h, C.black) : stud(P(0, 11.33)) + stud(P(0, 153)),
  ].join("")

const LABEL = 'font-family="Helvetica, Arial, sans-serif" fill="#222"'
/** A grid of views, each a title over a clipped scene. */
const sheet = (cells: { title: string; body: string }[][], view: View, px: number) => {
  const [gap, head] = [6, 9]
  const W = cells[0].length * (view.w + gap) + gap
  const H = cells.length * (view.h + gap + head) + gap
  const parts = cells.flatMap((row, r) =>
    row.map(({ title, body }, c) => {
      const x = gap + c * (view.w + gap)
      const y = gap + r * (view.h + gap + head)
      const id = `v${r}${c}`
      return (
        `<text x="${x}" y="${y + 6}" font-size="${Math.min(5, view.w / 40)}" ${LABEL}>${title}</text>` +
        `<clipPath id="${id}"><rect x="${view.x0}" y="${view.y0}" width="${view.w}" height="${view.h}"/></clipPath>` +
        // Views are given in panel coordinates and drawn as fitted, positive end down.
        `<g transform="translate(${x + view.x0 + view.w} ${y + head + view.y0 + view.h}) rotate(180)"><g clip-path="url(#${id})">` +
        rect(view.x0, view.y0, view.w, view.h, C.bulkhead) +
        body +
        `</g></g>`
      )
    }),
  )
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * px}" height="${H * px}"><rect width="${W}" height="${H}" fill="#fff"/>${parts.join("")}</svg>\n`
}

const OUT = "../docs/assets"
mkdirSync(OUT, { recursive: true })
writeFileSync(
  `${OUT}/yoke-installed.svg`,
  sheet(
    [
      [
        { title: "Two rev A strips, fitted", body: scene("strips", false) },
        { title: "Yoke, fitted", body: scene("yoke", false) },
      ],
      [
        { title: "Two rev A strips, wired", body: scene("strips", true) },
        { title: "Yoke, wired", body: scene("yoke", true) },
      ],
    ],
    FULL,
    4,
  ),
)
const TOP: View = { x0: -74, y0: -30, w: 148, h: 78 }
writeFileSync(
  `${OUT}/yoke-installed-detail.svg`,
  sheet(
    [
      [{ title: "Two rev A strips: the positive end", body: scene("strips", false) }],
      [{ title: "Yoke: the chin", body: scene("yoke", false) }],
    ],
    TOP,
    10,
  ),
)
const CHIN: View = { x0: -70, y0: -24, w: 140, h: 50 }
writeFileSync(
  `${OUT}/yoke-chin-parts.svg`,
  sheet([[{ title: "Yoke: the chin's placement, parts face seen through the board", body: panel() + chinParts() }]], CHIN, 10),
)
console.log(`strip depth ${STRIP_DEPTH.toFixed(1)}, yoke arm ${EDGE.toFixed(1)}; wrote ${OUT}/yoke-installed{,-detail}.svg`)
