import { expect, test } from "bun:test"
import { getSourceConnectivity } from "lib/utils/source-connectivity"
import { analyzeSchematicPlacement } from "lib/index"
import { createMagneticShutterPower } from "../assets/magnetic-shutter-parallel-rc"
import { createSchematicAnalysisFixtureSvg } from "../fixtures/create-schematic-analysis-fixture-svg"
import {
  getReproSourcePort,
  expectReproRendered,
  getReproSchematicComponent,
} from "../fixtures/placement-repro-assertions"

test("reproduces the complete magnetic-shutter Power sheet with separated parallel R3/C9", async () => {
  const circuitJson = await createMagneticShutterPower()
  expectReproRendered(circuitJson, 14)
  expect(circuitJson.filter((e) => e.type === "source_port")).toHaveLength(53)
  const groups = [
    ["C1.pin1", "J1.pin18", "J1.pin27", "U2.pin10"],
    [
      "C1.pin2",
      "C2.pin2",
      "C8.pin2",
      "C9.pin2",
      "J1.pin13",
      "J1.pin14",
      "J1.pin15",
      "J1.pin16",
      "J1.pin17",
      "J1.pin28",
      "J2.pin1",
      "J2.pin3",
      "J2.pin4",
      "R1.pin2",
      "R2.pin2",
      "R3.pin2",
      "R8.pin2",
      "R9.pin2",
      "U2.pin11",
      "U2.pin5",
    ],
    ["C2.pin1", "J2.pin2", "R4.pin1", "U2.pin2"],
    ["C8.pin1", "U2.pin1"],
    ["C9.pin1", "R3.pin1", "U2.pin8"],
    ["J1.pin19"],
    ["J1.pin20", "R1.pin1"],
    ["J1.pin21"],
    ["J1.pin22"],
    ["J1.pin23"],
    ["J1.pin24"],
    ["J1.pin25"],
    ["J1.pin26", "R2.pin1"],
    ["LED1.pin1", "R4.pin2"],
    ["LED1.pin2", "U2.pin3"],
    ["R8.pin1", "U2.pin7"],
    ["R9.pin1", "U2.pin6"],
    ["U2.pin4"],
    ["U2.pin9"],
  ]
  const connected = getSourceConnectivity(circuitJson)
  const netKeys = groups.map((group) => {
    const keys = group.map((endpoint) => {
      const [name, pin] = endpoint.split(".")
      return connected(
        getReproSourcePort(circuitJson, name!, pin!).source_port_id,
      )
    })
    expect(new Set(keys).size).toBe(1)
    return keys[0]
  })
  expect(new Set(netKeys).size).toBe(groups.length)
  for (const [name, x, y, symbol] of [
    ["J1", -8, 3, null],
    ["R2", -4, 2, "boxresistor_down"],
    ["R1", -4, 4, "boxresistor_down"],
    ["U2", 1, 4, null],
    ["R3", 1, 1, "boxresistor_down"],
    ["C2", 4, 6, "capacitor_down"],
    ["C1", -2, 6, "capacitor_down"],
    ["R4", -2, -1, "boxresistor_down"],
    ["LED1", 1, -1, "led_right"],
    ["J2", 8, 4, null],
    ["R8", 5, 0, "boxresistor_down"],
    ["R9", 5, -3, "boxresistor_down"],
    ["C8", -3, -4, "capacitor_down"],
    ["C9", 1, -3, "capacitor_down"],
  ] as const) {
    const placement = getReproSchematicComponent(circuitJson, name)
    expect(placement.center).toEqual({ x, y })
    expect(placement.symbol_name ?? null).toBe(symbol)
  }
  const analysis = analyzeSchematicPlacement(circuitJson)
  expect(analysis.getIssues().map((issue) => issue.lineItemType)).toEqual([
    "ParallelRcNotAligned",
    "DiodeResistorNotAligned",
    "ResistorSeparatedFromChipPin",
  ])
  expect(
    analysis.getIssues({ issueTypes: ["ResistorSeparatedFromChipPin"] })[0],
  ).toMatchObject({
    resistorSchematicBox: { sourceComponentName: "R9" },
  })
  expect(analysis.getIssues()[0]).toMatchObject({
    lineItemType: "ParallelRcNotAligned",
    reason: "staggered",
    resistorSchematicBox: { sourceComponentName: "R3" },
    capacitorSchematicBox: { sourceComponentName: "C9" },
  })
  expect(
    analysis.getIssues({ issueTypes: ["DiodeResistorNotAligned"] }),
  ).toMatchObject([
    {
      diodeSchematicBox: { sourceComponentName: "LED1" },
      resistorSchematicBox: { sourceComponentName: "R4" },
    },
  ])
  const svg = createSchematicAnalysisFixtureSvg({
    circuitJson,
    analysis,
    width: 1600,
    height: 1200,
    highlightIssues: ["ParallelRcNotAligned"],
  })
  expect([...svg.matchAll(/class="issue-marker"/g)]).toHaveLength(2)
  expect(svg).toContain('data-listing-issue-number="1"')
  expect(svg).toMatchSvgSnapshot(import.meta.path, "full-sheet")
})
