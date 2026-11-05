import { ChipLedResistorGroupingSolver } from "../ChipLedResistorGroupingSolver/ChipLedResistorGroupingSolver"
import { FuseMosfetAlignmentSolver } from "../FuseMosfetAlignmentSolver/FuseMosfetAlignmentSolver"
import { ChipDiodeCapacitorNetworkGroupingSolver } from "../ChipDiodeCapacitorNetworkGroupingSolver/ChipDiodeCapacitorNetworkGroupingSolver"
import { ChipPinTestPointAlignmentSolver } from "../ChipPinTestPointAlignmentSolver/ChipPinTestPointAlignmentSolver"
import { CapacitorConnectorAlignmentSolver } from "../CapacitorConnectorAlignmentSolver/CapacitorConnectorAlignmentSolver"
import { InductorDiodeGroupingSolver } from "../InductorDiodeGroupingSolver/InductorDiodeGroupingSolver"
import { ChipPinResistorDividerPlacementSolver } from "../ChipPinResistorDividerPlacementSolver/ChipPinResistorDividerPlacementSolver"
import { RrcTimingNetworkGroupingSolver } from "../RrcTimingNetworkGroupingSolver/RrcTimingNetworkGroupingSolver"
import { ConnectorTestPointAlignmentSolver } from "../ConnectorTestPointAlignmentSolver/ConnectorTestPointAlignmentSolver"
import { InductorCapacitorGroupingSolver } from "../InductorCapacitorGroupingSolver/InductorCapacitorGroupingSolver"
import { ResistorTestPointAlignmentSolver } from "../ResistorTestPointAlignmentSolver/ResistorTestPointAlignmentSolver"
import { ResistorConnectorAlignmentSolver } from "../ResistorConnectorAlignmentSolver/ResistorConnectorAlignmentSolver"
import { FuseConnectorAlignmentSolver } from "../FuseConnectorAlignmentSolver/FuseConnectorAlignmentSolver"
import { TransistorLedAlignmentSolver } from "../TransistorLedAlignmentSolver/TransistorLedAlignmentSolver"
import { TransistorResistorAlignmentSolver } from "../TransistorResistorAlignmentSolver/TransistorResistorAlignmentSolver"
import { PotentiometerRailOrientationSolver } from "../PotentiometerRailOrientationSolver/PotentiometerRailOrientationSolver"
import { ResistorDividerCapacitorPlacementSolver } from "../ResistorDividerCapacitorPlacementSolver/ResistorDividerCapacitorPlacementSolver"
import { SeriesResistorAlignmentSolver } from "../SeriesResistorAlignmentSolver/SeriesResistorAlignmentSolver"
import { ParallelDiodeAlignmentSolver } from "../ParallelDiodeAlignmentSolver/ParallelDiodeAlignmentSolver"
import { SeriesRcBranchGroupingSolver } from "../SeriesRcBranchGroupingSolver/SeriesRcBranchGroupingSolver"
import { FuseDiodeAlignmentSolver } from "../FuseDiodeAlignmentSolver/FuseDiodeAlignmentSolver"
import { ChipPinPairInductorPlacementSolver } from "../ChipPinPairInductorPlacementSolver/ChipPinPairInductorPlacementSolver"
import { HighPassRcFilterPlacementSolver } from "../HighPassRcFilterPlacementSolver/HighPassRcFilterPlacementSolver"
import { ParallelDiodeCapacitorAlignmentSolver } from "../ParallelDiodeCapacitorAlignmentSolver/ParallelDiodeCapacitorAlignmentSolver"
import { ParallelLedBranchPlacementSolver } from "../ParallelLedBranchPlacementSolver/ParallelLedBranchPlacementSolver"
import { CrystalResistorPlacementSolver } from "../CrystalResistorPlacementSolver/CrystalResistorPlacementSolver"
import { SwitchRcNetworkGroupingSolver } from "../SwitchRcNetworkGroupingSolver/SwitchRcNetworkGroupingSolver"
import { SwitchMatrixDiodePlacementSolver } from "../SwitchMatrixDiodePlacementSolver/SwitchMatrixDiodePlacementSolver"
import { SeriesRcFilterPlacementSolver } from "../SeriesRcFilterPlacementSolver/SeriesRcFilterPlacementSolver"
import { ParallelResistorPlacementSolver } from "../ParallelResistorPlacementSolver/ParallelResistorPlacementSolver"
import { ParallelCapacitorAlignmentSolver } from "../ParallelCapacitorAlignmentSolver/ParallelCapacitorAlignmentSolver"
import { ChipPinCrystalPlacementSolver } from "../ChipPinCrystalPlacementSolver/ChipPinCrystalPlacementSolver"
import { SchematicBoxInnerLabelBoundsSolver } from "../SchematicBoxInnerLabelBoundsSolver/SchematicBoxInnerLabelBoundsSolver"
import { TransistorRailOrientationSolver } from "../TransistorRailOrientationSolver/TransistorRailOrientationSolver"
import { ChipSupplyInductorPlacementSolver } from "../ChipSupplyInductorPlacementSolver/ChipSupplyInductorPlacementSolver"
import { SharedNodeDiodePlacementSolver } from "../SharedNodeDiodePlacementSolver/SharedNodeDiodePlacementSolver"
import { DiodeCapacitorStagePlacementSolver } from "../DiodeCapacitorStagePlacementSolver/DiodeCapacitorStagePlacementSolver"
import { SeriesLedChainPlacementSolver } from "../SeriesLedChainPlacementSolver/SeriesLedChainPlacementSolver"
import { ParallelRcPlacementSolver } from "../ParallelRcPlacementSolver/ParallelRcPlacementSolver"
import { ChipPinResistorPlacementSolver } from "../ChipPinResistorPlacementSolver/ChipPinResistorPlacementSolver"
import { ParallelDiodeResistorPlacementSolver } from "../ParallelDiodeResistorPlacementSolver/ParallelDiodeResistorPlacementSolver"
import { RailPathVisibilitySolver } from "../RailPathVisibilitySolver/RailPathVisibilitySolver"
import { ChipPinPairCapacitorPlacementSolver } from "../ChipPinPairCapacitorPlacementSolver/ChipPinPairCapacitorPlacementSolver"
import { PiFilterPlacementSolver } from "../PiFilterPlacementSolver/PiFilterPlacementSolver"
import { MosfetGateNetworkPlacementSolver } from "../MosfetGateNetworkPlacementSolver/MosfetGateNetworkPlacementSolver"
import { RelayFlybackDiodePlacementSolver } from "../RelayFlybackDiodePlacementSolver/RelayFlybackDiodePlacementSolver"
import { CurrentSenseShuntPlacementSolver } from "../CurrentSenseShuntPlacementSolver/CurrentSenseShuntPlacementSolver"
import { VoltageDividerPlacementSolver } from "../VoltageDividerPlacementSolver/VoltageDividerPlacementSolver"
import { RegulatorInputOutputCapacitorPlacementSolver } from "../RegulatorInputOutputCapacitorPlacementSolver/RegulatorInputOutputCapacitorPlacementSolver"
import { ConnectorPlacementSolver } from "../ConnectorPlacementSolver/ConnectorPlacementSolver"
import { LowSideTransistorPlacementSolver } from "../LowSideTransistorPlacementSolver/LowSideTransistorPlacementSolver"
import { UsbSeriesResistorPlacementSolver } from "../UsbSeriesResistorPlacementSolver/UsbSeriesResistorPlacementSolver"
import {
  BasePipelineSolver,
  definePipelineStep,
  type PipelineStep,
} from "@tscircuit/solver-utils"
import type { CircuitJson } from "circuit-json"
import type {
  SchematicPlacementIssue,
  SchematicPlacementAnalysisOptions,
} from "../../types"
import { buildSolverContext } from "../../utils/placements"
import { CapacitorOrientationSolver } from "../CapacitorOrientationSolver/CapacitorOrientationSolver"
import { DecouplingCapacitorGroupingSolver } from "../DecouplingCapacitorGroupingSolver/DecouplingCapacitorGroupingSolver"
import { ComponentNetLabelCollisionSolver } from "../ComponentNetLabelCollisionSolver/ComponentNetLabelCollisionSolver"
import { ComponentPinAlignmentSolver } from "../ComponentPinAlignmentSolver/ComponentPinAlignmentSolver"
import { CrystalLoadCapacitorPlacementSolver } from "../CrystalLoadCapacitorPlacementSolver/CrystalLoadCapacitorPlacementSolver"
import { DiodeResistorAlignmentSolver } from "../DiodeResistorAlignmentSolver/DiodeResistorAlignmentSolver"
import { FeedbackNetworkPlacementSolver } from "../FeedbackNetworkPlacementSolver/FeedbackNetworkPlacementSolver"
import { PullResistorPlacementSolver } from "../PullResistorPlacementSolver/PullResistorPlacementSolver"
import { SwitchPullResistorPlacementSolver } from "../SwitchPullResistorPlacementSolver/SwitchPullResistorPlacementSolver"
import { TwoPinComponentRailOrientationSolver } from "../TwoPinComponentRailOrientationSolver/TwoPinComponentRailOrientationSolver"
import { SchematicBoxInnerLabelCollisionSolver } from "../SchematicBoxInnerLabelCollisionSolver/SchematicBoxInnerLabelCollisionSolver"
import { SchematicBoxOverlapSolver } from "../SchematicBoxOverlapSolver/SchematicBoxOverlapSolver"
import { SchematicBoxTooWideSolver } from "../SchematicBoxTooWideSolver/SchematicBoxTooWideSolver"
import { SchematicPinPaddingToEdgeSolver } from "../SchematicPinPaddingToEdgeSolver/SchematicPinPaddingToEdgeSolver"
import type { SolverContext } from "../SolverContext"
import { TraceSimplificationSolver } from "../TraceSimplificationSolver/TraceSimplificationSolver"
import { TwoPinComponentOrientationSolver } from "../TwoPinComponentOrientationSolver/TwoPinComponentOrientationSolver"
import { VerboseNetLabelSolver } from "../VerboseNetLabelSolver/VerboseNetLabelSolver"
import { SchematicTextClearanceSolver } from "../SchematicTextClearanceSolver/SchematicTextClearanceSolver"
import { ResetNetworkGroupingSolver } from "../ResetNetworkGroupingSolver/ResetNetworkGroupingSolver"

type SolverParams = {
  ctx: SolverContext
  issues: SchematicPlacementIssue[]
  maxSpan?: number
  maxLength?: number
}

// Include prerequisites used when deduplicating findings in getOutput().
const solversByIssueType = {
  ChipPinTestPointNotAligned: [ChipPinTestPointAlignmentSolver],
  CapacitorConnectorNotAligned: [CapacitorConnectorAlignmentSolver],
  ConnectorTestPointNotAligned: [ConnectorTestPointAlignmentSolver],
  InductorDiodeNotGrouped: [InductorDiodeGroupingSolver],
  InductorCapacitorNotGrouped: [InductorCapacitorGroupingSolver],
  ResistorTestPointNotAligned: [ResistorTestPointAlignmentSolver],
  ResistorConnectorNotAligned: [ResistorConnectorAlignmentSolver],
  FuseConnectorNotAligned: [FuseConnectorAlignmentSolver],
  TransistorLedNotAligned: [TransistorLedAlignmentSolver],
  TransistorResistorNotAligned: [TransistorResistorAlignmentSolver],
  PotentiometerHasIncorrectRailOrientation: [
    PotentiometerRailOrientationSolver,
  ],
  CapacitorSeparatedFromResistorDivider: [
    ResistorDividerCapacitorPlacementSolver,
  ],
  SeriesResistorsNotAligned: [SeriesResistorAlignmentSolver],
  FuseMosfetNotAligned: [FuseMosfetAlignmentSolver],
  ChipDiodeCapacitorNetworkNotGrouped: [
    ChipDiodeCapacitorNetworkGroupingSolver,
  ],
  LedResistorBranchSeparatedFromChipPin: [ChipLedResistorGroupingSolver],
  FuseDiodeNotAligned: [FuseDiodeAlignmentSolver],
  InductorSeparatedFromChipPins: [ChipPinPairInductorPlacementSolver],
  SwitchMatrixDiodeSeparatedFromSwitch: [SwitchMatrixDiodePlacementSolver],
  SwitchMatrixBranchesTooSpreadOut: [SwitchMatrixDiodePlacementSolver],
  TransistorHasIncorrectRailOrientation: [TransistorRailOrientationSolver],
  ParallelLedBranchesDrawnInline: [ParallelLedBranchPlacementSolver],
  SeriesLedChainNotOrdered: [SeriesLedChainPlacementSolver],
  RailPathTooSpreadOut: [RailPathVisibilitySolver],
  ResistorDividerSeparatedFromChip: [ChipPinResistorDividerPlacementSolver],
  ResistorSeparatedFromChipPin: [ChipPinResistorPlacementSolver],
  InductorSeparatedFromChipPin: [ChipSupplyInductorPlacementSolver],
  RrcTimingNetworkNotGrouped: [RrcTimingNetworkGroupingSolver],
  CapacitorSeparatedFromChipPins: [ChipPinPairCapacitorPlacementSolver],
  CrystalSeparatedFromChipPins: [ChipPinCrystalPlacementSolver],
  SharedNodeDiodesInline: [SharedNodeDiodePlacementSolver],
  DiodeCapacitorJunctionTooSpreadOut: [DiodeCapacitorStagePlacementSolver],
  PiFilterComponentsNotGrouped: [PiFilterPlacementSolver],
  MosfetGateNetworkNotGrouped: [MosfetGateNetworkPlacementSolver],
  FlybackDiodeSeparatedFromRelayCoil: [RelayFlybackDiodePlacementSolver],
  ComponentOverlap: [SchematicBoxOverlapSolver],
  // Retained in the issue union, but no solver currently emits this type.
  SchematicBoxHasALotOfSurroundingWhitespace: [],
  CapacitorSymbolHorizontal: [
    CapacitorOrientationSolver,
    TwoPinComponentRailOrientationSolver,
  ],
  VerboseSchematicNetLabel: [VerboseNetLabelSolver],
  PinHeaderSchematicBoxTooWide: [SchematicBoxTooWideSolver],
  GenericSchematicBoxTooWide: [SchematicBoxTooWideSolver],
  SchematicBoxInnerLabelCollision: [SchematicBoxInnerLabelCollisionSolver],
  SchematicBoxInnerLabelOutOfBounds: [SchematicBoxInnerLabelBoundsSolver],
  SchematicPinPaddingToEdgeTooLarge: [SchematicPinPaddingToEdgeSolver],
  DiodeResistorNotAligned: [DiodeResistorAlignmentSolver],
  HighPassRcFilterComponentsNotGrouped: [HighPassRcFilterPlacementSolver],
  SeriesRcFilterComponentsNotGrouped: [SeriesRcFilterPlacementSolver],
  SwitchRcNetworkNotGrouped: [SwitchRcNetworkGroupingSolver],
  ParallelResistorsDrawnInline: [ParallelResistorPlacementSolver],
  ResistorSeparatedFromCrystal: [CrystalResistorPlacementSolver],
  ParallelCapacitorsDrawnInline: [ParallelCapacitorAlignmentSolver],
  ParallelRcNotAligned: [ParallelRcPlacementSolver],
  ParallelDiodeResistorNotAligned: [ParallelDiodeResistorPlacementSolver],
  ParallelDiodesNotAligned: [ParallelDiodeAlignmentSolver],
  SeriesRcBranchNotGrouped: [SeriesRcBranchGroupingSolver],
  ParallelDiodeCapacitorNotAligned: [ParallelDiodeCapacitorAlignmentSolver],
  ComponentPinsWouldAlignWithVerticalShift: [ComponentPinAlignmentSolver],
  TraceCanBeSimplifiedByMovingComponent: [TraceSimplificationSolver],
  CrystalNotCenteredOverLoadCapacitors: [CrystalLoadCapacitorPlacementSolver],
  ComponentNetLabelCollision: [ComponentNetLabelCollisionSolver],
  ComponentBoxNetLabelCollision: [ComponentNetLabelCollisionSolver],
  NetLabelCollision: [ComponentNetLabelCollisionSolver],
  FeedbackNetworkNotCompact: [FeedbackNetworkPlacementSolver],
  PullResistorOnWrongSide: [
    PullResistorPlacementSolver,
    SwitchPullResistorPlacementSolver,
  ],
  SchematicTextCollision: [SchematicTextClearanceSolver],
  ResetNetworkNotGrouped: [ResetNetworkGroupingSolver],
  TwoPinComponentCouldBeFlipped: [TwoPinComponentOrientationSolver],
  TwoPinComponentShouldBeVertical: [TwoPinComponentRailOrientationSolver],
  TwoPinComponentHasInvertedRails: [TwoPinComponentRailOrientationSolver],
  DecouplingCapacitorsNotCloseTogether: [DecouplingCapacitorGroupingSolver],
  ConnectorPositionCausesTraceDetours: [ConnectorPlacementSolver],
  LowSideTransistorNotAlignedWithLoad: [LowSideTransistorPlacementSolver],
  UsbSeriesResistorsNotAligned: [UsbSeriesResistorPlacementSolver],
  CurrentSenseShuntSeparatedFromInputs: [CurrentSenseShuntPlacementSolver],
  VoltageDividerNetworkNotGrouped: [VoltageDividerPlacementSolver],
  VoltageDividerSupplyResistorBelowGroundResistor: [
    VoltageDividerPlacementSolver,
  ],
  RegulatorCapacitorsOnWrongSides: [
    RegulatorInputOutputCapacitorPlacementSolver,
  ],
} satisfies Record<
  SchematicPlacementIssue["lineItemType"],
  readonly PipelineStep<any>["solverClass"][]
>

export class SchematicPlacementPipeline extends BasePipelineSolver<CircuitJson> {
  ctx!: SolverContext
  readonly issues: SchematicPlacementIssue[] = []

  pipelineDef: PipelineStep<any>[] = [
    definePipelineStep(
      "FuseConnectorAlignmentSolver",
      FuseConnectorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TransistorLedAlignmentSolver",
      TransistorLedAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TransistorResistorAlignmentSolver",
      TransistorResistorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "PotentiometerRailOrientationSolver",
      PotentiometerRailOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ResistorDividerCapacitorPlacementSolver",
      ResistorDividerCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SeriesResistorAlignmentSolver",
      SeriesResistorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "FuseMosfetAlignmentSolver",
      FuseMosfetAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipDiodeCapacitorNetworkGroupingSolver",
      ChipDiodeCapacitorNetworkGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipLedResistorGroupingSolver",
      ChipLedResistorGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "FuseDiodeAlignmentSolver",
      FuseDiodeAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SwitchRcNetworkGroupingSolver",
      SwitchRcNetworkGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SwitchMatrixDiodePlacementSolver",
      SwitchMatrixDiodePlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelResistorPlacementSolver",
      ParallelResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelLedBranchPlacementSolver",
      ParallelLedBranchPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SeriesLedChainPlacementSolver",
      SeriesLedChainPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelRcPlacementSolver",
      ParallelRcPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelDiodeResistorPlacementSolver",
      ParallelDiodeResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelDiodeAlignmentSolver",
      ParallelDiodeAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SeriesRcBranchGroupingSolver",
      SeriesRcBranchGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelDiodeCapacitorAlignmentSolver",
      ParallelDiodeCapacitorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicTextClearanceSolver",
      SchematicTextClearanceSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ResetNetworkGroupingSolver",
      ResetNetworkGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxOverlapSolver",
      SchematicBoxOverlapSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CapacitorOrientationSolver",
      CapacitorOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "VerboseNetLabelSolver",
      VerboseNetLabelSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxTooWideSolver",
      SchematicBoxTooWideSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicPinPaddingToEdgeSolver",
      SchematicPinPaddingToEdgeSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxInnerLabelBoundsSolver",
      SchematicBoxInnerLabelBoundsSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SchematicBoxInnerLabelCollisionSolver",
      SchematicBoxInnerLabelCollisionSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "DiodeResistorAlignmentSolver",
      DiodeResistorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ComponentPinAlignmentSolver",
      ComponentPinAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TraceSimplificationSolver",
      TraceSimplificationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CrystalLoadCapacitorPlacementSolver",
      CrystalLoadCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TwoPinComponentOrientationSolver",
      TwoPinComponentOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "FeedbackNetworkPlacementSolver",
      FeedbackNetworkPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TransistorRailOrientationSolver",
      TransistorRailOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "TwoPinComponentRailOrientationSolver",
      TwoPinComponentRailOrientationSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "PullResistorPlacementSolver",
      PullResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SwitchPullResistorPlacementSolver",
      SwitchPullResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ComponentNetLabelCollisionSolver",
      ComponentNetLabelCollisionSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "DecouplingCapacitorGroupingSolver",
      DecouplingCapacitorGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ConnectorPlacementSolver",
      ConnectorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "LowSideTransistorPlacementSolver",
      LowSideTransistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "UsbSeriesResistorPlacementSolver",
      UsbSeriesResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RegulatorInputOutputCapacitorPlacementSolver",
      RegulatorInputOutputCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "VoltageDividerPlacementSolver",
      VoltageDividerPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CurrentSenseShuntPlacementSolver",
      CurrentSenseShuntPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RelayFlybackDiodePlacementSolver",
      RelayFlybackDiodePlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SharedNodeDiodePlacementSolver",
      SharedNodeDiodePlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "DiodeCapacitorStagePlacementSolver",
      DiodeCapacitorStagePlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "PiFilterPlacementSolver",
      PiFilterPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "MosfetGateNetworkPlacementSolver",
      MosfetGateNetworkPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipSupplyInductorPlacementSolver",
      ChipSupplyInductorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinResistorPlacementSolver",
      ChipPinResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RrcTimingNetworkGroupingSolver",
      RrcTimingNetworkGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinPairCapacitorPlacementSolver",
      ChipPinPairCapacitorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinCrystalPlacementSolver",
      ChipPinCrystalPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "RailPathVisibilitySolver",
      RailPathVisibilitySolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        {
          ctx: p.ctx,
          issues: p.issues,
          maxSpan: p.railPathVisibility?.maxSpan,
          maxLength: p.railPathVisibility?.maxPathLength,
        },
      ],
    ),
    definePipelineStep(
      "HighPassRcFilterPlacementSolver",
      HighPassRcFilterPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "SeriesRcFilterPlacementSolver",
      SeriesRcFilterPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CrystalResistorPlacementSolver",
      CrystalResistorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ParallelCapacitorAlignmentSolver",
      ParallelCapacitorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinPairInductorPlacementSolver",
      ChipPinPairInductorPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinTestPointAlignmentSolver",
      ChipPinTestPointAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ResistorTestPointAlignmentSolver",
      ResistorTestPointAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "CapacitorConnectorAlignmentSolver",
      CapacitorConnectorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ResistorConnectorAlignmentSolver",
      ResistorConnectorAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ConnectorTestPointAlignmentSolver",
      ConnectorTestPointAlignmentSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "InductorCapacitorGroupingSolver",
      InductorCapacitorGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "ChipPinResistorDividerPlacementSolver",
      ChipPinResistorDividerPlacementSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
    definePipelineStep(
      "InductorDiodeGroupingSolver",
      InductorDiodeGroupingSolver,
      (p: SchematicPlacementPipeline): [SolverParams] => [
        { ctx: p.ctx, issues: p.issues },
      ],
    ),
  ]

  private readonly selectedIssueTypes?: Set<
    SchematicPlacementIssue["lineItemType"]
  >

  private readonly railPathVisibility: SchematicPlacementAnalysisOptions["railPathVisibility"]

  constructor(
    circuitJson: CircuitJson,
    options: SchematicPlacementAnalysisOptions = {},
  ) {
    super(circuitJson)
    this.railPathVisibility = options.railPathVisibility
    if (options.issueTypes !== undefined) {
      this.selectedIssueTypes = new Set(options.issueTypes)
      const selectedSolvers = new Set<PipelineStep<any>["solverClass"]>(
        options.issueTypes.flatMap<PipelineStep<any>["solverClass"]>(
          (type) => solversByIssueType[type],
        ),
      )
      this.pipelineDef = this.pipelineDef.filter((step) =>
        selectedSolvers.has(step.solverClass),
      )
    }
  }

  override _setup(): void {
    this.ctx = buildSolverContext(this.inputProblem)
  }

  override getOutput() {
    // Prefer the rail-aware rotation over a duplicate generic capacitor warning.
    // The capacitor solver still reports horizontal capacitors outside this rule.
    const railOrientationComponentIds = new Set(
      this.issues.flatMap((issue) =>
        issue.lineItemType === "TwoPinComponentShouldBeVertical" &&
        issue.schematicBox.schematicComponentId
          ? [issue.schematicBox.schematicComponentId]
          : [],
      ),
    )
    return {
      issues: this.issues
        .filter(
          (issue) =>
            issue.lineItemType !== "CapacitorSymbolHorizontal" ||
            !railOrientationComponentIds.has(
              issue.schematicBox.schematicComponentId ?? "",
            ),
        )
        .filter(
          (issue) =>
            this.selectedIssueTypes === undefined ||
            this.selectedIssueTypes.has(issue.lineItemType),
        ),
      componentPlacements: this.ctx.componentPlacements,
    }
  }
}
