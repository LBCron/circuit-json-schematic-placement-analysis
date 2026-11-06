import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createBranchOrder } from "../assets/branch-order"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects branch-order with unchanged electrical connections and original symbols", async () => {
  const before = await createBranchOrder(),
    after = await createBranchOrder(true)
  expectReproRendered(before, 3)
  expectReproRendered(after, 3)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({
    issueTypes: ["ComponentBranchesOutOfOrder"],
  })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  for (const name of ["U_DRV12", "RS_M1", "RS_M2"]) {
    expect(box(after, name).symbol_name).toBe(box(before, name).symbol_name)
  }
  const chip = box(before, "U_DRV12"),
    fixed = box(after, "U_DRV12")
  expect(fixed).toEqual(chip)
  expect(
    after.filter(
      (e) =>
        e.type === "schematic_port" &&
        e.schematic_component_id === fixed.schematic_component_id,
    ),
  ).toEqual(
    before.filter(
      (e) =>
        e.type === "schematic_port" &&
        e.schematic_component_id === chip.schematic_component_id,
    ),
  )
  expectVisibleConnection(after, "U_DRV12", "pin3", "RS_M1", "pin1")
  expectVisibleConnection(after, "U_DRV12", "pin6", "RS_M2", "pin1")
  expect(baseline.schematicIssuesToString(issues[0]!)).toContain(
    '<ComponentBranchesOutOfOrder hostComponentName="U_DRV12"',
  )
  expect(
    createPlacementComparisonSvg({
      subject: "component branch order",
      panelHeight: 850,
      backgroundColor: "#f5f1ed",
      centerEachPanel: false,
      before: { circuitJson: before, analysis: baseline },
      after: { circuitJson: after, analysis },
      issues,
      contextSourceComponentIds: before.flatMap((e) =>
        e.type === "source_component" ? [e.source_component_id] : [],
      ),
      beforeDiagnostic: () =>
        "RS_M1 / RS_M2: reversed branch order creates crossed wires.",
      afterDiagnostic:
        "Branches follow their chip-pin order without crossing.\nComplete extract: 0 reported issues.",
      note: "Complete 3-component extract. Values and pin connections preserved. Original board context is retained in the repro snapshot.",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "comparison")
  expect(
    stackSvgsVertically(
      [
        renderIssueOverlay({
          circuitJson: after,
          analysis,
          showFullSchematic: true,
          showOverlay: false,
          width: 1200,
          height: 800,
        }).svg,
        createAnalyzerTextSvg(
          "Complete corrected 3-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-extract")
})
