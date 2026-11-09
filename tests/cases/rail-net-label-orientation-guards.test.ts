import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createRailNetLabelOrientationCircuitJson } from "../assets/rail-net-label-orientation"
import { createSchematicAnalysisFixtureSvg } from "../fixtures/create-schematic-analysis-fixture-svg"

test("classifies rail net labels strictly from typed metadata and skips ambiguous or unpolarized nets", () => {
  const base = createRailNetLabelOrientationCircuitJson()
  const issueTypes = ["RailNetLabelHasIncorrectOrientation"] as const
  const run = (json: CircuitJson) =>
    analyzeSchematicPlacement(json, { issueTypes })

  // Opaque names on components, ports, nets, and net labels still detect all 4 issues.
  const opaqueRenamed: CircuitJson = base.map((element, index) => {
    if (
      element.type === "source_component" ||
      element.type === "source_port" ||
      element.type === "source_net"
    ) {
      return {
        ...element,
        name: `opaque_${index}`,
        ...(element.type === "source_port" ? { port_hints: [] } : {}),
      }
    }
    if (element.type === "schematic_net_label") {
      return { ...element, text: `SIG_${index}` }
    }
    return element
  })
  expect(run(opaqueRenamed).getIssues()).toHaveLength(4)

  // Port-level rail metadata (provides_power / provides_ground) works even without source_net flags.
  const portMetadataOnly: CircuitJson = base.map((element) => {
    if (element.type === "source_net") {
      return {
        ...element,
        name: `net_${element.source_net_id}`,
        is_ground: false,
        is_power: false,
        is_positive_voltage_source: false,
      }
    }
    if (
      element.type === "source_port" &&
      element.source_port_id === "source_port_j1_vbus_a"
    ) {
      return { ...element, provides_power: true, provides_voltage: 5 }
    }
    if (
      element.type === "source_port" &&
      element.source_port_id === "source_port_j1_gnd_a"
    ) {
      return { ...element, provides_ground: true }
    }
    return element
  })
  expect(run(portMetadataOnly).getIssues()).toHaveLength(4)

  // Names "GND" and "VBUS" without typed rail metadata must never be inferred as rails.
  const unclassifiedByName: CircuitJson = base.map((element) =>
    element.type === "source_net"
      ? {
          ...element,
          is_ground: false,
          is_power: false,
          is_positive_voltage_source: false,
        }
      : element,
  )
  expect(run(unclassifiedByName).getIssues()).toEqual([])

  // Contradictory metadata (both ground and power) must be skipped.
  const contradictory: CircuitJson = base.map((element) =>
    element.type === "source_net" &&
    (element.source_net_id === "source_net_vbus" ||
      element.source_net_id === "source_net_gnd")
      ? {
          ...element,
          is_ground: true,
          is_power: true,
          is_positive_voltage_source: true,
        }
      : element,
  )
  expect(run(contradictory).getIssues()).toEqual([])

  // Unknown supply polarity (is_power=true, is_positive_voltage_source=false) must not assume upward rail.
  const unknownSupplyPolarity: CircuitJson = base.map((element) =>
    element.type === "source_net" && element.source_net_id === "source_net_vbus"
      ? { ...element, is_power: true, is_positive_voltage_source: false }
      : element,
  )
  expect(
    run(unknownSupplyPolarity)
      .getIssues()
      .filter(
        (issue) =>
          issue.lineItemType === "RailNetLabelHasIncorrectOrientation" &&
          issue.railType === "power",
      ),
  ).toEqual([])

  // Negative voltage rail (-5V) must not be forced upward.
  const negativeSupply: CircuitJson = portMetadataOnly.map((element) =>
    element.type === "source_port" &&
    element.source_port_id === "source_port_j1_vbus_a"
      ? { ...element, provides_power: true, provides_voltage: -5 }
      : element,
  )
  expect(
    run(negativeSupply)
      .getIssues()
      .filter(
        (issue) =>
          issue.lineItemType === "RailNetLabelHasIncorrectOrientation" &&
          issue.railType === "power",
      ),
  ).toEqual([])

  // An obstructed side rail bus (where a connected signal pin sits below the ground bus on the same side)
  // must not be flagged when downward routing would cross that connected pin.
  const obstructedRightSideGnd: CircuitJson = [
    ...base,
    {
      type: "source_port",
      source_port_id: "source_port_j1_lower_sig",
      source_component_id: "source_component_j1",
      name: "B8",
      pin_number: 8,
      port_hints: ["B8"],
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_j1_lower_sig",
      schematic_component_id: "schematic_component_j1",
      source_port_id: "source_port_j1_lower_sig",
      center: { x: 1.5, y: -0.9 },
      facing_direction: "right",
      side_of_component: "right",
      distance_from_component_edge: 0.4,
      pin_number: 8,
      display_pin_label: "B8",
      is_connected: true,
      schematic_sheet_id: "schematic_sheet_0",
    },
  ]
  expect(
    run(obstructedRightSideGnd)
      .getIssues()
      .map((issue) =>
        issue.lineItemType === "RailNetLabelHasIncorrectOrientation"
          ? issue.schematicNetLabelId
          : "",
      ),
  ).not.toContain("schematic_net_label_gnd_side")

  const opaqueAnalysis = run(opaqueRenamed)
  expect(
    createSchematicAnalysisFixtureSvg({
      circuitJson: opaqueRenamed,
      analysis: opaqueAnalysis,
      highlightIssues: [...issueTypes],
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
