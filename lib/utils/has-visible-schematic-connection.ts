import type { CircuitJson, SourcePort } from "circuit-json"
import type { PlacementNetworkIndex } from "./placement-network-index"

type ComponentPort = SourcePort & { source_component_id: string }
/** Require a continuous drawn wire, rather than two separate net-label stubs. */
export function hasVisibleSchematicConnection(
  json: CircuitJson,
  index: PlacementNetworkIndex,
  a: ComponentPort,
  b: ComponentPort,
): boolean {
  const start = index.port(a),
    end = index.port(b)
  if (!start || !end || start.schematic_sheet_id !== end.schematic_sheet_id)
    return false
  const net = index.connected(a.source_port_id)
  if (net !== index.connected(b.source_port_id)) return false
  const edges = json.flatMap((e) =>
    e.type === "schematic_trace" &&
    e.schematic_sheet_id === start.schematic_sheet_id &&
    e.subcircuit_connectivity_map_key &&
    index.connected(`connectivity:${e.subcircuit_connectivity_map_key}`) === net
      ? e.edges
      : [],
  )
  const points = [
    start.center,
    end.center,
    ...edges.flatMap((e) => [e.from, e.to]),
  ]
  const key = (p: { x: number; y: number }) =>
    `${p.x.toFixed(6)},${p.y.toFixed(6)}`
  const segments = edges.map((e) =>
    points
      .filter(
        (p) =>
          Math.abs(
            Math.hypot(p.x - e.from.x, p.y - e.from.y) +
              Math.hypot(p.x - e.to.x, p.y - e.to.y) -
              Math.hypot(e.from.x - e.to.x, e.from.y - e.to.y),
          ) < 1e-6,
      )
      .map(key),
  )
  const reached = new Set([key(start.center)])
  let previous = -1
  while (previous !== reached.size) {
    previous = reached.size
    for (const segment of segments)
      if (segment.some((p) => reached.has(p)))
        for (const p of segment) reached.add(p)
  }
  return reached.has(key(end.center))
}
