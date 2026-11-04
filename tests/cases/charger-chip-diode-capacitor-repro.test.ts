import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createChargerChipDiodeCapacitor } from "../assets/charger-chip-diode-capacitor"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published charger-chip-diode-capacitor positions and retained electrical connections", async () => {
  const json = await createChargerChipDiodeCapacitor()
  expectReproRendered(json, 4)
  for (const [name, x, y] of [
    ["U2", 4, 0],
    ["D2", 9, 5],
    ["C7", 10, 6],
    ["C5", 9, -2],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["U2.REGN", "D2.anode", "C5.pin1"],
    ["U2.BTST", "D2.cathode", "C7.pin1"],
    ["U2.PH", "C7.pin2", "net.PH"],
    ["U2.GND", "U2.EP", "C5.pin2", "net.GND"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(analysis.getIssues().map((i) => i.lineItemType)).toEqual([
    "ChipDiodeCapacitorNetworkNotGrouped",
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
  ).toMatchSvgSnapshot(import.meta.path, "network")
})
