// Placeholder board: proves the pinned toolchain builds and exports end to end.
// Replaced by the rev A schematic and layout.
export default () => (
  <board
    width="30mm"
    height="20mm"
    nominalTraceWidth="0.25mm"
    minViaHoleDiameter="0.3mm"
    minViaPadDiameter="0.6mm"
  >
    <resistor
      name="R1"
      resistance="10k"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      pcbX={-5}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0603"
      supplierPartNumbers={{ jlcpcb: ["C14663"] }}
      pcbX={5}
    />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
  </board>
)
