import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createRcrJunction } from "../assets/rcr-junction"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects rcr-junction with unchanged electrical connections and original symbols", async () => {
  const before = await createRcrJunction(),
    after = await createRcrJunction(true)
  expectReproRendered(before, 3)
  expectReproRendered(after, 3)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({ issueTypes: ["RcrJunctionNotGrouped"] })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  expectVisibleConnection(after, "R32", "pin2", "R35", "pin1")
  expectVisibleConnection(after, "R32", "pin2", "C22", "pin1")
  expectVisibleConnection(after, "R35", "pin1", "C22", "pin1")
  for (const name of ["R32", "R35", "C22"]) {
    expect(
      box(after, name).symbol_name?.replace(/_(up|down|left|right)$/, ""),
    ).toBe(box(before, name).symbol_name?.replace(/_(up|down|left|right)$/, ""))
  }
  expect(baseline.schematicIssuesToString(issues[0]!)).toContain(
    "<RcrJunctionNotGrouped ",
  )
  expect(
    createPlacementComparisonSvg({
      subject: "R-C-R junction",
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
        "R32 / R35 / C22: shared junction spread across separate blocks.\nThe original also has an existing inverted-ground warning.",
      afterDiagnostic:
        "The three-way junction is grouped, with ground below C22.\nComplete extract: 0 reported issues.",
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
