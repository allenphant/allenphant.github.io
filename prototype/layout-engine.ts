import { layoutNextLine, type PreparedTextWithSegments, type LayoutCursor } from '@chenglou/pretext'

// Types adapted from wrap-geometry.ts
export type Rect = { x: number; y: number; width: number; height: number }
export type Interval = { left: number; right: number }
export type PositionedLine = { x: number; y: number; text: string; width: number; slotWidth: number; isLastLine?: boolean }

/**
 * Given one allowed horizontal interval and a set of blocked intervals,
 * carve out the remaining usable text slots for one text line band.
 * Copied from @chenglou/pretext/pages/demos/wrap-geometry.ts:136-155
 */
export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base]

  for (let blockedIndex = 0; blockedIndex < blocked.length; blockedIndex++) {
    const interval = blocked[blockedIndex]!
    const next: Interval[] = []
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex]!
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left })
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right })
    }
    slots = next
  }

  // Discard absurdly narrow slivers
  return slots.filter(slot => slot.right - slot.left >= 24)
}

/**
 * Lay out text line by line with variable width per line.
 * Adapted from dynamic-layout.ts:275-341.
 *
 * For each line band [lineTop, lineTop+lineHeight]:
 * 1. Ask getBlockedForBand() what intervals are blocked by obstacles
 * 2. Carve out usable slots with carveTextLineSlots()
 * 3. Render text in ALL available slots at this y (left AND right of obstacle)
 *    — this produces the two-sided wrap-around "water flow" effect
 * 4. Call layoutNextLine() for each slot, advancing the text cursor each time
 */
export function layoutColumn(
  prepared: PreparedTextWithSegments,
  startCursor: LayoutCursor,
  region: Rect,
  lineHeight: number,
  getBlockedForBand: (bandTop: number, bandBottom: number) => Interval[],
): PositionedLine[] {
  let cursor: LayoutCursor = startCursor
  let lineTop = region.y
  const lines: PositionedLine[] = []
  let exhausted = false

  while (!exhausted && lineTop + lineHeight <= region.y + region.height) {
    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight

    const blocked = getBlockedForBand(bandTop, bandBottom)
    const slots = carveTextLineSlots(
      { left: region.x, right: region.x + region.width },
      blocked,
    )

    if (slots.length === 0) {
      // Entire line is blocked by obstacle — skip this line
      lineTop += lineHeight
      continue
    }

    // Render text in EVERY slot at this y position.
    // When there are 2 slots (left + right of obstacle), text flows through
    // both — exactly like water parting around a rock.
    for (const slot of slots) {
      const slotWidth = slot.right - slot.left
      const line = layoutNextLine(prepared, cursor, slotWidth)
      if (line === null) {
        exhausted = true
        break
      }
      lines.push({
        x: slot.left,
        y: lineTop,
        text: line.text,
        width: line.width,
        slotWidth: slotWidth,
      })
      cursor = line.end
    }

    lineTop += lineHeight
  }

  return lines
}
