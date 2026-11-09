import { BaseSolver } from "@tscircuit/solver-utils"
import type {
  CircuitJson,
  SchematicNetLabel,
  SchematicPort,
  SchematicTrace,
} from "circuit-json"
import type {
  SameComponentNetLabelCollision,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { rectOverlap } from "../../utils/geometry"
import { getNetLabelBounds } from "../../utils/net-label-bounds"
import type { SolverContext } from "../SolverContext"

type Point = { x: number; y: number }

const POSITION_EPSILON = 0.01
const OVERLAP_EPSILON = 1e-3

interface ComponentLabelGroup {
  placement: SchematicBoxPlacement
  labels: SchematicNetLabel[]
}

/** Detect colliding net-label flags attached to pins or traces of the same component. */
export class SameComponentNetLabelCollisionSolver extends BaseSolver {
  private readonly groups: ComponentLabelGroup[]
  private readonly issues: SchematicPlacementIssue[]
  private currentIndex = 0

  constructor({
    ctx,
    issues,
  }: {
    ctx: SolverContext
    issues: SchematicPlacementIssue[]
  }) {
    super()
    this.issues = issues
    this.groups = this.buildComponentLabelGroups(
      ctx.circuitJson,
      ctx.componentPlacements,
    )
    this.solved = this.groups.length === 0
  }

  override _step(): void {
    const group = this.groups[this.currentIndex++]
    this.solved = this.currentIndex >= this.groups.length
    if (!group) return

    const { placement, labels } = group
    const componentName = placement.sourceComponentName || "component"

    for (let i = 0; i < labels.length; i++) {
      const first = labels[i]!
      const firstBounds = getRenderedNetLabelFlagBounds(first)
      const firstAnchor = first.anchor_position ?? first.center

      for (let j = i + 1; j < labels.length; j++) {
        const second = labels[j]!
        if (first.anchor_side !== second.anchor_side) continue

        const secondAnchor = second.anchor_position ?? second.center
        if (pointsMatch(firstAnchor, secondAnchor)) {
          continue
        }

        const secondBounds = getRenderedNetLabelFlagBounds(second)
        const overlap = rectOverlap(firstBounds, secondBounds)
        if (
          !overlap ||
          overlap.ow <= OVERLAP_EPSILON ||
          overlap.oh <= OVERLAP_EPSILON
        ) {
          continue
        }

        const collisionBounds = {
          left: Math.max(firstBounds.left, secondBounds.left),
          right: Math.min(firstBounds.right, secondBounds.right),
          top: Math.min(firstBounds.top, secondBounds.top),
          bottom: Math.max(firstBounds.bottom, secondBounds.bottom),
        }

        this.issues.push({
          lineItemType: "SameComponentNetLabelCollision",
          schematicBox: placement,
          firstNetLabelId: first.schematic_net_label_id,
          secondNetLabelId: second.schematic_net_label_id,
          firstText: first.text,
          secondText: second.text,
          overlappingLabel1Bounds: firstBounds,
          overlappingLabel2Bounds: secondBounds,
          collisionBounds,
          message: `net labels "${first.text}" and "${second.text}" on ${componentName} overlap; increase pin spacing or stagger attached net-label stubs`,
        })
      }
    }
  }

  private buildComponentLabelGroups(
    circuitJson: CircuitJson,
    componentPlacements: SchematicBoxPlacement[],
  ): ComponentLabelGroup[] {
    const placementByComponentId = new Map<string, SchematicBoxPlacement>()
    for (const placement of componentPlacements) {
      if (placement.schematicComponentId) {
        placementByComponentId.set(placement.schematicComponentId, placement)
      }
    }

    const ports: SchematicPort[] = []
    const traces: SchematicTrace[] = []
    const labels: SchematicNetLabel[] = []
    for (const element of circuitJson) {
      if (element.type === "schematic_port") {
        ports.push(element)
      } else if (element.type === "schematic_trace") {
        traces.push(element)
      } else if (
        element.type === "schematic_net_label" &&
        !element.symbol_name
      ) {
        labels.push(element)
      }
    }

    const portsById = new Map(
      ports.map((port) => [port.schematic_port_id, port]),
    )
    const labelsByComponentId = new Map<string, SchematicNetLabel[]>()

    for (const label of labels) {
      const anchor = label.anchor_position ?? label.center
      const sheetId = label.schematic_sheet_id ?? ""
      const componentIds = new Set<string>()

      for (const port of ports) {
        if (
          (port.schematic_sheet_id ?? "") === sheetId &&
          port.schematic_component_id &&
          placementByComponentId.has(port.schematic_component_id) &&
          pointsMatch(port.center, anchor)
        ) {
          componentIds.add(port.schematic_component_id)
        }
      }

      if (componentIds.size === 0) {
        for (const trace of traces) {
          if ((trace.schematic_sheet_id ?? "") !== sheetId) continue
          if (!traceTouchesPoint(trace, anchor)) continue

          for (const edge of trace.edges) {
            for (const portId of [
              edge.from_schematic_port_id,
              edge.to_schematic_port_id,
            ]) {
              const port = portId ? portsById.get(portId) : undefined
              if (
                port?.schematic_component_id &&
                placementByComponentId.has(port.schematic_component_id)
              ) {
                componentIds.add(port.schematic_component_id)
              }
            }
          }

          for (const port of ports) {
            if (
              (port.schematic_sheet_id ?? "") === sheetId &&
              port.schematic_component_id &&
              placementByComponentId.has(port.schematic_component_id) &&
              traceTouchesPoint(trace, port.center)
            ) {
              componentIds.add(port.schematic_component_id)
            }
          }
        }
      }

      if (componentIds.size !== 1) continue
      const componentId = [...componentIds][0]!
      const list = labelsByComponentId.get(componentId)
      if (list) list.push(label)
      else labelsByComponentId.set(componentId, [label])
    }

    const groups: ComponentLabelGroup[] = []
    for (const [componentId, componentLabels] of labelsByComponentId) {
      if (componentLabels.length < 2) continue
      const placement = placementByComponentId.get(componentId)
      if (placement) groups.push({ placement, labels: componentLabels })
    }
    return groups
  }

  static issueToString(issue: SameComponentNetLabelCollision): string {
    const attrs: string[] = []
    addAttr(attrs, "componentName", issue.schematicBox.sourceComponentName)
    addAttr(attrs, "firstText", issue.firstText)
    addAttr(attrs, "secondText", issue.secondText)
    addAttr(attrs, "firstNetLabelId", issue.firstNetLabelId)
    addAttr(attrs, "secondNetLabelId", issue.secondNetLabelId)
    addAttr(attrs, "message", issue.message)
    return `<SameComponentNetLabelCollision ${attrs.join(" ")} />`
  }
}

function pointsMatch(a: Point, b: Point): boolean {
  return (
    Math.abs(a.x - b.x) <= POSITION_EPSILON &&
    Math.abs(a.y - b.y) <= POSITION_EPSILON
  )
}

function pointOnSegment(point: Point, from: Point, to: Point): boolean {
  const minX = Math.min(from.x, to.x) - POSITION_EPSILON
  const maxX = Math.max(from.x, to.x) + POSITION_EPSILON
  const minY = Math.min(from.y, to.y) - POSITION_EPSILON
  const maxY = Math.max(from.y, to.y) + POSITION_EPSILON
  if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
    return false
  }
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length <= 1e-6) return pointsMatch(point, from)
  const distance =
    Math.abs(dy * point.x - dx * point.y + to.x * from.y - to.y * from.x) /
    length
  return distance <= POSITION_EPSILON
}

function traceTouchesPoint(trace: SchematicTrace, point: Point): boolean {
  return trace.edges.some((edge) => pointOnSegment(point, edge.from, edge.to))
}

function getRenderedNetLabelFlagBounds(label: SchematicNetLabel) {
  if (label.anchor_side === "top" || label.anchor_side === "bottom") {
    return getNetLabelBounds(label)
  }

  const anchorX = label.anchor_position?.x ?? label.center.x
  const halfWidth = Math.abs(label.center.x - anchorX)
  if (halfWidth <= POSITION_EPSILON) {
    return getNetLabelBounds(label)
  }

  const top = label.center.y + 0.1
  const bottom = label.center.y - 0.1
  if (label.center.x >= anchorX) {
    return {
      left: anchorX,
      right: label.center.x + halfWidth,
      top,
      bottom,
    }
  }
  return {
    left: label.center.x - halfWidth,
    right: anchorX,
    top,
    bottom,
  }
}
