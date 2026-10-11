// PROTOTYPE, throwaway (#86): three takes on the parts face. View coordinates, in mm: x = −X and
// y = Y of the PCB's, so the chin is down and the odd arm is on the right.

import { type Art, art, bar, chevron, dot, join, line, logo, mapArt, roundRect, text, turn, unicorn } from "../lib/silkscreen"

type Pt = { x: number; y: number }
const P = (x: number, y: number): Pt => ({ x, y })
const bbox = (a: Art) => {
  const pts = [...a.strokes.flatMap((s) => s.pts), ...a.fills.flat(2)]
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
}
const centredAt = (a: Art, x: number, y: number) => {
  const b = bbox(a)
  return mapArt(a, (p) => P(p.x - (b.x0 + b.x1) / 2 + x, p.y - (b.y0 + b.y1) / 2 + y))
}
/** Text read upwards, centred on (x, y). */
const upText = (x: number, y: number, s: number, str: string) => centredAt(mapArt(text(0, 0, s, str), turn(0, 0, -90)), x, y)

// ── Ways ───────────────────────────────────────────────────────────────────────────────────

const WAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const side = (n: number) => (n % 2 ? 1 : -1)
const wayY = (n: number) => 15.6 - 13.36 * Math.floor((12 - n) / 2)
/** A chevron 0.75 size with its point outboard, at `d` from the centreline. */
const outChevron = (n: number, d: number, solid: boolean) =>
  mapArt(chevron(0, 0, solid), (p) => P(side(n) * (d - p.y * 0.75), wayY(n) + p.x * 0.75))
const number = (n: number, d: number, em: number, w: number) => centredAt(text(0, 0, em, String(n), { w }), side(n) * d, wayY(n))

// Marks every variant keeps: each sensor's pin 1 and each way diode's cathode.
const wayMarks = (n: number) => {
  const s = side(n)
  const y = wayY(n)
  return join(
    // Pin 1 is at the sensor's −X end on both arms: outboard on the odd arm, towards the panel on the even.
    s > 0 ? dot(48.63, y + 4.08, 0.46) : dot(-43.16, y + 4.08, 0.46),
    bar(s * 48.8, y + 5.75, s * 48.8, y + 7.61),
  )
}

// ── Chin ───────────────────────────────────────────────────────────────────────────────────

const wordmark = (w: number, cx: number, cy: number) => centredAt(logo(0, 0, w), cx, cy)
const jlc = (x: number, y: number) =>
  // JLC replaces this with the order number.
  join(roundRect(x, y, 13.4, 1.3, 0.5, 0.15), text(x + 6.7, y + 0.95, 0.8, "JLCJLCJLCJLC", { anchor: "middle" }))

const chinPolarity = join(
  dot(35.48, 42.63, 0.46), // U2
  dot(-55.55, 31.36, 0.46), // U4
  dot(-28.95, 51.45, 0.46), // U3
  dot(57.7, 37.15, 0.46), // U1, under the module
  dot(9.85, 56.4, 0.46), // J1, beside pin 1
  bar(-36.25, 52.0, -36.25, 54.76), // D1
  bar(-6.45, 55.2, -6.45, 57.05), // D2
  bar(18.75, 55.2, 18.75, 57.05), // D3
  line([[39.7, 57.13], [40.5, 57.13]]), // LED1's cathode
  line([[35.9, 57.13], [36.6, 57.13]]), // LED2's cathode
)
const chinDesignators = join(
  text(56.9, 38.3, 0.8, "U1", { anchor: "end" }),
  text(34.15, 45.4, 0.8, "U2", { anchor: "end" }),
  text(-27.8, 50.7, 0.8, "U3"),
  text(-51, 40.4, 0.8, "U4", { anchor: "middle" }),
  text(-41.6, 51.3, 0.8, "D1"),
  text(-5, 50.2, 0.8, "D2", { anchor: "middle" }),
  text(17.3, 50.2, 0.8, "D3", { anchor: "middle" }),
)
const testPads = join(...["3V3", "VSUP", "GND"].map((t, i) => text(3 + 3 * i, 48.5, 0.8, t, { anchor: "middle" })))
const expansion = join(...["IO2", "IO0", "GND", "3V3"].map((t, i) => text(33.19 + 2.54 * i, 54.97, 0.8, t, { anchor: "middle" })))

const A = join(
  ...WAYS.flatMap((n) => [
    wayMarks(n),
    number(n, 43.45, 1.9, 0.25),
    outChevron(n, 46.2, n === 1),
    outChevron(n, 47.4, n === 1),
  ]),
  wordmark(33, -28, 47.2),
  unicorn(-10.7, 50.2, 0.36),
  jlc(11.3, 45.0),
  chinPolarity,
  chinDesignators,
  testPads,
  expansion,
  text(-0.6, 53.7, 0.8, "PROG", { anchor: "middle" }),
  text(25, 47.75, 0.8, "USB", { anchor: "middle" }),
)

const B = join(
  ...WAYS.flatMap((n) => [
    wayMarks(n),
    number(n, 44.8, 3.0, 0.3),
    upText(side(n) * 57.2, wayY(n) + 6.68, 0.8, `D1${n}`),
  ]),
  wordmark(24, -32, 45.6),
  text(-44, 48.3, 0.8, "XDGFX/BLADE-READER"),
  text(-44, 49.8, 0.8, "REV B 2026-10  CERN-OHL-S-2.0"),
  jlc(11.3, 45.0),
  chinPolarity,
  chinDesignators,
  testPads,
  expansion,
  // J1's names, as the ESP-PROG's header has them, in the pads' order.
  ...["IO0", "GND", "VDD"].map((t, i) => upText(-2.6 + 1.5 * i, 51.1, 0.8, t)),
  ...["RXD", "TXD", "EN"].map((t, i) => upText(-2.6 + 1.5 * i, 55.45, 0.8, t)),
  text(25, 47.75, 0.8, "USB 5 V", { anchor: "middle" }),
  text(-50, 54.65, 0.8, "F1 1 A"),
)

const C = join(
  ...WAYS.flatMap((n) => [wayMarks(n), number(n, 43.2, 1.4, 0.2)]),
  wordmark(33, -28, 47.2),
  jlc(11.3, 45.6),
  chinPolarity,
)

export const VARIANTS: Record<string, { name: string; notes: string; art: Art }> = {
  a: {
    name: "A · Echo",
    notes: "The ring face's look: each way's number and two chevrons between its finger and its nut, way 1's filled. Wordmark over the supply, unicorn, JLC marker. Designators on the chin's ICs and diodes only. One word each for J1, USB, the test pads and J3.",
    art: A,
  },
  b: {
    name: "B · Service",
    notes: "Labelled to be worked on: big way numbers, every way diode named, J1's six pins named, ratings on USB, the fuse and the 3V3 rail, and the source, revision, date and licence under a smaller wordmark.",
    art: B,
  },
  c: {
    name: "C · Quiet",
    notes: "Only what assembly and inspection need: pin-1 dots, cathode bars, the JLC marker, small way numbers and the wordmark. No designators, no captions.",
    art: C,
  },
}
