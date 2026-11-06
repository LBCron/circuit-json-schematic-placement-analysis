export interface ChipPinTestPointNotAligned {
  lineItemType: "ChipPinTestPointNotAligned"
  chipSchematicBox: SchematicBoxPlacement
  testPointSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  testPointSourcePortId: string
  message: string
}

export interface CapacitorConnectorNotAligned {
  lineItemType: "CapacitorConnectorNotAligned"
  connectorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  connectorSourcePortId: string
  capacitorSourcePortId: string
  message: string
}

export interface InductorDiodeNotGrouped {
  lineItemType: "InductorDiodeNotGrouped"
  hostSchematicBox: SchematicBoxPlacement
  inductorSchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  inductorSourcePortId: string
  diodeSourcePortId: string
  message: string
}

export interface ResistorDividerSeparatedFromChip {
  lineItemType: "ResistorDividerSeparatedFromChip"
  hostSchematicBox: SchematicBoxPlacement
  supplyResistorSchematicBox: SchematicBoxPlacement
  groundResistorSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  supplyTapSourcePortId: string
  groundTapSourcePortId: string
  message: string
}

export interface ConnectorTestPointNotAligned {
  lineItemType: "ConnectorTestPointNotAligned"
  connectorSchematicBox: SchematicBoxPlacement
  testPointSchematicBox: SchematicBoxPlacement
  connectorSourcePortId: string
  testPointSourcePortId: string
  message: string
}

export interface InductorCapacitorNotGrouped {
  lineItemType: "InductorCapacitorNotGrouped"
  inductorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  inductorSourcePortId: string
  capacitorSourcePortId: string
  message: string
}

export interface ResistorTestPointNotAligned {
  lineItemType: "ResistorTestPointNotAligned"
  resistorSchematicBox: SchematicBoxPlacement
  testPointSchematicBox: SchematicBoxPlacement
  resistorSourcePortId: string
  testPointSourcePortId: string
  message: string
}

export interface ResistorConnectorNotAligned {
  lineItemType: "ResistorConnectorNotAligned"
  resistorSchematicBox: SchematicBoxPlacement
  connectorSchematicBox: SchematicBoxPlacement
  resistorSourcePortId: string
  connectorSourcePortId: string
  message: string
}

export interface FuseConnectorNotAligned {
  lineItemType: "FuseConnectorNotAligned"
  fuseSchematicBox: SchematicBoxPlacement
  connectorSchematicBox: SchematicBoxPlacement
  fuseSourcePortId: string
  connectorSourcePortId: string
  message: string
}

export interface TransistorLedNotAligned {
  lineItemType: "TransistorLedNotAligned"
  transistorSchematicBox: SchematicBoxPlacement
  ledSchematicBox: SchematicBoxPlacement
  transistorSourcePortId: string
  ledSourcePortId: string
  message: string
}

export interface TransistorResistorNotAligned {
  lineItemType: "TransistorResistorNotAligned"
  transistorSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  transistorSourcePortId: string
  resistorSourcePortId: string
  message: string
}

export interface PotentiometerHasIncorrectRailOrientation {
  lineItemType: "PotentiometerHasIncorrectRailOrientation"
  schematicBox: SchematicBoxPlacement
  supplySourcePortId: string
  groundSourcePortId: string
  deltaSchRotation: 90 | 180 | 270
  message: string
}

export interface CapacitorSeparatedFromResistorDivider {
  lineItemType: "CapacitorSeparatedFromResistorDivider"
  capacitorSchematicBox: SchematicBoxPlacement
  resistorSchematicBoxes: SchematicBoxPlacement[]
  capacitorSourcePortId: string
  resistorSourcePortIds: string[]
  signalPinDistance: number
  maxRecommendedSignalPinDistance: number
  message: string
}

export interface SeriesResistorsNotAligned {
  lineItemType: "SeriesResistorsNotAligned"
  firstResistorSchematicBox: SchematicBoxPlacement
  secondResistorSchematicBox: SchematicBoxPlacement
  firstSourcePortId: string
  secondSourcePortId: string
  message: string
}

export interface FuseMosfetNotAligned {
  lineItemType: "FuseMosfetNotAligned"
  fuseSchematicBox: SchematicBoxPlacement
  mosfetSchematicBox: SchematicBoxPlacement
  fuseSourcePortId: string
  mosfetSourcePortId: string
  pinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

export interface LedResistorBranchSeparatedFromChipPin {
  lineItemType: "LedResistorBranchSeparatedFromChipPin"
  hostSchematicBox: SchematicBoxPlacement
  ledSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  maxRecommendedPinDistance: number
  message: string
}

export interface ChipDiodeCapacitorNetworkNotGrouped {
  lineItemType: "ChipDiodeCapacitorNetworkNotGrouped"
  hostSchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  chipSourcePortIds: [string, string, string]
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

export interface FuseDiodeNotAligned {
  lineItemType: "FuseDiodeNotAligned"
  fuseSchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  fuseSourcePortId: string
  diodeSourcePortId: string
  message: string
}

export interface InductorSeparatedFromChipPins {
  lineItemType: "InductorSeparatedFromChipPins"
  hostSchematicBox: SchematicBoxPlacement
  inductorSchematicBox: SchematicBoxPlacement
  chipSourcePortIds: [string, string]
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

export interface SchematicBoxPlacement {
  positionAnchor: "center"
  schX: number
  schY: number
  width: number
  height: number
  schematicSheetId?: string
  schematicSheetName?: string
  sourceComponentId?: string
  sourceComponentName?: string
  schematicComponentId?: string
  schematicSymbolId?: string
  subcircuitId?: string
}

export interface SchematicBoxPlacementLineItem extends SchematicBoxPlacement {
  lineItemType: "SchematicBoxPlacement"
}

export interface ComponentOverlap {
  lineItemType: "ComponentOverlap"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  overlapWidth: number
  overlapHeight: number
  correctionSuggestions: OverlapCorrectionSuggestion[]
}

export interface OverlapCorrectionSuggestion {
  targetComponentName?: string
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
}

export interface SchematicBoxHasALotOfSurroundingWhitespace {
  lineItemType: "SchematicBoxHasALotOfSurroundingWhitespace"
  schematicBox: SchematicBoxPlacement
  whitespaceLeft: number
  whitespaceRight: number
  whitespaceTop: number
  whitespaceBottom: number
}

export interface CapacitorSymbolHorizontal {
  lineItemType: "CapacitorSymbolHorizontal"
  schematicBox: SchematicBoxPlacement
  message: string
}

/** A power-to-ground capacitor bank is spread out within one schematic block. */
export interface DecouplingCapacitorsNotCloseTogether {
  lineItemType: "DecouplingCapacitorsNotCloseTogether"
  railName: string
  groundName: string
  /** All capacitors in this bank, sharing supply, return, and schematic scope. */
  capacitorSchematicBoxes: SchematicBoxPlacement[]
  /** Largest body gap required to connect the bank through neighboring capacitors. */
  maxBodyGap: number
  maxRecommendedBodyGap: number
  message: string
}

export interface VerboseSchematicNetLabel {
  lineItemType: "VerboseSchematicNetLabel"
  schematicNetLabelId?: string
  sourceNetId?: string
  schematicSheetId?: string
  schematicSheetName?: string
  text: string
  involvedPins: string[]
  schX: number
  schY: number
  message: string
}

interface BaseSchematicBoxTooWide {
  schematicBox: SchematicBoxPlacement
  measuredInnerLabelHorizontalEmptySpace: number
  maxAllowedInnerLabelHorizontalEmptySpace: number
  suggestedSchWidth: number
  message: string
}

export interface PinHeaderSchematicBoxTooWide extends BaseSchematicBoxTooWide {
  lineItemType: "PinHeaderSchematicBoxTooWide"
}

export interface GenericSchematicBoxTooWide extends BaseSchematicBoxTooWide {
  lineItemType: "GenericSchematicBoxTooWide"
}

export type SchematicBoxTooWideIssue =
  | PinHeaderSchematicBoxTooWide
  | GenericSchematicBoxTooWide

export interface SchematicBoxInnerLabelCollision {
  lineItemType: "SchematicBoxInnerLabelCollision"
  schematicBox: SchematicBoxPlacement
  overlappingSides: SchematicSide[]
  /** Required clearance between different-side pin labels, in schematic units. */
  minimumLabelGap: number
  /** Exact reported pairs, with displayed text and bounds for highlighting.
   * Optional for previously serialized reports. */
  labelPairs?: SchematicPinLabelCollisionPair[]
  /** Apply the suggested dimensions together, keeping pins along their edges. */
  suggestedSchWidth?: number
  suggestedSchHeight?: number
  message: string
}

/** Inner pin-label text crosses the boundary of its own schematic box. */
export interface SchematicBoxInnerLabelOutOfBounds {
  lineItemType: "SchematicBoxInnerLabelOutOfBounds"
  schematicBox: SchematicBoxPlacement
  overflowingLabels: Array<
    SchematicPinLabelBounds & { outsideEdges: SchematicSide[] }
  >
  /** Apply together at the same center, preserving pin positions along each edge. */
  suggestedSchWidth?: number
  suggestedSchHeight?: number
  message: string
}

export interface SchematicPinLabelCollisionPair {
  firstLabel: SchematicPinLabelBounds
  secondLabel: SchematicPinLabelBounds
  /** Largest separating-axis gap; zero when the label bounds overlap. */
  measuredGap: number
  kind: "overlap" | "clearance"
}

export interface SchematicPinLabelBounds {
  schematicPortId: string
  text: string
  side: SchematicSide
  bounds: SchematicIssueBounds
}

export type SchematicSide = "left" | "right" | "top" | "bottom"

export type SchematicPortFacingDirection = "left" | "right" | "up" | "down"

export interface SchematicPinPaddingToEdgeTooLarge {
  lineItemType: "SchematicPinPaddingToEdgeTooLarge"
  pinSide: SchematicSide
  edgeSide: SchematicSide
  pinName?: string
  schematicBox: SchematicBoxPlacement
  measuredPadding: number
  maxAllowedPadding: number
  excessPadding: number
  /** All excessive gaps for this box; scalar gap fields identify the worst gap. */
  paddingDetails?: Array<{
    pinSide: SchematicSide
    edgeSide: SchematicSide
    pinName?: string
    measuredPadding: number
    maxAllowedPadding: number
    excessPadding: number
  }>
  suggestedSchWidth?: number
  suggestedSchHeight?: number
  message: string
}

export interface DiodeResistorNotAligned {
  lineItemType: "DiodeResistorNotAligned"
  diodeSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  diodePin?: string
  resistorPin?: string
  diodePinFacingDirection?: string
  resistorPinFacingDirection?: string
  message: string
}

/** A separated series capacitor and its grounded shunt resistor. */
export interface HighPassRcFilterComponentsNotGrouped {
  lineItemType: "HighPassRcFilterComponentsNotGrouped"
  resistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  resistorSourcePortId: string
  capacitorSourcePortId: string
  signalPinDistance: number
  maxRecommendedSignalPinDistance: number
  message: string
}

/** A separated series signal resistor and its grounded shunt capacitor. */
export interface SeriesRcFilterComponentsNotGrouped {
  lineItemType: "SeriesRcFilterComponentsNotGrouped"
  resistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  resistorSourcePortId: string
  capacitorSourcePortId: string
  signalPinDistance: number
  maxRecommendedSignalPinDistance: number
  message: string
}

/** A unique grounded resistor/capacitor pair drawn with nonmatching branch ends. */
export interface ParallelRcNotAligned {
  lineItemType: "ParallelRcNotAligned"
  resistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  reason: "different_axes" | "crossed_connections" | "staggered"
  message: string
}

/** Readability advisory for a local diode/resistor pair across the same two nets. */
export interface ParallelDiodeResistorNotAligned {
  lineItemType: "ParallelDiodeResistorNotAligned"
  diodeSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  reason: "different_axes" | "crossed_connections" | "staggered"
  message: string
}

/** Two local diodes share the same nets at opposite drawing ends. */
export interface ParallelDiodesNotAligned {
  lineItemType: "ParallelDiodesNotAligned"
  firstDiodeSchematicBox: SchematicBoxPlacement
  secondDiodeSchematicBox: SchematicBoxPlacement
  message: string
}

/** A private series RC branch is separated beside its parallel capacitor. */
export interface SeriesRcBranchNotGrouped {
  lineItemType: "SeriesRcBranchNotGrouped"
  resistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  parallelCapacitorSchematicBox: SchematicBoxPlacement
  resistorSourcePortId: string
  capacitorSourcePortId: string
  sharedPinDistance: number
  maxRecommendedSharedPinDistance: number
  message: string
}

/** A local diode/capacitor pair has nonmatching parallel branch ends. */
export interface ParallelDiodeCapacitorNotAligned {
  lineItemType: "ParallelDiodeCapacitorNotAligned"
  diodeSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  reason: "different_axes" | "crossed_connections" | "staggered"
  message: string
}

/** A local grounded switch/capacitor network or its pull resistor is spread out. */
export interface SwitchRcNetworkNotGrouped {
  lineItemType: "SwitchRcNetworkNotGrouped"
  switchSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  resistorSchematicBox?: SchematicBoxPlacement
  switchCapacitorBodyGap: number
  maxRecommendedSwitchCapacitorBodyGap: number
  resistorBodyGap?: number
  maxRecommendedResistorBodyGap?: number
  message: string
}

/** Two resistors across the same nets are drawn end-to-end instead of as branches. */
export interface ParallelResistorsDrawnInline {
  lineItemType: "ParallelResistorsDrawnInline"
  firstResistorSchematicBox: SchematicBoxPlacement
  secondResistorSchematicBox: SchematicBoxPlacement
  message: string
}

/** A crystal's series resistor is separated from its local signal branch. */
export interface ResistorSeparatedFromCrystal {
  lineItemType: "ResistorSeparatedFromCrystal"
  crystalSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  pinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** Two capacitors across the same nets are drawn end-to-end instead of as branches. */
export interface ParallelCapacitorsDrawnInline {
  lineItemType: "ParallelCapacitorsDrawnInline"
  firstCapacitorSchematicBox: SchematicBoxPlacement
  secondCapacitorSchematicBox: SchematicBoxPlacement
  message: string
}

export interface ComponentPinsWouldAlignWithVerticalShift {
  lineItemType: "ComponentPinsWouldAlignWithVerticalShift"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  targetComponent: SchematicBoxPlacement
  deltaSchY: number
  newSchY: number
  currentlyAlignedPinCount: number
  alignedPinCount: number
  alignedPinPairs: Array<{
    firstPin?: string
    secondPin?: string
  }>
  message: string
}

export interface TraceCanBeSimplifiedByMovingComponent {
  lineItemType: "TraceCanBeSimplifiedByMovingComponent"
  schematicTraceId: string
  traceName?: string
  targetComponent: SchematicBoxPlacement
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
  currentTurnCount: number
  suggestedTurnCount: number
  /** Collision-checked calculate-elbow routes after applying this move. */
  suggestedTraces?: Array<{
    schematicTraceId: string
    points: Array<{ x: number; y: number }>
  }>
  message: string
}

export interface CrystalNotCenteredOverLoadCapacitors {
  lineItemType: "CrystalNotCenteredOverLoadCapacitors"
  crystalSchematicBox: SchematicBoxPlacement
  firstLoadCapacitorSchematicBox: SchematicBoxPlacement
  secondLoadCapacitorSchematicBox: SchematicBoxPlacement
  deltaSchX: number
  deltaSchY: number
  newSchX: number
  newSchY: number
  message: string
}

export interface TwoPinComponentCouldBeFlipped {
  lineItemType: "TwoPinComponentCouldBeFlipped"
  schematicTraceId: string
  traceName?: string
  targetComponent: SchematicBoxPlacement
  connectedComponent: SchematicBoxPlacement
  targetPin?: string
  currentFacingDirection: SchematicPortFacingDirection
  suggestedFacingDirection: SchematicPortFacingDirection
  deltaSchRotation: 180
  currentTurnCount: number
  suggestedTurnCount: number
  message: string
}

/** Advisory: a direct negative-feedback R/C network is far from its amplifier. */
export interface FeedbackNetworkNotCompact {
  lineItemType: "FeedbackNetworkNotCompact"
  amplifierSchematicBox: SchematicBoxPlacement
  feedbackComponents: SchematicBoxPlacement[]
  distantComponents: Array<{
    schematicBox: SchematicBoxPlacement
    bodyGap: number
    maxRecommendedBodyGap: number
  }>
  outputSourcePortId: string
  invertingInputSourcePortId: string
  message: string
}

/** Advisory: an explicitly identified pull resistor is far on the unconventional side. */
export interface PullResistorOnWrongSide {
  lineItemType: "PullResistorOnWrongSide"
  resistorSchematicBox: SchematicBoxPlacement
  hostSchematicBox: SchematicBoxPlacement
  signalSourcePortId: string
  signalPinName: string
  signalSchY: number
  pullDirection: "up" | "down"
  preferredSide: "above" | "below"
  wrongSideGap: number
  maxRecommendedWrongSideGap: number
  message: string
}

interface TwoPinComponentRailOrientation {
  schematicBox: SchematicBoxPlacement
  railSourcePortId: string
  railPinName: string
  railType: "power" | "ground"
  suggestedRailFacingDirection: "up" | "down"
  message: string
}

export interface TwoPinComponentShouldBeVertical
  extends TwoPinComponentRailOrientation {
  lineItemType: "TwoPinComponentShouldBeVertical"
  deltaSchRotation: -90 | 90
}

/** A vertical component has a positive supply below its return, or ground above a signal. */
export interface TwoPinComponentHasInvertedRails
  extends TwoPinComponentRailOrientation {
  lineItemType: "TwoPinComponentHasInvertedRails"
  deltaSchRotation: 180
}

export interface ComponentNetLabelCollision {
  lineItemType: "ComponentNetLabelCollision"
  firstComponent: SchematicBoxPlacement
  secondComponent: SchematicBoxPlacement
  message: string
  overlappingLabel1Bounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  overlappingLabel2Bounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  suggestion?: {
    componentName: string
    newSchX: number
    newSchY: number
  }
}

export interface ComponentBoxNetLabelCollision {
  lineItemType: "ComponentBoxNetLabelCollision"
  boxComponent: SchematicBoxPlacement
  labelComponent: SchematicBoxPlacement
  message: string
  boxBounds: { left: number; right: number; top: number; bottom: number }
  labelBounds: { left: number; right: number; top: number; bottom: number }
  suggestion?: {
    componentName: string
    newSchX: number
    newSchY: number
  }
}

export interface SchematicIssueBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export interface NetLabelCollision {
  lineItemType: "NetLabelCollision"
  schematicSheetId?: string
  schematicSheetName?: string
  /** Actual intersection regions in schematic coordinates (Y up).
   * Optional for compatibility with previously serialized reports. */
  collisionBounds?: SchematicIssueBounds[]
  pairs: Array<{ comp1Name: string; comp2Name: string }>
  moves: Array<{
    componentName: string
    newSchX: number
    newSchY: number
  }>
}

export interface SchematicTextCollisionObject {
  type: "text" | "trace" | "component"
  id: string
  text?: string
  componentName?: string
  schematicComponentId?: string
}

export interface SchematicTextCollision {
  lineItemType: "SchematicTextCollision"
  schematicSheetId?: string
  schematicSheetName?: string
  schematicTextId: string
  text: string
  collidingObject: SchematicTextCollisionObject
  textBounds: { left: number; right: number; top: number; bottom: number }
  collidingObjectBounds: {
    left: number
    right: number
    top: number
    bottom: number
  }
  /** A clear text-anchor position for this issue; reanalyze after applying it. */
  suggestedMove?: { newSchX: number; newSchY: number }
  message: string
}

export interface ResetNetworkNotGrouped {
  lineItemType: "ResetNetworkNotGrouped"
  /** The component whose reset pin is served by this network. */
  hostSchematicBox: SchematicBoxPlacement
  resetSourcePortId: string
  resetPinName: string
  /** Reset pull-up, capacitor, and any associated test points; excludes the host. */
  supportNetworkComponents: SchematicBoxPlacement[]
  maxDistanceFromResetPin: number
  maxRecommendedDistance: number
  message: string
}

export interface ConnectorPositionCausesTraceDetours {
  lineItemType: "ConnectorPositionCausesTraceDetours"
  connectorSchematicBox: SchematicBoxPlacement
  connectedComponents: SchematicBoxPlacement[]
  /** Existing routed signal connections that demonstrate the detours. */
  schematicTraceIds: string[]
  evaluatedSignalCount: number
  newSchX: number
  newSchY: number
  deltaSchX: number
  deltaSchY: number
  /** Sum of Manhattan distances between the evaluated signal pins. */
  currentTotalSignalDistance: number
  /** Sum of Manhattan pin distances after moving; not a promised routed length. */
  suggestedTotalSignalDistance: number
  message: string
}

/** Advisory for a grounded-emitter NPN switch; no automatic move is implied. */
export interface LowSideTransistorNotAlignedWithLoad {
  lineItemType: "LowSideTransistorNotAlignedWithLoad"
  transistorSchematicBox: SchematicBoxPlacement
  loadSchematicBox: SchematicBoxPlacement
  baseResistorSchematicBox: SchematicBoxPlacement
  clampDiodeSchematicBox: SchematicBoxPlacement
  collectorSourcePortId: string
  emitterSourcePortId: string
  collectorFacingDirection: SchematicPortFacingDirection
  emitterFacingDirection: SchematicPortFacingDirection
  placementProblems: Array<
    "transistor_not_below_load" | "collector_not_up" | "emitter_not_down"
  >
  message: string
}

/** Advisory for an electrically identified USB series pair drawn end-to-end. */
export interface UsbSeriesResistorsNotAligned {
  lineItemType: "UsbSeriesResistorsNotAligned"
  positiveResistorSchematicBox: SchematicBoxPlacement
  negativeResistorSchematicBox: SchematicBoxPlacement
  hostSourceComponentId: string
  positiveSourcePortId: string
  negativeSourcePortId: string
  signalAxis: "horizontal" | "vertical"
  message: string
}

/** Advisory for a regulator's local input/output capacitor pair on reversed sides. */
export interface RegulatorCapacitorsOnWrongSides {
  lineItemType: "RegulatorCapacitorsOnWrongSides"
  regulatorSchematicBox: SchematicBoxPlacement
  inputCapacitorSchematicBox: SchematicBoxPlacement
  outputCapacitorSchematicBox: SchematicBoxPlacement
  inputSourcePortId: string
  outputSourcePortId: string
  message: string
}

/** A local supply-to-ground divider and its shunt capacitor are excessively separated. */
export interface VoltageDividerNetworkNotGrouped {
  lineItemType: "VoltageDividerNetworkNotGrouped"
  supplyResistorSchematicBox: SchematicBoxPlacement
  groundResistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  resistorTapDistance: number
  capacitorTapDistance: number
  maxRecommendedTapDistance: number
  message: string
}

/** Advisory: a vertical divider's supply resistor lies clearly below its ground resistor. */
export interface VoltageDividerSupplyResistorBelowGroundResistor {
  lineItemType: "VoltageDividerSupplyResistorBelowGroundResistor"
  supplyResistorSchematicBox: SchematicBoxPlacement
  groundResistorSchematicBox: SchematicBoxPlacement
  supplyTapSourcePortId: string
  groundTapSourcePortId: string
  reversedBodyGap: number
  message: string
}

/** Series gate and gate-source resistors scattered away from their MOSFET. */
export interface MosfetGateNetworkNotGrouped {
  lineItemType: "MosfetGateNetworkNotGrouped"
  mosfetSchematicBox: SchematicBoxPlacement
  seriesGateResistorSchematicBox: SchematicBoxPlacement
  gateSourceResistorSchematicBox: SchematicBoxPlacement
  /** Largest body-to-body gap from either resistor to the MOSFET. */
  maxBodyGap: number
  maxRecommendedBodyGap: number
  message: string
}

/** A local flyback diode separated from the relay coil it protects. */
export interface FlybackDiodeSeparatedFromRelayCoil {
  lineItemType: "FlybackDiodeSeparatedFromRelayCoil"
  relaySchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  coilSourcePortIds: [string, string]
  distanceFromCoilPins: number
  message: string
}

/** Advisory for a displaced local shunt with one sense branch split by labels. */
export interface CurrentSenseShuntSeparatedFromInputs {
  lineItemType: "CurrentSenseShuntSeparatedFromInputs"
  amplifierSchematicBox: SchematicBoxPlacement
  shuntSchematicBox: SchematicBoxPlacement
  positiveInputSourcePortId: string
  negativeInputSourcePortId: string
  /** Gap from the shunt body to the band spanned by the two input pins. */
  inputBandGap: number
  message: string
}

/** A chip-to-ground resistor placed far across its host chip from its connected pin. */
export interface ResistorSeparatedFromChipPin {
  lineItemType: "ResistorSeparatedFromChipPin"
  hostSchematicBox: SchematicBoxPlacement
  resistorSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  resistorSourcePortId: string
  pinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** A capacitor placed far across its chip from its private pin connection(s). */
export interface CapacitorSeparatedFromChipPins {
  lineItemType: "CapacitorSeparatedFromChipPins"
  hostSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  /** Private chip pins in capacitor-port order; one when the other terminal is grounded. */
  chipSourcePortIds: [string] | [string, string]
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** A crystal placed far across its host chip from its two connected pins. */
export interface CrystalSeparatedFromChipPins {
  lineItemType: "CrystalSeparatedFromChipPins"
  hostSchematicBox: SchematicBoxPlacement
  crystalSchematicBox: SchematicBoxPlacement
  /** Connected chip pins, in the order of the crystal's source ports. */
  chipSourcePortIds: [string, string]
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** The series element and grounded shunt branches of a signal pi filter are separated. */
export interface PiFilterComponentsNotGrouped {
  lineItemType: "PiFilterComponentsNotGrouped"
  inductorSchematicBox: SchematicBoxPlacement
  firstCapacitorSchematicBox: SchematicBoxPlacement
  secondCapacitorSchematicBox: SchematicBoxPlacement
  /** Longest direct distance between electrically connected inductor/capacitor pins. */
  maxSignalPinDistance: number
  maxRecommendedSignalPinDistance: number
  message: string
}

/** Readability advisory for a physically continuous local path to an explicit rail. */
export interface RailPathTooSpreadOut {
  lineItemType: "RailPathTooSpreadOut"
  hostSchematicBox: SchematicBoxPlacement
  sourcePortId: string
  /** Display name for user-facing diagnostics; identity remains sourcePortId. */
  sourcePortName?: string
  railType: "power" | "ground"
  supportSchematicBoxes: SchematicBoxPlacement[]
  schematicTraceIds: string[]
  pathPoints: Array<{ x: number; y: number }>
  pathBounds: SchematicIssueBounds
  pathLength: number
  pathSpan: number
  maxRecommendedSpan: number
  maxRecommendedPathLength: number
  message: string
}

/** The three connected terminals of a diode-capacitor stage are spread apart. */
export interface DiodeCapacitorJunctionTooSpreadOut {
  lineItemType: "DiodeCapacitorJunctionTooSpreadOut"
  capacitorSchematicBox: SchematicBoxPlacement
  diodeSchematicBoxes: [SchematicBoxPlacement, SchematicBoxPlacement]
  maxJunctionPinDistance: number
  maxRecommendedJunctionPinDistance: number
  message: string
}

/** Complete parallel resistor/LED branches drawn end-to-end. */
export interface ParallelLedBranchesDrawnInline {
  lineItemType: "ParallelLedBranchesDrawnInline"
  branchSchematicBoxes: SchematicBoxPlacement[]
  branchCount: number
  message: string
}

/** A series LED chain with remote links that run behind their connected pins. */
export interface SeriesLedChainNotOrdered {
  lineItemType: "SeriesLedChainNotOrdered"
  /** Traversal order through exclusive LED-to-LED junctions, not inferred polarity. */
  ledSchematicBoxes: SchematicBoxPlacement[]
  backtrackingConnections: Array<{
    firstSourcePortId: string
    secondSourcePortId: string
    pinDistance: number
  }>
  message: string
}

/** A chip's private inductor branch returns to that chip through an explicit power net. */
export interface InductorSeparatedFromChipPin {
  lineItemType: "InductorSeparatedFromChipPin"
  hostSchematicBox: SchematicBoxPlacement
  inductorSchematicBox: SchematicBoxPlacement
  chipSourcePortId: string
  inductorSourcePortId: string
  powerSourcePortIds: string[]
  pinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** Two diode branches sharing a power node are placed one behind the other. */
export interface SharedNodeDiodesInline {
  lineItemType: "SharedNodeDiodesInline"
  diodeSchematicBoxes: [SchematicBoxPlacement, SchematicBoxPlacement]
  sharedSourcePortIds: [string, string]
  inlinePinSeparation: number
  message: string
}

/** A native transistor's opposing resistor-fed positive/ground branches face away from the rails. */
export interface TransistorHasIncorrectRailOrientation {
  lineItemType: "TransistorHasIncorrectRailOrientation"
  transistorSchematicBox: SchematicBoxPlacement
  supplyResistorSchematicBox: SchematicBoxPlacement
  groundResistorSchematicBox: SchematicBoxPlacement
  supplyConnectedSourcePortId: string
  groundConnectedSourcePortId: string
  deltaSchRotation: 90 | 180 | 270
  message: string
}

/** A discrete diode is separated from its switch in a repeated matrix branch. */
export interface SwitchMatrixDiodeSeparatedFromSwitch {
  lineItemType: "SwitchMatrixDiodeSeparatedFromSwitch"
  switchSchematicBox: SchematicBoxPlacement
  diodeSchematicBox: SchematicBoxPlacement
  switchSourcePortId: string
  diodeSourcePortId: string
  connectedPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

/** Excessive unused space between bus-connected rows/columns of a complete matrix. */
export interface SwitchMatrixBranchesTooSpreadOut {
  lineItemType: "SwitchMatrixBranchesTooSpreadOut"
  branchSchematicBoxes: SchematicBoxPlacement[]
  axis: "x" | "y"
  emptyGap: number
  maxRecommendedEmptyGap: number
  message: string
}

export type SchematicPlacementIssue =
  | ComponentBranchesOutOfOrder
  | RcrJunctionNotGrouped
  | InductorDiodeNotGrouped
  | ResistorDividerSeparatedFromChip
  | ChipPinTestPointNotAligned
  | CapacitorConnectorNotAligned
  | ConnectorTestPointNotAligned
  | InductorCapacitorNotGrouped
  | ResistorTestPointNotAligned
  | ResistorConnectorNotAligned
  | FuseConnectorNotAligned
  | TransistorLedNotAligned
  | TransistorResistorNotAligned
  | PotentiometerHasIncorrectRailOrientation
  | CapacitorSeparatedFromResistorDivider
  | SeriesResistorsNotAligned
  | FuseMosfetNotAligned
  | LedResistorBranchSeparatedFromChipPin
  | ChipDiodeCapacitorNetworkNotGrouped
  | FuseDiodeNotAligned
  | InductorSeparatedFromChipPins
  | SwitchMatrixBranchesTooSpreadOut
  | SwitchMatrixDiodeSeparatedFromSwitch
  | TransistorHasIncorrectRailOrientation
  | InductorSeparatedFromChipPin
  | SharedNodeDiodesInline
  | DiodeCapacitorJunctionTooSpreadOut
  | ParallelLedBranchesDrawnInline
  | SeriesLedChainNotOrdered
  | RailPathTooSpreadOut
  | ResistorSeparatedFromChipPin
  | RrcTimingNetworkNotGrouped
  | CapacitorSeparatedFromChipPins
  | CrystalSeparatedFromChipPins
  | PiFilterComponentsNotGrouped
  | MosfetGateNetworkNotGrouped
  | FlybackDiodeSeparatedFromRelayCoil
  | CurrentSenseShuntSeparatedFromInputs
  | VoltageDividerNetworkNotGrouped
  | VoltageDividerSupplyResistorBelowGroundResistor
  | RegulatorCapacitorsOnWrongSides
  | UsbSeriesResistorsNotAligned
  | LowSideTransistorNotAlignedWithLoad
  | ComponentOverlap
  | SchematicBoxHasALotOfSurroundingWhitespace
  | CapacitorSymbolHorizontal
  | DecouplingCapacitorsNotCloseTogether
  | VerboseSchematicNetLabel
  | SchematicBoxTooWideIssue
  | SchematicBoxInnerLabelCollision
  | SchematicBoxInnerLabelOutOfBounds
  | SchematicPinPaddingToEdgeTooLarge
  | DiodeResistorNotAligned
  | HighPassRcFilterComponentsNotGrouped
  | SeriesRcFilterComponentsNotGrouped
  | SwitchRcNetworkNotGrouped
  | ParallelResistorsDrawnInline
  | ResistorSeparatedFromCrystal
  | ParallelCapacitorsDrawnInline
  | ParallelRcNotAligned
  | ParallelDiodeResistorNotAligned
  | ParallelDiodesNotAligned
  | SeriesRcBranchNotGrouped
  | ParallelDiodeCapacitorNotAligned
  | ComponentPinsWouldAlignWithVerticalShift
  | TraceCanBeSimplifiedByMovingComponent
  | CrystalNotCenteredOverLoadCapacitors
  | TwoPinComponentCouldBeFlipped
  | FeedbackNetworkNotCompact
  | PullResistorOnWrongSide
  | TwoPinComponentShouldBeVertical
  | TwoPinComponentHasInvertedRails
  | ComponentNetLabelCollision
  | ComponentBoxNetLabelCollision
  | NetLabelCollision
  | SchematicTextCollision
  | ResetNetworkNotGrouped
  | ConnectorPositionCausesTraceDetours

export interface SchematicPlacementIssues {
  lineItemType: "SchematicPlacementIssues"
  issues: SchematicPlacementIssue[]
}

export type SchematicPlacementLineItem =
  | SchematicBoxPlacementLineItem
  | SchematicPlacementIssues

/** Select issue types to execute; omitted runs all checks, [] runs none. */
export interface SchematicPlacementAnalysisOptions {
  /** Schematic drawing units, not PCB dimensions. Defaults: span 8, length 16. */
  railPathVisibility?: { maxSpan?: number; maxPathLength?: number }
  issueTypes?: readonly SchematicPlacementIssue["lineItemType"][]
}

export interface RrcTimingNetworkNotGrouped {
  lineItemType: "RrcTimingNetworkNotGrouped"
  hostSchematicBox: SchematicBoxPlacement
  firstResistorSchematicBox: SchematicBoxPlacement
  secondResistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}

export interface ComponentBranchesOutOfOrder {
  lineItemType: "ComponentBranchesOutOfOrder"
  hostSchematicBox: SchematicBoxPlacement
  firstComponentSchematicBox: SchematicBoxPlacement
  secondComponentSchematicBox: SchematicBoxPlacement
  message: string
}

export interface RcrJunctionNotGrouped {
  lineItemType: "RcrJunctionNotGrouped"
  firstResistorSchematicBox: SchematicBoxPlacement
  secondResistorSchematicBox: SchematicBoxPlacement
  capacitorSchematicBox: SchematicBoxPlacement
  maxPinDistance: number
  maxRecommendedPinDistance: number
  message: string
}
