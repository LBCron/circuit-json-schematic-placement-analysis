import { ChipLedResistorGroupingSolver } from "./solvers/ChipLedResistorGroupingSolver/ChipLedResistorGroupingSolver"
import { FuseMosfetAlignmentSolver } from "./solvers/FuseMosfetAlignmentSolver/FuseMosfetAlignmentSolver"
import { ChipDiodeCapacitorNetworkGroupingSolver } from "./solvers/ChipDiodeCapacitorNetworkGroupingSolver/ChipDiodeCapacitorNetworkGroupingSolver"
import { ChipPinTestPointAlignmentSolver } from "./solvers/ChipPinTestPointAlignmentSolver/ChipPinTestPointAlignmentSolver"
import { CapacitorConnectorAlignmentSolver } from "./solvers/CapacitorConnectorAlignmentSolver/CapacitorConnectorAlignmentSolver"
import { InductorDiodeGroupingSolver } from "./solvers/InductorDiodeGroupingSolver/InductorDiodeGroupingSolver"
import { ChipPinResistorDividerPlacementSolver } from "./solvers/ChipPinResistorDividerPlacementSolver/ChipPinResistorDividerPlacementSolver"
import { RrcTimingNetworkGroupingSolver } from "./solvers/RrcTimingNetworkGroupingSolver/RrcTimingNetworkGroupingSolver"
import { ConnectorTestPointAlignmentSolver } from "./solvers/ConnectorTestPointAlignmentSolver/ConnectorTestPointAlignmentSolver"
import { InductorCapacitorGroupingSolver } from "./solvers/InductorCapacitorGroupingSolver/InductorCapacitorGroupingSolver"
import { ResistorTestPointAlignmentSolver } from "./solvers/ResistorTestPointAlignmentSolver/ResistorTestPointAlignmentSolver"
import { ResistorConnectorAlignmentSolver } from "./solvers/ResistorConnectorAlignmentSolver/ResistorConnectorAlignmentSolver"
import { FuseConnectorAlignmentSolver } from "./solvers/FuseConnectorAlignmentSolver/FuseConnectorAlignmentSolver"
import { TransistorLedAlignmentSolver } from "./solvers/TransistorLedAlignmentSolver/TransistorLedAlignmentSolver"
import { TransistorResistorAlignmentSolver } from "./solvers/TransistorResistorAlignmentSolver/TransistorResistorAlignmentSolver"
import { PotentiometerRailOrientationSolver } from "./solvers/PotentiometerRailOrientationSolver/PotentiometerRailOrientationSolver"
import { ResistorDividerCapacitorPlacementSolver } from "./solvers/ResistorDividerCapacitorPlacementSolver/ResistorDividerCapacitorPlacementSolver"
import { SeriesResistorAlignmentSolver } from "./solvers/SeriesResistorAlignmentSolver/SeriesResistorAlignmentSolver"
import { ParallelDiodeAlignmentSolver } from "./solvers/ParallelDiodeAlignmentSolver/ParallelDiodeAlignmentSolver"
import { SeriesRcBranchGroupingSolver } from "./solvers/SeriesRcBranchGroupingSolver/SeriesRcBranchGroupingSolver"
import { FuseDiodeAlignmentSolver } from "./solvers/FuseDiodeAlignmentSolver/FuseDiodeAlignmentSolver"
import { ChipPinPairInductorPlacementSolver } from "./solvers/ChipPinPairInductorPlacementSolver/ChipPinPairInductorPlacementSolver"
import { HighPassRcFilterPlacementSolver } from "./solvers/HighPassRcFilterPlacementSolver/HighPassRcFilterPlacementSolver"
import { ParallelDiodeCapacitorAlignmentSolver } from "./solvers/ParallelDiodeCapacitorAlignmentSolver/ParallelDiodeCapacitorAlignmentSolver"
import { ParallelLedBranchPlacementSolver } from "./solvers/ParallelLedBranchPlacementSolver/ParallelLedBranchPlacementSolver"
import { CrystalResistorPlacementSolver } from "./solvers/CrystalResistorPlacementSolver/CrystalResistorPlacementSolver"
import { SwitchRcNetworkGroupingSolver } from "./solvers/SwitchRcNetworkGroupingSolver/SwitchRcNetworkGroupingSolver"
import { SwitchMatrixDiodePlacementSolver } from "./solvers/SwitchMatrixDiodePlacementSolver/SwitchMatrixDiodePlacementSolver"
import { SeriesRcFilterPlacementSolver } from "./solvers/SeriesRcFilterPlacementSolver/SeriesRcFilterPlacementSolver"
import { ParallelResistorPlacementSolver } from "./solvers/ParallelResistorPlacementSolver/ParallelResistorPlacementSolver"
import { ParallelCapacitorAlignmentSolver } from "./solvers/ParallelCapacitorAlignmentSolver/ParallelCapacitorAlignmentSolver"
import { ChipPinCrystalPlacementSolver } from "./solvers/ChipPinCrystalPlacementSolver/ChipPinCrystalPlacementSolver"
import { SchematicBoxInnerLabelBoundsSolver } from "./solvers/SchematicBoxInnerLabelBoundsSolver/SchematicBoxInnerLabelBoundsSolver"
import { TransistorRailOrientationSolver } from "./solvers/TransistorRailOrientationSolver/TransistorRailOrientationSolver"
import { ChipSupplyInductorPlacementSolver } from "./solvers/ChipSupplyInductorPlacementSolver/ChipSupplyInductorPlacementSolver"
import { SharedNodeDiodePlacementSolver } from "./solvers/SharedNodeDiodePlacementSolver/SharedNodeDiodePlacementSolver"
import { DiodeCapacitorStagePlacementSolver } from "./solvers/DiodeCapacitorStagePlacementSolver/DiodeCapacitorStagePlacementSolver"
import { SeriesLedChainPlacementSolver } from "./solvers/SeriesLedChainPlacementSolver/SeriesLedChainPlacementSolver"
import { ParallelRcPlacementSolver } from "./solvers/ParallelRcPlacementSolver/ParallelRcPlacementSolver"
import { ChipPinResistorPlacementSolver } from "./solvers/ChipPinResistorPlacementSolver/ChipPinResistorPlacementSolver"
import { ParallelDiodeResistorPlacementSolver } from "./solvers/ParallelDiodeResistorPlacementSolver/ParallelDiodeResistorPlacementSolver"
import { RailPathVisibilitySolver } from "./solvers/RailPathVisibilitySolver/RailPathVisibilitySolver"
import { ChipPinPairCapacitorPlacementSolver } from "./solvers/ChipPinPairCapacitorPlacementSolver/ChipPinPairCapacitorPlacementSolver"
import { PiFilterPlacementSolver } from "./solvers/PiFilterPlacementSolver/PiFilterPlacementSolver"
import { MosfetGateNetworkPlacementSolver } from "./solvers/MosfetGateNetworkPlacementSolver/MosfetGateNetworkPlacementSolver"
import { RelayFlybackDiodePlacementSolver } from "./solvers/RelayFlybackDiodePlacementSolver/RelayFlybackDiodePlacementSolver"
import { CurrentSenseShuntPlacementSolver } from "./solvers/CurrentSenseShuntPlacementSolver/CurrentSenseShuntPlacementSolver"
import { VoltageDividerPlacementSolver } from "./solvers/VoltageDividerPlacementSolver/VoltageDividerPlacementSolver"
import { RegulatorInputOutputCapacitorPlacementSolver } from "./solvers/RegulatorInputOutputCapacitorPlacementSolver/RegulatorInputOutputCapacitorPlacementSolver"
import { ConnectorPlacementSolver } from "./solvers/ConnectorPlacementSolver/ConnectorPlacementSolver"
import { LowSideTransistorPlacementSolver } from "./solvers/LowSideTransistorPlacementSolver/LowSideTransistorPlacementSolver"
import { UsbSeriesResistorPlacementSolver } from "./solvers/UsbSeriesResistorPlacementSolver/UsbSeriesResistorPlacementSolver"
import type { CircuitJson } from "circuit-json"
import { CapacitorOrientationSolver } from "./solvers/CapacitorOrientationSolver/CapacitorOrientationSolver"
import { DecouplingCapacitorGroupingSolver } from "./solvers/DecouplingCapacitorGroupingSolver/DecouplingCapacitorGroupingSolver"
import { ComponentNetLabelCollisionSolver } from "./solvers/ComponentNetLabelCollisionSolver/ComponentNetLabelCollisionSolver"
import { ComponentPinAlignmentSolver } from "./solvers/ComponentPinAlignmentSolver/ComponentPinAlignmentSolver"
import { CrystalLoadCapacitorPlacementSolver } from "./solvers/CrystalLoadCapacitorPlacementSolver/CrystalLoadCapacitorPlacementSolver"
import { DiodeResistorAlignmentSolver } from "./solvers/DiodeResistorAlignmentSolver/DiodeResistorAlignmentSolver"
import { FeedbackNetworkPlacementSolver } from "./solvers/FeedbackNetworkPlacementSolver/FeedbackNetworkPlacementSolver"
import { PullResistorPlacementSolver } from "./solvers/PullResistorPlacementSolver/PullResistorPlacementSolver"
import { TwoPinComponentRailOrientationSolver } from "./solvers/TwoPinComponentRailOrientationSolver/TwoPinComponentRailOrientationSolver"
import { SchematicBoxInnerLabelCollisionSolver } from "./solvers/SchematicBoxInnerLabelCollisionSolver/SchematicBoxInnerLabelCollisionSolver"
import { SchematicBoxOverlapSolver } from "./solvers/SchematicBoxOverlapSolver/SchematicBoxOverlapSolver"
import { SchematicBoxTooWideSolver } from "./solvers/SchematicBoxTooWideSolver/SchematicBoxTooWideSolver"
import { SchematicPinPaddingToEdgeSolver } from "./solvers/SchematicPinPaddingToEdgeSolver/SchematicPinPaddingToEdgeSolver"
import { SchematicPlacementPipeline } from "./solvers/SchematicPlacementPipeline/SchematicPlacementPipeline"
import { TraceSimplificationSolver } from "./solvers/TraceSimplificationSolver/TraceSimplificationSolver"
import { TwoPinComponentOrientationSolver } from "./solvers/TwoPinComponentOrientationSolver/TwoPinComponentOrientationSolver"
import { VerboseNetLabelSolver } from "./solvers/VerboseNetLabelSolver/VerboseNetLabelSolver"
import { SchematicTextClearanceSolver } from "./solvers/SchematicTextClearanceSolver/SchematicTextClearanceSolver"
import { ResetNetworkGroupingSolver } from "./solvers/ResetNetworkGroupingSolver/ResetNetworkGroupingSolver"
import type {
  SchematicBoxPlacementLineItem,
  SchematicPlacementIssue,
  SchematicPlacementAnalysisOptions,
  SchematicPlacementLineItem,
} from "./types"
import { addAttr } from "./utils/format"
import {
  getIssueSchematicSheetContext,
  getRelevantPlacementsForIssues,
  type SchematicSheetContext,
} from "./utils/issue-context"

interface SchematicSheetGroup extends SchematicSheetContext {
  placements: SchematicBoxPlacementLineItem[]
  issues: SchematicPlacementIssue[]
}

export class SchematicPlacementAnalysis {
  constructor(
    private readonly lineItems: SchematicPlacementLineItem[],
    private readonly groupBySchematicSheet = false,
  ) {}

  getLineItems(): SchematicPlacementLineItem[] {
    return this.lineItems
  }

  /** Filter emitted issues without rerunning or changing the solvers. */
  getIssues(
    filter: {
      issueTypes?: readonly SchematicPlacementIssue["lineItemType"][]
      schematicSheetId?: string
    } = {},
  ): SchematicPlacementIssue[] {
    return this.lineItems
      .flatMap((item) =>
        item.lineItemType === "SchematicPlacementIssues" ? item.issues : [],
      )
      .filter(
        (issue) =>
          (filter.issueTypes === undefined ||
            filter.issueTypes.includes(issue.lineItemType)) &&
          (filter.schematicSheetId === undefined ||
            (getIssueSchematicSheetContext(issue).schematicSheetId ?? "") ===
              filter.schematicSheetId),
      )
  }

  /** Counts emitted issue objects, including zero counts for known types. */
  getIssueCounts(filter: { schematicSheetId?: string } = {}) {
    const counts = {
      ChipPinTestPointNotAligned: 0,
      CapacitorConnectorNotAligned: 0,
      ConnectorTestPointNotAligned: 0,
      InductorDiodeNotGrouped: 0,
      InductorCapacitorNotGrouped: 0,
      ResistorTestPointNotAligned: 0,
      ResistorConnectorNotAligned: 0,
      FuseConnectorNotAligned: 0,
      TransistorLedNotAligned: 0,
      TransistorResistorNotAligned: 0,
      PotentiometerHasIncorrectRailOrientation: 0,
      CapacitorSeparatedFromResistorDivider: 0,
      SeriesResistorsNotAligned: 0,
      FuseMosfetNotAligned: 0,
      ChipDiodeCapacitorNetworkNotGrouped: 0,
      LedResistorBranchSeparatedFromChipPin: 0,
      FuseDiodeNotAligned: 0,
      InductorSeparatedFromChipPins: 0,
      TransistorHasIncorrectRailOrientation: 0,
      FlybackDiodeSeparatedFromRelayCoil: 0,
      ComponentOverlap: 0,
      SchematicBoxHasALotOfSurroundingWhitespace: 0,
      CapacitorSymbolHorizontal: 0,
      VerboseSchematicNetLabel: 0,
      PinHeaderSchematicBoxTooWide: 0,
      GenericSchematicBoxTooWide: 0,
      SchematicBoxInnerLabelCollision: 0,
      SchematicBoxInnerLabelOutOfBounds: 0,
      SchematicPinPaddingToEdgeTooLarge: 0,
      DiodeResistorNotAligned: 0,
      HighPassRcFilterComponentsNotGrouped: 0,
      SeriesRcFilterComponentsNotGrouped: 0,
      SwitchRcNetworkNotGrouped: 0,
      ParallelResistorsDrawnInline: 0,
      ResistorSeparatedFromCrystal: 0,
      ParallelCapacitorsDrawnInline: 0,
      ParallelRcNotAligned: 0,
      ParallelDiodeResistorNotAligned: 0,
      ParallelDiodesNotAligned: 0,
      SeriesRcBranchNotGrouped: 0,
      ParallelDiodeCapacitorNotAligned: 0,
      ComponentPinsWouldAlignWithVerticalShift: 0,
      TraceCanBeSimplifiedByMovingComponent: 0,
      CrystalNotCenteredOverLoadCapacitors: 0,
      ComponentNetLabelCollision: 0,
      ComponentBoxNetLabelCollision: 0,
      NetLabelCollision: 0,
      FeedbackNetworkNotCompact: 0,
      PullResistorOnWrongSide: 0,
      SchematicTextCollision: 0,
      ResetNetworkNotGrouped: 0,
      TwoPinComponentCouldBeFlipped: 0,
      TwoPinComponentShouldBeVertical: 0,
      TwoPinComponentHasInvertedRails: 0,
      DecouplingCapacitorsNotCloseTogether: 0,
      ConnectorPositionCausesTraceDetours: 0,
      LowSideTransistorNotAlignedWithLoad: 0,
      UsbSeriesResistorsNotAligned: 0,
      RegulatorCapacitorsOnWrongSides: 0,
      VoltageDividerSupplyResistorBelowGroundResistor: 0,
      VoltageDividerNetworkNotGrouped: 0,
      CurrentSenseShuntSeparatedFromInputs: 0,
      DiodeCapacitorJunctionTooSpreadOut: 0,
      SharedNodeDiodesInline: 0,
      PiFilterComponentsNotGrouped: 0,
      MosfetGateNetworkNotGrouped: 0,
      RrcTimingNetworkNotGrouped: 0,
      CapacitorSeparatedFromChipPins: 0,
      CrystalSeparatedFromChipPins: 0,
      ResistorDividerSeparatedFromChip: 0,
      ResistorSeparatedFromChipPin: 0,
      InductorSeparatedFromChipPin: 0,
      RailPathTooSpreadOut: 0,
      SwitchMatrixDiodeSeparatedFromSwitch: 0,
      SwitchMatrixBranchesTooSpreadOut: 0,
      ParallelLedBranchesDrawnInline: 0,
      SeriesLedChainNotOrdered: 0,
    } satisfies Record<SchematicPlacementIssue["lineItemType"], number>
    for (const issue of this.getIssues(filter)) counts[issue.lineItemType]++
    return counts
  }

  getString(): string {
    return this.toString()
  }

  schematicBoxPlacementsToString(
    lineItem: SchematicBoxPlacementLineItem,
  ): string {
    const attrs: string[] = []
    addAttr(attrs, "componentName", lineItem.sourceComponentName)
    addAttr(attrs, "positionAnchor", lineItem.positionAnchor)
    addAttr(attrs, "schX", lineItem.schX)
    addAttr(attrs, "schY", lineItem.schY)
    addAttr(attrs, "width", lineItem.width)
    addAttr(attrs, "height", lineItem.height)
    return `<SchematicBoxPlacement ${attrs.join(" ")} />`
  }

  schematicIssuesToString(issue: SchematicPlacementIssue): string {
    switch (issue.lineItemType) {
      case "ChipPinTestPointNotAligned":
        return ChipPinTestPointAlignmentSolver.issueToString(issue)
      case "CapacitorConnectorNotAligned":
        return CapacitorConnectorAlignmentSolver.issueToString(issue)
      case "ConnectorTestPointNotAligned":
        return ConnectorTestPointAlignmentSolver.issueToString(issue)
      case "InductorDiodeNotGrouped":
        return InductorDiodeGroupingSolver.issueToString(issue)
      case "InductorCapacitorNotGrouped":
        return InductorCapacitorGroupingSolver.issueToString(issue)
      case "ResistorTestPointNotAligned":
        return ResistorTestPointAlignmentSolver.issueToString(issue)
      case "ResistorConnectorNotAligned":
        return ResistorConnectorAlignmentSolver.issueToString(issue)
      case "FuseConnectorNotAligned":
        return FuseConnectorAlignmentSolver.issueToString(issue)
      case "TransistorLedNotAligned":
        return TransistorLedAlignmentSolver.issueToString(issue)
      case "TransistorResistorNotAligned":
        return TransistorResistorAlignmentSolver.issueToString(issue)
      case "PotentiometerHasIncorrectRailOrientation":
        return PotentiometerRailOrientationSolver.issueToString(issue)
      case "CapacitorSeparatedFromResistorDivider":
        return ResistorDividerCapacitorPlacementSolver.issueToString(issue)
      case "SeriesResistorsNotAligned":
        return SeriesResistorAlignmentSolver.issueToString(issue)
      case "FuseMosfetNotAligned":
        return FuseMosfetAlignmentSolver.issueToString(issue)
      case "ChipDiodeCapacitorNetworkNotGrouped":
        return ChipDiodeCapacitorNetworkGroupingSolver.issueToString(issue)
      case "LedResistorBranchSeparatedFromChipPin":
        return ChipLedResistorGroupingSolver.issueToString(issue)
      case "FuseDiodeNotAligned":
        return FuseDiodeAlignmentSolver.issueToString(issue)
      case "InductorSeparatedFromChipPins":
        return ChipPinPairInductorPlacementSolver.issueToString(issue)
      case "TransistorHasIncorrectRailOrientation":
        return TransistorRailOrientationSolver.issueToString(issue)
      case "SwitchMatrixBranchesTooSpreadOut":
      case "SwitchMatrixDiodeSeparatedFromSwitch":
        return SwitchMatrixDiodePlacementSolver.issueToString(issue)
      case "ParallelLedBranchesDrawnInline":
        return ParallelLedBranchPlacementSolver.issueToString(issue)
      case "SeriesLedChainNotOrdered":
        return SeriesLedChainPlacementSolver.issueToString(issue)
      case "InductorSeparatedFromChipPin":
        return ChipSupplyInductorPlacementSolver.issueToString(issue)
      case "ResistorDividerSeparatedFromChip":
        return ChipPinResistorDividerPlacementSolver.issueToString(issue)
      case "ResistorSeparatedFromChipPin":
        return ChipPinResistorPlacementSolver.issueToString(issue)
      case "CrystalSeparatedFromChipPins":
        return ChipPinCrystalPlacementSolver.issueToString(issue)
      case "RrcTimingNetworkNotGrouped":
        return RrcTimingNetworkGroupingSolver.issueToString(issue)
      case "CapacitorSeparatedFromChipPins":
        return ChipPinPairCapacitorPlacementSolver.issueToString(issue)
      case "SharedNodeDiodesInline":
        return SharedNodeDiodePlacementSolver.issueToString(issue)
      case "DiodeCapacitorJunctionTooSpreadOut":
        return DiodeCapacitorStagePlacementSolver.issueToString(issue)
      case "PiFilterComponentsNotGrouped":
        return PiFilterPlacementSolver.issueToString(issue)
      case "MosfetGateNetworkNotGrouped":
        return MosfetGateNetworkPlacementSolver.issueToString(issue)
      case "CurrentSenseShuntSeparatedFromInputs":
        return CurrentSenseShuntPlacementSolver.issueToString(issue)
      case "ComponentOverlap":
        return SchematicBoxOverlapSolver.issueToString(issue)
      case "CapacitorSymbolHorizontal":
        return CapacitorOrientationSolver.issueToString(issue)
      case "DecouplingCapacitorsNotCloseTogether":
        return DecouplingCapacitorGroupingSolver.issueToString(issue)
      case "VerboseSchematicNetLabel":
        return VerboseNetLabelSolver.issueToString(issue)
      case "PinHeaderSchematicBoxTooWide":
      case "GenericSchematicBoxTooWide":
        return SchematicBoxTooWideSolver.issueToString(issue)
      case "SchematicBoxInnerLabelOutOfBounds":
        return SchematicBoxInnerLabelBoundsSolver.issueToString(issue)
      case "SchematicBoxInnerLabelCollision":
        return SchematicBoxInnerLabelCollisionSolver.issueToString(issue)
      case "SchematicPinPaddingToEdgeTooLarge":
        return SchematicPinPaddingToEdgeSolver.issueToString(issue)
      case "HighPassRcFilterComponentsNotGrouped":
        return HighPassRcFilterPlacementSolver.issueToString(issue)
      case "SeriesRcFilterComponentsNotGrouped":
        return SeriesRcFilterPlacementSolver.issueToString(issue)
      case "SwitchRcNetworkNotGrouped":
        return SwitchRcNetworkGroupingSolver.issueToString(issue)
      case "ResistorSeparatedFromCrystal":
        return CrystalResistorPlacementSolver.issueToString(issue)
      case "ParallelCapacitorsDrawnInline":
        return ParallelCapacitorAlignmentSolver.issueToString(issue)
      case "ParallelResistorsDrawnInline":
        return ParallelResistorPlacementSolver.issueToString(issue)
      case "ParallelRcNotAligned":
        return ParallelRcPlacementSolver.issueToString(issue)
      case "ParallelDiodesNotAligned":
        return ParallelDiodeAlignmentSolver.issueToString(issue)
      case "SeriesRcBranchNotGrouped":
        return SeriesRcBranchGroupingSolver.issueToString(issue)
      case "ParallelDiodeCapacitorNotAligned":
        return ParallelDiodeCapacitorAlignmentSolver.issueToString(issue)
      case "ParallelDiodeResistorNotAligned":
        return ParallelDiodeResistorPlacementSolver.issueToString(issue)
      case "DiodeResistorNotAligned":
        return DiodeResistorAlignmentSolver.issueToString(issue)
      case "ComponentPinsWouldAlignWithVerticalShift":
        return ComponentPinAlignmentSolver.issueToString(issue)
      case "TraceCanBeSimplifiedByMovingComponent":
        return TraceSimplificationSolver.issueToString(issue)
      case "CrystalNotCenteredOverLoadCapacitors":
        return CrystalLoadCapacitorPlacementSolver.issueToString(issue)
      case "TwoPinComponentCouldBeFlipped":
        return TwoPinComponentOrientationSolver.issueToString(issue)
      case "FeedbackNetworkNotCompact":
        return FeedbackNetworkPlacementSolver.issueToString(issue)
      case "TwoPinComponentShouldBeVertical":
      case "TwoPinComponentHasInvertedRails":
        return TwoPinComponentRailOrientationSolver.issueToString(issue)
      case "RailPathTooSpreadOut":
        return RailPathVisibilitySolver.issueToString(issue)
      case "PullResistorOnWrongSide":
        return PullResistorPlacementSolver.issueToString(issue)
      case "NetLabelCollision":
        return ComponentNetLabelCollisionSolver.netLabelCollisionToString(issue)
      case "SchematicTextCollision":
        return SchematicTextClearanceSolver.issueToString(issue)
      case "ResetNetworkNotGrouped":
        return ResetNetworkGroupingSolver.issueToString(issue)
      case "ConnectorPositionCausesTraceDetours":
        return ConnectorPlacementSolver.issueToString(issue)
      case "LowSideTransistorNotAlignedWithLoad":
        return LowSideTransistorPlacementSolver.issueToString(issue)
      case "FlybackDiodeSeparatedFromRelayCoil":
        return RelayFlybackDiodePlacementSolver.issueToString(issue)
      case "VoltageDividerNetworkNotGrouped":
      case "VoltageDividerSupplyResistorBelowGroundResistor":
        return VoltageDividerPlacementSolver.issueToString(issue)
      case "RegulatorCapacitorsOnWrongSides":
        return RegulatorInputOutputCapacitorPlacementSolver.issueToString(issue)
      case "UsbSeriesResistorsNotAligned":
        return UsbSeriesResistorPlacementSolver.issueToString(issue)
      default:
        return ""
    }
  }

  toString(): string {
    const schematicBoxPlacements = this.lineItems.filter(
      (lineItem): lineItem is SchematicBoxPlacementLineItem =>
        lineItem.lineItemType === "SchematicBoxPlacement",
    )
    const issues = this.lineItems.flatMap((lineItem) =>
      lineItem.lineItemType === "SchematicPlacementIssues"
        ? lineItem.issues
        : [],
    )
    if (issues.length === 0) return ""
    if (!this.groupBySchematicSheet) {
      return this.issueContextToLines(schematicBoxPlacements, issues).join("\n")
    }

    const groups = new Map<string, SchematicSheetGroup>()
    const getOrCreateGroup = (
      context: SchematicSheetContext,
    ): SchematicSheetGroup => {
      const key =
        context.schematicSheetId ?? context.schematicSheetName ?? "__default__"
      const existingGroup = groups.get(key)
      if (existingGroup) return existingGroup
      const group = { ...context, placements: [], issues: [] }
      groups.set(key, group)
      return group
    }

    for (const issue of issues) {
      getOrCreateGroup(getIssueSchematicSheetContext(issue)).issues.push(issue)
    }
    for (const placement of schematicBoxPlacements) {
      getOrCreateGroup({
        schematicSheetId: placement.schematicSheetId,
        schematicSheetName: placement.schematicSheetName,
      }).placements.push(placement)
    }

    return [...groups.values()]
      .flatMap((group) => {
        const sheetAttrs: string[] = []
        addAttr(sheetAttrs, "name", group.schematicSheetName)
        addAttr(sheetAttrs, "id", group.schematicSheetId)
        return [
          `<SchematicSheet${sheetAttrs.length > 0 ? ` ${sheetAttrs.join(" ")}` : ""}>`,
          ...this.issueContextToLines(group.placements, group.issues),
          "</SchematicSheet>",
        ]
      })
      .join("\n")
  }

  private issueContextToLines(
    placements: SchematicBoxPlacementLineItem[],
    issues: SchematicPlacementIssue[],
  ): string[] {
    return [
      ...(placements.length > 0
        ? [
            "<SchematicBoxPositions>",
            ...placements.map(this.schematicBoxPlacementsToString),
            "</SchematicBoxPositions>",
          ]
        : []),
      "<SchematicPlacementIssues>",
      ...issues.map(this.schematicIssuesToString),
      "</SchematicPlacementIssues>",
    ]
  }
}

export const analyzeSchematicPlacement = (
  circuitJson: CircuitJson,
  options: SchematicPlacementAnalysisOptions = {},
): SchematicPlacementAnalysis => {
  const pipeline = new SchematicPlacementPipeline(circuitJson, options)
  pipeline.solve()
  const { issues, componentPlacements } = pipeline.getOutput()

  const relevantPlacements = getRelevantPlacementsForIssues({
    issues,
    componentPlacements,
    circuitJson,
  })
  const lineItems: SchematicPlacementLineItem[] = [
    ...relevantPlacements,
    ...(issues.length > 0
      ? [{ lineItemType: "SchematicPlacementIssues" as const, issues }]
      : []),
  ]

  const schematicSheetIds = new Set(
    circuitJson.flatMap((element) =>
      "schematic_sheet_id" in element &&
      typeof element.schematic_sheet_id === "string"
        ? [element.schematic_sheet_id]
        : [],
    ),
  )
  return new SchematicPlacementAnalysis(lineItems, schematicSheetIds.size > 1)
}
