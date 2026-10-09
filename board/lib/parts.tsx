// Board-specific parts with no LCSC part behind them, or with hand-written footprints.

import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

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
// edge. Nothing is fitted, and nothing of J1 is on the ring face, under way 1's ring keepout.
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
                pcbY={`${(row * PITCH) / 2}mm`}
                shape="circle"
                radius="0.75mm"
              />
            </Fragment>
          )),
        )}
      </footprint>
    }
    {...props}
  />
)
