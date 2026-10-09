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

// The chamfer corner: free mask between the logo, way 6's nut, the GND label and the chamfer.
const UNICORN = [
  [[0.1, -0.2], [2.2, 1.55], [1.65, 2.05]],                     // horn
  [[1.65, 2.05], [3.2, 0.9], [3.9, 2.5], [1.4, 4.3], [0.7, 3.9]], // head, muzzle down-left
  [[3.2, 0.9], [3.5, 0.1], [3.7, 1.4]],                         // ear
  [[3.9, 2.5], [1.4, 4.3], [3.6, 5.0], [4.6, 3.3]],             // neck
  [[4.6, 3.3], [7.3, 3.0], [7.2, 5.0], [3.6, 5.0]],             // body
  [[7.3, 3.0], [8.3, 2.6], [7.6, 4.0]],                         // tail
  [[3.6, 5.0], [4.3, 5.0], [3.8, 7.7]],                         // front legs
  [[4.3, 5.0], [4.9, 5.0], [4.8, 7.7]],
  [[6.3, 5.0], [6.8, 5.0], [6.5, 7.7]],                         // back legs
  [[6.8, 5.0], [7.2, 5.0], [7.5, 7.7]],
];
const unicorn = (ox, oy) => `<g fill="none" stroke="var(--silk)" stroke-width=".18" stroke-linejoin="round">
  ${UNICORN.map(p => `<polygon points="${p.map(([x, y]) => `${(ox + x).toFixed(2)},${(oy + y).toFixed(2)}`).join(" ")}"/>`).join("")}
  <line x1="${ox + 4.6}" y1="${oy + 3.3}" x2="${ox + 7.2}" y2="${oy + 5.0}"/></g>`;
// Parallel lines inset from the chamfer, shortening towards the corner.
const stripes = () => [1.2, 2.0, 2.8, 3.6, 4.4].map((d, i) => {
  // The chamfer is y = x − 92.08; a line inset by d runs along y = x − 92.08 + d·√2.
  const c = 92.08 - d * Math.SQRT2, x0 = c + 1.6 + d * 0.9, x1 = c + 10.4 - i * 0.6;
  return `<line x1="${x0.toFixed(2)}" y1="${(x0 - c).toFixed(2)}" x2="${x1.toFixed(2)}" y2="${(x1 - c).toFixed(2)}" stroke="var(--silk)" stroke-width=".2" stroke-linecap="round"/>`;
}).join("");
// Rain limited to the corner, at round 3's density.
const cornerRain = () => rain(true).replace(/<line x1="([\d.]+)" y1="([\d.]+)"[^>]*\/>/g, (m, x, y) => (+x > 88 && +y < 11 ? m : ""));

// Orion as seen in the sky (east on the left): RA in degrees, Dec in degrees, silk radius.
const ORION = {
  betelgeuse: [88.79, 7.41, .5], bellatrix: [81.28, 6.35, .32], meissa: [83.78, 9.93, .2],
  mintaka: [83.00, -0.30, .26], alnilam: [84.05, -1.20, .3], alnitak: [85.19, -1.94, .29],
  saiph: [86.94, -9.67, .27], rigel: [78.63, -8.20, .45],
};
const ORION_LINES = [["betelgeuse", "meissa"], ["meissa", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"],
  ["mintaka", "alnilam"], ["alnilam", "alnitak"], ["alnitak", "saiph"], ["mintaka", "rigel"]];
function orion(ox, oy, k) {
  // ox, oy: where Betelgeuse's RA and Meissa's Dec land; k: mm per degree.
  const p = n => [ox + (88.79 - ORION[n][0]) * k, oy + (9.93 - ORION[n][1]) * k];
  const lines = ORION_LINES.map(([a, b]) => { const [x1, y1] = p(a), [x2, y2] = p(b);
    return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}"/>`; }).join("");
  const stars = Object.keys(ORION).map(n => { const [x, y] = p(n);
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${ORION[n][2]}" fill="var(--silk)"/>`; }).join("");
  const [bx, by] = p("betelgeuse");
  return `<g stroke="var(--silk)" stroke-width=".15">${lines}</g>${stars}
    <circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="1.0" fill="none" stroke="var(--silk)" stroke-width=".15"/>`;
}

// A fridge's compressor current: inrush spike, running plateau, off, twice over.
function fridge(ox, oy) {
  const P = [[0, 3.6], [.8, 3.6], [.8, .3], [1.05, 2.0], [2.6, 2.0], [2.6, 3.6], [3.5, 3.6], [3.5, .3], [3.75, 2.0], [5.3, 2.0], [5.3, 3.6], [6.0, 3.6]];
  return `<g fill="none" stroke="var(--silk)" stroke-linejoin="round" stroke-linecap="round">
    <polyline points="${ox},${oy - .2} ${ox},${oy + 4} ${ox + 6.2},${oy + 4}" stroke-width=".15"/>
    <polyline points="${P.map(([x, y]) => `${(ox + x).toFixed(2)},${(oy + y).toFixed(2)}`).join(" ")}" stroke-width=".2"/></g>
    ${t(ox - .3, oy + .6, .8, "A", { a: "end" })}${t(ox + 6.2, oy + 5.0, .8, "t", { a: "end" })}`;
}

// An unlit seven-segment readout, like the banner's per-way displays.
function readout(ox, oy) {
  const W = 1.25, H = 2.2, g = .12;
  const segs = (x, y) => [[x + g, y, x + W - g, y], [x + W, y + g, x + W, y + H / 2 - g], [x + W, y + H / 2 + g, x + W, y + H - g],
    [x + g, y + H, x + W - g, y + H], [x, y + H / 2 + g, x, y + H - g], [x, y + g, x, y + H / 2 - g], [x + g, y + H / 2, x + W - g, y + H / 2]]
    .map(([a, b, c, d]) => `<line x1="${a.toFixed(2)}" y1="${b.toFixed(2)}" x2="${c.toFixed(2)}" y2="${d.toFixed(2)}"/>`).join("");
  const dx = 1.75, x0 = ox + .55, y0 = oy + .5;
  return `<rect x="${ox}" y="${oy}" width="7.2" height="3.2" rx=".5" fill="none" stroke="var(--silk)" stroke-width=".15"/>
    <g stroke="var(--silk)" stroke-width=".2" stroke-linecap="round">${segs(x0, y0)}${segs(x0 + dx, y0)}${segs(x0 + 2 * dx, y0)}</g>
    <circle cx="${(x0 + 2 * dx - .25).toFixed(2)}" cy="${(y0 + H).toFixed(2)}" r=".15" fill="var(--silk)"/>
    ${t(ox + 6.9, oy + 2.7, 1.0, "A", { a: "end" })}`;
}

// An n-pointed star, outer radius r, inner radius r·q, one point straight up.
const star = (cx, cy, r, n = 7, q = .45) => `<polygon points="${Array.from({ length: 2 * n }, (_, i) => {
  const a = Math.PI * i / n - Math.PI / 2, rr = i % 2 ? r * q : r;
  return `${(cx + rr * Math.cos(a)).toFixed(3)},${(cy + rr * Math.sin(a)).toFixed(3)}`; }).join(" ")}" fill="var(--silk)"/>`;

// The Australian flag at length L (2:1), top-left at (ox, oy). The field is mask; the Union Jack's
// crosses and the stars are silk. Star positions follow the Flags Act layout.
function flag(ox, oy, L) {
  const H = L / 2, cw = L / 2, ch = H / 2, s = v => v.toFixed(3);
  const P = (fx, fy) => [ox + fx * L, oy + fy * H];
  const sc = [[3 / 4, 5 / 6, 1 / 14], [3 / 4, 1 / 6, 1 / 14], [0.6153, 0.4167, 1 / 14], [0.8634, 0.3708, 1 / 14], [0.7998, 0.5521, 1 / 24]];
  return `<rect x="${s(ox)}" y="${s(oy)}" width="${s(L)}" height="${s(H)}" fill="none" stroke="var(--silk)" stroke-width=".15"/>
    <g stroke="var(--silk)" stroke-linecap="butt">
      <line x1="${s(ox)}" y1="${s(oy)}" x2="${s(ox + cw)}" y2="${s(oy + ch)}" stroke-width="${s(ch * .2)}"/>
      <line x1="${s(ox + cw)}" y1="${s(oy)}" x2="${s(ox)}" y2="${s(oy + ch)}" stroke-width="${s(ch * .2)}"/>
      <line x1="${s(ox + cw / 2)}" y1="${s(oy)}" x2="${s(ox + cw / 2)}" y2="${s(oy + ch)}" stroke-width="${s(ch * .33)}"/>
      <line x1="${s(ox)}" y1="${s(oy + ch / 2)}" x2="${s(ox + cw)}" y2="${s(oy + ch / 2)}" stroke-width="${s(ch * .33)}"/>
    </g>
    ${star(...P(.25, .75), H * .15)}
    ${sc.map(([fx, fy, d], i) => star(...P(fx, fy), H * d * 1.4, i === 4 ? 5 : 7)).join("")}`;
}

// The Southern Cross as seen in the sky: RA, Dec, silk radius.
// Radii are relative; `crux` scales them. RA is foreshortened by cos(Dec) so the cross keeps its
// real shape: tall, Gacrux at the top, Mimosa on the left as on the flag.
const CRUX = { gacrux: [187.79, -57.11, .9], acrux: [186.65, -63.10, 1], mimosa: [191.93, -59.69, .95],
  imai: [183.79, -58.75, .75], ginan: [185.34, -60.40, .5] };
const COS_CRUX = Math.cos(60 * Math.PI / 180);
const crux = (ox, oy, h, dots) => {
  const k = h / 6.0;
  return Object.values(CRUX).map(([ra, dec, r]) => {
    const x = ox + (191.93 - ra) * COS_CRUX * k, y = oy + (-57.11 - dec) * k;
    return dots ? `<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${(r * .2).toFixed(3)}" fill="var(--silk)"/>`
      : star(x, y, r * .3, r < .6 ? 5 : 7, .5);
  }).join("");
};
// "DESIGNED IN / AUSTRALIA" right-aligned against the cross; the cross spans the text's cap height.
const designedIn = dots => t(5.8, 1.3, .8, "DESIGNED IN", { ls: .05, a: "end" }) + t(5.8, 2.5, .8, "AUSTRALIA", { ls: .05, a: "end" }) +
  crux(6.5, .6, 2.0, dots);

// A block laid along the chamfer: local x runs down the chamfer, local y into the board. Its
// origin is 0.9 mm in from the chamfer, where the chamfer is y = x − 92.08.
const alongChamfer = (x0, body) => `<g transform="translate(${x0} ${(x0 - 92.08 + .9 * Math.SQRT2).toFixed(3)}) rotate(45)">${body}</g>`;

const CONCEPTS = {
  ACd: () => C2() + fingers() + alongChamfer(93.6, designedIn(true)),
  ACs: () => C2() + fingers() + alongChamfer(93.6, designedIn(false)),
};

