// PROTOTYPE, throwaway. Draws the gap between two nuts to scale, seen from the parts face.
// Run: bun docs/research/yoke-arm-depth/gap.ts > docs/research/yoke-arm-depth/gap.svg
// Y 0 is the panel edge, Y grows outboard; x is measured from the left way's centre.

const S = 16 // px per mm
const PITCH = 13.36
const W_MM = 46
const Y_MAX = 22
const Y_MIN = -6
const TOP = 60

const out: string[] = []
const px = (mm: number) => (mm * S).toFixed(1)

function panel(i: number, title: string, sub: string, depth: number, nutY: number, draw: (d: Draw) => void) {
  const ox = (i * W_MM + 8) * S
  const X = (x: number) => (ox + x * S).toFixed(1)
  const Y = (y: number) => (TOP + (Y_MAX - y) * S).toFixed(1)
  const rect = (x0: number, x1: number, y0: number, y1: number, cls: string, label?: string) => {
    out.push(`<rect x="${X(x0)}" y="${Y(y1)}" width="${px(x1 - x0)}" height="${px(y1 - y0)}" class="${cls}"/>`)
    if (label) text((x0 + x1) / 2, (y0 + y1) / 2 - 0.3, label, "l mid")
  }
  const text = (x: number, y: number, s: string, cls: string) =>
    out.push(`<text x="${X(x)}" y="${Y(y)}" class="${cls}">${s}</text>`)
  const circle = (x: number, y: number, d: number, cls: string) =>
    out.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${px(d / 2)}" class="${cls}"/>`)

  text(-6, Y_MAX + 2.4, title, "h")
  text(-6, Y_MAX + 1.1, sub, "s")
  rect(-6.68, 2 * PITCH + 6.68, 0, depth, "board")
  for (const k of [0, 1, 2]) {
    rect(k * PITCH - 4.75, k * PITCH + 4.75, Y_MIN, 0, "board")
    rect(k * PITCH - 4.75, k * PITCH + 4.75, -3, -0.3, "root")
    circle(k * PITCH, nutY, 9.78, "court")
    circle(k * PITCH, nutY, 9.3, "pad")
    circle(k * PITCH, nutY, 6.4, "hole")
  }
  out.push(`<line x1="${X(-8)}" x2="${X(2 * PITCH + 8)}" y1="${Y(0)}" y2="${Y(0)}" class="edge"/>`)
  text(2 * PITCH + 7.2, 0.3, "panel edge", "l")
  text(2 * PITCH + 7.2, depth - 0.4, `${depth.toFixed(1)} arm`, "l")
  draw({ rect, text })
}

type Draw = {
  rect: (x0: number, x1: number, y0: number, y1: number, cls: string, label?: string) => void
  text: (x: number, y: number, s: string, cls: string) => void
}

const G = PITCH / 2 // the gap's centre line

panel(0, "The strip as marked", "nut row at 14.0, 20.0 arm", 20, 14, ({ rect, text }) => {
  rect(G - 2.1, G + 2.1, 0.8, 18.4, "green")
  // The sensor's courtyard at its narrowest, 5.54 across, laid in the strip beside the nuts.
  rect(G - 2.77, G + 2.77, 10.25, 17.75, "bad", "CC6905")
  text(G, 19.0, "4.06 between pads, 3.58 between courtyards", "l mid")
  text(G, 9.2, "sensor: 5.54 at its narrowest", "l mid red")
})

panel(1, "Sensor in the gap, inboard of the nuts", "nut row at 10.7, 16.7 arm", 16.7, 10.68, ({ rect, text }) => {
  for (const k of [0, 1]) {
    const g = G + k * PITCH
    rect(g - 3.75, g + 3.75, 1.23, 6.77, "part", "CC6905")
    rect(g - 1.55, g + 1.55, 6.85, 13.75, "part", "D")
    // Divider under the sensor's own finger root, caps under the next one's. Stacking the caps
    // below the next way's nut instead would leave that way's line and load copper 3.6 wide.
    rect(g - G + 2.7, g - G + 3.64, -2.3, -0.44, "part")
    rect(g - G + 3.7, g - G + 4.64, -2.3, -0.44, "part")
    for (const c of [0, 1, 2]) rect(g + G - 4.64 + c, g + G - 3.7 + c, -2.3, -0.44, "part")
  }
  out.push("") // keep the trunk above the parts
  text(G + PITCH, 15.9, "VSUP trunk behind the nuts", "l mid")
})

const W = 2 * W_MM * S
const H = TOP + (Y_MAX - Y_MIN) * S + 40
console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">
<style>
.board{fill:#1f3d2b}.root{fill:#3aa0ff;fill-opacity:.35}
.pad{fill:#c9a227}.hole{fill:#fff}.court{fill:none;stroke:#c9a227;stroke-width:.8;stroke-dasharray:3 3}
.part{fill:#e8e8e8;fill-opacity:.92;stroke:#333;stroke-width:.6}
.green{fill:#6ff547;fill-opacity:.75}
.bad{fill:#c0392b;fill-opacity:.35;stroke:#c0392b;stroke-width:1.2}
.edge{stroke:#000;stroke-width:1.5}
.h{font-size:17px;font-weight:bold}.s{font-size:12.5px;fill:#333}
.l{font-size:11.5px;fill:#000}.mid{text-anchor:middle}.red{fill:#c0392b;font-weight:bold}
.board ~ text.l.mid{fill:#fff}
</style>
<rect width="${W}" height="${H}" fill="#fff"/>
${out.join("\n")}
<text x="14" y="${H - 14}" class="s">Three ways at ${S} px per mm, parts face. Gold: the nut's soldered pad (9.3) round its 6.4 hole; dashes: its courtyard. Blue: finger root, 1.7 over the pocket's lip.</text>
</svg>`)
