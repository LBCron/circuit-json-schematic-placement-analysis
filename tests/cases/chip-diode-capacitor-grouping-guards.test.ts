import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createChargerChipDiodeCapacitor } from "../assets/charger-chip-diode-capacitor"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("chip-diode-capacitor-grouping uses topology and accepts valid layouts", async () => {
  const before = await createChargerChipDiodeCapacitor(),
    after = await createChargerChipDiodeCapacitor(true),
    saved = JSON.stringify(before)
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["ChipDiodeCapacitorNetworkNotGrouped"],
    }).getIssues()
  expect(issues(before)).toHaveLength(1)
  expect(issues(after)).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  expect(
    analyzeSchematicPlacement(before).getIssueCounts()
      .ChipDiodeCapacitorNetworkNotGrouped,
  ).toBe(1)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    "<ChipDiodeCapacitorNetworkNotGrouped ",
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
  for (const name of ["U2", "D2", "C7"]) {
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
    ["U2", "REGN"],
    ["U2", "BTST"],
    ["U2", "PH"],
    ["D2", "anode"],
    ["D2", "cathode"],
    ["C7", "pin1"],
    ["C7", "pin2"],
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
  const [sharedName, sharedPin] = ["C7", "pin1"] as const
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
    x1: 6,
    y1: -20,
    x2: 6,
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

  for (const capacitance of [0, -1, NaN, Infinity])
    reject((j) => {
      Object.assign(
        j.find((e) => e.type === "source_component" && e.name === "C7")!,
        { capacitance },
      )
    })
  for (const flag of [
    "requires_ground",
    "provides_ground",
    "requires_power",
    "provides_power",
  ] as const)
    for (const [name, pin] of [
      ["U2", "REGN"],
      ["C7", "pin2"],
      ["D2", "cathode"],
    ])
      reject((j) => {
        port(j, name!, pin!)[flag] = true
      })
  reject((j) => {
    port(j, "C7", "pin2").requires_voltage = 0
  })
  reject((j) => {
    drawn(j, "U2", "PH").facing_direction = "left"
  })
  reject((j) => {
    drawn(j, "U2", "PH").facing_direction = undefined
  })
  // The published PH node also feeds imported power-stage chips. They do not
  // own the private chip/diode/capacitor junction and must not hide its finding.
  const powerStage = structuredClone(before)
  powerStage.push(
    {
      type: "source_component",
      ftype: "simple_chip",
      name: "OTHER",
      source_component_id: "other-host",
    },
    {
      ...port(powerStage, "C7", "pin2"),
      source_component_id: "other-host",
      source_port_id: "other-host-pin",
    },
  )
  expect(issues(powerStage)).toHaveLength(1)
  // Multiple host pins on one of the three nodes make the pin target ambiguous.
  reject((j) => {
    j.push({ ...port(j, "U2", "PH"), source_port_id: "extra-host-pin" })
  })
  // An unrelated NC pin is not part of this local network.
  const nc = structuredClone(before)
  port(nc, "U2", "CE").do_not_connect = true
  expect(issues(nc)).toHaveLength(1)
  reject((j) => {
    move(j, "C7", 4, 0)
  })
  reject((j) => {
    move(j, "D2", 10, 6)
  })
  const compact = structuredClone(after)
  move(compact, "C7", 6.8, 1.7)
  move(compact, "D2", 8.2, 1.0)
  expect(issues(compact)).toEqual([])

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
