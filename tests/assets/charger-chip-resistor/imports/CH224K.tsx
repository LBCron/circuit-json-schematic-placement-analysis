import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VDD"],
  pin2: ["CFG2"],
  pin3: ["CFG3"],
  pin4: ["DP"],
  pin5: ["DM"],
  pin6: ["CC2"],
  pin7: ["CC1"],
  pin8: ["VBUS"],
  pin9: ["CFG1"],
  pin10: ["PG"],
  pin11: ["GND"],
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin8: { requiresPower: true },
  pin11: { requiresGround: true },
} as const

const footprinterPinLabels = {
  ...pinLabels,
  pin11: [...pinLabels["pin11"], "thermalpad"],
} as const

export const CH224K = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={footprinterPinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C970725"],
      }}
      manufacturerPartNumber="CH224K"
      footprint="dfn10_thermalpad2.1mmx3.3mm_p1mm_w7.5mm_pl1.5mm_pin1location(leftside,bottom)"
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C970725.obj?uuid=c37139ac11be40009679f32869d9459d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C970725.step?uuid=c37139ac11be40009679f32869d9459d",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000063500000123895, y: 0, z: -0.81 },
      }}
      {...props}
    />
  )
}
