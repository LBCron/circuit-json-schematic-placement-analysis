import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  FuseMosfetNotAligned,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"

const vectors = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, 1],
  down: [0, -1],
} as const
type ComponentPort = SourcePort & { source_component_id: string }
/** A private fuse-to-MOSFET power-terminal connection with a substantial placement detour. */
export class FuseMosfetAlignmentSolver extends BaseSolver {
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
    if (!net || this.index.groundNets.has(net)) return
    const i = this.index,
      members = i.portsByNet.get(net)!
    if (members.length !== 2) return
    const fp = members.find(
        (p) => i.components.get(p.source_component_id)?.ftype === "simple_fuse",
      ),
      mp = members.find(
        (p) =>
          i.components.get(p.source_component_id)?.ftype === "simple_mosfet",
      )
    if (!fp || !mp) return
    const fuse = this.validPlacement(fp.source_component_id),
      mosfet = this.validPlacement(mp.source_component_id),
      fn = i.twoTerminalNets(fp.source_component_id),
      mps = i.portsByComponent.get(mp.source_component_id)
    if (
      !fuse ||
      !mosfet ||
      !fn ||
      mps?.length !== 3 ||
      !i.sameLocalScope(fuse, mosfet)
    )
      return
    const ports = [...i.portsByComponent.get(fp.source_component_id)!, ...mps]
    if (ports.some((p) => !this.validPort(p, fuse.schematicSheetId))) return
    const mn = mps.map((p) => i.connected(p.source_port_id))
    if (new Set(mn).size !== 3 || mn.filter((n) => fn.includes(n)).length !== 1)
      return
    const f = i.port(fp)!,
      m = i.port(mp)!,
      fv = vectors[f.facing_direction!],
      mv = vectors[m.facing_direction!]
    // Standard three-terminal symbols have an opposing terminal pair and one
    // perpendicular control terminal. Never derive pin roles from labels/numbers.
    const others = mps
      .filter((p) => p !== mp)
      .map((p) => vectors[i.port(p)!.facing_direction!])
    const dots = others.map((v) => v[0] * mv[0] + v[1] * mv[1])
    if (!dots.includes(-1) || !dots.includes(0)) return
    if (this.overlaps(fuse, mosfet) || this.crossesSectionDivider(fuse, mosfet))
      return
    const dx = m.center.x - f.center.x,
      dy = m.center.y - f.center.y,
      distance = Math.hypot(dx, dy),
      limit = Math.max(2, 2 * Math.max(fuse.width, fuse.height))
    // Short bends and long straight connections are legitimate layouts.
    if (distance <= limit) return
    const opposite = fv[0] * mv[0] + fv[1] * mv[1] === -1,
      toward = dx * fv[0] + dy * fv[1] > 0,
      offset = Math.abs(dx * fv[1] - dy * fv[0])
    if (opposite && toward && offset <= 0.15) return
    this.params.issues.push({
      lineItemType: "FuseMosfetNotAligned",
      fuseSchematicBox: fuse,
      mosfetSchematicBox: mosfet,
      fuseSourcePortId: fp.source_port_id,
      mosfetSourcePortId: mp.source_port_id,
      pinDistance: distance,
      maxRecommendedPinDistance: limit,
      message: `Align ${fuse.sourceComponentName || "the fuse"} with its connected power terminal on ${mosfet.sourceComponentName || "the MOSFET"} to shorten the detour. Preserve drain, source and gate identities, all connections and polarity; keep room for labels and control branches, and reroute affected traces. Either horizontal or vertical alignment is valid.`,
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
  private overlaps(a: SchematicBoxPlacement, b: SchematicBoxPlacement) {
    return (
      Math.abs(a.schX - b.schX) < (a.width + b.width) / 2 &&
      Math.abs(a.schY - b.schY) < (a.height + b.height) / 2
    )
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

  static issueToString(issue: FuseMosfetNotAligned): string {
    const attrs: string[] = []
    addAttr(attrs, "fuseName", issue.fuseSchematicBox.sourceComponentName)
    addAttr(attrs, "mosfetName", issue.mosfetSchematicBox.sourceComponentName)
    addAttr(attrs, "message", issue.message)
    return `<FuseMosfetNotAligned ${attrs.join(" ")} />`
  }
}
