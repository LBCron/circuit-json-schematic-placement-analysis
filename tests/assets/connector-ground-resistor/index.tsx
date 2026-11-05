import { Circuit } from "@tscircuit/core"
// Published board: https://tscircuit.com/seveibar/nema17-stepper-motor-driver-tmc2209-usb-pd?version=0.2.0#schematic
// Package release: f486f4b1-5d32-45df-a843-ed5da5f2d755
// Complete selected sheet retained in published.circuit.json; TSX extracts the affected components.
import pinLabels from "./pin-labels.json"
// Three-component programming-USB extract from seveibar/nema17-stepper-motor-driver-tmc2209-usb-pd.
export function Usb() {
  return (
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={7}>
      <net name="GND" isGroundNet />
      <net name="VBUS" isPowerNet />
      <connector
        name="J_USB"
        standard="usb_c"
        manufacturerPartNumber="TYPE_C_16PIN_2MD_073_"
        pinLabels={pinLabels}
        schX={2}
        schY={0.5}
        schWidth={2.1}
        schHeight={5.4}
        noConnect={["A8", "B8"]}
        connections={{
          A4B9: "net.VBUS",
          B4A9: "net.VBUS",
          A1B12: "net.GND",
          B1A12: "net.GND",
          EH1: "net.GND",
          EH2: "net.GND",
          pin13_alt1: "net.GND",
          pin14_alt1: "net.GND",
          A6: "net.USB_DP_JOIN",
          B6: "net.USB_DP_JOIN",
          A7: "net.USB_DN_JOIN",
          B7: "net.USB_DN_JOIN",
        }}
      />
      <resistor
        name="R_CC1"
        resistance="5.1k"
        manufacturerPartNumber="0402WGF5101TCE"
        footprint="0402"
        schX={-3}
        schY={-3.5}
        schRotation={270}
        connections={{ pin1: ".J_USB > .A5", pin2: "net.GND" }}
      />
      <resistor
        name="R_CC2"
        resistance="5.1k"
        manufacturerPartNumber="0402WGF5101TCE"
        footprint="0402"
        schX={-1.3}
        schY={-3.5}
        schRotation={270}
        connections={{ pin1: ".J_USB > .B5", pin2: "net.GND" }}
      />
    </board>
  )
}

export async function createConnectorGroundResistor() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(<Usb />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
