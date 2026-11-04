import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createClimateChipTestPoints } from "../assets/climate-chip-test-points"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"

test("chip-pin-test-point-alignment uses topology and preserves valid local layouts", async () => {
  const before = await createClimateChipTestPoints(),
    after = await createClimateChipTestPoints(true),
    saved = JSON.stringify(before)
  const leafId = box(before, "TP9").source_component_id
  const all = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["ChipPinTestPointNotAligned"],
    }).getIssues()
  const issues = (j: CircuitJson) =>
    all(j).filter(
      (i) =>
        i.lineItemType === "ChipPinTestPointNotAligned" &&
        i.testPointSchematicBox.sourceComponentId === leafId,
    )
  expect(all(before)).toHaveLength(2)
  expect(all(after)).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  expect(
    analyzeSchematicPlacement(before).getIssueCounts()
      .ChipPinTestPointNotAligned,
  ).toBe(2)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    "<ChipPinTestPointNotAligned ",
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
  expect(all(renamed)).toHaveLength(2)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  for (const name of ["U1", "TP9"]) {
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
    ["U1", "pin30"],
    ["TP9", "pin1"],
  ]) {
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
    const p = port(j, "TP9", "pin1")
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
      port(j, "TP9", "pin1")[flag] = true
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
        connected_source_port_ids: [port(j, "TP9", "pin1").source_port_id],
        connected_source_net_ids: ["rail"],
      },
    )
  })
  const divider = {
    type: "schematic_line" as const,
    schematic_line_id: "section-divider",
    color: "#000000",
    x1: -10,
    y1: 3,
    x2: 10,
    y2: 3,
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
  const bank = structuredClone(before)
  const probe = box(bank, "TP10"),
    source = bank.find(
      (e) =>
        e.type === "source_component" &&
        e.source_component_id === probe.source_component_id,
    )!,
    terminal = port(bank, "TP10", "pin1")
  bank.push({
    ...source,
    source_component_id: "rail-probe",
    name: "arbitrary",
  } as CircuitJson[number])
  bank.push({
    ...terminal,
    source_component_id: "rail-probe",
    source_port_id: "rail-probe-pin",
    subcircuit_connectivity_map_key: "separate-rail-probe-net",
    provides_ground: true,
  })
  bank.push({
    ...probe,
    source_component_id: "rail-probe",
    schematic_component_id: "rail-probe-sch",
    center: { x: 5, y: 5 },
  })
  const drawn = bank.find(
    (e) =>
      e.type === "schematic_port" &&
      e.source_port_id === terminal.source_port_id,
  )
  if (drawn?.type !== "schematic_port") throw new Error("missing probe pin")
  bank.push({
    ...drawn,
    source_port_id: "rail-probe-pin",
    schematic_port_id: "rail-probe-port",
    schematic_component_id: "rail-probe-sch",
    center: { x: 4.8, y: 5 },
  })
  expect(all(bank)).toEqual([])
  const signalOnly = structuredClone(bank)
  for (const e of signalOnly)
    if (e.type === "source_port") delete e.provides_ground
  expect(all(signalOnly)).toHaveLength(2)
  const alternate = structuredClone(before)
  Object.assign(
    alternate.find(
      (e) =>
        e.type === "source_component" &&
        e.source_component_id === box(alternate, "U1").source_component_id,
    )!,
    { ftype: "simple_op_amp" },
  )
  expect(all(alternate)).toHaveLength(2)
  // An unrelated unconnected host pin does not invalidate the tested branch.
  const nc = structuredClone(before)
  port(nc, "U1", "pin4").do_not_connect = true
  expect(all(nc)).toHaveLength(2)
  const move = (j: CircuitJson, x: number, y: number) => {
    const c = box(j, "TP9"),
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
    box(overlapping, "U1").center.x,
    box(overlapping, "U1").center.y,
  )
  expect(issues(overlapping)).toEqual([])
  const compact = structuredClone(before)
  move(compact, -2, -2.2)
  expect(issues(compact)).toEqual([])
  const longAligned = structuredClone(after)
  move(longAligned, -10, -2.8)
  expect(issues(longAligned)).toEqual([])
  // A large offset on a long branch is detected; a tolerance-sized offset is accepted.
  const near = structuredClone(longAligned)
  move(near, -10, -2.66)
  expect(issues(near)).toEqual([])
  const offset = structuredClone(longAligned)
  move(offset, -10, -2.3)
  expect(issues(offset)).toHaveLength(1)
  // Equivalent rotations/reflections must behave identically, including long valid wires.
  for (const source of [before, longAligned, bank])
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
