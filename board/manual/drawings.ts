// Every drawing in the manual, by name. Each is an SVG string; the build inlines them.

import {
  ARM_DEPTH, BOARD, CHIN_A, CLAMP_HOLES, DECK, FUSE_TOP, GND_NUT, HALF, MODULE_HEIGHT, NEG_SCREWS_A, NEG_STUD_A, NUT,
  NUT_OUT, OUTPUT_NUTS, PAD, PITCH, PROG_PADS, SCREW_INSET, STUD_A, USB_C, YOKE_OUTLINE, hexagon, wayAt,
  type P2, type V,
} from "./geometry"
import { firmwareSeconds } from "./firmware"
import { arrow, leader, pathOf, svg, text } from "./marks"
import { cable, cover, feedLug, fuse, FUSE_C, ringTerminal, usbPlug, wayScrew } from "./props"
import {
  Camera, VIEW, Scene, type OnYoke, type Standing, circle, clipHalf, cluster, cylinder, drawPanel, drawYoke, flat, fmt,
  standing, yokePieces,
} from "./render"

const cam = new Camera(VIEW)
const pr = cam.project
/** How high the yoke is held above the panel while it's lowered on. */
const LIFT = 30
const WAYS = Array.from({ length: 12 }, (_, i) => i + 1)
const fuseAt = (n: number): P2 => [Math.sign(wayAt(n)[0]) * FUSE_C, wayAt(n)[1]]
/** Where the yoke's ring face is once seated. */
const RING = PAD + BOARD

type PanelState = {
  /** The way screws' holes are showing: no yoke and no screws. */
  holes?: boolean
  /** Ways whose fuse is out, lifted this far (0 hides it). */
  pulled?: Map<number, number>
  /** A ring under the left negative bus screw nearest the ways, for the ground wire. */
  groundRing?: boolean
}

/** What stands on a bare panel: studs, negative bus screws, fuses, and the screw holes. */
function panelThings(cam: Camera, s: PanelState = {}): Standing[] {
  const things: Standing[] = []
  const stud = (a: number, boss: boolean) =>
    cluster(cam, [
      ...(boss ? [cylinder(cam, 0, a, 9, DECK, DECK + 0.8), cylinder(cam, 0, a, 5.25, DECK + 0.8, PAD)] : []),
      cylinder(cam, 0, a, 2.4, boss ? PAD : DECK, FUSE_TOP, "metal"),
    ])
  things.push(standing(circle(0, STUD_A, 9), stud(STUD_A, true)), standing(circle(0, NEG_STUD_A, 2.4), stud(NEG_STUD_A, false)))
  for (const side of [1, -1]) {
    for (const a of NEG_SCREWS_A) {
      const c = side * (HALF - SCREW_INSET)
      const ringed = s.groundRing && side < 0 && a === NEG_SCREWS_A[0]
      const z = ringed ? PAD + 0.9 : PAD
      const g = ringed ? cluster(cam, [ringTerminal(cam, [c, a], PAD, [-1, 0], { length: 4, bolt: false, cls: "ground" }), wayScrew(cam, [c, a], z)]) : wayScrew(cam, [c, a], z)
      things.push(standing(circle(c, a, 4.1), g))
    }
  }
  for (const n of WAYS) {
    const lift = s.pulled?.get(n)
    if (lift === 0) continue
    const at = fuseAt(n)
    things.push(standing([[at[0] - 9.55, at[1]], [at[0] + 9.55, at[1]]], fuse(cam, at, lift ?? 0)))
    if (s.holes) {
      const [c, a] = wayAt(n)
      things.push(standing(circle(c, a, 2.1), [flat(circle(c, a, 2.1), PAD + 0.01)]))
    }
  }
  return things
}

type YokeState = { screws?: boolean; rings?: boolean; da?: number; z?: number }

/** The seated yoke's pieces, with screws on its fingers and rings on its nuts if asked. */
function seated(cam: Camera, y: YokeState = {}): Standing[] {
  const extra: OnYoke[] = []
  if (y.screws) for (const p of CLAMP_HOLES) extra.push({ at: p, group: (z) => wayScrew(cam, p, z) })
  if (y.rings) {
    for (const p of OUTPUT_NUTS) {
      extra.push({ at: p, group: (z) => ringTerminal(cam, p, z + NUT.height + 0.02, [Math.sign(p[0]), 0], { length: 22 }) })
    }
  }
  return yokePieces(cam, y.z ?? PAD, { da: y.da, extra })
}

/**
 * The feed lug on its stud, on a washer `washer` thick and lifted `lift`. Its cable crosses the
 * chin, so it is filed in front of the panel and drawn after the chin.
 */
const lug = (washer: number, lift = 0): Standing => ({ a: -1, maxC: 9, group: feedLug(cam, washer, lift) })

/** The installed yoke: seated, screwed, lug on, rings on. */
const installed = (cam: Camera, panel: PanelState = {}): Standing[] => [
  ...panelThings(cam, panel),
  ...seated(cam, { screws: true, rings: true }),
  lug(2),
]

/** The viewBox round a box in the world. */
function crop(cam: Camera, lo: V, hi: V, pad = 2): number[] {
  const pts: P2[] = []
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push(cam.project([x, y, z]))
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad]
}

/** A 3/4 drawing: panel and things, then whatever `after` draws on top. */
function view(label: string, things: Standing[], opts: { after?: (s: Scene) => void; crop?: [V, V]; pad?: number } = {}) {
  const scene = new Scene(cam)
  drawPanel(scene, things)
  opts.after?.(scene)
  const clip = opts.crop ? crop(scene.cam, ...opts.crop) : undefined
  const { body, box } = scene.render(opts.pad ?? 8, clip)
  return svg(clip ?? box, body, label, !!clip)
}

export const drawings: Record<string, string> = {}

// ── On the desk ─────────────────────────────────────────────────────────────────────────

drawings.desk = (() => {
  const scene = new Scene(cam)
  const z = MODULE_HEIGHT
  drawYoke(scene, z)
  scene.add(usbPlug(cam, USB_C, z - 1.6))
  const { body, box } = scene.render(8)
  return svg(box, body, "The yoke on the desk, a USB-C cable in the socket on its chin")
})()

// ── Install ─────────────────────────────────────────────────────────────────────────────

drawings.strip = view(
  "The positive end stripped: feed lug off, every ring lifted, all 12 way screws out",
  [...panelThings(cam, { holes: true }), lug(0, 22)],
  {
    after: (s) => {
      const out = [11, 12, 9]
      for (const n of out) s.add(wayScrew(cam, wayAt(n), PAD + 18))
      s.overlay.push(arrow(pr([0, STUD_A, FUSE_TOP + 8]), pr([0, STUD_A, FUSE_TOP + 24])))
      for (const n of out) {
        const [c, a] = wayAt(n)
        s.overlay.push(arrow(pr([c + Math.sign(c) * 9, a, PAD + 4]), pr([c + Math.sign(c) * 9, a, PAD + 18])))
      }
    },
  },
)

drawings.lower = (() => {
  const scene = new Scene(cam)
  drawPanel(scene, panelThings(cam, { holes: true }))
  // Guides from the end fingers' holes down to their screw holes, under the lifted yoke.
  for (const n of [11, 12, 1, 2]) {
    const [c, a] = wayAt(n)
    const p = pr([c, a, PAD])
    const q = pr([c, a, PAD + LIFT])
    scene.raw(`<path class="guide" d="M${fmt(p[0])} ${fmt(p[1])}L${fmt(q[0])} ${fmt(q[1])}"/>`)
  }
  drawYoke(scene, PAD + LIFT)
  const t = PAD + LIFT + BOARD
  for (const c of [-52, 52]) scene.overlay.push(arrow(pr([c, CHIN_A - 3, t - 4]), pr([c, CHIN_A - 3, t - 24])))
  const { body, box } = scene.render(10)
  return svg(box, body, "The yoke lowered onto the stripped fuse panel")
})()

/** The ✓/✗ close-up: the odd arm's first three ways, nearest the chin. */
const NEAR: [V, V] = [[HALF - 16, -2, 8], [HALF + 20, 52, 28]]
drawings.seated = view("Seated: every finger down in its pocket", [...panelThings(cam), ...seated(cam)], { crop: NEAR })
drawings.resting = view(
  "Wrong: the fingers resting on the barriers, not in their pockets",
  [...panelThings(cam), ...seated(cam, { z: 22.95, da: -PITCH / 2 })],
  { crop: NEAR },
)

drawings.screws = view("All 12 way screws back in, each on its lock washer", [...panelThings(cam), ...seated(cam, { screws: true })], {
  after: (s) => {
    for (const n of [11, 12]) {
      const [c, a] = wayAt(n)
      s.overlay.push(arrow(pr([c + Math.sign(c) * 7, a, RING + 22]), pr([c + Math.sign(c) * 7, a, RING + 6])))
    }
  },
})

drawings.lug = view("The feed lug back on its stud on a washer, clear of the chin", [...panelThings(cam), ...seated(cam, { screws: true }), lug(2)], {
  crop: [[-44, -40, 6], [44, 30, 32]],
  after: (s) => {
    // The gap between the chin's ring face and the lug, at the chin's inner edge.
    const a = Math.min(...YOKE_OUTLINE.filter((p) => Math.abs(p[0]) < 1).map((p) => p[1])) + 1
    const p = pr([-8.5, a, RING])
    const q = pr([-8.5, a, PAD + 2])
    s.overlay.push(leader([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], [p[0] - 14, p[1] + 9], "clear gap", "end"))
  },
})

drawings.rings = view("Each circuit's ring on its own way's nut, the cable straight out", installed(cam))

/** One nut from above: the ring's tongue straight out, within about 20° either way. */
drawings.ringAngle = (() => {
  // From above, the panel's edge on the left: the arm runs from it out past the nut.
  const r = 4.6
  const ang = (20 * Math.PI) / 180
  const L = 30
  const edge = -NUT_OUT
  let s = `<path class="board ln" d="${pathOf([[edge, -15], [edge + ARM_DEPTH, -15], [edge + ARM_DEPTH, 15], [edge, 15]])}"/>`
  s += `<path class="ln" d="M${fmt(edge)} -19V19"/>`
  s += `<path class="top ln" d="${pathOf(hexagon(0, 0, NUT.flats))}"/>`
  s += `<path class="metal ln" d="${pathOf([[r * 0.5, -2.6], [r + 9, -2.6], [r + 9, 2.6], [r * 0.5, 2.6]])}"/>`
  s += `<circle class="metal ln" r="${r}"/><circle class="hole ln" r="2.2"/>`
  s += `<path class="cable ln" d="${pathOf([[r + 9, -2.9], [L + 8, -2.9], [L + 8, 2.9], [r + 9, 2.9]])}"/>`
  s += `<path class="guide" d="M0 0L${fmt(L * Math.cos(ang))} ${fmt(-L * Math.sin(ang))}M0 0L${fmt(L * Math.cos(ang))} ${fmt(L * Math.sin(ang))}"/>`
  s += `<path class="ln thin" d="M${fmt((L - 4) * Math.cos(ang))} ${fmt(-(L - 4) * Math.sin(ang))}A${L - 4} ${L - 4} 0 0 1 ${fmt((L - 4) * Math.cos(ang))} ${fmt((L - 4) * Math.sin(ang))}"/>`
  s += text([L - 2, -12], "20°") + text([L - 2, 15], "20°")
  s += text([edge - 1, -20.5], "panel edge", "start", "small")
  return svg([edge - 3, -25, L + 8 - edge + 6, 46], s, "The ring's tongue straight out from the panel, within about 20° either way")
})()

drawings.ground = view("The ground wire from the nut marked GND to the panel's negative bus", installed(cam, { groundRing: true }), {
  after: (s) => {
    const [c, a] = GND_NUT
    const zt = RING + 0.01
    s.add(ringTerminal(cam, [c, a], zt + NUT.height + 0.02, [-1, 0], { length: 8, cls: "ground" }))
    const zA = zt + NUT.height + 0.47 + 2.2
    const zB = PAD + 0.45 + 2.2
    const n0 = NEG_SCREWS_A[0]
    s.add(cable(cam, [[c - 23.6, a, zA], [-80, 14, zA], [-80, 96, 22], [-62, n0, 20], [-HALF + SCREW_INSET - 15.6, n0, zB]], 2.9, "ground"))
    s.overlay.push(leader(pr([c, a, zt + NUT.height]), [pr([c, a, 0])[0] - 18, pr([c, a, 0])[1] + 22], "GND", "end"))
  },
})

drawings.cover = (() => {
  const scene = new Scene(cam)
  drawPanel(scene, installed(cam))
  const z = FUSE_TOP + 34
  scene.add(cover(cam, z))
  for (const c of [-HALF - 10, HALF + 10]) scene.overlay.push(arrow(pr([c, 120, z + 6]), pr([c, 120, z - 18])))
  const { body, box } = scene.render(10)
  return svg(box, body, "The cover going back on over the panel")
})()

// ── Redo one way's zero ─────────────────────────────────────────────────────────────────

drawings.pullFuse = view("One way's fuse pulled out", installed(cam, { pulled: new Map([[7, 22]]) }), {
  after: (s) => {
    const [c, a] = fuseAt(7)
    s.overlay.push(arrow(pr([c + 13, a, FUSE_TOP + 6]), pr([c + 13, a, FUSE_TOP + 26])))
  },
})

/** The red LED while one way's zero is redone: a timeline, in seconds. */
drawings.zeroTimeline = (() => {
  // The fuse goes back in a few seconds after the zero is saved; every other time is the firmware's.
  const blown = firmwareSeconds("BLOWN_AFTER_MS")
  const zeroing = firmwareSeconds("ZERO_DEAD_MS")
  const saved = zeroing + firmwareSeconds("ZERO_MEAN_MS")
  const refit = saved + 5
  const clear = refit + firmwareSeconds("BLOWN_CLEARS_AFTER_MS")
  const blink = firmwareSeconds("FAST_BLINK_MS")
  const end = clear + 3
  const X = (t: number) => t * 5
  const label = (p: P2, s1: string, anchor = "middle") => text(p, s1, anchor, "label")
  let s = `<path class="ln" d="M0 30H${fmt(X(end))}"/>`
  for (const t of [0, blown, zeroing, saved, refit, clear]) s += `<path class="ln thin" d="M${fmt(X(t))} 28V32"/>`
  const on = (t0: number, t1: number) => `<rect class="led" x="${fmt(X(t0))}" y="13" width="${fmt(X(t1) - X(t0))}" height="10" rx="1.5"/>`
  const off = (t0: number, t1: number) => `<path class="ln thin" d="M${fmt(X(t0))} 18H${fmt(X(t1))}"/>`
  s += off(0, blown) + on(blown, zeroing) + on(saved, clear) + off(clear, end)
  for (let t = zeroing; t < saved - 1e-6; t += blink) s += `<rect class="led" x="${fmt(X(t))}" y="13" width="${fmt(X(blink / 2))}" height="10" rx="0.4"/>`
  s += label([X((blown + zeroing) / 2), 9], "steady") + label([X((zeroing + saved) / 2), 9], "zeroing") + label([X((saved + clear) / 2), 9], "steady")
  // Events under the axis, on two rows so their names don't meet.
  const ev = (t: number, s1: string, row: number) => `<path class="ln thin" d="M${fmt(X(t))} 32V${34 + row * 8}"/>` + label([X(t), 40 + row * 8], s1, t === 0 ? "start" : "middle")
  s += ev(0, "fuse out", 0) + ev(saved, `${saved} s: saved`, 1) + ev(refit, "fuse in", 0) + ev(clear, `${clear - refit} s on: clear`, 1)
  return svg([-4, 0, X(end) + 14, 52], s, `The red LED with one fuse out: off for ${blown} s, steady, a fast blink from ${zeroing} to ${saved} s while the zero is taken, then steady until ${clear - refit} s after the fuse goes back in`)
})()

// ── Recovery ────────────────────────────────────────────────────────────────────────────

/**
 * The chin from the parts face, with the PROG pads: seen from underneath, so c runs the other
 * way. Pads are 2×3 on 2.54 mm, in the order the footprint numbers them.
 */
drawings.progPads = (() => {
  const [pc, pa] = PROG_PADS
  const X = (c: number) => -(c - pc)
  const Y = (a: number) => a - pa
  const strip = clipHalf(clipHalf(clipHalf(YOKE_OUTLINE, 0, pc - 16, true), 0, pc + 16, false), 1, pa + 12, false)
  const edgeY = Y(Math.min(...strip.map((p) => p[1])))
  let s = `<path class="board ln" d="${pathOf(strip.map(([c, a]) => [X(c), Y(a)] as P2))}"/>`
  const names = ["EN", "VDD", "TXD", "GND", "RXD", "IO0"]
  for (let col = 0; col < 3; col++) {
    for (const [i, row] of [1, -1].entries()) {
      // The footprint's x is −c, which reads as +x from underneath; its +y is towards the
      // chin's edge. Each pad runs 0.25 to 4.1 out from the centre line.
      const x = (col - 1) * 2.54
      const y0 = row > 0 ? -4.1 : 0.25
      s += `<rect class="pad ln" x="${fmt(x - 0.75)}" y="${fmt(y0)}" width="1.5" height="3.85" rx="0.3"/>`
      // Each name reads up its own pad, from the pad's lower end.
      s += `<text class="pin" transform="translate(${fmt(x + 0.4)} ${fmt(row > 0 ? -0.55 : 3.8)}) rotate(-90)">${names[col * 2 + i]}</text>`
    }
  }
  s += text([0, edgeY - 1.5], "chin edge", "middle", "label")
  return svg([-12, edgeY - 5, 24, 18], s, "The PROG pads on the chin's parts face: EN, VDD, TXD, GND, RXD, IO0")
})()
