import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IP_POS2"],
  pin2: ["IP_POS1"],
  pin3: ["IP_NEG2"],
  pin4: ["IP_NEG1"],
  pin5: ["GND"],
  pin6: ["VREF"],
  pin7: ["VOUT"],
  pin8: ["VCC"]
} as const

const pinAttributes = {
  pin5: {requiresGround: true},
  pin8: {requiresPower: true}
} as const

export const CC6905S8_3FB030 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C41421490"
  ]
}}
      manufacturerPartNumber="CC6905S8-3FB030"
      footprint="soic8_pillpads_w7mm_pw0.59mm_pl1.8mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C41421490.obj?uuid=ec3b9f9b31a74655be3e55848dbee9c1",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C41421490.step?uuid=ec3b9f9b31a74655be3e55848dbee9c1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}