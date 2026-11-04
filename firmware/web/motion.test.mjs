// A lint over the page's styles: an old phone must be able to leave the page open. Run: node --test firmware/web
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

// The page's styles: page.css, and the art's own, which page.js carries as a string.
const css = ["page.css", "page.js"].map((f) => readFileSync(new URL(f, import.meta.url), "utf8")).join("\n")

const keyframes = new Map()
for (const [, name, body] of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]*\{[^{}]*\})*)[^{}]*\}/g)) {
  const props = new Set([...body.matchAll(/([\w-]+)\s*:/g)].map(([, p]) => p))
  keyframes.set(name, props)
}

test("every animation the page runs is one the browser can run without repainting", () => {
  const uses = [...css.matchAll(/animation\s*:\s*([^;}!"]+)/g)].map(([, v]) => v.trim()).filter((v) => v !== "none")
  assert.ok(uses.length > 0)
  for (const use of uses) {
    const name = use.split(/\s+/).find((t) => keyframes.has(t))
    assert.ok(name, `no @keyframes for "animation:${use}"`)
    // A stepped animation repaints only at each step; a smooth one repaints every frame unless all
    // it moves is transform.
    const allowed = /steps\(/.test(use) ? ["transform", "opacity"] : ["transform"]
    for (const p of keyframes.get(name)) assert.ok(allowed.includes(p), `"animation:${use}" animates ${p}`)
  }
})
