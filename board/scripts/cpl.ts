/// <reference types="node" />
// Turns the parts in an exported pick-and-place file whose JLC placement package has a different
// zero orientation from the footprint the board uses, in place. A CPL angle is relative to the
// assembler's own package, so this belongs to the JLC export and not to the board. Each angle is
// worked out from the built circuit.json, so running it twice changes nothing. Exits 1 on a failure.
//
// Usage: bun scripts/cpl.ts [circuit.json] [gerber dir]

import { readFileSync, writeFileSync } from "node:fs"

const [file = "dist/index/circuit.json", gerbers = "fab/blade-reader"] = process.argv.slice(2)
const path = `${gerbers}/pick_and_place.csv`

/** Degrees to add, by LCSC part code, with the JLC package that differs. */
const JLC_TURN: Record<string, number> = {
  C20539658: 180, // LMR51610XDBVR: JLC places from SOT-23-6…-TL, the footprint is …-BR (#99)
}

const circuit: any[] = JSON.parse(readFileSync(file, "utf8"))
const fails: string[] = []

const codes = new Map<string, string>()
for (const line of readFileSync(`${gerbers}/bom.csv`, "utf8").trim().split(/\r?\n/).slice(1)) {
  const cells = line.split('","').map((c) => c.replace(/"/g, ""))
  const code = cells.at(-1) ?? ""
  for (const name of cells[0].split(",")) codes.set(name.trim(), code)
}
for (const code of Object.keys(JLC_TURN)) {
  if (![...codes.values()].includes(code)) fails.push(`${code} has a JLC turn but is not in ${gerbers}/bom.csv`)
}

const turned: string[] = []
const rows = readFileSync(path, "utf8").split("\r\n")
for (let i = 1; i < rows.length; i++) {
  const cells = rows[i].split(",")
  const turn = JLC_TURN[codes.get(cells[0]) ?? ""]
  if (turn === undefined) continue
  const source = circuit.find((e) => e.type === "source_component" && e.name === cells[0])
  const part = circuit.find((e) => e.type === "pcb_component" && e.source_component_id === source?.source_component_id)
  if (!part) {
    fails.push(`${cells[0]} is in ${path} but not in ${file}`)
    continue
  }
  const angle = (((part.rotation + turn) % 360) + 360) % 360
  cells[4] = String(angle)
  rows[i] = cells.join(",")
  turned.push(`${cells[0]} ${part.rotation} to ${angle}`)
}
writeFileSync(path, rows.join("\r\n"))

console.log(`cpl: ${turned.length} turned for JLC's packages${turned.length ? `: ${turned.join(", ")}` : ""}`)
if (fails.length) {
  console.error(fails.join("\n"))
  process.exit(1)
}
