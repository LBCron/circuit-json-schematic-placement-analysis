import { Circuit } from "@tscircuit/core"

// Three-component bias-filter junction from abse/boostxl-audio v1.0.9.
// Source: index.circuit.tsx, Electret Microphone Preamplifier.
// MIC_PWR and U5_IN_PLUS are the unchanged external boundary nets.
export default function RcrJunction() {
  return (
    <board routingDisabled>
      <net name="GND" isGroundNet />
      <net name="MIC_PWR" />
      <net name="U5_IN_PLUS" />
      <resistor
        footprint="0603"
        name="R32"
        resistance="3k"
        schX={-3}
        schY={1.2}
        schRotation={0}
        connections={{ pin1: "net.MIC_PWR" }}
      />
      <resistor
        footprint="0603"
        name="R35"
        resistance="47k"
        schX={-1.8}
        schY={-0.4}
        schRotation={90}
        connections={{ pin1: ".R32 > .pin2", pin2: "net.U5_IN_PLUS" }}
      />
      <capacitor
        footprint="0603"
        name="C22"
        capacitance="0.47uF"
        schX={-3.3}
        schY={-3.4}
        schRotation={90}
        connections={{ pin1: ".R32 > .pin2", pin2: "net.GND" }}
      />
    </board>
  )
}
export async function createRcrJunction() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(<RcrJunction />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
