// PROTOTYPE, throwaway: textures across the whole parts face, behind the marks #86 settled.
// View coordinates, in mm: x = −X and y = Y of the PCB's, chin down, odd arm on the right.

import { readFileSync } from "node:fs"
import { YOKE } from "../index.circuit"
import { partsFace } from "../lib/parts-face"
import { type Art, art, join, mapArt } from "../lib/silkscreen"

type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const V = (p: Pt) => P(-p.x, p.y)

const circuit: any[] = JSON.parse(readFileSync("dist/index/circuit.json", "utf8"))
const of = (t: string) => circuit.filter((e) => e.type === t)
const OUTLINE: Pt[] = of("pcb_board")[0].outline.map(V)
const MARKS = mapArt(partsFace(YOKE), V)

// ── What the texture keeps off ─────────────────────────────────────────────────────────────

const W = 0.15
/** Pad clearance 0.25 and edge clearance 0.3, from the line's edge; the marks get a wider halo. */
const PAD = 0.25 + W / 2 + 0.03
const EDGE = 0.3 + W / 2 + 0.03
const HALO = 0.75

const boxes = of("pcb_smtpad")
  .filter((p) => p.layer === "top" && p.shape !== "circle")
  .map((p) => {
    const turned = Math.abs((p.ccw_rotation ?? 0) % 180) === 90
    const [w, h] = turned ? [p.height, p.width] : [p.width, p.height]
    return { x0: -p.x - w / 2, x1: -p.x + w / 2, y0: p.y - h / 2, y1: p.y + h / 2 }
  })
const rounds = [
  ...of("pcb_smtpad").filter((p) => p.layer === "top" && p.shape === "circle").map((p) => ({ ...V(p), r: p.radius })),
  ...of("pcb_plated_hole").map((h) => ({ ...V(h), r: (h.outer_diameter ?? Math.max(h.outer_width, h.outer_height)) / 2 })),
  ...of("pcb_hole").map((h) => ({ ...V(h), r: h.hole_diameter / 2 })),
]
const dense = (pts: Pt[], closed: boolean, step: number) => {
  const out: Pt[] = []
  const n = closed ? pts.length : pts.length - 1
  for (let i = 0; i < n; i++) {
    const [a, b] = [pts[i], pts[(i + 1) % pts.length]]
    const k = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / step))
    for (let j = 0; j < k; j++) out.push(P(a.x + ((b.x - a.x) * j) / k, a.y + ((b.y - a.y) * j) / k))
  }
  out.push(pts[closed ? 0 : pts.length - 1])
  return out
}
const grid = new Map<string, Pt[]>()
const key = (x: number, y: number) => `${Math.floor(x)},${Math.floor(y)}`
for (const p of [...MARKS.strokes.flatMap((s) => dense(s.pts, false, 0.15)), ...MARKS.fills.flat().flatMap((r) => dense(r, true, 0.15))]) {
  const k = key(p.x, p.y)
  grid.set(k, [...(grid.get(k) ?? []), p])
}
const segDist = (p: Pt, a: Pt, b: Pt) => {
  const [dx, dy] = [b.x - a.x, b.y - a.y]
  const l = dx * dx + dy * dy
  const t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy)
}
const blocked = (p: Pt) => {
  let inside = false
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [a, b] = [OUTLINE[i], OUTLINE[j]]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
    if (segDist(p, a, b) < EDGE) return true
  }
  if (!inside) return true
  for (const b of boxes) if (Math.hypot(Math.max(b.x0 - p.x, 0, p.x - b.x1), Math.max(b.y0 - p.y, 0, p.y - b.y1)) < PAD) return true
  for (const c of rounds) if (Math.hypot(p.x - c.x, p.y - c.y) < c.r + PAD) return true
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (const m of grid.get(key(p.x + i, p.y + j)) ?? []) if (Math.hypot(p.x - m.x, p.y - m.y) < HALO) return true
  return false
}
/** A line cut to the runs that are clear, dropping runs shorter than `min`. */
const clip = (pts: Pt[], min = 0.5): Art => {
  const runs: Pt[][] = []
  let run: Pt[] = []
  for (const p of dense(pts, false, 0.1)) {
    if (blocked(p)) {
      if (run.length) runs.push(run)
      run = []
    } else run.push(p)
  }
  if (run.length) runs.push(run)
  // Thin each run back to a point every 0.5 mm: curves stay smooth and the file small.
  const thin = (r: Pt[]) => r.filter((_, i) => i % 5 === 0 || i === r.length - 1)
  return art(runs.filter((r) => r.length * 0.1 >= min).map((r) => ({ pts: thin(r), w: W })))
}

const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// ── Textures ───────────────────────────────────────────────────────────────────────────────

/** Rain: streaks falling 14° off vertical, broken into drops of uneven length. */
const rain = (): Art => {
  const r = rng(2019)
  const lean = Math.tan((14 * Math.PI) / 180)
  const out: Art[] = []
  for (let x = -75; x < 75; x += 0.55 + r() * 0.7) {
    let y = -60 - r() * 10
    while (y < 60) {
      const len = 1.5 + r() * r() * 11
      out.push(clip([P(x - y * lean, y), P(x - (y + len) * lean, y + len)]))
      y += len + 0.9 + r() * 4.5
    }
  }
  return join(...out)
}

/** An iris round the fuse panel, the pupil: fibres running out from the opening, some forked. */
const iris = (): Art => {
  const r = rng(6)
  const out: Art[] = []
  const [cx, cy] = [0, -8]
  const ray = (a: number, r0: number, r1: number) => {
    const t = (a * Math.PI) / 180
    out.push(clip([P(cx + r0 * Math.cos(t), cy + r0 * Math.sin(t)), P(cx + r1 * Math.cos(t), cy + r1 * Math.sin(t))], 0.8))
  }
  for (let a = 0; a < 360; a += 0.5 + r() * 0.3) {
    // Each fibre is broken once or twice on its way out, as an iris's crypts and furrows break it.
    let q = 28 + r() * 6
    while (q < 100) {
      const len = 6 + r() * 26
      ray(a, q, q + len)
      q += len + 0.8 + r() * 2.5
    }
  }
  // The collarette: two wavering rings where the fibres change.
  for (const q of [66, 67]) {
    const pts: Pt[] = []
    for (let a = 0; a <= 360; a += 0.5) {
      const t = (a * Math.PI) / 180
      const w = q + 0.9 * Math.sin(t * 24)
      pts.push(P(cx + w * Math.cos(t), cy + w * Math.sin(t)))
    }
    out.push(clip(pts))
  }
  return join(...out)
}

/** A crease pattern: the sheet the unicorn is folded from, mountain folds solid and valley folds dashed. */
const creases = (): Art => {
  const r = rng(82)
  const cell = 5.2
  const pt = (i: number, j: number) => {
    const q = rng(i * 7919 + j * 104729 + 13)
    return P(i * cell + (j % 2 ? cell / 2 : 0) + (q() - 0.5) * 2.6, j * cell * 0.87 + (q() - 0.5) * 2.6)
  }
  const out: Art[] = []
  const fold = (a: Pt, b: Pt) => {
    if (r() < 0.45) out.push(clip([a, b]))
    else {
      // A valley fold: dashes 1.1 on, 0.7 off.
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      for (let s = 0; s < len; s += 1.8) {
        const e = Math.min(s + 1.1, len)
        out.push(clip([P(a.x + ((b.x - a.x) * s) / len, a.y + ((b.y - a.y) * s) / len), P(a.x + ((b.x - a.x) * e) / len, a.y + ((b.y - a.y) * e) / len)], 0.6))
      }
    }
  }
  for (let j = -15; j <= 15; j++)
    for (let i = -13; i <= 13; i++) {
      const a = pt(i, j)
      fold(a, pt(i + 1, j))
      fold(a, pt(j % 2 ? i + 1 : i, j + 1))
      fold(a, pt(j % 2 ? i : i - 1, j + 1))
    }
  return join(...out)
}

/** The field the board reads: contours of the magnetic potential round twelve ways' currents. */
/** `min` thins the arms: where contours would fall closer than that, every second, fourth or eighth is kept. */
const field = (min = 0): Art => {
  // Each way's current runs from its finger out to its nut; a line of current sources along it.
  const src: Pt[] = []
  for (const s of [1, -1]) for (let k = 0; k < 6; k++) for (let d = 30; d <= 53; d += 1) src.push(P(s * d, 15.6 - 13.36 * k))
  const f = (x: number, y: number) => {
    let v = 0
    for (const q of src) v += Math.log(Math.hypot(x - q.x, y - q.y) + 0.8) * (q.x > 0 ? 1 : -1) * (Math.round((15.6 - q.y) / 13.36) % 2 ? -1 : 1)
    return v
  }
  const h = 0.5
  const [nx, ny] = [240, 236]
  const g: number[][] = []
  for (let j = 0; j <= ny; j++) {
    g.push([])
    for (let i = 0; i <= nx; i++) g[j].push(f(-60 + i * h, -59 + j * h))
  }
  const out: Art[] = []
  for (let n = -58; n <= 58; n++) {
    const level = n * 0.7
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) {
        const c = [g[j][i], g[j][i + 1], g[j + 1][i + 1], g[j + 1][i]]
        const at = [P(-60 + i * h, -59 + j * h), P(-60 + (i + 1) * h, -59 + j * h), P(-60 + (i + 1) * h, -59 + (j + 1) * h), P(-60 + i * h, -59 + (j + 1) * h)]
        const cross: Pt[] = []
        for (let e = 0; e < 4; e++) {
          const [a, b] = [c[e], c[(e + 1) % 4]]
          if (a < level !== b < level) {
            const t = (level - a) / (b - a)
            cross.push(P(at[e].x + (at[(e + 1) % 4].x - at[e].x) * t, at[e].y + (at[(e + 1) % 4].y - at[e].y) * t))
          }
        }
        // The contours' spacing here is the level step over the field's slope.
        const slope = Math.hypot(c[1] - c[0] + c[2] - c[3], c[3] - c[0] + c[2] - c[1]) / (2 * h)
        let stride = 1
        while ((0.7 * stride) / slope < min && stride < 64) stride *= 2
        if (n % stride) continue
        if (cross.length === 2 && !blocked(cross[0]) && !blocked(cross[1])) out.push(art([{ pts: cross, w: W }]))
      }
  }
  return join(...out)
}

const v = (name: string, notes: string, texture: Art) => ({ name, notes, art: join(texture, MARKS) })
export const VARIANTS: Record<string, { name: string; notes: string; art: Art }> = {
  d: v("D · Field, round 1", "As first drawn: right on the chin, too dense on the arms.", field()),
  e: v("E · Field, 1.0 apart", "Contours never closer than 1.0 mm: where they crowd, every second, fourth or eighth is kept.", field(1.0)),
  f: v("F · Field, 1.5 apart", "Contours never closer than 1.5 mm.", field(1.5)),
  g: v("G · Field, 2.2 apart", "Contours never closer than 2.2 mm: the arms about as open as the chin.", field(2.2)),
}
