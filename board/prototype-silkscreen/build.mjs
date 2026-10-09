// Assembles silkscreen-concepts.html from the round-1 template's shell plus v2-body and v2-concepts.
import fs from "fs"
const r = f => fs.readFileSync(f, "utf8")
const tpl = r("template.html")
const head = tpl.slice(0, tpl.indexOf('<section class="summary">')).replace("PROTOTYPE · issue #24", "PROTOTYPE · round 4 · issue #24")
const scr = tpl.slice(tpl.indexOf("<script>"), tpl.indexOf("const CONCEPTS = {"))
const tail = tpl.slice(tpl.indexOf("function render() {"))
let out = '<meta charset="utf-8">\n' + head + r("v2-body.html") + scr + r("v2-concepts.js") + tail
out = out.replace("/*GEOM*/null", r("geom.json")).replace("/*LOGO*/null", r("logo.json")).replace("/*KANA*/null", r("kana.json"))
new Function(out.slice(out.indexOf("<script>") + 8, out.lastIndexOf("</script>")))
fs.writeFileSync("silkscreen-concepts.html", out)
