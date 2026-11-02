import type { ResistorProps } from "@tscircuit/props"

const resistorParts = {
  "100": ["0603WAF1000T5E", "C22775"],
  "220": ["0603WAF2200T5E", "C22962"],
  "1k": ["0603WAF1001T5E", "C21190"],
  "10k": ["RT0603BRD0710KL", "C95204"],
  "1.8k": ["RC0603FR-071K8L", "C185354"],
  "4.7k": ["0603WAF4701T5E", "C23162"],
  "5.1k": ["0603WAF5101T5E", "C23186"],
  "30k": ["0603WAF3002T5E", "C22984"],
  "100k": ["0603WAF1003T5E", "C25803"],
} as const

export function R(
  props: Omit<ResistorProps, "resistance" | "footprint"> & {
    resistance: keyof typeof resistorParts
  },
) {
  const [manufacturerPartNumber, lcsc] = resistorParts[props.resistance]
  return (
    <resistor
      {...props}
      pcbStyle={{ silkscreenTextVisibility: "hidden", ...props.pcbStyle }}
      footprint="0603_nosilkscreen"
      manufacturerPartNumber={manufacturerPartNumber}
      supplierPartNumbers={{ jlcpcb: [lcsc] }}
    />
  )
}
