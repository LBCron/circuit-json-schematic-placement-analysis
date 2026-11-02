import { stackSvgsVertically } from "stack-svgs"
import { escapeAttr } from "lib/utils/format"
import { getIssueSchematicSheetContext } from "lib/utils/issue-context"
import { getSchematicTextPolygons } from "lib/utils/schematic-text-geometry"
import {
  createIssueOverlaySvg,
  getReproSheets,
} from "./create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "./create-schematic-analysis-fixture-svg"

/** Keep reported issue counts and diagnostic text below the schematic. */
export function createIssueReproSnapshot(
  input: Parameters<typeof createIssueOverlaySvg>[0] & {
    /** Draw red numbered badges beside diagnostics instead of plain #number lines. */
    showListingIssueMarkers?: boolean
    /** Outline the analyzer's polygons for these text IDs, even without a collision. */
    showTextBoundsFor?: readonly string[]
  },
) {
  const allIssues = input.analysis.getIssues()
  const issues = input.analysis
    .getIssues(input)
    .filter(
      (issue) =>
        input.issueIndex === undefined ||
        allIssues.indexOf(issue) === input.issueIndex,
    )
  const listedIssues = issues.map((issue) => ({
    number: allIssues.indexOf(issue) + 1,
    text: input.analysis.schematicIssuesToString(issue),
    sheetId: getIssueSchematicSheetContext(issue).schematicSheetId ?? "",
  }))
  let circuitSvg = createIssueOverlaySvg(input)
  const textBoundsListing: string[] = []
  if (input.showTextBoundsFor?.length) {
    const sheetId =
      input.schematicSheetId ?? getReproSheets(input.circuitJson)[0]?.id ?? ""
    const matrix = circuitSvg.match(
      /data-real-to-screen-transform="(matrix\([^)]+\))"/,
    )?.[1]
    if (!matrix) throw new Error("Missing schematic coordinate transform")
    const outlines = input.showTextBoundsFor.flatMap((id) => {
      const text = input.circuitJson.find(
        (element) =>
          element.type === "schematic_text" &&
          element.schematic_text_id === id &&
          (element.schematic_sheet_id ?? "") === sheetId,
      )
      if (text?.type !== "schematic_text")
        throw new Error(`Missing text ${id} on sheet ${sheetId}`)
      const polygons = getSchematicTextPolygons(text)
      const widths = polygons.map((polygon) =>
        Math.hypot(
          polygon[1]!.x - polygon[0]!.x,
          polygon[1]!.y - polygon[0]!.y,
        ).toFixed(3),
      )
      textBoundsListing.push(
        `${JSON.stringify(text.text)}: width=${widths.join(", ")}`,
      )
      return polygons.map(
        (polygon) =>
          `<polygon data-schematic-text-id="${escapeAttr(id)}" points="${polygon.map(({ x, y }) => `${x},${y}`).join(" ")}" fill="none" stroke="#7c3aed" stroke-width="1.5" vector-effect="non-scaling-stroke" />`,
      )
    })
    circuitSvg = circuitSvg.replace(
      "</svg>",
      `<g class="schematic-text-bounds" transform="${matrix}">${outlines.join("\n")}</g></svg>`,
    )
  }
  const text = [
    ...(textBoundsListing.length
      ? [
          "Purple outlines: analyzer text bounds (widths in schematic units).",
          ...textBoundsListing,
          "",
        ]
      : []),
    "Emitted issue counts (all sheets):",
    ...Object.entries(input.analysis.getIssueCounts())
      .filter(([, count]) => count > 0)
      .map(([type, count]) => `${type}: ${count}`),
    `Selected type(s): ${input.issueTypes?.join(", ") ?? "all"}`,
    `Matching issues: ${issues.length}`,
    ...listedIssues.flatMap(({ number, text }) =>
      input.showListingIssueMarkers ? [text] : [`#${number}`, text],
    ),
  ].join("\n")
  return stackSvgsVertically(
    [
      // Keep the cropped SVG nested: stack-svgs otherwise stretches its viewBox
      // and lets off-frame schematic content spill into the analysis text.
      `<svg xmlns="http://www.w3.org/2000/svg" width="${input.width ?? 1400}" height="${input.height ?? 900}">${circuitSvg}</svg>`,
      createAnalyzerTextSvg(
        text,
        input.width ?? 1400,
        input.showListingIssueMarkers ? listedIssues : [],
      ),
    ],
    { normalizeSize: false, gap: 0 },
  ).replace(/[ \t]+$/gm, "")
}
