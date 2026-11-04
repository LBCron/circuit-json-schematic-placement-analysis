import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  ChipDiodeCapacitorNetworkNotGrouped,
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
/** Group a diode/capacitor junction that returns to three distinct pins of one chip. */
export class ChipDiodeCapacitorNetworkGroupingSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly unpopulated = new Set<string>()
  private readonly capacitorIds: string[]
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

    this.capacitorIds = [...this.index.components.values()]
      .filter((c) => c.ftype === "simple_capacitor")
      .map((c) => c.source_component_id)
    this.solved = this.capacitorIds.length === 0
  }
  override _step(): void {
    const id = this.capacitorIds[this.currentIndex++]
    this.solved = this.currentIndex >= this.capacitorIds.length
    if (!id) return
    const i = this.index,
      c = i.components.get(id)!,
      cap = this.validPlacement(id),
      cn = i.twoTerminalNets(id)
    if (
      c.ftype !== "simple_capacitor" ||
      !Number.isFinite(c.capacitance) ||
      c.capacitance <= 0 ||
      !cap ||
      !cn ||
      cn.some((n) => i.isRail(n))
    )
      return
    for (const shared of cn) {
      const members = i.portsByNet.get(shared) ?? []
      // No extra components at the common chip/diode/capacitor junction.
      if (members.length !== 3) continue
      const dp = members.find(
          (p) =>
            i.components.get(p.source_component_id)?.ftype === "simple_diode",
        ),
        hp = members.find(
          (p) =>
            i.components.get(p.source_component_id)?.ftype === "simple_chip",
        )
      if (!dp || !hp) continue
      const diode = this.validPlacement(dp.source_component_id),
        host = this.validPlacement(hp.source_component_id),
        dn = i.twoTerminalNets(dp.source_component_id)
      if (
        !diode ||
        !host ||
        !dn ||
        dn.some((n) => i.isRail(n)) ||
        !i.sameLocalScope(host, cap) ||
        !i.sameLocalScope(host, diode) ||
        cn.filter((n) => dn.includes(n)).length !== 1
      )
        continue
      const nets = [
        shared,
        cn.find((n) => n !== shared)!,
        dn.find((n) => n !== shared)!,
      ]
      if (new Set(nets).size !== 3) continue
      const chipPins = nets.map((n) =>
        (i.portsByNet.get(n) ?? []).filter(
          (p) => p.source_component_id === hp.source_component_id,
        ),
      )
      if (chipPins.some((ps) => ps.length !== 1)) continue
      const pins = chipPins.map((ps) => ps[0]!)
      // The private three-member junction identifies the host. Return nodes
      // may also feed a power stage, including imported MOSFETs typed as chips.
      const passives = [
        ...i.portsByComponent.get(id)!,
        ...i.portsByComponent.get(dp.source_component_id)!,
      ]
      if (
        [...pins, ...passives].some(
          (p) => !this.validPort(p, host.schematicSheetId),
        )
      )
        continue
      const geometry = pins.map((p) => i.port(p)!)
      if (new Set(geometry.map((p) => p.facing_direction)).size !== 1) continue
      if (
        this.overlaps(host, cap) ||
        this.overlaps(host, diode) ||
        this.overlaps(cap, diode) ||
        this.crossesSectionDivider(host, cap) ||
        this.crossesSectionDivider(host, diode)
      )
        continue
      const distances = passives.map((p) => {
        const a = i.port(p)!,
          b = geometry[nets.indexOf(i.connected(p.source_port_id))]!
        return Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y)
      })
      const span = Math.max(
          ...geometry.flatMap((a) =>
            geometry.map((b) =>
              Math.hypot(a.center.x - b.center.x, a.center.y - b.center.y),
            ),
          ),
        ),
        limit = Math.max(
          4,
          3 * Math.max(cap.width, cap.height, diode.width, diode.height),
          2 * span,
        ),
        distance = Math.max(...distances)
      if (distance <= limit) continue
      this.params.issues.push({
        lineItemType: "ChipDiodeCapacitorNetworkNotGrouped",
        hostSchematicBox: host,
        diodeSchematicBox: diode,
        capacitorSchematicBox: cap,
        chipSourcePortIds: pins.map((p) => p.source_port_id) as [
          string,
          string,
          string,
        ],
        maxPinDistance: distance,
        maxRecommendedPinDistance: limit,
        message: `Group ${diode.sourceComponentName || "the diode"} and ${cap.sourceComponentName || "the capacitor"} beside their three connected pins on ${host.sourceComponentName || "the chip"}. Keep the shared junction visible and connections short. Preserve the chip symbol and pin layout, diode polarity, capacitance and all electrical connections; leave room for labels and reroute affected traces.`,
      })
    }
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

  static issueToString(issue: ChipDiodeCapacitorNetworkNotGrouped): string {
    const attrs: string[] = []
    addAttr(attrs, "chipName", issue.hostSchematicBox.sourceComponentName)
    addAttr(attrs, "diodeName", issue.diodeSchematicBox.sourceComponentName)
    addAttr(
      attrs,
      "capacitorName",
      issue.capacitorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "message", issue.message)
    return `<ChipDiodeCapacitorNetworkNotGrouped ${attrs.join(" ")} />`
  }
}
