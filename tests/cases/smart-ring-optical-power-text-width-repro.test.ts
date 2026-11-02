import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { smartRingTextWidth } from "../assets/smart-ring-text-width"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the oversized OpticalPower annotation bounds", () => {
  const analysis = analyzeSchematicPlacement(smartRingTextWidth, {
    issueTypes: ["SchematicTextCollision"],
  })
  expect(
    analysis.getIssues({ schematicSheetId: "schematic_sheet_19" }),
  ).toMatchObject([
    {
      schematicTextId: "schematic_text_314",
      text: "R30 - 1k resistor limits inrush",
      collidingObject: { type: "trace", id: "schematic_trace_136" },
    },
    {
      schematicTextId: "schematic_text_315",
      text: "into the LED supply reservoir.",
      collidingObject: { type: "trace", id: "schematic_trace_136" },
    },
  ])
  expect(
    createIssueReproSnapshot({
      circuitJson: smartRingTextWidth,
      analysis,
      schematicSheetId: "schematic_sheet_19",
      issueTypes: ["SchematicTextCollision"],
      viewportBounds: { left: -13, right: -8.5, top: 1, bottom: -6.5 },
      width: 1000,
      height: 1000,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
  expect(
    createIssueReproSnapshot({
      circuitJson: smartRingTextWidth,
      analysis,
      schematicSheetId: "schematic_sheet_19",
      issueTypes: ["SchematicTextCollision"],
      showOverlay: false,
      showTextBoundsFor: ["schematic_text_314", "schematic_text_315"],
      viewportBounds: { left: -12.8, right: -9.1, top: -1.8, bottom: -3.1 },
      width: 1000,
      height: 400,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "text-bounds")
})
