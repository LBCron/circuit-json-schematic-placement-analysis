import { expect, test } from "bun:test"
import { stackSvgsVertically } from "stack-svgs"
import { analyzeSchematicPlacement } from "lib/index"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { createPa25LabelledIndicators } from "../assets/pa25-labelled-indicators"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"
import {
  electricalSignature,
  expectVisibleConnection,
} from "../fixtures/placement-correction-assertions"
test("aligns all PA25 labelled LED resistor pairs with continuous wires and unchanged parts", async () => {
  for (const single of [true, false]) {
    const before = await createPa25LabelledIndicators(false, single),
      after = await createPa25LabelledIndicators(true, single)
    expectReproRendered(before, single ? 2 : 6)
    expectReproRendered(after, single ? 2 : 6)
    expect(electricalSignature(after)).toEqual(electricalSignature(before))
    for (const i of single ? [1] : [0, 1, 2]) {
      expect(box(after, `LED${i + 1}`).symbol_name).toBe(
        box(before, `LED${i + 1}`).symbol_name,
      )
      expectVisibleConnection(
        after,
        `R${43 + i}`,
        "pin2",
        `LED${i + 1}`,
        "anode",
      )
    }
    const analysis = analyzeSchematicPlacement(before),
      corrected = analyzeSchematicPlacement(after),
      issues = analysis.getIssues()
    expect(issues.map((i) => i.lineItemType)).toEqual(
      Array(single ? 1 : 3).fill("DiodeResistorNotAligned"),
    )
    expect(corrected.getIssues()).toEqual([])
    expect(
      createPlacementComparisonSvg({
        subject: single ? "R44 / LED2" : "complete indicator section",
        centerEachPanel: true,
        panelHeight: single ? 650 : 500,
        padding: { left: 1.6, right: 1.6, top: 2, bottom: 1.2 },
        backgroundColor: "#f5f1ed",
        before: { circuitJson: before, analysis },
        after: { circuitJson: after, analysis: corrected },
        issues,
        beforeDiagnostic: (i) =>
          i.lineItemType === "DiodeResistorNotAligned"
            ? `${i.resistorSchematicBox.sourceComponentName} / ${i.diodeSchematicBox.sourceComponentName}: labelled series pins are not aligned.`
            : "",
        afterDiagnostic:
          "Resistors and LEDs form visible, straight series branches.\nComplete extract: 0 reported issues.",
        note: "Published positions and symbols before; original LED polarity, component values and pin connections preserved.",
      }),
    ).toMatchSvgSnapshot(
      import.meta.path,
      single ? "pair-comparison" : "section-comparison",
    )
    if (!single)
      expect(
        stackSvgsVertically(
          [
            renderIssueOverlay({
              circuitJson: after,
              analysis: corrected,
              showFullSchematic: true,
              showOverlay: false,
              width: 1600,
              height: 700,
            }).svg,
            createAnalyzerTextSvg(
              "Complete indicator section: 6 components.\nFull analysis: 0 reported issues.",
              1600,
            ),
          ],
          { normalizeSize: false, gap: 0 },
        ).replace(/[ \t]+$/gm, ""),
      ).toMatchSvgSnapshot(import.meta.path, "full-section")
  }
})
