// Published source: https://tscircuit.com/mukesh-dev-git/usbc-pd-3s-charger?version=1.0.0#schematic
// Release 7f071791-0b82-4477-936e-47423aed688b, index.circuit.tsx.
// Extract U2/D2/C7/C5 at their published coordinates. Preserve chip pin layout,
// capacitor values, diode polarity and connections within this support network.
// The surrounding charger stages are omitted; this is not the complete charger.
import { Circuit } from "@tscircuit/core"
import { BQ24610 } from "./imports/BQ24610"
import { B5819W_SL } from "./imports/B5819W_SL"
export async function createChargerChipDiodeCapacitor() {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(
    <board schLayout={{ layoutMode: "none" }} schMaxTraceDistance={undefined}>
      <BQ24610 name="U2" schX={4} schY={0} />
      <B5819W_SL
        name="D2"
        schX={9}
        schY={5}
        schRotation={0}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={1.7}
              pcbY={0}
              width={1.2}
              height={0.95}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={-1.7}
              pcbY={0}
              width={1.2}
              height={0.95}
              shape="rect"
            />
          </footprint>
        }
      />
      <capacitor
        name="C7"
        supplierPartNumbers={{ jlcpcb: ["C14663", "C1591", "C91183"] }}
        capacitance="100nF"
        footprint="0603"
        schX={10}
        schY={6}
        schRotation={-90}
      />
      <capacitor
        name="C5"
        supplierPartNumbers={{ jlcpcb: ["C15849", "C5673", "C5199872"] }}
        capacitance="1uF"
        footprint="0603"
        schX={9}
        schY={-2}
        schRotation={-90}
      />
      <trace from="U2.VCC" to="net.VCC_CHG" />
      <trace from="U2.ACN" to="net.VCC_CHG" />
      <trace from="U2.ACP" to="net.VCC_CHG" />
      <trace from="U2.ACSET" to="net.VREF" />
      <trace from="U2.VREF" to="net.VREF" />
      <trace from="U2.GND" to="net.GND" />
      <trace from="U2.EP" to="net.GND" />
      <trace from="D2.anode" to="U2.REGN" />
      <trace from="D2.cathode" to="U2.BTST" />
      <trace from="C7.pin1" to="U2.BTST" />
      <trace from="C7.pin2" to="net.PH" />
      <trace from="U2.PH" to="net.PH" />
      <trace from="C5.pin1" to="U2.REGN" />
      <trace from="C5.pin2" to="net.GND" />
    </board>,
  )
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
