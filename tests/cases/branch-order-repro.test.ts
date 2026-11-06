import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { getSourceConnectivity } from "lib/utils/source-connectivity"
import { stackSvgsVertically } from "stack-svgs"
import { createBranchOrder } from "../assets/branch-order"
import published from "../assets/branch-order/published.circuit.json"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

test("reproduces the published branch-order placement and its missed pattern", async () => {
  const json = await createBranchOrder(),
    source = published as unknown as CircuitJson
  expectReproRendered(json, 3)
  const names = json.flatMap((e) =>
    e.type === "source_component" ? [e.name!] : [],
  )
  const selectedConnections = (j: CircuitJson) => {
    const connected = getSourceConnectivity(j),
      components = new Map(
        j.flatMap((e) =>
          e.type === "source_component"
            ? [[e.source_component_id, e.name] as const]
            : [],
        ),
      )
    const ports = j.filter(
      (e) =>
        e.type === "source_port" &&
        names.includes(components.get(e.source_component_id!)!),
    )
    const key = (p: (typeof ports)[number]) =>
      p.type === "source_port"
        ? `${components.get(p.source_component_id!)}.${p.pin_number}`
        : ""
    return ports
      .map((p) => {
        if (p.type !== "source_port") throw new Error("Expected port")
        return [
          key(p),
          ports
            .filter(
              (q) =>
                q.type === "source_port" &&
                connected(q.source_port_id) === connected(p.source_port_id),
            )
            .map(key)
            .sort(),
        ]
      })
      .sort()
  }
  expect(selectedConnections(json)).toEqual(selectedConnections(source))
  for (const name of names) {
    const original = box(source, name),
      extract = box(json, name)
    expect(extract.center.x).toBeCloseTo(original.center.x, 10)
    expect(extract.center.y).toBeCloseTo(original.center.y, 10)
    expect(extract.symbol_name).toBe(original.symbol_name)
    const a = source.find(
        (e) => e.type === "source_component" && e.name === name,
      ),
      b = json.find((e) => e.type === "source_component" && e.name === name)
    if (a?.type !== "source_component" || b?.type !== "source_component")
      throw new Error("Missing source component")
    expect(b.ftype).toBe(a.ftype)
    if (a.ftype === "simple_resistor" && b.ftype === "simple_resistor")
      expect(b.resistance).toBe(a.resistance)
    if (a.ftype === "simple_capacitor" && b.ftype === "simple_capacitor")
      expect(b.capacitance).toBe(a.capacitance)
    for (const p of json) {
      if (
        p.type !== "schematic_port" ||
        p.schematic_component_id !== extract.schematic_component_id
      )
        continue
      const q = source.find(
        (e) =>
          e.type === "schematic_port" &&
          e.schematic_component_id === original.schematic_component_id &&
          e.pin_number === p.pin_number,
      )
      if (q?.type !== "schematic_port") throw new Error("Missing original pin")
      expect(p.center.x).toBeCloseTo(q.center.x, 10)
      expect(p.center.y).toBeCloseTo(q.center.y, 10)
      expect(p.facing_direction).toBe(q.facing_direction)
    }
  }
  const analysis = analyzeSchematicPlacement(json)
  expect(analysis.getIssues().map((e) => e.lineItemType)).toEqual([
    "ComponentBranchesOutOfOrder",
  ])
  expect(
    createIssueReproSnapshot({
      circuitJson: json,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      showListingIssueMarkers: true,
      width: 1200,
      height: 800,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "extract")
  const originalAnalysis = analyzeSchematicPlacement(source),
    sheetId = box(source, "U_DRV12").schematic_sheet_id
  expect(
    stackSvgsVertically(
      [
        renderIssueOverlay({
          circuitJson: source,
          analysis: originalAnalysis,
          schematicSheetId: sheetId,
          showFullSchematic: true,
          showOverlay: true,
          showIssueGeometry: false,
          width: 1600,
          height: 1000,
        }).svg,
        createAnalyzerTextSvg(
          `Original published sheet, unchanged.\nExisting findings on this sheet: ${originalAnalysis.getIssues({ schematicSheetId: sheetId }).length}. The new rule now reports the previously missed pattern.`,
          1600,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "published-sheet")
})
