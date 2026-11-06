import { expect, test } from "bun:test"
import { parseSync, type INode } from "svgson"
import { analyzeSchematicPlacement } from "lib/index"
import { getRp2040BldcSheet } from "../assets/rp2040-bldc-controller"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import { createIssueOverlaySvg } from "../fixtures/create-issue-overlay-svg"

// Compare the ORing power paths with LM74700-Q1 Figure 10-1.
// https://www.ti.com/lit/ds/symlink/lm74700-q1.pdf#page=16
test("records the full input sheet's local trace suggestions without rearranging its ORing branches", () => {
  const circuitJson = getRp2040BldcSheet("power_input")
  expect(
    circuitJson.filter((e) => e.type === "schematic_component"),
  ).toHaveLength(31)
  const analysis = analyzeSchematicPlacement(circuitJson)
  expect(
    Object.fromEntries(
      Object.entries(analysis.getIssueCounts()).filter(
        ([, count]) => count > 0,
      ),
    ),
  ).toEqual({
    ParallelDiodeResistorNotAligned: 1,
    ComponentBranchesOutOfOrder: 1,
    GenericSchematicBoxTooWide: 2,
    SchematicPinPaddingToEdgeTooLarge: 4,
    NetLabelCollision: 1,
    TwoPinComponentShouldBeVertical: 6,
  })
  expect(
    analysis.getIssues({ issueTypes: ["ParallelDiodeResistorNotAligned"] }),
  ).toMatchObject([
    {
      diodeSchematicBox: { sourceComponentName: "D_PD_SENSE" },
      resistorSchematicBox: { sourceComponentName: "R_PD_SENSE_CHARGE" },
      reason: "crossed_connections",
    },
  ])
  expect(
    analysis.getIssues({ issueTypes: ["ComponentBranchesOutOfOrder"] }),
  ).toMatchObject([
    {
      hostSchematicBox: { sourceComponentName: "U_PD" },
      firstComponentSchematicBox: { sourceComponentName: "C_PD_1V2" },
      secondComponentSchematicBox: { sourceComponentName: "C_PD_2V7" },
    },
  ])
  const padding = analysis.getIssues({
    issueTypes: ["SchematicPinPaddingToEdgeTooLarge"],
  })
  expect(
    padding.map((issue) =>
      issue.lineItemType === "SchematicPinPaddingToEdgeTooLarge"
        ? issue.schematicBox.sourceComponentName
        : "",
    ),
  ).toEqual(["J_PD", "U_PD", "U_PD_OR", "U_BARREL_OR"])
  // These custom symbols have no symbol_name: the explicit box flag is decisive.
  for (const name of [
    "D_PD_CC1",
    "D_PD_CC2",
    "D_PD_VBUS",
    "Q_PD_SWITCH",
    "Q_PD_OR",
    "Q_BARREL_OR",
  ]) {
    const source = circuitJson.find(
      (e) => e.type === "source_component" && e.name === name,
    )!
    if (source.type !== "source_component") throw new Error("Missing source")
    const component = circuitJson.find(
      (e) =>
        e.type === "schematic_component" &&
        e.source_component_id === source.source_component_id,
    )!
    expect(component).toMatchObject({ is_box_with_pins: false })
    if (component.type !== "schematic_component")
      throw new Error("Missing symbol")
    expect(component.symbol_name).toBeUndefined()
    expect(
      analysis
        .getIssues({
          issueTypes: [
            "SchematicBoxInnerLabelCollision",
            "SchematicPinPaddingToEdgeTooLarge",
            "GenericSchematicBoxTooWide",
          ],
        })
        .some(
          (issue) =>
            "schematicBox" in issue &&
            issue.schematicBox.schematicComponentId ===
              component.schematic_component_id,
        ),
    ).toBe(false)
  }
  // None of the old suggestions preserves all routes and anchored labels.
  expect(
    analysis
      .getIssues()
      .flatMap((issue) =>
        issue.lineItemType === "TraceCanBeSimplifiedByMovingComponent"
          ? [issue.targetComponent.sourceComponentName]
          : [],
      ),
  ).toEqual([])
  const input = {
    circuitJson,
    analysis,
    showFullSchematic: true,
    width: 1800,
    height: 1200,
  }
  const svg = createIssueOverlaySvg(input)
  const diagnosticRects = (svg: string) =>
    descendants(parseSync(svg)).filter(
      (node) => node.name === "rect" && node.attributes.fill === "#ef444433",
    )
  const rectangles = diagnosticRects(svg)
  expect(rectangles.length).toBeGreaterThan(0)
  expect(
    new Set(
      rectangles.map(({ attributes: a }) =>
        [a.x, a.y, a.width, a.height].join(":"),
      ),
    ).size,
  ).toBe(rectangles.length)
  const paddingIndex = analysis
    .getIssues()
    .findLastIndex(
      (issue) =>
        issue.lineItemType === "SchematicPinPaddingToEdgeTooLarge" &&
        issue.schematicBox.sourceComponentName === "U_PD",
    )
  expect(paddingIndex).toBeGreaterThan(-1)
  expect(
    diagnosticRects(
      createIssueOverlaySvg({ ...input, issueIndex: paddingIndex }),
    ),
  ).toHaveLength(1)

  // Check full, focused, and wide panels in their final display coordinates.
  for (const panel of [
    { showFullSchematic: true, width: 320, height: 240 },
    { showFullSchematic: false, width: 320, height: 240 },
    { showFullSchematic: false, width: 1800, height: 120 },
  ]) {
    const rendered = createIssueOverlaySvg({ ...input, ...panel })
    const root = parseSync(rendered)
    const [left, top, width, height] = (root.attributes.viewBox
      ?.split(" ")
      .map(Number) ?? [0, 0, panel.width, panel.height]) as [
      number,
      number,
      number,
      number,
    ]
    const displayScale = Math.min(panel.width / width, panel.height / height)
    const offsetX = (panel.width - width * displayScale) / 2
    const offsetY = (panel.height - height * displayScale) / 2
    const markers = descendants(root)
      .filter((node) => node.attributes["data-issue-number"])
      .map((node) => {
        const transform = node.attributes.transform!.match(
          /^translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)$/,
        )!
        return {
          number: Number(node.attributes["data-issue-number"]),
          x: (Number(transform[1]) - left) * displayScale + offsetX,
          y: (Number(transform[2]) - top) * displayScale + offsetY,
          radius:
            Number(
              node.children.find((child) => child.name === "circle")!.attributes
                .r,
            ) *
            Number(transform[3]) *
            displayScale,
        }
      })
    expect([...new Set(markers.map((marker) => marker.number))]).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    )
    expect(
      markers.every(
        ({ x, y, radius }) =>
          x - radius >= 0 &&
          x + radius <= panel.width &&
          y - radius >= 0 &&
          y + radius <= panel.height,
      ),
    ).toBe(true)
    expect(
      markers.every((marker, index) =>
        markers
          .slice(index + 1)
          .every(
            (other) =>
              Math.hypot(marker.x - other.x, marker.y - other.y) >=
              marker.radius + other.radius,
          ),
      ),
    ).toBe(true)
  }
  expect(createIssueReproSnapshot(input)).toMatchSvgSnapshot(import.meta.path)
})

function descendants(node: INode): INode[] {
  return [node, ...node.children.flatMap(descendants)]
}
