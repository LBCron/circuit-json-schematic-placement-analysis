import { expect } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { getSourceConnectivity } from "lib/utils/source-connectivity"
import { getReproSourcePort } from "./placement-repro-assertions"

export function electricalSignature(json: CircuitJson) {
  const connected = getSourceConnectivity(json)
  return {
    components: json.filter((e) => e.type === "source_component"),
    ports: json.flatMap((p) =>
      p.type === "source_port"
        ? [
            {
              id: p.source_port_id,
              componentId: p.source_component_id,
              pin: p.pin_number,
              name: p.name,
              nets: json
                .flatMap((n) =>
                  n.type === "source_net" &&
                  connected(n.source_net_id) === connected(p.source_port_id)
                    ? [n.name]
                    : [],
                )
                .sort(),
              peers: json
                .flatMap((q) =>
                  q.type === "source_port" &&
                  connected(q.source_port_id) === connected(p.source_port_id)
                    ? [q.source_port_id]
                    : [],
                )
                .sort(),
            },
          ]
        : [],
    ),
  }
}

export function expectVisibleConnection(
  json: CircuitJson,
  a: string,
  ap: string,
  b: string,
  bp: string,
) {
  const first = getReproSourcePort(json, a, ap),
    second = getReproSourcePort(json, b, bp),
    connected = getSourceConnectivity(json)
  const pin = (id: string) => {
    const p = json.find(
      (e) => e.type === "schematic_port" && e.source_port_id === id,
    )
    if (p?.type !== "schematic_port") throw new Error("Missing schematic pin")
    return p.center
  }
  const start = pin(first.source_port_id),
    end = pin(second.source_port_id)
  const edges = json.flatMap((e) =>
    e.type === "schematic_trace" &&
    e.subcircuit_connectivity_map_key &&
    connected(`connectivity:${e.subcircuit_connectivity_map_key}`) ===
      connected(first.source_port_id)
      ? e.edges
      : [],
  )
  const vertices = [start, end, ...edges.flatMap((e) => [e.from, e.to])]
  const key = (p: { x: number; y: number }) =>
    `${p.x.toFixed(6)},${p.y.toFixed(6)}`
  const segments = edges.map((e) =>
    vertices
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
  const reached = new Set([key(start)])
  let previous = -1
  while (previous !== reached.size) {
    previous = reached.size
    for (const segment of segments)
      if (segment.some((p) => reached.has(p)))
        for (const p of segment) reached.add(p)
  }
  expect(reached.has(key(end))).toBe(true)
}

/** Rotating a symbol can reorder generated port IDs; retain physical pin identity. */
export function electricalPinSignature(json: CircuitJson) {
  const signature = electricalSignature(json)
  const pinKey = new Map(
    signature.ports.map((p) => [p.id, `${p.componentId}.${p.pin}`]),
  )
  return {
    components: signature.components,
    ports: signature.ports
      .map(({ id, peers, ...p }) => ({
        ...p,
        peers: peers.map((id) => pinKey.get(id)).sort(),
      }))
      .sort((a, b) =>
        `${a.componentId}.${a.pin}`.localeCompare(`${b.componentId}.${b.pin}`),
      ),
  }
}
