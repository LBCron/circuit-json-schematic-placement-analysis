import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createGroundedSignalBranch } from "../assets/grounded-signal-branch"
import { createQuadSensorConditioner } from "../assets/quad-sensor-conditioner"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"

test("reproduces ground-above-signal capacitors from the published quad sensor board", async () => {
  const extract = await createGroundedSignalBranch()
  expectReproRendered(extract, 3)
  expectReproNets(extract, [
    ["R21.pin1", "net.BUFFER1"],
    ["R21.pin2", "C31.pin1", "JO1.pin1", "net.OUT1"],
    ["C31.pin2", "JO1.pin2", "net.GND"],
  ])
  for (const [name, x, y] of [
    ["R21", -22.7, 5.5],
    ["C31", -20.45, 5.5],
    ["JO1", -18.2, 5.5],
  ] as const)
    expect(getReproSchematicComponent(extract, name).center).toEqual({ x, y })
  const full = await createQuadSensorConditioner()
  expectReproRendered(full, 38)
  for (const [name, json] of [
    ["filter", extract],
    ["full-sheet", full],
  ] as const) {
    const analysis = analyzeSchematicPlacement(json)
    expect(analysis.getIssues()).toHaveLength(name === "filter" ? 1 : 12)
    expect(
      analysis.getIssues({ issueTypes: ["TwoPinComponentHasInvertedRails"] }),
    ).toHaveLength(name === "filter" ? 1 : 8)
    expect(
      analysis.getIssues({ issueTypes: ["CapacitorConnectorNotAligned"] }),
    ).toHaveLength(name === "filter" ? 0 : 4)
    expect(
      createIssueReproSnapshot({
        circuitJson: json,
        analysis,
        showFullSchematic: true,
        showIssueGeometry: false,
        showListingIssueMarkers: true,
        width: 1400,
        height: name === "filter" ? 600 : 1000,
      }),
    ).toMatchSvgSnapshot(import.meta.path, name)
  }
})
