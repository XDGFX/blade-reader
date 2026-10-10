// PROTOTYPE, throwaway. Draws one way's column to scale for three arm depths.
// Run: bun docs/research/yoke-arm-depth/draw.ts > docs/research/yoke-arm-depth/columns.svg
// Strip coordinates as board/lib/outline.tsx: Y 0 is the panel edge, Y grows outboard,
// x is measured from the way's centre. Figures are rev A's ways 1-3 column.

const S = 14 // px per mm
const PITCH = 13.36
const PANEL_W = 27 // mm of drawing per variant
const Y_MAX = 28
const Y_MIN = -14.5
const TOP = 70

type Variant = {
  title: string
  sub: string
  depth: number
  nutY: number
  band?: [number, number, string]
  trunkY?: number
  notes: string[]
  /** Courtyards as [x0, x1, y0, y1, label]; rev A's column when left out. */
  parts?: Part[]
  /** The dimensioned stack between the panel edge and the nut pad. */
  stack?: [number, number, string]
  /** Shade the finger's root, where the parts face is clear of the pocket's lip. */
  root?: boolean
  /** The lanes run on inner layers, so the ring face has no channel. */
  noChannel?: boolean
}

type Part = [number, number, number, number, string?]

const REV_A: Part[] = [
  [-2.25, 5.25, 1.23, 6.77, "CC6905"],
  [-5.4, -2.3, 1.35, 8.25, "D"],
  [-6.67, -5.73, 1.27, 3.13],
  [-6.67, -5.73, 3.17, 5.03],
  [2.63, 3.57, 6.77, 8.63],
  [3.63, 4.57, 6.77, 8.63],
  [4.63, 5.57, 6.77, 8.63],
]

// The caps and the divider move under the finger's root and the diode moves 1.2 towards -X,
// so the nut's round courtyard (r 4.89) comes down onto the sensor's.
const RE_PLACED: Part[] = [
  [-2.25, 5.25, 1.23, 6.77, "CC6905"],
  [-6.6, -3.5, 1.35, 8.25, "D"],
  [-4.6, -3.66, -2.3, -0.44],
  [-3.6, -2.66, -2.3, -0.44],
  [1.7, 2.64, -2.3, -0.44],
  [2.7, 3.64, -2.3, -0.44],
  [3.7, 4.64, -2.3, -0.44],
]

// A sensor no taller than about 1.5 sits under the finger's root; the diode stands between two
// nuts. Sketch only: no such part is chosen.
const ON_FINGER: Part[] = [
  [-1.9, 1.9, -3.1, -0.2, "sensor"],
  [-8.23, -5.13, 1.3, 8.2, "D"],
  [2.6, 3.54, -2.3, -0.44],
  [3.6, 4.54, -2.3, -0.44],
  [-4.5, -3.56, -2.3, -0.44],
  [-3.5, -2.56, -2.3, -0.44],
]

const variants: Variant[] = [
  {
    title: "Fallback: rev A arm",
    sub: "25.5 deep, yoke 135.2 wide",
    depth: 25.5,
    nutY: 14,
    band: [18.65, 25.5, "band behind the nuts: supply, J1, test pads"],
    trunkY: 19.1,
    notes: ["Column and routing as built.", "Band is empty on a chin-heavy yoke."],
  },
  {
    title: "Chin-heavy: band cut",
    sub: "20.0 deep, yoke 124.2 wide",
    depth: 20,
    nutY: 14,
    trunkY: 19.1,
    notes: ["Column unchanged. VSUP trunk stays", "behind the nuts; 0.75 to the edge."],
  },
  {
    title: "Floor: nut in, trunk moved",
    sub: "18.5 deep, yoke 121.2 wide",
    depth: 18.5,
    nutY: 13.5,
    notes: ["Nut pad 0.35 from the edge. VSUP takes", "the channel's last lane. Not advised."],
  },
  {
    title: "Re-placed: finger root used",
    sub: "17.7 deep, yoke 119.6 wide",
    depth: 17.7,
    nutY: 11.66,
    trunkY: 16.76,
    parts: RE_PLACED,
    stack: [1.23, 6.77, "5.5 sensor"],
    root: true,
    notes: ["Same parts, two layers. Caps and divider", "under the finger root; diode moved 1.2."],
  },
  {
    title: "Sketch: sensor on the finger",
    sub: "about 11.4 deep, yoke 107 wide",
    depth: 11.4,
    nutY: 6,
    parts: ON_FINGER,
    root: true,
    noChannel: true,
    notes: ["Needs a sensor under 1.5 tall and the", "lanes on inner layers. Nothing chosen."],
  },
]

const out: string[] = []
const px = (mm: number) => (mm * S).toFixed(1)

function column(v: Variant, i: number) {
  const ox = (i * PANEL_W + 9.5) * S // way centre in px
  const X = (x: number) => (ox + x * S).toFixed(1)
  const Y = (y: number) => (TOP + (Y_MAX - y) * S).toFixed(1)
  const rect = (x0: number, x1: number, y0: number, y1: number, attrs: string) =>
    out.push(`<rect x="${X(x0)}" y="${Y(y1)}" width="${px(x1 - x0)}" height="${px(y1 - y0)}" ${attrs}/>`)
  const circle = (x: number, y: number, d: number, attrs: string) =>
    out.push(`<circle cx="${X(x)}" cy="${Y(y)}" r="${px(d / 2)}" ${attrs}/>`)
  const text = (x: number, y: number, s: string, attrs = "") =>
    out.push(`<text x="${X(x)}" y="${Y(y)}" ${attrs}>${s}</text>`)
  const hline = (x0: number, x1: number, y: number, attrs: string) =>
    out.push(`<line x1="${X(x0)}" x2="${X(x1)}" y1="${Y(y)}" y2="${Y(y)}" ${attrs}/>`)
  const vline = (x: number, y0: number, y1: number, attrs: string) =>
    out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${Y(y0)}" y2="${Y(y1)}" ${attrs}/>`)

  const half = PITCH / 2
  text(-half, Y_MAX + 3.4, v.title, `class="h"`)
  text(-half, Y_MAX + 1.9, v.sub, `class="s"`)

  // Board: body, then the finger.
  rect(-half, half, 0, v.depth, `class="board"`)
  rect(-4.75, 4.75, -13, 0, `class="board"`)
  // Rev A's outboard edge, for comparison.
  if (v.depth < 25.5) {
    rect(-half, half, v.depth, 25.5, `class="gone"`)
    text(0, (v.depth + 25.5) / 2 - 0.35, `${(25.5 - v.depth).toFixed(1)} saved`, `class="l mid red"`)
  }
  // Ring-face bands.
  rect(-half, half, 0.3, 1.0, `class="gnd"`)
  if (!v.noChannel) rect(-half, half, 1.0, 6.3, `class="chan"`)
  if (v.root) rect(-4.75, 4.75, -3.0, -0.3, `class="root"`)
  if (v.band) rect(-half, half, v.band[0], v.band[1], `class="band"`)

  // Ring keepout: 10 disc on the nut and a 10 tongue straight out.
  out.push(
    `<path d="M ${X(-5)} ${Y(Y_MAX - 0.3)} L ${X(-5)} ${Y(v.nutY)} A ${px(5)} ${px(5)} 0 0 0 ${X(5)} ${Y(v.nutY)} L ${X(5)} ${Y(Y_MAX - 0.3)}" class="keep"/>`,
  )

  // Way screw.
  circle(0, -8.52, 8.13, `class="pad"`)
  circle(0, -8.52, 5.4, `class="hole"`)
  // Per-way parts, courtyards.
  for (const [x0, x1, y0, y1, label] of v.parts ?? REV_A) {
    rect(x0, x1, y0, y1, `class="part"`)
    if (label) text((x0 + x1) / 2, (y0 + y1) / 2 - 0.35, label, `class="l mid"`)
  }
  // Nut.
  circle(0, v.nutY, 9.3, `class="pad"`)
  circle(0, v.nutY, 6.4, `class="hole"`)
  text(0, v.nutY - 0.35, "M4 nut", `class="l mid"`)
  if (v.trunkY) hline(-half, half, v.trunkY, `class="trunk"`)

  // Column boundaries and the panel edge.
  vline(-half, Y_MIN + 1, Y_MAX - 0.3, `class="pitch"`)
  vline(half, Y_MIN + 1, Y_MAX - 0.3, `class="pitch"`)
  hline(-half - 1.5, half + 9, 0, `class="edge"`)
  text(half + 1.2, -1.2, "panel edge", `class="l"`)

  // Dimensions down the right.
  const dx = half + 1.2
  const dim = (y0: number, y1: number, label: string, col = 0) => {
    const x = dx + col * 4.6
    vline(x, y0, y1, `class="dim"`)
    hline(x - 0.4, x + 0.4, y0, `class="dim"`)
    hline(x - 0.4, x + 0.4, y1, `class="dim"`)
    text(x + 0.6, (y0 + y1) / 2 - 0.35, label, `class="l"`)
  }
  dim(0, v.depth, `${v.depth.toFixed(1)} arm`, 1)
  if (!v.parts) dim(1.5, 9, "7.5 sensor")
  else if (v.stack) dim(...v.stack)
  if (v.root) text(half + 1.2, -3.0, "root: 1.7 over the lip", `class="l"`)
  dim(v.nutY - 4.65, v.nutY + 4.65, "9.3 nut pad")
  if (v.depth - (v.nutY + 4.65) > 0.2)
    dim(v.nutY + 4.65, v.depth, (v.depth - v.nutY - 4.65).toFixed(2))
  if (!v.noChannel) text(-half, 2.3, "channel", `class="l tiny"`)
  if (v.band) text(-half + 0.3, 23.6, "band behind the nuts", `class="l tiny"`)
  if (v.trunkY) text(-half - 0.3, v.trunkY - 0.3, "VSUP", `class="l tiny end"`)
  v.notes.forEach((n, k) => text(-half, Y_MIN - 0.6 - k * 1.3, n, `class="s"`))
}

variants.forEach(column)

const W = variants.length * PANEL_W * S + 20
const H = TOP + (Y_MAX - Y_MIN) * S + 85
console.log(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica, Arial, sans-serif">
<style>
.board{fill:#1f3d2b;stroke:#0d1f15;stroke-width:1}
.gone{fill:none;stroke:#c0392b;stroke-width:1;stroke-dasharray:5 4}
.gnd{fill:#6b7f73}.chan{fill:#3f6b52}.band{fill:#7a5c1e}
.root{fill:#3aa0ff;fill-opacity:.35}
.pad{fill:#c9a227}.hole{fill:#fff}
.part{fill:#e8e8e8;fill-opacity:.9;stroke:#333;stroke-width:.6}
.keep{fill:none;stroke:#3aa0ff;stroke-width:1.2;stroke-dasharray:4 3}
.trunk{stroke:#ff7043;stroke-width:${(0.3 * S).toFixed(1)}}
.pitch{stroke:#999;stroke-width:.7;stroke-dasharray:2 4}
.edge{stroke:#000;stroke-width:1.5}
.dim{stroke:#000;stroke-width:.9}
.h{font-size:17px;font-weight:bold}.s{font-size:12.5px;fill:#333}
.l{font-size:11.5px;fill:#000}.tiny{font-size:10px;fill:#fff}
.mid{text-anchor:middle}.end{text-anchor:end;fill:#000}.red{fill:#c0392b;font-weight:bold}
</style>
<rect width="${W}" height="${H}" fill="#fff"/>
${out.join("\n")}
<text x="14" y="${H - 14}" class="s">One way's column at ${S} px per mm, seen from the parts face, panel below. Blue dashes: ring keepout on the ring face. Orange: VSUP trunk. Red dashes: rev A's outboard edge.</text>
</svg>`)
