/// <reference types="node" />
// Finishes the plated drill file in an exported Gerber directory, in place: tscircuit writes a
// slot's start and its G85 end on two lines, where Excellon has them on one, and a reader that
// takes the first line alone drills a round hole there. Then checks the file against the built
// circuit.json. Exits 1 on a failure.
//
// Usage: bun scripts/drill.ts [circuit.json] [gerber dir]

import { readFileSync, writeFileSync } from "node:fs"

const [file = "dist/index/circuit.json", gerbers = "fab/blade-reader"] = process.argv.slice(2)
const path = `${gerbers}/drill-L1-L2.drl`
const TOLERANCE = 0.005

const joined: string[] = []
for (const line of readFileSync(path, "utf8").split("\n")) {
  if (line.startsWith("G85") && /^X[-\d.]+Y[-\d.]+$/.test(joined.at(-1) ?? "")) joined[joined.length - 1] += line
  else joined.push(line)
}
writeFileSync(path, joined.join("\n"))

const circuit: any[] = JSON.parse(readFileSync(file, "utf8"))
const of = (type: string) => circuit.filter((e) => e.type === type)
const fails: string[] = []
const at = (x: number, y: number) => `(${x.toFixed(2)}, ${y.toFixed(2)})`

const tools: Record<string, number> = {}
const hits: Record<string, number> = {}
const slots: { size: number; ends: [number, number][] }[] = []
let tool = ""
for (const line of joined) {
  const def = line.match(/^(T\d+)C([\d.]+)$/)
  const slot = line.match(/^X(-?[\d.]+)Y(-?[\d.]+)G85X(-?[\d.]+)Y(-?[\d.]+)$/)
  if (def) tools[def[1]] = Number(def[2])
  else if (/^T\d+$/.test(line)) tool = line
  else if (slot) slots.push({ size: tools[tool], ends: [[+slot[1], +slot[2]], [+slot[3], +slot[4]]] })
  else if (/^X-?[\d.]+Y-?[\d.]+$/.test(line)) hits[tools[tool].toFixed(3)] = (hits[tools[tool].toFixed(3)] ?? 0) + 1
  else if (line.includes("G85")) fails.push(`${path}: unread slot line ${line}`)
}

// Every round plated hole and via is one hit of its own size.
const round: Record<string, number> = {}
for (const h of [...of("pcb_via"), ...of("pcb_plated_hole").filter((h) => h.shape === "circle")]) {
  round[h.hole_diameter.toFixed(3)] = (round[h.hole_diameter.toFixed(3)] ?? 0) + 1
}
for (const size of new Set([...Object.keys(round), ...Object.keys(hits)])) {
  if (round[size] !== hits[size]) fails.push(`${path} has ${hits[size] ?? 0} holes of ${size}; the board has ${round[size] ?? 0}`)
}

// Every other plated hole is a slot: its width the tool's, its ends the centres of its round ends.
const pills = of("pcb_plated_hole").filter((h) => h.shape !== "circle")
for (const h of pills) {
  if (h.shape !== "pill" || (h.ccw_rotation ?? 0) % 90 !== 0) {
    fails.push(`unhandled plated hole at ${at(h.x, h.y)}: ${h.shape}, turned ${h.ccw_rotation}`)
    continue
  }
  const turned = (h.ccw_rotation ?? 0) % 180 !== 0
  const [w, l] = turned ? [h.hole_height, h.hole_width] : [h.hole_width, h.hole_height]
  const half = Math.abs(l - w) / 2
  const want: [number, number][] = l > w ? [[h.x, h.y + half], [h.x, h.y - half]] : [[h.x + half, h.y], [h.x - half, h.y]]
  const near = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < TOLERANCE
  const found = slots.some(
    (s) =>
      Math.abs(s.size - Math.min(w, l)) < TOLERANCE &&
      ((near(s.ends[0], want[0]) && near(s.ends[1], want[1])) || (near(s.ends[0], want[1]) && near(s.ends[1], want[0]))),
  )
  if (!found) fails.push(`${path} has no ${w} × ${l} slot at ${at(h.x, h.y)}`)
}
if (slots.length !== pills.length) fails.push(`${path} has ${slots.length} slots; the board has ${pills.length}`)

const total = Object.values(hits).reduce((a, b) => a + b, 0)
console.log(`drill: ${total} plated holes in ${Object.keys(hits).length} sizes, ${slots.length} slots, each on one line`)
if (fails.length) {
  console.error(fails.join("\n"))
  process.exit(1)
}
