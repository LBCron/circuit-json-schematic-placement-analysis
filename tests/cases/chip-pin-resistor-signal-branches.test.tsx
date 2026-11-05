import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { analyzeSchematicPlacement } from "lib/index"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"

async function render({
  peerX = -8,
  resistorX = 7,
  power = false,
  extra = false,
} = {}) {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(
    <board>
      <chip
        name="U1"
        schX={0}
        schY={0}
        schWidth={2}
        schHeight={2}
        pinLabels={{ pin1: "X", pin2: "Y", pin3: "Z" }}
        schPinArrangement={{ leftSide: [1, 2, 3] }}
        connections={{ pin1: ".R1 > .pin2" }}
      />
      <resistor
        name="R1"
        resistance="10k"
        schX={resistorX}
        schY={0.2}
        connections={{ pin1: power ? "net.arbitrary" : ".J1 > .pin1" }}
      />
      {power ? (
        <net name="arbitrary" isPowerNet />
      ) : (
        <pinheader name="J1" pinCount={2} schX={peerX} schY={0} />
      )}
      {extra && (
        <capacitor
          name="C1"
          capacitance="1nF"
          schX={-5}
          schY={-4}
          connections={{ pin1: ".R1 > .pin1" }}
        />
      )}
    </board>,
  )
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
test("handles supply and private signal resistors without worsening the far connection", async () => {
  const analyze = (j: Awaited<ReturnType<typeof render>>) =>
    analyzeSchematicPlacement(j, {
      issueTypes: ["ResistorSeparatedFromChipPin"],
    })
  const before = await render(),
    analysis = analyze(before)
  expect(analysis.getIssues()).toHaveLength(1)
  expect(analyze(await render({ power: true })).getIssues()).toHaveLength(1)
  for (const options of [{ resistorX: -4 }, { peerX: 9 }, { extra: true }])
    expect(analyze(await render(options)).getIssues()).toEqual([])
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component" || e.type === "source_net")
      e.name = "arbitrary"
    if (e.type === "source_port") {
      e.name = "arbitrary"
      e.port_hints = []
    }
  }
  expect(analyze(renamed).getIssues()).toHaveLength(1)
  for (const field of ["schematic_sheet_id", "schematic_group_id"] as const) {
    const split = structuredClone(before)
    const peer = split.find(
      (e) => e.type === "source_component" && e.name === "J1",
    )!
    for (const e of split)
      if (
        e.type === "schematic_component" &&
        peer.type === "source_component" &&
        e.source_component_id === peer.source_component_id
      )
        e[field] = "separate"
    expect(analyze(split).getIssues()).toEqual([])
  }
  expect(
    analyze(before.filter((e) => e.type !== "schematic_trace")).getIssues(),
  ).toEqual([])
  const divided = structuredClone(before)
  divided.push({
    type: "schematic_line",
    schematic_line_id: "section",
    x1: 3,
    y1: -5,
    x2: 3,
    y2: 5,
    is_dashed: true,
  } as (typeof divided)[number])
  expect(analyze(divided).getIssues()).toEqual([])
  expect(
    createIssueReproSnapshot({
      circuitJson: before,
      analysis,
      showFullSchematic: true,
      showIssueGeometry: false,
      width: 1200,
      height: 650,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "signal")
})
