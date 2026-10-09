// PROTOTYPE (issue #28): fills parts-template.html with the extracted geometry and the banner
// wordmark. Run extract-parts.mjs first:
//   bun extract-parts.mjs ../dist/index/circuit.json geom-parts.json && bun build-parts.mjs
import fs from "fs"
const r = f => fs.readFileSync(f, "utf8")
let out = r("parts-template.html").replace("/*GEOM*/null", r("geom-parts.json")).replace("/*LOGO*/null", r("logo.json"))
new Function(out.slice(out.indexOf("<script>") + 8, out.lastIndexOf("</script>")))
fs.writeFileSync("parts-face-concepts.html", '<meta charset="utf-8">\n' + out)
