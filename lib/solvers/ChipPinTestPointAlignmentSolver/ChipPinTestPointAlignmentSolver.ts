import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  ChipPinTestPointNotAligned,
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

/** Keep a private test point beside its chip pin; compact bends remain valid. */
export class ChipPinTestPointAlignmentSolver extends BaseSolver {
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
      ["simple_chip", "simple_op_amp"].includes(
        index.components.get(p.source_component_id)?.ftype ?? "",
      ),
    )
    const leafPort = ports.find(
      (p) =>
        index.components.get(p.source_component_id)?.ftype ===
        "simple_test_point",
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
      hostPorts.length < 3 ||
      leafPorts?.length !== 1 ||
      !index.sameLocalScope(host, leaf)
    )
      return
    // Only the connected chip/connector pin is relevant; unrelated NC pins are allowed.
    if (
      !this.validPort(hostPort, host.schematicSheetId) ||
      leafPorts.some((p) => !this.validPort(p, leaf.schematicSheetId))
    )
      return
    if (this.crossesSectionDivider(host, leaf) || this.isInProbeBank(leaf))
      return
    if (!this.isSeparated(host, leaf, hostPort, leafPort)) return
    this.params.issues.push({
      lineItemType: "ChipPinTestPointNotAligned",
      chipSchematicBox: host,
      testPointSchematicBox: leaf,
      chipSourcePortId: hostPort.source_port_id,
      testPointSourcePortId: leafPort.source_port_id,
      message: `Place ${leaf.sourceComponentName || "the test point"} beside its connected pin on ${host.sourceComponentName || "the chip"}, using a short direct wire or compact stub. Keep the chip symbol and pin layout unchanged. Preserve all connections, leave room for labels and neighboring parts, and reroute the test-point connection.`,
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
    const qv = vectors[q.facing_direction!]
    return !(
      pv[0] * qv[0] + pv[1] * qv[1] === -1 &&
      dx * pv[0] + dy * pv[1] > 0 &&
      Math.abs(dx * pv[1] - dy * pv[0]) <= 0.15
    )
  }
  // A regular row/column of at least three probes including a rail probe is
  // a coherent test-point bank, not an isolated chip-pin branch to relocate.
  private isInProbeBank(leaf: SchematicBoxPlacement): boolean {
    const probes = [...this.index.components.values()].flatMap((component) => {
      if (component.ftype !== "simple_test_point") return []
      const box = this.validPlacement(component.source_component_id),
        ports = this.index.portsByComponent.get(component.source_component_id)
      if (
        !box ||
        ports?.length !== 1 ||
        !this.index.sameLocalScope(leaf, box) ||
        !this.validPort(ports[0]!, box.schematicSheetId)
      )
        return []
      return [
        {
          box,
          port: this.index.port(ports[0]!)!,
          rail: this.index.isRail(
            this.index.connected(ports[0]!.source_port_id),
          ),
        },
      ]
    })
    const own = probes.find(
      (p) => p.box.sourceComponentId === leaf.sourceComponentId,
    )
    if (!own) return false
    for (const horizontal of [true, false]) {
      const row = probes
        .filter(
          (p) =>
            p.port.facing_direction === own.port.facing_direction &&
            Math.abs(
              horizontal ? p.box.schY - leaf.schY : p.box.schX - leaf.schX,
            ) <= 0.15,
        )
        .sort((a, b) =>
          horizontal ? a.box.schX - b.box.schX : a.box.schY - b.box.schY,
        )
      const at = row.indexOf(own)
      for (
        let start = Math.max(0, at - 2);
        start <= at && start + 2 < row.length;
        start++
      ) {
        const triple = row.slice(start, start + 3),
          positions = triple.map((p) => (horizontal ? p.box.schX : p.box.schY))
        const first = positions[1]! - positions[0]!,
          second = positions[2]! - positions[1]!
        if (
          first > Math.max(leaf.width, leaf.height) &&
          Math.abs(first - second) <= 0.15 &&
          triple.some((p) => p.rail)
        )
          return true
      }
    }
    return false
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
  static issueToString(issue: ChipPinTestPointNotAligned): string {
    const attrs: string[] = []
    addAttr(attrs, "chipName", issue.chipSchematicBox.sourceComponentName)
    addAttr(
      attrs,
      "testPointName",
      issue.testPointSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "message", issue.message)
    return `<ChipPinTestPointNotAligned ${attrs.join(" ")} />`
  }
}
