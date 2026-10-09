import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CB"],
  pin2: ["GND"],
  pin3: ["FB"],
  pin4: ["EN"],
  pin5: ["VIN"],
  pin6: ["SW"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin5: {requiresPower: true}
} as const

export const LMR51610XDBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C20539658"
  ]
}}
      manufacturerPartNumber="LMR51610XDBVR"
      footprint="soic6_p0.95mm_w3.8mm_pl1.1mm_pin1location(rightside,bottom)"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C20539658.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C20539658.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0.000025399999913133797, y: -0.0000889000000370288, z: -0.048939 },
      }}
      {...props}
    />
  )
}