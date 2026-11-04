export const BQ24610 = (props: {
  name: string
  pcbX?: number
  pcbY?: number
  schX?: number
  schY?: number
  schSectionName?: string
}) => (
  <chip
    {...props}
    manufacturerPartNumber="BQ24610RGER"
    footprint="qfn24_w4.6_h4.6_p0.5mm_pl0.6mm_pw0.25mm_thermalpad2.45mmx2.45mm"
    pinLabels={{
      pin1: "ACN",
      pin2: "ACP",
      pin3: "ACDRV",
      pin4: "CE",
      pin5: "STAT1",
      pin6: "TS",
      pin7: "TTC",
      pin8: "PG",
      pin9: "STAT2",
      pin10: "VREF",
      pin11: "ISET1",
      pin12: "VFB",
      pin13: "SRN",
      pin14: "SRP",
      pin15: "ISET2",
      pin16: "ACSET",
      pin17: "GND",
      pin18: "REGN",
      pin19: "LODRV",
      pin20: "PH",
      pin21: "HIDRV",
      pin22: "BTST",
      pin23: "BATDRV",
      pin24: "VCC",
      pin25: "EP",
    }}
    pinAttributes={{
      VCC: { requiresPower: true },
      GND: { requiresGround: true },
    }}
    schPinArrangement={{
      leftSide: {
        direction: "top-to-bottom",
        pins: [
          "VCC",
          "ACP",
          "ACN",
          "ACSET",
          "CE",
          "ISET1",
          "ISET2",
          "TS",
          "TTC",
          "VREF",
        ],
      },
      rightSide: {
        direction: "top-to-bottom",
        pins: [
          "BTST",
          "HIDRV",
          "PH",
          "LODRV",
          "REGN",
          "SRP",
          "SRN",
          "VFB",
          "STAT1",
          "STAT2",
          "PG",
          "GND",
          "EP",
        ],
      },
    }}
    noConnect={["ACDRV", "BATDRV"]}
  />
)
