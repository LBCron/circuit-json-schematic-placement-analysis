import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createChargerChipResistor } from "../assets/charger-chip-resistor"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects the charger-chip-resistor extract with preserved connections and native symbols", async () => {
  const before = await createChargerChipResistor(),
    after = await createChargerChipResistor(true)
  expectReproRendered(before, 2)
  expectReproRendered(after, 2)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  expect(
    baseline.getIssues({ issueTypes: ["ResistorSeparatedFromChipPin"] }),
  ).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  expectVisibleConnection(after, "U1", "pin8", "R2", "pin2")
  expect(box(after, "U1")).toEqual(box(before, "U1"))
  const chipPins = (j: CircuitJson) =>
    j.flatMap((p) =>
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
      subject: "complete 2-component branch",
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
        i.lineItemType === "ResistorSeparatedFromChipPin"
          ? "U1 / R2: supply resistor sits beyond the opposite chip edge."
          : i.lineItemType === "SchematicBoxInnerLabelCollision"
            ? "U1: inner pin labels overlap."
            : "R8: supply-connected resistor should be vertical.",
      afterDiagnostic:
        "Resistor beside its connected chip pin; chip symbol and wiring preserved.\nComplete extract: 0 reported issues.",
      note: "Complete 2-component extract from the published board. All retained component values, symbols and electrical connections preserved.",
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
          "Complete 2-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-section")
})
