import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createChargerChipResistor } from "../assets/charger-chip-resistor"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published charger-chip-resistor branch and its missed chip grouping", async () => {
  const json = await createChargerChipResistor()
  expectReproRendered(json, 2)
  for (const [name, x, y] of [
    ["U1", -9, 2],
    ["R2", -11, -1],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["R2.pin1", "net.VBUS"],
    ["R2.pin2", "U1.pin8"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(
    analysis
      .getIssues()
      .map((i) => i.lineItemType)
      .sort(),
  ).toEqual(["ResistorSeparatedFromChipPin"])
  expect(
    createIssueReproSnapshot({
      circuitJson: json,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      showListingIssueMarkers: true,
      width: 1200,
      height: 850,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "branch")
})
