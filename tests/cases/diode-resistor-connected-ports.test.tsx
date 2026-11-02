import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { analyzeSchematicPlacement } from "lib/index"
import { expectReproNets } from "../fixtures/placement-repro-assertions"

test("reports the same misaligned diode resistor terminals through wires and named-net stubs", async () => {
  for (const connection of [
    "direct",
    "named-net",
    "aligned-labelled",
    "distant-labelled",
  ] as const) {
    const circuit = new Circuit()
    circuit.add(
      <board routingDisabled>
        <led name="D1" schX={0} schY={0} />
        <resistor
          name="R1"
          resistance="1k"
          schX={connection === "distant-labelled" ? 12 : 2}
          schY={connection === "aligned-labelled" ? 0 : 2}
        />
        {connection === "direct" && (
          <trace from=".D1 > .cathode" to=".R1 > .pin1" />
        )}
        {connection !== "direct" && (
          <>
            <net name="SIGNAL" />
            <trace from=".D1 > .cathode" to="net.SIGNAL" />
            <trace from=".R1 > .pin1" to="net.SIGNAL" />
          </>
        )}
      </board>,
    )
    await circuit.renderUntilSettled()
    const circuitJson = circuit.getCircuitJson()
    const analysis = analyzeSchematicPlacement(circuitJson)
    const issues = analysis.getIssues({
      issueTypes: ["DiodeResistorNotAligned"],
    })
    expectReproNets(circuitJson, [
      connection === "direct"
        ? ["D1.cathode", "R1.pin1"]
        : ["D1.cathode", "R1.pin1", "net.SIGNAL"],
    ])
    if (connection === "direct") {
      expect(issues).toHaveLength(1)
      expect(issues[0]).toMatchObject({
        diodeSchematicBox: { sourceComponentName: "D1" },
        resistorSchematicBox: { sourceComponentName: "R1" },
      })
    } else {
      // Source connectivity identifies the pair even when core draws labelled stubs.
      if (connection === "named-net") {
        expect(issues).toHaveLength(1)
        expect(issues[0]).toMatchObject({
          diodeSchematicBox: { sourceComponentName: "D1" },
          resistorSchematicBox: { sourceComponentName: "R1" },
        })
      } else expect(issues).toEqual([])
      if (connection === "aligned-labelled") continue
      expect(
        circuitJson.filter(
          (e) =>
            e.type === "schematic_text" &&
            e.text === "SIGNAL" &&
            e.source_trace_id,
        ),
      ).toHaveLength(2)
      expect(
        circuitJson.filter((e) => e.type === "schematic_trace"),
      ).toHaveLength(2)
    }
  }
})
