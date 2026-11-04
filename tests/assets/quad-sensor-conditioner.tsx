// Published board: https://tscircuit.com/hrithik18k/quad-sensor-conditioner?version=1.0.1
// Release: efcdcc7a-4514-48c6-8ef8-ea0d8bbb0975. Original symbols, pin layout and placements.
import { Circuit } from "@tscircuit/core"
import React from "react"

// MCP6004-I/P, Microchip DS20001733L. Four unity-gain sensor buffers.
export default function QuadSensorConditioner({
  after = false,
}: {
  after?: boolean
}) {
  const nets: Record<string, string[]> = {
    V5: ["J1.pin1", "U1.VDD", "C1.pin1", "C2.pin1", "R1.pin1"],
    GND: ["J1.pin2", "U1.VSS", "C1.pin2", "C2.pin2", "LED1.cathode"],
    POWER_LED: ["R1.pin2", "LED1.anode"],
  }
  const channels = [
    { n: 1, side: -1, y: 12, plus: "A_PLUS", minus: "A_MINUS", out: "A_OUT" },
    { n: 2, side: -1, y: -12, plus: "B_PLUS", minus: "B_MINUS", out: "B_OUT" },
    { n: 3, side: 1, y: -12, plus: "C_PLUS", minus: "C_MINUS", out: "C_OUT" },
    { n: 4, side: 1, y: 12, plus: "D_PLUS", minus: "D_MINUS", out: "D_OUT" },
  ]
  for (const { n, plus, minus, out } of channels) {
    nets.V5!.push(`JI${n}.pin1`)
    nets.GND!.push(
      `JI${n}.pin3`,
      `JO${n}.pin2`,
      `C1${n}.pin2`,
      `C3${n}.pin2`,
      `JP${n}.pin2`,
    )
    nets[`IN${n}`] = [`JI${n}.pin2`, `R1${n}.pin1`]
    nets[`FILTER${n}`] = [
      `R1${n}.pin2`,
      `C1${n}.pin1`,
      `C2${n}.pin1`,
      `U1.${plus}`,
    ]
    nets[`SLOW${n}`] = [`C2${n}.pin2`, `JP${n}.pin1`]
    nets[`BUFFER${n}`] = [`U1.${out}`, `U1.${minus}`, `R2${n}.pin1`]
    nets[`OUT${n}`] = [`R2${n}.pin2`, `C3${n}.pin1`, `JO${n}.pin1`]
  }
  return (
    <board
      width="80mm"
      height="64mm"
      layers={2}
      borderRadius="3mm"
      title="QUAD SENSE / MCP6004"
      autorouter="auto_local"
      autorouterVersion="beta_pipeline7"
    >
      <schematicsection name="Power" displayName="5 V power" />
      <schematicsection
        name="Buffer"
        displayName="MCP6004 unity-gain buffers"
      />
      <chip
        name="U1"
        manufacturerPartNumber="MCP6004-I/P"
        footprint="dip14_w7.62mm"
        pcbX={0}
        pcbY={0}
        schX={0}
        schY={0}
        schSectionName="Buffer"
        pinAttributes={{
          VDD: { requiresPower: true },
          VSS: { requiresGround: true },
        }}
        pinLabels={{
          pin1: "A_OUT",
          pin2: "A_MINUS",
          pin3: "A_PLUS",
          pin4: "VDD",
          pin5: "B_PLUS",
          pin6: "B_MINUS",
          pin7: "B_OUT",
          pin8: "C_OUT",
          pin9: "C_MINUS",
          pin10: "C_PLUS",
          pin11: "VSS",
          pin12: "D_PLUS",
          pin13: "D_MINUS",
          pin14: "D_OUT",
        }}
        schPinArrangement={{
          leftSide: {
            pins: ["A_PLUS", "A_MINUS", "B_PLUS", "B_MINUS"],
            direction: "top-to-bottom",
          },
          rightSide: {
            pins: ["A_OUT", "B_OUT", "C_OUT", "D_OUT"],
            direction: "top-to-bottom",
          },
          topSide: {
            pins: ["VDD", "D_PLUS", "D_MINUS"],
            direction: "left-to-right",
          },
          bottomSide: {
            pins: ["VSS", "C_PLUS", "C_MINUS"],
            direction: "left-to-right",
          },
        }}
      />
      <pinheader
        name="J1"
        pinCount={2}
        footprint="pinrow2"
        pcbX={-10}
        pcbY={-26}
        schX={-8}
        schY={-18}
        schSectionName="Power"
        pinLabels={["5V", "GND"]}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0805"
        pcbX={-7}
        pcbY={0}
        pcbRotation={180}
        schX={-4}
        schY={-18}
        schRotation={-90}
        schSectionName="Power"
      />
      <capacitor
        name="C2"
        capacitance="10uF"
        footprint="1206"
        pcbX={-9}
        pcbY={-4}
        schX={-2.5}
        schY={-18}
        schRotation={-90}
        schSectionName="Power"
      />
      <resistor
        name="R1"
        resistance="3.3k"
        footprint="0805"
        pcbX={4}
        pcbY={-25}
        schX={1}
        schY={-18}
        schRotation={-90}
        schSectionName="Power"
      />
      <led
        name="LED1"
        color="green"
        footprint="0805"
        pcbX={10}
        pcbY={-25}
        schX={1}
        schY={-21}
        schRotation={-90}
        schSectionName="Power"
      />
      {channels.map(({ n, side, y }) => {
        const sx = side * 20,
          sy = y > 0 ? 10 : -7
        return (
          <React.Fragment key={n}>
            <schematicsection
              name={`CH${n}`}
              displayName={`Channel ${n} / 159 Hz or 14.5 Hz`}
            />
            <pinheader
              name={`JI${n}`}
              pinCount={3}
              footprint="pinrow3"
              pcbX={side * 33}
              pcbY={y + 5}
              pcbRotation={90}
              schX={sx - 2.7}
              schY={sy + 1.5}
              schSectionName={`CH${n}`}
              pinLabels={["5V", "IN", "GND"]}
            />
            <resistor
              name={`R1${n}`}
              resistance="10k"
              footprint="0805"
              pcbX={side * 25}
              pcbY={y + 5}
              pcbRotation={side > 0 ? 180 : 0}
              schX={sx - 0.45}
              schY={sy + 1.5}
              schSectionName={`CH${n}`}
            />
            <capacitor
              name={`C1${n}`}
              capacitance="100nF"
              footprint="0805"
              pcbX={side * 17}
              pcbY={y + 5}
              schX={sx + 1.8}
              schY={sy + 1.5}
              schRotation={after ? -90 : 90}
              schSectionName={`CH${n}`}
            />
            <capacitor
              name={`C2${n}`}
              capacitance="1uF"
              footprint="0805"
              pcbX={side * 17}
              pcbY={y}
              schX={after ? sx + 4.5 : sx - 0.45}
              schY={after ? sy - 1.4 : sy - 1.5}
              schRotation={after ? 180 : 90}
              schSectionName={`CH${n}`}
            />
            <pinheader
              name={`JP${n}`}
              pinCount={2}
              footprint="pinrow2"
              pcbX={side * 25}
              pcbY={y}
              schX={sx + 1.8}
              schY={sy - 1.5}
              schSectionName={`CH${n}`}
              pinLabels={["SLOW", "GND"]}
            />
            <resistor
              name={`R2${n}`}
              resistance="100"
              footprint="0805"
              pcbX={side * 12}
              pcbY={y - 5}
              pcbRotation={side < 0 ? 180 : 0}
              schX={sx - 2.7}
              schY={sy - 4.5}
              schSectionName={`CH${n}`}
            />
            <capacitor
              name={`C3${n}`}
              capacitance="10nF"
              footprint="0805"
              pcbX={side * 20}
              pcbY={y - 5}
              pcbRotation={side < 0 ? 180 : 0}
              schX={sx - 0.45}
              schY={sy - 4.5 - (after && n === 1 ? 0.8 : 0)}
              schRotation={after ? -90 : 90}
              schSectionName={`CH${n}`}
            />
            <pinheader
              name={`JO${n}`}
              pinCount={2}
              footprint="pinrow2"
              pcbX={side * 33}
              pcbY={y - 5}
              pcbRotation={90}
              schX={sx + 1.8}
              schY={sy - 4.5}
              schSectionName={`CH${n}`}
              pinLabels={["OUT", "GND"]}
            />
            <silkscreentext
              text={`CH${n} / IN`}
              pcbX={side * 29}
              pcbY={y + 10}
              fontSize={1}
            />
            <silkscreentext
              text="SLOW"
              pcbX={side * 25}
              pcbY={y - 2.5}
              fontSize={0.7}
            />
            <silkscreentext
              text="OUT"
              pcbX={side * 33}
              pcbY={y - 9}
              fontSize={0.8}
            />
          </React.Fragment>
        )
      })}
      {Object.entries(nets).flatMap(([name, pins]) =>
        pins.map((pin) => (
          <trace
            key={`${name}-${pin}`}
            name={`${name}_${pin.replace(".", "_")}`}
            from={pin}
            to={`net.${name}`}
          />
        )),
      )}
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((y) => (
          <hole
            name={`H${x > 0 ? 1 : 2}${y > 0 ? 1 : 2}`}
            diameter="3.2mm"
            pcbX={x * 35}
            pcbY={y * 27}
          />
        )),
      )}
      <silkscreentext text="QUAD SENSE" pcbX={0} pcbY={27} fontSize={2} />
      <silkscreentext
        text="4-CHANNEL ANALOG CONDITIONER"
        pcbX={0}
        pcbY={23}
        fontSize={0.9}
      />
      <silkscreentext
        text="REGULATED 5V / REV A"
        pcbX={0}
        pcbY={-30}
        fontSize={0.9}
      />
    </board>
  )
}

export async function createQuadSensorConditioner(after = false) {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(<QuadSensorConditioner after={after} />)
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
