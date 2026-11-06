import { BaseSolver } from "@tscircuit/solver-utils"
import type { SchematicPort, SchematicTrace, SourcePort } from "circuit-json"
import type {
  ComponentBranchesOutOfOrder,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { hasVisibleSchematicConnection } from "../../utils/has-visible-schematic-connection"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"

type ComponentPort = SourcePort & { source_component_id: string }
type Branch = {
  placement: SchematicBoxPlacement
  hostPin: SchematicPort
  pin: SchematicPort
  edges: SchematicTrace["edges"]
}

/** Crossed private branches whose component order reverses their host-pin order. */
export class ComponentBranchOrderSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly hostIds: string[]
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
    this.hostIds = [...this.index.portsByComponent]
      .filter(([, ports]) => ports.length >= 3)
      .map(([id]) => id)
    this.solved = this.hostIds.length === 0
  }

  override _step(): void {
    const id = this.hostIds[this.currentIndex++]!
    this.solved = this.currentIndex >= this.hostIds.length
    const host = this.validPlacement(id)
    if (!host) return
    const banks = new Map<string, Branch[]>()
    for (const hostPort of this.index.portsByComponent.get(id) ?? []) {
      const signal = this.index.connected(hostPort.source_port_id)
      const peers = this.index.portsByNet.get(signal) ?? []
      const hostPin = this.validPin({
        port: hostPort,
        sheetId: host.schematicSheetId,
      })
      if (
        !hostPin?.facing_direction ||
        this.index.isRail(signal) ||
        peers.length !== 2
      )
        continue
      const port = peers.find((p) => p.source_component_id !== id)
      if (!port) continue
      const component = this.index.components.get(port.source_component_id)
      if (
        !component ||
        ![
          "simple_resistor",
          "simple_capacitor",
          "simple_diode",
          "simple_led",
          "simple_inductor",
        ].includes(component.ftype)
      )
        continue
      if (
        component.ftype === "simple_resistor" &&
        (!Number.isFinite(component.resistance) || component.resistance <= 0)
      )
        continue
      if (
        component.ftype === "simple_capacitor" &&
        (!Number.isFinite(component.capacitance) || component.capacitance <= 0)
      )
        continue
      if (
        component.ftype === "simple_inductor" &&
        (!Number.isFinite(component.inductance) || component.inductance <= 0)
      )
        continue
      const placement = this.validPlacement(port.source_component_id)
      const nets = this.index.twoTerminalNets(port.source_component_id)
      const ports =
        this.index.portsByComponent.get(port.source_component_id) ?? []
      if (!placement || !nets || !this.index.sameLocalScope(host, placement))
        continue
      const pin = this.validPin({ port, sheetId: host.schematicSheetId })
      if (
        !pin ||
        ports.some(
          (p) => !this.validPin({ port: p, sheetId: host.schematicSheetId }),
        )
      )
        continue
      const returnNet = nets.find((n) => n !== signal)!
      // A common, explicitly declared return makes these independent local
      // branches. Different far-end owners do not justify reordering them.
      if (
        !this.index.isRail(returnNet) ||
        (this.index.groundNets.has(returnNet) &&
          this.index.powerNets.has(returnNet))
      )
        continue
      const side = hostPin.facing_direction
      const horizontal = side === "left" || side === "right"
      const sign = side === "left" || side === "down" ? -1 : 1
      if (
        sign *
          (horizontal
            ? placement.schX - hostPin.center.x
            : placement.schY - hostPin.center.y) <=
        0.2
      )
        continue
      if (
        !hasVisibleSchematicConnection(
          this.params.ctx.circuitJson,
          this.index,
          hostPort,
          port,
        )
      )
        continue
      const edges = this.params.ctx.circuitJson.flatMap((e) =>
        e.type === "schematic_trace" &&
        e.schematic_sheet_id === host.schematicSheetId &&
        e.subcircuit_connectivity_map_key &&
        this.index.connected(
          `connectivity:${e.subcircuit_connectivity_map_key}`,
        ) === signal
          ? e.edges
          : [],
      )
      if (
        !edges.length ||
        edges.some(
          (e) => ![e.from.x, e.from.y, e.to.x, e.to.y].every(Number.isFinite),
        )
      )
        continue
      const key = JSON.stringify([side, returnNet])
      const bank = banks.get(key) ?? []
      bank.push({ placement, hostPin, pin, edges })
      banks.set(key, bank)
    }
    for (const bank of banks.values()) {
      for (let a = 0; a < bank.length; a++) {
        for (let b = a + 1; b < bank.length; b++) {
          const first = bank[a]!,
            second = bank[b]!
          const horizontal =
            first.hostPin.facing_direction === "left" ||
            first.hostPin.facing_direction === "right"
          const axis = horizontal ? "y" : "x"
          const pinOrder =
            first.hostPin.center[axis] - second.hostPin.center[axis]
          const componentOrder =
            first.pin.center[axis] - second.pin.center[axis]
          if (
            Math.abs(pinOrder) <= 0.01 ||
            Math.abs(componentOrder) <= 0.01 ||
            pinOrder * componentOrder >= 0
          )
            continue
          // A reversed order with nonintersecting routing is still readable.
          if (
            !first.edges.some((a) =>
              second.edges.some((b) => segmentsIntersect(a, b)),
            )
          )
            continue
          this.params.issues.push({
            lineItemType: "ComponentBranchesOutOfOrder",
            hostSchematicBox: host,
            firstComponentSchematicBox: first.placement,
            secondComponentSchematicBox: second.placement,
            message: `Reorder ${first.placement.sourceComponentName || "the first branch"} and ${second.placement.sourceComponentName || "the second branch"} to follow their connected pins on the ${first.hostPin.facing_direction} side of ${host.sourceComponentName || "the host"}, avoiding the crossed wires. Preserve component symbols, pin assignments and polarity; leave room for labels and reroute both branches without moving the host pins.`,
          })
        }
      }
    }
  }

  private validPlacement(id: string) {
    const p = this.index.placement(id)
    if (
      this.unpopulated.has(id) ||
      !p ||
      ![p.schX, p.schY, p.width, p.height].every(Number.isFinite) ||
      p.width <= 0 ||
      p.height <= 0
    )
      return
    return p
  }

  private validPin({
    port,
    sheetId,
  }: {
    port: ComponentPort
    sheetId?: string
  }) {
    const p = this.index.port(port)
    if (
      port.do_not_connect ||
      !p ||
      p.schematic_sheet_id !== sheetId ||
      ![p.center.x, p.center.y].every(Number.isFinite)
    )
      return
    return p
  }

  static issueToString(issue: ComponentBranchesOutOfOrder): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "hostComponentName",
      issue.hostSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "firstComponentName",
      issue.firstComponentSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "secondComponentName",
      issue.secondComponentSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "message", issue.message)
    return `<ComponentBranchesOutOfOrder ${attrs.join(" ")} />`
  }
}

function segmentsIntersect(
  a: SchematicTrace["edges"][number],
  b: SchematicTrace["edges"][number],
): boolean {
  const ux = a.to.x - a.from.x,
    uy = a.to.y - a.from.y,
    vx = b.to.x - b.from.x,
    vy = b.to.y - b.from.y
  const ox = b.from.x - a.from.x,
    oy = b.from.y - a.from.y,
    determinant = ux * vy - uy * vx
  if (Math.abs(determinant) < 1e-9) return false
  const t = (ox * vy - oy * vx) / determinant,
    s = (ox * uy - oy * ux) / determinant
  // Include a wire touching a different net's pin or bend, not just strict crossings.
  return t >= -1e-6 && t <= 1 + 1e-6 && s >= -1e-6 && s <= 1 + 1e-6
}
