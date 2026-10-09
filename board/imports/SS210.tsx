import type { DiodeProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode","neg"],
  pin2: ["anode","pos"]
} as const

export const SS210 = (props: DiodeProps) => {
  const { name = "D1", ...restProps } = props

  return (
    <diode
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C14996"
  ]
}}
      manufacturerPartNumber="SS210"
      footprint="smdpads2_p4.3998mm_pw2mm_ph2mm_cyw6.8998mm_cyh3.1mm"
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C14996.obj?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C14996.step?uuid=e3551acb3c5a4975a5e9d36087fe1fa2",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999842880061, y: 0, z: -0.1 },
      }}
      {...restProps}
    />
  )
}