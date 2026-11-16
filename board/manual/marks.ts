// Flat marks drawn over the 3/4 views and the flat diagrams, in projected mm: arrows,
// dimension lines, labels and the SVG wrapper.

import type { P2 } from "./geometry"
import { fmt } from "./render"

export const pathOf = (pts: P2[], close = true) => `M${pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}${close ? "Z" : ""}`

/** A motion arrow from p to q: orange, outlined in the drawing's line. */
export function arrow(p: P2, q: P2, w = 3) {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1])
  const [ux, uy] = [(q[0] - p[0]) / l, (q[1] - p[1]) / l]
  const [nx, ny] = [-uy, ux]
  const neck: P2 = [q[0] - ux * w * 2.6, q[1] - uy * w * 2.6]
  const at = (b: P2, k: number): P2 => [b[0] + nx * k, b[1] + ny * k]
  return `<path class="arrow ln" d="${pathOf([at(p, w / 2), at(neck, w / 2), at(neck, w * 1.4), q, at(neck, -w * 1.4), at(neck, -w / 2), at(p, -w / 2)])}"/>`
}

/** A dimension line from p to q with arrowheads, its label at `t`. */
export function dim(p: P2, q: P2, label: string, t: P2, anchor = "start") {
  const l = Math.hypot(q[0] - p[0], q[1] - p[1])
  const [ux, uy] = [(q[0] - p[0]) / l, (q[1] - p[1]) / l]
  const h = Math.min(1.6, l / 3)
  const head = (o: P2, s: number) =>
    `M${fmt(o[0] + s * (ux * h - uy * h * 0.55))} ${fmt(o[1] + s * (uy * h + ux * h * 0.55))}L${fmt(o[0])} ${fmt(o[1])}L${fmt(o[0] + s * (ux * h + uy * h * 0.55))} ${fmt(o[1] + s * (uy * h - ux * h * 0.55))}`
  return `<g class="dim"><path class="ln thin" d="M${fmt(p[0])} ${fmt(p[1])}L${fmt(q[0])} ${fmt(q[1])}${head(p, 1)}${head(q, -1)}"/>${label ? text(t, label, anchor) : ""}</g>`
}

export const text = ([x, y]: P2, s: string, anchor = "start", cls = "") =>
  `<text${cls ? ` class="${cls}"` : ""} x="${fmt(x)}" y="${fmt(y)}" text-anchor="${anchor}">${s}</text>`

/** A leader from a point to a label; the label is sized to the drawing it sits in. */
export const leader = (p: P2, t: P2, s: string, anchor = "start") =>
  `<path class="ln thin" d="M${fmt(p[0])} ${fmt(p[1])}L${fmt(t[0])} ${fmt(t[1])}"/><circle class="dot" cx="${fmt(p[0])}" cy="${fmt(p[1])}" r="0.9"/>${text([t[0] + (anchor === "end" ? -1.5 : 1.5), t[1] + 1.5], s, anchor, "label")}`

/**
 * The SVG for a drawing. `--label` sets its labels to a 26th of its width, so they read the
 * same at any crop; `cropped` clips what lies past the box.
 */
export const svg = (box: number[], body: string, label: string, cropped = false, perWidth = 26) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.map(fmt).join(" ")}" role="img" aria-label="${label}"${cropped ? ` class="crop"` : ""} style="--label:${fmt(box[2] / perWidth)}px">${body}</svg>`
