import { Circuit } from "@tscircuit/core"

// Three-component bias-filter junction from abse/boostxl-audio v1.0.9.
// Source: index.circuit.tsx, Electret Microphone Preamplifier.
// MIC_PWR and U5_IN_PLUS are the unchanged external boundary nets.
export default function RcrJunction({
  corrected = false,
  orientOnly = false,
}: {
  corrected?: boolean
  orientOnly?: boolean
}) {
  return (
    <board routingDisabled>
      <net name="GND" isGroundNet />
      <net name="MIC_PWR" />
      <net name="U5_IN_PLUS" />
      <resistor
        footprint="0603"
        name="R32"
        resistance="3k"
        schX={corrected ? -3 : -3}
        schY={1.2}
        schRotation={corrected ? 270 : 0}
        connections={{ pin1: "net.MIC_PWR" }}
      />
      <resistor
        footprint="0603"
        name="R35"
        resistance="47k"
        schX={corrected ? -3 : -1.8}
        schY={corrected ? -1 : -0.4}
        schRotation={corrected ? 270 : 90}
        connections={{ pin1: ".R32 > .pin2", pin2: "net.U5_IN_PLUS" }}
      />
      <capacitor
        footprint="0603"
        name="C22"
        capacitance="0.47uF"
        schX={corrected ? -5 : -3.3}
        schY={corrected ? -1 : -3.4}
        schRotation={corrected || orientOnly ? 270 : 90}
        connections={{ pin1: ".R32 > .pin2", pin2: "net.GND" }}
      />
    </board>
  )
}
export async function createRcrJunction(corrected = false, orientOnly = false) {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(<RcrJunction corrected={corrected} orientOnly={orientOnly} />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
