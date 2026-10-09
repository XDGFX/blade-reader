import opentype from "opentype.js"
import fs from "fs"
const [fontPath, out] = process.argv.slice(2)
const f = opentype.parse(fs.readFileSync(fontPath).buffer)
// One em = 1 unit, origin at the glyph's em-box top-left, so stacking at 1-unit pitch works.
const res = {}
for (const ch of "ブレードリーダー") {
  if (res[ch]) continue
  const g = f.charToGlyph(ch)
  const p = g.getPath(0, 0.88, 1)
  res[ch] = { d: p.toPathData(4), adv: g.advanceWidth / f.unitsPerEm }
}
// The long-vowel mark is horizontal in horizontal text; vertical text uses it rotated 90°.
fs.writeFileSync(out, JSON.stringify(res))
console.log(Object.keys(res).join(""), Object.values(res).map(v => v.d.length))
