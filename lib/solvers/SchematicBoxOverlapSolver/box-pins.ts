import type {
  SchematicPinBodyOverlap,
  SchematicBoxPlacement,
} from "../../types"
import { getSchematicBoxComponentIds } from "../../utils/schematic-box-components"
import type { SolverContext } from "../SolverContext"

const EPSILON = 1e-9
const vectors = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, 1],
  down: [0, -1],
} as const

/** Only rectangular symbols have a body boundary that can be inferred from size. */
export function getExternalBoxPins(ctx: SolverContext) {
  const boxIds = getSchematicBoxComponentIds(ctx.circuitJson)
  const boxes = new Map(
    ctx.componentPlacements.map((b) => [b.schematicComponentId, b]),
  )
  const result = new Map<string, SchematicPinBodyOverlap[]>()
  for (const id of boxIds) result.set(id, [])
  for (const p of ctx.circuitJson) {
    if (
      p.type !== "schematic_port" ||
      !p.schematic_component_id ||
      !boxIds.has(p.schematic_component_id)
    )
      continue
    const b = boxes.get(p.schematic_component_id),
      v = p.facing_direction && vectors[p.facing_direction]
    if (
      !b ||
      !v ||
      p.schematic_sheet_id !== b.schematicSheetId ||
      ![b.schX, b.schY, b.width, b.height, p.center.x, p.center.y].every(
        Number.isFinite,
      ) ||
      b.width <= 0 ||
      b.height <= 0
    )
      continue
    // The pin must project outward from an edge, inside that edge's span.
    if (
      v[0]
        ? Math.abs(p.center.y - b.schY) > b.height / 2 + EPSILON
        : Math.abs(p.center.x - b.schX) > b.width / 2 + EPSILON
    )
      continue
    const start = {
      x: v[0] ? b.schX + (v[0] * b.width) / 2 : p.center.x,
      y: v[1] ? b.schY + (v[1] * b.height) / 2 : p.center.y,
    }
    if (
      (p.center.x - start.x) * v[0] + (p.center.y - start.y) * v[1] <=
      EPSILON
    )
      continue
    result.get(p.schematic_component_id)!.push({
      schematicPortId: p.schematic_port_id,
      componentName: b.sourceComponentName,
      pinNumber: p.pin_number,
      start,
      end: p.center,
    })
  }
  return result
}

/** Clip only the portion strictly inside the other body; boundary contact is valid. */
export function getPinBodyOverlaps(
  pins: SchematicPinBodyOverlap[],
  body: SchematicBoxPlacement,
) {
  const left = body.schX - body.width / 2,
    right = body.schX + body.width / 2,
    bottom = body.schY - body.height / 2,
    top = body.schY + body.height / 2
  return pins.flatMap((p) => {
    if (p.start.y === p.end.y) {
      if (p.start.y <= bottom + EPSILON || p.start.y >= top - EPSILON) return []
      const x1 = Math.max(left, Math.min(p.start.x, p.end.x)),
        x2 = Math.min(right, Math.max(p.start.x, p.end.x))
      return x2 - x1 > EPSILON
        ? [
            {
              ...p,
              start: { x: x1, y: p.start.y },
              end: { x: x2, y: p.start.y },
            },
          ]
        : []
    }
    if (p.start.x <= left + EPSILON || p.start.x >= right - EPSILON) return []
    const y1 = Math.max(bottom, Math.min(p.start.y, p.end.y)),
      y2 = Math.min(top, Math.max(p.start.y, p.end.y))
    return y2 - y1 > EPSILON
      ? [{ ...p, start: { x: p.start.x, y: y1 }, end: { x: p.start.x, y: y2 } }]
      : []
  })
}
