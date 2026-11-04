import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createClimateChipTestPoints } from "../assets/climate-chip-test-points"

const hostPins = (json: CircuitJson) => {
  const host = getReproSchematicComponent(json, "U1")
  return json.filter(
    (e) =>
      e.type === "schematic_port" &&
      e.schematic_component_id === host.schematic_component_id,
  )
}

test("corrects the published UART test points without changing connections or host pin layout", async () => {
  const before = await createClimateChipTestPoints(),
    after = await createClimateChipTestPoints(true)
  expectReproRendered(before, 3)
  expectReproRendered(after, 3)
  expect(electricalSignature(after)).toEqual(electricalSignature(before))
  expect(getReproSchematicComponent(after, "U1")).toEqual(
    getReproSchematicComponent(before, "U1"),
  )
  expect(hostPins(after)).toEqual(hostPins(before))
  const analysis = analyzeSchematicPlacement(before),
    corrected = analyzeSchematicPlacement(after)
  const issues = analysis.getIssues({
    issueTypes: ["ChipPinTestPointNotAligned"],
  })
  expect(issues).toHaveLength(2)
  expect(corrected.getIssues()).toEqual([])
  expectVisibleConnection(after, "U1", "pin30", "TP9", "pin1")
  expectVisibleConnection(after, "U1", "pin31", "TP10", "pin1")
  expect(
    createPlacementComparisonSvg({
      subject: "UART test points",
      centerEachPanel: true,
      panelHeight: 900,
      padding: { left: 1, right: 1, top: 0.8, bottom: 0.9 },
      backgroundColor: "#f5f1ed",
      before: { circuitJson: before, analysis },
      after: { circuitJson: after, analysis: corrected },
      issues,
      contextSourceComponentIds: before.flatMap((e) =>
        e.type === "source_component" ? [e.source_component_id] : [],
      ),
      beforeDiagnostic: (issue) =>
        issue.lineItemType === "ChipPinTestPointNotAligned"
          ? `${issue.testPointSchematicBox.sourceComponentName}: test point is far above its connected chip pin.`
          : issue.lineItemType,
      afterDiagnostic:
        "Two short, continuous wires beside RXD0 and TXD0.\nComplete 3-component extract: 0 reported issues.",
      note: "Published UART test points extract. Chip symbol and all pin positions preserved; electrical connections unchanged.",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "comparison")
  expect(
    stackSvgsVertically(
      [
        renderIssueOverlay({
          circuitJson: after,
          analysis: corrected,
          showFullSchematic: true,
          showOverlay: false,
          width: 1400,
          height: 900,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 3-component UART test points extract.\nFull analysis of the extract: 0 reported issues.",
          1400,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-extract")
})
