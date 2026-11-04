// Published source: https://tscircuit.com/huntiep/radio?version=0.0.1#schematic
// Release c1a68c9c-fa52-4c63-ada9-393c1163e655, index.tsx.
// Complete five-component input-protection block: original coordinates, symbols,
// values and retained pin connections. External input/output ends are named rails.
import { Circuit } from "@tscircuit/core"
const Fuse2410 = (
  <footprint>
    <smtpad
      portHints={["pin1"]}
      shape="rect"
      pcbX={-2.8}
      pcbY={0}
      width={2}
      height={3}
    />
    <smtpad
      portHints={["pin2"]}
      shape="rect"
      pcbX={2.8}
      pcbY={0}
      width={2}
      height={3}
    />
  </footprint>
)
const DPAK = (
  <footprint>
    <smtpad
      portHints={["pin3"]}
      shape="rect"
      pcbX={-3.42}
      pcbY={2.29}
      width={3}
      height={1.6}
    />
    <smtpad
      portHints={["pin2"]}
      shape="rect"
      pcbX={-3.42}
      pcbY={-2.29}
      width={3}
      height={1.6}
    />
    <smtpad
      portHints={["pin1"]}
      shape="rect"
      pcbX={3.42}
      pcbY={0}
      width={6.2}
      height={5.8}
    />
  </footprint>
)
export async function createRadioFuseMosfet(after = false) {
  const c = new Circuit()
  c.pcbDisabled = true
  c.add(
    <board
      schLayout={{ layoutMode: "none" }}
      schMaxTraceDistance={after ? 4 : 100}
      schTraceAutoLabelEnabled
    >
      <net name="GND" isGroundNet />
      <net name="VIN_RAW" isPowerNet />
      <net name="VIN_FUSED" isPowerNet />
      <net name="VBAT_PROT" isPowerNet />
      <fuse
        name="F1"
        manufacturerPartNumber="0451004.MRL"
        currentRating="4A"
        voltageRating="32V"
        footprint={Fuse2410}
        schX={-13}
        schY={after ? 5.26 : 5}
      />
      <mosfet
        name="Q1"
        channelType="p"
        mosfetMode="enhancement"
        footprint={DPAK}
        manufacturerPartNumber="IPD50P04P4L-11"
        schX={-10}
        schY={5}
        symbolDrainSide={after ? "left" : undefined}
        symbolSourceSide={after ? "right" : undefined}
        symbolGateSide={after ? "bottom" : undefined}
      />
      <resistor
        name="R1"
        supplierPartNumbers={{ jlcpcb: ["C17414", "C49196820", "C7468432"] }}
        resistance="10k"
        footprint="0805"
        schX={after ? -8 : -9}
        schY={after ? 2 : 3}
        schRotation={after ? -90 : 0}
      />
      <diode
        name="D2"
        supplierPartNumbers={{ jlcpcb: [] }}
        zener
        manufacturerPartNumber="MMSZ5242B"
        footprint="sod123"
        schX={after ? -8 : -11}
        schY={after ? 3.7 : 3}
        schRotation={after ? 90 : 0}
      />
      <diode
        name="D1"
        supplierPartNumbers={{ jlcpcb: [] }}
        tvs
        manufacturerPartNumber="SMCJ18A"
        footprint="smc"
        schX={after ? -6 : -8}
        schY={after ? 3.7 : 3}
        schRotation={after ? 90 : 0}
      />
      <trace from="F1.pin1" to="net.VIN_RAW" />
      <trace from="F1.pin2" to="net.VIN_FUSED" />
      <trace from="Q1.drain" to="net.VIN_FUSED" />
      <trace from="Q1.source" to="net.VBAT_PROT" />
      <trace from="Q1.gate" to="R1.pin1" />
      <trace from="R1.pin2" to="net.GND" />
      <trace from="D2.cathode" to="net.VBAT_PROT" />
      <trace from="D2.anode" to="Q1.gate" />
      <trace from="D1.cathode" to="net.VBAT_PROT" />
      <trace from="D1.anode" to="net.GND" />
      {after && (
        <>
          <netlabel
            net="GND"
            connectsTo="R1.pin2"
            schX={-8}
            schY={1.3}
            anchorSide="top"
          />
          <netlabel
            net="GND"
            connectsTo="D1.anode"
            schX={-6}
            schY={2.9}
            anchorSide="top"
          />
        </>
      )}
    </board>,
  )
  await c.renderUntilSettled()
  return c.getCircuitJson()
}
