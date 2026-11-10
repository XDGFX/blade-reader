// SPDX-License-Identifier: AGPL-3.0-or-later
// The page's model, fed /events messages as a yoke sends them. Run: node --test firmware/web
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import vm from "node:vm"

// page.js is a plain script for the yoke; with no document it only defines its functions.
const context = vm.createContext({})
vm.runInContext(readFileSync(new URL("page.js", import.meta.url), "utf8"), context)
const { newStore, receive, readYoke, WAYS, INSTALL_S } = vm.runInContext("({ newStore, receive, readYoke, WAYS, INSTALL_S })", context)

// A yoke's state messages carry the entity as "domain/Name" in id, with no name field. The model
// goes back through JSON because objects from the page's context have that context's prototypes.
const yoke = (states, now = 0) => {
  const store = newStore()
  for (const [id, value] of Object.entries(states)) receive(store, { id, value, state: String(value) }, 0)
  return JSON.parse(JSON.stringify(readYoke(store, now)))
}
const way = (n, { live = false, blown = false, current = 0 } = {}) => ({
  [`binary_sensor/Way ${n}: Live`]: live,
  [`binary_sensor/Way ${n}: Blown Fuse`]: blown,
  [`sensor/Way ${n}: Current`]: current,
})
const allWays = (opts = {}) => Object.assign({}, ...Array.from({ length: WAYS }, (_, i) => way(i + 1, opts)))
const board = (fault = "OK", notZeroed = "None") => ({ "text_sensor/Fault Text": fault, "text_sensor/Not Zeroed": notZeroed })

test("a way's state comes from its Live and Blown Fuse entities", () => {
  const y = yoke({ ...board(), ...allWays(), ...way(3, { live: true, current: 12.1 }), ...way(7, { blown: true }) })
  assert.equal(y.ways[2].state, "live")
  assert.equal(y.ways[2].current, 12.1)
  assert.equal(y.ways[6].state, "blown")
  assert.equal(y.ways[0].state, "empty")
})

test("a way with none of its entities is missing, not empty", () => {
  const states = { ...board(), ...allWays() }
  for (const k of Object.keys(way(5))) delete states[k]
  const y = yoke(states)
  assert.equal(y.ways[4], null)
  assert.equal(y.ways[5].state, "empty")
})

test("over range is read from the fault text, ahead of live", () => {
  const y = yoke({ ...board("Over temperature 87 °C; Ways 3, 7 blown; Way 9 over range"), ...allWays({ live: true }) })
  assert.equal(y.ways[8].state, "range")
  assert.equal(y.ways[2].state, "live")
  assert.deepEqual(y.status, { kind: "fault", faults: ["Over temperature 87 °C", "Ways 3, 7 blown", "Way 9 over range"] })
})

test("the status is OK, No supply, or how many ways are zeroed", () => {
  assert.equal(yoke({ ...board(), ...allWays({ live: true }) }).status.kind, "ok")
  assert.equal(yoke({ ...board("No supply"), ...allWays() }).status.kind, "nosupply")
  assert.deepEqual(yoke({ ...board("OK", "3, 4, 7, 11"), ...allWays({ live: true }) }).status, { kind: "install", zeroed: WAYS - 4 })
})

test("No supply with a way fault is a fault", () => {
  const y = yoke({ ...board("No supply; Way 9 over range"), ...allWays() })
  assert.deepEqual(y.status, { kind: "fault", faults: ["No supply", "Way 9 over range"] })
})

test("install mode says which live ways to pull and which dead ones are zeroing", () => {
  const y = yoke({ ...board("OK", "3, 4, 7, 11"), ...allWays({ live: true }), ...way(4), ...way(11) })
  assert.deepEqual(y.install.pull, [3, 7])
  assert.deepEqual(y.install.zeroing, [4, 11])
  assert.equal(y.ways[2].unzeroed, true)
  assert.equal(y.ways[0].unzeroed, false)
})

test("install mode counts down to an hour of uptime, between Uptime updates too", () => {
  const states = { ...board("OK", "3"), ...allWays({ live: true }), "sensor/Uptime": 1200 }
  assert.equal(yoke(states, 0).install.endsInS, INSTALL_S - 1200)
  assert.equal(yoke(states, 30_000).install.endsInS, INSTALL_S - 1230)
  assert.equal(yoke({ ...states, "sensor/Uptime": INSTALL_S + 100 }).install.endsInS, 0)
  assert.equal(yoke({ ...board("OK", "3"), ...allWays({ live: true }) }).install.endsInS, null)
})

test("no install while every way has a zero", () => {
  assert.equal(yoke({ ...board(), ...allWays({ live: true }) }).install, null)
})
