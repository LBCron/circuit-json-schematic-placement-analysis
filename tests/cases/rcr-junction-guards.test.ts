import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createRcrJunction } from "../assets/rcr-junction"
import published from "../assets/rcr-junction/published.circuit.json"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("RCR grouping requires a local, private three-way junction with a known capacitor return", async () => {
  const before = await createRcrJunction(),
    type = "RcrJunctionNotGrouped" as const
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, { issueTypes: [type] }).getIssues()
  const saved = JSON.stringify(before)
  expect(issues(before)).toHaveLength(1)
  expect(issues(await createRcrJunction(true))).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  const native = issues(published as unknown as CircuitJson)
  expect(native).toHaveLength(2)
  expect(
    native
      .map((i) =>
        i.lineItemType === type
          ? i.capacitorSchematicBox.sourceComponentName
          : "",
      )
      .sort(),
  ).toEqual(["C13", "C22"])
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component" || e.type === "source_net")
      e.name = "arbitrary"
    if (e.type === "source_port") {
      e.name = "arbitrary"
      e.port_hints = []
    }
    if (e.type === "schematic_net_label") e.text = "arbitrary"
  }
  expect(issues(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  for (const name of ["R32", "R35", "C22"]) {
    reject((j) => {
      box(j, name).schematic_group_id = "other"
    })
    reject((j) => {
      box(j, name).schematic_sheet_id = "other"
    })
    reject((j) => {
      box(j, name).center.y = Number.NaN
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
    for (const pin of ["pin1", "pin2"])
      reject((j) => {
        port(j, name, pin).do_not_connect = true
      })
  }
  reject((j) => {
    for (const e of j) if (e.type === "source_net") delete e.is_ground
  })
  reject((j) => {
    port(j, "C22", "pin2").requires_power = true
  })
  reject((j) => {
    port(j, "R32", "pin2").requires_power = true
  })
  reject((j) => {
    port(j, "R32", "pin1").provides_ground = true
  })
  reject((j) => {
    port(j, "R35", "pin2").provides_ground = true
  })
  reject((j) => {
    const p = port(j, "C22", "pin1")
    j.push({ ...p, source_port_id: "extra", source_component_id: "other-part" })
  })
  reject((j) => {
    const p = port(j, "C22", "pin1")
    j.push({ ...p, source_port_id: "extra-cap-pin", pin_number: 3 })
  })
  reject((j) => {
    const p = port(j, "C22", "pin1")
    j.splice(
      j.findIndex(
        (e) =>
          e.type === "schematic_port" && e.source_port_id === p.source_port_id,
      ),
      1,
    )
  })
  for (const value of [0, Number.NaN])
    reject((j) => {
      for (const e of j)
        if (e.type === "source_component" && e.ftype === "simple_capacitor")
          e.capacitance = value
    })
  const portGround = structuredClone(before)
  for (const e of portGround) if (e.type === "source_net") delete e.is_ground
  port(portGround, "C22", "pin2").requires_ground = true
  expect(issues(portGround)).toHaveLength(1)
  // Supply-connected outer resistors are permitted; supply names are irrelevant.
  const supply = structuredClone(before)
  port(supply, "R32", "pin1").provides_voltage = 3.3
  expect(issues(supply)).toHaveLength(1)
})
