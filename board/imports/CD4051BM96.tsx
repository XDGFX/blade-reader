import type { ChipProps } from "@tscircuit/props"

// Pin names from the TI CD4051B datasheet: X0–X7 are the channels, X the common.
// The EasyEDA import's names were scrambled.
const pinLabels = {
  pin1: ["X4"],
  pin2: ["X6"],
  pin3: ["X"],
  pin4: ["X7"],
  pin5: ["X5"],
  pin6: ["INH"],
  pin7: ["VEE"],
  pin8: ["VSS"],
  pin9: ["C"],
  pin10: ["B"],
  pin11: ["A"],
  pin12: ["X3"],
  pin13: ["X0"],
  pin14: ["X1"],
  pin15: ["X2"],
  pin16: ["VDD"]
} as const

const pinAttributes = {
  pin8: {requiresGround: true},
  pin16: {requiresPower: true}
} as const

export const CD4051BM96 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C21379"
  ]
}}
      manufacturerPartNumber="CD4051BM96"
      footprint="soic16_pillpads_w7.44mm_pl1.97mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C21379.obj?uuid=9adfdf34b7774b23880141fd3e8b4dbb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C21379.step?uuid=9adfdf34b7774b23880141fd3e8b4dbb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999842880061, y: 0, z: 0.000575 },
      }}
      {...props}
    />
  )
}