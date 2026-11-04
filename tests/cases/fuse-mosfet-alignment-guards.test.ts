import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createRadioFuseMosfet } from "../assets/radio-fuse-mosfet"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("fuse-mosfet-alignment uses topology and accepts valid layouts", async () => {
  const before = await createRadioFuseMosfet(),
    after = await createRadioFuseMosfet(true),
    saved = JSON.stringify(before)
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["FuseMosfetNotAligned"],
    }).getIssues()
  expect(issues(before)).toHaveLength(1)
  expect(issues(after)).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  expect(
    analyzeSchematicPlacement(before).getIssueCounts().FuseMosfetNotAligned,
  ).toBe(1)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    "<FuseMosfetNotAligned ",
  )
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component") e.name = "GND"
    if (e.type === "source_port") {
      e.name = "GND"
      e.port_hints = ["VCC", "gate"]
      e.pin_number = 99
    }
    if (e.type === "source_net") e.name = "GND"
    if (e.type === "schematic_net_label") e.text = "GND"
  }
  expect(issues(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  const drawn = (j: CircuitJson, name: string, pin: string) => {
    const id = port(j, name, pin).source_port_id,
      p = j.find((e) => e.type === "schematic_port" && e.source_port_id === id)
    if (p?.type !== "schematic_port") throw Error("Missing port")
    return p
  }
  const move = (j: CircuitJson, name: string, x: number, y: number) => {
    const b = box(j, name),
      dx = x - b.center.x,
      dy = y - b.center.y
    b.center = { x, y }
    for (const e of j)
      if (
        e.type === "schematic_port" &&
        e.schematic_component_id === b.schematic_component_id
      )
        e.center = { x: e.center.x + dx, y: e.center.y + dy }
  }
  for (const name of ["F1", "Q1"]) {
    for (const key of [
      "schematic_sheet_id",
      "schematic_group_id",
      "subcircuit_id",
    ] as const)
      reject((j) => {
        box(j, name)[key] = "other"
      })
    reject((j) => {
      box(j, name).size.width = NaN
    })
    reject((j) => {
      box(j, name).size.height = 0
    })
    reject((j) => {
      box(j, name).center.y = Infinity
    })
    reject((j) => {
      j.push({ ...box(j, name), schematic_component_id: "duplicate" })
    })
    reject((j) => {
      Object.assign(
        j.find((e) => e.type === "source_component" && e.name === name)!,
        { source_group_id: "other" },
      )
    })
    reject((j) => {
      Object.assign(
        j.find((e) => e.type === "source_component" && e.name === name)!,
        { ftype: "simple_resistor" },
      )
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
    ["F1", "pin1"],
    ["F1", "pin2"],
    ["Q1", "drain"],
    ["Q1", "source"],
    ["Q1", "gate"],
  ]) {
    reject((j) => {
      port(j, name!, pin!).do_not_connect = true
    })
    reject((j) => {
      drawn(j, name!, pin!).center.x = NaN
    })
    reject((j) => {
      drawn(j, name!, pin!).schematic_sheet_id = "other"
    })
    reject((j) => {
      j.push({ ...drawn(j, name!, pin!), schematic_port_id: "duplicate" })
    })
    reject((j) => {
      const p = drawn(j, name!, pin!)
      j.splice(j.indexOf(p), 1)
    })
  }
  const [sharedName, sharedPin] = ["F1", "pin2"] as const
  reject((j) => {
    const p = port(j, sharedName, sharedPin)
    j.push({ ...p, source_port_id: "extra", source_component_id: "extra-part" })
  })
  reject((j) => {
    j.push(
      {
        type: "source_net",
        source_net_id: "ground",
        name: "anonymous",
        is_ground: true,
        member_source_group_ids: [],
      },
      {
        type: "source_trace",
        source_trace_id: "ground-link",
        connected_source_port_ids: [
          port(j, sharedName, sharedPin).source_port_id,
        ],
        connected_source_net_ids: ["ground"],
      },
    )
  })
  const divider = {
    type: "schematic_line" as const,
    schematic_line_id: "divider",
    color: "#000",
    x1: -11.5,
    y1: -20,
    x2: -11.5,
    y2: 20,
    stroke_width: 0.02,
    is_dashed: true,
  }
  reject((j) => {
    j.push(divider)
  })
  for (const extra of [
    { is_dashed: false },
    { schematic_sheet_id: "other" },
    { schematic_component_id: "decoration" },
  ]) {
    const j = structuredClone(before)
    j.push({ ...divider, ...extra })
    expect(issues(j)).toHaveLength(1)
  }

  for (const flag of ["requires_ground", "provides_ground"] as const)
    reject((j) => {
      port(j, "F1", "pin2")[flag] = true
    })
  reject((j) => {
    drawn(j, "Q1", "drain").facing_direction = "left"
  })
  reject((j) => {
    drawn(j, "Q1", "source").facing_direction = "up"
  })
  reject((j) => {
    drawn(j, "Q1", "gate").facing_direction = undefined
  })
  reject((j) => {
    move(j, "F1", -10, 5)
  })
  const compact = structuredClone(before)
  move(compact, "F1", -11, 5)
  expect(issues(compact)).toEqual([])
  // Distance alone cannot report a correctly aligned series path.
  const longAligned = structuredClone(after)
  move(longAligned, "F1", -30, 5.26)
  expect(issues(longAligned)).toEqual([])
  const p = structuredClone(before)
  Object.assign(
    p.find((e) => e.type === "source_component" && e.name === "Q1")!,
    { channel_type: "n" },
  )
  expect(issues(p)).toHaveLength(1)

  // Equivalent rotations/reflections must not change recognition or reject the correction.
  for (const source of [before, after])
    for (const turns of [0, 1, 2, 3])
      for (const reflect of [false, true]) {
        const j = structuredClone(source),
          dirs = ["right", "up", "left", "down"] as const
        for (const e of j) {
          if (e.type !== "schematic_component" && e.type !== "schematic_port")
            continue
          for (let n = 0; n < turns; n++)
            e.center = { x: -e.center.y, y: e.center.x }
          if (reflect) e.center.x = -e.center.x
          e.center.x += 25
          e.center.y -= 10
          if (e.type === "schematic_component" && turns % 2)
            e.size = { width: e.size.height, height: e.size.width }
          if (e.type === "schematic_port" && e.facing_direction) {
            e.facing_direction =
              dirs[(dirs.indexOf(e.facing_direction) + turns) % 4]!
            if (
              reflect &&
              (e.facing_direction === "left" || e.facing_direction === "right")
            )
              e.facing_direction =
                e.facing_direction === "left" ? "right" : "left"
          }
        }
        expect(issues(j)).toHaveLength(source === before ? 1 : 0)
      }
})
