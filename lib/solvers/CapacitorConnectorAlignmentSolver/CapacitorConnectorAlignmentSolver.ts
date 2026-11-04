import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  CapacitorConnectorNotAligned,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"

const vectors = {
  up: [0, 1],
  down: [0, -1],
  left: [-1, 0],
  right: [1, 0],
} as const
type ComponentPort = SourcePort & { source_component_id: string }

/** Detect a signal capacitor placed behind its connected connector pin. */
export class CapacitorConnectorAlignmentSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly unpopulated = new Set<string>()
  private readonly nets: string[]
  private currentIndex = 0
  constructor(
    private readonly params: {
      ctx: SolverContext
      issues: SchematicPlacementIssue[]
    },
  ) {
    super()
    this.index = new PlacementNetworkIndex(params.ctx)
    for (const e of params.ctx.circuitJson) {
      if (e.type === "pcb_component" && e.do_not_place)
        this.unpopulated.add(e.source_component_id)
      if (e.type === "source_port") {
        const net = this.index.connected(e.source_port_id)
        if (e.requires_ground || e.provides_ground)
          this.index.groundNets.add(net)
        if (
          e.requires_power ||
          e.provides_power ||
          e.requires_voltage !== undefined ||
          e.provides_voltage !== undefined
        )
          this.index.powerNets.add(net)
      }
    }
    this.nets = [...this.index.portsByNet.keys()]
    this.solved = this.nets.length === 0
  }
  override _step(): void {
    const net = this.nets[this.currentIndex++]
    this.solved = this.currentIndex >= this.nets.length
    if (!net) return
    const index = this.index,
      ports = index.portsByNet.get(net)!
    if (index.isRail(net) || ports.length !== 2) return
    const hostPort = ports.find((p) =>
      ["simple_connector", "simple_pin_header"].includes(
        index.components.get(p.source_component_id)?.ftype ?? "",
      ),
    )
    const leafPort = ports.find(
      (p) =>
        index.components.get(p.source_component_id)?.ftype ===
        "simple_capacitor",
    )
    if (!hostPort || !leafPort) return
    const host = this.validPlacement(hostPort.source_component_id),
      leaf = this.validPlacement(leafPort.source_component_id)
    const hostPorts = index.portsByComponent.get(hostPort.source_component_id),
      leafPorts = index.portsByComponent.get(leafPort.source_component_id)
    if (
      !host ||
      !leaf ||
      !hostPorts ||
      hostPorts.length < 1 ||
      leafPorts?.length !== 2 ||
      !index.sameLocalScope(host, leaf)
    )
      return
    // Only the connected chip/connector pin is relevant; unrelated NC pins are allowed.
    if (
      !this.validPort(hostPort, host.schematicSheetId) ||
      leafPorts.some((p) => !this.validPort(p, leaf.schematicSheetId))
    )
      return
    const component = index.components.get(leafPort.source_component_id)
    const nets = index.twoTerminalNets(leafPort.source_component_id)
    // Rail shunts and decoupling capacitors are outside this signal-branch rule.
    if (
      component?.ftype !== "simple_capacitor" ||
      !Number.isFinite(component.capacitance) ||
      component.capacitance <= 0 ||
      !nets ||
      nets.some((n) => index.isRail(n))
    )
      return
    // A capacitor bridging connector pins (or two connectors) has no unique
    // host side to move toward; leave that topology to a network-level rule.
    const otherNet = nets.find((n) => n !== net)!
    if (
      (index.portsByNet.get(otherNet) ?? []).some((p) =>
        ["simple_connector", "simple_pin_header"].includes(
          index.components.get(p.source_component_id)?.ftype ?? "",
        ),
      )
    )
      return
    if (this.crossesSectionDivider(host, leaf)) return
    if (!this.isSeparated(host, leaf, hostPort, leafPort)) return
    this.params.issues.push({
      lineItemType: "CapacitorConnectorNotAligned",
      connectorSchematicBox: host,
      capacitorSchematicBox: leaf,
      connectorSourcePortId: hostPort.source_port_id,
      capacitorSourcePortId: leafPort.source_port_id,
      message: `Move ${leaf.sourceComponentName || "the capacitor"} onto the side of its connected pin on ${host.sourceComponentName || "the connector"}, with a short visible connection. Keep the connector symbol and pin order unchanged. Preserve capacitance, polarity and all pin connections, leave room for labels and neighboring parts, and reroute affected traces.`,
    })
  }
  private isSeparated(
    host: SchematicBoxPlacement,
    leaf: SchematicBoxPlacement,
    hp: ComponentPort,
    lp: ComponentPort,
  ): boolean {
    if (
      Math.abs(host.schX - leaf.schX) < (host.width + leaf.width) / 2 &&
      Math.abs(host.schY - leaf.schY) < (host.height + leaf.height) / 2
    )
      return false
    const p = this.index.port(hp)!,
      q = this.index.port(lp)!,
      pv = vectors[p.facing_direction!]
    const dx = q.center.x - p.center.x,
      dy = q.center.y - p.center.y
    // Scale with the leaf, not a large multi-pin host's height.
    if (
      Math.hypot(dx, dy) <= Math.max(2, 2 * Math.max(leaf.width, leaf.height))
    )
      return false
    // Require the entire capacitor body to be beyond the opposite host edge.
    // Staggered, vertical and bent branches on the pin side are all valid.
    const behind = -(
      pv[0] * (leaf.schX - host.schX) +
      pv[1] * (leaf.schY - host.schY)
    )
    const halfExtent = pv[0]
      ? (host.width + leaf.width) / 2
      : (host.height + leaf.height) / 2
    return behind > halfExtent + 0.2
  }
  // Core emits section boundaries as unowned dashed schematic lines, not groups.
  // A probe bank or support network across such a divider is intentionally separate.
  private crossesSectionDivider(
    host: SchematicBoxPlacement,
    leaf: SchematicBoxPlacement,
  ): boolean {
    const dx = leaf.schX - host.schX,
      dy = leaf.schY - host.schY
    return this.params.ctx.circuitJson.some((line) => {
      if (
        line.type !== "schematic_line" ||
        !line.is_dashed ||
        line.schematic_component_id ||
        line.schematic_sheet_id !== host.schematicSheetId
      )
        return false
      if (![line.x1, line.y1, line.x2, line.y2].every(Number.isFinite))
        return false
      const sx = line.x2 - line.x1,
        sy = line.y2 - line.y1
      const cross = dx * sy - dy * sx
      if (Math.abs(cross) < 1e-9) return false
      const ox = line.x1 - host.schX,
        oy = line.y1 - host.schY
      const alongBranch = (ox * sy - oy * sx) / cross
      const alongDivider = (ox * dy - oy * dx) / cross
      return (
        alongBranch > 1e-6 &&
        alongBranch < 1 - 1e-6 &&
        alongDivider >= 0 &&
        alongDivider <= 1
      )
    })
  }

  private validPlacement(id: string) {
    const box = this.index.placement(id)
    if (
      this.unpopulated.has(id) ||
      !box ||
      ![box.schX, box.schY, box.width, box.height].every(Number.isFinite) ||
      box.width <= 0 ||
      box.height <= 0
    )
      return
    return box
  }
  private validPort(p: ComponentPort, sheetId?: string) {
    const geometry = this.index.port(p)
    return (
      !p.do_not_connect &&
      geometry &&
      geometry.schematic_sheet_id === sheetId &&
      [geometry.center.x, geometry.center.y].every(Number.isFinite) &&
      geometry.facing_direction &&
      geometry.facing_direction in vectors
    )
  }
  static issueToString(issue: CapacitorConnectorNotAligned): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "connectorName",
      issue.connectorSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "capacitorName",
      issue.capacitorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "message", issue.message)
    return `<CapacitorConnectorNotAligned ${attrs.join(" ")} />`
  }
}
