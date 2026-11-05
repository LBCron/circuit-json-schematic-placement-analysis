import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createCh552LedResistor } from "../assets/ch552-led-resistor"
import {
  getReproSourcePort as port,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"

test("keeps LED grouping private, wired, local and independent of labels", async () => {
  const before = await createCh552LedResistor()
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["LedResistorBranchSeparatedFromChipPin"],
    }).getIssues()
  expect(issues(before)).toHaveLength(1)
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component" || e.type === "source_net")
      e.name = "unknown"
    if (e.type === "source_port") {
      e.name = "unknown"
      e.port_hints = []
    }
  }
  expect(issues(renamed)).toHaveLength(1)
  // Both power-return and ground-return indicator branches are recognized.
  const grounded = structuredClone(before)
  for (const e of grounded)
    if (e.type === "source_net" && e.name === "VBUS5") {
      e.is_power = false
      e.is_positive_voltage_source = false
      e.is_ground = true
    }
  expect(issues(grounded)).toHaveLength(1)
  const changes: ((j: CircuitJson) => void)[] = [
    (j) => {
      port(j, "D2", "anode").do_not_connect = true
    },
    (j) => {
      const e = j.find((e) => e.type === "source_component" && e.name === "R8")
      if (e?.type === "source_component" && e.ftype === "simple_resistor")
        e.resistance = 0
    },
    (j) => {
      box(j, "D2").schematic_group_id = "separate"
    },
    (j) => {
      box(j, "R8").schematic_sheet_id = "separate"
    },
    (j) => {
      const e = j.find(
        (e) =>
          e.type === "schematic_port" &&
          e.source_port_id === port(j, "U1", "pin5").source_port_id,
      )
      if (e?.type === "schematic_port") e.center.x = NaN
    },
    (j) => {
      j.push({
        type: "pcb_component",
        pcb_component_id: "dnp",
        source_component_id: port(j, "D2", "anode").source_component_id!,
        do_not_place: true,
      } as CircuitJson[number])
    },
    (j) => {
      const p = port(j, "D2", "anode")
      j.push({
        ...p,
        source_port_id: "extra_port",
        source_component_id: "extra_component",
      })
      j.push({
        type: "source_trace",
        source_trace_id: "extra_trace",
        connected_source_port_ids: [p.source_port_id, "extra_port"],
        connected_source_net_ids: [],
      })
    },
    (j) => {
      j.push({
        type: "schematic_line",
        schematic_line_id: "section",
        x1: -10,
        y1: -2,
        x2: 10,
        y2: -2,
        is_dashed: true,
        schematic_sheet_id: box(j, "U1").schematic_sheet_id,
      } as CircuitJson[number])
    },
  ]
  for (const change of changes) {
    const j = structuredClone(before)
    change(j)
    expect(issues(j)).toEqual([])
  }
  expect(issues(before.filter((e) => e.type !== "schematic_port"))).toEqual([])
  // Electrical connectivity alone does not justify moving a deliberately separate label-only block.
  expect(issues(before.filter((e) => e.type !== "schematic_trace"))).toEqual([])
  const broken = structuredClone(before)
  const hp = port(broken, "U1", "pin5"),
    pin = broken.find(
      (e) =>
        e.type === "schematic_port" && e.source_port_id === hp.source_port_id,
    )!
  if (pin.type === "schematic_port")
    for (const e of broken)
      if (e.type === "schematic_trace")
        e.edges = e.edges.filter(
          (edge) =>
            ![edge.from, edge.to].some(
              (p) => Math.hypot(p.x - pin.center.x, p.y - pin.center.y) < 1e-6,
            ),
        )
  expect(issues(broken)).toEqual([])
})
