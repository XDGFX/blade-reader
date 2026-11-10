// SPDX-License-Identifier: AGPL-3.0-or-later
// A faked yoke for trying the page without one: load it before page.js (try.html does). It stands
// in for EventSource and the button POSTs, sending state messages shaped as a yoke sends them,
// and adds a bar to switch between Normal, Install mode, Faults and No supply. Not served by the
// yoke.
"use strict";
(() => {
  const qs = new URLSearchParams(location.search);
  const fake = { scenario: qs.get("scenario") || "normal", t: 0, uptime: 1140, notZeroed: null, cleared: false, sources: [] };
  const BASE_A = [3.2, 0.42, 12.1, 0, 1.1, 5.6, 0.8, 2.2, 0.8, 7.5, 0, 0.31];

  class FakeEventSource extends EventTarget {
    constructor() {
      super();
      fake.sources.push(this);
      setTimeout(() => {
        this.dispatchEvent(new Event("open"));
        tick();
      });
    }
  }
  const send = (domain, name, value, state = String(value)) => {
    const data = JSON.stringify({ id: `${domain}/${name}`, value, state });
    for (const s of fake.sources) s.dispatchEvent(new MessageEvent("state", { data }));
  };

  function tick() {
    const s = fake.scenario;
    fake.t++;
    fake.uptime++;
    const V = s === "nosupply" ? 0 : 13.2 + Math.sin(fake.t / 7) * 0.08;
    let notZeroed = [], blown = [], range = [], dead = [4, 11], hot = 34, fault = "OK";
    if (s === "install") {
      notZeroed = fake.notZeroed ??= [3, 4, 7, 11];
      // A dead unzeroed way zeros itself after a while.
      if (fake.t % 15 === 0) {
        const d = notZeroed.find((n) => dead.includes(n));
        if (d) fake.notZeroed = notZeroed = notZeroed.filter((n) => n !== d);
      }
    } else fake.notZeroed = null;
    if (s === "faults") {
      blown = fake.cleared ? [] : [3, 7];
      dead = [3, 7, 4, 11];
      range = [9];
      hot = 87;
      fault = ["Over temperature 87 °C", ...(blown.length ? ["Ways 3, 7 blown"] : []), "Way 9 over range"].join("; ");
    }
    if (s === "nosupply") {
      dead = Array.from({ length: 12 }, (_, i) => i + 1);
      fault = "No supply";
    }
    send("sensor", "Panel Voltage", V, `${V.toFixed(2)} V`);
    send("text_sensor", "Fault Text", fault);
    send("text_sensor", "Not Zeroed", notZeroed.length ? notZeroed.join(", ") : "None");
    send("sensor", "Temperature: Chin", 31);
    send("sensor", "Temperature: Odd Arm", hot);
    send("sensor", "Temperature: Even Arm", 33);
    send("sensor", "Temperature: ESP32", 41);
    send("sensor", "Wi-Fi Signal", -61);
    send("sensor", "Uptime", fake.uptime);
    send("text_sensor", "Firmware", "2026.10.2 (fake)");
    for (let n = 1; n <= 12; n++) {
      const isDead = dead.includes(n);
      const I = isDead ? 0 : range.includes(n) ? 31.4 : BASE_A[n - 1] * (1 + Math.sin((fake.t + n) / 5) * 0.04);
      const z = notZeroed.includes(n);
      send("binary_sensor", `Way ${n}: Live`, !isDead);
      send("binary_sensor", `Way ${n}: Blown Fuse`, blown.includes(n));
      send("sensor", `Way ${n}: Current`, I);
      send("sensor", `Way ${n}: Power`, I * V);
      send("sensor", `Way ${n}: Energy`, 300 * n);
      send("sensor", `Way ${n}: Zero`, z ? null : 7 + n * 0.7);
      send("sensor", `Way ${n}: Zero Temperature`, z ? null : 24 + (n % 3));
      send("sensor", `Way ${n}: Zero Time`, z ? null : 20 + 40 * n);
      send("sensor", `Way ${n}: Gain Trim`, 1 + ((n % 5) - 2) * 0.004);
      send("sensor", `Way ${n}: Voltage`, 1.65 + (n % 2 ? -1 : 1) * I * 0.044);
    }
  }

  const realFetch = fetch;
  window.fetch = (url, opts) => {
    const m = /^\/button\/(.+)\/press$/.exec(url);
    if (!m) return realFetch(url, opts);
    const name = decodeURIComponent(m[1]);
    if (name === "Clear Faults") fake.cleared = true;
    else alert(`(fake) ${name} pressed`);
    tick();
    return Promise.resolve(new Response(null, { status: 200 }));
  };
  window.EventSource = FakeEventSource;

  function setScenario(s) {
    Object.assign(fake, { scenario: s, cleared: false, t: 0, uptime: 1140 });
    qs.set("scenario", s);
    history.replaceState(null, "", `?${qs}`);
    for (const b of bar.querySelectorAll("button")) b.setAttribute("aria-pressed", b.dataset.s === s);
    tick();
  }
  const bar = document.createElement("div");
  bar.style.cssText = "position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:9;display:flex;gap:6px;padding:6px;border-radius:999px;background:#111;box-shadow:0 6px 24px #0006;font:13px system-ui";
  bar.innerHTML = [["normal", "Normal"], ["install", "Install mode"], ["faults", "Faults"], ["nosupply", "No supply"]]
    .map(([s, label]) => `<button data-s="${s}" style="border:0;border-radius:999px;padding:6px 10px;background:#333;color:#fff;font:inherit">${label}</button>`).join("");
  bar.addEventListener("click", (e) => e.target.dataset.s && setScenario(e.target.dataset.s));
  const style = document.createElement("style");
  style.textContent = '[aria-pressed="true"]{background:#FF4FA3!important}';
  document.head.append(style);
  addEventListener("DOMContentLoaded", () => {
    document.body.append(bar);
    setScenario(fake.scenario);
  });
  setInterval(tick, 1000);
})();
