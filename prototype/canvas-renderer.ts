import type { PositionedLine } from './layout-engine'

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bgColor: string,
): void {
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
}

export function renderText(
  ctx: CanvasRenderingContext2D,
  lines: PositionedLine[],
  font: string,
  lineHeight: number,
  textColor: string,
): void {
  ctx.font = font
  ctx.fillStyle = textColor
  ctx.textBaseline = 'top'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    ctx.fillText(line.text, line.x, line.y)
  }
}
