import { expect, test } from "bun:test"
import {
  pcb_component,
  any_source_component,
  type CircuitJson,
} from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createBranchOrder } from "../assets/branch-order"
import published from "../assets/branch-order/published.circuit.json"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("branch order requires reversed, intersecting private wires with an unambiguous common return", async () => {
  const before = await createBranchOrder(),
    after = await createBranchOrder(true),
    type = "ComponentBranchesOutOfOrder" as const
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, { issueTypes: [type] }).getIssues()
  const saved = JSON.stringify(before)
  expect(issues(before)).toHaveLength(1)
  expect(issues(after)).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  // The unmodified published circuit touches the lower chip pin with the upper wire.
  // Its other reversed pair (U_DRV34) is routed without intersections and must be skipped.
  expect(issues(published as unknown as CircuitJson)).toMatchObject([
    { hostSchematicBox: { sourceComponentName: "U_DRV12" } },
  ])
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component" || e.type === "source_net")
      e.name = "unrelated"
    if (e.type === "source_port") {
      e.name = "unrelated"
      e.port_hints = []
    }
    if (e.type === "schematic_net_label") e.text = "unrelated"
  }
  expect(issues(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  reject((j) => {
    for (let n = j.length - 1; n >= 0; n--)
      if (j[n]?.type === "schematic_trace") j.splice(n, 1)
  })
  for (const name of ["U_DRV12", "RS_M1", "RS_M2"]) {
    reject((j) => {
      box(j, name).schematic_group_id = "other"
    })
    reject((j) => {
      box(j, name).schematic_sheet_id = "other"
    })
    reject((j) => {
      box(j, name).center.x = Number.NaN
    })
    reject((j) => {
      j.push(
        pcb_component.parse({
          type: "pcb_component",
          pcb_component_id: "dnp",
          source_component_id: box(j, name).source_component_id,
          center: { x: 0, y: 0 },
          width: 1,
          height: 1,
          rotation: 0,
          layer: "top",
          do_not_place: true,
        }),
      )
    })
  }
  for (const [name, pin] of [
    ["U_DRV12", "pin3"],
    ["U_DRV12", "pin6"],
    ["RS_M1", "pin1"],
    ["RS_M1", "pin2"],
    ["RS_M2", "pin1"],
    ["RS_M2", "pin2"],
  ])
    reject((j) => {
      port(j, name!, pin!).do_not_connect = true
    })
  reject((j) => {
    port(j, "RS_M1", "pin1").requires_power = true
  })
  reject((j) => {
    port(j, "RS_M1", "pin2").provides_voltage = 3.3
  }) // Contradictory ground and power.
  reject((j) => {
    const p = port(j, "RS_M1", "pin1")
    j.push({
      ...p,
      source_port_id: "extra-branch",
      source_component_id: "external",
    })
  })
  reject((j) => {
    const p = port(j, "RS_M1", "pin1")
    j.splice(
      j.findIndex(
        (e) =>
          e.type === "schematic_port" && e.source_port_id === p.source_port_id,
      ),
      1,
    )
  })
  // Any explicitly declared common supply/ground return works; labels have no role.
  const supply = structuredClone(before)
  for (const e of supply) {
    if (e.type === "source_net" && e.is_ground) {
      delete e.is_ground
      e.is_power = true
      e.name = "opaque"
    }
    if (e.type === "source_port") {
      delete e.requires_ground
      delete e.provides_ground
    }
  }
  expect(issues(supply)).toHaveLength(1)
  const declared = structuredClone(before)
  for (const e of declared) {
    if (e.type === "source_net") {
      delete e.is_ground
      delete e.is_power
      delete e.is_positive_voltage_source
    }
    if (e.type === "source_port") {
      delete e.requires_ground
      delete e.provides_ground
    }
  }
  port(declared, "RS_M1", "pin2").provides_ground = true
  expect(issues(declared)).toHaveLength(1)
  // The same geometric decision applies to other native two-terminal components.
  for (const ftype of [
    "simple_capacitor",
    "simple_inductor",
    "simple_diode",
    "simple_led",
  ] as const) {
    const j = structuredClone(before)
    for (let n = 0; n < j.length; n++) {
      const e = j[n]
      if (e?.type !== "source_component" || e.ftype !== "simple_resistor")
        continue
      const { resistance, display_resistance, ...rest } = e
      j[n] = any_source_component.parse({
        ...rest,
        ftype,
        ...(ftype === "simple_capacitor"
          ? { capacitance: 1e-7 }
          : ftype === "simple_inductor"
            ? { inductance: 1e-6 }
            : {}),
      })
    }
    expect(issues(j)).toHaveLength(1)
  }
  // Rotate the geometry through every host face without changing connectivity.
  const rotated = structuredClone(before)
  for (let turn = 0; turn < 4; turn++) {
    expect(issues(rotated)).toHaveLength(1)
    for (const e of rotated) {
      if (e.type === "schematic_component" || e.type === "schematic_port") {
        e.center = { x: -e.center.y, y: e.center.x }
      }
      if (e.type === "schematic_component")
        e.size = { width: e.size.height, height: e.size.width }
      if (e.type === "schematic_port" && e.facing_direction)
        e.facing_direction = (
          { left: "down", down: "right", right: "up", up: "left" } as const
        )[e.facing_direction]
      if (e.type === "schematic_trace")
        for (const edge of e.edges) {
          edge.from = { x: -edge.from.y, y: edge.from.x }
          edge.to = { x: -edge.to.y, y: edge.to.x }
        }
    }
  }
})
