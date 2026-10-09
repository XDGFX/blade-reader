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
  ["SOURCE", "github.com/xdgfx", "/blade-reader", .9],
];
function plate() {
  return CELLS.map(([l, a, b, s = 1], i) => {
    const x = SLOTS[i];
    return t(x, 18.4, .8, l, { a: "middle", ls: .12 }) +
      `<line x1="${x - 3}" y1="18.95" x2="${x + 3}" y2="18.95" stroke="var(--silk)" stroke-width=".15"/>` +
      t(x, 20.6, s, a, { a: "middle" }) + t(x, 22.3, s, b, { a: "middle" });
  }).join("") + deg(SLOTS[1] + 2.4, 21.75);
}
const common = (rows = [17.3, 19.4, 21.5]) => `
  ${WAYS.map((x, i) => rows.map(y => chevron(x, y, i === 0)).join("")).join("")}
  ${plate()}
  ${t(23.2, 4.6, 1.0, "PROG")}`;

const earth = (x, y) => `<g stroke="var(--silk)" stroke-width=".2" stroke-linecap="round">
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 1}"/><line x1="${x - 1}" y1="${y + 1}" x2="${x + 1}" y2="${y + 1}"/>
  <line x1="${x - .65}" y1="${y + 1.45}" x2="${x + .65}" y2="${y + 1.45}"/><line x1="${x - .3}" y1="${y + 1.9}" x2="${x + .3}" y2="${y + 1.9}"/></g>`;

// Logo, 58 wide: x 28.5–86.5, y 1.1–5.74.
const LOGO_BOX = [28.5, 1.1, 86.5, 5.74];
const grow = ([a, b, c, d], m) => [a - m, b - m, c + m, d + m];

// Rain stays out of these boxes [x0, y0, x1, y1] and circles [cx, cy, r], and 0.6 inside the
// board edge. `ears` keeps it to the two ears and the band's ends; otherwise it fills every
// open field of mask.
function keepouts(ears) {
  const boxes = [
    grow(LOGO_BOX, .5), [2.9, .7, 9.7, 24.1], [14.6, 1.0, 26.3, 6.7], [94.8, 11.0, 102.6, 15.0], [0, 23.9, 104, 26],
    ...(ears
      ? [[13.4, 0, 91, 26]]
      : [...WAYS.map(x => [x - 2.1, 15.6, x + 2.1, 24]), ...SLOTS.map(x => [x - 4.3, 17.4, x + 4.3, 23]),
         ...G.slots.map(s => [s.x - 1.35, s.y - 4.5, s.x + 1.35, s.y + 4.5])]),
  ];
  const circles = G.holes.map(h => [h.x, h.y, h.r + .6]);
  return { boxes, circles };
}
// Even rain: one streak per cell of a staggered grid, jittered a little, all at the banner's angle.
function rain(ears) {
  let s = 11;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const { boxes, circles } = keepouts(ears);
  const inside = (x, y) => x > .6 && x < 103.4 && y > .6 && y > x - 92.08 + .85;
  const hit = (x, y) => !inside(x, y) || boxes.some(([a, b, c, d]) => x > a && x < c && y > b && y < d) ||
    circles.some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < r * r);
  const out = [];
  const DX = 1.15, DY = 2.3;
  for (let row = 0; row * DY < 24; row++) {
    for (let col = 0; col * DX < 104; col++) {
      const x = col * DX + (row % 2) * DX / 2 + (rnd() - .5) * .5, y = row * DY + (rnd() - .5) * 1.2;
      const len = 1.3 + rnd() * .5, x2 = x - .28 * len, y2 = y + len;
      if ([0, .25, .5, .75, 1].some(f => hit(x + (x2 - x) * f, y + (y2 - y) * f))) continue;
      out.push(`<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`);
    }
  }
  return `<g stroke="var(--silk)" stroke-width=".15" stroke-linecap="round">${out.join("")}</g>`;
}

// The edge line: one line of text centred on the ways' span, baseline 0.6 mm above the panel edge.
const edge = (txt, s, ls) => t(52.01, 24.9, s, txt, { a: "middle", ls });
const TAGLINE = "CURRENT ON EVERY WAY OF A BLADE FUSE PANEL";
const QUOTE = "I'VE SEEN THINGS YOU PEOPLE WOULDN'T BELIEVE. FRIDGES DRAWING AMPS OFF THE SHOULDER OF ORION.";

const C2 = (rows) => `${common(rows)}${logo(LOGO_BOX[0], LOGO_BOX[1], LOGO_BOX[2] - LOGO_BOX[0])}
    ${frame(3.4, 1.2, 5.8, 22.4, 1)}${kana(6.3, 2.5, 2.3, 2.55)}
    ${earth(96.6, 12.2)}${t(98.2, 14.2, 1.2, "GND")}`;
// The quote, two lines on each finger: the first sentence on ways 1–3, the second on ways 4–6.
const FINGER_LINES = [
  ["I'VE SEEN", "THINGS"], ["YOU", "PEOPLE"], ["WOULDN'T", "BELIEVE."],
  ["FRIDGES", "DRAWING"], ["AMPS OFF", "THE SHOULDER"], ["OF", "ORION."],
];
const fingers = () => WAYS.map((x, i) =>
  t(x, 27.25, 1, FINGER_LINES[i][0], { a: "middle", ls: .1 }) + t(x, 28.85, 1, FINGER_LINES[i][1], { a: "middle", ls: .1 })).join("");

const CONCEPTS = {
  C2c: () => C2() + fingers(),
};

