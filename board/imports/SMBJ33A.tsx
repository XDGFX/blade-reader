import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["C"],
  pin2: ["A"]
} as const

export const SMBJ33A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port name="pin2" pinNumber={2} aliases={["A"]} direction="right" schX={0.4} schY={0} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["C"]} direction="left" schX={-0.4} schY={0} schStemLength={0.2} />
          <schematicpath points={[{"x":0.2,"y":0},{"x":0.1,"y":0}]} strokeColor="#880000" />
          <schematicpath points={[{"x":-0.1,"y":0},{"x":-0.2,"y":0}]} strokeColor="#880000" />
          <schematicpath svgPath="M 0.1 0.14 L -0.1 0 L 0.1 -0.14 Z" strokeColor="#880000" />
          <schematicpath points={[{"x":-0.1,"y":0.14},{"x":-0.1,"y":-0.14}]} strokeColor="#880000" />
          <schematictext schX={0} schY={0.34} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C19077586"
  ]
}}
      manufacturerPartNumber="SMBJ33A"
      footprint="smdpads2_p4.6441mm_pw2.024mm_ph2.94mm_cyw7.1681mm_cyh4.1mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19077586.obj?uuid=a3abcd5044a948bebcbb9e091001aed8",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C19077586.step?uuid=a3abcd5044a948bebcbb9e091001aed8",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -1.26 },
      }}
      {...props}
    />
  )
}