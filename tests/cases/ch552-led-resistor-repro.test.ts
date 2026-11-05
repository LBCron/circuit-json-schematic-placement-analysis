import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createCh552LedResistor } from "../assets/ch552-led-resistor"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published ch552-led-resistor branch and its missed chip grouping", async () => {
  const json = await createCh552LedResistor()
  expectReproRendered(json, 3)
  for (const [name, x, y] of [
    ["U1", 0, 0],
    ["R8", 1.8, -4.5],
    ["D2", 3.3, -4.5],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["R8.pin1", "U1.pin19", "net.VBUS5"],
    ["R8.pin2", "D2.anode"],
    ["D2.cathode", "U1.pin5"],
    ["U1.pin18", "net.GND"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(
    analysis
      .getIssues()
      .map((i) => i.lineItemType)
      .sort(),
  ).toEqual([
    "LedResistorBranchSeparatedFromChipPin",
    "SchematicBoxInnerLabelCollision",
    "TwoPinComponentShouldBeVertical",
  ])
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
