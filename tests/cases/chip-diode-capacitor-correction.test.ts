import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createChargerChipDiodeCapacitor } from "../assets/charger-chip-diode-capacitor"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  electricalPinSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("corrects chip diode / capacitor network with unchanged electrical connections and terminal identities", async () => {
  const before = await createChargerChipDiodeCapacitor(),
    after = await createChargerChipDiodeCapacitor(true)
  expectReproRendered(before, 4)
  expectReproRendered(after, 4)
  expect(electricalPinSignature(after)).toEqual(electricalPinSignature(before))
  const baseline = analyzeSchematicPlacement(before),
    analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({
    issueTypes: ["ChipDiodeCapacitorNetworkNotGrouped"],
  })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  for (const [a, p, b, q] of [
    ["U2", "REGN", "D2", "anode"],
    ["U2", "BTST", "D2", "cathode"],
    ["U2", "BTST", "C7", "pin1"],
    ["U2", "PH", "C7", "pin2"],
    ["U2", "REGN", "C5", "pin1"],
  ] as const)
    expectVisibleConnection(after, a, p, b, q)

  expect(box(after, "U2")).toEqual(box(before, "U2"))
  const chipPins = (j: CircuitJson) =>
    j.flatMap((e) =>
      e.type === "schematic_port" &&
      e.schematic_component_id === box(j, "U2").schematic_component_id
        ? [
            {
              sourcePortId: e.source_port_id,
              pin: e.pin_number,
              center: e.center,
              facing: e.facing_direction,
              label: e.display_pin_label,
              side: e.side_of_component,
              distance: e.distance_from_component_edge,
            },
          ]
        : [],
    )
  expect(chipPins(after)).toEqual(chipPins(before))

  const comparison = createPlacementComparisonSvg({
    subject: "chip diode / capacitor network",
    panelHeight: 900,
    backgroundColor: "#f5f1ed",
    centerEachPanel: true,
    before: { circuitJson: before, analysis: baseline },
    after: { circuitJson: after, analysis },
    issues,
    contextSourceComponentIds: before.flatMap((e) =>
      e.type === "source_component" ? [e.source_component_id] : [],
    ),
    beforeDiagnostic: () =>
      "U2 / D2 / C7: diode and capacitor sit far above their connected chip pins.",
    afterDiagnostic:
      "Diode and capacitor grouped beside their connected chip pins.\nChip pin layout and all connections preserved.\nComplete 4-component extract: 0 reported issues.",
    note: "All four extracted components remain visible. The surrounding charger stages are outside this extract.",
  })
  expect(comparison).toContain('<line x1="1200"')
  expect(comparison.match(/data-issue-number=/g)).toHaveLength(3)
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
          height: 850,
        }).svg,
        createAnalyzerTextSvg(
          "Complete 4-component extract.\nFull analysis: 0 reported issues.",
          1200,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ).replace(/[ \t]+$/gm, ""),
  ).toMatchSvgSnapshot(import.meta.path, "full-section")
})
