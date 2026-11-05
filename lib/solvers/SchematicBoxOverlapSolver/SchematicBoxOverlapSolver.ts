import { BaseSolver } from "@tscircuit/solver-utils"
import type {
  ComponentOverlap,
  OverlapCorrectionSuggestion,
  SchematicBoxPlacement,
  SchematicPlacementIssue,
} from "../../types"
import type { SolverContext } from "../SolverContext"
import { addAttr } from "../../utils/format"
import { getExternalBoxPins, getPinBodyOverlaps } from "./box-pins"

interface RectBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export class SchematicBoxOverlapSolver extends BaseSolver {
  private readonly placements: SchematicBoxPlacement[]
  private readonly externalPins: ReturnType<typeof getExternalBoxPins>
  private firstIndex = 0
  private secondIndex = 1

  constructor(
    private readonly params: {
      ctx: SolverContext
      issues: SchematicPlacementIssue[]
    },
  ) {
    super()
    this.placements = params.ctx.componentPlacements
    this.externalPins = getExternalBoxPins(params.ctx)
    this.solved = this.placements.length < 2
  }

  override _step(): void {
    if (this.firstIndex >= this.placements.length - 1) {
      this.solved = true
      return
    }

    const overlap = this.getComponentOverlap(
      this.placements[this.firstIndex]!,
      this.placements[this.secondIndex]!,
    )
    if (overlap) this.params.issues.push(overlap)

    this.secondIndex++
    if (this.secondIndex >= this.placements.length) {
      this.firstIndex++
      this.secondIndex = this.firstIndex + 1
    }

    this.solved = this.firstIndex >= this.placements.length - 1
  }

  private getCenteredRectBounds(box: SchematicBoxPlacement): RectBounds {
    return {
      left: box.schX - box.width / 2,
      right: box.schX + box.width / 2,
      top: box.schY - box.height / 2,
      bottom: box.schY + box.height / 2,
    }
  }

  private getOverlapCorrectionSuggestions({
    firstComponent,
    secondComponent,
    overlapWidth,
    overlapHeight,
  }: {
    firstComponent: SchematicBoxPlacement
    secondComponent: SchematicBoxPlacement
    overlapWidth: number
    overlapHeight: number
  }): OverlapCorrectionSuggestion[] {
    const firstArea = firstComponent.width * firstComponent.height
    const secondArea = secondComponent.width * secondComponent.height
    const target = firstArea <= secondArea ? firstComponent : secondComponent
    const other = target === firstComponent ? secondComponent : firstComponent
    const deltaSchX = target.schX <= other.schX ? -overlapWidth : overlapWidth
    const deltaSchY = target.schY <= other.schY ? -overlapHeight : overlapHeight
    return [
      {
        targetComponentName: target.sourceComponentName,
        deltaSchX,
        deltaSchY: 0,
        newSchX: target.schX + deltaSchX,
        newSchY: target.schY,
      },
      {
        targetComponentName: target.sourceComponentName,
        deltaSchX: 0,
        deltaSchY,
        newSchX: target.schX,
        newSchY: target.schY + deltaSchY,
      },
    ]
  }

  static issueToString(issue: ComponentOverlap): string {
    const attrs: string[] = []
    addAttr(attrs, "component1Name", issue.firstComponent.sourceComponentName)
    addAttr(attrs, "component2Name", issue.secondComponent.sourceComponentName)
    addAttr(attrs, "component1SchX", issue.firstComponent.schX)
    addAttr(attrs, "component1SchY", issue.firstComponent.schY)
    addAttr(attrs, "component2SchX", issue.secondComponent.schX)
    addAttr(attrs, "component2SchY", issue.secondComponent.schY)
    addAttr(attrs, "overlapWidth", issue.overlapWidth)
    addAttr(attrs, "overlapHeight", issue.overlapHeight)
    if (issue.pinBodyOverlaps?.length) {
      addAttr(attrs, "reason", "pin_body_overlap")
      addAttr(
        attrs,
        "pins",
        issue.pinBodyOverlaps
          .map(
            (p) => `${p.componentName ?? "component"}.${p.pinNumber ?? "pin"}`,
          )
          .join(", "),
      )
      addAttr(
        attrs,
        "message",
        "Separate the components so their external pins clear neighboring bodies. Preserve pin order and connections, leave room for labels, and reroute affected traces.",
      )
    }
    return [
      `<ComponentOverlap ${attrs.join(" ")}>`,
      ...issue.correctionSuggestions.map(
        SchematicBoxOverlapSolver.correctionSuggestionToString,
      ),
      "</ComponentOverlap>",
    ].join("\n")
  }

  private static correctionSuggestionToString(
    suggestion: OverlapCorrectionSuggestion,
  ): string {
    const attrs: string[] = []
    addAttr(attrs, "target", suggestion.targetComponentName)
    if (suggestion.deltaSchX !== 0) {
      addAttr(attrs, "newSchX", suggestion.newSchX)
      addAttr(attrs, "deltaSchX", suggestion.deltaSchX, { formatDelta: true })
    }
    if (suggestion.deltaSchY !== 0) {
      addAttr(attrs, "newSchY", suggestion.newSchY)
      addAttr(attrs, "deltaSchY", suggestion.deltaSchY, { formatDelta: true })
    }
    return `<OverlapCorrectionSuggestion ${attrs.join(" ")} />`
  }

  private getPinOverlap(
    firstComponent: SchematicBoxPlacement,
    secondComponent: SchematicBoxPlacement,
  ): ComponentOverlap | null {
    const firstPins = this.externalPins.get(
        firstComponent.schematicComponentId ?? "",
      ),
      secondPins = this.externalPins.get(
        secondComponent.schematicComponentId ?? "",
      )
    if (!firstPins || !secondPins) return null
    const pinBodyOverlaps = [
      ...getPinBodyOverlaps(firstPins, secondComponent),
      ...getPinBodyOverlaps(secondPins, firstComponent),
    ]
    if (!pinBodyOverlaps.length) return null
    const points = pinBodyOverlaps.flatMap((p) => [p.start, p.end])
    // Clearing the two occupied envelopes also clears reciprocal pin/body hits.
    const bounds = (b: SchematicBoxPlacement, pins: typeof firstPins) => ({
      left: Math.min(b.schX - b.width / 2, ...pins.map((p) => p.end.x)),
      right: Math.max(b.schX + b.width / 2, ...pins.map((p) => p.end.x)),
      bottom: Math.min(b.schY - b.height / 2, ...pins.map((p) => p.end.y)),
      top: Math.max(b.schY + b.height / 2, ...pins.map((p) => p.end.y)),
    })
    const target =
      firstComponent.width * firstComponent.height <=
      secondComponent.width * secondComponent.height
        ? firstComponent
        : secondComponent
    const other = target === firstComponent ? secondComponent : firstComponent
    const a = bounds(
        target,
        target === firstComponent ? firstPins : secondPins,
      ),
      b = bounds(other, target === firstComponent ? secondPins : firstPins)
    const clearance = 0.1
    const dx =
      target.schX <= other.schX
        ? b.left - a.right - clearance
        : b.right - a.left + clearance
    const dy =
      target.schY <= other.schY
        ? b.bottom - a.top - clearance
        : b.top - a.bottom + clearance
    return {
      lineItemType: "ComponentOverlap",
      firstComponent,
      secondComponent,
      pinBodyOverlaps,
      overlapWidth:
        Math.max(...points.map((p) => p.x)) -
        Math.min(...points.map((p) => p.x)),
      overlapHeight:
        Math.max(...points.map((p) => p.y)) -
        Math.min(...points.map((p) => p.y)),
      correctionSuggestions: [
        {
          targetComponentName: target.sourceComponentName,
          deltaSchX: dx,
          deltaSchY: 0,
          newSchX: target.schX + dx,
          newSchY: target.schY,
        },
        {
          targetComponentName: target.sourceComponentName,
          deltaSchX: 0,
          deltaSchY: dy,
          newSchX: target.schX,
          newSchY: target.schY + dy,
        },
      ],
    }
  }

  private getComponentOverlap(
    firstComponent: SchematicBoxPlacement,
    secondComponent: SchematicBoxPlacement,
  ): ComponentOverlap | null {
    if (firstComponent.schematicSheetId !== secondComponent.schematicSheetId)
      return null

    const a = this.getCenteredRectBounds(firstComponent)
    const b = this.getCenteredRectBounds(secondComponent)
    const overlapWidth = Math.min(a.right, b.right) - Math.max(a.left, b.left)
    const overlapHeight = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)

    if (overlapWidth <= 1e-9 || overlapHeight <= 1e-9)
      return this.getPinOverlap(firstComponent, secondComponent)

    return {
      lineItemType: "ComponentOverlap",
      firstComponent,
      secondComponent,
      overlapWidth,
      overlapHeight,
      correctionSuggestions: this.getOverlapCorrectionSuggestions({
        firstComponent,
        secondComponent,
        overlapWidth,
        overlapHeight,
      }),
    }
  }
}
