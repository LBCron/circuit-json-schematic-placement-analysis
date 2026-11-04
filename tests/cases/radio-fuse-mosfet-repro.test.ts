import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createRadioFuseMosfet } from "../assets/radio-fuse-mosfet"
import {
  expectReproRendered,
  expectReproNets,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published radio-fuse-mosfet positions and retained electrical connections", async () => {
  const json = await createRadioFuseMosfet()
  expectReproRendered(json, 5)
  for (const [name, x, y] of [
    ["F1", -13, 5],
    ["Q1", -10, 5],
    ["R1", -9, 3],
    ["D2", -11, 3],
    ["D1", -8, 3],
  ] as const)
    expect(getReproSchematicComponent(json, name).center).toEqual({ x, y })
  expectReproNets(json, [
    ["F1.pin1", "net.VIN_RAW"],
    ["F1.pin2", "Q1.drain", "net.VIN_FUSED"],
    ["Q1.source", "D2.cathode", "D1.cathode", "net.VBAT_PROT"],
    ["Q1.gate", "R1.pin1", "D2.anode"],
    ["R1.pin2", "D1.anode", "net.GND"],
  ])
  const analysis = analyzeSchematicPlacement(json)
  expect(analysis.getIssues().map((i) => i.lineItemType)).toEqual([
    "DiodeResistorNotAligned",
    "TwoPinComponentShouldBeVertical",
    "TwoPinComponentShouldBeVertical",
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
      height: 650,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "network")
})
