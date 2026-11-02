import type {
  CircuitJson,
  SchematicTrace,
  SchematicPort,
  SourcePort,
} from "circuit-json"
import { BaseSolver } from "@tscircuit/solver-utils"
import { getSourcePortConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import type { SolverContext } from "../SolverContext"
import type {
  DiodeResistorNotAligned,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import { addAttr } from "../../utils/format"

export class DiodeResistorAlignmentSolver extends BaseSolver {
  private static readonly DIODE_FTYPES = new Set(["simple_led", "simple_diode"])

  private readonly ctx: SolverContext
  private readonly out: SchematicPlacementIssue[]
  private readonly schematicTraces: SchematicTrace[]
  private currentIndex = 0
  private readonly network: PlacementNetworkIndex
  private readonly nets: string[]
  private readonly sourceConnectivity: ReturnType<
    typeof getSourcePortConnectivityMapFromCircuitJson
  >

  private readonly sourceComponentFtypeById: Map<string, string>
  private readonly sourceComponentIdBySourcePortId: Map<string, string>
  private readonly schematicPorts: SchematicPort[]
  private readonly schematicBoxBySourceComponentId: Map<
    string,
    SchematicBoxPlacement
  >

  constructor({
    ctx,
    issues,
  }: {
    ctx: SolverContext
    issues: SchematicPlacementIssue[]
  }) {
    super()
    this.ctx = ctx
    this.out = issues

    const { circuitJson } = ctx
    this.sourceConnectivity =
      getSourcePortConnectivityMapFromCircuitJson(circuitJson)

    this.sourceComponentFtypeById =
      this.buildSourceComponentFtypeById(circuitJson)
    this.sourceComponentIdBySourcePortId =
      this.buildSourceComponentIdBySourcePortId(circuitJson)
    this.schematicPorts = circuitJson.filter(
      (el): el is SchematicPort => el.type === "schematic_port",
    )
    this.schematicBoxBySourceComponentId =
      this.buildSchematicBoxBySourceComponentId()

    this.schematicTraces = circuitJson.filter(
      (el): el is SchematicTrace => el.type === "schematic_trace",
    )
    this.network = new PlacementNetworkIndex(ctx)
    this.nets = [...this.network.portsByNet.keys()]
    this.solved = this.schematicTraces.length + this.nets.length === 0
  }

  override _step(): void {
    const current = this.currentIndex++
    this.solved =
      this.currentIndex >= this.schematicTraces.length + this.nets.length
    if (current >= this.schematicTraces.length) {
      const net = this.nets[current - this.schematicTraces.length]
      if (net) this.checkLabelledPair(net)
      return
    }
    const trace = this.schematicTraces[current]!

    if (!trace.edges || trace.edges.length === 0) return

    const firstEdge = trace.edges[0]
    const lastEdge = trace.edges[trace.edges.length - 1]
    if (!firstEdge || !lastEdge) return
    const start = firstEdge.from
    const end = lastEdge.to

    const schematicSheetId = trace.schematic_sheet_id
    const startSourceCompId = this.findSourceComponentIdNearPoint(
      start,
      schematicSheetId,
    )
    const endSourceCompId = this.findSourceComponentIdNearPoint(
      end,
      schematicSheetId,
    )
    if (!startSourceCompId || !endSourceCompId) return

    const startFtype = this.sourceComponentFtypeById.get(startSourceCompId)
    const endFtype = this.sourceComponentFtypeById.get(endSourceCompId)

    const { DIODE_FTYPES } = DiodeResistorAlignmentSolver

    const isDiodeResistorPair =
      (DIODE_FTYPES.has(startFtype!) && endFtype === "simple_resistor") ||
      (startFtype === "simple_resistor" && DIODE_FTYPES.has(endFtype!))
    if (!isDiodeResistorPair) return

    const diodeCompId = DIODE_FTYPES.has(startFtype!)
      ? startSourceCompId
      : endSourceCompId
    const resistorCompId =
      startFtype === "simple_resistor" ? startSourceCompId : endSourceCompId

    const diodeBox = this.schematicBoxBySourceComponentId.get(diodeCompId)
    const resistorBox = this.schematicBoxBySourceComponentId.get(resistorCompId)
    if (!diodeBox || !resistorBox) return

    const diodePort = this.findNearestPort(
      DIODE_FTYPES.has(startFtype!) ? start : end,
      schematicSheetId,
    )
    const resistorPort = this.findNearestPort(
      startFtype === "simple_resistor" ? start : end,
      schematicSheetId,
    )

    if (!diodePort?.center || !resistorPort?.center) return
    if (
      !this.sourceConnectivity.areIdsConnected(
        diodePort.source_port_id,
        resistorPort.source_port_id,
      )
    )
      return

    this.checkAlignment(diodeBox, resistorBox, diodePort, resistorPort)
  }

  private checkAlignment(
    diodeBox: SchematicBoxPlacement,
    resistorBox: SchematicBoxPlacement,
    diodePort: SchematicPort,
    resistorPort: SchematicPort,
    labelled = false,
  ) {
    const diodeName = diodeBox.sourceComponentName || "component"
    const resistorName = resistorBox.sourceComponentName || "component"
    const diodePin =
      diodePort?.display_pin_label ?? diodePort?.pin_number?.toString()
    const resistorPin =
      resistorPort?.display_pin_label ?? resistorPort?.pin_number?.toString()
    const diodeFacing = diodePort?.facing_direction
    const resistorFacing = resistorPort?.facing_direction
    const diodePinDesc = diodePin ? `${diodeName}.${diodePin}` : diodeName
    const resistorPinDesc = resistorPin
      ? `${resistorName}.${resistorPin}`
      : resistorName

    const makeIssue = (message: string): DiodeResistorNotAligned => ({
      lineItemType: "DiodeResistorNotAligned",
      diodeSchematicBox: diodeBox,
      resistorSchematicBox: resistorBox,
      diodePin,
      resistorPin,
      diodePinFacingDirection: diodeFacing,
      resistorPinFacingDirection: resistorFacing,
      message,
    })

    if (
      !DiodeResistorAlignmentSolver.isCoLinear(
        diodePort.center,
        resistorPort.center,
      )
    ) {
      this.out.push(
        makeIssue(
          labelled
            ? `Align ${diodeName} and ${resistorName} so ${diodePinDesc} faces ${resistorPinDesc} along one visible series connection. Preserve the labelled net and diode polarity; leave room for nearby parts and labels.`
            : `trace has corners — align ${diodeName} and ${resistorName} on same axis and rotate so ${diodePinDesc} faces ${resistorPinDesc}`,
        ),
      )
      return
    }

    if (
      diodeFacing &&
      resistorFacing &&
      !DiodeResistorAlignmentSolver.pinsFacingEachOther(
        diodePort.center,
        diodeFacing,
        resistorPort.center,
        resistorFacing,
      )
    ) {
      this.out.push(
        makeIssue(
          `${diodePinDesc} and ${resistorPinDesc} face away from each other — rotate ${diodeName} so ${diodePinDesc} faces ${resistorPinDesc}`,
        ),
      )
    }
  }

  /** Find only nearby private labelled branches; a shared rail or fanout is not a series pair. */
  private checkLabelledPair(net: string) {
    const index = this.network,
      members = index.portsByNet.get(net) ?? []
    if (
      members.length !== 2 ||
      index.isRail(net) ||
      members.some(
        (p) =>
          p.do_not_connect ||
          p.requires_ground ||
          p.provides_ground ||
          p.requires_power ||
          p.provides_power ||
          p.requires_voltage !== undefined ||
          p.provides_voltage !== undefined,
      )
    )
      return
    const resistor = members.find(
      (p) =>
        index.components.get(p.source_component_id)?.ftype ===
        "simple_resistor",
    )
    const diode = members.find((p) =>
      DiodeResistorAlignmentSolver.DIODE_FTYPES.has(
        index.components.get(p.source_component_id)?.ftype ?? "",
      ),
    )
    if (
      !resistor ||
      !diode ||
      resistor.source_component_id === diode.source_component_id
    )
      return
    const resistorNets = index.twoTerminalNets(resistor.source_component_id),
      diodeNets = index.twoTerminalNets(diode.source_component_id)
    if (
      !resistorNets ||
      !diodeNets ||
      resistorNets.filter((n) => diodeNets.includes(n)).length !== 1
    )
      return
    const sourceResistor = index.components.get(resistor.source_component_id)
    if (
      sourceResistor?.ftype !== "simple_resistor" ||
      !Number.isFinite(sourceResistor.resistance) ||
      sourceResistor.resistance <= 0
    )
      return
    const parts = [diode, resistor].map((port) => {
      const id = port.source_component_id,
        box = index.placement(id),
        pin = index.port(port),
        ports = index.portsByComponent.get(id)
      if (
        !box ||
        !pin ||
        !ports ||
        !index.twoTerminalNets(id) ||
        ports.some((p) => p.do_not_connect)
      )
        return
      if (
        ![
          box.schX,
          box.schY,
          box.width,
          box.height,
          pin.center.x,
          pin.center.y,
        ].every(Number.isFinite) ||
        box.width <= 0 ||
        box.height <= 0 ||
        !pin.facing_direction ||
        pin.schematic_sheet_id !== box.schematicSheetId
      )
        return
      if (
        this.ctx.circuitJson.some(
          (e) =>
            e.type === "pcb_component" &&
            e.source_component_id === id &&
            e.do_not_place,
        )
      )
        return
      if (!this.hasLabelledStub(port, pin, net)) return
      return { box, pin }
    })
    const [d, r] = parts
    if (!d || !r || !index.sameLocalScope(d.box, r.box)) return
    // Limit this fallback to a small local connection. Remote labels may be intentional.
    if (DiodeResistorAlignmentSolver.dist(d.pin.center, r.pin.center) > 6)
      return
    if (
      Math.abs(d.box.schX - r.box.schX) < (d.box.width + r.box.width) / 2 &&
      Math.abs(d.box.schY - r.box.schY) < (d.box.height + r.box.height) / 2
    )
      return
    if (
      this.out.some(
        (issue) =>
          issue.lineItemType === "DiodeResistorNotAligned" &&
          issue.diodeSchematicBox.schematicComponentId ===
            d.box.schematicComponentId &&
          issue.resistorSchematicBox.schematicComponentId ===
            r.box.schematicComponentId,
      )
    )
      return
    this.checkAlignment(d.box, r.box, d.pin, r.pin, true)
  }

  private hasLabelledStub(port: SourcePort, pin: SchematicPort, net: string) {
    const index = this.network
    const sourceTraces = this.ctx.circuitJson.filter(
      (e) =>
        e.type === "source_trace" &&
        e.connected_source_port_ids.length === 1 &&
        e.connected_source_port_ids[0] === port.source_port_id &&
        e.connected_source_net_ids.length > 0 &&
        e.connected_source_net_ids.every((id) => index.connected(id) === net),
    )
    const traceIds = new Set(
      sourceTraces.flatMap((t) =>
        t.type === "source_trace" ? [t.source_trace_id] : [],
      ),
    )
    const stubs = this.schematicTraces.filter(
      (t) =>
        t.schematic_sheet_id === pin.schematic_sheet_id &&
        t.source_trace_id &&
        traceIds.has(t.source_trace_id) &&
        !t.junctions?.length &&
        t.edges.some(
          (e) =>
            DiodeResistorAlignmentSolver.dist(e.from, pin.center) < 0.01 ||
            DiodeResistorAlignmentSolver.dist(e.to, pin.center) < 0.01,
        ),
    )
    return this.ctx.circuitJson.some((e) => {
      if (
        e.type === "schematic_text" &&
        e.schematic_sheet_id === pin.schematic_sheet_id &&
        "source_trace_id" in e &&
        typeof e.source_trace_id === "string"
      )
        return stubs.some((t) => t.source_trace_id === e.source_trace_id)
      if (
        e.type !== "schematic_net_label" ||
        e.symbol_name ||
        e.schematic_sheet_id !== pin.schematic_sheet_id ||
        !e.source_net_id ||
        index.connected(e.source_net_id) !== net
      )
        return false
      const p = e.anchor_position ?? e.center
      return (
        DiodeResistorAlignmentSolver.dist(p, pin.center) < 0.01 ||
        stubs.some((t) =>
          t.edges.some(
            (edge) =>
              Math.abs(
                DiodeResistorAlignmentSolver.dist(edge.from, p) +
                  DiodeResistorAlignmentSolver.dist(p, edge.to) -
                  DiodeResistorAlignmentSolver.dist(edge.from, edge.to),
              ) < 1e-6,
          ),
        )
      )
    })
  }

  private static isCoLinear(
    a: { x: number; y: number },
    b: { x: number; y: number },
    epsilon = 0.01,
  ): boolean {
    return Math.abs(a.x - b.x) < epsilon || Math.abs(a.y - b.y) < epsilon
  }

  private static pinsFacingEachOther(
    aCenter: { x: number; y: number },
    aFacing: string,
    bCenter: { x: number; y: number },
    bFacing: string,
  ): boolean {
    const dx = bCenter.x - aCenter.x
    const dy = bCenter.y - aCenter.y
    const aToward =
      (aFacing === "right" && dx > 0) ||
      (aFacing === "left" && dx < 0) ||
      (aFacing === "up" && dy > 0) ||
      (aFacing === "down" && dy < 0)
    const bToward =
      (bFacing === "right" && dx < 0) ||
      (bFacing === "left" && dx > 0) ||
      (bFacing === "up" && dy < 0) ||
      (bFacing === "down" && dy > 0)
    return aToward && bToward
  }

  private static dist(
    a: { x: number; y: number },
    b: { x: number; y: number },
  ): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
  }

  private findNearestPort(
    point: {
      x: number
      y: number
    },
    schematicSheetId?: string,
  ): SchematicPort | undefined {
    let nearest: SchematicPort | undefined
    let minDist = Infinity
    for (const port of this.schematicPorts) {
      if (port.schematic_sheet_id !== schematicSheetId) continue
      if (!port.center) continue
      const d = DiodeResistorAlignmentSolver.dist(point, port.center)
      if (d < minDist) {
        minDist = d
        nearest = port
      }
    }
    return nearest
  }

  private findSourceComponentIdNearPoint(
    point: {
      x: number
      y: number
    },
    schematicSheetId?: string,
  ): string | undefined {
    const nearest = this.findNearestPort(point, schematicSheetId)
    if (!nearest || !nearest.source_port_id) return undefined
    return this.sourceComponentIdBySourcePortId.get(nearest.source_port_id)
  }

  private buildSourceComponentFtypeById(
    circuitJson: CircuitJson,
  ): Map<string, string> {
    const map = new Map<string, string>()
    for (const el of circuitJson) {
      if (
        el.type === "source_component" &&
        "source_component_id" in el &&
        "ftype" in el &&
        typeof el.ftype === "string"
      ) {
        map.set(el.source_component_id as string, el.ftype)
      }
    }
    return map
  }

  private buildSourceComponentIdBySourcePortId(
    circuitJson: CircuitJson,
  ): Map<string, string> {
    const map = new Map<string, string>()
    for (const el of circuitJson) {
      if (
        el.type === "source_port" &&
        "source_port_id" in el &&
        "source_component_id" in el &&
        typeof el.source_port_id === "string" &&
        typeof el.source_component_id === "string"
      ) {
        map.set(el.source_port_id, el.source_component_id)
      }
    }
    return map
  }

  private buildSchematicBoxBySourceComponentId(): Map<
    string,
    SchematicBoxPlacement
  > {
    const map = new Map<string, SchematicBoxPlacement>()
    for (const placement of this.ctx.componentPlacements) {
      if (placement.sourceComponentId) {
        map.set(placement.sourceComponentId, placement)
      }
    }
    return map
  }

  static issueToString(issue: DiodeResistorNotAligned): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "diodeComponentName",
      issue.diodeSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "diodePin", issue.diodePin)
    addAttr(
      attrs,
      "resistorComponentName",
      issue.resistorSchematicBox.sourceComponentName,
    )
    addAttr(attrs, "resistorPin", issue.resistorPin)
    addAttr(attrs, "message", issue.message)
    return `<DiodeResistorNotAligned ${attrs.join(" ")} />`
  }
}
