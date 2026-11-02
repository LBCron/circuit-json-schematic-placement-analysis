import { Circuit } from "@tscircuit/core"
import { Fragment } from "react"
import { R } from "./resistor"
import { KT_0603R } from "./KT_0603R"
// Published AnasSarkiz/pa25-12v-brushed-dc-motor-controller-stm32c071-drv8874
// release 8e71559d-e448-465a-a353-7a04b686b6ff, 0.1.0-dev.9, lib/io.tsx.
// https://tscircuit.com/AnasSarkiz/pa25-12v-brushed-dc-motor-controller-stm32c071-drv8874#schematic
// Complete three-pair indicator section; translate source Y by +12.35.
// Original resistor wrapper, LED import, pin assignments and values retained.
export async function createPa25LabelledIndicators(
  after = false,
  singlePair = false,
) {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(
    <board schTraceAutoLabelEnabled={after ? false : undefined}>
      {["POWER", "STATUS", "FAULT"].map((signal, i) =>
        singlePair && i !== 1 ? null : (
          <Fragment key={signal}>
            <R
              name={`R${43 + i}`}
              resistance="1k"
              schX={after ? (i - 1) * 4 : -11.7 + i * 7.8}
              schY={after ? 1.6 : 0}
              schRotation={after || i === 0 ? -90 : 0}
              connections={{
                pin1: `net.${i === 0 ? "V3V3" : signal + "_LED"}`,
                pin2: `net.${signal}_LED_A`,
              }}
            />
            <KT_0603R
              name={`LED${i + 1}`}
              color="red"
              schX={after ? (i - 1) * 4 : -7.8 + i * 7.8}
              schY={0}
              schRotation={-90}
              connections={{ anode: `net.${signal}_LED_A`, cathode: "net.GND" }}
            />
            {after && (
              <trace
                from={`.R${43 + i} > .pin2`}
                to={`.LED${i + 1} > .anode`}
              />
            )}
          </Fragment>
        ),
      )}
      <net name="V3V3" isPowerNet />
      <net name="GND" isGroundNet />
    </board>,
  )
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
