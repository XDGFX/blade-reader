const LOGO = /*LOGO*/null;
const KANA = /*KANA*/null;

// Banner wordmark, scaled to width w, top-left at (x, y).
function logo(x, y, w) {
  const k = w / LOGO.w;
  return `<path d="${LOGO.d}" fill="var(--silk)" transform="translate(${x} ${y}) scale(${k}) translate(${-LOGO.x0} ${-LOGO.y0})"/>`;
}
// Vertical katakana: em size s, column centre cx, first glyph top y, pitch p.
function kana(cx, y, s, p) {
  return [..."ブレードリーダー"].map((ch, i) => {
    const rot = ch === "ー" ? " rotate(90 .5 .5)" : "";
    return `<path d="${KANA[ch].d}" fill="var(--silk)" transform="translate(${cx - s / 2} ${y + i * p}) scale(${s})${rot}"/>`;
  }).join("");
}
const frame = (x, y, w, h, r) => [0, .55].map(i =>
  `<rect x="${x + i}" y="${y + i}" width="${w - 2 * i}" height="${h - 2 * i}" rx="${Math.max(r - i, .2)}" fill="none" stroke="var(--silk)" stroke-width=".2"/>`).join("");
const deg = (x, y) => `<circle cx="${x}" cy="${y}" r=".2" fill="none" stroke="var(--silk)" stroke-width=".12"/>`;

const chevron = (x, y, solid) => {
  const d = `M${x-1.4},${y+.9} L${x},${y-.5} L${x+1.4},${y+.9} L${x+1.4},${y+1.6} L${x},${y+.2} L${x-1.4},${y+1.6} Z`;
  return solid ? `<path d="${d}" fill="var(--silk)"/>` : `<path d="${d}" fill="none" stroke="var(--silk)" stroke-width=".15"/>`;
};
const CELLS = [
  ["REVISION", "A", "2026-10"],
  ["DERATE", "20 A PER WAY", "ABOVE 40  C"],
  ["OUTPUT NUT", "M4", "1.0-1.2 Nm"],
  ["LICENCE", "CERN-OHL-S-2.0", ""],
  ["FOR PANEL", "BLUE SEA", "ST BLADE"],
];
function plate() {
  return CELLS.map(([l, a, b], i) => {
    const x = SLOTS[i];
    return t(x, 18.4, .8, l, { a: "middle", ls: .12 }) +
      `<line x1="${x - 3}" y1="18.95" x2="${x + 3}" y2="18.95" stroke="var(--silk)" stroke-width=".15"/>` +
      t(x, 20.6, 1, a, { a: "middle" }) + t(x, 22.3, 1, b, { a: "middle" });
  }).join("") + deg(SLOTS[1] + 2.4, 21.75);
}
const common = () => `
  <line x1="1" y1="24.6" x2="103" y2="24.6" stroke="var(--silk)" stroke-width=".2"/>
  ${WAYS.map((x, i) => [17.3, 19.4, 21.5].map(y => chevron(x, y, i === 0)).join("")).join("")}
  ${plate()}
  ${t(23.2, 4.6, 1.0, "PROG")}`;

const earth = (x, y) => `<g stroke="var(--silk)" stroke-width=".2" stroke-linecap="round">
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 1}"/><line x1="${x - 1}" y1="${y + 1}" x2="${x + 1}" y2="${y + 1}"/>
  <line x1="${x - .65}" y1="${y + 1.45}" x2="${x + .65}" y2="${y + 1.45}"/><line x1="${x - .3}" y1="${y + 1.9}" x2="${x + .3}" y2="${y + 1.9}"/></g>`;

// Areas the rain must stay out of, as [x0, y0, x1, y1] boxes and [cx, cy, r] circles.
function keepouts() {
  const boxes = [
    [27.9, 0, 87.1, 7], [2.9, .8, 9.7, 24.0], [14.5, 1.2, 26.5, 6.6], [92, 11, 104, 16],
    [0, 23.8, 104, 26], ...WAYS.map(x => [x - 2.2, 15.5, x + 2.2, 24]), ...SLOTS.map(x => [x - 4.4, 17.2, x + 4.4, 23]),
    ...G.slots.map(s => [s.x - 1.4, s.y - 4.5, s.x + 1.4, s.y + 4.5]),
  ];
  const circles = G.holes.map(h => [h.x, h.y, h.r + .6]);
  return { boxes, circles };
}
function rain() {
  let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const { boxes, circles } = keepouts();
  const hit = (x, y) => boxes.some(([a, b, c, d]) => x > a && x < c && y > b && y < d) ||
    circles.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r);
  const out = [];
  for (let i = 0; i < 1400 && out.length < 260; i++) {
    const x = .8 + rnd() * 102.4, y = .8 + rnd() * 22.6, len = .8 + rnd() * 1.6;
    const x2 = x - .28 * len, y2 = y + len;
    if (hit(x, y) || hit(x2, y2) || hit((x + x2) / 2, (y + y2) / 2)) continue;
    out.push(`<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`);
  }
  return `<g clip-path="url(#brd)" stroke="var(--silk)" stroke-width=".15" stroke-linecap="round" opacity=".9">${out.join("")}</g>`;
}

const CONCEPTS = {
  C1: () => `${common()}${logo(30.5, 1.35, 54)}
    ${t(GND.x, 14.4, 1.2, "GND", { a: "middle" })}`,
  C2: () => `${common()}${logo(31.5, 1.42, 52)}${frame(28.5, .4, 58, 6.2, 1.2)}
    ${frame(3.4, 1.2, 5.8, 22.4, 1)}${kana(6.3, 2.5, 2.3, 2.55)}
    ${earth(96.6, 12.2)}${t(98.2, 14.2, 1.2, "GND")}`,
  C3: () => CONCEPTS.C2() + rain(),
};

