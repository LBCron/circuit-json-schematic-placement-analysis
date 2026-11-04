import { expect, test } from "bun:test"
import { symbols, type SchSymbol } from "schematic-symbols"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createRadioFuseMosfet } from "../assets/radio-fuse-mosfet"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects fuse / MOSFET protection block with unchanged electrical connections and terminal identities", async () => {
  const before = await createRadioFuseMosfet(),
    after = await createRadioFuseMosfet(true)
  expectReproRendered(before, 5)
  expectReproRendered(after, 5)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({ issueTypes: ["FuseMosfetNotAligned"] })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  for (const [a, p, b, q] of [
    ["F1", "pin2", "Q1", "drain"],
    ["Q1", "gate", "R1", "pin1"],
    ["Q1", "source", "D2", "cathode"],
  ] as const)
    expectVisibleConnection(after, a, p, b, q)

  // Native symbol artwork, arrow and terminal identities are rotated together.
  const original: SchSymbol = symbols.p_channel_e_mosfet_transistor_horz!,
    rotated: SchSymbol =
      symbols.p_channel_e_mosfet_transistor_gate_bottom_drain_left!
  expect(box(before, "Q1").symbol_name).toBe(
    "p_channel_e_mosfet_transistor_horz",
  )
  expect(box(after, "Q1").symbol_name).toBe(
    "p_channel_e_mosfet_transistor_gate_bottom_drain_left",
  )
  const primitives = original.primitives.filter((p) => p.type !== "text"),
    next = rotated.primitives.filter((p) => p.type !== "text")
  expect(next).toHaveLength(primitives.length)
  for (const [k, p] of primitives.entries()) {
    const q = next[k]!
    expect(q.type).toBe(p.type)
    if (p.type === "path" && q.type === "path")
      for (const [n, pt] of p.points.entries()) {
        expect(q.points[n]!.x).toBeCloseTo(-pt.y, 8)
        expect(q.points[n]!.y).toBeCloseTo(pt.x, 8)
      }
    if (p.type === "circle" && q.type === "circle") {
      expect(q.x).toBeCloseTo(-p.y, 8)
      expect(q.y).toBeCloseTo(p.x, 8)
      expect(q.radius).toBe(p.radius)
    }
  }
  for (const [k, p] of original.ports.entries()) {
    const q = rotated.ports[k]!
    expect(q.labels).toEqual(p.labels)
    expect(q.x).toBeCloseTo(-p.y, 8)
    expect(q.y).toBeCloseTo(p.x, 8)
  }

  const comparison = createPlacementComparisonSvg({
    subject: "fuse / MOSFET protection block",
    panelHeight: 700,
    backgroundColor: "#f5f1ed",
    centerEachPanel: true,
    before: { circuitJson: before, analysis: baseline },
    after: { circuitJson: after, analysis },
    issues,
    contextSourceComponentIds: before.flatMap((e) =>
      e.type === "source_component" ? [e.source_component_id] : [],
    ),
    beforeDiagnostic: () =>
      "F1 / Q1: distant connected terminals face different axes.",
    afterDiagnostic:
      "F1 and Q1 connect along a straight supply path.\nDrain, source and gate connections preserved.\nComplete 5-component extract: 0 reported issues.",
    note: "The original circuit is electrically valid. This is a placement suggestion; the correction also resolves the existing R1/D1/D2 findings.",
  })
  expect(comparison).toContain('<line x1="1200"')
  expect(comparison.match(/data-issue-number=/g)).toHaveLength(2)
  expect(comparison).toMatchSvgSnapshot(import.meta.path, "comparison")
  expect(
    stackSvgsVertically(
      [
        renderIssueOverlay({
          circuitJson: after,
          analysis,
          showFullSchematic: true,
          showOverlay: false,
          width: 1200,
          height: 650,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 5-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-section")
})
