import { Circuit } from "@tscircuit/core"
// Published Devesh36/pocket-audio-player 1.0.12, audio-player-board.tsx.
// https://tscircuit.com/Devesh36/pocket-audio-player#schematic
// Release a3d7fc37-f1b7-4951-b34b-b5867fe6c763; Power sheet.
// Complete R_BAT_TOP / R_BAT_BOT / C_ADC_BAT extract, translated (+19, -11)
// from published schematic centers (-5,15), (-19,11), (-12,7).
// BAT_SENSE retains the external ADC connection as a named boundary net.
export async function createPocketAudioFilteredDivider(
  mode: "original" | "oriented" | "after" = "original",
) {
  const after = mode === "after",
    c = new Circuit()
  c.pcbDisabled = true
  c.add(
    <board schTraceAutoLabelEnabled schMaxTraceDistance={20}>
      <resistor
        name="R_BAT_TOP"
        resistance="100k"
        footprint="0603"
        schX={after ? 0 : 14}
        schY={after ? 2 : 4}
        schRotation={mode === "original" ? 0 : 270}
        connections={{ pin1: "net.VBAT", pin2: "net.BAT_SENSE" }}
      />
      <resistor
        name="R_BAT_BOT"
        resistance="100k"
        footprint="0603"
        schX={0}
        schY={0}
        schRotation={mode === "original" ? 0 : 270}
        connections={{ pin1: "net.BAT_SENSE", pin2: "net.GND" }}
      />
      <capacitor
        name="C_ADC_BAT"
        capacitance="100nF"
        footprint="0603"
        schX={after ? 3 : 7}
        schY={after ? 0 : -4}
        schRotation={270}
        connections={{ pin1: "net.BAT_SENSE", pin2: "net.GND" }}
      />
      <net name="VBAT" isPowerNet />
      <net name="GND" isGroundNet />
    </board>,
  )
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
