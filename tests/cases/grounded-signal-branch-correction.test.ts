import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createGroundedSignalBranch } from "../assets/grounded-signal-branch"
import { createQuadSensorConditioner } from "../assets/quad-sensor-conditioner"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import { createSectionedSchematicSnapshot } from "../fixtures/create-sectioned-schematic-snapshot"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import { expectReproRendered } from "../fixtures/placement-repro-assertions"

const fixedSymbols = (j: CircuitJson) => {
  const ids = new Set(
    j.flatMap((e) =>
      e.type === "source_component" &&
      ["simple_chip", "simple_pin_header"].includes(e.ftype)
        ? [e.source_component_id]
        : [],
    ),
  )
  const components = j.filter(
    (e) => e.type === "schematic_component" && ids.has(e.source_component_id!),
  )
  const schIds = new Set(
    components.flatMap((e) =>
      e.type === "schematic_component" ? [e.schematic_component_id] : [],
    ),
  )
  return [
    ...components,
    ...j
      .filter(
        (e) =>
          e.type === "schematic_port" && schIds.has(e.schematic_component_id!),
      )
      .map((e) => {
        if (e.type !== "schematic_port") return e
        const { is_connected, ...geometry } = e
        return geometry
      }),
  ]
}
test("turns ground pins downward without changing circuit topology or fixed symbols", async () => {
  for (const full of [false, true]) {
    const build = full
      ? createQuadSensorConditioner
      : createGroundedSignalBranch
    const before = await build(),
      after = await build(true)
    expectReproRendered(after, full ? 38 : 3)
    expect(electricalPinSignature(after)).toEqual(
      electricalPinSignature(before),
    )
    expect(fixedSymbols(after)).toEqual(fixedSymbols(before))
    const analysis = analyzeSchematicPlacement(before),
      corrected = analyzeSchematicPlacement(after)
    expect(analysis.getIssues()).toHaveLength(full ? 12 : 1)
    expect(corrected.getIssues()).toEqual([])
    if (full)
      for (let n = 1; n <= 4; n++)
        expectVisibleConnection(after, `JP${n}`, "pin1", `C2${n}`, "pin2")
    if (!full) {
      expect(
        createPlacementComparisonSvg({
          subject: "sensor output filter",
          before: { circuitJson: before, analysis },
          after: { circuitJson: after, analysis: corrected },
          issues: analysis.getIssues(),
          centerEachPanel: true,
          panelHeight: 600,
          backgroundColor: "#f5f1ed",
          contextSourceComponentIds: before.flatMap((e) =>
            e.type === "source_component" ? [e.source_component_id] : [],
          ),
          beforeDiagnostic: () =>
            "C31: ground pin points above the signal branch.",
          afterDiagnostic:
            "Ground below the signal; original pins and values preserved.\nComplete 3-component extract: 0 reported issues.",
          note: "Output filter from quad-sensor-conditioner v1.0.1. The full board has eight equivalent grounded capacitors.",
        }),
      ).toMatchSvgSnapshot(import.meta.path, "comparison")
    } else {
      expect(
        createSectionedSchematicSnapshot({
          circuitJson: after,
          analysis: corrected,
          sections: [
            {
              title: "Power",
              componentNames: ["J1", "C1", "C2", "R1", "LED1"],
            },
            {
              title: "Quad buffer",
              componentNames: ["U1"],
            },
            ...[1, 2, 3, 4].map((n) => ({
              title: `Channel ${n}: input filter, slow filter and output`,
              componentNames: [
                `JI${n}`,
                `R1${n}`,
                `C1${n}`,
                `C2${n}`,
                `JP${n}`,
                `R2${n}`,
                `C3${n}`,
                `JO${n}`,
              ],
            })),
          ],
        }),
      ).toMatchSvgSnapshot(import.meta.path, "full-sheet")
    }
  }
})
