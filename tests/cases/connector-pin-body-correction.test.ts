import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createConnectorPinBody } from "../assets/connector-pin-body"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import { electricalPinSignature } from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects connector-pin-body with unchanged connectivity and pin layout", async () => {
  const before = await createConnectorPinBody(),
    after = await createConnectorPinBody(true)
  expectReproRendered(before, 2)
  expectReproRendered(after, 2)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({ issueTypes: ["ComponentOverlap"] })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  for (const c of before) {
    if (c.type !== "source_component") continue
    const a = box(before, c.name!),
      b = box(after, c.name!)
    expect(a.symbol_name).toEqual(b.symbol_name)
    const pins = (j: CircuitJson, id: string) =>
      j.flatMap((p) =>
        p.type === "schematic_port" && p.schematic_component_id === id
          ? [p]
          : [],
      )
    for (const p of pins(before, a.schematic_component_id)) {
      const q = pins(after, b.schematic_component_id).find(
        (q) => q.pin_number === p.pin_number,
      )!
      expect(q).toBeDefined()
      expect(q.facing_direction).toBe(p.facing_direction)
      expect(q.display_pin_label).toBe(p.display_pin_label)
      if (p.facing_direction === "left" || p.facing_direction === "right")
        expect(q.center.y - b.center.y).toBeCloseTo(p.center.y - a.center.y, 10)
      else
        expect(q.center.x - b.center.x).toBeCloseTo(p.center.x - a.center.x, 10)
    }
  }

  expect(
    createPlacementComparisonSvg({
      subject: "two motor connectors",
      panelHeight: 600,
      backgroundColor: "#f5f1ed",
      centerEachPanel: true,
      before: { circuitJson: before, analysis: baseline },
      after: { circuitJson: after, analysis },
      issues,
      contextSourceComponentIds: before.flatMap((e) =>
        e.type === "source_component" ? [e.source_component_id] : [],
      ),
      beforeDiagnostic: () =>
        "J7 / J8: external pins extend inside the neighboring connector body.\nThe original extract also has 3 existing findings.",
      afterDiagnostic:
        "Connectors separated; external pins clear both bodies.\nComplete extract: 0 reported issues.",
      note: "Complete 2-component extract. Original symbols, pin order, labels, values and connections preserved. Existing pin-padding and net-label findings also corrected.",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "comparison")
  expect(
    stackSvgsVertically(
      [
        renderIssueOverlay({
          circuitJson: after,
          analysis,
          showFullSchematic: true,
          showOverlay: false,
          width: 1200,
          height: 600,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 2-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-extract")
})
