// Silkscreen drawing primitives: white on black mask. The yoke's ring face is laid out in
// ring-face.ts; its parts face is not laid out yet.
//
// Art is drawn in a face's own coordinates, in mm with y running down, then mapped to the
// board's with mapArt and placed with <Face>.
//
// tscircuit's own text strokes at 0.09 × its size, too thin to print below about 1.7 mm, and it
// can't fill a path or a circle. So text is drawn here from its stroke alphabet at 0.15 mm,
// fills go through <silkscreengraphic> as SVG polygons, and dots are zero-length fat strokes.
// The footprints' stock silk is dropped at export by scripts/silk.ts, which also checks every
// line against the pads.

import { lineAlphabet } from "@tscircuit/alphabet"
import { Fragment } from "react"
import kanaJson from "./art/kana.json"
import logoJson from "./art/logo.json"
import type { Pt } from "./outline"

/** JLC's minimum silk line. */
const SW = 0.15
/** Clear space between glyphs, a space's advance and the degree sign's radius, per em. */
const GAP = 0.12
const SPACE = 0.4
const DEGREE = 0.2
/** The alphabet's baseline, in em. */
const BASELINE = 0.051

type Stroke = { pts: Pt[]; w: number }
/** Strokes and filled polygons; a fill is a set of rings, nested rings cut holes. */
type Art = { strokes: Stroke[]; fills: Pt[][][] }

const art = (strokes: Stroke[] = [], fills: Pt[][][] = []): Art => ({ strokes, fills })
const join = (...parts: Art[]): Art => ({
  strokes: parts.flatMap((a) => a.strokes),
  fills: parts.flatMap((a) => a.fills),
})
const mapArt = (a: Art, f: (p: Pt) => Pt): Art => ({
  strokes: a.strokes.map((s) => ({ ...s, pts: s.pts.map(f) })),
  fills: a.fills.map((g) => g.map((r) => r.map(f))),
})
/** SVG's translate(x0 y0) rotate(deg), in a y-down face. */
const turn = (x0: number, y0: number, deg: number) => {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return ({ x, y }: Pt): Pt => ({ x: x0 + x * c - y * s, y: y0 + x * s + y * c })
}

const P = (x: number, y: number): Pt => ({ x, y })
const line = (pts: [number, number][], w = SW) => art([{ pts: pts.map(([x, y]) => P(x, y)), w }])
const dot = (x: number, y: number, d: number) => line([[x, y], [x + 0.001, y]], d)
const circle = (cx: number, cy: number, r: number, steps = 24) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = (2 * Math.PI * i) / steps
    return P(cx + r * Math.cos(a), cy + r * Math.sin(a))
  })
const ring = (cx: number, cy: number, r: number, w = SW) => art([{ pts: circle(cx, cy, r), w }])

/** A rectangle with corner radius r, as a closed line. */
const roundRect = (x: number, y: number, w: number, h: number, r: number, sw: number) => {
  const corner = (cx: number, cy: number, a0: number) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = ((a0 + (90 * i) / 4) * Math.PI) / 180
      return P(cx + r * Math.cos(a), cy + r * Math.sin(a))
    })
  const pts = [
    ...corner(x + w - r, y + r, -90),
    ...corner(x + w - r, y + h - r, 0),
    ...corner(x + r, y + h - r, 90),
    ...corner(x + r, y + r, 180),
  ]
  return art([{ pts: [...pts, pts[0]], w: sw }])
}

type TextOpts = { anchor?: "start" | "middle" | "end"; ls?: number; w?: number }

/** A glyph's ink: its strokes in em, x from its left edge, and its width. */
type Glyph = { segs: { x1: number; y1: number; x2: number; y2: number }[]; ink: number }
const glyph = (ch: string): Glyph => {
  const segs = lineAlphabet[ch]
  if (!segs) throw new Error(`silkscreen: the alphabet has no "${ch}"`)
  const xs = segs.flatMap((g) => [g.x1, g.x2])
  const x0 = Math.min(...xs)
  return {
    segs: segs.map((g) => ({ ...g, x1: g.x1 - x0, x2: g.x2 - x0 })),
    ink: Math.max(...xs) - x0,
  }
}

/**
 * Text in the alphabet's strokes, size s (em), baseline at y. It is spaced by each glyph's ink,
 * not on a mono grid, so a narrow I doesn't sit in a wide gap; ls adds to the gap.
 */
const text = (x: number, y: number, s: number, str: string, o: TextOpts = {}): Art => {
  const w = o.w ?? SW
  const gap = GAP * s + (o.ls ?? 0)
  // Each character's ink width in mm, without the stroke; a space is only a gap.
  const inks = [...str].map((ch) =>
    ch === " " ? SPACE * s - w : ch === "." ? 0.25 - w : ch === "°" ? 2 * DEGREE * s : glyph(ch).ink * s,
  )
  const width = inks.reduce((a, b) => a + b + w, 0) + (inks.length - 1) * gap
  const x0 = o.anchor === "middle" ? x - width / 2 : o.anchor === "end" ? x - width : x
  const strokes: Stroke[] = []
  let gx = x0 + w / 2
  ;[...str].forEach((ch, i) => {
    if (ch === ".") {
      // The alphabet's full stop is a short dash, which reads as one at this stroke.
      strokes.push(...dot(gx + inks[i] / 2, y - 0.1 * s, 0.25).strokes)
    } else if (ch === "°") {
      // The alphabet has no degree sign.
      strokes.push(...ring(gx + DEGREE * s, y - 0.5 * s, DEGREE * s, w).strokes)
    } else if (ch !== " ") {
      let run: Pt[] = []
      for (const seg of glyph(ch).segs) {
        const a = P(gx + seg.x1 * s, y - (seg.y1 - BASELINE) * s)
        const b = P(gx + seg.x2 * s, y - (seg.y2 - BASELINE) * s)
        const last = run[run.length - 1]
        if (last && Math.hypot(last.x - a.x, last.y - a.y) < 1e-6) run.push(b)
        else {
          if (run.length) strokes.push({ pts: run, w })
          run = [a, b]
        }
      }
      if (run.length) strokes.push({ pts: run, w })
    }
    gx += inks[i] + w + gap
  })
  return art(strokes)
}

/** Flattens an absolute M/L/H/V/Q/Z path, as the prototypes' outlines are, into rings. */
const pathRings = (d: string): Pt[][] => {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? []
  const rings: Pt[][] = []
  let cur: Pt[] = []
  let p = P(0, 0)
  let i = 0
  const num = () => Number(tokens[i++])
  let cmd = ""
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++]
    if (cmd === "M") {
      if (cur.length) rings.push(cur)
      p = P(num(), num())
      cur = [p]
      cmd = "L"
    } else if (cmd === "L") cur.push((p = P(num(), num())))
    else if (cmd === "H") cur.push((p = P(num(), p.y)))
    else if (cmd === "V") cur.push((p = P(p.x, num())))
    else if (cmd === "Q") {
      const c = P(num(), num())
      const e = P(num(), num())
      for (let k = 1; k <= 8; k++) {
        const t = k / 8
        const u = 1 - t
        cur.push(P(u * u * p.x + 2 * u * t * c.x + t * t * e.x, u * u * p.y + 2 * u * t * c.y + t * t * e.y))
      }
      p = e
    } else if (cmd === "Z") {
      if (cur.length) rings.push(cur)
      cur = []
    } else throw new Error(`silkscreen: unsupported path command ${cmd}`)
  }
  if (cur.length) rings.push(cur)
  return rings
}

const LOGO_RINGS = pathRings(logoJson.d)
/** The banner's BLADE READER outline, w wide, top-left at (x, y). */
const logo = (x: number, y: number, w: number) => {
  const k = w / logoJson.w
  return art([], [LOGO_RINGS.map((r) => r.map((p) => P(x + (p.x - logoJson.x0) * k, y + (p.y - logoJson.y0) * k)))])
}

const KANA = kanaJson as Record<string, { d: string }>
/** ブレードリーダー down a column centred on cx, em size s, first glyph's top at y, pitch p. */
const kana = (cx: number, y: number, s: number, p: number) =>
  art(
    [],
    [..."ブレードリーダー"].map((ch, i) =>
      pathRings(KANA[ch].d).map((r) =>
        r.map(({ x, y: v }) => {
          // Vertical text turns the long-vowel mark upright: rotate(90) about the em's centre.
          const [u, w] = ch === "ー" ? [1 - v, x] : [x, v]
          return P(cx - s / 2 + u * s, y + i * p + w * s)
        }),
      ),
    ),
  )

/** Two nested round frames, 0.55 apart. */
const frame = (x: number, y: number, w: number, h: number, r: number) =>
  join(...[0, 0.55].map((i) => roundRect(x + i, y + i, w - 2 * i, h - 2 * i, Math.max(r - i, 0.2), 0.2)))

const CHEVRON = (x: number, y: number): Pt[] => [
  P(x - 1.4, y + 0.9),
  P(x, y - 0.5),
  P(x + 1.4, y + 0.9),
  P(x + 1.4, y + 1.6),
  P(x, y + 0.2),
  P(x - 1.4, y + 1.6),
]
/** A chevron pointing up the face, filled for Sensor 1. */
const chevron = (x: number, y: number, solid: boolean) => {
  const pts = CHEVRON(x, y)
  return solid ? art([], [[pts]]) : art([{ pts: [...pts, pts[0]], w: SW }])
}

// ── Art ────────────────────────────────────────────────────────────────────────────────────

const earth = (x: number, y: number) =>
  join(
    line([[x, y], [x, y + 1]], 0.2),
    line([[x - 1, y + 1], [x + 1, y + 1]], 0.2),
    line([[x - 0.65, y + 1.45], [x + 0.65, y + 1.45]], 0.2),
    line([[x - 0.3, y + 1.9], [x + 0.3, y + 1.9]], 0.2),
  )

// The Southern Cross at its stars' real positions: RA and Dec in degrees, relative size. RA is
// foreshortened by cos(Dec) so the cross keeps its tall shape, Gacrux at the top.
const CRUX = [
  [187.79, -57.11, 0.9],
  [186.65, -63.1, 1],
  [191.93, -59.69, 0.95],
  [183.79, -58.75, 0.75],
  [185.34, -60.4, 0.5],
]
const crux = (ox: number, oy: number, h: number) => {
  const k = h / 6.0
  const cosDec = Math.cos((60 * Math.PI) / 180)
  return join(
    ...CRUX.map(([ra, dec, r]) => dot(ox + (191.93 - ra) * cosDec * k, oy + (-57.11 - dec) * k, r * 0.4)),
  )
}

// Gaff's origami unicorn, 10.8 × 12 at k = 1.
const UNICORN: [number, number][][] = [
  [[1.6, 6], [7.2, 4.8], [7.8, 7.3], [2.2, 7.6], [1.6, 6]], // body
  [[1.6, 6], [7.8, 7.3]], // fold
  [[7.2, 4.8], [8.2, 1.6], [9.1, 2], [7.8, 7.3]], // neck
  [[8.2, 1.6], [10.4, 2.9], [9.1, 2]], // head
  [[8.6, 1.8], [10.8, -1.6], [9, 1.95]], // horn
  [[1.6, 6], [0, 8.3], [2.2, 7.6]], // tail
  [[2.4, 7.55], [2, 10.4], [3, 7.5]], // legs
  [[3.6, 7.45], [3.9, 10.4], [4.2, 7.4]],
  [[6.4, 7.35], [6.1, 10.4], [7, 7.32]],
  [[7.3, 7.3], [7.8, 10.4], [7.8, 7.3]],
]
const unicorn = (ox: number, oy: number, k: number) =>
  join(...UNICORN.map((p) => line(p.map(([x, y]) => [ox + x * k, oy + y * k]))))

/** A cathode bar, 0.25 wide. */
const bar =(x0: number, y0: number, x1: number, y1: number) => {
  // A round-capped stroke: pull the ends in by half its width to keep the bar's length.
  const len = Math.hypot(x1 - x0, y1 - y0)
  const t = 0.125 / len
  return line(
    [
      [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t],
      [x1 - (x1 - x0) * t, y1 - (y1 - y0) * t],
    ],
    0.25,
  )
}

// ── Output ─────────────────────────────────────────────────────────────────────────────────

const svgUrl = (rings: Pt[][]) => {
  const xs = rings.flat().map((p) => p.x)
  const ys = rings.flat().map((p) => p.y)
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  // SVG runs y down, so the board's Y is negated.
  const d = rings
    .map((r) => `M${r.map((p) => `${p.x.toFixed(4)} ${(-p.y).toFixed(4)}`).join("L")}Z`)
    .join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${-y1} ${x1 - x0} ${y1 - y0}"><path d="${d}"/></svg>`
  return { url: `data:image/svg+xml;base64,${btoa(svg)}`, x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 }
}

/** One face's silk. Place it at board level, its art already in the board's coordinates. */
const Face = ({ a, layer }: { a: Art; layer: "top" | "bottom" }) => (
  <>
    {a.strokes.map((s, i) => (
      <Fragment key={`s${i}`}>
        <silkscreenpath layer={layer} strokeWidth={s.w} route={s.pts} />
      </Fragment>
    ))}
    {a.fills.map((rings, i) => {
      const g = svgUrl(rings)
      return (
        <Fragment key={`f${i}`}>
          <silkscreengraphic
            layer={layer}
            imageUrl={g.url}
            width={g.w}
            height={g.h}
            pcbX={g.x}
            pcbY={g.y}
          />
        </Fragment>
      )
    })}
  </>
)

export { art, bar, chevron, crux, dot, earth, Face, frame, join, kana, line, logo, mapArt, ring, roundRect, text, turn, unicorn }
export type { Art }
