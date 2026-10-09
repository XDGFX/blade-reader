// Board-specific parts with no LCSC part behind them, or with hand-written footprints.

import type { ChipProps } from "@tscircuit/props"
import { Fragment } from "react"

const fingerPins = { pin1: ["LINE"] } as const

// The finger's clamp point: a 5.4 mm round hole for the way's #8 screw, bare ENIG on both
// faces. The finger outline and its current-path pours belong to the layout.
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
          outerDiameter="9mm"
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
// SparkFun "lock" footprint: each column is pushed 0.127 mm alternately along the row, so a
// loose header grips without solder.
const LOCK = 0.127

// Empty 2×3 2.54 mm through-hole footprint for the ESP-PROG. Nothing is fitted.
export const ProgLock = (props: ChipProps<typeof progPins>) => (
  <chip
    pinLabels={progPins}
    doNotPlace
    footprint={
      <footprint>
        {[0, 1, 2].map((col) => {
          const x = (col - 1) * PITCH + (col % 2 === 0 ? -LOCK : LOCK)
          return (
            <Fragment key={col}>
            <platedhole
              portHints={[`pin${col * 2 + 1}`]}
              pcbX={`${x}mm`}
              pcbY={`${PITCH / 2}mm`}
              holeDiameter="1.016mm"
              outerDiameter="1.88mm"
              shape="circle"
            />
            <platedhole
              portHints={[`pin${col * 2 + 2}`]}
              pcbX={`${x}mm`}
              pcbY={`${-PITCH / 2}mm`}
              holeDiameter="1.016mm"
              outerDiameter="1.88mm"
              shape="circle"
            />
            </Fragment>
          )
        })}
      </footprint>
    }
    {...props}
  />
)
