import type { CircuitJson } from "circuit-json"

export function createSameComponentNetLabelCollisionCircuitJson(options?: {
  pinPitch?: number
  separateSideStub?: boolean
}): CircuitJson {
  const pinPitch = options?.pinPitch ?? 0.12
  const separateSideStub = options?.separateSideStub ?? false

  const bottomPins = [
    { id: "qspi_ss", label: "QSPI_SS", index: -1 },
    { id: "qspi_sd0", label: "QSPI_SD0", index: 0 },
    { id: "qspi_sclk", label: "QSPI_SCLK", index: 1 },
  ]

  const stubY = separateSideStub ? 0.5 : 0.28

  return [
    {
      type: "source_component",
      source_component_id: "source_component_u1",
      ftype: "simple_chip",
      name: "U1",
    },
    ...bottomPins.map((pin, idx) => ({
      type: "source_port" as const,
      source_port_id: `source_port_${pin.id}`,
      source_component_id: "source_component_u1",
      name: pin.label,
      pin_number: idx + 1,
      port_hints: [pin.label],
    })),
    {
      type: "source_port",
      source_port_id: "source_port_usb_dp_a",
      source_component_id: "source_component_u1",
      name: "DP_A",
      pin_number: 4,
      port_hints: ["DP_A"],
    },
    {
      type: "source_port",
      source_port_id: "source_port_usb_dm_a",
      source_component_id: "source_component_u1",
      name: "DM_A",
      pin_number: 5,
      port_hints: ["DM_A"],
    },
    {
      type: "schematic_sheet",
      schematic_sheet_id: "schematic_sheet_0",
      name: "main",
    },
    {
      type: "schematic_component",
      schematic_component_id: "schematic_component_u1",
      source_component_id: "source_component_u1",
      center: { x: 0, y: 0 },
      size: { width: 2.6, height: 2.2 },
      is_box_with_pins: true,
      schematic_sheet_id: "schematic_sheet_0",
    },
    ...bottomPins.map((pin, idx) => {
      const x = Number((pin.index * pinPitch).toFixed(4))
      return {
        type: "schematic_port" as const,
        schematic_port_id: `schematic_port_${pin.id}`,
        schematic_component_id: "schematic_component_u1",
        source_port_id: `source_port_${pin.id}`,
        center: { x, y: -1.5 },
        facing_direction: "down" as const,
        side_of_component: "bottom" as const,
        distance_from_component_edge: 0.4,
        pin_number: idx + 1,
        display_pin_label: `P${idx + 1}`,
        is_connected: true,
        schematic_sheet_id: "schematic_sheet_0",
      }
    }),
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_usb_dp_a",
      schematic_component_id: "schematic_component_u1",
      source_port_id: "source_port_usb_dp_a",
      center: { x: 1.7, y: 0.15 },
      facing_direction: "right",
      side_of_component: "right",
      distance_from_component_edge: 0.4,
      pin_number: 4,
      display_pin_label: "DP",
      is_connected: true,
      schematic_sheet_id: "schematic_sheet_0",
    },
    {
      type: "schematic_port",
      schematic_port_id: "schematic_port_usb_dm_a",
      schematic_component_id: "schematic_component_u1",
      source_port_id: "source_port_usb_dm_a",
      center: { x: 1.7, y: 0.5 },
      facing_direction: "right",
      side_of_component: "right",
      distance_from_component_edge: 0.4,
      pin_number: 5,
      display_pin_label: "DM",
      is_connected: true,
      schematic_sheet_id: "schematic_sheet_0",
    },
    {
      type: "schematic_trace",
      schematic_trace_id: "schematic_trace_dm_stub",
      edges: [
        { from: { x: 1.7, y: 0.5 }, to: { x: 2.1, y: 0.5 } },
        { from: { x: 2.1, y: 0.5 }, to: { x: 2.1, y: stubY } },
      ],
      junctions: [],
      schematic_sheet_id: "schematic_sheet_0",
    },
    ...bottomPins.map((pin) => {
      const x = Number((pin.index * pinPitch).toFixed(4))
      return {
        type: "schematic_net_label" as const,
        schematic_net_label_id: `schematic_net_label_${pin.id}`,
        source_net_id: `source_net_${pin.id}`,
        text: pin.label,
        anchor_position: { x, y: -1.5 },
        center: { x, y: -2.05 },
        anchor_side: "top" as const,
        schematic_sheet_id: "schematic_sheet_0",
      }
    }),
    {
      type: "schematic_net_label",
      schematic_net_label_id: "schematic_net_label_usb_dp",
      source_net_id: "source_net_usb_dp_a",
      text: "USB_DP_A",
      anchor_position: { x: 1.7, y: 0.15 },
      center: { x: 2.25, y: 0.15 },
      anchor_side: "left",
      schematic_sheet_id: "schematic_sheet_0",
    },
    {
      type: "schematic_net_label",
      schematic_net_label_id: "schematic_net_label_usb_dm",
      source_net_id: "source_net_usb_dm_a",
      text: "USB_DM_A",
      anchor_position: { x: 2.1, y: stubY },
      center: { x: 2.65, y: stubY },
      anchor_side: "left",
      schematic_sheet_id: "schematic_sheet_0",
    },
  ]
}
