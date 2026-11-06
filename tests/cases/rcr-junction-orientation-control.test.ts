import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createRcrJunction } from "../assets/rcr-junction"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import { electricalPinSignature } from "../fixtures/placement-correction-assertions"

test("fixing the known capacitor orientation leaves the distinct RCR grouping issue", async () => {
  const original = await createRcrJunction(),
    oriented = await createRcrJunction(false, true)
  expect(electricalPinSignature(oriented)).toEqual(
    electricalPinSignature(original),
  )
  const analysis = analyzeSchematicPlacement(oriented)
  expect(analysis.getIssues().map((i) => i.lineItemType)).toEqual([
    "RcrJunctionNotGrouped",
  ])
  expect(analysis.getIssueCounts().RcrJunctionNotGrouped).toBe(1)
  expect(
    createIssueReproSnapshot({
      circuitJson: oriented,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      showListingIssueMarkers: true,
      width: 1200,
      height: 800,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "grouping-remains")
})
