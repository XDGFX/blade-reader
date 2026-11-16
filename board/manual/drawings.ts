// Every drawing in the manual, by name. Each is an SVG string; the build inlines them. What
// moves in a step is drawn in the highlight; the rest stays in grey line.

import {
  ARM_DEPTH, BOARD, CHIN_A, CLAMP_HOLES, DECK, FUSE_TOP, GND_NUT, HALF, NEG_SCREWS_A, NEG_STUD_A, NUT, NUT_OUT,
  OUTPUT_NUTS, PAD, PROG_PADS, SCREW_INSET, STUD_A, USB_C, YOKE_OUTLINE, endA, hexagon, wayAt,
  type P2, type V,
} from "./geometry"
import { firmwareSeconds } from "./firmware"
import { arrow, leader, pathOf, svg, text } from "./marks"
import { cable, cover, feedLug, fuse, FUSE_C, ringTerminal, usbPlug, wayScrew } from "./props"
import {
  Camera, HL, VIEW, Scene, type OnYoke, type Standing, circle, clipHalf, cluster, cylinder, drawPanel, drawYoke, flat, fmt,
  standing, yokePieces,
} from "./render"

const cam = new Camera(VIEW)
const pr = cam.project
/** How high the board is held above the panel while it's lowered on. */
const LIFT = 30
const WAYS = Array.from({ length: 12 }, (_, i) => i + 1)
const fuseAt = (n: number): P2 => [Math.sign(wayAt(n)[0]) * FUSE_C, wayAt(n)[1]]
/** Where the board's top face is once seated. */
const RING = PAD + BOARD
/** The washer under a flat feed lug, the README's 2 mm. */
const LUG_WASHER = 2

type PanelState = {
  /** The way screws: in the panel, lifted out this far (highlighted), or gone. */
  screws?: "in" | "out" | number
  /** Ways whose fuse is out, lifted this far and highlighted. */
  pulled?: Map<number, number>
  /** A ring under the negative bus screw nearest the board, for the ground wire. */
  groundRing?: boolean
}

/** What stands on the panel: studs, negative bus screws, fuses, and the way screws or their holes. */
function panelThings(s: PanelState = {}): Standing[] {
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
      const g = ringed ? cluster(cam, [ringTerminal(cam, [c, a], PAD, [-1, 0], { length: 4, bolt: false, hl: true }), wayScrew(cam, [c, a], z)]) : wayScrew(cam, [c, a], z)
      things.push(standing(circle(c, a, 4.1), g))
    }
  }
  for (const n of WAYS) {
    const lift = s.pulled?.get(n)
    const at = fuseAt(n)
    things.push(standing([[at[0] - 9.55, at[1]], [at[0] + 9.55, at[1]]], fuse(cam, at, lift ?? 0, lift !== undefined)))
    const [c, a] = wayAt(n)
    if (s.screws === "in") things.push(standing(circle(c, a, 4.1), wayScrew(cam, [c, a], PAD)))
    else if (s.screws !== undefined) things.push(standing(circle(c, a, 2.1), [flat(circle(c, a, 2.1), PAD + 0.01)]))
  }
  return things
}

type BoardState = { screws?: boolean | "hl"; rings?: boolean | "hl"; hl?: boolean }

/** The seated board's pieces, with screws on its fingers and rings on its nuts if asked. */
function seated(b: BoardState = {}): Standing[] {
  const extra: OnYoke[] = []
  if (b.screws) for (const p of CLAMP_HOLES) extra.push({ at: p, group: (z) => wayScrew(cam, p, z, b.screws === "hl") })
  if (b.rings) {
    for (const p of OUTPUT_NUTS) {
      extra.push({ at: p, group: (z) => ringTerminal(cam, p, z + 0.02, [Math.sign(p[0]), 0], { length: 22, hl: b.rings === "hl" }) })
    }
  }
  return yokePieces(cam, PAD, { extra, hl: b.hl })
}

/**
 * The feed lug on its stud, on a washer `washer` thick. Its cable crosses the board's end, so it
 * is filed in front of the panel and drawn after the board.
 */
const lug = (washer: number, opts: { lift?: number; hl?: boolean } = {}): Standing => ({ a: -1, maxC: 9, group: feedLug(cam, washer, opts) })

/** Fitted: seated, screwed, lug on, rings on. */
const fitted = (panel: PanelState = {}): Standing[] => [...panelThings(panel), ...seated({ screws: true, rings: true }), lug(LUG_WASHER)]

/** The viewBox round a box in the world. */
function crop(lo: V, hi: V, pad = 2): number[] {
  const pts: P2[] = []
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push(pr([x, y, z]))
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + 2 * pad, Math.max(...ys) - Math.min(...ys) + 2 * pad]
}

/** A 3/4 drawing: the panel and what stands on it, then whatever `after` adds on top. */
function view(label: string, things: Standing[], opts: { after?: (s: Scene) => void; crop?: [V, V]; pad?: number } = {}) {
  const scene = new Scene(cam)
  drawPanel(scene, things)
  opts.after?.(scene)
  const clip = opts.crop ? crop(...opts.crop) : undefined
  const { body, box } = scene.render(opts.pad ?? 8, clip)
  return svg(clip ?? box, body, label, !!clip)
}

/** A label with a leader from a point in the world, offset (dx, dy) on the page. */
const callout = (s: Scene, p: V, dx: number, dy: number, label: string) => {
  const q = pr(p)
  s.overlay.push(leader(q, [q[0] + dx, q[1] + dy], label, dx < 0 ? "end" : "start"))
}

export const drawings: Record<string, string> = {}

/** The cover: Blade Reader fitted, every cable on its terminal. */
drawings.hero = view("Blade Reader fitted to a Blue Sea ST Blade fuse panel, every circuit's cable on its own terminal", fitted())

// ── What's what ─────────────────────────────────────────────────────────────────────────

drawings.partsBoard = (() => {
  const scene = new Scene(cam)
  drawYoke(scene, 0)
  const t = BOARD
  const finger = CLAMP_HOLES.reduce((m, p) => (p[0] > 0 && p[1] < m[1] ? p : m), [0, Infinity] as P2)
  callout(scene, [finger[0] - 7, finger[1], t], -30, 22, "finger")
  const nut = OUTPUT_NUTS.reduce((m, p) => (p[0] > 0 && p[1] > m[1] ? p : m), [0, -Infinity] as P2)
  callout(scene, [nut[0], nut[1], t], 24, -12, "terminal")
  callout(scene, [GND_NUT[0], GND_NUT[1], t], 26, 8, "GND terminal")
  callout(scene, [USB_C[0], USB_C[1], -1], -14, 22, "USB-C socket")
  const { body, box } = scene.render(30)
  box[2] += 46 // room for the GND terminal's label, past the board's right-hand edge
  return svg(box, body, "Blade Reader: a finger, a circuit nut, the GND nut and the USB-C socket")
})()

drawings.partsPanel = view("The fuse panel: the + stud and feed lug, a screw, a pocket, a fuse and the negative bus", [...panelThings({ screws: "in" }), lug(0)], {
  pad: 30,
  after: (s) => {
    callout(s, [0, STUD_A, FUSE_TOP], 30, -16, "+ stud")
    callout(s, [0, STUD_A - 14, PAD + 4], 34, 10, "feed lug")
    const [c, a] = wayAt(9)
    callout(s, [c, a, PAD + 3.4], -30, 8, "screw")
    callout(s, [c - 4.5, a + 4, PAD], -34, 22, "pocket")
    const f = fuseAt(1)
    callout(s, [f[0], f[1], FUSE_TOP + 10], -20, -34, "fuse")
    callout(s, [-(HALF - SCREW_INSET), NEG_SCREWS_A[2], PAD + 3.4], 30, -12, "negative bus")
  },
})

// ── On your desk ────────────────────────────────────────────────────────────────────────

drawings.desk = (() => {
  const scene = new Scene(cam)
  drawYoke(scene, 3.2)
  scene.add(usbPlug(cam, USB_C, 1.6))
  const { body, box } = scene.render(8)
  return svg(box, body, "A USB-C cable plugged into the socket on Blade Reader's end")
})()

// ── At the fuse panel ───────────────────────────────────────────────────────────────────

/** A battery isolator switch turned to off, drawn by hand. */
drawings.isolator = (() => {
  // A rotary battery switch from the front: the housing, OFF and ON marks, and the knob's
  // lever turned from ON to OFF.
  const at = (deg: number, r: number): P2 => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)]
  const off = -135
  const on = -45
  let s = `<circle class="top ln" r="24"/><circle class="side ln" r="11"/>`
  for (const d of [off, on]) s += `<path class="ln" d="M${fmt(at(d, 19)[0])} ${fmt(at(d, 19)[1])}L${fmt(at(d, 23)[0])} ${fmt(at(d, 23)[1])}"/>`
  s += text([at(off, 30)[0], at(off, 30)[1]], "OFF", "end", "label") + text([at(on, 30)[0], at(on, 30)[1]], "ON", "start", "label")
  s += `<rect class="hl ln" x="-3.5" y="-17" width="7" height="34" rx="3.5" transform="rotate(${off + 90})"/><circle class="hole ln" r="2.5"/>`
  // The turn, as a thin arc with a head, outside the housing.
  const R = 34
  const a0 = on - 6
  const a1 = off + 12
  const [x0, y0] = at(a0, R)
  const [x1, y1] = at(a1, R)
  s += `<path class="turn" d="M${fmt(x0)} ${fmt(y0)}A${R} ${R} 0 0 0 ${fmt(x1)} ${fmt(y1)}"/>`
  const tip = at(a1 - 8, R)
  s += `<path class="arrow ln" d="${pathOf([tip, at(a1 + 1, R - 3.5), at(a1 + 1, R + 3.5)])}"/>`
  return svg([-48, -46, 96, 76], s, "A battery isolator switch turned from ON to OFF")
})()

drawings.lugOff = view("The feed lug lifted off the + stud", [...panelThings({ screws: "in" }), lug(0, { lift: 22, hl: true })], {
  after: (s) => s.overlay.push(arrow(pr([0, STUD_A, FUSE_TOP + 8]), pr([0, STUD_A, FUSE_TOP + 24]))),
})

drawings.screwsOut = view("All 12 screws lifted out of the panel", panelThings({ screws: "out" }), {
  after: (s) => {
    for (const n of WAYS) s.add(wayScrew(cam, wayAt(n), PAD + 18, true))
    for (const n of [11, 12]) {
      const [c, a] = wayAt(n)
      s.overlay.push(arrow(pr([c + Math.sign(c) * 9, a, PAD + 4]), pr([c + Math.sign(c) * 9, a, PAD + 18])))
    }
  },
})

drawings.lower = (() => {
  const scene = new Scene(cam)
  drawPanel(scene, panelThings({ screws: "out" }))
  // Guides from the end fingers' holes down to their screw holes, under the lifted board.
  for (const n of [11, 12, 1, 2]) {
    const [c, a] = wayAt(n)
    const p = pr([c, a, PAD])
    const q = pr([c, a, PAD + LIFT])
    scene.raw(`<path class="guide" d="M${fmt(p[0])} ${fmt(p[1])}L${fmt(q[0])} ${fmt(q[1])}"/>`)
  }
  drawYoke(scene, PAD + LIFT, { hl: true })
  const t = PAD + LIFT + BOARD
  for (const c of [-52, 52]) scene.overlay.push(arrow(pr([c, CHIN_A - 3, t - 4]), pr([c, CHIN_A - 3, t - 24])))
  const { body, box } = scene.render(10)
  return svg(box, body, "Blade Reader lowered onto the fuse panel, a finger into each pocket")
})()

drawings.screwsIn = view("All 12 screws back in, each on its washer", [...panelThings(), ...seated({ screws: "hl" })], {
  after: (s) => {
    for (const n of [11, 12]) {
      const [c, a] = wayAt(n)
      s.overlay.push(arrow(pr([c + Math.sign(c) * 7, a, RING + 22]), pr([c + Math.sign(c) * 7, a, RING + 6])))
    }
  },
})

drawings.lugOn = view("The feed lug back on the + stud", [...panelThings(), ...seated({ screws: true }), lug(LUG_WASHER, { hl: true })], {
  crop: [[-44, -40, 6], [44, 30, 32]],
})

/**
 * The feed lug from the side, cut through the + stud: ✓ with a gap between it and the board,
 * ✗ resting on the board, which bends as the nut is done up. Drawn to scale, a along the page
 * with the board's end on the left, h up.
 */
function lugSection(ok: boolean) {
  const X = (a: number) => a
  const Y = (h: number) => -h
  const P = (a: number, h: number): P2 => [X(a), Y(h)]
  const end = endA(0)
  const inner = Math.min(...YOKE_OUTLINE.filter((p) => Math.abs(p[0]) < 1).map((p) => p[1]))
  const box = (a0: number, a1: number, h0: number, h1: number, cls: string) => `<path class="${cls} ln" d="${pathOf([P(a0, h0), P(a1, h0), P(a1, h1), P(a0, h1)])}"/>`
  // The panel: its end deck, the stud's boss and the stud.
  let s = box(end, 26, 6, DECK, "side") + box(STUD_A - 9, STUD_A + 9, DECK, DECK + 0.8, "side") + box(STUD_A - 5.25, STUD_A + 5.25, DECK + 0.8, PAD, "side")
  s += box(STUD_A - 2.4, STUD_A + 2.4, PAD, FUSE_TOP, "metal")
  // The board's end, bowed down at its tip when the lug sits on it.
  const bend = ok ? 0 : 3
  const tip = CHIN_A
  const under = (a: number) => PAD - bend * ((inner - a) / (inner - tip)) ** 2
  const n = 12
  const top: P2[] = []
  const bottom: P2[] = []
  for (let i = 0; i <= n; i++) {
    const a = inner + ((tip - inner) * i) / n
    top.push(P(a, under(a) + BOARD))
    bottom.push(P(a, under(a)))
  }
  s += `<path class="board ln" d="${pathOf([...top, ...bottom.reverse()])}"/>`
  // The lug: on a washer with a gap, or resting on the board's edge with none under it.
  const R = 7
  const t = 1.5
  const z = ok ? PAD + LUG_WASHER : RING
  if (ok) s += box(STUD_A - 6.5, STUD_A + 6.5, PAD, PAD + LUG_WASHER, HL)
  // The lug's ring round the stud, its tongue, then the cable's crimp running out over the board.
  const crimp = STUD_A - R - 2
  s += `<path class="hl ln" d="${pathOf([P(STUD_A + R, z), P(STUD_A + 2.6, z), P(STUD_A + 2.6, z + t), P(STUD_A + R, z + t)])}"/>`
  s += `<path class="hl ln" d="${pathOf([P(STUD_A - 2.6, z), P(crimp, z), P(crimp, z + t), P(STUD_A - 2.6, z + t)])}"/>`
  s += `<rect class="hl ln" x="${fmt(X(-30))}" y="${fmt(Y(z + 10))}" width="${fmt(crimp + 30)}" height="10" rx="2"/>`
  s += box(STUD_A - 4, STUD_A + 4, z + t, z + t + 2.9, "metal")
  s += ok
    ? leader(P((inner + tip) / 2, (RING + z) / 2), P((inner + tip) / 2 - 2, 4), "gap", "end")
    : leader(P(inner - 4, RING), P(inner - 2, 4), "on the board", "start")
  return svg([-24, Y(30), 50, 30], s, ok ? "Right: a gap between the feed lug and the board" : "Wrong: the feed lug sitting on the board, which bends it as the nut is done up", false, 10)
}
drawings.lugGap = lugSection(true)
drawings.lugTouching = lugSection(false)

drawings.rings = view("Each circuit's cable bolted to its own nut, the cable straight out", [...panelThings(), ...seated({ screws: true, rings: "hl" }), lug(LUG_WASHER)])

/** One nut from above: the cable straight out, within about 20° either way. */
drawings.ringAngle = (() => {
  // From above, the panel's edge on the left: the board runs from it out past the nut.
  const r = 4.6
  const ang = (20 * Math.PI) / 180
  const L = 30
  const edge = -NUT_OUT
  let s = `<path class="board ln" d="${pathOf([[edge, -15], [edge + ARM_DEPTH, -15], [edge + ARM_DEPTH, 15], [edge, 15]])}"/>`
  s += `<path class="ln" d="M${fmt(edge)} -19V19"/>`
  s += `<circle class="metal ln" r="${NUT.pad}"/>`
  s += `<path class="hl ln" d="${pathOf([[r * 0.5, -2.6], [r + 9, -2.6], [r + 9, 2.6], [r * 0.5, 2.6]])}"/>`
  s += `<circle class="hl ln" r="${r}"/><circle class="hole ln" r="2.2"/>`
  s += `<path class="hl ln" d="${pathOf([[r + 9, -2.9], [L + 8, -2.9], [L + 8, 2.9], [r + 9, 2.9]])}"/>`
  s += `<path class="guide" d="M0 0L${fmt(L * Math.cos(ang))} ${fmt(-L * Math.sin(ang))}M0 0L${fmt(L * Math.cos(ang))} ${fmt(L * Math.sin(ang))}"/>`
  s += `<path class="ln thin" d="M${fmt((L - 4) * Math.cos(ang))} ${fmt(-(L - 4) * Math.sin(ang))}A${L - 4} ${L - 4} 0 0 1 ${fmt((L - 4) * Math.cos(ang))} ${fmt((L - 4) * Math.sin(ang))}"/>`
  s += text([L - 2, -12], "20°", "start", "label") + text([L - 2, 18], "20°", "start", "label")
  s += text([edge - 1, -20.5], "panel edge", "start", "label")
  return svg([edge - 3, -27, L + 8 - edge + 6, 50], s, "The cable straight out from the panel, within about 20° either way")
})()

drawings.ground = view("The ground wire from the GND nut to the panel's negative bus", fitted({ groundRing: true }), {
  after: (s) => {
    const [c, a] = GND_NUT
    const zt = RING + 0.01
    s.add(ringTerminal(cam, [c, a], zt + 0.02, [-1, 0], { length: 8, hl: true }))
    const zA = zt + 0.47 + 2.2
    const zB = PAD + 0.45 + 2.2
    const n0 = NEG_SCREWS_A[0]
    s.add(cable(cam, [[c - 23.6, a, zA], [-80, 14, zA], [-80, 96, 22], [-62, n0, 20], [-HALF + SCREW_INSET - 15.6, n0, zB]], 2.9, true))
    callout(s, [c, a, zt], 18, 22, "GND")
  },
})

drawings.cover = (() => {
  const scene = new Scene(cam)
  drawPanel(scene, fitted())
  const z = FUSE_TOP + 34
  scene.add(cover(cam, z))
  for (const c of [-HALF - 10, HALF + 10]) scene.overlay.push(arrow(pr([c, 120, z + 6]), pr([c, 120, z - 18])))
  const { body, box } = scene.render(10)
  return svg(box, body, "The cover going back on over the panel")
})()

// ── If something's wrong ────────────────────────────────────────────────────────────────

drawings.pullFuse = view("One circuit's fuse pulled out", fitted({ pulled: new Map([[7, 22]]) }), {
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
  s += text([0, edgeY - 1.5], "board edge", "middle", "label")
  return svg([-12, edgeY - 5, 24, 20], s, "The PROG pads on the underside of Blade Reader's end: EN, VDD, TXD, GND, RXD, IO0", true)
})()
