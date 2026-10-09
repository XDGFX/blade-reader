import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const A_0466001_NRHF = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <schematicrect schX={0} schY={0} width={0.4} height={0.16} strokeWidth={0.02} color="#A00000" />
          <port name="pin2" pinNumber={2} aliases={["2"]} direction="right" schX={0.4} schY={0} schStemLength={0.2} />
          <port name="pin1" pinNumber={1} aliases={["1"]} direction="left" schX={-0.4} schY={0} schStemLength={0.2} />
          <schematicpath points={[{"x":-0.2,"y":0},{"x":0.2,"y":0}]} strokeColor="#880000" />
          <schematictext schX={0} schY={0.28} text="{NAME}" fontSize={0.2} anchor="bottom_center" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C151135"
  ]
}}
      manufacturerPartNumber="0466001.NRHF"
      footprint="smdpads2_p2.89mm_pw1.1901mm_ph1.728mm_cyw4.5801mm_cyh2.228mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C151135.obj?uuid=7dbd95a5ee9a45949b72cb8147e267ff",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C151135.step?uuid=7dbd95a5ee9a45949b72cb8147e267ff",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012699999999199463, z: 0 },
      }}
      {...props}
    />
  )
}