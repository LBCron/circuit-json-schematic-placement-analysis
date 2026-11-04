import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createQuadCapacitorConnector } from "../assets/quad-capacitor-connector"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published quad-capacitor-connector positions and missed connection placement", async () => {
  const json = await createQuadCapacitorConnector()
  expectReproRendered(json, 2)
  for (const [name, x, y] of [
    ["C21", -0.45, 0],
    ["JP1", 1.8, 0],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["C21.pin2", "JP1.pin1", "net.SLOW1"],
    ["C21.pin1", "net.FILTER1"],
    ["JP1.pin2", "net.GND"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(analysis.getIssues()).toEqual([])
  expect(
    createIssueReproSnapshot({
      circuitJson: json,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      showListingIssueMarkers: true,
      width: 1400,
      height: 500,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "network")
})
