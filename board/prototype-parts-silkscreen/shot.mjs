// PROTOTYPE (issue #28): screenshots each concept's board and prints its check line.
import { chromium } from "playwright"
const [file, outDir, ...clicks] = process.argv.slice(2)
const b = await chromium.launch({ executablePath: process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell" })
const p = await b.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2 })
p.on("pageerror", e => console.log("PAGEERROR", e.message))
await p.goto("file://" + file)
for (const c of clicks) { const [k, v] = c.split("="); await p.click(`.seg[data-k="${k}"] button[data-v="${v}"]`) }
for (const id of ["stock", "A", "B", "C"]) {
  await p.locator("#" + id).screenshot({ path: `${outDir}/${id}.png` })
  console.log(id, await p.locator(`#${id}-check`).innerText())
}
await b.close()
