// Pads, holes and courtyard rects as subpaths in hundredths of a mm, relative after their start.
export type Sub = { x: number; y: number; body: string; ex: number; ey: number }
const h = (v: number) => Math.round(v * 100)
const n = (v: number) => {
  const r = v / 100
  return (Object.is(r, -0) ? 0 : r).toString().replace(/^(-?)0\./, "$1.")
}
const sep = (a: string) => (a[0] === "-" ? a : " " + a)
const closed = (x: number, y: number, body: string): Sub => ({ x, y, body: body + "z", ex: x, ey: y })

export const rectD = (x: number, y: number, w: number, ht: number, r = 0, rot = 0): Sub => {
  const q = ((rot % 360) + 360) % 360
  if (q % 90) throw new Error(`rotation ${rot}`)
  if (q === 90 || q === 270) [w, ht] = [ht, w]
  r = Math.min(r, w / 2, ht / 2)
  const [x0, y0, W, H, R] = [h(x - w / 2), h(y - ht / 2), h(w), h(ht), h(r)]
  if (!R) return closed(x0, y0, `h${n(W)}v${n(H)}h${n(-W)}`)
  const a = (dx: number, dy: number) => `a${n(R)} ${n(R)} 0 0 1${sep(n(dx))}${sep(n(dy))}`
  const [hw, hh] = [W - 2 * R, H - 2 * R]
  return closed(
    x0 + R,
    y0,
    `${hw ? `h${n(hw)}` : ""}${a(R, R)}${hh ? `v${n(hh)}` : ""}${a(-R, R)}${hw ? `h${n(-hw)}` : ""}${a(-R, -R)}${hh ? `v${n(-hh)}` : ""}${a(R, -R)}`,
  )
}
export const circD = (x: number, y: number, r: number): Sub => {
  const R = h(r)
  return closed(h(x) - R, h(y), `a${n(R)} ${n(R)} 0 1 0 ${n(2 * R)} 0a${n(R)} ${n(R)} 0 1 0${sep(n(-2 * R))} 0`)
}
