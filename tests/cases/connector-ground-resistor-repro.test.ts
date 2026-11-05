import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createConnectorGroundResistor } from "../assets/connector-ground-resistor"
import published from "../assets/connector-ground-resistor/published.circuit.json"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published connector-ground-resistor placement", async () => {
  const json = await createConnectorGroundResistor(),
    source = published as unknown as CircuitJson
  expectReproRendered(json, 3)
  for (const c of json) {
    if (c.type !== "source_component") continue
    const original = box(source, c.name!),
      extract = box(json, c.name!)
    expect(extract.center.x).toBeCloseTo(original.center.x, 10)
    expect(extract.center.y).toBeCloseTo(original.center.y, 10)
    expect(extract.size).toEqual(original.size)
    expect(extract.symbol_name).toEqual(original.symbol_name)
    const originalPins = source.filter(
      (e) =>
        e.type === "schematic_port" &&
        e.schematic_component_id === original.schematic_component_id,
    )
    for (const p of json) {
      if (
        p.type !== "schematic_port" ||
        p.schematic_component_id !== extract.schematic_component_id
      )
        continue
      const q = originalPins.find(
        (e) => e.type === "schematic_port" && e.pin_number === p.pin_number,
      )!
      if (q.type !== "schematic_port") throw new Error("Missing original pin")
      expect(p.center.x).toBeCloseTo(q.center.x, 10)
      expect(p.center.y).toBeCloseTo(q.center.y, 10)
      expect(p.facing_direction).toBe(q.facing_direction)
      expect(p.display_pin_label).toBe(q.display_pin_label)
    }
  }
  const analysis = analyzeSchematicPlacement(json)
  expect(
    analysis.getIssues({ issueTypes: ["ResistorConnectorNotAligned"] }),
  ).toHaveLength(0)
  for (const [name, circuitJson] of [
    ["extract", json],
    ["published-sheet", source],
  ] as const) {
    expect(
      createIssueReproSnapshot({
        circuitJson,
        analysis: analyzeSchematicPlacement(circuitJson),
        showFullSchematic: true,
        showIssueGeometry: false,
        showListingIssueMarkers: true,
        width: 1400,
        height: 950,
      }),
    ).toMatchSvgSnapshot(import.meta.path, name)
  }
})
