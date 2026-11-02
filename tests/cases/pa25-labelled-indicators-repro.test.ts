import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createPa25LabelledIndicators } from "../assets/pa25-labelled-indicators"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"
test("reproduces the published PA25 labelled LED resistor branches", async () => {
  for (const single of [false, true]) {
    const json = await createPa25LabelledIndicators(false, single)
    expectReproRendered(json, single ? 2 : 6)
    for (const i of single ? [1] : [0, 1, 2]) {
      const signal = ["POWER", "STATUS", "FAULT"][i]!
      expect(box(json, `R${43 + i}`).center.x).toBeCloseTo(-11.7 + i * 7.8, 6)
      expect(box(json, `LED${i + 1}`).center.x).toBeCloseTo(-7.8 + i * 7.8, 6)
      expect(box(json, `LED${i + 1}`).symbol_name).toBe("led_down")
      expectReproNets(json, [
        [`R${43 + i}.pin1`, `net.${i === 0 ? "V3V3" : signal + "_LED"}`],
        [`R${43 + i}.pin2`, `LED${i + 1}.anode`, `net.${signal}_LED_A`],
        [`LED${i + 1}.cathode`, "net.GND"],
      ])
    }
    const analysis = analyzeSchematicPlacement(json)
    expect(analysis.getIssues()).toEqual([])
    expect(
      createIssueReproSnapshot({
        circuitJson: json,
        analysis,
        showFullSchematic: true,
        showIssueGeometry: false,
        showListingIssueMarkers: true,
        width: 1400,
        height: single ? 650 : 450,
      }),
    ).toMatchSvgSnapshot(import.meta.path, single ? "pair" : "section")
  }
})
