import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createOverlappingSchematicBoxesCircuitJson } from "../assets/overlapping-schematic-boxes"
import { createSchematicAnalysisFixtureSvg } from "../fixtures/create-schematic-analysis-fixture-svg"

test("generates a schematic box overlap issue", async () => {
  const overlappingSchematicBoxesCircuitJson =
    await createOverlappingSchematicBoxesCircuitJson()
  const analysis = analyzeSchematicPlacement(
    overlappingSchematicBoxesCircuitJson,
  )
  const overlaps = analysis
    .getIssues()
    .filter((issue) => issue.lineItemType === "ComponentOverlap")
  expect(overlaps).toHaveLength(1)
  expect(overlaps[0]!.overlapWidth).toBeCloseTo(0.1)
  expect(overlaps[0]!.overlapHeight).toBeGreaterThan(0)
  expect(overlaps[0]!.pinBodyOverlaps).toBeUndefined()

  expect(analysis.toString()).not.toContain("<SchematicSheet")

  expect(
    createSchematicAnalysisFixtureSvg({
      circuitJson: overlappingSchematicBoxesCircuitJson,
      analysis,
    }).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path)
})
