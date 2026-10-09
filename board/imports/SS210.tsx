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
      // Hand-written copy of "smdpads2_p4.3998mm_pw2mm_ph2mm_cyw6.8998mm_cyh3.1mm": pinned
      // tscircuit doesn't rotate a footprinter string's courtyard rect with the part, which
      // gives false courtyard overlaps for the rotated way diodes. An outline rotates.
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-2.1999mm" pcbY="0mm" width="2mm" height="2mm" shape="rect" />
        <smtpad portHints={["pin2"]} pcbX="2.1999mm" pcbY="0mm" width="2mm" height="2mm" shape="rect" />
        <silkscreenpath route={[{ x: -3.5, y: -1.2 }, { x: -3.5, y: 1.2 }]} strokeWidth="0.2mm" />
        <courtyardoutline outline={[{ x: -3.4499, y: -1.55 }, { x: 3.4499, y: -1.55 }, { x: 3.4499, y: 1.55 }, { x: -3.4499, y: 1.55 }]} />
      </footprint>}
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