import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createRailNetLabelOrientationCircuitJson } from "../assets/rail-net-label-orientation"
import { createSchematicAnalysisFixtureSvg } from "../fixtures/create-schematic-analysis-fixture-svg"

test("detects sideways and inverted rail net labels and clears when properly oriented", () => {
  const circuitJson = createRailNetLabelOrientationCircuitJson()
  const analysis = analyzeSchematicPlacement(circuitJson, {
    issueTypes: ["RailNetLabelHasIncorrectOrientation"],
  })
  const issues = analysis.getIssues()

  expect(issues).toHaveLength(4)
  expect(issues).toMatchObject([
    {
      lineItemType: "RailNetLabelHasIncorrectOrientation",
      schematicNetLabelId: "schematic_net_label_vbus_side",
      hostSchematicBox: { sourceComponentName: "J1" },
      text: "VBUS",
      railType: "power",
      anchorSide: "right",
      expectedAnchorSide: "bottom",
      expectedFacingDirection: "up",
    },
    {
      lineItemType: "RailNetLabelHasIncorrectOrientation",
      schematicNetLabelId: "schematic_net_label_vbus_top",
      hostSchematicBox: { sourceComponentName: "J1" },
      text: "VBUS",
      railType: "power",
      anchorSide: "top",
      expectedAnchorSide: "bottom",
      expectedFacingDirection: "up",
    },
    {
      lineItemType: "RailNetLabelHasIncorrectOrientation",
      schematicNetLabelId: "schematic_net_label_gnd_side",
      hostSchematicBox: { sourceComponentName: "J1" },
      text: "GND",
      railType: "ground",
      anchorSide: "left",
      expectedAnchorSide: "top",
      expectedFacingDirection: "down",
    },
    {
      lineItemType: "RailNetLabelHasIncorrectOrientation",
      schematicNetLabelId: "schematic_net_label_gnd_bot",
      hostSchematicBox: { sourceComponentName: "J1" },
      text: "GND",
      railType: "ground",
      anchorSide: "bottom",
      expectedAnchorSide: "top",
      expectedFacingDirection: "down",
    },
  ])

  expect(analysis.toString()).toContain("<RailNetLabelHasIncorrectOrientation")
  expect(analysis.toString()).toContain('expectedAnchorSide="top"')
  expect(analysis.toString()).toContain('expectedAnchorSide="bottom"')

  const correctedCircuitJson = createRailNetLabelOrientationCircuitJson({
    corrected: true,
  })
  expect(
    analyzeSchematicPlacement(correctedCircuitJson, {
      issueTypes: ["RailNetLabelHasIncorrectOrientation"],
    }).getIssues(),
  ).toEqual([])

  expect(
    createSchematicAnalysisFixtureSvg({
      circuitJson,
      analysis,
      highlightIssues: ["RailNetLabelHasIncorrectOrientation"],
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
