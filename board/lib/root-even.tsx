// The even arm's root: its lines from where the arm's routes stop (lib/routes.tsx) to mux 2 and
// its dividers, which stand on the root itself.
//
// Points are in way 12's column coordinates, as lib/routes.tsx has them: `u` along the arm from
// way 12's centre towards the chin, `v` outboard from the panel edge.
//
// The whole channel turns outboard on the ring face: 45° beside the step in the inner edge, then
// straight out between way 12's sensor and the mux, each line turning towards the chin at its
// own height. The top lane turns first, so the lines keep their order and none crosses another:
// 3V3 outermost, then voltage and sense for ways 12 down to 2. Each sense line ends in a via at
// its divider, and the voltage line inboard of it passes between that via and the next, on under
// the mux to a via at its pin. That order sets the dividers' rows and the mux's channels.
//
// The dividers stand in two columns, GND and the divided line towards the arm and the sense line
// towards the mux. The divided lines leave between the rows on the parts face: three under the
// mux's body to its outboard pins, three round their outer ends.

import { CLAMP_Y } from "./outline"
import { BUS_V, BUS_WIDTH, LANE_WIDTH, V3V3_V, evenRootU, lane } from "./routes"

type Uv = [number, number]
type Step = Uv | string | { via: Uv; to: "top" | "bottom" }

/** Every corner is cut back this far. */
const CUT = 0.3
// tscircuit holds a trace from a capacitor's pin to 1 mm unless told otherwise.
const CAP_RUN = 80

/** The dividers' rows, outboard from the panel: way 12's, then ways 2 to 10. */
const ROW_WAYS = [12, 2, 4, 6, 8, 10]
const ROW_V = 9.0
const ROW_PITCH = 1.14
const rowV = (r: number) => ROW_V + ROW_PITCH * r
/** A divided line leaves, and a voltage line passes, midway between two rows. */
const BETWEEN = ROW_PITCH / 2
// Along a row: R4's GND pad, its divided pad, R3's divided pad and its sense pad, then the
// sense line's via.
const GND_U = 10.72
const DIVIDED_U = [11.74, 13.12]
const SENSE_U = 14.14
const VIA_U = 14.98
const LEAVE_U = (DIVIDED_U[0] + DIVIDED_U[1]) / 2
/** Where each divider's resistors stand, for index.circuit.tsx: R3 is the 22k, R4 the 100k. */
export const evenDivider = (n: number): { r3: Uv; r4: Uv } => {
  const v = rowV(ROW_WAYS.indexOf(n))
  return { r3: [(DIVIDED_U[1] + SENSE_U) / 2, v], r4: [(GND_U + DIVIDED_U[0]) / 2, v] }
}

// Mux 2's middle, and its pads from it: twelve a side on a 0.65 pitch, the sides 6.04 apart.
// It stands 1.28 clear of the sense vias, which leaves room there for a via at its common pin.
export const EVEN_MUX: Uv = [20.33, 8.9]
const padU = (r: number) => EVEN_MUX[0] + (r - 5.5) * 0.65
/** The inboard pins run VCC, Y8 to Y15 towards the chin; the outboard ones Z, Y7 down to Y0. */
const inboardU = (y: number) => padU(y - 7)
const outboardU = (y: number) => padU(8 - y)

// Lane `i`'s line on the ring face: out at `outU`, then towards the chin at `alongV`. Lane 0, way
// 2's voltage line, is nearest the chin and turns lowest; each lane above it stands 0.32 nearer
// the arm and turns half a row higher, so sense lines turn level with their rows.
const outU = (i: number) => 13.92 - 0.32 * i
const alongV = (i: number) => rowV(0) + BETWEEN + BETWEEN * i
// 3V3 is outside them all.
const V3V3_OUT_U = outU(10) - 0.36
const V3V3_ALONG_V = alongV(10) + 0.4
/** Where the GND bus runs past the step, and its via to way 12's caps. */
const BUS_ALONG_V = 1.89
const BUS_VIA_U = 13.2
/** Way 12's sense line passes between its VCC cap and its sense cap to a via past them. */
const SENSE12_V = 2.53
const SENSE12_VIA: Uv = [14.5, SENSE12_V]
// Past the sense vias the voltage lines close up to a 0.32 pitch on way 2's, which keeps them
// out of the ground nut's ring keepout swung 39°. The mux's common comes down by a via beside
// its pin, between two of them, so it closes up with them in a slot of its own, and Y12 is left
// spare for it to pass between the voltage lines' vias and out under the inboard pins.
const CLOSE_U = 16.2
const closeV = (slot: number) => alongV(0) + 0.32 * slot
/** Where they turn in to their pins the corner is cut further, clear of that keepout. */
const DROP_CUT = 0.5
/** The voltage lines' slots and channels, ways 2 to 12; the common has slot 3, over Y12. */
const VOLTS_SLOT = [0, 1, 2, 4, 5, 6]
const COMMON_SLOT = 3
const COMMON_VIA: Uv = [15.9, alongV(5)]
/** Where the common's line stops, inboard of the mux's pins, for the chin to take on. */
const COMMON_END_V = 4.3
// Under the mux's body each voltage line ends in a via in line with its pin, in two rows so that
// neighbours clear each other.
const VOLTS_VIA_V = [7.75, 7.05]
/** The sensor's GND pin, across the arm, and its caps' GND pads along it. */
const GND_PIN_V = 5.71
const CAP_GND_U = 11.99
/** Q3's emitter, across the arm. */
const Q3_GND_V = 7.65
/** The VREF cap's GND runs back to the dividers' column between that cap and Q3. */
const CAP_GND_V = 5.1
/** Where R9 stands, between Q3 and way 12's sense line: its 3V3 pad towards the panel. */
export const EVEN_R9: Uv = [13.97, 4.12]
const R9_V3V3_V = EVEN_R9[1] - 0.51
/** R9's 3V3 line steps outboard over the mux's cap on its way to the VCC pin. */
const R9_RISE = 0.71
/** The temperature's line under the mux's body to Y8. */
const TEMP_V = 7.2

/** On the ring face from `(u, v)`, heading for the chin, back round the turn to a line's end at the arm. */
const toArm = (u: number, v: number, from: number): Uv[] => [
  [u + CUT, v],
  [u, v - CUT],
  [u, from + u - evenRootU(from)],
  [evenRootU(from), from],
]
/**
 * 3V3 on from its end at the arm (lib/routes.tsx draws it, from way 12's via): round the turn
 * outside every lane, to stop outboard of the dividers.
 */
export const EVEN_V3V3: Uv[] = [...toArm(V3V3_OUT_U, V3V3_ALONG_V, V3V3_V).reverse().slice(1), [VIA_U, V3V3_ALONG_V]]

/** Mux 2's channels in the order its lines arrive: the net on each of Y0 to Y15. */
export const EVEN_CHANNELS = Array.from({ length: 16 }, (_, y) => {
  // Outboard: the three rows nearest the panel come under the body, highest row to Y7; the
  // other three round the pins' ends, lowest row to Y4.
  if (y >= 5 && y <= 7) return `net.S${ROW_WAYS[y - 5]}_MUX`
  if (y >= 2 && y <= 4) return `net.S${ROW_WAYS[7 - y]}_MUX`
  if (y === 8) return "net.TEMP_EVEN"
  if (y >= 9 && y !== 9 + COMMON_SLOT) return `net.S${2 * (VOLTS_SLOT.indexOf(y - 9) + 1)}_VOLTS`
  return "net.GND"
})

/** The even arm's lines to mux 2 and its dividers. */
export const EvenRoot = () => {
  const point = ([u, v]: Uv) => ({ x: v - CLAMP_Y, y: u })
  const toPathPoint = (s: Step) => {
    if (typeof s === "string") return s
    if ("via" in s) return { ...point(s.via), via: true, toLayer: s.to }
    return point(s)
  }
  const Route = ({
    from,
    to,
    width = LANE_WIDTH,
    maxLength,
    path,
  }: { from: string; to: string; width?: number; maxLength?: number; path: Step[] }) => (
    <trace
      from={from}
      to={to}
      thickness={`${width}mm`}
      maxLength={maxLength}
      pcbPathRelativeTo=".W12 > .pin1"
      pcbPaths={[path.map(toPathPoint)] as any}
    />
  )
  const through = (p: Uv, to: "top" | "bottom"): Step[] => [p, { via: p, to }, p]

  const r3 = (n: number, pin: 1 | 2) => `.R3${n} > .pin${pin}`
  const r4 = (n: number, pin: 1 | 2) => `.R4${n} > .pin${pin}`
  const cap = (c: 1 | 2 | 3, pin: 1 | 2) => `.C${c}12 > .pin${pin}`

  return (
    <>
      {/* Sense lines for ways 2 to 10: from the divider's pad through its via and round the turn. */}
      {[1, 3, 5, 7, 9].map((i) => (
        <Route
          key={i}
          from={r3(i + 1, 2)}
          to={`net.S${i + 1}_SENSE`}
          path={[r3(i + 1, 2), ...through([VIA_U, alongV(i)], "bottom"), ...toArm(outU(i), alongV(i), lane(i))]}
        />
      ))}
      {/* Voltage lines: from the mux's pin to its via under the body, out on the ring face,
          between two sense vias and round the turn. */}
      {[0, 2, 4, 6, 8, 10].map((i) => {
        const y = 9 + VOLTS_SLOT[i / 2]
        const via: Uv = [inboardU(y), VOLTS_VIA_V[y % 2]]
        const close = closeV(VOLTS_SLOT[i / 2])
        const fall = alongV(i) - close
        return (
          <Route
            key={i}
            from={`.U4 > .Y${y}`}
            to={`net.S${i + 2}_VOLTS`}
            path={[
              `.U4 > .Y${y}`,
              ...through(via, "bottom"),
              [via[0], close - DROP_CUT],
              [via[0] - DROP_CUT, close],
              ...(fall > 0 ? ([[CLOSE_U + fall, close], [CLOSE_U, alongV(i)]] as Uv[]) : []),
              ...toArm(outU(i), alongV(i), lane(i)),
            ]}
          />
        )
      })}
      {/* The GND bus follows the step in the inner edge and comes up past way 12's caps, to
          ground the VCC cap. The other two are joined, and reach GND by the dividers' column. */}
      <Route
        from={cap(1, 2)}
        to="net.GND"
        width={BUS_WIDTH}
        maxLength={CAP_RUN}
        path={[
          cap(1, 2),
          ...through([BUS_VIA_U, BUS_ALONG_V], "bottom"),
          [evenRootU(BUS_V) + BUS_ALONG_V - BUS_V, BUS_ALONG_V],
          [evenRootU(BUS_V), BUS_V],
        ]}
      />
      <Route from={cap(3, 2)} to={cap(2, 2)} width={0.2} maxLength={CAP_RUN} path={[cap(3, 2), cap(2, 2)]} />

      {/* Way 12's sense line: between the pads of the VCC cap and its sense cap, down past
          them, and up the ring face inside every other line to the first row. */}
      <Route
        from={cap(3, 1)}
        to={r3(12, 2)}
        maxLength={CAP_RUN}
        path={[
          cap(3, 1),
          [10.97, SENSE12_V + CUT],
          [10.97 + CUT, SENSE12_V],
          ...through(SENSE12_VIA, "bottom"),
          [SENSE12_VIA[0], rowV(0) - (VIA_U - SENSE12_VIA[0])],
          ...through([VIA_U, rowV(0)], "top"),
          r3(12, 2),
        ]}
      />

      {/* GND on the parts face: from the sensor's GND pin out along the dividers' column, past
          Q3's emitter. The VREF cap joins the column between itself and Q3's base. */}
      <Route
        from=".U112 > .GND"
        to=".Q3 > .pin2"
        width={0.2}
        path={[".U112 > .GND", [GND_U, GND_PIN_V], [GND_U, Q3_GND_V], ".Q3 > .pin2"]}
      />
      <Route
        from={cap(2, 2)}
        to="net.GND"
        width={0.2}
        maxLength={CAP_RUN}
        path={[cap(2, 2), [CAP_GND_U, CAP_GND_V], [GND_U, CAP_GND_V], [GND_U, GND_PIN_V]]}
      />
      <Route from={r4(12, 1)} to="net.GND" width={0.2} path={[r4(12, 1), [GND_U, Q3_GND_V]]} />
      {ROW_WAYS.slice(1).map((n, r) => (
        <Route key={n} from={r4(n, 1)} to={r4(ROW_WAYS[r], 1)} width={0.2} path={[r4(n, 1), r4(ROW_WAYS[r], 1)]} />
      ))}

      {/* Each divider's two resistors joined, and the divided line out between the rows. */}
      {ROW_WAYS.map((n, r) => {
        const inside = r < 3
        const y = inside ? 5 + r : 7 - r
        const side = inside ? -1 : 1
        const v = rowV(r) + side * BETWEEN
        return (
          <Route
            key={n}
            from={r4(n, 2)}
            to={`.U4 > .Y${y}`}
            path={[
              r4(n, 2),
              [LEAVE_U, rowV(r)],
              [LEAVE_U, v - side * 0.15],
              [LEAVE_U + 0.15, v],
              [outboardU(y) - CUT, v],
              [outboardU(y), v - side * CUT],
              `.U4 > .Y${y}`,
            ]}
          />
        )
      })}
      {ROW_WAYS.map((n, r) => (
        <Route key={n} from={r3(n, 1)} to={r4(n, 2)} path={[r3(n, 1), [LEAVE_U, rowV(r)]]} />
      ))}

      {/* The mux's common: down beside its pin, along with the voltage lines, between their vias
          over Y12 and out under the inboard pins. */}
      <Route
        from=".U4 > .Z"
        to="net.ADC2"
        path={[
          ".U4 > .Z",
          [padU(0), COMMON_VIA[1]],
          ...through(COMMON_VIA, "bottom"),
          [CLOSE_U, COMMON_VIA[1]],
          [CLOSE_U + COMMON_VIA[1] - closeV(COMMON_SLOT), closeV(COMMON_SLOT)],
          [inboardU(9 + COMMON_SLOT) - DROP_CUT, closeV(COMMON_SLOT)],
          [inboardU(9 + COMMON_SLOT), closeV(COMMON_SLOT) - DROP_CUT],
          [inboardU(9 + COMMON_SLOT), COMMON_END_V],
        ]}
      />

      {/* The arm's temperature: Q3's base and collector joined through R9's pad, and under the
          body to Y8. R9 takes its 3V3 at the mux's VCC pin. */}
      <Route from=".Q3 > .pin1" to=".R9 > .pin1" path={[".Q3 > .pin1", ".R9 > .pin1"]} />
      <Route from=".R9 > .pin1" to=".Q3 > .pin3" path={[".R9 > .pin1", ".Q3 > .pin3"]} />
      <Route
        from=".Q3 > .pin3"
        to=".U4 > .Y8"
        path={[".Q3 > .pin3", [EVEN_R9[0] + 0.5, TEMP_V], [inboardU(8), TEMP_V], ".U4 > .Y8"]}
      />
      <Route
        from=".R9 > .pin2"
        to=".U4 > .VCC"
        width={0.2}
        path={[
          ".R9 > .pin2",
          [EVEN_R9[0] + 0.4, R9_V3V3_V],
          [EVEN_R9[0] + 0.4 + R9_RISE, R9_V3V3_V + R9_RISE],
          [padU(0) - CUT, R9_V3V3_V + R9_RISE],
          [padU(0), R9_V3V3_V + R9_RISE + CUT],
          ".U4 > .VCC",
        ]}
      />
    </>
  )
}
