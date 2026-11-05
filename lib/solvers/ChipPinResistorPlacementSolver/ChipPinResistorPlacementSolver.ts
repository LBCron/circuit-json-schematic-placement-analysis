import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  ResistorSeparatedFromChipPin,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import { hasVisibleSchematicConnection } from "../../utils/has-visible-schematic-connection"
import type { SolverContext } from "../SolverContext"

/** A private chip/resistor branch placed far beyond the chip's opposite edge. */
export class ChipPinResistorPlacementSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly resistorIds: string[]
  private readonly unpopulated = new Set<string>()
  private currentIndex = 0

  constructor(
    private readonly params: {
      ctx: SolverContext
      issues: SchematicPlacementIssue[]
    },
  ) {
    super()
    this.index = new PlacementNetworkIndex(params.ctx)
    for (const element of params.ctx.circuitJson)
      if (element.type === "pcb_component" && element.do_not_place)
        this.unpopulated.add(element.source_component_id)
    this.resistorIds = [...this.index.components.values()]
      .filter((component) => component.ftype === "simple_resistor")
      .map((component) => component.source_component_id)
    this.solved = this.resistorIds.length === 0
  }

  override _step(): void {
    const resistorId = this.resistorIds[this.currentIndex++]
    this.solved = this.currentIndex >= this.resistorIds.length
    if (!resistorId || this.unpopulated.has(resistorId)) return
    const index = this.index
    const component = index.components.get(resistorId)
    const resistor = index.placement(resistorId)
    const nets = index.twoTerminalNets(resistorId)
    const resistorPorts = index.portsByComponent.get(resistorId) ?? []
    if (
      component?.ftype !== "simple_resistor" ||
      !Number.isFinite(component.resistance) ||
      component.resistance <= 0 ||
      !resistor ||
      !nets ||
      resistorPorts.some((p) => p.do_not_connect)
    )
      return

    const candidates: ResistorSeparatedFromChipPin[] = []
    for (const resistorPort of resistorPorts) {
      const signal = index.connected(resistorPort.source_port_id)
      if (index.isRail(signal)) continue
      const members = index.portsByNet.get(signal) ?? []
      if (members.length !== 2) continue
      const chipPort = members.find((p) => p.source_component_id !== resistorId)
      if (
        !chipPort ||
        chipPort.do_not_connect ||
        chipPort.requires_ground ||
        chipPort.provides_ground
      )
        continue
      const otherPort = resistorPorts.find((p) => p !== resistorPort)!
      const otherNet = index.connected(otherPort.source_port_id)
      // Grounded chip signals and resistor-fed supply pins are both local branches.
      // Contradictory ground/power metadata does not establish a placement rule.
      if (
        index.groundNets.has(otherNet) &&
        (index.powerNets.has(otherNet) || hasSupplyRole(chipPort))
      )
        continue
      const hostId = chipPort.source_component_id
      const host = index.placement(hostId)
      if (
        index.components.get(hostId)?.ftype !== "simple_chip" ||
        (index.portsByComponent.get(hostId)?.length ?? 0) < 3 ||
        this.unpopulated.has(hostId) ||
        !host ||
        !index.sameLocalScope(host, resistor)
      )
        continue
      const chipPin = index.port(chipPort)
      const resistorPin = index.port(resistorPort)
      if (
        !chipPin ||
        !resistorPin ||
        [chipPin, resistorPin].some(
          (pin) =>
            pin.schematic_sheet_id !== host.schematicSheetId ||
            !Number.isFinite(pin.center.x) ||
            !Number.isFinite(pin.center.y),
        ) ||
        [host, resistor].some(
          (box) =>
            ![box.schX, box.schY, box.width, box.height].every(
              Number.isFinite,
            ) ||
            box.width <= 0 ||
            box.height <= 0,
        )
      )
        continue

      // Power and series-signal branches can belong to separate net-label blocks.
      // Require a drawn connection for these additional topologies.
      if (
        (!index.groundNets.has(otherNet) &&
          !hasVisibleSchematicConnection(
            this.params.ctx.circuitJson,
            index,
            chipPort,
            resistorPort,
          )) ||
        this.crossesSectionDivider(host, resistor)
      )
        continue
      const side = chipPin.facing_direction
      if (!side) continue
      const horizontal = side === "left" || side === "right"
      const sign = side === "left" || side === "down" ? -1 : 1
      const oppositeDistance =
        -sign *
        (horizontal ? resistor.schX - host.schX : resistor.schY - host.schY)
      const halfBodies = horizontal
        ? (host.width + resistor.width) / 2
        : (host.height + resistor.height) / 2
      if (oppositeDistance <= halfBodies + 0.2) continue
      const pinDistance = Math.hypot(
        chipPin.center.x - resistorPin.center.x,
        chipPin.center.y - resistorPin.center.y,
      )
      // Allow normal symbol/label spacing; this is a schematic readability threshold.
      const maxRecommendedPinDistance = Math.max(
        4,
        3 * Math.max(resistor.width, resistor.height),
      )
      if (pinDistance <= maxRecommendedPinDistance) continue
      // A series signal resistor also has an owner at its far end. Only suggest
      // this host when moving beside it shortens both connections. Shared or
      // missing far endpoints are deliberately left undecided.
      if (!index.isRail(otherNet)) {
        const farMembers = index.portsByNet.get(otherNet) ?? []
        const peer = farMembers.find(
          (p) => p.source_component_id !== resistorId,
        )
        const peerBox = peer && index.placement(peer.source_component_id)
        const peerPin = peer && index.port(peer)
        const farPin = index.port(otherPort)
        if (
          farMembers.length !== 2 ||
          !peer ||
          peer.do_not_connect ||
          peer.source_component_id === hostId ||
          this.unpopulated.has(peer.source_component_id) ||
          !peerBox ||
          !peerPin ||
          !farPin ||
          !index.sameLocalScope(host, peerBox) ||
          peerPin.schematic_sheet_id !== host.schematicSheetId ||
          farPin.schematic_sheet_id !== host.schematicSheetId ||
          ![
            peerPin.center.x,
            peerPin.center.y,
            farPin.center.x,
            farPin.center.y,
          ].every(Number.isFinite)
        )
          continue
        const clearance = Math.max(1.5, resistor.width, resistor.height)
        const dx =
          chipPin.center.x +
          (horizontal ? sign * clearance : 0) -
          resistorPin.center.x
        const dy =
          chipPin.center.y +
          (horizontal ? 0 : sign * clearance) -
          resistorPin.center.y
        const oldDistance = Math.hypot(
          farPin.center.x - peerPin.center.x,
          farPin.center.y - peerPin.center.y,
        )
        const newDistance = Math.hypot(
          farPin.center.x + dx - peerPin.center.x,
          farPin.center.y + dy - peerPin.center.y,
        )
        if (newDistance >= oldDistance - 0.2) continue
      }
      candidates.push({
        lineItemType: "ResistorSeparatedFromChipPin",
        hostSchematicBox: host,
        resistorSchematicBox: resistor,
        chipSourcePortId: chipPort.source_port_id,
        resistorSourcePortId: resistorPort.source_port_id,
        pinDistance,
        maxRecommendedPinDistance,
        message: `Place ${resistor.sourceComponentName || "resistor"} beside its connected pin on the ${side} side of ${host.sourceComponentName || "chip"} so the ${index.groundNets.has(otherNet) ? "resistor-to-ground" : "resistor"} branch can be read together. Preserve pin connections, leave room for labels, and reroute affected traces; exact alignment is not required.`,
      })
    }
    if (candidates.length === 1) this.params.issues.push(candidates[0]!)
  }

  // Core section boundaries can be unowned dashed lines within a single group.
  private crossesSectionDivider(
    a: SchematicBoxPlacement,
    b: SchematicBoxPlacement,
  ) {
    const dx = b.schX - a.schX,
      dy = b.schY - a.schY
    return this.params.ctx.circuitJson.some((line) => {
      if (
        line.type !== "schematic_line" ||
        !line.is_dashed ||
        line.schematic_component_id ||
        line.schematic_sheet_id !== a.schematicSheetId ||
        ![line.x1, line.y1, line.x2, line.y2].every(Number.isFinite)
      )
        return false
      const sx = line.x2 - line.x1,
        sy = line.y2 - line.y1,
        cross = dx * sy - dy * sx
      if (Math.abs(cross) < 1e-9) return false
      const ox = line.x1 - a.schX,
        oy = line.y1 - a.schY
      const t = (ox * sy - oy * sx) / cross,
        u = (ox * dy - oy * dx) / cross
      return t > 1e-6 && t < 1 - 1e-6 && u >= 0 && u <= 1
    })
  }

  static issueToString(issue: ResistorSeparatedFromChipPin): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "hostComponentName",
      issue.hostSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "resistorName",
      issue.resistorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "pinDistance", issue.pinDistance)
    addAttr(attrs, "maxRecommendedPinDistance", issue.maxRecommendedPinDistance)
    addAttr(attrs, "message", issue.message)
    return `<ResistorSeparatedFromChipPin ${attrs.join(" ")} />`
  }
}

function hasSupplyRole(port: SourcePort): boolean {
  return Boolean(
    port.requires_power ||
      port.provides_power ||
      port.requires_ground ||
      port.provides_ground ||
      port.requires_voltage !== undefined ||
      port.provides_voltage !== undefined,
  )
}
