import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createSameComponentNetLabelCollisionCircuitJson } from "../assets/same-component-net-label-collision"
import { createSchematicAnalysisFixtureSvg } from "../fixtures/create-schematic-analysis-fixture-svg"

test("detects overlapping net-label flags on the same component and ignores edge-touching 0.2-pitch flags", () => {
  const circuitJson = createSameComponentNetLabelCollisionCircuitJson()
  const analysis = analyzeSchematicPlacement(circuitJson, {
    issueTypes: ["SameComponentNetLabelCollision"],
  })
  const issues = analysis.getIssues()

  expect(issues).toHaveLength(3)
  expect(issues).toMatchObject([
    {
      lineItemType: "SameComponentNetLabelCollision",
      schematicBox: { sourceComponentName: "U1" },
      firstText: "QSPI_SS",
      secondText: "QSPI_SD0",
    },
    {
      lineItemType: "SameComponentNetLabelCollision",
      schematicBox: { sourceComponentName: "U1" },
      firstText: "QSPI_SD0",
      secondText: "QSPI_SCLK",
    },
    {
      lineItemType: "SameComponentNetLabelCollision",
      schematicBox: { sourceComponentName: "U1" },
      firstText: "USB_DP_A",
      secondText: "USB_DM_A",
    },
  ])

  expect(analysis.toString()).toContain("<SameComponentNetLabelCollision")
  expect(analysis.toString()).toContain('componentName="U1"')

  const spacedControl = createSameComponentNetLabelCollisionCircuitJson({
    pinPitch: 0.2,
    separateSideStub: true,
  })
  expect(
    analyzeSchematicPlacement(spacedControl, {
      issueTypes: ["SameComponentNetLabelCollision"],
    }).getIssues(),
  ).toEqual([])

  expect(
    createSchematicAnalysisFixtureSvg({
      circuitJson,
      analysis,
      highlightIssues: ["SameComponentNetLabelCollision"],
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
