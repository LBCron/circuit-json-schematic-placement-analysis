import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import type {
  SchematicPlacementAnalysis,
  SchematicPlacementIssue,
  SchematicBoxPlacement,
  SchematicIssueBounds,
  SchematicPinLabelBounds,
} from "../index"
import {
  getIssueSchematicSheetContext,
  getRelevantPlacementsForIssues,
} from "../utils/issue-context"
import { centeredRect } from "../utils/geometry"
import { getPinLabelHighlightBounds } from "../utils/schematic-box-labels"
import {
  createIssueMarkerPlacer,
  ISSUE_MARKER_RADIUS,
  type SvgViewport,
} from "./place-issue-markers"

export type IssueType = SchematicPlacementIssue["lineItemType"]

export function getReproSheets(circuitJson: CircuitJson) {
  const ids = new Set(
    circuitJson.flatMap((element) =>
      element.type.startsWith("schematic_") &&
      !element.type.endsWith("_warning") &&
      !element.type.endsWith("_error") &&
      // Shared definitions and invisible subcircuit groups don't create a sheet.
      element.type !== "schematic_symbol" &&
      !(
        element.type === "schematic_group" &&
        element.is_subcircuit &&
        !element.show_as_schematic_box
      )
        ? [
            ("schematic_sheet_id" in element
              ? element.schematic_sheet_id
              : undefined) ?? "",
          ]
        : [],
    ),
  )
  return [...ids].map((id) => {
    const sheet = circuitJson.find(
      (element) =>
        element.type === "schematic_sheet" && element.schematic_sheet_id === id,
    )
    return {
      id,
      name:
        sheet?.type === "schematic_sheet"
          ? sheet.name || id
          : id || "Unassigned sheet",
    }
  })
}

const escapeXml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll(">", "&gt;")
const boxBounds = (box: SchematicBoxPlacement) =>
  centeredRect(box.schX, box.schY, box.width, box.height)

/** Use the renderer's own transform, never infer scale from component extents.
 * Render one sheet at a time so overlapping coordinates on other sheets cannot leak in. */
export function renderIssueOverlay(input: {
  circuitJson: CircuitJson
  analysis: SchematicPlacementAnalysis
  schematicSheetId?: string
  issueTypes?: readonly IssueType[]
  issueIndex?: number
  showOverlay?: boolean
  /** Keep numbered markers while hiding highlight geometry and context boxes. */
  showIssueGeometry?: boolean
  /** Use this exact viewport in schematic coordinates, including any desired padding. */
  viewportBounds?: SchematicIssueBounds
  /** Show the complete sheet. By default, frame only the selected issues. */
  showFullSchematic?: boolean
  width?: number
  height?: number
}) {
  const { circuitJson, analysis } = input
  const sheetId =
    input.schematicSheetId ?? getReproSheets(circuitJson)[0]?.id ?? ""
  const sheetJson = circuitJson.filter(
    (element) =>
      !element.type.startsWith("schematic_") ||
      element.type === "schematic_symbol" ||
      (("schematic_sheet_id" in element
        ? element.schematic_sheet_id
        : undefined) ?? "") === sheetId,
  )
  const svg = convertCircuitJsonToSchematicSvg(sheetJson, {
    width: input.width ?? 1400,
    height: input.height ?? 900,
  })
  const matrix = svg.match(/data-real-to-screen-transform="matrix\(([^)]+)\)"/)
  if (!matrix)
    throw new Error(
      "Schematic renderer did not provide its coordinate transform",
    )
  const values = matrix[1]!.split(/[\s,]+/).map(Number)
  if (values.length !== 6 || values.some((value) => !Number.isFinite(value)))
    throw new Error("Invalid schematic transform")
  const [a, b, c, d, e, f] = values as [
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  const screen = (x: number, y: number) => ({
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  })
  const issueBounds: SchematicIssueBounds[] = []
  const focusPoints: Array<{ x: number; y: number }> = []
  const includeBounds = (bounds: SchematicIssueBounds) => {
    issueBounds.push(bounds)
    for (const x of [bounds.left, bounds.right]) {
      for (const y of [bounds.bottom, bounds.top])
        focusPoints.push(screen(x, y))
    }
  }
  const placements = analysis
    .getLineItems()
    .filter((item) => item.lineItemType === "SchematicBoxPlacement")
  // Several issue types can target the same box. Draw its fill only once.
  const drawnRectangles = new Set<string>()
  const overlays = analysis.getIssues().flatMap((issue, index) => {
    if (
      (getIssueSchematicSheetContext(issue).schematicSheetId ?? "") !==
        sheetId ||
      (input.issueTypes !== undefined &&
        !input.issueTypes.includes(issue.lineItemType)) ||
      (input.issueIndex !== undefined && index !== input.issueIndex)
    )
      return []
    const context = getRelevantPlacementsForIssues({
      issues: [issue],
      componentPlacements: placements,
      circuitJson,
    })
    const geometry: string[] = []
    let anchor: { x: number; y: number } | undefined
    const markerAnchors = new Map<string, { x: number; y: number }>()
    const rect = (
      bounds: SchematicIssueBounds,
      isContext = false,
      label?: SchematicPinLabelBounds,
    ) => {
      includeBounds(bounds)
      anchor ??= { x: bounds.left, y: bounds.top }
      const key = [
        isContext ? "context" : "issue",
        bounds.left,
        bounds.bottom,
        bounds.right,
        bounds.top,
      ].join(":")
      // Shared boxes need a marker for each issue, even when their fill is
      // already drawn. Repeated bounds within this issue get only one marker.
      if (!isContext) markerAnchors.set(key, { x: bounds.left, y: bounds.top })
      if (drawnRectangles.has(key)) return
      drawnRectangles.add(key)
      const labelAttrs = label
        ? ` class="pin-label-collision-highlight" data-highlight-schematic-port-id="${escapeXml(label.schematicPortId)}" data-highlight-label="${escapeXml(label.text)}"`
        : ""
      const drawnBounds = label ? getPinLabelHighlightBounds(label) : bounds
      const markup = `<rect${labelAttrs} x="${drawnBounds.left}" y="${drawnBounds.bottom}" width="${drawnBounds.right - drawnBounds.left}" height="${drawnBounds.top - drawnBounds.bottom}" fill="${isContext ? "none" : "#ef444433"}" stroke="${isContext ? "#2563eb" : "#dc2626"}" stroke-width="${isContext ? 0.35 : 0.5}" ${isContext ? 'stroke-dasharray="5 3"' : ""} vector-effect="non-scaling-stroke" />`
      geometry.push(markup)
    }
    for (const placement of context) rect(boxBounds(placement), true)
    // Prefer diagnostic geometry for the numbered marker over contextual boxes.
    anchor = undefined
    switch (issue.lineItemType) {
      case "RailPathTooSpreadOut": {
        includeBounds(issue.pathBounds)
        anchor = issue.pathPoints[0]
        geometry.push(
          `<polyline points="${issue.pathPoints.map((p) => `${p.x},${p.y}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="3" stroke-opacity="0.75" vector-effect="non-scaling-stroke" />`,
        )
        break
      }
      case "ComponentOverlap": {
        const first = boxBounds(issue.firstComponent)
        const second = boxBounds(issue.secondComponent)
        rect({
          left: Math.max(first.left, second.left),
          right: Math.min(first.right, second.right),
          top: Math.min(first.top, second.top),
          bottom: Math.max(first.bottom, second.bottom),
        })
        break
      }
      case "NetLabelCollision":
        for (const bounds of issue.collisionBounds ?? []) rect(bounds)
        break
      case "SchematicTextCollision":
        rect(issue.textBounds)
        rect(issue.collidingObjectBounds)
        break
      case "SchematicBoxInnerLabelOutOfBounds":
        for (const label of issue.overflowingLabels)
          rect(label.bounds, false, label)
        break
      case "SchematicBoxInnerLabelCollision":
        if (issue.labelPairs?.length) {
          for (const pair of issue.labelPairs) {
            rect(pair.firstLabel.bounds, false, pair.firstLabel)
            rect(pair.secondLabel.bounds, false, pair.secondLabel)
          }
        } else {
          for (const placement of context) rect(boxBounds(placement))
        }
        break
      case "ComponentNetLabelCollision":
        rect(issue.overlappingLabel1Bounds)
        rect(issue.overlappingLabel2Bounds)
        break
      case "ComponentBoxNetLabelCollision":
        rect(issue.boxBounds)
        rect(issue.labelBounds)
        break
      case "RailNetLabelHasIncorrectOrientation":
        rect(issue.labelBounds)
        break
      case "SameComponentNetLabelCollision":
        rect(issue.overlappingLabel1Bounds)
        rect(issue.overlappingLabel2Bounds)
        break
      case "VerboseSchematicNetLabel": {
        anchor = { x: issue.schX, y: issue.schY }
        includeBounds(
          centeredRect(anchor.x, anchor.y, 18 / Math.abs(a), 18 / Math.abs(d)),
        )
        geometry.push(
          `<circle cx="${anchor.x}" cy="${anchor.y}" r="${9 / Math.abs(a)}" fill="#ef444433" stroke="#dc2626" stroke-width="0.5" vector-effect="non-scaling-stroke" />`,
        )
        break
      }
      case "TraceCanBeSimplifiedByMovingComponent": {
        if (issue.suggestedTraces) {
          const bounds = centeredRect(
            issue.newSchX,
            issue.newSchY,
            issue.targetComponent.width,
            issue.targetComponent.height,
          )
          includeBounds(bounds)
          geometry.push(
            `<rect x="${bounds.left}" y="${bounds.bottom}" width="${bounds.right - bounds.left}" height="${bounds.top - bounds.bottom}" fill="#16a34a22" stroke="#16a34a" stroke-width="1.5" vector-effect="non-scaling-stroke" />`,
          )
          for (const route of issue.suggestedTraces) {
            for (const [i, to] of route.points.slice(1).entries()) {
              const from = route.points[i]!
              includeBounds({
                left: Math.min(from.x, to.x),
                right: Math.max(from.x, to.x),
                bottom: Math.min(from.y, to.y),
                top: Math.max(from.y, to.y),
              })
              geometry.push(
                `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#16a34a" stroke-width="1.5" vector-effect="non-scaling-stroke" />`,
              )
            }
          }
        }

        const trace = sheetJson.find(
          (element) =>
            element.type === "schematic_trace" &&
            element.schematic_trace_id === issue.schematicTraceId,
        )
        if (trace?.type === "schematic_trace")
          for (const edge of trace.edges) {
            includeBounds({
              left: Math.min(edge.from.x, edge.to.x),
              right: Math.max(edge.from.x, edge.to.x),
              bottom: Math.min(edge.from.y, edge.to.y),
              top: Math.max(edge.from.y, edge.to.y),
            })
            anchor ??= edge.from
            geometry.push(
              `<line x1="${edge.from.x}" y1="${edge.from.y}" x2="${edge.to.x}" y2="${edge.to.y}" stroke="#dc2626" stroke-width="0.5" vector-effect="non-scaling-stroke" />`,
            )
          }
        break
      }
      default:
        for (const placement of context) rect(boxBounds(placement))
    }
    anchor ??= context[0]
      ? { x: context[0].schX, y: context[0].schY }
      : undefined
    const points = (
      markerAnchors.size ? [...markerAnchors.values()] : anchor ? [anchor] : []
    ).map((point) => screen(point.x, point.y))
    const title = escapeXml(
      `#${index + 1} ${issue.lineItemType}\n${analysis.schematicIssuesToString(issue)}`,
    )
    return [
      {
        index,
        points,
        title,
        geometry: `<title>${title}</title><g transform="matrix(${values.join(" ")})">${geometry.join("")}</g>`,
        issueType: issue.lineItemType,
      },
    ]
  })
  let framedSvg = svg
  let markerScale = 1
  let viewport: SvgViewport = {
    left: 0,
    top: 0,
    right: input.width ?? 1400,
    bottom: input.height ?? 900,
  }
  if (input.viewportBounds) {
    focusPoints.length = 0
    for (const x of [input.viewportBounds.left, input.viewportBounds.right]) {
      for (const y of [input.viewportBounds.bottom, input.viewportBounds.top])
        focusPoints.push(screen(x, y))
    }
  }
  if (!input.showFullSchematic && focusPoints.length > 0) {
    const minX = Math.min(...focusPoints.map((point) => point.x))
    const maxX = Math.max(...focusPoints.map((point) => point.x))
    const minY = Math.min(...focusPoints.map((point) => point.y))
    const maxY = Math.max(...focusPoints.map((point) => point.y))
    // Half a bounds-width/height of padding on each side. A small minimum also
    // gives point-like or perfectly horizontal/vertical issues a useful frame.
    const paddingX = input.viewportBounds ? 0 : Math.max((maxX - minX) / 2, 12)
    const paddingY = input.viewportBounds ? 0 : Math.max((maxY - minY) / 2, 12)
    const width = maxX - minX + paddingX * 2
    const height = maxY - minY + paddingY * 2
    viewport = {
      left: minX - paddingX,
      top: minY - paddingY,
      right: maxX + paddingX,
      bottom: maxY + paddingY,
    }
    const viewBox = `${viewport.left} ${viewport.top} ${width} ${height}`
    framedSvg = svg.replace(/^<svg\b[^>]*>/, (root) =>
      root
        .replace(/\sviewBox="[^"]*"/, "")
        .replace(/>$/, ` viewBox="${viewBox}">`),
    )
    // Keep numbered markers readable without magnifying them with the crop.
    markerScale = Math.max(
      width / (input.width ?? 1400),
      height / (input.height ?? 900),
    )
    // SVG's default aspect-ratio fitting can leave visible space outside the viewBox.
    const visibleWidth = (input.width ?? 1400) * markerScale
    const visibleHeight = (input.height ?? 900) * markerScale
    viewport = {
      left: (minX + maxX - visibleWidth) / 2,
      right: (minX + maxX + visibleWidth) / 2,
      top: (minY + maxY - visibleHeight) / 2,
      bottom: (minY + maxY + visibleHeight) / 2,
    }
  }
  const bounds = issueBounds.length
    ? {
        left: Math.min(...issueBounds.map((bounds) => bounds.left)),
        right: Math.max(...issueBounds.map((bounds) => bounds.right)),
        top: Math.max(...issueBounds.map((bounds) => bounds.top)),
        bottom: Math.min(...issueBounds.map((bounds) => bounds.bottom)),
      }
    : undefined
  if (input.showOverlay === false) return { svg: framedSvg, bounds }
  const placeMarker = createIssueMarkerPlacer(viewport, markerScale)
  const leaders: string[] = []
  const markers: string[] = []
  const markup = overlays.map(
    ({ index, points, title, geometry, issueType }) => {
      for (const point of points) {
        const preferredCenter = {
          x: point.x,
          y: point.y - (ISSUE_MARKER_RADIUS + 1) * markerScale,
        }
        const center = placeMarker(preferredCenter)
        if (center.x !== preferredCenter.x || center.y !== preferredCenter.y)
          leaders.push(
            `<line x1="${point.x}" y1="${point.y}" x2="${center.x}" y2="${center.y}" stroke="#b91c1c" stroke-width="0.5" />`,
          )
        markers.push(
          `<g data-issue-number="${index + 1}" data-issue-type="${issueType}" transform="translate(${center.x} ${center.y}) scale(${markerScale})"><title>${title}</title><circle r="${ISSUE_MARKER_RADIUS}" fill="#b91c1c" /><text y="4" text-anchor="middle" fill="white" font-family="sans-serif" font-size="11">${index + 1}</text></g>`,
        )
      }
      return input.showIssueGeometry === false
        ? ""
        : `<g data-issue-index="${index}" data-issue-type="${issueType}">${geometry}</g>`
    },
  )
  return {
    bounds,
    svg: framedSvg.replace(
      /<\/svg>\s*$/,
      `<g class="placement-issue-overlays">${markup.join("\n")}${leaders.join("\n")}${markers.join("\n")}</g></svg>`,
    ),
  }
}

export function createIssueOverlaySvg(
  input: Parameters<typeof renderIssueOverlay>[0],
): string {
  return renderIssueOverlay(input).svg
}
