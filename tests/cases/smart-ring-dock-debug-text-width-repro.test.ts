import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { smartRingTextWidth } from "../assets/smart-ring-text-width"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the oversized DockDebug annotation bounds", () => {
  const analysis = analyzeSchematicPlacement(smartRingTextWidth, {
    issueTypes: ["SchematicTextCollision"],
  })
  expect(
    analysis.getIssues({ schematicSheetId: "schematic_sheet_15" }),
  ).toMatchObject([
    {
      schematicTextId: "schematic_text_249",
      text: "OE supports 3.3V logic, target stays1.8V.",
      collidingObject: { type: "trace", id: "schematic_trace_36" },
    },
  ])
  expect(
    createIssueReproSnapshot({
      circuitJson: smartRingTextWidth,
      analysis,
      schematicSheetId: "schematic_sheet_15",
      issueTypes: ["SchematicTextCollision"],
      viewportBounds: { left: -3.5, right: 2, top: 7.5, bottom: -7.5 },
      width: 1000,
      height: 1000,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
  expect(
    createIssueReproSnapshot({
      circuitJson: smartRingTextWidth,
      analysis,
      schematicSheetId: "schematic_sheet_15",
      issueTypes: ["SchematicTextCollision"],
      showOverlay: false,
      showTextBoundsFor: ["schematic_text_248", "schematic_text_249"],
      viewportBounds: { left: -3.3, right: 1.5, top: -1.8, bottom: -3.1 },
      width: 1000,
      height: 400,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "text-bounds")
})
