import { Circuit } from "@tscircuit/core"
// Published board: https://tscircuit.com/seveibar/ch552t-photo-diode?version=1.0.2#schematic
// Package release: 8931680f-ea6e-4076-a647-d14256d9e2bf.
// Retains the 3-component branch with original symbols, positions, values and wiring.
// The surrounding board is outside this extract.
const pins = {
  pin1: "P3_2_AIN3",
  pin2: "P1_4_AIN1_CC1",
  pin3: "P1_5_AIN2_CC2",
  pin4: "P1_6",
  pin5: "P1_7_LED",
  pin6: "RST",
  pin7: "P1_0",
  pin8: "P1_1_AIN0",
  pin9: "P3_1_TXD",
  pin10: "P3_0_RXD",
  pin11: "P3_3",
  pin12: "P3_4",
  pin13: "P3_5",
  pin14: "UDP",
  pin15: "UDM",
  pin16: "P1_3_XO",
  pin17: "P1_2_XI",
  pin18: "GND",
  pin19: "VCC",
  pin20: "V33",
} as const
function LedBranch({ after = false }: { after?: boolean }) {
  return (
    <board routingDisabled>
      <chip
        name="U1"
        manufacturerPartNumber="CH552T"
        supplierPartNumbers={{ jlcpcb: ["C111367"] }}
        footprint="tssop20"
        pinLabels={pins}
        schPortArrangement={{
          leftSide: {
            pins: [
              "P3_2_AIN3",
              "P1_4_AIN1_CC1",
              "P1_5_AIN2_CC2",
              "P1_6",
              "P1_7_LED",
              "RST",
              "P1_0",
              "P1_1_AIN0",
              "P3_1_TXD",
              "P3_0_RXD",
            ],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["P3_3", "P3_4", "P3_5", "UDP", "UDM", "P1_3_XO", "P1_2_XI"],
            direction: "top-to-bottom",
          },
          topSide: { pins: ["VCC", "V33"], direction: "left-to-right" },
          bottomSide: { pins: ["GND"], direction: "left-to-right" },
        }}
        schX={0}
        schY={0}
        schHeight={after ? 3.2 : undefined}
      />
      <resistor
        name="R8"
        resistance="1k"
        footprint="0402"
        schX={after ? -3.5 : 1.8}
        schY={after ? 2 : -4.5}
        schRotation={after ? 270 : 0}
      />
      <led
        name="D2"
        color="green"
        footprint="0603"
        schX={after ? -3.5 : 3.3}
        schY={after ? 0.64 : -4.5}
        schRotation={after ? 270 : 0}
      />
      <trace from=".R8 > .pin1" to="net.VBUS5" />
      <trace from=".R8 > .pin2" to=".D2 > .anode" />
      <trace from=".D2 > .cathode" to=".U1 > .pin5" />
      <trace from=".U1 > .pin19" to="net.VBUS5" />
      <trace from=".U1 > .pin18" to="net.GND" />
    </board>
  )
}

export async function createCh552LedResistor(after = false) {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(<LedBranch after={after} />)
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
