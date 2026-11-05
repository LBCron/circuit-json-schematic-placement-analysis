import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createConnectorPinBody } from "../assets/connector-pin-body"
import { getReproSchematicComponent as box } from "../fixtures/placement-repro-assertions"

test("external pin collisions use geometry and return separating moves in every orientation", async () => {
  const before = await createConnectorPinBody(),
    saved = JSON.stringify(before)
  const issues = (j: CircuitJson) =>
    analyzeSchematicPlacement(j, { issueTypes: ["ComponentOverlap"] })
      .getIssues()
      .filter((i) => i.lineItemType === "ComponentOverlap")
  const move = (j: CircuitJson, name: string, dx: number, dy: number) => {
    const b = box(j, name)
    b.center.x += dx
    b.center.y += dy
    for (const e of j)
      if (
        e.type === "schematic_port" &&
        e.schematic_component_id === b.schematic_component_id
      ) {
        e.center.x += dx
        e.center.y += dy
      }
  }
  const found = issues(before)
  expect(found).toHaveLength(1)
  expect(found[0]!.pinBodyOverlaps).toHaveLength(6)
  expect(analyzeSchematicPlacement(before).toString()).toContain(
    'reason="pin_body_overlap"',
  )
  expect(JSON.stringify(before)).toBe(saved)
  const compressed = structuredClone(before)
  for (const e of compressed)
    if (e.type === "schematic_component") e.size.height = 0.8
  expect(issues(compressed)).toHaveLength(1)
  // Each proposed move must actually clear the intrusion, including reciprocal pins.
  for (const turns of [0, 1, 2, 3])
    for (const reflect of [false, true]) {
      const j = structuredClone(before),
        directions = ["right", "up", "left", "down"] as const
      for (const e of j) {
        if (e.type !== "schematic_component" && e.type !== "schematic_port")
          continue
        for (let n = 0; n < turns; n++)
          e.center = { x: -e.center.y, y: e.center.x }
        if (reflect) e.center.x = -e.center.x
        e.center.x += 30
        e.center.y -= 20
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
      const hit = issues(j)
      expect(hit).toHaveLength(1)
      for (const suggestion of hit[0]!.correctionSuggestions) {
        const changed = structuredClone(j)
        move(
          changed,
          suggestion.targetComponentName!,
          suggestion.deltaSchX,
          suggestion.deltaSchY,
        )
        expect(issues(changed)).toEqual([])
      }
    }
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component") e.name = "arbitrary"
    if (e.type === "schematic_port") e.display_pin_label = "arbitrary"
  }
  expect(issues(renamed)).toHaveLength(1)
  const reject = (edit: (j: CircuitJson) => void) => {
    const j = structuredClone(before)
    edit(j)
    expect(issues(j)).toEqual([])
  }
  reject((j) => {
    box(j, "J8").schematic_sheet_id = "other"
  })
  reject((j) => {
    box(j, "J8").symbol_name = "boxresistor_right"
  })
  reject((j) => {
    box(j, "J8").schematic_symbol_id = "custom"
  })
  reject((j) => {
    box(j, "J8").is_box_with_pins = false
  })
  // A gap large enough for facing pins to touch is valid, even with overlapping envelopes.
  reject((j) => move(j, "J8", 0.8, 0))
  // Pins that end at the other body's edge, rather than inside it, are valid too.
  reject((j) => move(j, "J8", 0.4, 0))
  // A pin parallel to a body edge must not count as entering its interior.
  reject((j) => {
    move(j, "J8", 0, 3.2)
    for (const e of j) if (e.type === "schematic_port") e.center.y = 5.1
  })
  const withoutPins = before.filter((e) => e.type !== "schematic_port")
  expect(issues(withoutPins)).toEqual([])
  const invalid = structuredClone(before)
  for (const e of invalid) if (e.type === "schematic_port") e.center.x = NaN
  expect(issues(invalid)).toEqual([])
  // Actual body collisions still emit the existing finding once, not a second pin finding.
  const bodyCollision = structuredClone(before)
  move(bodyCollision, "J8", -0.2, 0)
  expect(issues(bodyCollision)).toHaveLength(1)
  expect(issues(bodyCollision)[0]!.pinBodyOverlaps).toBeUndefined()
})
