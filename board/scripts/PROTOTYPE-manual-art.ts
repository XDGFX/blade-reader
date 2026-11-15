// PROTOTYPE for #135, the manual's look: throwaway, kept on prototype/manual-look only.
// Draws the line art for one manual step, "lower the yoke on, holding it by the chin", from the
// yoke's outline in index.circuit.tsx and the panel's fit dimensions in
// docs/research/fuse-panel-dimensions.md. Writes ../manual/PROTOTYPE-art.js, which sets
// window.ART to SVG strings the prototype pages inline. Run in board/:
//   bun scripts/PROTOTYPE-manual-art.ts
//
// World axes, in mm: X = c (across, odd ways at +c), Y = a (along from the positive end),
// Z = h (up from the mounting face). The panel is drawn lying on a bench, positive end nearest.

import { mkdirSync, writeFileSync } from "node:fs"
import { CLAMPS, MODULE, NUTS, OUTLINE, PANEL_END, WAYS_A, pcb } from "../index.circuit"

type V = [number, number, number]
type P2 = [number, number]
const f = (n: number) => (Math.abs(n) < 1e-9 ? "0" : n.toFixed(2))

// ── Panel geometry (fuse-panel-dimensions.md) ─────────────────────────────────────────────

const HALF = 42.1
const LENGTH = 164.4
const DECK = 12.7
const PAD = 14.33
const LIP = 12.6
const FUSE_TOP = 26.21
const POCKET_HALF = 11.11 / 2
const PITCH = 13.36
const INNER_C = HALF - 14.5 // where the pockets end at the fuse holder wall
const LIP_C = HALF - 3.2 // where the pad starts, in from the edge
const SCREW_INSET = 8.52
const barrierTop = (c: number) => 22.9 + ((Math.abs(c) - INNER_C) / (HALF - INNER_C)) * (18.7 - 22.9)

/** The panel's positive end, a as a function of c, from PANEL_END. */
const endA = (c: number) => {
  const x = Math.min(Math.abs(c), HALF)
  for (let i = 1; i < PANEL_END.length; i++) {
    const p = PANEL_END[i - 1]
    const q = PANEL_END[i]
    if (x <= q.x) return p.y + ((x - p.x) / (q.x - p.x)) * (q.y - p.y)
  }
  return PANEL_END[PANEL_END.length - 1].y
}

type Row = { a0: number; a1: number; kind: "deck" | "wall" | "pocket" }
const rows: Row[] = []
{
  let a = 20.2
  rows.push({ a0: 0, a1: a, kind: "deck" })
  for (const w of WAYS_A) {
    rows.push({ a0: a, a1: w - POCKET_HALF, kind: "wall" })
    rows.push({ a0: w - POCKET_HALF, a1: w + POCKET_HALF, kind: "pocket" })
    a = w + POCKET_HALF
  }
  rows.push({ a0: a, a1: 108.2, kind: "wall" })
  rows.push({ a0: 108.2, a1: 141.2, kind: "pocket" })
  rows.push({ a0: 141.2, a1: 144.5, kind: "wall" })
  rows.push({ a0: 144.5, a1: LENGTH, kind: "deck" })
}
const cBreaks = [-HALF, -LIP_C, -INNER_C, INNER_C, LIP_C, HALF]

/** Top height of a cell at c (cells are linear in c). */
const height = (row: Row, ci: number, c: number) => {
  if (row.kind === "deck") return DECK
  const mid = (cBreaks[ci] + cBreaks[ci + 1]) / 2
  if (Math.abs(mid) < INNER_C) return FUSE_TOP
  if (row.kind === "wall") return barrierTop(c)
  return Math.abs(mid) > LIP_C ? LIP : PAD
}

// ── Projection ────────────────────────────────────────────────────────────────────────────

const norm = (v: V): V => {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

type Cam = { k: V; r: V; u: V }
const camera = (k0: V): Cam => {
  const k = norm(k0)
  const r = norm(cross([0, 0, 1], k))
  return { k, r, u: cross(k, r) }
}
const project = (cam: Cam, p: V): P2 => [dot(p, cam.r), -dot(p, cam.u)]

// ── Drawing ───────────────────────────────────────────────────────────────────────────────

type Face = { pts: V[]; cls: string; edges: boolean[] }
type Seg = { a: V; b: V; cls: string }

/** Painter's list: each item is drawn in order, fill first, then its stroked edges. */
class Scene {
  items: { faces: Face[]; segs: Seg[] }[] = []
  add(faces: Face[], segs: Seg[] = []) {
    this.items.push({ faces, segs })
  }
  svg(cam: Cam, pad = 6, extra: (pr: (p: V) => P2) => string = () => "") {
    const pr = (p: V) => project(cam, p)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const grow = ([x, y]: P2) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
    let body = ""
    for (const it of this.items) {
      for (const face of it.faces) {
        const q = face.pts.map(pr)
        q.forEach(grow)
        body += `<path class="${face.cls}" d="M${q.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z"/>`
        let lines = ""
        face.edges.forEach((on, i) => {
          if (!on) return
          const a = q[i]
          const b = q[(i + 1) % q.length]
          lines += `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`
        })
        if (lines) body += `<path class="ln" d="${lines}"/>`
      }
      for (const s of it.segs) {
        const a = pr(s.a)
        const b = pr(s.b)
        body += `<path class="${s.cls}" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`
      }
    }
    const ex = extra(pr)
    return { body: body + ex, box: [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad] }
  }
}

const circle3 = (c: number, a: number, h: number, r: number, n = 28): V[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i / n) * 2 * Math.PI
    return [c + r * Math.cos(t), a + r * Math.sin(t), h] as V
  })
const all = (n: number, on = true) => Array.from({ length: n }, () => on)

/** A vertical cylinder standing on z0: visible side strips, then its top. */
function cylinder(cam: Cam, c: number, a: number, r: number, z0: number, z1: number, cls = "top"): Face[] {
  const n = 28
  const ring = circle3(c, a, 0, r, n)
  const out: Face[] = []
  const sides: { face: Face; d: number }[] = []
  for (let i = 0; i < n; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % n]
    const mid: V = [(p[0] + q[0]) / 2 - c, (p[1] + q[1]) / 2 - a, 0]
    if (dot(mid, cam.k) <= 0) continue
    sides.push({
      face: { pts: [[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], cls: "side", edges: [true, false, true, false] },
      d: dot(mid, cam.k),
    })
  }
  // Silhouettes: the vertical where a visible strip meets a culled one.
  const vis = (i: number) => {
    const p = ring[((i % n) + n) % n]
    const q = ring[(((i + 1) % n) + n) % n]
    return dot([(p[0] + q[0]) / 2 - c, (p[1] + q[1]) / 2 - a, 0], cam.k) > 0
  }
  let idx = 0
  for (let i = 0; i < n; i++) {
    if (!vis(i)) continue
    const face = sides[idx++].face
    face.edges = [true, !vis(i + 1), true, !vis(i - 1)]
  }
  sides.sort((x, y) => x.d - y.d)
  for (const s of sides) out.push(s.face)
  out.push({ pts: ring.map(([x, y]) => [x, y, z1] as V), cls, edges: all(n) })
  return out
}

/** The panel as a height field, drawn back to front for a camera at +c, −a, +h. */
type Insert = { maxC: number; faces: Face[] }

/**
 * `inserts(ri)` gives things standing in row ri (the seated yoke's pieces), each drawn just
 * before the first cell of that row lying wholly to its right, since only cells towards the
 * camera can hide it. `front` is drawn after every row.
 */
function panel(cam: Cam, scene: Scene, opts: { screws: boolean; inserts?: (ri: number) => Insert[]; front?: Face[][] }) {
  const SUB = 10 // samples per cell along the curved positive end
  for (let ri = rows.length - 1; ri >= 0; ri--) {
    const row = rows[ri]
    const front = ri > 0 ? rows[ri - 1] : null
    const after: Face[][] = []
    const pending = [...(opts.inserts?.(ri) ?? [])]
    for (let ci = 0; ci < cBreaks.length - 1; ci++) {
      const c0 = cBreaks[ci]
      for (let k = pending.length - 1; k >= 0; k--) {
        if (pending[k].maxC <= c0 + 1e-6) {
          scene.add(pending[k].faces)
          pending.splice(k, 1)
        }
      }
      const c1 = cBreaks[ci + 1]
      const cs = ri === 0 ? Array.from({ length: SUB + 1 }, (_, i) => c0 + ((c1 - c0) * i) / SUB) : [c0, c1]
      const fa = (c: number) => (ri === 0 ? endA(c) : row.a0)
      const h = (c: number) => height(row, ci, c)
      const hf = (c: number) => (front ? height(front, ci, c) : 0)
      const hr = (c: number) => (ci < cBreaks.length - 2 ? height(row, ci + 1, c) : 0)
      const hb = (c: number) => (ri < rows.length - 1 ? height(rows[ri + 1], ci, c) : 0)
      const hl = (c: number) => (ci > 0 ? height(row, ci - 1, c) : 0)
      const same = (x: number, y: number) => Math.abs(x - y) < 0.05
      const faces: Face[] = []
      // Front side, from the front neighbour's top up to this cell's.
      for (let i = 0; i < cs.length - 1; i++) {
        const p = cs[i]
        const q = cs[i + 1]
        if (h(p) - hf(p) < 0.05 && h(q) - hf(q) < 0.05) continue
        const vEdge = (cc: number, isLeft: boolean) => {
          // Stroke a vertical edge only where the side face doesn't run on into the next cell.
          if (ri === 0 && ((isLeft && i > 0) || (!isLeft && i < cs.length - 2))) return false
          const nci = isLeft ? ci - 1 : ci + 1
          if (nci < 0 || nci >= cBreaks.length - 1) return true
          const nh = height(row, nci, cc)
          const nf = front ? height(front, nci, cc) : 0
          return !(same(nh, h(cc)) && same(nf, hf(cc)))
        }
        faces.push({
          pts: [[p, fa(p), hf(p)], [q, fa(q), hf(q)], [q, fa(q), h(q)], [p, fa(p), h(p)]],
          cls: "side",
          edges: [true, vEdge(q, false), true, vEdge(p, true)],
        })
      }
      // Right side, from the right neighbour's top up to this cell's.
      {
        const a0 = fa(c1)
        const a1 = row.a1
        const z = h(c1)
        const zr = hr(c1)
        if (z - zr > 0.05) {
          const fr = front && ci < cBreaks.length - 2 ? height(front, ci + 1, c1) : 0
          const ff = front ? height(front, ci, c1) : 0
          const backR = ri < rows.length - 1 && ci < cBreaks.length - 2 ? height(rows[ri + 1], ci + 1, c1) : 0
          const backH = hb(c1)
          faces.push({
            pts: [[c1, a0, zr], [c1, a1, zr], [c1, a1, z], [c1, a0, z]],
            cls: "side2",
            edges: [true, !(same(backH, z) && same(backR, zr)), true, !(same(ff, z) && same(fr, zr))],
          })
        }
      }
      // Top.
      const top: V[] = [...cs.map((c) => [c, fa(c), h(c)] as V), [c1, row.a1, h(c1)], [c0, row.a1, h(c0)]]
      const n = top.length
      const edges = top.map((p, i) => {
        const q = top[(i + 1) % n]
        if (i < cs.length - 1) return !(same(hf(p[0]), p[2]) && same(hf(q[0]), q[2]))
        if (i === cs.length - 1) return !(same(hr(c1), h(c1)))
        if (i === cs.length) return !(same(hb(c1), h(c1)) && same(hb(c0), h(c0)))
        return !same(hl(c0), h(c0))
      })
      faces.push({ pts: top, cls: "top", edges })
      // Recesses, holes and screws on this cell's top, drawn with it.
      const decor: Face[] = []
      const inCell = (c: number, a: number) => c > c0 && c < c1 && a > row.a0 && a < row.a1
      for (const s of [1, -1]) {
        for (const a of [12.8, 151.6]) if (inCell(s * 31.8, a)) decor.push({ pts: circle3(s * 31.8, a, DECK, 4.5), cls: "hole", edges: all(28) })
        if (row.kind === "pocket") {
          const c = s * (HALF - SCREW_INSET)
          if (row.a1 - row.a0 < 12) {
            if (inCell(c, (row.a0 + row.a1) / 2)) decor.push({ pts: circle3(c, (row.a0 + row.a1) / 2, PAD, 2.1), cls: "hole", edges: all(28) })
          } else if (opts.screws) {
            for (const a of [113.54, 124.62, 135.69]) if (inCell(c, a)) after.push(cylinder(cam, c, a, 4.09, PAD, PAD + 3.4))
          }
        }
      }
      scene.add([...faces, ...decor])
    }
    for (const x of after) scene.add(x)
    for (const p of pending) scene.add(p.faces)
    // Studs stand on the decks.
    if (ri === 0) {
      scene.add(cylinder(cam, 0, 11.33, 9, DECK, DECK + 0.8))
      scene.add(cylinder(cam, 0, 11.33, 5.25, DECK + 0.8, PAD))
      scene.add(cylinder(cam, 0, 11.33, 2.4, PAD, FUSE_TOP))
    }
    if (ri === rows.length - 1) scene.add(cylinder(cam, 0, 153, 2.4, DECK, FUSE_TOP))
  }
  for (const x of opts.front ?? []) scene.add(x)
}

// ── The yoke ──────────────────────────────────────────────────────────────────────────────

const A_MID = pcb(0, 0).y
const toPanel = (p: { x: number; y: number }): P2 => [-p.x, A_MID - p.y]
const OUT = OUTLINE.map(toPanel)
const BOARD = 1.6

function signedArea(pts: P2[]) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    s += x0 * y1 - x1 * y0
  }
  return s / 2
}

/** An extruded flat polygon: visible sides sorted back to front, then its top. */
function slab(cam: Cam, poly: P2[], z0: number, z1: number, topCls: string): Face[] {
  const ccw = signedArea(poly) > 0
  const sides: { face: Face; d: number }[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    if (Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-6) continue
    const e: V = [q[0] - p[0], q[1] - p[1], 0]
    const n: V = ccw ? [e[1], -e[0], 0] : [-e[1], e[0], 0]
    if (dot(n, cam.k) <= 1e-6) continue
    sides.push({
      face: { pts: [[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], cls: "side", edges: all(4) },
      d: dot([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0], cam.k),
    })
  }
  sides.sort((x, y) => x.d - y.d)
  return [...sides.map((s) => s.face), { pts: poly.map(([x, y]) => [x, y, z1] as V), cls: topCls, edges: all(poly.length) }]
}

function yoke(cam: Cam, scene: Scene, z: number) {
  scene.add(slab(cam, MODULE.slice(0, 4).map(toPanel), z - 3.2, z, "part"))
  scene.add(slab(cam, OUT, z, z + BOARD, "board"))
  const ring: Face[] = []
  const zt = z + BOARD + 0.01
  for (const p of CLAMPS.map(toPanel)) ring.push({ pts: circle3(p[0], p[1], zt, 2.7, 20), cls: "hole", edges: all(20) })
  for (const p of NUTS.map(toPanel)) ring.push(...hexNut(cam, p[0], p[1], zt))
  scene.add(ring)
}

/** A polygon's part on one side of an axis line (Sutherland–Hodgman). */
function clipHalf(pts: P2[], axis: 0 | 1, v: number, keepAbove: boolean): P2[] {
  const keep = (p: P2) => (keepAbove ? p[axis] >= v - 1e-9 : p[axis] <= v + 1e-9)
  const at = (p: P2, q: P2): P2 => {
    const t = (v - p[axis]) / (q[axis] - p[axis])
    return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]
  }
  const out: P2[] = []
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
    const q = pts[(i + 1) % pts.length]
    if (keep(p)) out.push(p)
    if (keep(p) !== keep(q)) out.push(at(p, q))
  }
  return out.filter((p, i) => {
    const q = out[(i + 1) % out.length]
    return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6
  })
}

const inPoly = (pts: P2[], [x, y]: P2) => {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]
    const [xj, yj] = pts[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** A slab piece cut from a bigger polygon: sides and strokes only on the real edges. */
function piece(cam: Cam, poly: P2[], z0: number, z1: number, cls: string, seam: (p: P2, q: P2) => boolean): Face[] {
  const ccw = signedArea(poly) > 0
  const sides: { face: Face; d: number }[] = []
  const edges: boolean[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const cut = seam(p, q)
    edges.push(!cut)
    if (cut) continue
    const e: V = [q[0] - p[0], q[1] - p[1], 0]
    const n: V = ccw ? [e[1], -e[0], 0] : [-e[1], e[0], 0]
    if (dot(n, cam.k) <= 1e-6) continue
    sides.push({
      face: { pts: [[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], cls: "side", edges: all(4) },
      d: dot([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0], cam.k),
    })
  }
  sides.sort((x, y) => x.d - y.d)
  return [...sides.map((s) => s.face), { pts: poly.map(([x, y]) => [x, y, z1] as V), cls, edges }]
}

/** The yoke with its parts face at z, moved da along, cut into the panel's rows so barriers can hide it. */
function placedYoke(cam: Cam, z: number, da = 0) {
  const at = (p: { x: number; y: number }): P2 => { const [c, a] = toPanel(p); return [c, a + da] }
  const out = OUT.map(([c, a]): P2 => [c, a + da])
  const zt = z + BOARD
  const antenna = MODULE.slice(0, 4).map(at)
  const bands: { lo: number; hi: number; ri: number }[] = [{ lo: -Infinity, hi: 0, ri: -1 }]
  rows.forEach((r, ri) => bands.push({ lo: ri === 0 ? 0 : r.a0, hi: r.a1, ri }))
  const byRow = new Map<number, Insert[]>()
  for (const b of bands) {
    const lines = [b.lo, b.hi]
    const seam = (p: P2, q: P2) =>
      (Math.abs(p[0]) < 1e-6 && Math.abs(q[0]) < 1e-6) || lines.some((v) => Math.abs(p[1] - v) < 1e-6 && Math.abs(q[1] - v) < 1e-6)
    const list: Insert[] = []
    let mod = antenna
    if (isFinite(b.lo)) mod = clipHalf(mod, 1, b.lo, true)
    mod = clipHalf(mod, 1, b.hi, false)
    if (mod.length >= 3) list.push({ maxC: Math.max(...mod.map((p) => p[0])), faces: piece(cam, mod, z - 3.2, z, "part", seam) })
    for (const keepRight of [false, true]) {
      let poly = clipHalf(out, 0, 0, keepRight)
      if (isFinite(b.lo)) poly = clipHalf(poly, 1, b.lo, true)
      poly = clipHalf(poly, 1, b.hi, false)
      if (poly.length < 3) continue
      const faces = piece(cam, poly, z, zt, "board", seam)
      for (const p of CLAMPS.map(at)) if (inPoly(poly, p)) faces.push({ pts: circle3(p[0], p[1], zt + 0.01, 2.7, 20), cls: "hole", edges: all(20) })
      for (const p of NUTS.map(at)) if (inPoly(poly, p)) faces.push(...hexNut(cam, p[0], p[1], zt + 0.01))
      list.push({ maxC: Math.max(...poly.map((p) => p[0])), faces })
    }
    byRow.set(b.ri, list)
  }
  return { inserts: (ri: number) => byRow.get(ri) ?? [], front: (byRow.get(-1) ?? []).map((x) => x.faces) }
}

/** An M4 nut standing on the ring face, 7 across flats and 3.2 tall. */
function hexNut(cam: Cam, c: number, a: number, z: number): Face[] {
  const r = 7 / Math.sqrt(3)
  const hex: P2[] = Array.from({ length: 6 }, (_, i) => [c + r * Math.cos((i * Math.PI) / 3), a + r * Math.sin((i * Math.PI) / 3)])
  return [...slab(cam, hex, z, z + 3.2, "top"), { pts: circle3(c, a, z + 3.21, 2, 16), cls: "hole", edges: all(16) }]
}

// ── Flat helpers ──────────────────────────────────────────────────────────────────────────

const pathOf = (pts: P2[], close = true) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}${close ? "Z" : ""}`

/** A motion arrow from p to q, in screen units: orange, outlined in the drawing's line. */
function arrow(p: P2, q: P2, w = 3) {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const l = Math.hypot(dx, dy)
  const [ux, uy] = [dx / l, dy / l]
  const [nx, ny] = [-uy, ux]
  const neck: P2 = [q[0] - ux * w * 2.6, q[1] - uy * w * 2.6]
  const at = (b: P2, k: number): P2 => [b[0] + nx * k, b[1] + ny * k]
  const pts = [at(p, w / 2), at(neck, w / 2), at(neck, w * 1.4), q, at(neck, -w * 1.4), at(neck, -w / 2), at(p, -w / 2)]
  return `<path class="arrow ln" d="${pathOf(pts)}"/>`
}

const wrap = (box: number[], body: string, label: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(f).join(" ")}" role="img" aria-label="${label}">${body}</svg>`

// ── The drawings ──────────────────────────────────────────────────────────────────────────

const art: Record<string, string> = {}
const LIFT = 30
const CAM: V = [0.62, -1, 0.95]
const chinA = Math.min(...OUT.map((p) => p[1]))

/** The main drawing: the yoke above the stripped panel, arrows down past the chin's corners. */
{
  const cam = camera(CAM)
  const scene = new Scene()
  panel(cam, scene, { screws: true })
  // Guides from the first and last finger holes on each arm down to their screw holes.
  const guides: Seg[] = []
  for (const s of [1, -1]) for (const a of [WAYS_A[0], WAYS_A[5]]) {
    const c = s * (HALF - SCREW_INSET)
    guides.push({ a: [c, a, PAD], b: [c, a, PAD + LIFT], cls: "guide" })
  }
  scene.add([], guides)
  yoke(cam, scene, PAD + LIFT)
  const { body, box } = scene.svg(cam, 10, (pr) => {
    const top = PAD + LIFT + BOARD
    return [-52, 52].map((c) => arrow(pr([c, chinA - 3, top - 4]), pr([c, chinA - 3, top - 24]))).join("")
  })
  art.lift = wrap(box, body, "The yoke lowered onto the stripped fuse panel")
}

/** The ✓/✗ close-up: the odd arm's first three ways, nearest the chin. */
const closeUp = (cam: Cam): number[] => {
  const pts: P2[] = []
  for (const c of [HALF - 16, HALF + 20]) for (const a of [-2, 52]) for (const z of [8, 28]) pts.push(project(cam, [c, a, z]))
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
}

/** ✓: seated, every finger down in its pocket. */
{
  const cam = camera(CAM)
  const scene = new Scene()
  panel(cam, scene, { screws: true, ...placedYoke(cam, PAD + 0.05) })
  art.seated = wrap(closeUp(cam), scene.svg(cam).body, "Seated: every finger down in its pocket, flat on its pad")
}

/** ✗: half a pitch off, every finger resting on a barrier. */
{
  const cam = camera(CAM)
  const scene = new Scene()
  panel(cam, scene, { screws: true, ...placedYoke(cam, 22.95, -PITCH / 2) })
  art.resting = wrap(closeUp(cam), scene.svg(cam).body, "Wrong: the fingers resting on the barriers, not in their pockets")
}

/** The detail: one finger in its pocket, from above, with the fit dimensions. */
{
  const w = WAYS_A[2]
  const flip = ([c, a]: P2): P2 => [c, -(a - w)]
  const p = (c: number, a: number) => flip([c, a])
  const lo = INNER_C - 7
  const hi = HALF + 18
  let s = ""
  for (const r of rows.filter((r) => r.kind === "wall" && r.a1 > w - 14 && r.a0 < w + 14)) {
    s += `<path class="barrier ln" d="${pathOf([p(INNER_C, r.a0), p(HALF, r.a0), p(HALF, r.a1), p(INNER_C, r.a1)])}"/>`
  }
  s += `<path class="pad ln" d="${pathOf([p(INNER_C, w - POCKET_HALF), p(HALF, w - POCKET_HALF), p(HALF, w + POCKET_HALF), p(INNER_C, w + POCKET_HALF)])}"/>`
  s += `<path class="fuse ln" d="${pathOf([p(lo, w - 14), p(INNER_C, w - 14), p(INNER_C, w + 14), p(lo, w + 14)])}"/>`
  // The yoke inside the window: the finger and the arm it hangs from.
  let board = clipHalf(OUT, 0, lo, true)
  board = clipHalf(board, 0, hi, false)
  board = clipHalf(board, 1, w - 14, true)
  board = clipHalf(board, 1, w + 14, false)
  s += `<path class="board ln" d="${pathOf(board.map(flip))}"/>`
  const [hx, hy] = p(HALF - SCREW_INSET, w)
  s += `<circle class="hole ln" cx="${f(hx)}" cy="${f(hy)}" r="2.7"/>`
  // The finger's width, measured inside the panel's edge.
  const at = HALF - 2
  const fa: number[] = []
  OUT.forEach((q, i) => {
    const r = OUT[(i + 1) % OUT.length]
    if ((q[0] - at) * (r[0] - at) < 0) {
      const y = q[1] + ((at - q[0]) / (r[0] - q[0])) * (r[1] - q[1])
      if (Math.abs(y - w) < 6.68) fa.push(y)
    }
  })
  const fw = Math.max(...fa) - Math.min(...fa)
  const dim = (x: number, y0: number, y1: number, label: string, tx: number, ty: number, cls: string) => {
    const ah = 1.4
    return `<g class="dim ${cls}"><path class="ln thin" d="M${f(x)} ${f(y0)}V${f(y1)}M${f(x - 0.9)} ${f(y0 + ah)}L${f(x)} ${f(y0)}L${f(x + 0.9)} ${f(y0 + ah)}M${f(x - 0.9)} ${f(y1 - ah)}L${f(x)} ${f(y1)}L${f(x + 0.9)} ${f(y1 - ah)}"/><text x="${f(tx)}" y="${f(ty)}">${label}</text></g>`
  }
  const fy0 = -(Math.max(...fa) - w)
  const fy1 = -(Math.min(...fa) - w)
  s += dim(INNER_C + 1.6, -POCKET_HALF, POCKET_HALF, "11.1", INNER_C - 6.4, 1.2, "pocket")
  s += dim(HALF - 2, fy0, fy1, fw.toFixed(1), HALF + 4, 1.2, "finger")
  art.detail = wrap([lo, -14, hi - lo, 28], s, `Each ${fw.toFixed(1)} mm finger drops into an 11.1 mm pocket`)
}

mkdirSync("../manual", { recursive: true })
writeFileSync("../manual/PROTOTYPE-art.js", `// Generated by board/scripts/PROTOTYPE-manual-art.ts. PROTOTYPE for #135.\nwindow.ART = ${JSON.stringify(art, null, 1)}\n`)
console.log("wrote manual/PROTOTYPE-art.js:", Object.keys(art).join(", "))
