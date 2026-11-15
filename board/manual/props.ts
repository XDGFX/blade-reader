// The things the manual's drawings show besides the yoke and the panel, as convex solids in the
// same line: screws, washers, rings and their cables, the feed lug, fuses, the USB plug, the
// cover. Sizes are the fit dimensions where a source gives them, else typical parts.

import { FUSE_TOP, HALF, INNER_C, LENGTH, PAD, STUD_A, hexagon, type P2, type V } from "./geometry"
import { type Camera, type Group, cluster, cylinder, flat, prism, tube } from "./render"

/** The panel's #8 pan head way screw, Ø8.18 × 2.9, on its lock washer, standing on z. */
export const wayScrew = (cam: Camera, [c, a]: P2, z: number): Group =>
  cluster(cam, [
    cylinder(cam, c, a, 4.07, z, z + 0.5, "metal"),
    [...cylinder(cam, c, a, 4.09, z + 0.5, z + 3.4, "metal"), slot(c, a, z + 3.41)],
  ])

/** A Phillips cross on a screw head. */
const slot = (c: number, a: number, z: number) =>
  flat([[c - 2.2, a - 0.4], [c - 0.4, a - 0.4], [c - 0.4, a - 2.2], [c + 0.4, a - 2.2], [c + 0.4, a - 0.4], [c + 2.2, a - 0.4], [c + 2.2, a + 0.4], [c + 0.4, a + 0.4], [c + 0.4, a + 2.2], [c - 0.4, a + 2.2], [c - 0.4, a + 0.4], [c - 2.2, a + 0.4]], z)

/** A hex head of `flats` across flats. */
const hex = (cam: Camera, c: number, a: number, flats: number, z0: number, z1: number, cls = "metal"): Group =>
  prism(cam, hexagon(c, a, flats, Math.PI / 6), z0, z1, cls)

/**
 * A crimped ring terminal on z, its tongue and cable leaving along `dir` (a unit vector in
 * plan), held down by an M4 hex-head bolt on a spring washer unless `bolt` is false. `ring`
 * is the ring's outer radius and `cable` the cable's radius.
 */
export function ringTerminal(cam: Camera, [c, a]: P2, z: number, dir: P2, opts: { ring?: number; cable?: number; length?: number; bolt?: boolean; cls?: string } = {}): Group {
  const R = opts.ring ?? 4.6
  const rc = opts.cable ?? 2.9
  const len = opts.length ?? 48
  const t = 0.9
  const at = (d: number, dz = 0): V => [c + dir[0] * d, a + dir[1] * d, z + dz]
  const zc = z + t / 2 + rc * 0.75
  const groups: Group[] = [
    [...cylinder(cam, c, a, R, z, z + t, "metal")],
    prism(cam, [[c + dir[1] * R * 0.8, a - dir[0] * R * 0.8], [c - dir[1] * R * 0.8, a + dir[0] * R * 0.8], [c - dir[1] * R * 0.8 + dir[0] * (R + 3), a + dir[0] * R * 0.8 + dir[1] * (R + 3)], [c + dir[1] * R * 0.8 + dir[0] * (R + 3), a - dir[0] * R * 0.8 + dir[1] * (R + 3)]], z, z + t, "metal"),
    tube(cam, at(R + 2.5, zc - z), at(R + 11, zc - z), rc * 0.95, "metal"),
    tube(cam, at(R + 11, zc - z), at(R + 11 + len, zc - z), rc, opts.cls ?? "cable"),
  ]
  if (opts.bolt !== false) {
    groups.push(cylinder(cam, c, a, 3.9, z + t, z + t + 1, "metal"))
    groups.push(hex(cam, c, a, 7, z + t + 1, z + t + 3.8))
  }
  return cluster(cam, groups)
}

/** The + stud's nut and the feed lug on a washer `washer` thick, its cable out past the chin. */
export const feedLug = (cam: Camera, washer: number, lift = 0): Group => {
  const z = PAD + washer + lift
  const parts: Group[] = []
  if (washer) parts.push(cylinder(cam, 0, STUD_A, 6.5, PAD + lift, z, "metal"))
  parts.push(ringTerminal(cam, [0, STUD_A], z, [0, -1], { ring: 7, cable: 5.2, length: 52, bolt: false }))
  parts.push(hex(cam, 0, STUD_A, 7.92, z + 1.5, z + 4.4))
  return cluster(cam, parts)
}

/** A blade (ATO) fuse standing in its holder: 19.1 across, 5.1 thick, 10 showing. */
export const FUSE_C = INNER_C - 10.5
export const fuse = (cam: Camera, [c, a]: P2, lift = 0): Group =>
  cluster(cam, [
    prism(cam, [[c - 9.55, a - 2.55], [c + 9.55, a - 2.55], [c + 9.55, a + 2.55], [c - 9.55, a + 2.55]], FUSE_TOP - 1 + lift, FUSE_TOP + 8 + lift, "fuse"),
    prism(cam, [[c - 8, a - 2.9], [c + 8, a - 2.9], [c + 8, a + 2.9], [c - 8, a + 2.9]], FUSE_TOP + 8 + lift, FUSE_TOP + 10 + lift, "fuse"),
  ])

/** A USB-C plug in the socket at (c, a) on the chin's outer edge, z its centre height. */
export const usbPlug = (cam: Camera, [c, a]: P2, z: number): Group =>
  cluster(cam, [
    prism(cam, [[c - 4.1, a - 0.5], [c + 4.1, a - 0.5], [c + 4.1, a - 7], [c - 4.1, a - 7]], z - 1.3, z + 1.3, "metal"),
    prism(cam, [[c - 6, a - 7], [c + 6, a - 7], [c + 6, a - 24], [c - 6, a - 24]], z - 3.2, z + 3.2, "plug"),
    tube(cam, [c, a - 24, z], [c, a - 34, z], 2.4, "plug"),
    tube(cam, [c, a - 34, z], [c - 6, a - 80, z - 2], 1.9, "cable"),
  ])

/** The panel's cover, over the whole panel, its underside at z. */
export const cover = (cam: Camera, z: number): Group =>
  prism(cam, [[-HALF, 0], [HALF, 0], [HALF, LENGTH], [-HALF, LENGTH]], z, z + 12.4, "cover")

/** A cable along a path of points, as joined tubes. */
export const cable = (cam: Camera, pts: V[], r: number, cls = "cable"): Group =>
  cluster(cam, pts.slice(1).map((q, i) => tube(cam, pts[i], q, r, cls)))
