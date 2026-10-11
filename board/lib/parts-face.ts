// The yoke's parts-face silkscreen (#86). It is laid out as the board lies when it is turned
// over sideways from the ring face, chin down: x across from the centreline with the odd arm on
// the right, and y the board's own Y. That is the board's frame turned half round.
//
// Each mark stands beside the pads as they are placed. If a part moves, scripts/silk.ts fails
// until its mark follows it.

import fieldJson from "./art/field.json"
import type { Pt } from "./outline"
import type { Yoke } from "./ring-face"
import { type Art, art, bar, chevron, dot, join, line, logo, mapArt, roundRect, text } from "./silkscreen"

const P = (x: number, y: number): Pt => ({ x, y })

const centredAt = (a: Art, x: number, y: number) => {
  const pts = [...a.strokes.flatMap((s) => s.pts), ...a.fills.flat(2)]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2]
  return mapArt(a, (p) => P(p.x - cx + x, p.y - cy + y))
}

// ── Arms ───────────────────────────────────────────────────────────────────────────────────

const WAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * One way's marks. The only clear silk on an arm is the patch between a finger and its nut,
 * 41.8 to 47.8 from the centreline: the finger is the panel's contact and its root holds the
 * 0402s. The way's number is there, then two chevrons pointing at the nut, way 1's filled.
 */
const way = (yoke: Yoke, n: number): Art => {
  const s = n % 2 ? 1 : -1
  const y = yoke.pcb(0, yoke.waysA[Math.floor((12 - n) / 2)]).y
  /** A chevron at 0.75 size with its point outboard, `d` from the centreline. */
  const out = (d: number) => mapArt(chevron(0, 0, n === 1), (p) => P(s * (d - p.y * 0.75), y + p.x * 0.75))
  return join(
    centredAt(text(0, 0, 1.9, String(n), { w: 0.25 }), s * 43.45, y),
    out(46.2),
    out(47.4),
    // The sensor's pin 1 is at its −X end on both arms: outboard on the odd arm, towards the panel on the even.
    s > 0 ? dot(48.63, y + 4.08, 0.46) : dot(-43.16, y + 4.08, 0.46),
    // The way diode's cathode, between its pad and the sensor.
    bar(s * 48.8, y + 5.75, s * 48.8, y + 7.61),
  )
}

// ── The chin ───────────────────────────────────────────────────────────────────────────────

/** Pin-1 dots, Ø0.46, so a dot 0.5 off its pad keeps 0.25 clear. */
const PIN1_DOTS: [number, number][] = [
  [57.7, 37.15], // U1, under the module: nothing fits beside pin 1
  [35.48, 42.63], // U2
  [-28.95, 51.45], // U3
  [-55.55, 32.36], // U4
  [9.85, 56.4], // J1, beside pin 1
]
/** Cathode bars, 0.25 wide, alongside the cathode pad. */
const CATHODE_BARS: [number, number, number, number][] = [
  [-36.25, 52.0, -36.25, 54.76], // D1
  [-6.45, 55.2, -6.45, 57.05], // D2
  [18.75, 55.2, 18.75, 57.05], // D3
]
/** Each LED's cathode: a tick under its pad, on the chin's edge side. */
const LED_CATHODES: [number, number][][] = [
  [[39.7, 57.13], [40.5, 57.13]], // LED1
  [[35.9, 57.13], [36.6, 57.13]], // LED2
]
/** Designators and captions, 0.8 mm. */
const LABELS: [string, number, number, "start" | "middle" | "end"][] = [
  ["U1", 56.9, 38.3, "end"], // under the module
  ["U2", 34.15, 45.4, "end"],
  ["U3", -27.8, 50.7, "start"],
  ["U4", -51, 40.4, "middle"],
  ["D1", -41.6, 51.3, "start"],
  ["D2", -5, 50.2, "middle"],
  ["D3", 17.3, 50.2, "middle"],
  ["PROG", -0.6, 53.7, "middle"],
  ["USB", 25, 47.75, "middle"],
  // The test pads, each named under it.
  ["3V3", 3, 48.5, "middle"],
  ["VSUP", 6, 48.5, "middle"],
  ["GND", 9, 48.5, "middle"],
]

const chin = (): Art =>
  join(
    // The wordmark over the supply.
    centredAt(logo(0, 0, 33), -28, 47.2),
    // JLC replaces this with the order number.
    roundRect(11.3, 45.0, 13.4, 1.3, 0.5, 0.15),
    text(18, 45.95, 0.8, "JLCJLCJLCJLC", { anchor: "middle" }),
    ...PIN1_DOTS.map(([x, y]) => dot(x, y, 0.46)),
    ...CATHODE_BARS.map(([x0, y0, x1, y1]) => bar(x0, y0, x1, y1)),
    ...LED_CATHODES.map((l) => line(l)),
    ...LABELS.map(([str, x, y, anchor]) => text(x, y, 0.8, str, { anchor })),
  )

/** The face's marks, in its own coordinates: what the texture is cut round. */
export const partsMarks = (yoke: Yoke): Art => join(chin(), ...WAYS.map((n) => way(yoke, n)))

// The texture behind the marks (#88): contours of the field round the twelve ways' currents,
// which is what the board reads. scripts/field.ts draws it, cut clear of the pads and the marks.
const field = (): Art =>
  art(
    (fieldJson.lines as number[][]).map((l) => ({
      pts: Array.from({ length: l.length / 2 }, (_, i) => P(l[2 * i], l[2 * i + 1])),
      w: fieldJson.w,
    })),
  )

/** The parts face's silk, in the board's coordinates. */
export const partsFace = (yoke: Yoke): Art => mapArt(join(field(), partsMarks(yoke)), (p) => P(-p.x, p.y))
