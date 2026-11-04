import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createClimateChipTestPoints } from "../assets/climate-chip-test-points"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published climate-chip-test-points positions and missed connection placement", async () => {
  const json = await createClimateChipTestPoints()
  expectReproRendered(json, 3)
  for (const [name, x, y] of [
    ["U1", 0, 0],
    ["TP9", -1, 5],
    ["TP10", 2, 5],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["U1.RXD0", "TP9.pin1"],
    ["U1.TXD0", "TP10.pin1"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(analysis.getIssues().map((i) => i.lineItemType)).toEqual([
    "ChipPinTestPointNotAligned",
    "ChipPinTestPointNotAligned",
  ])
  expect(
    createIssueReproSnapshot({
      circuitJson: json,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      showListingIssueMarkers: true,
      width: 1400,
      height: 900,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "network")
})
