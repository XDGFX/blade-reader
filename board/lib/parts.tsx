// Board-specific parts with no LCSC part behind them, or with hand-written footprints.

import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

// A two-pad chip part whose courtyard is an outline 0.15 mm outside its pads. Pinned tscircuit
// doesn't rotate a footprint string's courtyard rect with the part; an outline rotates. The
// 0.15 mm makes clear courtyards mean JLC's assembly spacing: 0.3 mm between two chip parts
// (they ask 0.15–0.18) and 0.4 mm from a chip part to an IC's pads (they ask 0.4 for an SOIC).
const chip = (pitch: number, width: number, height: number) => {
  const x = pitch / 2 + width / 2 + 0.15
  const y = height / 2 + 0.15
  return (
    <footprint>
      <smtpad portHints={["pin1", "anode"]} pcbX={-pitch / 2} pcbY={0} width={width} height={height} shape="rect" />
      <smtpad portHints={["pin2", "cathode"]} pcbX={pitch / 2} pcbY={0} width={width} height={height} shape="rect" />
      <courtyardoutline
        outline={[
          { x: -x, y: -y },
          { x, y: -y },
          { x, y },
          { x: -x, y },
        ]}
      />
    </footprint>
  )
}
/** The pads of tscircuit's own "0402" and "0603". */
export const FP_0402 = chip(1.02, 0.54, 0.64)
export const FP_0603 = chip(1.65, 0.8, 0.95)
/** The pads of JLC's footprint for the KT-0603R (C2286), which fit between the ESP32 and mux 1. */
export const FP_LED_0603 = chip(1.5, 0.8, 0.8)

/**
 * The pads of tscircuit's own "sot23", with the courtyard 0.15 mm outside the pads and the
 * 1.3 × 2.9 mm body, where its own stands 0.25 mm off: Q1 has 3.39 mm between way 4's cap and
 * way 3's diode.
 */
export const FP_SOT23 = (
  <footprint>
    <smtpad portHints={["1"]} pcbX={-1.1375} pcbY={0.95} width={1.325} height={0.6} shape="rect" />
    <smtpad portHints={["2"]} pcbX={-1.1375} pcbY={-0.95} width={1.325} height={0.6} shape="rect" />
    <smtpad portHints={["3"]} pcbX={1.1375} pcbY={0} width={1.325} height={0.6} shape="rect" />
    <courtyardoutline
      outline={[
        { x: -1.95, y: -1.6 },
        { x: 1.95, y: -1.6 },
        { x: 1.95, y: 1.6 },
        { x: -1.95, y: 1.6 },
      ]}
    />
  </footprint>
)

const fingerPins = { pin1: ["LINE"] } as const

// The finger's clamp point: a 5.4 mm round hole for the way's #8 screw, bare HASL on both
// faces. The ring is the #8 washer's Ø8.13 footprint, which leaves 0.4 mm to the finger tip
// and 0.7 mm to its sides. The rest of the finger's copper belongs to the pours.
export const Finger = (props: ChipProps<typeof fingerPins>) => (
  <chip
    pinLabels={fingerPins}
    footprint={
      <footprint>
        <platedhole
          portHints={["pin1"]}
          pcbX="0mm"
          pcbY="0mm"
          holeDiameter="5.4mm"
          outerDiameter="8.13mm"
          shape="circle"
        />
      </footprint>
    }
    {...props}
  />
)

// Espressif ESP-PROG "PROG" header pinout, from the board's side.
const progPins = {
  pin1: ["EN"],
  pin2: ["VDD"],
  pin3: ["TXD"],
  pin4: ["GND"],
  pin5: ["RXD"],
  pin6: ["IO0"],
} as const

const PITCH = 2.54

// Six SMT pads, 2×3 on 2.54 mm, on the parts face only, for a pogo clamp slid on from the board
// edge, lined up by eye (#77). Each runs from 0.25 to 4.1 mm either side of the centre line, so
// they also take a hand-soldered surface-mount 2×3 header. Nothing is fitted.
export const ProgPads = (props: ChipProps<typeof progPins>) => (
  <chip
    pinLabels={progPins}
    doNotPlace
    footprint={
      <footprint>
        {[0, 1, 2].flatMap((col) =>
          [1, -1].map((row, i) => (
            <Fragment key={`${col}${row}`}>
              <smtpad
                portHints={[`pin${col * 2 + 1 + i}`]}
                pcbX={`${(col - 1) * PITCH}mm`}
                pcbY={`${row * 2.175}mm`}
                shape="rect"
                width="1.5mm"
                height="3.85mm"
              />
            </Fragment>
          )),
        )}
      </footprint>
    }
    {...props}
  />
)
