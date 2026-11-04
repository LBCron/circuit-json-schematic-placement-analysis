// Published source: https://tscircuit.com/arnavk-09/climate-sensor-node#schematic
// v1.1.0, release 46ff6d0b-bb4f-4e4a-a478-bcd4915c40ad.
// UART extract: original U1/TP9/TP10 positions, imported symbol and pin layout.
// Other chip connections are outside this extract.
import { Circuit } from "@tscircuit/core"
import { ESP32_C3_MINI_1_N4 } from "./ESP32_C3_MINI_1_N4"
export async function createClimateChipTestPoints() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(
    <board
      schLayout={{ layoutMode: "none" }}
      schTraceAutoLabelEnabled
      schMaxTraceDistance={2}
    >
      <ESP32_C3_MINI_1_N4
        name="U1"
        schX={0}
        schY={0}
        schHeight="6.2mm"
        pinAttributes={{
          "3V3": { requiresPower: true },
          GND1: { requiresGround: true },
        }}
      />
      <testpoint
        name="TP9"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.2mm"
        schX={-1}
        schY={5}
      />
      <testpoint
        name="TP10"
        footprintVariant="pad"
        padShape="circle"
        padDiameter="1.2mm"
        schX={2}
        schY={5}
      />
      <trace name="T_TP9__UART_RX" from="TP9.pin1" to="U1.RXD0" />
      <trace name="T_TP10__UART_TX" from="TP10.pin1" to="U1.TXD0" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
