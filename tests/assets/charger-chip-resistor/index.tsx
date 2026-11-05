import { Circuit } from "@tscircuit/core"
// Published board: https://tscircuit.com/mukesh-dev-git/usbc-pd-3s-charger?version=1.0.0#schematic
// Package release: 7f071791-0b82-4477-936e-47423aed688b.
// Retains the 2-component branch with original symbols, positions, values and wiring.
// The surrounding board is outside this extract.
import { CH224K } from "./imports/CH224K"
function RailResistor({ after = false }: { after?: boolean }) {
  return (
    <board routingDisabled>
      <CH224K name="U1" schX={-9} schY={2} noConnect={["CFG2", "CFG3", "PG"]} />
      <resistor
        name="R2"
        resistance="10k"
        footprint="0603"
        schX={after ? -6.5 : -11}
        schY={after ? 2.34 : -1}
        schRotation={270}
      />
      <trace from=".R2 > .pin1" to="net.VBUS" />
      <trace from=".R2 > .pin2" to=".U1 > .VBUS" />
    </board>
  )
}

export async function createChargerChipResistor(after = false) {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(<RailResistor after={after} />)
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
