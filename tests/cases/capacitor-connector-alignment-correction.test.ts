import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createQuadCapacitorConnector } from "../assets/quad-capacitor-connector"

const hostPins = (json: CircuitJson) => {
  const host = getReproSchematicComponent(json, "JP1")
  return json.filter(
    (e) =>
      e.type === "schematic_port" &&
      e.schematic_component_id === host.schematic_component_id,
  )
}

test("corrects the published jumper/filter branch without changing connections or host pin layout", async () => {
  const before = await createQuadCapacitorConnector(),
    after = await createQuadCapacitorConnector(true)
  expectReproRendered(before, 2)
  expectReproRendered(after, 2)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  expect(getReproSchematicComponent(after, "JP1")).toEqual(
    getReproSchematicComponent(before, "JP1"),
  )
  expect(hostPins(after)).toEqual(hostPins(before))
  const analysis = analyzeSchematicPlacement(before),
    corrected = analyzeSchematicPlacement(after)
  const issues = analysis.getIssues({
    issueTypes: ["CapacitorConnectorNotAligned"],
  })
  expect(issues).toHaveLength(1)
  expect(corrected.getIssues()).toEqual([])
  expectVisibleConnection(after, "JP1", "pin1", "C21", "pin2")
  expect(
    createPlacementComparisonSvg({
      subject: "jumper/filter branch",
      centerEachPanel: true,
      panelHeight: 520,
      padding: { left: 1, right: 1, top: 0.8, bottom: 0.9 },
      backgroundColor: "#f5f1ed",
      before: { circuitJson: before, analysis },
      after: { circuitJson: after, analysis: corrected },
      issues,
      contextSourceComponentIds: before.flatMap((e) =>
        e.type === "source_component" ? [e.source_component_id] : [],
      ),
      beforeDiagnostic: (issue) =>
        issue.lineItemType === "CapacitorConnectorNotAligned"
          ? `${issue.capacitorSchematicBox.sourceComponentName} / JP1: capacitor is behind its connected header pin.`
          : issue.lineItemType,
      afterDiagnostic:
        "C21 is on the connected header pin side, joined by a straight wire.\nComplete 2-component extract: 0 reported issues.",
      note: "Published jumper/filter branch extract. Header symbol, pin order and capacitance preserved; electrical connections unchanged.",
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
          height: 500,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 2-component jumper/filter branch extract.\nFull analysis of the extract: 0 reported issues.",
          1400,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-extract")
})
