import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  RcrJunctionNotGrouped,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"

type ComponentPort = SourcePort & { source_component_id: string }

/** Two resistor paths meeting a grounded capacitor at one private three-way node. */
export class RcrJunctionGroupingSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly junctions: ComponentPort[][]
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
    for (const e of params.ctx.circuitJson)
      if (e.type === "pcb_component" && e.do_not_place)
        this.unpopulated.add(e.source_component_id)
    for (const e of params.ctx.circuitJson) {
      if (
        e.type !== "source_port" ||
        e.do_not_connect ||
        this.unpopulated.has(e.source_component_id!)
      )
        continue
      const net = this.index.connected(e.source_port_id)
      if (e.requires_ground || e.provides_ground) this.index.groundNets.add(net)
      if (
        e.requires_power ||
        e.provides_power ||
        e.requires_voltage !== undefined ||
        e.provides_voltage !== undefined
      )
        this.index.powerNets.add(net)
    }
    this.junctions = [...this.index.portsByNet]
      .filter(([net, ports]) => ports.length === 3 && !this.index.isRail(net))
      .map(([, ports]) => ports)
    this.solved = this.junctions.length === 0
  }

  override _step(): void {
    const ports = this.junctions[this.currentIndex++]
    this.solved = this.currentIndex >= this.junctions.length
    if (!ports || new Set(ports.map((p) => p.source_component_id)).size !== 3)
      return
    const index = this.index
    const resistors = ports.filter(
      (p) =>
        index.components.get(p.source_component_id)?.ftype ===
        "simple_resistor",
    )
    const capacitors = ports.filter(
      (p) =>
        index.components.get(p.source_component_id)?.ftype ===
        "simple_capacitor",
    )
    if (resistors.length !== 2 || capacitors.length !== 1) return
    const first = this.localPart(resistors[0]!),
      second = this.localPart(resistors[1]!),
      capacitor = this.localPart(capacitors[0]!)
    if (
      !first ||
      !second ||
      !capacitor ||
      !index.sameLocalScope(first.placement, second.placement) ||
      !index.sameLocalScope(first.placement, capacitor.placement)
    )
      return
    const net = index.connected(ports[0]!.source_port_id)
    const otherNet = (nets: [string, string]) => nets.find((n) => n !== net)!
    const ground = otherNet(capacitor.nets)
    if (!index.groundNets.has(ground) || index.powerNets.has(ground)) return
    const firstNet = otherNet(first.nets),
      secondNet = otherNet(second.nets)
    // Exclude grounded dividers, parallel RC networks and ambiguous shared nodes.
    if (
      index.groundNets.has(firstNet) ||
      index.groundNets.has(secondNet) ||
      firstNet === secondNet
    )
      return
    const parts = [first, second, capacitor]
    const maxPinDistance = Math.max(
      ...parts.flatMap((a) =>
        parts.map((b) =>
          Math.hypot(
            a.pin.center.x - b.pin.center.x,
            a.pin.center.y - b.pin.center.y,
          ),
        ),
      ),
    )
    const maxRecommendedPinDistance = Math.max(
      4,
      ...parts.map((p) => 3 * Math.max(p.placement.width, p.placement.height)),
    )
    if (maxPinDistance <= maxRecommendedPinDistance) return
    this.params.issues.push({
      lineItemType: "RcrJunctionNotGrouped",
      firstResistorSchematicBox: first.placement,
      secondResistorSchematicBox: second.placement,
      capacitorSchematicBox: capacitor.placement,
      maxPinDistance,
      maxRecommendedPinDistance,
      message: `Group ${first.placement.sourceComponentName || "the first resistor"}, ${second.placement.sourceComponentName || "the second resistor"} and ${capacitor.placement.sourceComponentName || "the capacitor"} around their shared junction so the two resistor paths and grounded capacitor can be read together. Preserve all pin connections and values, leave room for labels and reroute the affected traces; exact alignment is not required.`,
    })
  }

  private localPart(port: ComponentPort) {
    const id = port.source_component_id,
      component = this.index.components.get(id)
    if (!component || this.unpopulated.has(id)) return
    if (
      component.ftype === "simple_resistor" &&
      (!Number.isFinite(component.resistance) || component.resistance <= 0)
    )
      return
    if (
      component.ftype === "simple_capacitor" &&
      (!Number.isFinite(component.capacitance) || component.capacitance <= 0)
    )
      return
    const placement = this.index.placement(id),
      nets = this.index.twoTerminalNets(id),
      pin = this.index.port(port)
    if (
      !placement ||
      !nets ||
      !pin ||
      ![
        placement.schX,
        placement.schY,
        placement.width,
        placement.height,
      ].every(Number.isFinite) ||
      placement.width <= 0 ||
      placement.height <= 0
    )
      return
    if (
      (this.index.portsByComponent.get(id) ?? []).some((p) => {
        const schematicPin = this.index.port(p)
        return (
          p.do_not_connect ||
          !schematicPin ||
          schematicPin.schematic_sheet_id !== placement.schematicSheetId ||
          ![schematicPin.center.x, schematicPin.center.y].every(Number.isFinite)
        )
      })
    )
      return
    return { placement, nets, pin }
  }

  static issueToString(issue: RcrJunctionNotGrouped): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "firstResistorName",
      issue.firstResistorSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "secondResistorName",
      issue.secondResistorSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "capacitorName",
      issue.capacitorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "maxPinDistance", issue.maxPinDistance)
    addAttr(attrs, "maxRecommendedPinDistance", issue.maxRecommendedPinDistance)
    addAttr(attrs, "message", issue.message)
    return `<RcrJunctionNotGrouped ${attrs.join(" ")} />`
  }
}
