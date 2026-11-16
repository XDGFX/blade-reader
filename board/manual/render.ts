// A hidden-line renderer for the manual's 3/4 drawings: an orthographic camera, a painter's
// list of faces, convex solids, and the panel drawn as a height field so things standing on it
// (the seated yoke, screws, fuses) are drawn in the right order between its cells.

import {
  BOARD, C_BREAKS, CLAMP_HOLES, CLAMP_HOLE_R, DECK, GND_NUT, LENGTH, MODULE_BOX, MODULE_HEIGHT, MOUNTS, NUT,
  OUTPUT_NUTS, ROWS, YOKE_OUTLINE, cellTop, endA, type P2, type V,
} from "./geometry"

export const fmt = (n: number) => (Math.abs(n) < 5e-3 ? "0" : n.toFixed(2))

// ── Vectors and the camera ──────────────────────────────────────────────────────────────

const norm = (v: V): V => {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]

/**
 * An orthographic camera looking from `toward` (scene to camera) with Z up. The panel's
 * height-field order assumes the camera sits at +c, −a and above.
 */
export class Camera {
  k: V
  r: V
  u: V
  constructor(toward: V) {
    this.k = norm(toward)
    this.r = norm(cross([0, 0, 1], this.k))
    this.u = cross(this.k, this.r)
  }
  project = (p: V): P2 => [dot(p, this.r), -dot(p, this.u)]
  depth = (p: V) => dot(p, this.k)
}

/** The camera every 3/4 drawing shares, from the front right and above. */
export const VIEW: V = [0.62, -1, 0.95]

// ── Faces and the painter's list ────────────────────────────────────────────────────────

/** A planar face, its corners in order, and which of its edges (i to i+1) to stroke. */
export type Face = { pts: V[]; cls: string; edges: boolean[] }
export type Group = Face[]

export const all = (n: number, on = true) => Array.from({ length: n }, () => on)
/** The highlight class marks what moves in a step; its sides take a darker shade of it. */
export const HL = "hl"
const sideOf = (cls: string) => (cls === HL ? "hl-side" : "side")
const centroid = (pts: V[]): V => {
  const s = pts.reduce((m, p) => [m[0] + p[0], m[1] + p[1], m[2] + p[2]] as V, [0, 0, 0] as V)
  return [s[0] / pts.length, s[1] / pts.length, s[2] / pts.length]
}

/** Drawn in order: each face's fill, then its stroked edges. Overlays go on top, unhidden. */
export class Scene {
  items: (Group | string)[] = []
  overlay: string[] = []
  constructor(public cam: Camera) {}
  add(g: Group) {
    this.items.push(g)
  }
  /** Raw SVG drawn at this point in the order, such as guide lines under a lifted part. */
  raw(s: string) {
    this.items.push(s)
  }
  /**
   * The SVG body and its bounding box, in projected mm. With `clip` (a viewBox), faces wholly
   * outside it are left out.
   */
  render(pad = 6, clip?: number[]): { body: string; box: number[] } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let body = ""
    // A tenth of a millimetre is under a pixel at any size the manual draws.
    const xy = ([x, y]: P2) => `${x.toFixed(1)} ${y.toFixed(1)}`
    for (const g of this.items) {
      if (typeof g === "string") {
        body += g
        continue
      }
      for (const face of g) {
        const q = face.pts.map(this.cam.project)
        const xs = q.map((p) => p[0])
        const ys = q.map((p) => p[1])
        if (clip && (Math.max(...xs) < clip[0] || Math.min(...xs) > clip[0] + clip[2] || Math.max(...ys) < clip[1] || Math.min(...ys) > clip[1] + clip[3])) continue
        minX = Math.min(minX, ...xs); maxX = Math.max(maxX, ...xs); minY = Math.min(minY, ...ys); maxY = Math.max(maxY, ...ys)
        const outline = `M${q.map(xy).join("L")}Z`
        if (face.edges.every(Boolean)) {
          body += `<path class="${face.cls} ln" d="${outline}"/>`
          continue
        }
        body += `<path class="${face.cls}" d="${outline}"/>`
        let lines = ""
        face.edges.forEach((on, i) => {
          if (on) lines += `M${xy(q[i])}L${xy(q[(i + 1) % q.length])}`
        })
        if (lines) body += `<path class="ln" d="${lines}"/>`
      }
    }
    return { body: body + this.overlay.join(""), box: [minX - pad, minY - pad, maxX - minX + 2 * pad, maxY - minY + 2 * pad] }
  }
}

// ── Convex solids ───────────────────────────────────────────────────────────────────────

/**
 * A convex solid from its faces, each wound anticlockwise seen from outside. Back faces are
 * culled; since the solid is convex the rest never overlap. An edge is stroked where it is a
 * silhouette or a crease; edges between two `smooth` faces (a cylinder's sides) are not.
 */
export function convex(cam: Camera, faces: { pts: V[]; smooth?: boolean; cls?: string }[], cls = "top"): Group {
  const normal = (pts: V[]) => {
    let n: V = [0, 0, 0]
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const q = pts[(i + 1) % pts.length]
      n = [n[0] + (p[1] - q[1]) * (p[2] + q[2]), n[1] + (p[2] - q[2]) * (p[0] + q[0]), n[2] + (p[0] - q[0]) * (p[1] + q[1])]
    }
    return n
  }
  const key = (p: V) => p.map((x) => x.toFixed(3)).join(",")
  const vis = faces.map((f) => dot(normal(f.pts), cam.k) > 1e-9)
  const owner = new Map<string, number[]>()
  faces.forEach((f, i) =>
    f.pts.forEach((p, j) => {
      const k = `${key(p)}|${key(f.pts[(j + 1) % f.pts.length])}`
      owner.set(k, [...(owner.get(k) ?? []), i])
    }),
  )
  const out: Group = []
  faces.forEach((f, i) => {
    if (!vis[i]) return
    const edges = f.pts.map((p, j) => {
      const q = f.pts[(j + 1) % f.pts.length]
      const other = owner.get(`${key(q)}|${key(p)}`)?.[0]
      if (other === undefined || !vis[other]) return true
      return !(f.smooth && faces[other].smooth)
    })
    out.push({ pts: f.pts, cls: f.cls ?? (f.smooth ? sideOf(cls) : cls), edges })
  })
  return out
}

/** A prism: a convex polygon `base` (any winding) swept from z0 to z1. */
export function prism(cam: Camera, base: P2[], z0: number, z1: number, cls = "top", smooth = false): Group {
  const ccw = signedArea(base) > 0 ? base : [...base].reverse()
  const faces: { pts: V[]; smooth?: boolean; cls?: string }[] = [
    { pts: ccw.map(([x, y]) => [x, y, z1] as V), cls },
    { pts: [...ccw].reverse().map(([x, y]) => [x, y, z0] as V), cls },
  ]
  for (let i = 0; i < ccw.length; i++) {
    const p = ccw[i]
    const q = ccw[(i + 1) % ccw.length]
    faces.push({ pts: [[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], smooth })
  }
  return convex(cam, faces, cls)
}

export const circle = (c: number, a: number, r: number, n = 28): P2[] =>
  Array.from({ length: n }, (_, i) => [c + r * Math.cos((i / n) * 2 * Math.PI), a + r * Math.sin((i / n) * 2 * Math.PI)])

/** An upright cylinder. */
export const cylinder = (cam: Camera, c: number, a: number, r: number, z0: number, z1: number, cls = "top") =>
  prism(cam, circle(c, a, r), z0, z1, cls, true)

/** A round tube from p to q, for cables. */
export function tube(cam: Camera, p: V, q: V, r: number, cls = "cable"): Group {
  const axis = norm(sub(q, p))
  const ref: V = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]
  const e1 = norm(cross(axis, ref))
  const e2 = cross(axis, e1)
  const n = 16
  const ring = (o: V) =>
    Array.from({ length: n }, (_, i) => {
      const t = (i / n) * 2 * Math.PI
      return [o[0] + r * (Math.cos(t) * e1[0] + Math.sin(t) * e2[0]), o[1] + r * (Math.cos(t) * e1[1] + Math.sin(t) * e2[1]), o[2] + r * (Math.cos(t) * e1[2] + Math.sin(t) * e2[2])] as V
    })
  const a = ring(p)
  const b = ring(q)
  const faces: { pts: V[]; smooth?: boolean; cls?: string }[] = [{ pts: [...a].reverse(), cls }, { pts: b, cls }]
  for (let i = 0; i < n; i++) faces.push({ pts: [a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]], smooth: true, cls })
  return convex(cam, faces, cls)
}

/** A flat mark on a horizontal plane at z: a hole, a recess, a label plate. */
export const flat = (pts: P2[], z: number, cls = "hole"): Face => ({ pts: pts.map(([x, y]) => [x, y, z] as V), cls, edges: all(pts.length) })

/** Several convex groups standing together, drawn far to near. */
export const cluster = (cam: Camera, groups: Group[]): Group =>
  groups
    .filter((g) => g.length)
    .map((g) => ({ g, d: cam.depth(centroid(g.flatMap((f) => f.pts))) }))
    .sort((x, y) => x.d - y.d)
    .flatMap((x) => x.g)

// ── Flat polygons ───────────────────────────────────────────────────────────────────────

function signedArea(pts: P2[]) {
  let s = 0
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[(i + 1) % pts.length]
    s += x0 * y1 - x1 * y0
  }
  return s / 2
}

/** A polygon's part on one side of an axis-aligned line (Sutherland–Hodgman). */
export function clipHalf(pts: P2[], axis: 0 | 1, v: number, keepAbove: boolean): P2[] {
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

/** A flat slab cut from a bigger polygon: sides and strokes only on its real edges. */
function slabPiece(cam: Camera, poly: P2[], z0: number, z1: number, cls: string, seam: (p: P2, q: P2) => boolean): Group {
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
      face: { pts: [[p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1]], cls: sideOf(cls), edges: all(4) },
      d: cam.depth([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0]),
    })
  }
  sides.sort((x, y) => x.d - y.d)
  return [...sides.map((s) => s.face), { pts: poly.map(([x, y]) => [x, y, z1] as V), cls, edges }]
}

// ── The panel and what stands on it ─────────────────────────────────────────────────────

/** Something standing at a along the panel, drawn before the first cell lying wholly at greater c. */
export type Standing = { a: number; maxC: number; group: Group }

/** The row index for a, −1 in front of the panel, ROWS.length behind it. */
const rowOf = (a: number) => (a < 0 ? -1 : a >= LENGTH ? ROWS.length : ROWS.findIndex((r) => a >= r.a0 && a < r.a1))

/** A standing thing whose footprint is `pts`, filed under the row of its middle. */
export const standing = (pts: P2[], group: Group): Standing => {
  const as = pts.map((p) => p[1])
  return { a: (Math.min(...as) + Math.max(...as)) / 2, maxC: Math.max(...pts.map((p) => p[0])), group }
}

/**
 * The panel as a height field, drawn back to front, with each standing thing slotted in its
 * row. Cells are drawn by rows from the negative end, and within a row from −c, which is
 * correct for a camera at +c, −a and above.
 */
export function drawPanel(scene: Scene, things: Standing[] = []) {
  const cam = scene.cam
  const SUB = 10 // samples per cell along the curved positive end
  const same = (x: number, y: number) => Math.abs(x - y) < 0.05
  const byRow = new Map<number, Standing[]>()
  for (const t of things) byRow.set(rowOf(t.a), [...(byRow.get(rowOf(t.a)) ?? []), t])
  const flush = (list: Standing[]) => list.sort((x, y) => y.a - x.a).forEach((t) => scene.add(t.group))
  flush(byRow.get(ROWS.length) ?? [])
  for (let ri = ROWS.length - 1; ri >= 0; ri--) {
    const row = ROWS[ri]
    const front = ri > 0 ? ROWS[ri - 1] : null
    const back = ri < ROWS.length - 1 ? ROWS[ri + 1] : null
    let pending = [...(byRow.get(ri) ?? [])]
    for (let ci = 0; ci < C_BREAKS.length - 1; ci++) {
      const c0 = C_BREAKS[ci]
      const c1 = C_BREAKS[ci + 1]
      const due = (t: Standing) => t.maxC <= c0 + 1e-6
      flush(pending.filter(due))
      pending = pending.filter((t) => !due(t))
      const last = ci === C_BREAKS.length - 2
      const cs = ri === 0 ? Array.from({ length: SUB + 1 }, (_, i) => c0 + ((c1 - c0) * i) / SUB) : [c0, c1]
      const fa = (c: number) => (ri === 0 ? endA(c) : row.a0)
      const h = (c: number) => cellTop(row, ci, c)
      const hf = (c: number) => (front ? cellTop(front, ci, c) : 0)
      const hr = (c: number) => (last ? 0 : cellTop(row, ci + 1, c))
      const hb = (c: number) => (back ? cellTop(back, ci, c) : 0)
      const hl = (c: number) => (ci > 0 ? cellTop(row, ci - 1, c) : 0)
      const faces: Face[] = []
      // Front side, from the front neighbour's top up to this cell's.
      for (let i = 0; i < cs.length - 1; i++) {
        const p = cs[i]
        const q = cs[i + 1]
        if (h(p) - hf(p) < 0.05 && h(q) - hf(q) < 0.05) continue
        const corner = (cc: number, left: boolean) => {
          // A vertical edge is stroked only where the face doesn't run on into the next cell.
          if (ri === 0 && ((left && i > 0) || (!left && i < cs.length - 2))) return false
          const n = left ? ci - 1 : ci + 1
          if (n < 0 || n >= C_BREAKS.length - 1) return true
          return !(same(cellTop(row, n, cc), h(cc)) && same(front ? cellTop(front, n, cc) : 0, hf(cc)))
        }
        faces.push({
          pts: [[p, fa(p), hf(p)], [q, fa(q), hf(q)], [q, fa(q), h(q)], [p, fa(p), h(p)]],
          cls: "side",
          edges: [true, corner(q, false), true, corner(p, true)],
        })
      }
      // Right side, from the right neighbour's top up to this cell's.
      if (h(c1) - hr(c1) > 0.05) {
        const z = h(c1)
        const zr = hr(c1)
        const fr = front && !last ? cellTop(front, ci + 1, c1) : 0
        const br = back && !last ? cellTop(back, ci + 1, c1) : 0
        faces.push({
          pts: [[c1, fa(c1), zr], [c1, row.a1, zr], [c1, row.a1, z], [c1, fa(c1), z]],
          cls: "side2",
          edges: [true, !(same(hb(c1), z) && same(br, zr)), true, !(same(hf(c1), z) && same(fr, zr))],
        })
      }
      // Top.
      const top: V[] = [...cs.map((c) => [c, fa(c), h(c)] as V), [c1, row.a1, h(c1)], [c0, row.a1, h(c0)]]
      const n = top.length
      faces.push({
        pts: top,
        cls: "top",
        edges: top.map((p, i) => {
          const q = top[(i + 1) % n]
          if (i < cs.length - 1) return !(same(hf(p[0]), p[2]) && same(hf(q[0]), q[2]))
          if (i === cs.length - 1) return !same(hr(c1), h(c1))
          if (i === cs.length) return !(same(hb(c1), h(c1)) && same(hb(c0), h(c0)))
          return !same(hl(c0), h(c0))
        }),
      })
      // Mounting recesses on the decks.
      for (const [c, a] of MOUNTS) if (c > c0 && c < c1 && a > row.a0 && a < row.a1) faces.push(flat(circle(c, a, 4.5), DECK))
      scene.add(faces)
    }
    flush(pending)
  }
  flush(byRow.get(-1) ?? [])
}

// ── The yoke ────────────────────────────────────────────────────────────────────────────

/** An M4 output nut standing on the ring face at z. */
/** A terminal's tinned pad and hole, on the ring face at z. */
const terminalPad = (c: number, a: number, z: number): Group => [
  flat(circle(c, a, NUT.pad, 24), z, "metal"),
  flat(circle(c, a, NUT.hole, 20), z + 0.01),
]

/** Something fixed to the yoke's ring face: drawn with whichever piece holds `at`. */
export type OnYoke = { at: P2; group: (zTop: number) => Group }

/**
 * The yoke with its parts face at z and moved `da` along, cut into the panel's rows so the
 * panel can hide the parts of it that sit lower than a barrier. `extra` adds things fixed to
 * the ring face, such as screws and rings; `hl` draws the board in the highlight.
 */
export function yokePieces(cam: Camera, z: number, opts: { da?: number; extra?: OnYoke[]; hl?: boolean } = {}): Standing[] {
  const da = opts.da ?? 0
  const move = ([c, a]: P2): P2 => [c, a + da]
  const out = YOKE_OUTLINE.map(move)
  const zt = z + BOARD
  const terminals = [...OUTPUT_NUTS, GND_NUT].map(move)
  const fixed: OnYoke[] = [
    ...CLAMP_HOLES.map((p) => ({ at: p, group: (t: number) => [flat(circle(p[0], p[1], CLAMP_HOLE_R, 20), t + 0.01)] })),
    ...[...OUTPUT_NUTS, GND_NUT].map((p) => ({ at: p, group: (t: number) => terminalPad(p[0], p[1], t + 0.01) })),
    ...(opts.extra ?? []),
  ].map((x) => ({ at: move(x.at), group: x.group }))
  const bands: { lo: number; hi: number }[] = [{ lo: -Infinity, hi: 0 }, ...ROWS.map((r, i) => ({ lo: i === 0 ? 0 : r.a0, hi: r.a1 }))]
  const things: Standing[] = []
  for (const b of bands) {
    const lines = [b.lo, b.hi]
    const seam = (p: P2, q: P2) =>
      (Math.abs(p[0]) < 1e-6 && Math.abs(q[0]) < 1e-6) || lines.some((v) => Math.abs(p[1] - v) < 1e-6 && Math.abs(q[1] - v) < 1e-6)
    const cut = (poly: P2[]) => clipHalf(isFinite(b.lo) ? clipHalf(poly, 1, b.lo, true) : poly, 1, b.hi, false)
    const mid = isFinite(b.lo) ? (b.lo + b.hi) / 2 : -1
    const mod = cut(MODULE_BOX.map(move))
    if (mod.length >= 3) things.push({ a: mid, maxC: Math.max(...mod.map((p) => p[0])), group: slabPiece(cam, mod, z - MODULE_HEIGHT, z, "part", seam) })
    for (const right of [false, true]) {
      const poly = cut(clipHalf(out, 0, 0, right))
      if (poly.length < 3) continue
      // The terminals' nuts hang under the board, so they go first.
      const nuts = terminals.filter((p) => inPoly(poly, p)).map((p) => cylinder(cam, p[0], p[1], NUT.r, z - NUT.height, z, "metal"))
      const group = [...cluster(cam, nuts), ...slabPiece(cam, poly, z, zt, opts.hl ? HL : "board", seam)]
      const on = fixed.filter((x) => inPoly(poly, x.at)).sort((x, y) => cam.depth([...x.at, 0]) - cam.depth([...y.at, 0]))
      for (const x of on) group.push(...x.group(zt))
      things.push({ a: mid, maxC: Math.max(...poly.map((p) => p[0])), group })
    }
  }
  return things
}

/** The yoke on its own (on the desk, or lifted clear of everything), parts face at z. */
export function drawYoke(scene: Scene, z: number, opts: { extra?: OnYoke[]; hl?: boolean } = {}) {
  // Far bands first; the sort is stable, so within a band the module stays under the board.
  const pieces = yokePieces(scene.cam, z, opts)
  pieces.sort((x, y) => y.a - x.a)
  for (const p of pieces) scene.add(p.group)
}

