// The yoke's ring-face silkscreen (#81). It is laid out as the panel is fitted, positive end
// down, in two frames of its own, then mapped to the board's coordinates:
//
// - The chin's view: x across from the centreline, y down, with the chin's outer edge at y = 22.
// - An arm's face: x along from its first way, y in from its outboard edge.

import type { Pt } from "./outline"
import { type Art, art, chevron, crux, earth, frame, join, kana, line, logo, mapArt, text, unicorn } from "./silkscreen"

/** What the silk is laid out against, from index.circuit.tsx. */
export type Yoke = {
  /** Panel coordinates, across and along, to the board's. */
  pcb: (c: number, a: number) => Pt
  /** Each way's distance along, ways 11–12 first. */
  waysA: number[]
  halfWidth: number
  armDepth: number
  /** The chin's outer edge, along. */
  aOuter: number
  /** Half the chin's inner edge, from the centreline out to the panel's side, across and along. */
  inner: Pt[]
  /** Where the inner edge ends at each arm's root, along. */
  aEar: number
  /** The ground nut, across and along. */
  groundNut: Pt
}

const P = (x: number, y: number): Pt => ({ x, y })

const bbox = (a: Art) => {
  const pts = [...a.strokes.flatMap((s) => s.pts), ...a.fills.flat(2)]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}
const centred = (a: Art) => {
  const b = bbox(a)
  return mapArt(a, (p) => P(p.x - (b.x0 + b.x1) / 2, p.y - (b.y0 + b.y1) / 2))
}

// ── Arms ───────────────────────────────────────────────────────────────────────────────────

// The banner's quote and its answer, a line to each gap between two nuts, read down the odd arm
// and then down the even.
const QUOTE = [
  "I'VE SEEN THINGS",
  "YOU PEOPLE",
  "WOULDN'T BELIEVE.",
  "FRIDGES DRAWING",
  "AMPS OFF THE",
  "SHOULDER OF ORION.",
  "I WATCHED FUSES",
  "GLITTER IN THE DARK.",
  "ALL THOSE MOMENTS",
  "WILL NOT BE LOST",
  "IN TIME. EVERY AMP",
  "IS LOGGED.",
]

/**
 * One arm, s = 1 the odd one. Each way has three chevrons from the panel to its nut, way 1's
 * filled, and its number on its finger beside the way screw. The quote is set against the
 * panel's side, where no ring or wire covers it.
 */
const arm = (y: Yoke, s: 1 | -1): Art => {
  const pitch = y.waysA[1] - y.waysA[0]
  const edge = y.armDepth
  // Upright as fitted: reading runs towards the centreline on the odd arm and away from it on the even.
  const upright = (a: Art, x0: number, y0: number) =>
    mapArt(a, s > 0 ? (p) => P(x0 - p.y, y0 + p.x) : (p) => P(x0 + p.y, y0 - p.x))
  return join(
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
      const x = i * pitch
      // #72: odd ways on the left as fitted, 11–12 nearest the positive end.
      const way = s > 0 ? 11 - 2 * i : 2 + 2 * i
      const row = s > 0 ? 5 - i : i
      return [
        ...[11.55, 13.15, 14.75].map((v) => chevron(x, v, way === 1)),
        upright(centred(text(0, 0, 2.8, String(way), { w: 0.3 })), x, edge + 2.3),
        upright(
          text(0, 0.45, 1, QUOTE[(s > 0 ? 0 : 6) + row], { anchor: s > 0 ? "end" : "start" }),
          s > 0 ? x - pitch / 2 : x + pitch / 2,
          edge - 0.9,
        ),
      ]
    }),
  )
}

// ── The chin ───────────────────────────────────────────────────────────────────────────────

/** The wordmark's two words, w wide overall, each with its left edge at x = 0. */
const words = (w: number) => {
  const rings = logo(0, 0, w).fills[0]
  const lo = (r: Pt[]) => Math.min(...r.map((p) => p.x))
  const hi = (r: Pt[]) => Math.max(...r.map((p) => p.x))
  // The widest clear gap between letters is the one between the words.
  const spans = rings.map((r) => [lo(r), hi(r)]).sort((p, q) => p[0] - q[0])
  let reach = spans[0][1]
  let split = { at: 0, size: 0 }
  for (const [x0, x1] of spans) {
    if (x0 - reach > split.size) split = { at: (x0 + reach) / 2, size: x0 - reach }
    reach = Math.max(reach, x1)
  }
  const part = (keep: (r: Pt[]) => boolean) => {
    const rs = rings.filter(keep)
    const x0 = Math.min(...rs.map(lo))
    return rs.map((r) => r.map((p) => P(p.x - x0, p.y)))
  }
  return {
    blade: part((r) => (lo(r) + hi(r)) / 2 < split.at),
    reader: part((r) => (lo(r) + hi(r)) / 2 > split.at),
    height: Math.max(...rings.flat().map((p) => p.y)),
  }
}
/** How far the wordmark's letters lean right per mm of height, measured off a render. */
const SLANT = 0.21

// The spec plate's grid: three columns 12 apart and two rows. The USB socket's stakes come
// through the board in the lower middle cell.
const COLS = [-37, -25, -13]
const ROWS = [10.7, 17.3]
const cell = (col: number, row: number, label: string, a = "", b = "") => {
  const [x, y] = [COLS[col], ROWS[row]]
  return join(
    text(x, y, 0.8, label, { anchor: "middle", ls: 0.06 }),
    line([[x - 5, y + 0.55], [x + 5, y + 0.55]]),
    text(x, y + 2.05, 1, a, { anchor: "middle" }),
    text(x, y + 3.6, 1, b, { anchor: "middle" }),
  )
}

const chin = (y: Yoke): Art => {
  /** The chin's view to the panel's coordinates. */
  const shift = y.aOuter + 22
  const view = (c: number, a: number) => P(-c, shift - a)
  const g = view(y.groundNut.x, y.groundNut.y)

  // The inner edge, from one arm's root round the panel's end to the other's, 0.45 into the board.
  const half = [...y.inner, P(y.inner[y.inner.length - 1].x, y.aEar)]
  const edge = [...half.slice(1).reverse().map((p) => view(p.x, p.y)), ...half.map((p) => view(-p.x, p.y))]
  const wrap = edge.map((p, i) => {
    const [a, b] = [edge[Math.max(i - 1, 0)], edge[Math.min(i + 1, edge.length - 1)]]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    // The edge runs left to right, so this normal points into the board.
    const n = P(-(b.y - a.y) / len, (b.x - a.x) / len)
    return { p: P(p.x + n.x * 0.45, p.y + n.y * 0.45), n }
  })
  // A meter's scale off that line: a graduation every 1.9 mm along it, each fifth longer.
  const scale: Art[] = [art([{ pts: wrap.map((q) => q.p), w: 0.15 }])]
  let [run, next, count] = [0, 0, 0]
  for (let i = 1; i < wrap.length; i++) {
    const [a, b] = [wrap[i - 1], wrap[i]]
    const len = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y)
    for (; next <= run + len; next += 1.9, count++) {
      const u = (next - run) / len
      const at = P(a.p.x + (b.p.x - a.p.x) * u, a.p.y + (b.p.y - a.p.y) * u)
      const n = P(a.n.x + (b.n.x - a.n.x) * u, a.n.y + (b.n.y - a.n.y) * u)
      const l = count % 5 === 0 ? 0.85 : 0.45
      scale.push(line([[at.x, at.y], [at.x + n.x * l, at.y + n.y * l]]))
    }
    run += len
  }

  // The wordmark on two lines right of the centreline, so a feed run down the chin covers none
  // of it. The lower line starts clear of the tooling hole; the upper follows the slant up from it.
  const { blade, reader, height } = words(67)
  const put = (rs: Pt[][], dx: number, dy: number) => rs.map((r) => r.map((p) => P(p.x + dx, p.y + dy)))
  const [x, y0, y1] = [10.3, 9.95, 21.5 - height]

  const art2 = join(
    ...scale,
    art([], [put(blade, x + SLANT * (y1 - y0), y0), put(reader, x, y1)]),
    cell(0, 0, "SOURCE", "XDGFX", "/BLADE-READER"),
    cell(1, 0, "LICENCE", "CERN-OHL", "-S-2.0"),
    cell(2, 0, "REVISION", "B", "2026-10"),
    cell(0, 1, "DERATE", "20 A PER WAY", "ABOVE 40 °C"),
    cell(1, 1, "USB"),
    line([[-25, 19.0], [-25, 21.0]]),
    line([[-25.7, 20.3], [-25, 21.0], [-24.3, 20.3]]),
    cell(2, 1, "OUTPUT NUT", "M4", "1.0-1.2 Nm"),
    // Gaff's unicorn on the centreline: under a feed run down the chin, in view when it leaves to a side.
    unicorn(-4.75, 11.45, 0.88),
    // The framed sign on the odd arm's root, over the module.
    frame(-56, -7.4, 5.8, 22.4, 1),
    kana(-53.1, -6.1, 2.3, 2.55),
    text(g.x - 1.8, g.y - 8.6, 1.2, "GND"),
    earth(g.x + 0.1, g.y - 7.3),
    crux(46.6, -6.9, 2.0),
    text(49.4, -6.1, 0.8, "DESIGNED IN"),
    text(49.4, -4.9, 0.8, "AUSTRALIA"),
  )
  return mapArt(art2, (p) => P(-p.x, shift - p.y))
}

/** The ring face's silk, in the board's coordinates. */
export const ringFace = (y: Yoke): Art => {
  const armAt = (s: 1 | -1) => (p: Pt) =>
    s > 0 ? P(y.halfWidth - p.y, y.waysA[0] + p.x) : P(-y.halfWidth + p.y, y.waysA[5] - p.x)
  const panel = join(chin(y), ...([1, -1] as const).map((s) => mapArt(arm(y, s), armAt(s))))
  return mapArt(panel, (p) => y.pcb(p.x, p.y))
}
