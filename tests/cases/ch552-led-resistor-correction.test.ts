import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createCh552LedResistor } from "../assets/ch552-led-resistor"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects the ch552-led-resistor extract with preserved connections and native symbols", async () => {
  const before = await createCh552LedResistor(),
    after = await createCh552LedResistor(true)
  expectReproRendered(before, 3)
  expectReproRendered(after, 3)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  expect(
    baseline.getIssues({
      issueTypes: ["LedResistorBranchSeparatedFromChipPin"],
    }),
  ).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  expectVisibleConnection(after, "U1", "pin5", "D2", "cathode")
  expectVisibleConnection(after, "D2", "anode", "R8", "pin2")
  // Increase the body height for the existing label collision; retain pin order and sides.
  expect(box(after, "U1").size.height).toBe(3.2)
  const chipPins = (j: CircuitJson) =>
    j
      .filter(
        (p) =>
          p.type === "schematic_port" &&
          (p.facing_direction === "left" || p.facing_direction === "right"),
      )
      .flatMap((p) =>
        p.type === "schematic_port" &&
        p.schematic_component_id === box(j, "U1").schematic_component_id
          ? [
              {
                pin: p.pin_number,
                center: p.center,
                facing: p.facing_direction,
                label: p.display_pin_label,
              },
            ]
          : [],
      )
  expect(chipPins(after)).toEqual(chipPins(before))
  expect(
    createPlacementComparisonSvg({
      subject: "complete 3-component branch",
      panelHeight: 850,
      backgroundColor: "#f5f1ed",
      centerEachPanel: true,
      before: { circuitJson: before, analysis: baseline },
      after: { circuitJson: after, analysis },
      issues: baseline.getIssues(),
      contextSourceComponentIds: before.flatMap((e) =>
        e.type === "source_component" ? [e.source_component_id] : [],
      ),
      beforeDiagnostic: (i) =>
        i.lineItemType === "LedResistorBranchSeparatedFromChipPin"
          ? "U1 / D2 / R8: LED and its resistor sit beyond the opposite chip edge."
          : i.lineItemType === "SchematicBoxInnerLabelCollision"
            ? "U1: inner pin labels overlap."
            : "R8: supply-connected resistor should be vertical.",
      afterDiagnostic:
        "LED and resistor grouped beside pin 5. Resistor oriented with supply above; chip height increased to clear labels.\nComplete extract: 0 reported issues.",
      note: "Complete 3-component extract from the published board. All retained component values, symbols and electrical connections preserved.",
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
          height: 850,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 3-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-section")
})
