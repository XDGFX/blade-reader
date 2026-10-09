import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"]
} as const

export const SMTSO4040CTJ = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2916378"
  ]
}}
      manufacturerPartNumber="SMTSO4040CTJ"
      // Hand-written: the EasyEDA footprint puts a plated hole and an SMD pad on pin1, which
      // fails the DRC. Sinhoo's drawing (rev A, 2017-09-08) gives a Ø6.22 mm max pilot and a
      // Ø8.74 mm body but no land pattern, so the 6.4 mm hole clears the pilot after plating
      // tolerance, and the 9.3 mm pad, as in the EasyEDA footprint, covers the body.
      footprint={<footprint>
        <platedhole portHints={["pin1"]} pcbX="0mm" pcbY="0mm" outerDiameter="9.3mm" holeDiameter="6.4mm" shape="circle" />
<silkscreencircle pcbX="0mm" pcbY="0mm" radius="4.8999902mm" />
<silkscreentext text="{NAME}" pcbX="0mm" pcbY="5.9022mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.899990699999989,"y":4.899990699999989},{"x":4.899990699999989,"y":4.899990699999989},{"x":4.899990699999989,"y":-4.899990699999989},{"x":-4.899990699999989,"y":-4.899990699999989},{"x":-4.899990699999989,"y":4.899990699999989}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2916378.obj?uuid=b66578675a504e9b9270b3e705c61a31",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2916378.step?uuid=b66578675a504e9b9270b3e705c61a31",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.0050000000000003375, z: 1.503204 },
      }}
      {...props}
    />
  )
}