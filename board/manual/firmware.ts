// The firmware's timings, read from its constants.h so the manual's drawings and text can't
// drift from what the board does.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const header = readFileSync(fileURLToPath(new URL("../../firmware/components/blade_reader/constants.h", import.meta.url)), "utf8")

/** A `constexpr … NAME_MS = n;` from constants.h, in seconds. */
export function firmwareSeconds(name: string): number {
  if (!name.endsWith("_MS")) throw new Error(`${name} isn't a time: only *_MS constants are read`)
  const m = header.match(new RegExp(`constexpr\\s+\\w+\\s+${name}\\s*=\\s*(\\d+)`))
  if (!m) throw new Error(`constants.h has no ${name}`)
  return Number(m[1]) / 1000
}
