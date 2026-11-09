import type { CircuitJson } from "circuit-json"
import type { SchematicPlacementAnalysis } from "lib/index"
import type { SchematicPlacementIssue } from "lib/types"
import { escapeAttr } from "lib/utils/format"
import {
  createIssueMarkerPlacer,
  ISSUE_MARKER_RADIUS,
} from "lib/svg/place-issue-markers"
import {
  getIssueSchematicSheetContext,
  getRelevantPlacementsForIssues,
} from "lib/utils/issue-context"
import { buildSolverContext } from "lib/utils/placements"
import { parseSync, stringify, type INode } from "svgson"
import { getPinLabelHighlightBounds } from "lib/utils/schematic-box-labels"

type Bounds = { left: number; right: number; top: number; bottom: number }
type Point = { x: number; y: number }
type Shape = { suggested?: boolean } & (
  | {
      type: "box"
      bounds: Bounds
      componentId?: string
      schematicPortId?: string
      labelText?: string
    }
  | { type: "line"; from: Point; to: Point }
)
interface IssueHighlight {
  number: number
  issue: SchematicPlacementIssue
  sheetId: string
  shapes: Shape[]
}

/** Add overlays to the existing render without changing its viewport or listing. */
export function addSchematicIssueHighlights(input: {
  svg: string
  circuitJson: CircuitJson
  analysis: SchematicPlacementAnalysis
  issueTypes?: SchematicPlacementIssue["lineItemType"][]
}): { svg: string; highlights: IssueHighlight[] } {
  const highlights = getIssueHighlights(
    input.circuitJson,
    input.analysis,
  ).filter(
    (entry) =>
      !input.issueTypes || input.issueTypes.includes(entry.issue.lineItemType),
  )
  if (!highlights.some((entry) => entry.shapes.length))
    return { svg: input.svg, highlights: [] }
  const sheets = input.circuitJson
    .filter((e) => e.type === "schematic_sheet")
    .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
  const sheetIds = sheets.length
    ? sheets.map((sheet) => sheet.schematic_sheet_id)
    : [""]
  const root = parseSync(input.svg)
  const renderedHighlights: IssueHighlight[] = []
  let sheetIndex = 0
  const visit = (node: INode) => {
    // Each rendered sheet supplies its own transform, including padding and Y inversion.
    if (
      node.name === "svg" &&
      node.attributes["data-real-to-screen-transform"]
    ) {
      const sheetId = sheetIds[sheetIndex++]!
      const selected = highlights.filter(
        (entry) => entry.sheetId === sheetId && entry.shapes.length,
      )
      if (selected.length) {
        node.children.push(createHighlightLayer(node, selected, input.analysis))
        renderedHighlights.push(...selected)
      }
      return
    }
    for (const child of node.children) visit(child)
  }
  visit(root)
  return { svg: stringify(root), highlights: renderedHighlights }
}

function getIssueHighlights(
  circuitJson: CircuitJson,
  analysis: SchematicPlacementAnalysis,
): IssueHighlight[] {
  const { componentPlacements } = buildSolverContext(circuitJson)
  return analysis
    .getLineItems()
    .flatMap((item) =>
      item.lineItemType === "SchematicPlacementIssues" ? item.issues : [],
    )
    .map((issue, index) => {
      const sheetId =
        getIssueSchematicSheetContext(issue).schematicSheetId ?? ""
      const placements = getRelevantPlacementsForIssues({
        issues: [issue],
        componentPlacements,
        circuitJson,
      }).filter((p) => (p.schematicSheetId ?? "") === sheetId)
      const shapes: Shape[] = []
      const box = (bounds: Bounds, componentId?: string) =>
        shapes.push({ type: "box", bounds, componentId })
      const point = (x: number, y: number) =>
        box({ left: x - 0.1, right: x + 0.1, top: y + 0.1, bottom: y - 0.1 })
      const trace = (id: string, near?: Bounds) => {
        const target = circuitJson.find(
          (e) =>
            e.type === "schematic_trace" &&
            e.schematic_trace_id === id &&
            (e.schematic_sheet_id ?? "") === sheetId,
        )
        if (target?.type !== "schematic_trace") return
        for (const edge of target.edges) {
          if (
            near &&
            (Math.max(edge.from.x, edge.to.x) < near.left ||
              Math.min(edge.from.x, edge.to.x) > near.right ||
              Math.max(edge.from.y, edge.to.y) < near.bottom ||
              Math.min(edge.from.y, edge.to.y) > near.top)
          )
            continue
          shapes.push({ type: "line", from: edge.from, to: edge.to })
        }
      }
      if (
        issue.lineItemType === "SchematicBoxInnerLabelCollision" &&
        issue.labelPairs?.length
      ) {
        for (const pair of issue.labelPairs) {
          for (const label of [pair.firstLabel, pair.secondLabel])
            shapes.push({
              type: "box",
              bounds: getPinLabelHighlightBounds(label),
              schematicPortId: label.schematicPortId,
              labelText: label.text,
            })
        }
      } else if (issue.lineItemType === "SchematicBoxInnerLabelOutOfBounds") {
        for (const label of issue.overflowingLabels)
          shapes.push({
            type: "box",
            bounds: getPinLabelHighlightBounds(label),
            schematicPortId: label.schematicPortId,
            labelText: label.text,
          })
      } else if (issue.lineItemType === "SchematicTextCollision") {
        box(issue.textBounds)
        if (issue.collidingObject.type === "trace")
          trace(issue.collidingObject.id, issue.textBounds)
        else
          box(
            issue.collidingObjectBounds,
            issue.collidingObject.type === "component"
              ? issue.collidingObject.schematicComponentId
              : undefined,
          )
      } else {
        for (const p of placements)
          box(
            {
              left: p.schX - p.width / 2,
              right: p.schX + p.width / 2,
              top: p.schY + p.height / 2,
              bottom: p.schY - p.height / 2,
            },
            p.schematicComponentId,
          )
        if (
          issue.lineItemType === "TraceCanBeSimplifiedByMovingComponent" ||
          issue.lineItemType === "TwoPinComponentCouldBeFlipped"
        )
          trace(issue.schematicTraceId)
        if (
          issue.lineItemType === "TraceCanBeSimplifiedByMovingComponent" &&
          issue.suggestedTraces
        ) {
          shapes.push({
            type: "box",
            suggested: true,
            bounds: {
              left: issue.newSchX - issue.targetComponent.width / 2,
              right: issue.newSchX + issue.targetComponent.width / 2,
              top: issue.newSchY + issue.targetComponent.height / 2,
              bottom: issue.newSchY - issue.targetComponent.height / 2,
            },
          })
          for (const route of issue.suggestedTraces)
            for (const [i, to] of route.points.slice(1).entries())
              shapes.push({
                type: "line",
                suggested: true,
                from: route.points[i]!,
                to,
              })
        }
        if (issue.lineItemType === "VerboseSchematicNetLabel")
          point(issue.schX, issue.schY)
        if (issue.lineItemType === "ComponentNetLabelCollision") {
          box(issue.overlappingLabel1Bounds)
          box(issue.overlappingLabel2Bounds)
        }
        if (issue.lineItemType === "ComponentBoxNetLabelCollision") {
          box(issue.boxBounds)
          box(issue.labelBounds)
        }
        if (issue.lineItemType === "RailNetLabelHasIncorrectOrientation") {
          box(issue.labelBounds)
        }
        if (issue.lineItemType === "SameComponentNetLabelCollision") {
          box(issue.overlappingLabel1Bounds)
          box(issue.overlappingLabel2Bounds)
        }
        if (issue.lineItemType === "ResetNetworkNotGrouped") {
          const port = circuitJson.find(
            (e) =>
              e.type === "schematic_port" &&
              e.source_port_id === issue.resetSourcePortId &&
              (e.schematic_sheet_id ?? "") === sheetId,
          )
          if (port?.type === "schematic_port")
            point(port.center.x, port.center.y)
        }
      }
      return { number: index + 1, issue, sheetId, shapes }
    })
}

function createHighlightLayer(
  node: INode,
  entries: IssueHighlight[],
  analysis: SchematicPlacementAnalysis,
): INode {
  const values = node.attributes["data-real-to-screen-transform"]
    ?.match(/^matrix\(([^)]+)\)$/)?.[1]
    ?.trim()
    .split(/[ ,]+/)
    .map(Number)
  if (!values || values.length !== 6 || values.some((n) => !Number.isFinite(n)))
    throw new Error("Schematic SVG is missing a valid coordinate transform")
  const [a, b, c, d, e, f] = values as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  const screen = (p: Point): Point => ({
    x: a * p.x + c * p.y + e,
    y: b * p.x + d * p.y + f,
  })
  // The renderer fits symbols to their ports; placement sizes can differ from
  // the drawn body. Reuse its symbol overlay instead of approximating that fit.
  const componentBounds = new Map<string, Bounds>()
  const collectBounds = (element: INode) => {
    const id = element.attributes["data-schematic-component-id"]
    const overlay = element.children.find(
      (child) =>
        child.name === "rect" &&
        child.attributes.class?.split(" ").includes("sch-component-overlay"),
    )
    if (id && overlay) {
      const { x, y, width, height } = overlay.attributes
      if (
        [x, y, width, height].every((value) => Number.isFinite(Number(value)))
      )
        componentBounds.set(id, {
          left: Number(x),
          right: Number(x) + Number(width),
          top: Number(y),
          bottom: Number(y) + Number(height),
        })
    }
    for (const child of element.children) collectBounds(child)
  }
  collectBounds(node)
  const screenBounds = (shape: Shape): Bounds => {
    if (shape.type === "box" && shape.componentId) {
      const rendered = componentBounds.get(shape.componentId)
      if (rendered) return rendered
    }
    const points =
      shape.type === "line"
        ? [shape.from, shape.to]
        : [
            { x: shape.bounds.left, y: shape.bounds.top },
            { x: shape.bounds.right, y: shape.bounds.top },
            { x: shape.bounds.left, y: shape.bounds.bottom },
            { x: shape.bounds.right, y: shape.bounds.bottom },
          ]
    const transformed = points.map(screen)
    return {
      left: Math.min(...transformed.map((p) => p.x)),
      right: Math.max(...transformed.map((p) => p.x)),
      top: Math.min(...transformed.map((p) => p.y)),
      bottom: Math.max(...transformed.map((p) => p.y)),
    }
  }
  const width = Number(node.attributes.width)
  const height = Number(node.attributes.height)
  const placeBadge = createIssueMarkerPlacer({
    left: 0,
    top: 0,
    right: width,
    bottom: height,
  })
  const markup = entries
    .map((entry) => {
      const seen = new Set<string>()
      const shapes = entry.shapes.filter((shape) => {
        const key = JSON.stringify(shape)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      const geometry = shapes
        .map((shape) => {
          if (shape.type === "line") {
            const p = screen(shape.from)
            const q = screen(shape.to)
            return `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${shape.suggested ? "#16a34a" : "#e11d48"}" stroke-width="5" stroke-opacity="0.55" />`
          }
          const r = screenBounds(shape)
          const labelAttrs = shape.schematicPortId
            ? ` class="pin-label-collision-highlight" data-highlight-schematic-port-id="${escapeAttr(shape.schematicPortId)}" data-highlight-label="${escapeAttr(shape.labelText ?? "")}"`
            : ""
          return `<rect${labelAttrs}${shape.componentId ? ` data-highlight-component-id="${escapeAttr(shape.componentId)}"` : ""} x="${r.left}" y="${r.top}" width="${Math.max(r.right - r.left, 2)}" height="${Math.max(r.bottom - r.top, 2)}" fill="${shape.suggested ? "#16a34a" : "#ef4444"}" fill-opacity="0.16" stroke="${shape.suggested ? "#16a34a" : "#dc2626"}" stroke-width="1.5" />`
        })
        .join("")
      // Repeat the issue number on every box. A trace-only issue gets one marker.
      const boxes = shapes.filter((shape) => shape.type === "box")
      const markers = (boxes.length ? boxes : shapes.slice(0, 1))
        .map((shape) => {
          const bounds = screenBounds(shape)
          const anchor = {
            x: bounds.left - ISSUE_MARKER_RADIUS - 1,
            y: bounds.top - ISSUE_MARKER_RADIUS - 1,
          }
          const badge = placeBadge(anchor)
          const leader =
            badge.x === anchor.x && badge.y === anchor.y
              ? ""
              : `<line x1="${badge.x}" y1="${badge.y}" x2="${bounds.left}" y2="${bounds.top}" stroke="#b91c1c" />`
          return `${leader}<g class="issue-marker"><circle cx="${badge.x}" cy="${badge.y}" r="${ISSUE_MARKER_RADIUS}" fill="#b91c1c" /><text x="${badge.x}" y="${badge.y}" dy="0.35em" text-anchor="middle" font-family="sans-serif" font-size="11" fill="white">${entry.number}</text></g>`
        })
        .join("")
      const title =
        analysis.schematicIssuesToString(entry.issue) ||
        entry.issue.lineItemType
      return `<g data-issue-number="${entry.number}" data-issue-type="${entry.issue.lineItemType}" data-schematic-sheet-id="${escapeAttr(entry.sheetId)}"><title><![CDATA[${title.replaceAll("]]>", "]]]]><![CDATA[>")}]]></title>${geometry}${markers}</g>`
    })
    .join("")
  return parseSync(
    `<svg><g class="schematic-issue-highlights">${markup}</g></svg>`,
  ).children[0]!
}
