import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createPocketAudioFilteredDivider } from "../assets/pocket-audio-filtered-divider"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
  getReproSchematicComponent as box,
} from "../fixtures/placement-repro-assertions"
test("reproduces the published filtered battery divider and its missed grouping after rotation fixes", async () => {
  for (const mode of ["original", "oriented"] as const) {
    const json = await createPocketAudioFilteredDivider(mode)
    expectReproRendered(json, 3)
    for (const [name, x, y] of [
      ["R_BAT_TOP", 14, 4],
      ["R_BAT_BOT", 0, 0],
      ["C_ADC_BAT", 7, -4],
    ] as const) {
      expect(box(json, name).center).toEqual({ x, y })
    }
    expect(box(json, "R_BAT_TOP").symbol_name).toBe(
      mode === "original" ? "boxresistor_right" : "boxresistor_down",
    )
    expect(box(json, "C_ADC_BAT").symbol_name).toBe("capacitor_down")
    expectReproNets(json, [
      ["R_BAT_TOP.pin1", "net.VBAT"],
      ["R_BAT_TOP.pin2", "R_BAT_BOT.pin1", "C_ADC_BAT.pin1", "net.BAT_SENSE"],
      ["R_BAT_BOT.pin2", "C_ADC_BAT.pin2", "net.GND"],
    ])
    const analysis = analyzeSchematicPlacement(json)
    expect(analysis.getIssues().map((i) => i.lineItemType)).toEqual(
      mode === "original"
        ? ["TwoPinComponentShouldBeVertical", "TwoPinComponentShouldBeVertical"]
        : [],
    )
    expect(
      createIssueReproSnapshot({
        circuitJson: json,
        analysis,
        showFullSchematic: true,
        showIssueGeometry: false,
        showListingIssueMarkers: true,
        width: 1400,
        height: 850,
      }),
    ).toMatchSvgSnapshot(import.meta.path, mode)
  }
})
