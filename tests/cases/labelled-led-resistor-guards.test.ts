import { expect, test } from "bun:test"
import { pcb_component, type CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createPa25LabelledIndicators } from "../assets/pa25-labelled-indicators"
import {
  getReproSchematicComponent as box,
  getReproSourcePort as port,
} from "../fixtures/placement-repro-assertions"
const reports = (j: CircuitJson) =>
  analyzeSchematicPlacement(j, {
    issueTypes: ["DiodeResistorNotAligned"],
  }).getIssues()
test("labelled diode resistor discovery requires a private local net and visible label evidence", async () => {
  const before = await createPa25LabelledIndicators(false, true),
    after = await createPa25LabelledIndicators(true, true),
    saved = JSON.stringify(before)
  expect(reports(before)).toHaveLength(1)
  expect(reports(after)).toEqual([])
  expect(reports([])).toEqual([])
  expect(JSON.stringify(before)).toBe(saved)
  expect(
    analyzeSchematicPlacement(before).getIssueCounts().DiodeResistorNotAligned,
  ).toBe(1)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    '<DiodeResistorNotAligned diodeComponentName="LED2"',
  )
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component" || e.type === "source_net")
      e.name = "unrelated"
    if (e.type === "source_port") {
      e.name = "VCC"
      e.port_hints = ["GND"]
    }
  }
  expect(reports(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(reports(j)).toEqual([])
  }
  for (const name of ["R44", "LED2"])
    for (const kind of [
      "group",
      "sheet",
      "source-group",
      "duplicate",
      "size",
      "position",
      "dnp",
    ] as const)
      reject((j) => {
        const b = box(j, name),
          c = j.find(
            (e) =>
              e.type === "source_component" &&
              e.source_component_id === b.source_component_id,
          )!
        if (kind === "group") b.schematic_group_id = "other"
        if (kind === "sheet") b.schematic_sheet_id = "other"
        if (kind === "source-group" && c.type === "source_component")
          c.source_group_id = "other"
        if (kind === "duplicate")
          j.push({ ...b, schematic_component_id: "duplicate" })
        if (kind === "size") b.size.width = NaN
        if (kind === "position") b.center.y = Infinity
        if (kind === "dnp")
          j.push(
            pcb_component.parse({
              type: "pcb_component",
              pcb_component_id: "dnp",
              source_component_id: b.source_component_id,
              center: { x: 0, y: 0 },
              width: 1,
              height: 1,
              rotation: 0,
              layer: "top",
              do_not_place: true,
            }),
          )
      })
  for (const [name, pin] of [
    ["R44", "pin2"],
    ["LED2", "anode"],
  ] as const)
    for (const kind of [
      "dnc",
      "missing",
      "duplicate",
      "position",
      "facing",
      "rail",
      "sheet",
    ] as const)
      reject((j) => {
        const p = port(j, name, pin),
          g = j.find(
            (e) =>
              e.type === "schematic_port" &&
              e.source_port_id === p.source_port_id,
          )!
        if (g.type !== "schematic_port") throw new Error("Missing port")
        if (kind === "dnc") p.do_not_connect = true
        if (kind === "rail") p.requires_power = true
        if (kind === "missing") j.splice(j.indexOf(g), 1)
        if (kind === "duplicate")
          j.push({ ...g, schematic_port_id: "duplicate" })
        if (kind === "position") g.center.x = NaN
        if (kind === "facing") delete g.facing_direction
        if (kind === "sheet") g.schematic_sheet_id = "other"
      })
  reject((j) => {
    const p = port(j, "R44", "pin2")
    j.push({
      ...p,
      source_port_id: "fanout",
      source_component_id: "third-component",
    })
  })
  reject((j) => {
    for (const e of j)
      if (e.type === "source_net" && e.name === "STATUS_LED_A")
        e.is_power = true
  })
  reject((j) => {
    for (let k = j.length - 1; k >= 0; k--)
      if (j[k]!.type === "schematic_text") j.splice(k, 1)
  })
  reject((j) => {
    for (const e of j)
      if (e.type === "schematic_text" && "source_trace_id" in e)
        Object.assign(e, { source_trace_id: "unrelated" })
  })
  // Distant functional blocks and aligned labelled pins remain valid.
  reject((j) => {
    const b = box(j, "LED2")
    b.center.x += 20
    for (const p of j)
      if (
        p.type === "schematic_port" &&
        p.schematic_component_id === b.schematic_component_id
      )
        p.center.x += 20
  })
  // The same semantic pair must not be reported twice when a wire and labels coexist.
  const wired = structuredClone(before),
    rp = port(wired, "R44", "pin2"),
    dp = port(wired, "LED2", "anode")
  const point = (id: string) => {
    const p = wired.find(
      (e) => e.type === "schematic_port" && e.source_port_id === id,
    )
    if (p?.type !== "schematic_port") throw new Error("Missing pin")
    return p.center
  }
  wired.push({
    type: "schematic_trace",
    schematic_trace_id: "direct",
    source_trace_id: "direct",
    edges: [{ from: point(rp.source_port_id), to: point(dp.source_port_id) }],
    junctions: [],
  })
  expect(reports(wired)).toHaveLength(1)
  // Two shared nets describe parallel components, not this series connection.
  reject((j) =>
    j.push({
      type: "source_trace",
      source_trace_id: "parallel",
      connected_source_port_ids: [
        port(j, "R44", "pin1").source_port_id,
        port(j, "LED2", "cathode").source_port_id,
      ],
      connected_source_net_ids: [],
    }),
  )
  // Ordinary diodes use the same discovery path; this is not an LED-only solver.
  const plain = structuredClone(before)
  const d = plain.find(
    (e) => e.type === "source_component" && e.name === "LED2",
  )!
  Object.assign(d, { ftype: "simple_diode" })
  expect(reports(plain)).toHaveLength(1)
})
