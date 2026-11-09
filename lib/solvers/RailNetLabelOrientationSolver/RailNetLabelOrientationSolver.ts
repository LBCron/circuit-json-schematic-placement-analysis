import { BaseSolver } from "@tscircuit/solver-utils"
import type {
  CircuitJson,
  SchematicComponent,
  SchematicNetLabel,
  SchematicPort,
  SchematicSheet,
  SchematicTrace,
  SourceTrace,
} from "circuit-json"
import {
  findConnectedNetworks,
  getSourcePortConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import type {
  RailNetLabelHasIncorrectOrientation,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { getNetLabelBounds } from "../../utils/net-label-bounds"
import type { SolverContext } from "../SolverContext"

type Point = { x: number; y: number }
type RailRole = "power" | "ground"

const POSITION_EPSILON = 0.01

/** Ensure rail net labels point upward for positive supplies and downward for ground. */
export class RailNetLabelOrientationSolver extends BaseSolver {
  private readonly labels: SchematicNetLabel[]
  private readonly networkById = new Map<string, string>()
  private readonly railRoleByNetwork = new Map<string, RailRole>()
  private readonly connectedSourcePortIds = new Set<string>()
  private readonly sourceTracesById = new Map<string, SourceTrace>()
  private readonly sheetNamesById = new Map<string, string>()
  private readonly placementByComponentId = new Map<
    string,
    SchematicBoxPlacement
  >()
  private readonly ports: SchematicPort[]
  private readonly portsById = new Map<string, SchematicPort>()
  private readonly schematicComponents: SchematicComponent[]
  private readonly traces: SchematicTrace[]
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
    const { circuitJson, componentPlacements } = ctx

    for (const placement of componentPlacements) {
      if (placement.schematicComponentId) {
        this.placementByComponentId.set(
          placement.schematicComponentId,
          placement,
        )
      }
    }

    this.labels = []
    this.ports = []
    this.schematicComponents = []
    this.traces = []
    for (const element of circuitJson) {
      if (element.type === "schematic_net_label") {
        this.labels.push(element)
      } else if (element.type === "schematic_port") {
        this.ports.push(element)
        this.portsById.set(element.schematic_port_id, element)
      } else if (element.type === "schematic_component") {
        this.schematicComponents.push(element)
      } else if (element.type === "schematic_trace") {
        this.traces.push(element)
      } else if (element.type === "source_trace") {
        this.sourceTracesById.set(element.source_trace_id, element)
      } else if (element.type === "schematic_sheet") {
        const sheet = element as SchematicSheet
        if (sheet.name) {
          this.sheetNamesById.set(sheet.schematic_sheet_id, sheet.name)
        }
      }
    }

    this.buildClassifiedNetworks(circuitJson)
    this.solved = this.labels.length === 0
  }

  override _step(): void {
    const label = this.labels[this.currentIndex++]
    this.solved = this.currentIndex >= this.labels.length
    if (!label) return

    const networkKey = this.resolveLabelNetwork(label)
    if (!networkKey) return

    const railType = this.railRoleByNetwork.get(networkKey)
    if (!railType) return

    const expectedAnchorSide = railType === "ground" ? "top" : "bottom"
    const expectedFacingDirection = railType === "ground" ? "down" : "up"
    if (label.anchor_side === expectedAnchorSide) return
    if (
      !this.isUnobstructedMisorientedRailLabel(
        label,
        railType,
        expectedAnchorSide,
      )
    ) {
      return
    }

    const hostSchematicBox = this.resolveAssociatedPlacement(label)
    const schematicSheetId =
      label.schematic_sheet_id ?? hostSchematicBox?.schematicSheetId
    const schematicSheetName =
      (schematicSheetId
        ? this.sheetNamesById.get(schematicSheetId)
        : undefined) ?? hostSchematicBox?.schematicSheetName

    const onComponent = hostSchematicBox?.sourceComponentName
      ? ` on ${hostSchematicBox.sourceComponentName}`
      : ""

    this.issues.push({
      lineItemType: "RailNetLabelHasIncorrectOrientation",
      schematicNetLabelId: label.schematic_net_label_id,
      sourceNetId: label.source_net_id,
      schematicSheetId,
      schematicSheetName,
      hostSchematicBox,
      text: label.text,
      railType,
      anchorSide: label.anchor_side,
      expectedAnchorSide,
      expectedFacingDirection,
      labelBounds: getNetLabelBounds(label),
      message: `orient ${railType} net label "${label.text}"${onComponent} so it points ${expectedFacingDirection} (expected anchor_side="${expectedAnchorSide}", got "${label.anchor_side}")`,
    })
  }

  private buildClassifiedNetworks(circuitJson: CircuitJson): void {
    const idsByConnectivityKey = new Map<string, string[]>()
    const internalGroups: string[][] = []
    const allSourceIds: string[] = []

    const sourceNetsById = new Map<
      string,
      Extract<CircuitJson[number], { type: "source_net" }>
    >()
    const sourcePortsById = new Map<
      string,
      Extract<CircuitJson[number], { type: "source_port" }>
    >()

    const addConnectivityId = (key: string | undefined, id: string): void => {
      if (key === undefined) return
      const token = `connectivity:${key}`
      const group = idsByConnectivityKey.get(key)
      if (group) {
        group.push(id)
      } else {
        idsByConnectivityKey.set(key, [token, id])
      }
    }

    for (const element of circuitJson) {
      if (element.type === "source_net") {
        sourceNetsById.set(element.source_net_id, element)
        allSourceIds.push(element.source_net_id)
        addConnectivityId(
          element.subcircuit_connectivity_map_key,
          element.source_net_id,
        )
      } else if (element.type === "source_port") {
        sourcePortsById.set(element.source_port_id, element)
        allSourceIds.push(element.source_port_id)
        addConnectivityId(
          element.subcircuit_connectivity_map_key,
          element.source_port_id,
        )
      } else if (element.type === "source_trace") {
        const key = element.subcircuit_connectivity_map_key
        if (key !== undefined) {
          for (const id of [
            ...element.connected_source_net_ids,
            ...element.connected_source_port_ids,
          ]) {
            addConnectivityId(key, id)
          }
        }
      } else if (
        element.type === "source_component_internal_connection" &&
        element.source_port_ids.length > 1
      ) {
        internalGroups.push(element.source_port_ids)
      } else if (element.type === "source_component") {
        for (const group of element.internally_connected_source_port_ids ??
          []) {
          if (group.length > 1) internalGroups.push(group)
        }
      }
    }

    const sourceConnectivity =
      getSourcePortConnectivityMapFromCircuitJson(circuitJson)
    const connectedNetworks = findConnectedNetworks([
      ...Object.values(sourceConnectivity.netMap),
      ...idsByConnectivityKey.values(),
      ...internalGroups,
      ...allSourceIds.map((id) => [id]),
    ])

    for (const [networkKey, memberIds] of Object.entries(connectedNetworks)) {
      const networkPortIds: string[] = []
      let realEntityCount = 0
      for (const id of memberIds) {
        this.networkById.set(id, networkKey)
        if (sourceNetsById.has(id)) {
          realEntityCount++
        } else if (sourcePortsById.has(id)) {
          realEntityCount++
          networkPortIds.push(id)
        }
      }
      if (realEntityCount > 1) {
        for (const portId of networkPortIds) {
          this.connectedSourcePortIds.add(portId)
        }
      }

      let hasSourceNet = false
      let hasGround = false
      let hasGroundProvider = false
      let hasPower = false
      let hasPowerProvider = false
      let hasPositiveSupplyFlag = false
      let hasExplicitNonPositiveSupply = false
      let hasNegativeVoltage = false
      let hasNonZeroVoltage = false
      const componentIds = new Set<string>()

      for (const id of memberIds) {
        const net = sourceNetsById.get(id)
        if (net) {
          hasSourceNet = true
          if (net.is_ground) hasGround = true
          if (net.is_positive_voltage_source) {
            hasPower = true
            hasPositiveSupplyFlag = true
          }
          if (net.is_power) {
            hasPower = true
            if (net.is_positive_voltage_source === false) {
              hasExplicitNonPositiveSupply = true
            }
          }
        }

        const port = sourcePortsById.get(id)
        if (port) {
          if (port.source_component_id) {
            componentIds.add(port.source_component_id)
          }
          if (port.provides_ground) {
            hasGround = true
            hasGroundProvider = true
          }
          if (port.requires_ground) {
            hasGround = true
          }
          if (port.provides_power) {
            hasPower = true
            hasPowerProvider = true
          }
          if (port.requires_power) {
            hasPower = true
          }
          for (const voltage of [
            port.provides_voltage,
            port.requires_voltage,
          ]) {
            if (typeof voltage === "number") {
              if (voltage !== 0) hasNonZeroVoltage = true
              if (voltage > 0) {
                hasPower = true
                hasPositiveSupplyFlag = true
                if (port.provides_voltage === voltage) {
                  hasPowerProvider = true
                }
              } else if (voltage < 0) {
                hasNegativeVoltage = true
              }
            }
          }
        }
      }

      // Skip contradictory or unpolarized/negative rail networks.
      if (hasGround && hasPower) continue

      if (
        hasGround &&
        !hasNonZeroVoltage &&
        (hasSourceNet || hasGroundProvider || componentIds.size <= 1)
      ) {
        this.railRoleByNetwork.set(networkKey, "ground")
      } else if (
        hasPower &&
        !hasNegativeVoltage &&
        (hasPositiveSupplyFlag || !hasExplicitNonPositiveSupply) &&
        (hasSourceNet || hasPowerProvider || componentIds.size <= 1)
      ) {
        this.railRoleByNetwork.set(networkKey, "power")
      }
    }
  }

  private resolveLabelNetwork(label: SchematicNetLabel): string | undefined {
    if (label.source_net_id) {
      const byNet =
        this.networkById.get(label.source_net_id) ??
        this.networkById.get(`connectivity:${label.source_net_id}`)
      if (byNet) return byNet
    }

    if (label.source_trace_id) {
      const byTrace = this.resolveSourceTraceNetwork(label.source_trace_id)
      if (byTrace) return byTrace
    }

    const anchor = label.anchor_position ?? label.center
    const sheetId = label.schematic_sheet_id ?? ""
    for (const port of this.ports) {
      if ((port.schematic_sheet_id ?? "") !== sheetId || !port.source_port_id) {
        continue
      }
      if (pointsMatch(port.center, anchor)) {
        const byPort = this.networkById.get(port.source_port_id)
        if (byPort) return byPort
      }
    }

    for (const trace of this.traces) {
      if ((trace.schematic_sheet_id ?? "") !== sheetId) continue
      if (!traceTouchesPoint(trace, anchor)) continue
      if (trace.source_trace_id) {
        const byTrace = this.resolveSourceTraceNetwork(trace.source_trace_id)
        if (byTrace) return byTrace
      }
      for (const port of this.ports) {
        if (
          (port.schematic_sheet_id ?? "") !== sheetId ||
          !port.source_port_id
        ) {
          continue
        }
        if (traceTouchesPoint(trace, port.center)) {
          const byPort = this.networkById.get(port.source_port_id)
          if (byPort) return byPort
        }
      }
    }

    return undefined
  }

  private resolveSourceTraceNetwork(sourceTraceId: string): string | undefined {
    const sourceTrace = this.sourceTracesById.get(sourceTraceId)
    if (!sourceTrace) return undefined
    if (sourceTrace.subcircuit_connectivity_map_key) {
      const byKey = this.networkById.get(
        `connectivity:${sourceTrace.subcircuit_connectivity_map_key}`,
      )
      if (byKey) return byKey
    }
    for (const id of [
      ...sourceTrace.connected_source_net_ids,
      ...sourceTrace.connected_source_port_ids,
    ]) {
      const byMember = this.networkById.get(id)
      if (byMember) return byMember
    }
    return undefined
  }

  private isUnobstructedMisorientedRailLabel(
    label: SchematicNetLabel,
    railType: RailRole,
    expectedAnchorSide: "top" | "bottom",
  ): boolean {
    const anchor = label.anchor_position ?? label.center
    const sheetId = label.schematic_sheet_id ?? ""
    const isUpsideDownVertical =
      (railType === "ground" && label.anchor_side === "bottom") ||
      (railType === "power" && label.anchor_side === "top")

    const directPorts = this.ports.filter(
      (port) =>
        (port.schematic_sheet_id ?? "") === sheetId &&
        pointsMatch(port.center, anchor),
    )
    if (directPorts.length > 0) {
      const hasVerticalPort = directPorts.some(
        (port) =>
          port.facing_direction === "up" || port.facing_direction === "down",
      )
      return (
        hasVerticalPort &&
        this.isReorientedLabelClearOfObstructions(
          label,
          anchor,
          sheetId,
          expectedAnchorSide,
        )
      )
    }

    const touchingTraces = this.traces.filter(
      (trace) =>
        (trace.schematic_sheet_id ?? "") === sheetId &&
        traceTouchesPoint(trace, anchor),
    )
    if (touchingTraces.length === 0) {
      return (
        isUpsideDownVertical &&
        this.isReorientedLabelClearOfObstructions(
          label,
          anchor,
          sheetId,
          expectedAnchorSide,
        )
      )
    }

    const touchedPortMap = new Map<string, SchematicPort>()
    for (const trace of touchingTraces) {
      for (const edge of trace.edges) {
        for (const portId of [
          edge.from_schematic_port_id,
          edge.to_schematic_port_id,
        ]) {
          const port = portId ? this.portsById.get(portId) : undefined
          if (port?.schematic_component_id) {
            touchedPortMap.set(port.schematic_port_id, port)
          }
        }
      }
      for (const port of this.ports) {
        if (
          (port.schematic_sheet_id ?? "") === sheetId &&
          port.schematic_component_id &&
          traceTouchesPoint(trace, port.center)
        ) {
          touchedPortMap.set(port.schematic_port_id, port)
        }
      }
    }

    const touchedPorts = [...touchedPortMap.values()]
    if (
      touchedPorts.length > 0 &&
      touchedPorts.every(
        (port) =>
          port.facing_direction === "up" || port.facing_direction === "down",
      )
    ) {
      return (
        isUpsideDownVertical &&
        this.isReorientedLabelClearOfObstructions(
          label,
          anchor,
          sheetId,
          expectedAnchorSide,
        )
      )
    }

    const hasVerticalBusSegment = touchingTraces.some((trace) =>
      trace.edges.some((edge) => Math.abs(edge.to.y - edge.from.y) > 0.05),
    )
    if (!hasVerticalBusSegment || touchedPorts.length < 2) return false

    const componentIds = new Set(
      touchedPorts.map((port) => port.schematic_component_id),
    )
    if (componentIds.size !== 1) return false
    const componentId = [...componentIds][0]!

    const sides = new Set(
      touchedPorts.map(
        (port) => port.side_of_component ?? port.facing_direction,
      ),
    )
    if (sides.size !== 1) return false
    const side = [...sides][0]
    if (side !== "left" && side !== "right") return false

    const sameSideOtherConnectedPorts = this.ports.filter(
      (port) =>
        (port.schematic_sheet_id ?? "") === sheetId &&
        port.schematic_component_id === componentId &&
        (port.side_of_component ?? port.facing_direction) === side &&
        !touchedPortMap.has(port.schematic_port_id) &&
        this.isPortOccupied(port, sheetId),
    )

    if (railType === "ground") {
      const minBusY = Math.min(...touchedPorts.map((port) => port.center.y))
      if (
        sameSideOtherConnectedPorts.some(
          (port) => port.center.y < minBusY - POSITION_EPSILON,
        )
      ) {
        return false
      }
      return this.isReorientedLabelClearOfObstructions(
        label,
        { x: anchor.x, y: minBusY },
        sheetId,
        expectedAnchorSide,
      )
    }

    const maxBusY = Math.max(...touchedPorts.map((port) => port.center.y))
    if (
      sameSideOtherConnectedPorts.some(
        (port) => port.center.y > maxBusY + POSITION_EPSILON,
      )
    ) {
      return false
    }
    return this.isReorientedLabelClearOfObstructions(
      label,
      { x: anchor.x, y: maxBusY },
      sheetId,
      expectedAnchorSide,
    )
  }

  private isPortOccupied(port: SchematicPort, sheetId: string): boolean {
    if (port.is_connected === true) return true
    if (
      port.source_port_id &&
      this.connectedSourcePortIds.has(port.source_port_id)
    ) {
      return true
    }
    if (
      this.labels.some(
        (other) =>
          (other.schematic_sheet_id ?? "") === sheetId &&
          pointsMatch(other.anchor_position ?? other.center, port.center),
      )
    ) {
      return true
    }
    return this.traces.some(
      (trace) =>
        (trace.schematic_sheet_id ?? "") === sheetId &&
        traceTouchesPoint(trace, port.center),
    )
  }

  private isReorientedLabelClearOfObstructions(
    label: SchematicNetLabel,
    anchor: Point,
    sheetId: string,
    expectedAnchorSide: "top" | "bottom",
  ): boolean {
    const labelSpan = 0.72
    const candidateRect =
      expectedAnchorSide === "top"
        ? {
            left: anchor.x - 0.12,
            right: anchor.x + 0.12,
            top: anchor.y - 0.02,
            bottom: anchor.y - labelSpan,
          }
        : {
            left: anchor.x - 0.12,
            right: anchor.x + 0.12,
            top: anchor.y + labelSpan,
            bottom: anchor.y + 0.02,
          }

    for (const component of this.schematicComponents) {
      if ((component.schematic_sheet_id ?? "") !== sheetId || !component.size) {
        continue
      }
      const left = component.center.x - component.size.width / 2
      const right = component.center.x + component.size.width / 2
      const top = component.center.y + component.size.height / 2
      const bottom = component.center.y - component.size.height / 2
      if (
        candidateRect.left < right &&
        candidateRect.right > left &&
        candidateRect.bottom < top &&
        candidateRect.top > bottom
      ) {
        return false
      }
    }

    for (const other of this.labels) {
      if (
        other.schematic_net_label_id === label.schematic_net_label_id ||
        (other.schematic_sheet_id ?? "") !== sheetId
      ) {
        continue
      }
      const bounds = getNetLabelBounds(other)
      if (
        candidateRect.left < bounds.right &&
        candidateRect.right > bounds.left &&
        candidateRect.bottom < bounds.top &&
        candidateRect.top > bounds.bottom
      ) {
        return false
      }
    }

    return true
  }

  private resolveAssociatedPlacement(
    label: SchematicNetLabel,
  ): SchematicBoxPlacement | undefined {
    const anchor = label.anchor_position ?? label.center
    const sheetId = label.schematic_sheet_id ?? ""

    const directComponentIds = new Set<string>()
    for (const port of this.ports) {
      if (
        (port.schematic_sheet_id ?? "") === sheetId &&
        port.schematic_component_id &&
        this.placementByComponentId.has(port.schematic_component_id) &&
        pointsMatch(port.center, anchor)
      ) {
        directComponentIds.add(port.schematic_component_id)
      }
    }
    if (directComponentIds.size === 1) {
      return this.placementByComponentId.get([...directComponentIds][0]!)
    }

    const traceComponentIds = new Set<string>()
    for (const trace of this.traces) {
      if ((trace.schematic_sheet_id ?? "") !== sheetId) continue
      if (!traceTouchesPoint(trace, anchor)) continue
      for (const port of this.ports) {
        if (
          (port.schematic_sheet_id ?? "") === sheetId &&
          port.schematic_component_id &&
          this.placementByComponentId.has(port.schematic_component_id) &&
          traceTouchesPoint(trace, port.center)
        ) {
          traceComponentIds.add(port.schematic_component_id)
        }
      }
    }
    if (traceComponentIds.size === 1) {
      return this.placementByComponentId.get([...traceComponentIds][0]!)
    }

    return undefined
  }

  static issueToString(issue: RailNetLabelHasIncorrectOrientation): string {
    const attrs: string[] = []
    addAttr(attrs, "netLabelId", issue.schematicNetLabelId)
    addAttr(attrs, "text", issue.text)
    addAttr(attrs, "componentName", issue.hostSchematicBox?.sourceComponentName)
    addAttr(attrs, "railType", issue.railType)
    addAttr(attrs, "anchorSide", issue.anchorSide)
    addAttr(attrs, "expectedAnchorSide", issue.expectedAnchorSide)
    addAttr(attrs, "expectedFacingDirection", issue.expectedFacingDirection)
    addAttr(attrs, "message", issue.message)
    return `<RailNetLabelHasIncorrectOrientation ${attrs.join(" ")} />`
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
