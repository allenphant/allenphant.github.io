import type { Interval } from './layout-engine'

/**
 * Compute the horizontal interval blocked by a circle for a given text line band.
 *
 * Math: A circle (cx, cy, radius) intersects a horizontal band [bandTop, bandBottom]
 * when the closest y-point on the band to cy is within radius.
 * The blocked x-interval uses the widest cross-section of the circle within the band.
 */
export function getCircleIntervalForBand(
  cx: number,
  cy: number,
  radius: number,
  bandTop: number,
  bandBottom: number,
): Interval | null {
  const closestY = Math.max(bandTop, Math.min(cy, bandBottom))
  const dy = Math.abs(cy - closestY)
  if (dy >= radius) return null
  const halfWidth = Math.sqrt(radius * radius - dy * dy)
  return { left: cx - halfWidth, right: cx + halfWidth }
}

/**
 * Compute the horizontal interval blocked by an ellipse for a text line band.
 * rx = half-width, ry = half-height of the ellipse.
 * Equation: (dx/rx)² + (dy/ry)² = 1  →  dx = rx * sqrt(1 - (dy/ry)²)
 */
export function getEllipseIntervalForBand(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  bandTop: number,
  bandBottom: number,
): Interval | null {
  const closestY = Math.max(bandTop, Math.min(cy, bandBottom))
  const dy = Math.abs(cy - closestY)
  if (dy >= ry) return null
  const halfWidth = rx * Math.sqrt(1 - (dy / ry) ** 2)
  return { left: cx - halfWidth, right: cx + halfWidth }
}
