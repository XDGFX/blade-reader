import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["Z"],
  pin2: ["Y7"],
  pin3: ["Y6"],
  pin4: ["Y5"],
  pin5: ["Y4"],
  pin6: ["Y3"],
  pin7: ["Y2"],
  pin8: ["Y1"],
  pin9: ["Y0"],
  pin10: ["S0"],
  pin11: ["S1"],
  pin12: ["GND"],
  pin13: ["S3"],
  pin14: ["S2"],
  pin15: ["N_E"],
  pin16: ["Y15"],
  pin17: ["Y14"],
  pin18: ["Y13"],
  pin19: ["Y12"],
  pin20: ["Y11"],
  pin21: ["Y10"],
  pin22: ["Y9"],
  pin23: ["Y8"],
  pin24: ["VCC"]
} as const

const pinAttributes = {
  pin12: {requiresGround: true},
  pin24: {requiresPower: true}
} as const

export const A_74HC4067PW_118 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C179326"
  ]
}}
      manufacturerPartNumber="74HC4067PW,118"
      footprint={<footprint>
        <smtpad portHints={["pin6"]} pcbX="-0.324866mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-0.974852mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.624838mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-2.274824mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-2.92481mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-3.574796mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="0.324866mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="3.574796mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="2.925064mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="2.275078mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="1.625092mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="0.975106mm" pcbY="-3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="-0.974852mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="-1.624838mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin22"]} pcbX="-2.274824mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin23"]} pcbX="-2.92481mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin24"]} pcbX="-3.574796mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="-0.324866mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="3.574796mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="2.925064mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="2.275078mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="1.625092mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="0.975106mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="0.324866mm" pcbY="3.0226mm" width="0.3999992mm" height="1.6500094mm" shape="rect" />
<silkscreenpath route={[{"x":3.937000000000012,"y":1.9049999999999727},{"x":3.937000000000012,"y":-1.9050000000000864}]} />
<silkscreenpath route={[{"x":-3.8862000000001444,"y":-1.7526000000000295},{"x":-3.8862000000001444,"y":-1.9050000000000864},{"x":3.937000000000012,"y":-1.9050000000000864}]} />
<silkscreenpath route={[{"x":-3.8862000000001444,"y":1.7526000000000295},{"x":-3.8862000000001444,"y":1.9049999999999727},{"x":3.937000000000012,"y":1.9049999999999727}]} />
<silkscreenpath route={[{"x":-3.8862000000001444,"y":0.48260000000004766},{"x":-3.8862000000001444,"y":1.7526000000000295}]} />
<silkscreenpath route={[{"x":-3.8862000000001444,"y":-1.7526000000000295},{"x":-3.8862000000001444,"y":-0.48260000000004766}]} />
<silkscreenpath route={[{"x":-3.8862000000001444,"y":0.4572000000001708},{"x":-3.8862000000001444,"y":-0.48260000000004766}]} />
<silkscreentext text="{NAME}" pcbX="-0mm" pcbY="4.8354mm" anchorAlignment="center" fontSize="1mm" />
<courtyardoutline outline={[{"x":-4.149992200000042,"y":4.0976047000000335},{"x":4.149992199999929,"y":4.0976047000000335},{"x":4.149992199999929,"y":-4.0976047000000335},{"x":-4.149992200000042,"y":-4.0976047000000335},{"x":-4.149992200000042,"y":4.0976047000000335}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C179326.obj?uuid=4564b07290534b8ea1373eede2664361",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C179326.step?uuid=4564b07290534b8ea1373eede2664361",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0, z: -0.019205 },
      }}
      {...props}
    />
  )
}