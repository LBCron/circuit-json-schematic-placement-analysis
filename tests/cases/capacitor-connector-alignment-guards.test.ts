import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createQuadCapacitorConnector } from "../assets/quad-capacitor-connector"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("capacitor-connector-alignment uses topology and preserves valid local layouts", async () => {
  const before = await createQuadCapacitorConnector(),
    after = await createQuadCapacitorConnector(true),
    saved = JSON.stringify(before)
  const leafId = box(before, "C21").source_component_id
  const all = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["CapacitorConnectorNotAligned"],
    }).getIssues()
  const issues = (j: CircuitJson) =>
    all(j).filter(
      (i) =>
        i.lineItemType === "CapacitorConnectorNotAligned" &&
        i.capacitorSchematicBox.sourceComponentId === leafId,
    )
  expect(all(before)).toHaveLength(1)
  expect(all(after)).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  expect(
    analyzeSchematicPlacement(before).getIssueCounts()
      .CapacitorConnectorNotAligned,
  ).toBe(1)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    "<CapacitorConnectorNotAligned ",
  )
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component") e.name = "arbitrary"
    if (e.type === "source_port") {
      e.name = "GND"
      e.port_hints = ["VCC", "output"]
      e.pin_number = 99
    }
    if (e.type === "source_net") e.name = "GND"
    if (e.type === "schematic_net_label") e.text = "GND"
  }
  expect(all(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  for (const name of ["JP1", "C21"]) {
    reject((j) => {
      box(j, name).schematic_sheet_id = "other"
    })
    reject((j) => {
      box(j, name).schematic_group_id = "other"
    })
    reject((j) => {
      box(j, name).subcircuit_id = "other"
    })
    reject((j) => {
      box(j, name).size.width = NaN
    })
    reject((j) => {
      box(j, name).size.height = 0
    })
    reject((j) => {
      j.push({ ...box(j, name), schematic_component_id: "duplicate" })
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
    reject((j) => {
      Object.assign(
        j.find(
          (e) =>
            e.type === "source_component" &&
            e.source_component_id === box(j, name).source_component_id,
        )!,
        { ftype: "simple_resistor" },
      )
    })
  }
  for (const [name, pin] of [
    ["JP1", "pin1"],
    ["C21", "pin2"],
  ].concat([["C21", "pin1"]])) {
    reject((j) => {
      port(j, name!, pin!).do_not_connect = true
    })
    reject((j) => {
      const id = port(j, name!, pin!).source_port_id
      j.splice(
        j.findIndex(
          (e) => e.type === "schematic_port" && e.source_port_id === id,
        ),
        1,
      )
    })
    reject((j) => {
      const id = port(j, name!, pin!).source_port_id
      for (const e of j)
        if (e.type === "schematic_port" && e.source_port_id === id)
          e.center.x = Infinity
    })
    reject((j) => {
      const id = port(j, name!, pin!).source_port_id
      const p = j.find(
        (e) => e.type === "schematic_port" && e.source_port_id === id,
      )
      if (p?.type === "schematic_port")
        j.push({ ...p, schematic_port_id: "duplicate" })
    })
  }
  reject((j) => {
    const p = port(j, "C21", "pin2")
    j.push(
      { ...p, source_port_id: "extra", source_component_id: "other" },
      {
        type: "source_trace",
        source_trace_id: "fanout",
        connected_source_port_ids: [p.source_port_id, "extra"],
        connected_source_net_ids: [],
      },
    )
  })
  for (const flag of [
    "requires_power",
    "provides_power",
    "requires_ground",
    "provides_ground",
  ] as const)
    reject((j) => {
      port(j, "C21", "pin2")[flag] = true
    })
  reject((j) => {
    j.push(
      {
        type: "source_net",
        source_net_id: "rail",
        member_source_group_ids: [],
        name: "not-a-rail-name",
        is_ground: true,
      },
      {
        type: "source_trace",
        source_trace_id: "rail-trace",
        connected_source_port_ids: [port(j, "C21", "pin2").source_port_id],
        connected_source_net_ids: ["rail"],
      },
    )
  })
  const divider = {
    type: "schematic_line" as const,
    schematic_line_id: "section-divider",
    color: "#000000",
    x1: 0.7,
    y1: -10,
    x2: 0.7,
    y2: 10,
    stroke_width: 0.02,
    is_dashed: true,
  }
  reject((j) => {
    j.push(divider)
  })
  for (const extra of [
    { is_dashed: false },
    { schematic_sheet_id: "other" },
    { schematic_component_id: "owned-decoration" },
  ]) {
    const j = structuredClone(before)
    j.push({ ...divider, ...extra })
    expect(issues(j)).toHaveLength(1)
  }
  for (const sameHost of [true, false])
    reject((j) => {
      const original = port(j, "JP1", "pin1"),
        host = box(j, "JP1")
      const componentId = sameHost
        ? original.source_component_id!
        : "second-connector"
      if (!sameHost) {
        const source = j.find(
          (e) =>
            e.type === "source_component" &&
            e.source_component_id === original.source_component_id,
        )!
        j.push({
          ...source,
          source_component_id: componentId,
        } as CircuitJson[number])
      }
      j.push({
        ...original,
        source_component_id: componentId,
        source_port_id: "second-connector-pin",
        pin_number: 3,
        subcircuit_connectivity_map_key: undefined,
      })
      const drawn = j.find(
        (e) =>
          e.type === "schematic_port" &&
          e.source_port_id === original.source_port_id,
      )
      if (drawn?.type === "schematic_port")
        j.push({
          ...drawn,
          schematic_port_id: "second-port",
          source_port_id: "second-connector-pin",
          center: { x: drawn.center.x, y: drawn.center.y - 0.4 },
        })
      j.push({
        type: "source_trace",
        source_trace_id: "other-cap-terminal",
        connected_source_port_ids: [
          port(j, "C21", "pin1").source_port_id,
          "second-connector-pin",
        ],
        connected_source_net_ids: [],
      })
    })
  const alternate = structuredClone(before)
  Object.assign(
    alternate.find(
      (e) =>
        e.type === "source_component" &&
        e.source_component_id === box(alternate, "JP1").source_component_id,
    )!,
    { ftype: "simple_connector" },
  )
  expect(all(alternate)).toHaveLength(1)
  // An unrelated unconnected host pin does not invalidate the tested branch.
  const nc = structuredClone(before)
  port(nc, "JP1", "pin2").do_not_connect = true
  expect(all(nc)).toHaveLength(1)
  const move = (j: CircuitJson, x: number, y: number) => {
    const c = box(j, "C21"),
      dx = x - c.center.x,
      dy = y - c.center.y
    c.center = { x, y }
    for (const e of j)
      if (
        e.type === "schematic_port" &&
        e.schematic_component_id === c.schematic_component_id
      )
        e.center = { x: e.center.x + dx, y: e.center.y + dy }
  }
  const overlapping = structuredClone(before)
  move(
    overlapping,
    box(overlapping, "JP1").center.x,
    box(overlapping, "JP1").center.y,
  )
  expect(issues(overlapping)).toEqual([])
  const compact = structuredClone(before)
  move(compact, 3.4, 0.6)
  expect(issues(compact)).toEqual([])
  const longAligned = structuredClone(after)
  move(longAligned, 10, 0.1)
  expect(issues(longAligned)).toEqual([])
  // Do not force horizontal capacitors or exactly aligned rows on the valid pin side.
  for (const y of [0, 2, 5]) {
    const j = structuredClone(before)
    move(j, 4.5, y)
    expect(issues(j)).toEqual([])
  }
  reject((j) => {
    port(j, "C21", "pin1").requires_ground = true
  })
  reject((j) => {
    port(j, "C21", "pin1").provides_power = true
  })
  reject((j) => {
    j.push({
      type: "source_trace",
      source_trace_id: "shorted",
      connected_source_port_ids: [
        port(j, "C21", "pin1").source_port_id,
        port(j, "C21", "pin2").source_port_id,
      ],
      connected_source_net_ids: [],
    })
  })
  for (const capacitance of [0, NaN, Infinity])
    reject((j) => {
      Object.assign(
        j.find(
          (e) =>
            e.type === "source_component" && e.source_component_id === leafId,
        )!,
        { capacitance },
      )
    })
  // Equivalent rotations/reflections must behave identically, including long valid wires.
  for (const source of [before, longAligned])
    for (const turns of [0, 1, 2, 3])
      for (const reflect of [false, true]) {
        const j = structuredClone(source),
          directions = ["right", "up", "left", "down"] as const
        for (const e of j) {
          if (e.type !== "schematic_port" && e.type !== "schematic_component")
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
              directions[(directions.indexOf(e.facing_direction) + turns) % 4]!
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
