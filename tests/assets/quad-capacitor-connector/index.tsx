// Published source: https://tscircuit.com/hrithik18k/quad-sensor-conditioner#schematic
// v1.0.1, release efcdcc7a-4514-48c6-8ef8-ea0d8bbb0975.
// Channel 1 jumper/filter branch, translated by (+20, -8.5) from the source.
// C21's FILTER1 terminal retains its connection to the surrounding filter.
import { Circuit } from "@tscircuit/core"
export async function createQuadCapacitorConnector() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(
    <board
      schLayout={{ layoutMode: "none" }}
      schTraceAutoLabelEnabled
      schMaxTraceDistance={2}
    >
      <capacitor
        name="C21"
        capacitance="1uF"
        footprint="0805"
        schX={-0.45}
        schY={0}
        schRotation={90}
      />
      <pinheader
        name="JP1"
        pinCount={2}
        footprint="pinrow2"
        schX={1.8}
        schY={0}
        pinLabels={["SLOW", "GND"]}
      />
      <trace name="SLOW1_C21_pin2" from="C21.pin2" to="net.SLOW1" />
      <trace name="SLOW1_JP1_pin1" from="JP1.pin1" to="net.SLOW1" />
      <trace name="FILTER1_C21_pin1" from="C21.pin1" to="net.FILTER1" />
      <trace name="GND_JP1_pin2" from="JP1.pin2" to="net.GND" />
      <net name="GND" isGroundNet />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
