import { useRef, useEffect } from 'react'
import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext'
import { layoutColumn, type Interval, type PositionedLine, type Rect } from '../../prototype/layout-engine'
import { createCursor, updateCursor, type CursorState, type SpriteState } from '../../prototype/cursor'
import { getEllipseIntervalForBand } from '../../prototype/obstacle'
import { BIO_PARAGRAPHS } from '../../prototype/text-content'

// ─── Sprite imports ───────────────────────────────────────────────────────────
import _idleF1Src      from '../../animation/frieren_idle_f1.svg?url'
import _idleF3Src      from '../../animation/frieren_idle_f3.svg?url'
import _glidingF2Src   from '../../animation/frieren_gliding_f2.svg?url'
import _glidingF3Src   from '../../animation/frieren_gliding_f3.svg?url'
import _dashingF0Src   from '../../animation/frieren_dashing_f0.svg?url'
import _attackingF2Src from '../../animation/frieren_attacking_f2.svg?url'
import _mimicClosedSrc   from '../../animation/mimic_closed_f0.svg?url'
import _mimicChompF0Src  from '../../animation/mimic_chomping_f0.svg?url'
import _mimicChompF1Src  from '../../animation/mimic_chomping_f1.svg?url'
import _mimicChompF2Src  from '../../animation/mimic_chomping_f2.svg?url'
import _mimicChompF3Src  from '../../animation/mimic_chomping_f3.svg?url'
import _mimicChewF0Src   from '../../animation/mimic_chewing_f0.svg?url'
import _mimicChewF1Src   from '../../animation/mimic_chewing_f1.svg?url'
import _mimicChewF2Src   from '../../animation/mimic_chewing_f2.svg?url'
import _mimicChewF3Src   from '../../animation/mimic_chewing_f3.svg?url'
import _fernWalkF0Src    from '../../animation/fern_walk4_f0.svg?url'
import _fernWalkF1Src    from '../../animation/fern_walk4_f1.svg?url'
import _fernWalkF2Src    from '../../animation/fern_walk4_f2.svg?url'
import _fernWalkF3Src    from '../../animation/fern_walk4_f3.svg?url'
import _fernWalkF4Src    from '../../animation/fern_walk4_f4.svg?url'
import _fernWalkF5Src    from '../../animation/fern_walk4_f5.svg?url'
import _fernWalkF6Src    from '../../animation/fern_walk4_f6.svg?url'
import _fernWalkF7Src    from '../../animation/fern_walk4_f7.svg?url'
import _fernPullF0Src    from '../../animation/fern_pulling_f0.svg?url'
import _fernPullF1Src    from '../../animation/fern_pulling_f1.svg?url'
import _flowerSrc        from '../../animation/flower_nobg.png?url'

const idleF1Src      = _idleF1Src      as string
const idleF3Src      = _idleF3Src      as string
const glidingF2Src   = _glidingF2Src   as string
const glidingF3Src   = _glidingF3Src   as string
const dashingF0Src   = _dashingF0Src   as string
const attackingF2Src = _attackingF2Src as string
const mimicClosedSrc  = _mimicClosedSrc  as string
const mimicChompF0Src = _mimicChompF0Src as string
const mimicChompF1Src = _mimicChompF1Src as string
const mimicChompF2Src = _mimicChompF2Src as string
const mimicChompF3Src = _mimicChompF3Src as string
const mimicChewF0Src  = _mimicChewF0Src  as string
const mimicChewF1Src  = _mimicChewF1Src  as string
const mimicChewF2Src  = _mimicChewF2Src  as string
const mimicChewF3Src  = _mimicChewF3Src  as string
const fernWalkF0Src   = _fernWalkF0Src   as string
const fernWalkF1Src   = _fernWalkF1Src   as string
const fernWalkF2Src   = _fernWalkF2Src   as string
const fernWalkF3Src   = _fernWalkF3Src   as string
const fernWalkF4Src   = _fernWalkF4Src   as string
const fernWalkF5Src   = _fernWalkF5Src   as string
const fernWalkF6Src   = _fernWalkF6Src   as string
const fernWalkF7Src   = _fernWalkF7Src   as string
const fernPullF0Src   = _fernPullF0Src   as string
const fernPullF1Src   = _fernPullF1Src   as string
const flowerSrc       = _flowerSrc       as string

// ─── Constants ────────────────────────────────────────────────────────────────
const TEXT_COLOR  = '#3B3B58'
const MAGIC_COLOR = '#7DA2A9'
const GOLD_COLOR  = '#C5A059'
const FONT        = '20px "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif'
const LINE_HEIGHT = 32
const GUTTER      = 60
const CURSOR_SIZE = 128
const FADE_PX     = 80
const PARA_GAP    = Math.round(LINE_HEIGHT * 0.75)
const LAYOUT_MAX_HEIGHT = 20000  // generous upper bound for text layout (px)

// Simulation constants are tuned per 60Hz frame; elapsed time is converted to
// "60Hz steps" so motion is identical at 60/120/144Hz.
const FRAME_MS        = 1000 / 60
const MAX_FRAME_STEPS = 3      // clamp after stalls so nothing teleports

const BEAM_DURATION    = 500
const BEAM_TEXT_RADIUS = 40

const MIMIC_HITBOX_R   = 70
const FERN_RUN_MS      = 2000  // Fern's walk to the mimic takes a fixed time, on any refresh rate
const TRAP_COOLDOWN_MS = 3000
const PULL_DURATION_MS = 1500

const MIMIC_SIZE      = 128
const MIMIC_CHOMP_FPS = 8
const MIMIC_CHEW_FPS  = 4
const FERN_SIZE       = 144
const FERN_PULL_SIZE  = 180
const FERN_WALK_FPS   = 6
const FERN_PULL_FPS   = 3
const SPRITE_FPS      = 2
const ATTACKING_FPS   = 4
const STAFF_TIP_X     = 52
const STAFF_TIP_Y     = -15

const SPRITE_DISPLAY_SCALE: Partial<Record<SpriteState, number>> = {
  idle: 1.1, gliding: 1.2, dashing: 1.0, attacking: 1.1,
}

// ─── Background flower positions (generated once at module load) ──────────────
const BG_FLOWERS = Array.from({ length: 40 }, () => ({
  x:    Math.random(),
  y:    Math.random(),
  size: 22 + Math.random() * 20,
  a:    0.10 + Math.random() * 0.16,
  rot:  Math.random() * Math.PI * 2,
}))

// ─── Types ────────────────────────────────────────────────────────────────────
type ZoltraakBeam = {
  x1: number; y1: number; x2: number; y2: number
  startTime: number
}
type MimicAnimState = 'closed' | 'chomping' | 'chewing'
type RowBounds = { left: number; right: number } | null
interface Hitmap { rows: RowBounds[]; size: number; img: HTMLImageElement; facingLeft: boolean }

// ─── Pure helpers ─────────────────────────────────────────────────────────────
function loadFrames(srcs: string[], onReady: () => void): HTMLImageElement[] {
  const frames: HTMLImageElement[] = []
  let count = 0
  for (const src of srcs) {
    const img = new Image()
    img.onload = () => { count++; if (count === srcs.length) onReady() }
    img.src = src
    frames.push(img)
  }
  return frames
}

function lerpColor(from: string, to: string, t: number): string {
  const hexToRgb = (h: string) => {
    const n = parseInt(h.slice(1), 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
  }
  const f = hexToRgb(from), tt = hexToRgb(to)
  return `rgb(${Math.round(f.r + (tt.r - f.r) * t)},${Math.round(f.g + (tt.g - f.g) * t)},${Math.round(f.b + (tt.b - f.b) * t)})`
}

function spriteScale(state: SpriteState): [number, number] {
  return state === 'dashing' ? [1.4, 0.8] : [1, 1]
}

function spriteColorForState(state: SpriteState): string {
  switch (state) {
    case 'idle':      return GOLD_COLOR
    case 'gliding':   return '#D4B86A'
    case 'dashing':   return MAGIC_COLOR
    case 'attacking': return '#FFE066'
    case 'trapped':   return '#CC4444'
  }
}

// ─── React Component ──────────────────────────────────────────────────────────
export default function FrierenLiquidText() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    // Non-null binding so nested closures don't need re-narrowing
    const canvas: HTMLCanvasElement = canvasEl
    const ctx = canvas.getContext('2d')!

    // ── Static layer (offscreen): background + laid-out text ──
    const layer = document.createElement('canvas')
    const lctx = layer.getContext('2d')!
    let layerKey = ''

    // ── Hitmap canvas (offscreen) ──
    const hitmapCanvas = document.createElement('canvas')
    hitmapCanvas.width = 256; hitmapCanvas.height = 256
    const hitmapCtx = hitmapCanvas.getContext('2d', { willReadFrequently: true })!
    let hitmap: Hitmap | null = null
    let currentSpriteFrame: HTMLImageElement | null = null
    let currentSpriteDrawSize = CURSOR_SIZE

    // ── Sprite frames ──
    let idleLoaded = false, glidingLoaded = false, dashingLoaded = false, attackingLoaded = false
    let mimicClosedLoaded = false, mimicChompingLoaded = false, mimicChewingLoaded = false
    let fernWalkLoaded = false, fernPullLoaded = false

    const idleFrames      = loadFrames([idleF1Src, idleF3Src],                                                               () => { idleLoaded      = true; scheduleRender() })
    const glidingFrames   = loadFrames([glidingF2Src, glidingF3Src],                                                         () => { glidingLoaded   = true; scheduleRender() })
    const dashingFrames   = loadFrames([dashingF0Src],                                                                       () => { dashingLoaded   = true; scheduleRender() })
    const attackingFrames = loadFrames([attackingF2Src],                                                                     () => { attackingLoaded = true; scheduleRender() })
    const mimicClosedFrames   = loadFrames([mimicClosedSrc],                                                                 () => { mimicClosedLoaded   = true; scheduleRender() })
    const mimicChompingFrames = loadFrames([mimicChompF0Src, mimicChompF1Src, mimicChompF2Src, mimicChompF3Src],             () => { mimicChompingLoaded = true; scheduleRender() })
    const mimicChewingFrames  = loadFrames([mimicChewF0Src, mimicChewF1Src, mimicChewF2Src, mimicChewF3Src],                () => { mimicChewingLoaded  = true; scheduleRender() })
    const fernWalkFrames = loadFrames([fernWalkF0Src, fernWalkF1Src, fernWalkF2Src, fernWalkF3Src, fernWalkF4Src, fernWalkF5Src, fernWalkF6Src, fernWalkF7Src], () => { fernWalkLoaded = true; scheduleRender() })
    const fernPullFrames = loadFrames([fernPullF0Src, fernPullF1Src],                                                        () => { fernPullLoaded = true; scheduleRender() })

    const flowerImg = new Image()
    flowerImg.onload = () => scheduleRender()
    flowerImg.src = flowerSrc

    // ── Game state ──
    const cursor: CursorState = createCursor(100)
    let prepared: PreparedTextWithSegments[] | null = null
    let rafId = 0
    let scheduled = false
    let canvasH = window.innerHeight  // updated in resizeCanvas; used for layout region

    let beams: ZoltraakBeam[] = []

    let mimicState: MimicAnimState = 'closed'
    let mimicX = -9999, mimicY = -9999  // placed dynamically after first layout pass
    let mimicPlaced = false
    let trapActive = false, chompStartTime = 0, trapCooldownEnd = 0
    let fernX = -200, fernY = 0
    let fernState: 'idle' | 'running' | 'pulling' = 'idle'
    let fernPullStartTime = 0
    let fernRunStartTime = 0, fernStartX = 0
    let fernTargetX = 0, fernTargetY = 0

    // ── Canvas resize ──
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      // Start tall; computeLayout will shrink canvas to fit actual text content
      const h = Math.round(window.innerHeight * 1.6)
      canvasH = h
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Reset mimic so computeLayout re-places it at the real text bottom-right,
      // and cancel any trap in progress (its anchor point is about to move)
      mimicX = -9999; mimicY = -9999; mimicPlaced = false
      fernTargetX = 0; fernTargetY = 0
      trapActive = false; cursor.trapped = false
      mimicState = 'closed'; fernState = 'idle'; fernX = -200
    }

    // ── Hitmap ──
    function buildHitmap(img: HTMLImageElement, size: number, facingLeft: boolean): Hitmap {
      hitmapCanvas.width = size; hitmapCanvas.height = size
      hitmapCtx.clearRect(0, 0, size, size)
      hitmapCtx.save()
      if (facingLeft) { hitmapCtx.translate(size, 0); hitmapCtx.scale(-1, 1) }
      hitmapCtx.drawImage(img, 0, 0, size, size)
      hitmapCtx.restore()
      const data = hitmapCtx.getImageData(0, 0, size, size).data
      const rows: RowBounds[] = []
      for (let y = 0; y < size; y++) {
        let left = -1, right = -1
        for (let x = 0; x < size; x++) {
          if (data[(y * size + x) * 4 + 3] > 20) { if (left === -1) left = x; right = x }
        }
        rows.push(left === -1 ? null : { left, right })
      }
      return { rows, size, img, facingLeft }
    }

    // sx/sy: the same scale renderCursor applies around the sprite centre
    // (e.g. the dash stretch), so the text gap matches what is drawn.
    function getSpriteInterval(cx: number, cy: number, hm: Hitmap, bandTop: number, bandBottom: number, sx = 1, sy = 1): Interval | null {
      const half = hm.size / 2
      const rowStart = Math.max(0, Math.floor((bandTop    - cy) / sy + half))
      const rowEnd   = Math.min(hm.size - 1, Math.ceil((bandBottom - cy) / sy + half))
      if (rowStart > rowEnd) return null
      let minL = Infinity, maxR = -Infinity
      for (let r = rowStart; r <= rowEnd; r++) {
        const b = hm.rows[r]; if (b) { minL = Math.min(minL, b.left); maxR = Math.max(maxR, b.right) }
      }
      if (minL === Infinity) return null
      return { left: cx + (minL - half) * sx - 5, right: cx + (maxR - half) * sx + 5 }
    }

    // ── Beam helpers ──
    function resolveBeamEndpoint(toX: number, toY: number): [number, number] {
      const dx = toX - cursor.x, dy = toY - cursor.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 10) {
        const dir = cursor.facingLeft ? -1 : 1
        return [cursor.x + dir * (window.innerWidth + 200), cursor.y]
      }
      const scale = (Math.max(window.innerWidth, window.innerHeight) * 1.5) / dist
      return [cursor.x + dx * scale, cursor.y + dy * scale]
    }

    function fireZoltraak(toX: number, toY: number, timestamp: number) {
      if (cursor.x < -1000 || cursor.trapped) return
      cursor.attackTimer = 30
      const staffSign = cursor.facingLeft ? -1 : 1
      const beamOriginX = cursor.x + staffSign * STAFF_TIP_X
      const beamOriginY = cursor.y + STAFF_TIP_Y
      const [endX, endY] = resolveBeamEndpoint(toX, toY)
      const bdx = endX - cursor.x, bdy = endY - cursor.y
      const blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1
      cursor.recoilVx = -(bdx / blen) * 12
      cursor.recoilVy = -(bdy / blen) * 12
      beams.push({ x1: beamOriginX, y1: beamOriginY, x2: endX, y2: endY, startTime: timestamp })
      scheduleRender()
    }

    // ── Mimic / Fern ──
    function checkMimicTrap(timestamp: number) {
      if (trapActive || cursor.x < -1000) return
      if (timestamp < trapCooldownEnd) return
      const dx = cursor.x - mimicX, dy = cursor.y - mimicY
      if (dx * dx + dy * dy < MIMIC_HITBOX_R * MIMIC_HITBOX_R) {
        trapActive = true; chompStartTime = timestamp; cursor.trapped = true
        mimicState = 'chomping'
        fernStartX = Math.max(0, mimicX - 600); fernX = fernStartX; fernY = mimicY
        fernRunStartTime = timestamp; fernState = 'running'
      }
    }

    function updateTrap(timestamp: number) {
      if (!trapActive) return
      if (mimicState === 'chomping' && timestamp - chompStartTime > 200) mimicState = 'chewing'
      if (fernState === 'running') {
        // Time-based walk: always FERN_RUN_MS, regardless of distance or refresh rate
        const t = Math.min(1, (timestamp - fernRunStartTime) / FERN_RUN_MS)
        fernX = fernStartX + (fernTargetX - fernStartX) * t
        if (t >= 1) { fernX = fernTargetX; fernState = 'pulling'; fernPullStartTime = timestamp }
      }
      if (fernState === 'pulling' && timestamp - fernPullStartTime > PULL_DURATION_MS) {
        trapActive = false; cursor.trapped = false
        trapCooldownEnd = timestamp + TRAP_COOLDOWN_MS
        mimicState = 'closed'; fernState = 'idle'; fernX = -200
      }
    }

    // ── Layout ──
    function getBeamIntervalForBand(x1: number, y1: number, x2: number, y2: number, radius: number, bandTop: number, bandBottom: number): Interval | null {
      const et = bandTop - radius, eb = bandBottom + radius
      const dx = x2 - x1, dy = y2 - y1
      let tEnter = 0, tExit = 1
      if (Math.abs(dy) > 0.001) {
        const tA = (et - y1) / dy, tB = (eb - y1) / dy
        tEnter = Math.max(0, Math.min(tA, tB)); tExit = Math.min(1, Math.max(tA, tB))
      } else {
        if (y1 < et || y1 > eb) return null
      }
      if (tEnter > tExit) return null
      const xA = x1 + tEnter * dx, xB = x1 + tExit * dx
      return { left: Math.min(xA, xB) - radius, right: Math.max(xA, xB) + radius }
    }

    function computeLayout(timestamp: number): PositionedLine[] {
      if (!prepared || prepared.length === 0) return []
      // The layout region must NOT be bounded by the current canvas height:
      // on narrow screens the text needs more than the initial canvas height,
      // and capping it here silently dropped the remaining paragraphs.
      // Lay out all text first; the canvas is resized to fit below.
      const region: Rect = { x: GUTTER, y: GUTTER, width: window.innerWidth - GUTTER * 2, height: LAYOUT_MAX_HEIGHT }

      const getBlocked = (bandTop: number, bandBottom: number): Interval[] => {
        const intervals: Interval[] = []

        // Frieren — pixel hitmap
        if (cursor.x > -1000 && !cursor.trapped) {
          if (currentSpriteFrame) {
            if (!hitmap || hitmap.img !== currentSpriteFrame || hitmap.size !== currentSpriteDrawSize || hitmap.facingLeft !== cursor.facingLeft) {
              hitmap = buildHitmap(currentSpriteFrame, currentSpriteDrawSize, cursor.facingLeft)
            }
            const [sx, sy] = spriteScale(cursor.spriteState)
            const si = getSpriteInterval(cursor.x, cursor.y, hitmap, bandTop, bandBottom, sx, sy)
            if (si) intervals.push(si)
          } else {
            const ci = getEllipseIntervalForBand(cursor.x, cursor.y, cursor.radius * 0.42, cursor.radius, bandTop, bandBottom)
            if (ci) intervals.push(ci)
          }
        }

        // Mimic — blocks once placed (position determined after first layout pass)
        if (mimicPlaced) {
          const mi = getEllipseIntervalForBand(mimicX, mimicY, MIMIC_SIZE * 0.6, MIMIC_SIZE * 0.6, bandTop, bandBottom)
          if (mi) intervals.push(mi)
        }

        // Fern
        if (fernState === 'running') {
          const fi = getEllipseIntervalForBand(fernX, fernY, FERN_SIZE * 0.35, FERN_SIZE * 0.5, bandTop, bandBottom)
          if (fi) intervals.push(fi)
        } else if (fernState === 'pulling') {
          const half = FERN_PULL_SIZE / 2
          if (bandBottom > mimicY - half && bandTop < mimicY + half) {
            intervals.push({ left: mimicX - 20 - half - 10, right: window.innerWidth + 100 })
          }
        }

        // Beams
        for (const beam of beams) {
          const age = Math.min(1, (timestamp - beam.startTime) / BEAM_DURATION)
          const effRadius = BEAM_TEXT_RADIUS * (1 - age)
          if (effRadius < 2) continue
          const bi = getBeamIntervalForBand(beam.x1, beam.y1, beam.x2, beam.y2, effRadius, bandTop, bandBottom)
          if (bi) intervals.push(bi)
        }

        return intervals
      }

      const allLines: PositionedLine[] = []
      let currentY = region.y
      for (const para of prepared) {
        const paraRegion: Rect = { x: region.x, y: currentY, width: region.width, height: region.y + region.height - currentY }
        const paraLines = layoutColumn(para, { segmentIndex: 0, graphemeIndex: 0 }, paraRegion, LINE_HEIGHT, getBlocked)
        if (paraLines.length === 0) break
        paraLines[paraLines.length - 1].isLastLine = true
        allLines.push(...paraLines)
        currentY = paraLines[paraLines.length - 1].y + LINE_HEIGHT + PARA_GAP
      }

      if (allLines.length > 0) {
        const lastLine = allLines[allLines.length - 1]

        // Pass 1: place mimic at the bottom-right corner of the text block
        if (!mimicPlaced) {
          mimicX = window.innerWidth - GUTTER - MIMIC_SIZE / 2
          mimicY = lastLine.y  // mimic center aligns with last line; top half overlaps last few lines
          fernTargetX = mimicX - 80; fernTargetY = mimicY
          mimicPlaced = true
          scheduleRender()  // trigger pass 2 which will apply mimic obstacle
        }

        // Auto-size canvas to fit text + mimic
        const contentBottom = Math.max(
          lastLine.y + LINE_HEIGHT,
          mimicPlaced ? mimicY + MIMIC_SIZE / 2 : 0
        ) + GUTTER
        if (Math.abs(contentBottom - canvasH) > LINE_HEIGHT) {
          canvasH = contentBottom
          const dpr = window.devicePixelRatio || 1
          canvas.height = contentBottom * dpr
          canvas.style.height = `${contentBottom}px`
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }
      }

      return allLines
    }

    // Text + background are drawn into an offscreen layer (lctx) and only
    // redrawn when something that affects them changes; see render().
    // ── Text rendering ──
    function setJustifySpacing(line: PositionedLine) {
      if (line.isLastLine) { ;(lctx as any).wordSpacing = '0px'; return }
      const spaces = (line.text.match(/ /g) ?? []).length
      if (spaces > 0 && line.width / line.slotWidth > 0.55) {
        ;(lctx as any).wordSpacing = `${(line.slotWidth - line.width) / spaces}px`
      } else {
        ;(lctx as any).wordSpacing = '0px'
      }
    }

    function findSplitIndex(text: string, targetX: number, lineStartX: number): number {
      const rel = targetX - lineStartX
      if (rel <= 0) return 0
      if (rel >= lctx.measureText(text).width) return text.length
      let lo = 0, hi = text.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (lctx.measureText(text.slice(0, mid)).width < rel) { lo = mid + 1 } else { hi = mid }
      }
      return lo
    }

    function renderTextWithProximityColor(lines: PositionedLine[]) {
      lctx.font = FONT; lctx.textBaseline = 'top'
      const onScreen = cursor.x > -1000
      for (const line of lines) {
        setJustifySpacing(line)
        if (!onScreen) { lctx.fillStyle = TEXT_COLOR; lctx.fillText(line.text, line.x, line.y); continue }
        const dy = Math.abs(line.y + LINE_HEIGHT / 2 - cursor.y)
        if (dy >= cursor.radius) { lctx.fillStyle = TEXT_COLOR; lctx.fillText(line.text, line.x, line.y); continue }
        const tint = 1 - dy / cursor.radius
        const lineMidX = line.x + line.width / 2
        if (lineMidX < cursor.x) {
          const fadeStart = line.x + line.width - FADE_PX * tint
          const si = findSplitIndex(line.text, fadeStart, line.x)
          const normal = line.text.slice(0, si), tinted = line.text.slice(si)
          lctx.fillStyle = TEXT_COLOR; if (normal) lctx.fillText(normal, line.x, line.y)
          if (tinted) { lctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tint); lctx.fillText(tinted, line.x + lctx.measureText(normal).width, line.y) }
        } else {
          const fadeEnd = line.x + FADE_PX * tint
          const si = findSplitIndex(line.text, fadeEnd, line.x)
          const tinted = line.text.slice(0, si), normal = line.text.slice(si)
          if (tinted) { lctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tint); lctx.fillText(tinted, line.x, line.y) }
          if (normal) { lctx.fillStyle = TEXT_COLOR; lctx.fillText(normal, line.x + lctx.measureText(tinted).width, line.y) }
        }
      }
      ;(lctx as any).wordSpacing = '0px'
    }

    // ── Background ──
    function renderBackground(w: number, h: number) {
      const grad = lctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0,    '#F0EAE2')   // matches site bg-primary — seamless top edge
      grad.addColorStop(0.55, '#E8EAF2')   // soft mid-tone
      grad.addColorStop(1,    '#D8DCF0')   // muted lavender-blue at bottom
      lctx.fillStyle = grad; lctx.fillRect(0, 0, w, h)

      if (flowerImg.complete && flowerImg.naturalWidth > 0) {
        lctx.save(); lctx.imageSmoothingEnabled = false
        for (const s of BG_FLOWERS) {
          lctx.save()
          lctx.globalAlpha = s.a
          lctx.translate(s.x * w, s.y * h)
          lctx.rotate(s.rot)
          lctx.drawImage(flowerImg, -s.size / 2, -s.size / 2, s.size, s.size)
          lctx.restore()
        }
        lctx.restore()
      }
    }

    // ── Cursor rendering ──
    function renderCursor(timestamp: number) {
      if (cursor.x < -1000 || cursor.trapped) return
      const floatOffset = Math.sin(timestamp / 300) * 4
      const cx = cursor.x, cy = cursor.y + floatOffset
      const [scaleX, scaleY] = spriteScale(cursor.spriteState)
      const alpha  = cursor.spriteState === 'attacking' ? 0.7 + 0.3 * Math.sin(timestamp / 40) : 1

      ctx.save()
      ctx.translate(cx, cy)
      if (cursor.facingLeft) ctx.scale(-1, 1)
      ctx.scale(scaleX, scaleY)
      ctx.globalAlpha = alpha
      if (cursor.spriteState === 'trapped') ctx.translate(Math.sin(timestamp / 60) * 3, 0)

      const spriteMap: Partial<Record<SpriteState, { frames: HTMLImageElement[], loaded: boolean, fps?: number }>> = {
        idle:      { frames: idleFrames,      loaded: idleLoaded },
        gliding:   { frames: glidingFrames,   loaded: glidingLoaded },
        dashing:   { frames: dashingFrames,   loaded: dashingLoaded },
        attacking: { frames: attackingFrames, loaded: attackingLoaded, fps: ATTACKING_FPS },
      }
      const entry = spriteMap[cursor.spriteState]
      if (entry?.loaded) {
        const fps = entry.fps ?? SPRITE_FPS
        const frameIdx = Math.floor(timestamp / (1000 / fps)) % entry.frames.length
        const scale = SPRITE_DISPLAY_SCALE[cursor.spriteState] ?? 1.0
        const drawSize = CURSOR_SIZE * scale
        currentSpriteFrame    = entry.frames[frameIdx]
        currentSpriteDrawSize = Math.round(drawSize)
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(entry.frames[frameIdx], -drawSize / 2, -drawSize / 2, drawSize, drawSize)
      } else {
        ctx.fillStyle = spriteColorForState(cursor.spriteState)
        ctx.fillRect(-CURSOR_SIZE / 2, -CURSOR_SIZE / 2, CURSOR_SIZE, CURSOR_SIZE)
        ctx.fillStyle = TEXT_COLOR
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(cursor.spriteState, 0, 0)
      }
      ctx.restore()
    }

    // ── Aim reticle ──
    function renderAimReticle() {
      if (cursor.mouseX < -1000 || cursor.trapped) return
      const mx = cursor.mouseX, my = cursor.mouseY, S = 8
      ctx.save()
      ctx.strokeStyle = MAGIC_COLOR; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7; ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(mx - S, my); ctx.lineTo(mx + S, my); ctx.moveTo(mx, my - S); ctx.lineTo(mx, my + S); ctx.stroke()
      ctx.globalAlpha = 0.4; ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.stroke()
      ctx.restore()
    }

    // ── Beam rendering ──
    function renderBeams(timestamp: number) {
      for (const b of beams) {
        const t = (timestamp - b.startTime) / BEAM_DURATION
        const alpha = Math.max(0, 1 - t * t)
        ctx.save()
        ctx.strokeStyle = MAGIC_COLOR; ctx.lineWidth = 28 * (1 - t) + 4; ctx.shadowBlur = 30; ctx.shadowColor = MAGIC_COLOR; ctx.globalAlpha = alpha * 0.35
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke()
        ctx.strokeStyle = '#DFFFFF'; ctx.lineWidth = 6 * (1 - t) + 1.5; ctx.shadowBlur = 10; ctx.shadowColor = '#fff'; ctx.globalAlpha = alpha
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke()
        ctx.restore()
      }
    }

    // ── Mimic rendering ──
    function renderMimic(timestamp: number) {
      if (fernState === 'pulling') return
      ctx.save(); ctx.translate(mimicX, mimicY); ctx.scale(-1, 1); ctx.imageSmoothingEnabled = false
      const half = MIMIC_SIZE / 2
      if (mimicState === 'closed' && mimicClosedLoaded) {
        ctx.drawImage(mimicClosedFrames[0], -half, -half, MIMIC_SIZE, MIMIC_SIZE)
      } else if (mimicState === 'chomping' && mimicChompingLoaded) {
        const fi = Math.floor(timestamp / (1000 / MIMIC_CHOMP_FPS)) % mimicChompingFrames.length
        ctx.drawImage(mimicChompingFrames[fi], -half, -half, MIMIC_SIZE, MIMIC_SIZE)
      } else if (mimicState === 'chewing' && mimicChewingLoaded) {
        const fi = Math.floor(timestamp / (1000 / MIMIC_CHEW_FPS)) % mimicChewingFrames.length
        ctx.drawImage(mimicChewingFrames[fi], -half, -half, MIMIC_SIZE, MIMIC_SIZE)
      } else {
        ctx.fillStyle = mimicState === 'closed' ? GOLD_COLOR : '#8B2020'
        ctx.fillRect(-30, -25, 60, 50)
        ctx.fillStyle = TEXT_COLOR; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('寶箱怪', 0, 0)
      }
      ctx.restore()
    }

    // ── Fern rendering ──
    function renderFern(timestamp: number) {
      if (fernState === 'idle') return
      const isPulling = fernState === 'pulling'
      const drawSize  = isPulling ? FERN_PULL_SIZE : FERN_SIZE
      const half      = drawSize / 2
      const anchorX   = isPulling ? mimicX - 20 : fernX
      const anchorY   = isPulling ? mimicY : fernY
      ctx.save(); ctx.translate(anchorX, anchorY); ctx.imageSmoothingEnabled = false
      if (fernState === 'running' && fernWalkLoaded) {
        const fi = Math.floor(timestamp / (1000 / FERN_WALK_FPS)) % fernWalkFrames.length
        ctx.drawImage(fernWalkFrames[fi], -half, -half, drawSize, drawSize)
      } else if (fernState === 'pulling' && fernPullLoaded) {
        const fi = Math.floor(timestamp / (1000 / FERN_PULL_FPS)) % fernPullFrames.length
        ctx.drawImage(fernPullFrames[fi], -half, -half, drawSize, drawSize)
      } else {
        ctx.fillStyle = '#6B4E8A'; ctx.fillRect(-20, -26, 40, 52)
        ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('Fern', 0, 0)
      }
      ctx.restore()
    }

    // ── Main render loop ──
    let lastTs = 0
    let inView = true          // canvas intersects the viewport (IntersectionObserver)
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = motionQuery.matches

    // Everything that changes the static layer (layout + text tint + background).
    // Returns null when it must be redrawn every frame (beams / Fern moving).
    function staticLayerKey(): string | null {
      if (beams.length > 0 || fernState === 'running') return null
      return [
        canvas.width, canvasH, prepared ? 1 : 0, flowerImg.complete ? 1 : 0,
        cursor.x, cursor.y, cursor.trapped ? 1 : 0, cursor.facingLeft ? 1 : 0, cursor.spriteState,
        currentSpriteFrame?.src ?? '', currentSpriteDrawSize,
        mimicPlaced ? 1 : 0, mimicX, mimicY, fernState,
      ].join('|')
    }

    // Bounding boxes (CSS px) of everything drawn on top of the static layer
    // while settled: Frieren (incl. bob, dash stretch, trap shake), reticle, mimic.
    type DirtyRect = { x: number; y: number; w: number; h: number }
    let prevSpriteRects: DirtyRect[] | null = null
    function currentSpriteRects(timestamp: number): DirtyRect[] {
      const rects: DirtyRect[] = []
      const box = (cx: number, cy: number, half: number) => rects.push({ x: cx - half, y: cy - half, w: half * 2, h: half * 2 })
      if (cursor.x > -1000) box(cursor.x, cursor.y + Math.sin(timestamp / 300) * 4, CURSOR_SIZE * 1.2 * 1.4 / 2 + 8)
      if (cursor.mouseX > -1000) box(cursor.mouseX, cursor.mouseY, 12)
      if (mimicPlaced) box(mimicX, mimicY, MIMIC_SIZE / 2 + 4)
      return rects
    }

    function redrawStaticLayer(timestamp: number) {
      const lines = computeLayout(timestamp)   // may resize the main canvas
      if (layer.width !== canvas.width || layer.height !== canvas.height) {
        layer.width = canvas.width; layer.height = canvas.height
      }
      const dpr = window.devicePixelRatio || 1
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderBackground(window.innerWidth, canvasH)
      renderTextWithProximityColor(lines)
    }

    function render(timestamp: number) {
      scheduled = false
      const steps = lastTs ? Math.min(MAX_FRAME_STEPS, Math.max(0.01, (timestamp - lastTs) / FRAME_MS)) : 1
      lastTs = timestamp
      updateCursor(cursor, steps)
      updateTrap(timestamp)
      checkMimicTrap(timestamp)
      beams = beams.filter(b => timestamp - b.startTime < BEAM_DURATION)

      const key = staticLayerKey()
      const layerChanged = key === null || key !== layerKey
      if (layerChanged) {
        redrawStaticLayer(timestamp)
        // Remember the inputs this layout was computed FROM. If computeLayout
        // changed them (first pass places the mimic, or the canvas was
        // resized), the key now differs and the next frame lays out again,
        // which is what makes the text wrap around the mimic.
        layerKey = key ?? ''
      }

      // Restore the static layer. When only the idle sprites move (the common
      // "settled" case), repaint just the areas they covered last frame and
      // cover now, instead of the whole canvas.
      const spriteRects = currentSpriteRects(timestamp)
      const partial = !layerChanged && prevSpriteRects !== null && beams.length === 0 &&
        !trapActive && fernState === 'idle' && mimicState === 'closed'
      ctx.save()
      if (partial) {
        ctx.beginPath()
        for (const r of [...prevSpriteRects!, ...spriteRects]) ctx.rect(r.x, r.y, r.w, r.h)
        ctx.clip()
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(layer, 0, 0)
      ctx.restore()
      prevSpriteRects = spriteRects

      renderBeams(timestamp)
      renderMimic(timestamp)
      renderFern(timestamp)
      renderCursor(timestamp)
      renderAimReticle()

      const cursorOnScreen = cursor.x > -1000
      const hasMovement  = Math.abs(cursor.mouseX - cursor.x) > 0.5 || Math.abs(cursor.mouseY - cursor.y) > 0.5
      const busy = cursorOnScreen || hasMovement || beams.length > 0 || trapActive || fernState === 'running' || mimicState !== 'closed'

      if (busy && inView && !reducedMotion) {
        scheduleRender()
      } else {
        lastTs = 0   // loop paused: next start must not count the idle gap
      }
    }

    function scheduleRender() {
      // Off-screen: don't render at all; the observer restarts the loop
      if (scheduled || !inView) return
      scheduled = true
      rafId = requestAnimationFrame(render)
    }

    // ── Events ──
    let lastClientX: number | null = null, lastClientY = 0

    function pointerToCanvas(clientX: number, clientY: number): [number, number] {
      const rect = canvas.getBoundingClientRect()
      return [clientX - rect.left, clientY - rect.top]
    }
    function setTarget(cx: number, cy: number) {
      if (cursor.mouseX < -1000) { cursor.x = cx; cursor.y = cy }
      if (!cursor.trapped) { cursor.mouseX = cx; cursor.mouseY = cy }
      scheduleRender()
    }

    const onMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return
      lastClientX = e.clientX; lastClientY = e.clientY
      setTarget(...pointerToCanvas(e.clientX, e.clientY))
    }
    // Scrolling moves the canvas under a stationary pointer; re-derive the
    // canvas-space target so the reticle stays under the real pointer.
    const onScroll = () => {
      if (reducedMotion || lastClientX === null) return
      setTarget(...pointerToCanvas(lastClientX, lastClientY))
    }
    // Only clicks on the canvas itself fire — not nav links, buttons, etc.
    const onMouseDown = (e: MouseEvent) => {
      if (reducedMotion || e.button !== 0 || e.target !== canvas) return
      const [cx, cy] = pointerToCanvas(e.clientX, e.clientY)
      requestAnimationFrame((ts) => fireZoltraak(cx, cy, ts))
    }
    // Mobile browsers fire resize when the URL bar shows/hides while
    // scrolling; layout only depends on width, so ignore height-only changes.
    let lastWidth = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      resizeCanvas(); layerKey = ''; prevSpriteRects = null; scheduleRender()
    }

    function applyMotionPreference() {
      reducedMotion = motionQuery.matches
      if (reducedMotion) {
        // Static page: text, background and closed mimic only; normal pointer
        canvas.style.cursor = 'auto'
        cursor.x = cursor.y = cursor.mouseX = cursor.mouseY = -9999
        cursor.recoilVx = cursor.recoilVy = 0; cursor.attackTimer = 0
        cursor.trapped = false; trapActive = false
        beams = []; mimicState = 'closed'; fernState = 'idle'; fernX = -200
        lastClientX = null
      } else {
        canvas.style.cursor = 'none'
      }
      layerKey = ''
      scheduleRender()
    }

    const observer = new IntersectionObserver((entries) => {
      inView = entries.some(e => e.isIntersecting)
      if (inView) scheduleRender()
    })
    observer.observe(canvas)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    motionQuery.addEventListener('change', applyMotionPreference)

    // ── Init ──
    let disposed = false
    async function init() {
      resizeCanvas()
      await document.fonts.ready
      if (disposed) return
      prepared = BIO_PARAGRAPHS.map(p => prepareWithSegments(p, FONT))
      applyMotionPreference()
    }
    init()

    return () => {
      disposed = true
      cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      motionQuery.removeEventListener('change', applyMotionPreference)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'none' }}
    />
  )
}
