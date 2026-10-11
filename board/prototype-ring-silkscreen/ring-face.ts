// PROTOTYPE, throwaway: three takes on the yoke's ring-face silkscreen, for issue #81.
// Three variants on the placed outline, switched with ?variant=a|b|c or the bar at the bottom.
// Run in board/: bun prototype-ring-silkscreen/ring-face.ts, then open ring-face.html beside it.
//
// The panel, rings and cables are copied from scripts/yoke-view.ts. Everything is drawn in panel
// coordinates, in mm: c across from the centreline and a along from the positive end, and the
// sheets are drawn as the panel is fitted, positive end down.

import { writeFileSync } from "node:fs"
import {
  type Art,
  art,
  chevron,
  crux,
  earth,
  frame,
  join,
  kana,
  line,
  logo,
  mapArt,
  ring,
  roundRect,
  text,
  turn,
} from "../lib/silkscreen"
import { A_OUTER, ANTENNA_AREA, CLAMPS, GROUND_NUT, HALF_WIDTH, NUTS, OUTLINE, PANEL_END, TOOLING, WAYS_A, pcb } from "../index.circuit"

type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const f = (n: number) => n.toFixed(3)

const PANEL = { half: 42.1, length: 164.4 }
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
/** Art moved so its box is centred on the origin. */
const centred = (a: Art) => {
  const b = bbox(a)
  return mapArt(a, (p) => P(p.x - (b.x0 + b.x1) / 2, p.y - (b.y0 + b.y1) / 2))
}

// ── The fuse panel, rings and cables (from yoke-view.ts) ───────────────────────────────────

const FUSES = ["#c8a165", "#b3261e", "#2f6fb5", "#d8b62a", "#e8e6df", "#3f8f4a"]
const sides = [1, -1] as const

function screw(p: Pt, r: number) {
  const k = r * 0.5
  return (
    disc(p, r, C.tin, `stroke="${C.tinDark}" stroke-width="0.2"`) +
    stroke([P(p.x - k, p.y), P(p.x + k, p.y)], C.tinDark, 0.5) +
    stroke([P(p.x, p.y - k), P(p.x, p.y + k)], C.tinDark, 0.5)
  )
}

const panel = () => {
  const h = PANEL.half
  const L = PANEL.length
  const end = [...PANEL_END.slice(1).reverse().map((p) => P(-p.x, p.y)), ...PANEL_END]
  const out: string[] = [poly([...end, ...end.reverse().map((p) => P(p.x, L - p.y))], C.panel, 'stroke="#000" stroke-width="0.3"')]
  out.push(rect(-(h - 14.5), 20.2, 2 * (h - 14.5), 80, C.deck, 'rx="1"'))
  for (const s of sides) {
    WAYS_A.forEach((a, i) => {
      out.push(rect(s > 0 ? h - 14.5 : -h + 3.2, a - 5.55, 11.3, 11.1, C.pad))
      const fx = s > 0 ? 3 : -22
      out.push(rect(fx, a - 2.6, 19, 5.2, FUSES[(i + (s > 0 ? 0 : 3)) % 6], 'rx="0.8" opacity="0.92"'))
      out.push(rect(fx + 5.5, a - 1.6, 8, 3.2, "#ffffff", 'rx="0.4" opacity="0.25"'))
    })
    out.push(rect(s > 0 ? h - 14.5 : -h + 3.2, 108.2, 11.3, 33, C.pad))
    for (const a of [113.54, 124.62, 135.69]) out.push(screw(P(s * (h - 8.45), a), 4.09))
    for (const a of [12.8, 151.6]) {
      out.push(disc(P(s * 31.8, a), 4.5, C.deck))
      out.push(screw(P(s * 31.8, a), 3.4))
    }
  }
  for (const a of [11.33, 153]) {
    out.push(disc(P(0, a), 9, C.deck))
    out.push(disc(P(0, a), 5.25, C.pad))
  }
  return out.join("")
}

const stud = (p: Pt) => {
  const hex = [0, 1, 2, 3, 4, 5].map((i) => P(p.x + 4.57 * Math.cos((i * Math.PI) / 3), p.y + 4.57 * Math.sin((i * Math.PI) / 3)))
  return poly(hex, C.tin, `stroke="${C.tinDark}" stroke-width="0.2"`) + disc(p, 2.4, C.tinDark)
}
const nut = (p: Pt) => disc(p, 4.685, C.tin) + disc(p, 3.2, C.brass) + disc(p, 1.65, C.hole)
const clamp = (p: Pt) => disc(p, 4.065, C.tin) + screw(p, 4.09)

const WIRE = ["#b3261e", "#b3261e", "#2f5f9e", "#b3261e", "#c9a227", "#b3261e"]

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

// ── Frames of reference ────────────────────────────────────────────────────────────────────

const A0 = pcb(0, 0).y
/** The yoke's PCB coordinates, seen from the parts face, to the panel's. */
const yokeAt = (p: Pt) => P(-p.x, A0 - p.y)
/** An arm's face: x along from its first way, y in from its outboard edge. s > 0 is the odd arm. */
const armAt = (s: 1 | -1) => (p: Pt) =>
  s > 0 ? P(HALF_WIDTH - p.y, WAYS_A[0] + p.x) : P(-HALF_WIDTH + p.y, WAYS_A[5] - p.x)
/** The panel's edge and the nut row, in an arm's y. */
const EDGE = HALF_WIDTH - PANEL.half
const NUT_Y = 6
/** Art drawn upright as fitted, its origin put at (x0, y0) on arm s. */
const upright = (s: 1 | -1, a: Art, x0: number, y0: number) =>
  mapArt(a, s > 0 ? (p) => P(x0 - p.y, y0 + p.x) : (p) => P(x0 + p.y, y0 - p.x))
/** Art turned to read down the arm as fitted, like a book's spine, its origin at (x0, y0) on arm s. */
const spine = (s: 1 | -1, a: Art, x0: number, y0: number) =>
  mapArt(a, s > 0 ? (p) => P(x0 - p.x, y0 - p.y) : (p) => P(x0 + p.x, y0 + p.y))

// The way on arm s at index i along it, and its row counted down the arm as fitted. #72: with
// the positive end down, odd ways are on the left and 11–12 are nearest the positive end.
const wayOf = (s: 1 | -1, i: number) => (s > 0 ? 11 - 2 * i : 2 + 2 * i)
const rowOf = (s: 1 | -1, i: number) => (s > 0 ? 5 - i : i)

/** The chin's own view, as fitted: x = −c, y = −a, with the outer edge at y = 22. */
const CHIN_SHIFT = A_OUTER + 22
const chinAt = (p: Pt) => P(-p.x, -p.y + CHIN_SHIFT)
const G = yokeAt(GROUND_NUT)
const g = P(-G.x, -(G.y - CHIN_SHIFT))

// ── Copy ───────────────────────────────────────────────────────────────────────────────────

const FIRST = [
  ["I'VE SEEN", "THINGS"],
  ["YOU", "PEOPLE"],
  ["WOULDN'T", "BELIEVE."],
  ["FRIDGES", "DRAWING"],
  ["AMPS OFF", "THE SHOULDER"],
  ["OF", "ORION."],
]
const QUOTES = {
  // The first take's placeholder.
  watts: [...FIRST, ["I WATCHED", "FUSES"], ["GLITTER IN", "THE DARK."], ["ALL THOSE", "AMPS"], ["WILL BE", "LOGGED"], ["IN TIME,", "LIKE"], ["WATTS", "IN RAIN."]],
  // Closest to the film: keeps the gate and the moments.
  gate: [...FIRST, ["I WATCHED", "FUSES"], ["GLITTER IN", "THE DARK"], ["NEAR THE", "SOLAR GATE."], ["ALL THOSE", "MOMENTS"], ["LOGGED", "IN TIME,"], ["LIKE AMPS", "IN RAIN."]],
  // Turns the ending over: nothing is lost.
  kept: [...FIRST, ["I WATCHED", "FUSES"], ["GLITTER IN", "THE DARK."], ["ALL THOSE", "MOMENTS"], ["WILL NOT", "BE LOST"], ["IN TIME.", "EVERY AMP"], ["IS", "LOGGED."]],
}

// ── Arms ───────────────────────────────────────────────────────────────────────────────────

type Order = "columns" | "loop"
/** Which fragment the finger or slot at row r of arm s carries. */
const fragment = (order: Order, s: 1 | -1, r: number) => (s > 0 ? (order === "loop" ? 5 - r : r) : 6 + r)

/** A way's number, upright, h high and no wider than max, centred at (x, y) on arm s. */
const number = (s: 1 | -1, way: number, h: number, max: number, x: number, y: number, w = 0.3) => {
  const t = centred(text(0, 0, h, String(way), { w }))
  const b = bbox(t)
  const k = Math.min(1, max / (b.x1 - b.x0 + w))
  return upright(s, k < 1 ? centred(text(0, 0, h * k, String(way), { w })) : t, x, y)
}

/** The quote on a finger, two lines, read along the arm. `down` turns the odd arm's to read down it too. */
const fingerQuote = (s: 1 | -1, lines: string[], x: number, down: boolean) =>
  down
    ? join(...lines.map((l, k) => spine(s, text(0, 0, 1, l, { anchor: "middle" }), x, EDGE + (s > 0 ? 2.35 - 1.6 * k : 1.75 + 1.6 * k))))
    : join(...lines.map((l, k) => text(x, EDGE + 1.75 + 1.6 * k, 1, l, { anchor: "middle" })))

// One line a slot, re-broken so the longest still fits the arm's depth at 1 mm.
const ONE_LINE = [
  "I'VE SEEN THINGS",
  "YOU PEOPLE",
  "WOULDN'T BELIEVE.",
  "FRIDGES DRAWING",
  "AMPS OFF THE",
  "SHOULDER OF ORION.",
  ...QUOTES.kept.slice(6).map((l) => l.join(" ")),
]

type ArmStyle = "chevron-number" | "plate" | "plate-one" | "plate-edge" | "big"
const arm = (s: 1 | -1, style: ArmStyle, quote: string[][], order: Order): Art =>
  join(
    ...[0, 1, 2, 3, 4, 5].flatMap((i) => {
      const x = i * PITCH
      const way = wayOf(s, i)
      const lines = quote[fragment(order, s, rowOf(s, i))]
      if (style === "chevron-number")
        // One chevron off the nut, the number upright against the panel.
        return [chevron(x, 11.6, way === 1), number(s, way, 2.5, 3.1, x, 14.85), fingerQuote(s, lines, x, true)]
      if (style === "big")
        // Nothing but the number, as large as the gap between the ring and the panel takes.
        return [number(s, way, 4, 5.0, x, 13.75, 0.4), fingerQuote(s, lines, x, false)]
      if (style === "plate-edge")
        // Round three: the one line set against the panel's side, where the fingers are.
        return [
          ...[11.4, 13.0, 14.6].map((y) => chevron(x, y, way === 1)),
          number(s, way, 2.8, 3.6, x, EDGE + 2.3),
          upright(
            s,
            text(0, 0.45, 1, ONE_LINE[fragment(order, s, rowOf(s, i))], { anchor: s > 0 ? "end" : "start" }),
            s > 0 ? x - PITCH / 2 : x + PITCH / 2,
            EDGE - 0.9,
          ),
        ]
      if (style === "plate-one")
        // Round two: as below, with the quote on one line, midway between two nuts.
        return [
          ...[11.4, 13.0, 14.6].map((y) => chevron(x, y, way === 1)),
          number(s, way, 2.8, 3.6, x, EDGE + 2.3),
          upright(s, centred(text(0, 0, 1, ONE_LINE[fragment(order, s, rowOf(s, i))])), s > 0 ? x - PITCH / 2 : x + PITCH / 2, 8.35),
        ]
      // Rev A's three chevrons, the number on the finger, the quote upright between the nuts.
      const slot = s > 0 ? x - PITCH / 2 : x + PITCH / 2
      return [
        ...[11.4, 13.0, 14.6].map((y) => chevron(x, y, way === 1)),
        number(s, way, 2.8, 3.6, x, EDGE + 2.3),
        ...lines.map((l, k) => upright(s, text(0, 0, 1, l, { anchor: "middle" }), slot, 8.4)).map((a, k) =>
          mapArt(a, (p) => P(p.x + (s > 0 ? 0.25 - 1.5 * k : -0.25 + 1.5 * k), p.y)),
        ),
      ]
    }),
  )

// ── The chin ───────────────────────────────────────────────────────────────────────────────

/** The wordmark, w wide, its top at y. Split: BLADE ends at −gap and READER starts at +gap. Whole: its word gap on the centreline. */
const wordmark = (w: number, y: number, gap: number | null) => {
  const rings = logo(0, 0, w).fills[0]
  const spans = rings.map((r) => [Math.min(...r.map((p) => p.x)), Math.max(...r.map((p) => p.x))]).sort((p, q) => p[0] - q[0])
  let reach = spans[0][1]
  let split = { at: 0, size: 0, left: 0, right: 0 }
  for (const [x0, x1] of spans) {
    if (x0 - reach > split.size) split = { at: (x0 + reach) / 2, size: x0 - reach, left: reach, right: x0 }
    reach = Math.max(reach, x1)
  }
  const centre = (r: Pt[]) => (Math.min(...r.map((p) => p.x)) + Math.max(...r.map((p) => p.x))) / 2
  const shift = (r: Pt[], dx: number) => r.map((p) => P(p.x + dx, p.y + y))
  if (gap === null) return art([], [rings.map((r) => shift(r, -split.at))])
  return art(
    [],
    [
      rings.filter((r) => centre(r) < split.at).map((r) => shift(r, -gap - split.left)),
      rings.filter((r) => centre(r) > split.at).map((r) => shift(r, gap - split.right)),
    ],
  )
}

/** A spec cell centred on x: label, rule, two lines. */
const cell = ([label, a, b]: string[], x: number, y: number, rule = true) =>
  join(
    text(x, y, 0.8, label, { anchor: "middle", ls: 0.06 }),
    rule ? line([[x - 3, y + 0.55], [x + 3, y + 0.55]]) : art(),
    text(x, y + 2.2, 1, a, { anchor: "middle" }),
    text(x, y + 3.9, 1, b, { anchor: "middle" }),
  )

/** Where the USB socket is, under the board: a label between its stakes and an arrow to the edge. */
const usbMark = (y: number) =>
  join(text(-25, y, 0.9, "USB", { anchor: "middle" }), line([[-25, y + 0.7], [-25, y + 2.3]]), line([[-25.7, y + 1.6], [-25, y + 2.3], [-24.3, y + 1.6]]))

const SIGN = join(frame(-56, -7.4, 5.8, 22.4, 1), kana(-53.1, -6.1, 2.3, 2.55))
const polarity = join(ring(0, 12.6, 3.2, 0.3), line([[-1.7, 12.6], [1.7, 12.6]], 0.4), line([[0, 10.9], [0, 14.3]], 0.4))
const makers = (x: number, y: number) =>
  mapArt(join(crux(0, -2.9, 2.0), text(2.8, -2.1, 0.8, "DESIGNED IN"), text(2.8, -0.9, 0.8, "AUSTRALIA")), turn(x, y, 0))

const CHIN: Record<string, () => Art> = {
  // The steer taken as given: the wordmark above, split by the feed, the spec plate in a row under it.
  a: () =>
    join(
      wordmark(69, 8.9, 7.8),
      line([[-7.2, 9.2], [-7.2, 21.4]]),
      line([[7.2, 9.2], [7.2, 21.4]]),
      polarity,
      cell(["OUTPUT NUT", "M4", "1.0-1.2 Nm"], -14.3, 16.5),
      usbMark(18.3),
      cell(["DERATE", "20 A PER WAY", "ABOVE 40 °C"], -36.6, 16.5),
      cell(["REVISION", "B", "2026-10"], -46.3, 16.5),
      cell(["LICENCE", "CERN-OHL-S-2.0", ""], 17.6, 16.5),
      cell(["SOURCE", "XDGFX", "/BLADE-READER"], 31.2, 16.5),
      SIGN,
      // The twin: as tall as the ground nut leaves, holding the maker's mark.
      frame(50.2, -7.4, 5.8, 11.2, 1),
      crux(52.35, -6.4, 2.0),
      mapArt(join(text(0, 0, 0.75, "DESIGNED IN"), text(0, 1.35, 0.75, "AUSTRALIA")), turn(53.75, -3.75, 90)),
      text(g.x, g.y + 7.4, 1.2, "GND", { anchor: "middle" }),
      earth(g.x, g.y + 8.1),
    ),
  // A data plate: one frame either side of the feed, ruled into cells, the wordmark in its top row.
  b: () => {
    const [top, mid, bot] = [8.9, 15.1, 21.5]
    const plate = (x0: number, x1: number, cuts: number[], gapIn?: [number, number]) =>
      join(
        roundRect(x0, top, x1 - x0, bot - top, 0.8, 0.2),
        ...(gapIn ? [line([[x0, mid], [gapIn[0], mid]], 0.2), line([[gapIn[1], mid], [x1, mid]], 0.2)] : [line([[x0, mid], [x1, mid]], 0.2)]),
        ...cuts.map((x) => line([[x, mid], [x, bot]], 0.2)),
      )
    const c = (list: string[], x: number) => cell(list, x, 16.45, false)
    return join(
      wordmark(62, 9.55, 11.4),
      // The rule breaks round the USB socket's stakes.
      plate(-49.6, -10.4, [-19.4, -30.6, -41.6], [-30.6, -19.4]),
      plate(10.4, 45.4, [22.9, 35.0]),
      c(["OUTPUT NUT", "M4", "1.0-1.2 Nm"], -14.9),
      usbMark(18.3),
      c(["DERATE", "20 A PER WAY", "ABOVE 40 °C"], -36.1),
      c(["REV", "B", "2026-10"], -45.6),
      c(["LICENCE", "CERN-OHL", "-S-2.0"], 16.65),
      c(["SOURCE", "XDGFX", "/BLADE-READER"], 28.95),
      c(["FITS", "ST BLADE", "12 WAY"], 40.2),
      SIGN,
      text(g.x - 1.8, g.y - 8.6, 1.2, "GND"),
      earth(g.x + 0.1, g.y - 7.3),
      makers(46.6, -4),
    )
  },
  // Quiet: the wordmark whole, across the feed, and only what an installer needs under it.
  c: () =>
    join(
      wordmark(69, 8.9, null),
      text(-14.3, 19.4, 1, "REV B", { anchor: "middle" }),
      usbMark(18.3),
      text(-40.6, 19.4, 1, "20 A PER WAY ABOVE 40 °C", { anchor: "middle" }),
      text(11, 19.4, 1, "OUTPUT NUT M4 1.0-1.2 Nm"),
      SIGN,
      text(g.x - 1.8, g.y - 8.6, 1.2, "GND"),
      earth(g.x + 0.1, g.y - 7.3),
      makers(36.5, 21),
    ),
}

// ── Round two: A's chin with no feed marked, and three ways to close the wordmark's gap ─────

/** The wordmark's two words, w wide overall, each with its left edge at x = 0, and its slant: how far the top leans right. */
const words = (w: number) => {
  const rings = logo(0, 0, w).fills[0]
  const lo = (r: Pt[]) => Math.min(...r.map((p) => p.x))
  const hi = (r: Pt[]) => Math.max(...r.map((p) => p.x))
  const all = rings.flat()
  const H = Math.max(...all.map((p) => p.y))
  const mid = w * 0.429
  const part = (keep: (r: Pt[]) => boolean) => {
    const rs = rings.filter(keep)
    const x0 = Math.min(...rs.map(lo))
    return { rings: rs.map((r) => r.map((p) => P(p.x - x0, p.y))), w: Math.max(...rs.map(hi)) - x0 }
  }
  const first = rings.reduce((a, b) => (lo(a) < lo(b) ? a : b))
  // The slant, measured off a render: the letters are cut into pieces, so no one edge gives it.
  const k = 0.21
  return { blade: part((r) => (lo(r) + hi(r)) / 2 < mid), reader: part((r) => (lo(r) + hi(r)) / 2 > mid), H, k }
}
/** BLADE from x = left and READER to x = right, tops at y, with whatever `between` draws from BLADE's end to READER's start. */
const banner = (w: number, y: number, left: number, right: number, between: (x0: number, x1: number, H: number, k: number) => Art) => {
  const { blade, reader, H, k } = words(w)
  const put = (rs: Pt[][], dx: number) => rs.map((r) => r.map((p) => P(p.x + dx, p.y + y)))
  return join(art([], [put(blade.rings, left), put(reader.rings, right - reader.w)]), between(left + blade.w, right - reader.w, H, k))
}
/** Bars on the wordmark's slant, t wide, filling x0 to x1 with the letters' own spacing either end. */
const bars = (y: number, t = 1.1, g = 0.9) => (x0: number, x1: number, H: number, k: number) => {
  const a = x0 - k * H + g
  const n = Math.max(1, Math.floor((x1 - g - a - t) / (2 * t)) + 1)
  const p = n > 1 ? (x1 - g - a - t) / (n - 1) : 0
  return art([], Array.from({ length: n }, (_, i) => a + i * p).map((x) => [[P(x, y + H), P(x + t, y + H), P(x + t + k * H, y), P(x + k * H, y)]]))
}
const UNICORN: [number, number][][] = [
  [[1.6, 6], [7.2, 4.8], [7.8, 7.3], [2.2, 7.6], [1.6, 6]],
  [[1.6, 6], [7.8, 7.3]],
  [[7.2, 4.8], [8.2, 1.6], [9.1, 2], [7.8, 7.3]],
  [[8.2, 1.6], [10.4, 2.9], [9.1, 2]],
  [[8.6, 1.8], [10.8, -1.6], [9, 1.95]],
  [[1.6, 6], [0, 8.3], [2.2, 7.6]],
  [[2.4, 7.55], [2, 10.4], [3, 7.5]],
  [[3.6, 7.45], [3.9, 10.4], [4.2, 7.4]],
  [[6.4, 7.35], [6.1, 10.4], [7, 7.32]],
  [[7.3, 7.3], [7.8, 10.4], [7.8, 7.3]],
]
const unicorn = (ox: number, oy: number, k: number) => join(...UNICORN.map((p) => line(p.map(([x, y]) => [ox + x * k, oy + y * k]))))

/** A's chin without the feed's corridor or polarity, under whichever banner. */
const chinA = (top: Art) =>
  join(
    top,
    cell(["OUTPUT NUT", "M4", "1.0-1.2 Nm"], -14.3, 16.5),
    usbMark(18.3),
    cell(["DERATE", "20 A PER WAY", "ABOVE 40 °C"], -36.6, 16.5),
    cell(["REVISION", "B", "2026-10"], -46.3, 16.5),
    cell(["LICENCE", "CERN-OHL-S-2.0", ""], 17.6, 16.5),
    cell(["SOURCE", "XDGFX", "/BLADE-READER"], 31.2, 16.5),
    SIGN,
    frame(50.2, -7.4, 5.8, 11.2, 1),
    crux(52.35, -6.4, 2.0),
    mapArt(join(text(0, 0, 0.75, "DESIGNED IN"), text(0, 1.35, 0.75, "AUSTRALIA")), turn(53.75, -3.75, 90)),
    text(g.x, g.y + 7.4, 1.2, "GND", { anchor: "middle" }),
    earth(g.x, g.y + 8.1),
  )
const ROUND2: Record<string, () => Art> = {
  // Centred on the feed as before, the gap closed with bars on the letters' slant.
  d: () => chinA(banner(69, 8.9, -7.8 - words(69).blade.w, 7.8 + words(69).reader.w, bars(8.9))),
  // Cal's: B on the panel's left side, R on its right, bars between.
  e: () => chinA(banner(64, 9.1, -PANEL.half, PANEL.half, bars(9.1))),
  // The same, with the unicorn where no feed covers it and bars under the lug.
  f: () =>
    chinA(
      banner(64, 9.1, -PANEL.half, PANEL.half, (x0, x1, H, k) =>
        join(unicorn(x0 + 1.2, 9.1 + 0.75, 0.42), bars(9.1)(x0 + 6.6, x1, H, k)),
      ),
    ),
  // Cal's second: the wordmark on two lines right of the feed, the spec plate on two rows left of it.
  g: () => {
    const { blade, reader, H, k } = words(74)
    const put = (rs: Pt[][], dx: number, y: number) => rs.map((r) => r.map((p) => P(p.x + dx, p.y + y)))
    // The lower line starts clear of the tooling hole; the upper follows the slant up from it.
    const [x, y0, y1] = [10.3, 8.9, 21.5 - H]
    return join(
      art([], [put(blade.rings, x + k * (y1 - y0), y0), put(reader.rings, x, y1)]),
      cell(["REVISION", "B", "2026-10"], -41, 10.1),
      cell(["DERATE", "20 A PER WAY", "ABOVE 40 °C"], -28.2, 10.1),
      cell(["OUTPUT NUT", "M4", "1.0-1.2 Nm"], -14.3, 10.1),
      cell(["SOURCE", "XDGFX", "/BLADE-READER"], -37.6, 16.5),
      usbMark(18.3),
      cell(["LICENCE", "CERN-OHL-S-2.0", ""], -14.3, 16.5),
      SIGN,
      frame(50.2, -7.4, 5.8, 11.2, 1),
      crux(52.35, -6.4, 2.0),
      mapArt(join(text(0, 0, 0.75, "DESIGNED IN"), text(0, 1.35, 0.75, "AUSTRALIA")), turn(53.75, -3.75, 90)),
    )
  },
}

// ── Variants ───────────────────────────────────────────────────────────────────────────────

type Variant = { key: string; name: string; arm: ArmStyle; quote: keyof typeof QUOTES; order: Order; notes: [string, string][] }
const VARIANTS: Variant[] = [
  {
    key: "a",
    name: "A · Plate",
    arm: "chevron-number",
    quote: "gate",
    order: "columns",
    notes: [
      ["Wordmark", "69 × 5.5 mm, above the plate, split 7.8 either side of the centreline. Always whole, wired or not."],
      ["Way numbers", "Upright, 2.5 mm, against the panel. Odd on the left, 1–2 at the open end."],
      ["Chevrons", "One per way, off the nut; way 1's filled."],
      ["Spec plate", "Five cells in a row under the wordmark: revision, derate, output nut, licence, source."],
      ["Signs", "The kana sign, and a half-height twin over the ground nut holding the maker's mark."],
      ["Quote", "On the fingers, read down each arm, left then right. Copy: the gate."],
    ],
  },
  {
    key: "b",
    name: "B · Data plate",
    arm: "plate",
    quote: "kept",
    order: "columns",
    notes: [
      ["Wordmark", "62 × 5.0 mm, split, inside a ruled frame either side of the feed. The frame costs it 0.5 mm."],
      ["Way numbers", "Upright, 2.8 mm, on each finger beside its way screw."],
      ["Chevrons", "Three per way, as rev A; way 1's filled."],
      ["Spec plate", "Seven ruled cells, with FITS ST BLADE 12 WAY brought back and the USB stakes in a cell of their own."],
      ["Signs", "The kana sign only. GND and the maker's mark share the other shoulder."],
      ["Quote", "Upright, between the nuts, where no ring or wire covers it. Copy: nothing is lost."],
    ],
  },
  {
    key: "c",
    name: "C · Quiet",
    arm: "big",
    quote: "watts",
    order: "loop",
    notes: [
      ["Wordmark", "69 × 5.5 mm, whole, its word gap on the centreline. The feed lug hides the E and the R."],
      ["Way numbers", "Upright, 4 mm, filling the gap between ring and panel."],
      ["Chevrons", "None."],
      ["Spec plate", "One line: revision, derate, nut torque. Date, licence and source go to the parts face."],
      ["Signs", "The kana sign only."],
      ["Quote", "On the fingers, up the left arm and down the right, as the first take. Copy: the placeholder."],
    ],
  },
]

const ARMS2: [string, string][] = [
  ["Arms", "B's: three chevrons, the number on the finger, and the quote on one line midway between two nuts."],
  ["Chin", "A's, with no feed corridor and no polarity mark: the feed may leave down, left or right."],
]
VARIANTS.push(
  {
    key: "d",
    name: "D · Bars, centred",
    arm: "plate-one",
    quote: "kept",
    order: "columns",
    notes: [["Wordmark", "69 × 5.5 mm, centred on the feed as in A, the gap closed with bars on the letters' slant. A feed run down covers bars only."], ...ARMS2],
  },
  {
    key: "e",
    name: "E · Bars, on the panel's sides",
    arm: "plate-one",
    quote: "kept",
    order: "columns",
    notes: [["Wordmark", "64 × 5.1 mm: B starts on the panel's left side and R ends on its right, bars between. The gap sits 4.5 mm left of centre, since READER is the longer word."], ...ARMS2],
  },
  {
    key: "f",
    name: "F · Unicorn",
    arm: "plate-one",
    quote: "kept",
    order: "columns",
    notes: [["Wordmark", "As E, with Gaff's unicorn after BLADE, clear of a feed run down, and bars under the lug."], ...ARMS2],
  },
  {
    key: "g",
    name: "G · Stacked",
    arm: "plate-one",
    quote: "kept",
    order: "columns",
    notes: [
      ["Wordmark", "74 × 5.9 mm, on two lines right of the feed: the largest yet. It has to be the right, since the USB stakes are in the left's lower line."],
      ["Spec plate", "Two rows of cells left of the feed. The gap down the middle is the gutter between two blocks, not a hole in a word."],
      ["GND", "No label: READER's end has the space under the ground nut."],
      ...ARMS2,
    ],
  },
)
Object.assign(CHIN, ROUND2)

// ── Round three: G, gridded, with the unicorn under the feed and the chin's inner edge drawn ─

// The chin's inner edge, where it wraps the panel's end: from one arm's root round to the other's, in the chin's view.
const WRAP = [...OUTLINE.slice(-16), ...OUTLINE.slice(0, 17)].map(yokeAt).map((p) => P(-p.x, -p.y + CHIN_SHIFT))
/** The wrap moved t into the board, with each point's outward normal. */
const wrap = (t: number) =>
  WRAP.map((p, i) => {
    const [a, b] = [WRAP[Math.max(i - 1, 0)], WRAP[Math.min(i + 1, WRAP.length - 1)]]
    const len = Math.hypot(b.x - a.x, b.y - a.y)
    const n = P((b.y - a.y) / len, -(b.x - a.x) / len)
    return { p: P(p.x + n.x * t, p.y + n.y * t), n }
  })
const keyline = (t: number, w = 0.2) => art([{ pts: wrap(t).map((q) => q.p), w }])
/** Graduations off the line at t, every `step` mm along it: short ones, and a long one every fifth. */
const graduations = (t: number, step: number) => {
  const pts = wrap(t)
  const out: Art[] = []
  let [run, next, count] = [0, 0, 0]
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1], pts[i]]
    const len = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y)
    while (next <= run + len) {
      const u = (next - run) / len
      const [x, y] = [a.p.x + (b.p.x - a.p.x) * u, a.p.y + (b.p.y - a.p.y) * u]
      const [nx, ny] = [a.n.x + (b.n.x - a.n.x) * u, a.n.y + (b.n.y - a.n.y) * u]
      const l = count % 5 === 0 ? 0.85 : 0.45
      out.push(line([[x, y], [x + nx * l, y + ny * l]]))
      next += step
      count++
    }
    run += len
  }
  return join(...out)
}

// The spec plate as a grid: three columns 12 apart and two rows, the USB socket's stakes one of its cells.
const COLS = [-37, -25, -13]
const ROWS = [10.7, 17.3]
const gridCell = (col: number, row: number, label: string, a = "", b = "") => {
  const [x, y] = [COLS[col], ROWS[row]]
  return join(
    text(x, y, 0.8, label, { anchor: "middle", ls: 0.06 }),
    line([[x - 5, y + 0.55], [x + 5, y + 0.55]]),
    text(x, y + 2.05, 1, a, { anchor: "middle" }),
    text(x, y + 3.6, 1, b, { anchor: "middle" }),
  )
}
const chinG = (edge: Art) => {
  const { blade, reader, H, k } = words(67)
  const put = (rs: Pt[][], dx: number, y: number) => rs.map((r) => r.map((p) => P(p.x + dx, p.y + y)))
  const [x, y0, y1] = [10.3, 9.95, 21.5 - H]
  return join(
    edge,
    art([], [put(blade.rings, x + k * (y1 - y0), y0), put(reader.rings, x, y1)]),
    gridCell(0, 0, "REVISION", "B", "2026-10"),
    gridCell(1, 0, "DERATE", "20 A PER WAY", "ABOVE 40 °C"),
    gridCell(2, 0, "OUTPUT NUT", "M4", "1.0-1.2 Nm"),
    gridCell(0, 1, "SOURCE", "XDGFX", "/BLADE-READER"),
    gridCell(1, 1, "USB"),
    line([[-25, 19.0], [-25, 21.0]]),
    line([[-25.7, 20.3], [-25, 21.0], [-24.3, 20.3]]),
    gridCell(2, 1, "LICENCE", "CERN-OHL", "-S-2.0"),
    // Under a feed run down the chin; in view when it leaves to one side.
    unicorn(-4.75, 11.45, 0.88),
    SIGN,
    text(g.x - 1.8, g.y - 8.6, 1.2, "GND"),
    earth(g.x + 0.1, g.y - 7.3),
    makers(46.6, -4),
  )
}
Object.assign(CHIN, {
  // Two lines round the panel's end, as the kana sign's frame has.
  h: () => chinG(join(keyline(0.45), keyline(1.0))),
  // A meter's scale round the panel's end.
  i: () => chinG(join(keyline(0.45, 0.15), graduations(0.45, 1.9))),
})
const ROUND3: [string, string][] = [
  ["Wordmark", "67 × 5.35 mm on two lines right of the feed: 0.55 mm shorter than G, which is what the edge treatment takes."],
  ["Spec plate", "A grid of three columns 12 mm apart and two rows, every rule 10 mm. The USB stakes are the lower middle cell."],
  ["Unicorn", "On the centreline, 9.5 × 10.6 mm: under a feed run down, in view when it leaves to a side."],
  ["Shoulder", "No frame round the maker's mark, so GND is back above the ground nut."],
  ["Arms", "The quote set against the panel's side: ranged right on the odd arm, left on the even."],
]
VARIANTS.push(
  { key: "h", name: "H · Keyline", arm: "plate-edge", quote: "kept", order: "columns", notes: [["Inner edge", "Two lines 0.55 apart round the panel's end and up to each arm's root, echoing the kana sign's frame."], ...ROUND3] },
  { key: "i", name: "I · Scale", arm: "plate-edge", quote: "kept", order: "columns", notes: [["Inner edge", "One line with a meter's graduations every 1.9 mm, each fifth longer: the chin as the dial of an ammeter."], ...ROUND3] },
)

// The USB socket's shell stakes and pegs come through the chin (chin view: x, y, half width, half height).
const STAKES = [[-29.33, 15.74, 0.6, 1.0], [-20.67, 15.74, 0.6, 1.0], [-29.33, 19.92, 0.6, 0.9], [-20.67, 19.92, 0.6, 0.9]]
const PEGS = [[-22.1, 16.24], [-27.9, 16.24]]

const yokeBoard = (v: Variant, wired: boolean) => {
  const out: string[] = []
  out.push(poly(ANTENNA_AREA.map(yokeAt), "#15301f", `stroke="${C.edge}" stroke-width="0.2"`))
  out.push(poly(OUTLINE.map(yokeAt), C.mask, `stroke="${C.edge}" stroke-width="0.25"`))
  out.push(silk(mapArt(CHIN[v.key](), chinAt)))
  for (const s of sides) out.push(silk(arm(s, v.arm, QUOTES[v.quote], v.order), armAt(s)))
  for (const [x, y, w, h] of STAKES) {
    const p = chinAt(P(x, y))
    out.push(rect(p.x - w, p.y - h, 2 * w, 2 * h, C.tin, `rx="${w}"`))
  }
  for (const [x, y] of PEGS) out.push(disc(chinAt(P(x, y)), 0.3, C.bulkhead))
  for (const t of TOOLING) out.push(disc(yokeAt(t), 0.576, C.bulkhead))
  for (const h of CLAMPS) out.push(clamp(yokeAt(h)))
  NUTS.forEach((h, i) => {
    const p = yokeAt(h)
    out.push(wired ? ringTerminal(p, P(Math.sign(p.x), 0), 60, WIRE[i % 6]) : nut(p))
  })
  out.push(wired ? ringTerminal(G, P(Math.sign(G.x) * 0.5, -0.866), 60, C.black, 2.6) : nut(G))
  return out.join("")
}

// ── Sheets ─────────────────────────────────────────────────────────────────────────────────

type View = { x0: number; y0: number; w: number; h: number }
const FULL: View = { x0: -98, y0: -44, w: 196, h: 222 }
const CHIN_VIEW: View = { x0: -64, y0: -26, w: 128, h: 62 }
const ARM_VIEW: View = { x0: -64, y0: 60, w: 128, h: 46 }

const scene = (v: Variant, wired: boolean) =>
  [
    panel(),
    yokeBoard(v, wired),
    wired ? feed(11.33, -1, FULL.y0, C.red) + feed(153, 1, FULL.y0 + FULL.h, C.black) : stud(P(0, 11.33)) + stud(P(0, 153)),
  ].join("")

let clip = 0
/** One view of a scene, clipped, drawn as fitted: positive end down. */
const view = (body: string, v: View) => {
  const id = `c${clip++}`
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${v.w} ${v.h}">` +
    `<clipPath id="${id}"><rect x="${v.x0}" y="${v.y0}" width="${v.w}" height="${v.h}"/></clipPath>` +
    `<g transform="translate(${v.x0 + v.w} ${v.y0 + v.h}) rotate(180)"><g clip-path="url(#${id})">` +
    rect(v.x0, v.y0, v.w, v.h, C.bulkhead) +
    body +
    `</g></g></svg>`
  )
}

const section = (v: Variant) => {
  const [bare, wired] = [scene(v, false), scene(v, true)]
  const fig = (title: string, body: string, vw: View, cls = "") => `<figure class="${cls}"><figcaption>${title}</figcaption>${view(body, vw)}</figure>`
  return (
    `<section data-variant="${v.key}"><h2>${v.name}</h2>` +
    `<dl>${v.notes.map(([k, t]) => `<dt>${k}</dt><dd>${t}</dd>`).join("")}</dl>` +
    fig("The chin, fitted", bare, CHIN_VIEW, "wide") +
    fig("The chin, wired", wired, CHIN_VIEW, "wide") +
    fig("Ways 1–6, fitted", bare, ARM_VIEW, "wide") +
    fig("Ways 1–6, wired", wired, ARM_VIEW, "wide") +
    `<div class="pair">${fig("Fitted", bare, FULL)}${fig("Wired", wired, FULL)}</div>` +
    `</section>`
  )
}

const html = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>PROTOTYPE: ring-face silkscreen</title>
<style>
  body { margin: 0 0 90px; font: 15px/1.45 -apple-system, Helvetica, Arial, sans-serif; color: #1b1b1b; background: #f3f1ec; }
  main { max-width: 1500px; margin: 0 auto; padding: 16px; }
  section { display: none; } section.on { display: block; }
  h1 { font-size: 16px; font-weight: 600; margin: 0 0 4px; } h2 { margin: 12px 0 8px; }
  p { margin: 0 0 8px; max-width: 80ch; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 2px 14px; margin: 0 0 14px; max-width: 110ch; }
  dt { font-weight: 600; } dd { margin: 0; }
  figure { margin: 0 0 14px; } figcaption { font-size: 13px; color: #555; margin-bottom: 3px; }
  svg { display: block; width: 100%; height: auto; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  nav { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); background: #111; border-radius: 999px; padding: 6px; display: flex; gap: 4px; box-shadow: 0 4px 18px #0006; }
  nav button { font: inherit; color: #ddd; background: none; border: 0; border-radius: 999px; padding: 8px 16px; cursor: pointer; }
  nav button.on { background: #f4f3ee; color: #111; }
</style>
<main>
<h1>PROTOTYPE · Ring-face silkscreen for the yoke · issue #81</h1>
<p>Three takes on the placed outline, each drawn as fitted, positive end down. Left and right arrow keys switch. Mix freely: every row of a variant's list is independent of the others.</p>
${VARIANTS.map(section).join("\n")}
</main>
<nav>${VARIANTS.map((v) => `<button data-v="${v.key}">${v.name}</button>`).join("")}</nav>
<script>
  const keys = ${JSON.stringify(VARIANTS.map((v) => v.key))}
  const show = (k) => {
    if (!keys.includes(k)) k = keys[0]
    document.querySelectorAll("section").forEach((s) => s.classList.toggle("on", s.dataset.variant === k))
    document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === k))
    history.replaceState(null, "", "?variant=" + k)
  }
  document.querySelectorAll("nav button").forEach((b) => (b.onclick = () => show(b.dataset.v)))
  addEventListener("keydown", (e) => {
    const i = keys.indexOf(new URLSearchParams(location.search).get("variant"))
    if (e.key === "ArrowRight") show(keys[(i + 1) % keys.length])
    if (e.key === "ArrowLeft") show(keys[(i + keys.length - 1) % keys.length])
  })
  show(new URLSearchParams(location.search).get("variant"))
</script>
`
const dir = import.meta.dir
writeFileSync(`${dir}/ring-face.html`, html)
// Stills for the issue, one per variant.
for (const v of VARIANTS) {
  writeFileSync(`${dir}/chin-${v.key}.svg`, view(scene(v, false), CHIN_VIEW))
  writeFileSync(`${dir}/chin-${v.key}-wired.svg`, view(scene(v, true), CHIN_VIEW))
  writeFileSync(`${dir}/arms-${v.key}.svg`, view(scene(v, false), ARM_VIEW))
  writeFileSync(`${dir}/arms-${v.key}-wired.svg`, view(scene(v, true), ARM_VIEW))
}
console.log(`wrote ${dir}/ring-face.html`)
