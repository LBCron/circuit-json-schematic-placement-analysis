import { Circuit } from "@tscircuit/core"
import type { CircuitJson } from "circuit-json"

export async function createOverlappingSchematicBoxesCircuitJson(): Promise<CircuitJson> {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint="soic8"
        schX={0}
        schY={0}
        pinLabels={{
          pin1: "VCC",
          pin2: "GND",
        }}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        schX={0.9}
        schY={0.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  return circuit.getCircuitJson()
}
