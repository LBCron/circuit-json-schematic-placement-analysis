import { BaseSolver } from "@tscircuit/solver-utils"
import type { SourcePort } from "circuit-json"
import type {
  LedResistorBranchSeparatedFromChipPin,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"
import { hasVisibleSchematicConnection } from "../../utils/has-visible-schematic-connection"

type ComponentPort = SourcePort & { source_component_id: string }
const vectors = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, 1],
  down: [0, -1],
} as const

/** A private, wired chip/LED/resistor branch stranded beyond the chip's opposite edge. */
export class ChipLedResistorGroupingSolver extends BaseSolver {
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
    this.resistorIds = [...this.index.components.values()]
      .filter((c) => c.ftype === "simple_resistor")
      .map((c) => c.source_component_id)
    this.solved = this.resistorIds.length === 0
  }
  override _step(): void {
    const id = this.resistorIds[this.currentIndex++]
    this.solved = this.currentIndex >= this.resistorIds.length
    if (!id) return
    const i = this.index,
      resistor = i.components.get(id)!,
      r = this.validPlacement(id),
      rn = i.twoTerminalNets(id)
    if (
      resistor.ftype !== "simple_resistor" ||
      !Number.isFinite(resistor.resistance) ||
      resistor.resistance <= 0 ||
      !r ||
      !rn
    )
      return
    for (const junction of rn) {
      if (i.isRail(junction)) continue
      const members = i.portsByNet.get(junction) ?? []
      if (members.length !== 2) continue
      const lp = members.find(
        (p) => i.components.get(p.source_component_id)?.ftype === "simple_led",
      )
      if (!lp) continue
      const led = this.validPlacement(lp.source_component_id),
        ln = i.twoTerminalNets(lp.source_component_id)
      if (!led || !ln) continue
      const outer = [
        rn.find((n) => n !== junction)!,
        ln.find((n) => n !== junction)!,
      ]
      if (new Set([junction, ...outer]).size !== 3) continue
      const rails = outer.filter((n) => i.isRail(n))
      if (
        rails.length !== 1 ||
        (i.powerNets.has(rails[0]!) && i.groundNets.has(rails[0]!))
      )
        continue
      const signal = outer.find((n) => n !== rails[0])!,
        peers = i.portsByNet.get(signal) ?? []
      if (peers.length !== 2) continue
      const hp = peers.find(
        (p) => i.components.get(p.source_component_id)?.ftype === "simple_chip",
      )
      if (
        !hp ||
        (i.portsByComponent.get(hp.source_component_id)?.length ?? 0) < 3
      )
        continue
      const host = this.validPlacement(hp.source_component_id)
      const passives = [
        ...i.portsByComponent.get(id)!,
        ...i.portsByComponent.get(lp.source_component_id)!,
      ]
      if (
        !host ||
        !i.sameLocalScope(host, r) ||
        !i.sameLocalScope(host, led) ||
        [hp, ...passives].some(
          (p) => !this.validPort(p, host.schematicSheetId),
        ) ||
        this.crossesSectionDivider(host, r) ||
        this.crossesSectionDivider(host, led)
      )
        continue
      const bp = peers.find((p) => p !== hp)!,
        rp = members.find((p) => p !== lp)!
      // Net labels alone can deliberately put an indicator in a separate block.
      if (
        !hasVisibleSchematicConnection(
          this.params.ctx.circuitJson,
          i,
          hp,
          bp,
        ) ||
        !hasVisibleSchematicConnection(this.params.ctx.circuitJson, i, rp, lp)
      )
        continue
      const pin = i.port(hp)!,
        direction = pin.facing_direction!
      const [dx, dy] = vectors[direction]
      const maxRecommendedPinDistance = Math.max(
        4,
        3 * Math.max(r.width, r.height, led.width, led.height),
      )
      const separated = [r, led].some((part) => {
        const opposite = -(
          (part.schX - host.schX) * dx +
          (part.schY - host.schY) * dy
        )
        const halfBodies = dx
          ? (host.width + part.width) / 2
          : (host.height + part.height) / 2
        return (
          opposite > halfBodies + 0.2 &&
          Math.hypot(part.schX - pin.center.x, part.schY - pin.center.y) >
            maxRecommendedPinDistance
        )
      })
      if (!separated) continue
      this.params.issues.push({
        lineItemType: "LedResistorBranchSeparatedFromChipPin",
        hostSchematicBox: host,
        ledSchematicBox: led,
        resistorSchematicBox: r,
        chipSourcePortId: hp.source_port_id,
        maxRecommendedPinDistance,
        message: `Group ${led.sourceComponentName || "the LED"} and ${r.sourceComponentName || "its series resistor"} beside their connected pin on the ${direction} side of ${host.sourceComponentName || "the chip"}. Keep the complete rail-to-chip branch readable, preserve LED polarity, resistance, chip pin layout and all connections, and reroute affected traces with room for labels.`,
      })
      return
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
    const pin = this.index.port(p)
    return (
      !p.do_not_connect &&
      pin &&
      pin.schematic_sheet_id === sheetId &&
      [pin.center.x, pin.center.y].every(Number.isFinite) &&
      pin.facing_direction &&
      pin.facing_direction in vectors
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

  static issueToString(issue: LedResistorBranchSeparatedFromChipPin): string {
    const attrs: string[] = []
    addAttr(attrs, "chipName", issue.hostSchematicBox.sourceComponentName)
    addAttr(attrs, "ledName", issue.ledSchematicBox.sourceComponentName)
    addAttr(
      attrs,
      "resistorName",
      issue.resistorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "message", issue.message)
    return `<LedResistorBranchSeparatedFromChipPin ${attrs.join(" ")} />`
  }
}
