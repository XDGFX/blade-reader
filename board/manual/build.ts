// Builds the manual into manual/dist/: manual/index.html with every {{art:name}} replaced by its
// drawing and every {{s:NAME_MS}} (or {{s:A_MS+B_MS}}) by that firmware time in seconds, and
// manual/style.css. Run in board/: bun run manual

import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { drawings } from "./drawings"
import { firmwareSeconds } from "./firmware"

const src = fileURLToPath(new URL("../../manual", import.meta.url))
const out = join(src, "dist")
const used = new Set<string>()
const html = readFileSync(join(src, "index.html"), "utf8")
  .replace(/\{\{art:(\w+)\}\}/g, (_, name: string) => {
    if (!(name in drawings)) throw new Error(`manual/index.html asks for a drawing that doesn't exist: ${name}`)
    used.add(name)
    return drawings[name]
  })
  .replace(/\{\{s:([\w+]+)\}\}/g, (_, names: string) => String(names.split("+").reduce((t, n) => t + firmwareSeconds(n), 0)))
if (html.includes("{{")) throw new Error("manual/index.html has a placeholder the build doesn't know")
const unused = Object.keys(drawings).filter((k) => !used.has(k))
if (unused.length) throw new Error(`drawings the manual doesn't use: ${unused.join(", ")}`)
mkdirSync(out, { recursive: true })
writeFileSync(join(out, "index.html"), html)
cpSync(join(src, "style.css"), join(out, "style.css"))
console.log(`manual/dist: ${used.size} drawings, ${(html.length / 1024).toFixed(0)} KB`)
