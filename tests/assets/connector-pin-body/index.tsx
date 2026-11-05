import { Circuit } from "@tscircuit/core"
// Published board: https://tscircuit.com/abse/boostxl-uln2003?version=1.0.5#schematic
// Package release: 92d10956-aa95-4eba-8e98-42e66c16f463
// Complete selected sheet retained in published.circuit.json; TSX extracts the affected components.
// Extract of abse/boostxl-uln2003: J7/J8 retain their pin order, values and nets.
const labels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"],
  pin5: ["pin5"],
  pin6: ["pin6"],
} as const
export function Headers({ after = false }: { after?: boolean }) {
  return (
    <board routingDisabled schMaxTraceDistance={1.2} schTraceAutoLabelEnabled>
      <net name="VCC" isPowerNet />
      {["J7", "J8"].map((name, k) => (
        <chip
          key={name}
          name={name}
          manufacturerPartNumber="A_2_54_1_6P_"
          pinLabels={labels}
          schX={after ? 8.2 : 8.2 + 3.2 * k}
          schY={after ? 3.5 - 2 * k : 3.5}
          schWidth={3.2}
          schHeight={after ? 0.8 : 3.2}
          connections={{
            pin1: `net.${k ? "M2_CH5" : "M1_CH1"}`,
            pin2: `net.${k ? "M2_CH6" : "M1_CH2"}`,
            pin3: `net.${k ? "M2_CH7" : "M1_CH3"}`,
            pin4: `net.${k ? "M2_CH8" : "M1_CH4"}`,
            pin5: "net.VCC",
            pin6: "net.VCC",
          }}
        />
      ))}
    </board>
  )
}

export async function createConnectorPinBody(after = false) {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(<Headers after={after} />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
