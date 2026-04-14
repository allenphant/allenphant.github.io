import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext'
import { layoutColumn, type Interval, type PositionedLine, type Rect } from './layout-engine'
import { clearCanvas } from './canvas-renderer'
import { createCursor, updateCursor, type CursorState, type SpriteState } from './cursor'
import { getCircleIntervalForBand, getEllipseIntervalForBand } from './obstacle'
import { BIO_PARAGRAPHS } from './text-content'
import _flowerSrc from '../animation/flower_nobg.png'
const flowerSrc = _flowerSrc as unknown as string
import _idleF1Src     from '../animation/frieren_idle_f1.svg'
import _idleF3Src     from '../animation/frieren_idle_f3.svg'
import _glidingF2Src  from '../animation/frieren_gliding_f2.svg'
import _glidingF3Src  from '../animation/frieren_gliding_f3.svg'
import _dashingF0Src    from '../animation/frieren_dashing_f0.svg'
import _attackingF0Src  from '../animation/frieren_attacking_f0.svg'
import _attackingF1Src  from '../animation/frieren_attacking_f1.svg'
import _attackingF2Src  from '../animation/frieren_attacking_f2.svg'
import _attackingF3Src  from '../animation/frieren_attacking_f3.svg'
import _mimicClosedSrc   from '../animation/mimic_closed_f0.svg'
import _mimicChompF0Src  from '../animation/mimic_chomping_f0.svg'
import _mimicChompF1Src  from '../animation/mimic_chomping_f1.svg'
import _mimicChompF2Src  from '../animation/mimic_chomping_f2.svg'
import _mimicChompF3Src  from '../animation/mimic_chomping_f3.svg'
import _mimicChewF0Src   from '../animation/mimic_chewing_f0.svg'
import _mimicChewF1Src   from '../animation/mimic_chewing_f1.svg'
import _mimicChewF2Src   from '../animation/mimic_chewing_f2.svg'
import _mimicChewF3Src   from '../animation/mimic_chewing_f3.svg'
import _fernWalkF0Src    from '../animation/fern_walk4_f0.svg'
import _fernWalkF1Src    from '../animation/fern_walk4_f1.svg'
import _fernWalkF2Src    from '../animation/fern_walk4_f2.svg'
import _fernWalkF3Src    from '../animation/fern_walk4_f3.svg'
import _fernWalkF4Src    from '../animation/fern_walk4_f4.svg'
import _fernWalkF5Src    from '../animation/fern_walk4_f5.svg'
import _fernWalkF6Src    from '../animation/fern_walk4_f6.svg'
import _fernWalkF7Src    from '../animation/fern_walk4_f7.svg'
import _fernPullF0Src    from '../animation/fern_pulling_f0.svg'
import _fernPullF1Src    from '../animation/fern_pulling_f1.svg'
const idleF1Src      = _idleF1Src      as unknown as string
const idleF3Src      = _idleF3Src      as unknown as string
const glidingF2Src   = _glidingF2Src   as unknown as string
const glidingF3Src   = _glidingF3Src   as unknown as string
const dashingF0Src   = _dashingF0Src   as unknown as string
const attackingF0Src = _attackingF0Src as unknown as string
const attackingF1Src = _attackingF1Src as unknown as string
const attackingF2Src = _attackingF2Src as unknown as string
const attackingF3Src = _attackingF3Src as unknown as string
const mimicClosedSrc  = _mimicClosedSrc  as unknown as string
const mimicChompF0Src = _mimicChompF0Src as unknown as string
const mimicChompF1Src = _mimicChompF1Src as unknown as string
const mimicChompF2Src = _mimicChompF2Src as unknown as string
const mimicChompF3Src = _mimicChompF3Src as unknown as string
const mimicChewF0Src  = _mimicChewF0Src  as unknown as string
const mimicChewF1Src  = _mimicChewF1Src  as unknown as string
const mimicChewF2Src  = _mimicChewF2Src  as unknown as string
const mimicChewF3Src  = _mimicChewF3Src  as unknown as string
const fernWalkF0Src   = _fernWalkF0Src   as unknown as string
const fernWalkF1Src   = _fernWalkF1Src   as unknown as string
const fernWalkF2Src   = _fernWalkF2Src   as unknown as string
const fernWalkF3Src   = _fernWalkF3Src   as unknown as string
const fernWalkF4Src   = _fernWalkF4Src   as unknown as string
const fernWalkF5Src   = _fernWalkF5Src   as unknown as string
const fernWalkF6Src   = _fernWalkF6Src   as unknown as string
const fernWalkF7Src   = _fernWalkF7Src   as unknown as string
const fernPullF0Src   = _fernPullF0Src   as unknown as string
const fernPullF1Src   = _fernPullF1Src   as unknown as string

// ─── Constants ───────────────────────────────────────────────────────────────
const BG_COLOR    = '#F2F4F7'
const TEXT_COLOR  = '#3B3B58'
const MAGIC_COLOR = '#7DA2A9'
const GOLD_COLOR  = '#C5A059'
const FONT = '20px "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif'
const LINE_HEIGHT = 32
const GUTTER      = 60
const CURSOR_SIZE = 128
const FADE_PX     = 80  // width of color-fade zone near slot boundary

// Phase 5 — Shooting
const BEAM_DURATION    = 500   // ms (longer so text has time to part visibly)
const BEAM_TEXT_RADIUS = 40    // px — how wide the beam pushes text apart
const DEMON_RADIUS     = 24
const DEMON_DEATH_MS   = 600
const DEMON_COUNT      = 4

// Phase 6 — Mimic trap
const MIMIC_HITBOX_R    = 70
const TRAP_HOLD_MS      = 2200  // how long Frieren stays caught
const FERN_SPEED        = 1.2   // px/frame toward mimic
const TRAP_COOLDOWN_MS  = 3000  // ms before trap can retrigger after release

// ─── Types ───────────────────────────────────────────────────────────────────
type Demon = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number       // bobbing phase offset
  state: 'floating' | 'dying' | 'dead'
  deathStart: number  // timestamp when death began
}

type ZoltraakBeam = {
  x1: number; y1: number
  x2: number; y2: number
  startTime: number
  hitDemonId: number | null
}

type MimicAnimState = 'closed' | 'chomping' | 'chewing'

// ─── Sprite assets ────────────────────────────────────────────────────────────
const SPRITE_FPS = 2

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

let idleLoaded      = false
let glidingLoaded   = false
let dashingLoaded   = false
let attackingLoaded = false
const idleFrames      = loadFrames([idleF1Src, idleF3Src],                               () => { idleLoaded      = true })
const glidingFrames   = loadFrames([glidingF2Src, glidingF3Src],                         () => { glidingLoaded   = true })
const dashingFrames   = loadFrames([dashingF0Src],                                        () => { dashingLoaded   = true })
const attackingFrames = loadFrames([attackingF2Src], () => { attackingLoaded = true })

let mimicClosedLoaded   = false
let mimicChompingLoaded = false
let mimicChewingLoaded  = false
const mimicClosedFrames   = loadFrames([mimicClosedSrc],                                                       () => { mimicClosedLoaded   = true })
const mimicChompingFrames = loadFrames([mimicChompF0Src, mimicChompF1Src, mimicChompF2Src, mimicChompF3Src],   () => { mimicChompingLoaded = true })
const mimicChewingFrames  = loadFrames([mimicChewF0Src, mimicChewF1Src, mimicChewF2Src, mimicChewF3Src],      () => { mimicChewingLoaded  = true })

let fernWalkLoaded = false
let fernPullLoaded = false
const fernWalkFrames = loadFrames([fernWalkF0Src, fernWalkF1Src, fernWalkF2Src, fernWalkF3Src, fernWalkF4Src, fernWalkF5Src, fernWalkF6Src, fernWalkF7Src], () => { fernWalkLoaded = true })
const fernPullFrames = loadFrames([fernPullF0Src, fernPullF1Src], () => { fernPullLoaded = true })

const MIMIC_SIZE       = 128   // display size in px
const MIMIC_CHOMP_FPS  = 8
const MIMIC_CHEW_FPS   = 4

const FERN_SIZE        = 144   // walking display size in px
const FERN_PULL_SIZE   = 180   // pulling display size
const FERN_WALK_FPS    = 6
const FERN_PULL_FPS    = 3

// Per-state display scale to normalize apparent character height across poses
// ── 手動調整這裡 ──────────────────────────────────────────────────────────────
// 存檔後 Vite HMR 會自動熱更新，瀏覽器不需重整
const SPRITE_DISPLAY_SCALE: Partial<Record<SpriteState, number>> = {
  idle:      1.1,
  gliding:   1.2,
  dashing:   1.0,
  attacking: 1.1,
}

// 4 frames over 1 second
const ATTACKING_FPS = 4

// Staff tip offset from cursor centre when attacking (tune visually)
// positive X = toward the direction Frieren is facing
const STAFF_TIP_X = 52   // px along facing direction
const STAFF_TIP_Y = -15  // px from centre (negative = upward)

// ─── Sprite hitmap (pixel-accurate text repulsion) ───────────────────────────
const _hitmapCanvas = document.createElement('canvas')
_hitmapCanvas.width  = 256
_hitmapCanvas.height = 256
const _hitmapCtx = _hitmapCanvas.getContext('2d', { willReadFrequently: true })!

type RowBounds = { left: number; right: number } | null
interface Hitmap { rows: RowBounds[]; size: number; img: HTMLImageElement; facingLeft: boolean }
let _hitmap: Hitmap | null = null
let _currentSpriteFrame: HTMLImageElement | null = null
let _currentSpriteDrawSize = CURSOR_SIZE

function buildHitmap(img: HTMLImageElement, size: number, facingLeft: boolean): Hitmap {
  _hitmapCtx.clearRect(0, 0, size, size)
  _hitmapCtx.save()
  if (facingLeft) { _hitmapCtx.translate(size, 0); _hitmapCtx.scale(-1, 1) }
  _hitmapCtx.drawImage(img, 0, 0, size, size)
  _hitmapCtx.restore()
  const data = _hitmapCtx.getImageData(0, 0, size, size).data
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

function getSpriteInterval(cx: number, cy: number, hm: Hitmap, bandTop: number, bandBottom: number): Interval | null {
  const half = hm.size / 2
  const rowStart = Math.max(0, Math.floor(bandTop  - (cy - half)))
  const rowEnd   = Math.min(hm.size - 1, Math.ceil(bandBottom - (cy - half)))
  if (rowStart > rowEnd) return null
  let minL = Infinity, maxR = -Infinity
  for (let r = rowStart; r <= rowEnd; r++) {
    const b = hm.rows[r]; if (b) { minL = Math.min(minL, b.left); maxR = Math.max(maxR, b.right) }
  }
  if (minL === Infinity) return null
  return { left: cx - half + minL - 5, right: cx - half + maxR + 5 }
}

// ─── Canvas / global state ───────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement
const ctx    = canvas.getContext('2d')!
const cursor: CursorState = createCursor(100)

let prepared:  PreparedTextWithSegments[] | null = null
let scheduled  = false
let lastLines:  PositionedLine[] = []

// Phase 5 — Demons
let demons: Demon[] = []
let beams:  ZoltraakBeam[] = []
let demonIdCounter = 0

// Phase 6 — Mimic & Fern
let mimicState: MimicAnimState = 'closed'
let mimicX = 0, mimicY = 0   // set on first resize
let trapActive = false
let chompStartTime = 0
let trapCooldownEnd = 0   // timestamp before which trap cannot retrigger
let fernX = -200, fernY = 0
let fernState: 'idle' | 'running' | 'pulling' = 'idle'
let fernPullStartTime = 0
let fernTargetX = 0, fernTargetY = 0

// ─── Canvas setup (HiDPI) ────────────────────────────────────────────────────
function resizeCanvas(): void {
  const dpr = window.devicePixelRatio || 1
  const w   = window.innerWidth
  const h   = window.innerHeight
  canvas.width  = w * dpr
  canvas.height = h * dpr
  canvas.style.width  = `${w}px`
  canvas.style.height = `${h}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Keep mimic anchored bottom-right
  mimicX = w - 90
  mimicY = h - 90
  fernTargetX = mimicX - 80
  fernTargetY = mimicY
}

// ─── Demon helpers (Phase 5) ─────────────────────────────────────────────────
function spawnDemons(): void {
  demons = []
  for (let i = 0; i < DEMON_COUNT; i++) {
    const margin = 60
    const x = margin + Math.random() * (window.innerWidth  - margin * 2)
    const y = margin + Math.random() * (window.innerHeight * 0.5) // upper half
    const angle = Math.random() * Math.PI * 2
    const speed = 0.4 + Math.random() * 0.6
    demons.push({
      id:         demonIdCounter++,
      x, y,
      vx:         Math.cos(angle) * speed,
      vy:         Math.sin(angle) * speed,
      phase:      Math.random() * Math.PI * 2,
      state:      'floating',
      deathStart: 0,
    })
  }
}

function updateDemons(timestamp: number): void {
  for (const d of demons) {
    if (d.state === 'dead') continue
    if (d.state === 'dying') continue  // animated in render

    d.phase += 0.03
    d.x += d.vx
    d.y += d.vy

    // Bounce off walls
    if (d.x < DEMON_RADIUS || d.x > window.innerWidth  - DEMON_RADIUS) { d.vx *= -1; d.x = Math.max(DEMON_RADIUS, Math.min(window.innerWidth  - DEMON_RADIUS, d.x)) }
    if (d.y < DEMON_RADIUS || d.y > window.innerHeight * 0.6) { d.vy *= -1; d.y = Math.max(DEMON_RADIUS, Math.min(window.innerHeight * 0.6, d.y)) }
  }
}

// Line-circle intersection: returns true if segment (x1,y1)→(x2,y2) passes within r of (cx,cy)
function raycastHits(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number): boolean {
  const dx = x2 - x1, dy = y2 - y1
  const fx = x1 - cx, fy = y1 - cy
  const a = dx * dx + dy * dy
  const b = 2 * (fx * dx + fy * dy)
  const c = fx * fx + fy * fy - r * r
  let disc = b * b - 4 * a * c
  if (disc < 0) return false
  disc = Math.sqrt(disc)
  const t1 = (-b - disc) / (2 * a)
  const t2 = (-b + disc) / (2 * a)
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
}

/**
 * Extend aim vector so the beam always has a meaningful length.
 * When Frieren is idle (zero lag), fire in facing direction instead.
 */
function resolveBeamEndpoint(toX: number, toY: number): [number, number] {
  const dx = toX - cursor.x
  const dy = toY - cursor.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 10) {
    // Cursor is idle — fire in facing direction across the screen
    const dir = cursor.facingLeft ? -1 : 1
    return [cursor.x + dir * (window.innerWidth + 200), cursor.y]
  }
  // Extend the direction vector beyond the screen edge so the beam clearly crosses the field
  const scale = (Math.max(window.innerWidth, window.innerHeight) * 1.5) / dist
  return [cursor.x + dx * scale, cursor.y + dy * scale]
}

function fireZoltraak(toX: number, toY: number, timestamp: number): void {
  if (cursor.x < -1000) return

  cursor.attackTimer = 30  // ~0.5s at 60fps

  // Beam starts at staff tip, not body centre
  const staffSign = cursor.facingLeft ? -1 : 1
  const beamOriginX = cursor.x + staffSign * STAFF_TIP_X
  const beamOriginY = cursor.y + STAFF_TIP_Y

  // Recoil: push Frieren opposite to the beam direction (from body centre)
  const [endX, endY] = resolveBeamEndpoint(toX, toY)
  const bdx = endX - cursor.x, bdy = endY - cursor.y
  const blen = Math.sqrt(bdx * bdx + bdy * bdy) || 1
  cursor.recoilVx = -(bdx / blen) * 12
  cursor.recoilVy = -(bdy / blen) * 12
  const beam: ZoltraakBeam = { x1: beamOriginX, y1: beamOriginY, x2: endX, y2: endY, startTime: timestamp, hitDemonId: null }

  // Hit radius = demon visual radius + half of beam visual width (~14px)
  const HIT_R = DEMON_RADIUS + 14
  for (const d of demons) {
    if (d.state !== 'floating') continue
    const bob = Math.sin(d.phase) * 5
    if (raycastHits(beam.x1, beam.y1, beam.x2, beam.y2, d.x, d.y + bob, HIT_R)) {
      d.state = 'dying'
      d.deathStart = timestamp
      beam.hitDemonId = d.id
      break // one kill per shot
    }
  }

  beams.push(beam)
  scheduleRender()
}

// ─── Mimic / Fern helpers (Phase 6) ──────────────────────────────────────────
function checkMimicTrap(timestamp: number): void {
  if (trapActive || cursor.x < -1000) return
  if (timestamp < trapCooldownEnd) return   // cooldown after last release

  const dx = cursor.x - mimicX
  const dy = cursor.y - mimicY
  if (dx * dx + dy * dy < MIMIC_HITBOX_R * MIMIC_HITBOX_R) {
    trapActive     = true
    chompStartTime = timestamp
    cursor.trapped = true
    mimicState     = 'chomping'

    fernX     = Math.max(0, mimicX - 600)
    fernY     = mimicY
    fernState = 'running'
  }
}

const PULL_DURATION_MS  = 1500  // how long Fern pulls before Frieren is freed

function updateTrap(timestamp: number): void {
  if (!trapActive) return

  // Chomping → chewing after 200ms
  if (mimicState === 'chomping' && timestamp - chompStartTime > 200) mimicState = 'chewing'

  // Fern runs toward mimic
  if (fernState === 'running') {
    fernX += FERN_SPEED
    if (fernX >= fernTargetX) {
      fernX             = fernTargetX
      fernState         = 'pulling'
      fernPullStartTime = timestamp
    }
  }

  // Release after Fern has been pulling for PULL_DURATION_MS
  if (fernState === 'pulling' && timestamp - fernPullStartTime > PULL_DURATION_MS) {
    trapActive        = false
    cursor.trapped    = false
    trapCooldownEnd   = timestamp + TRAP_COOLDOWN_MS
    mimicState        = 'closed'
    fernState         = 'idle'
    fernX             = -200
    // if (demons.filter(d => d.state !== 'dead').length === 0) spawnDemons()  // Phase 5 — disabled
  }
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * Returns the x-interval blocked by a beam capsule (line + radius) for a band.
 * The radius shrinks as the beam fades out so text flows back smoothly.
 */
function getBeamIntervalForBand(
  x1: number, y1: number, x2: number, y2: number,
  radius: number,
  bandTop: number, bandBottom: number,
): Interval | null {
  const expandedTop    = bandTop    - radius
  const expandedBottom = bandBottom + radius
  const dx = x2 - x1, dy = y2 - y1

  let tEnter = 0, tExit = 1
  if (Math.abs(dy) > 0.001) {
    const tA = (expandedTop    - y1) / dy
    const tB = (expandedBottom - y1) / dy
    tEnter = Math.max(0, Math.min(tA, tB))
    tExit  = Math.min(1, Math.max(tA, tB))
  } else {
    if (y1 < expandedTop || y1 > expandedBottom) return null
  }
  if (tEnter > tExit) return null

  const xEnter = x1 + tEnter * dx
  const xExit  = x1 + tExit  * dx
  return { left: Math.min(xEnter, xExit) - radius, right: Math.max(xEnter, xExit) + radius }
}

const PARA_GAP = Math.round(LINE_HEIGHT * 0.75)  // 24px extra spacing between paragraphs

function computeLayout(timestamp: number): PositionedLine[] {
  if (!prepared || prepared.length === 0) return []

  const region: Rect = {
    x:      GUTTER,
    y:      GUTTER,
    width:  window.innerWidth  - GUTTER * 2,
    height: window.innerHeight - GUTTER * 2,
  }

  const getBlocked = (bandTop: number, bandBottom: number): Interval[] => {
    const intervals: Interval[] = []

    // Frieren repulsion — pixel-accurate sprite hitmap
    if (cursor.x > -1000 && !cursor.trapped) {
      if (_currentSpriteFrame) {
        if (!_hitmap || _hitmap.img !== _currentSpriteFrame || _hitmap.size !== _currentSpriteDrawSize || _hitmap.facingLeft !== cursor.facingLeft) {
          _hitmap = buildHitmap(_currentSpriteFrame, _currentSpriteDrawSize, cursor.facingLeft)
        }
        const si = getSpriteInterval(cursor.x, cursor.y, _hitmap, bandTop, bandBottom)
        if (si) intervals.push(si)
      } else {
        // fallback ellipse while sprites load
        const ci = getEllipseIntervalForBand(cursor.x, cursor.y, cursor.radius * 0.42, cursor.radius, bandTop, bandBottom)
        if (ci) intervals.push(ci)
      }
    }

    // Mimic — always blocks text (permanent bottom-right fixture)
    {
      const mi = getEllipseIntervalForBand(mimicX, mimicY, MIMIC_SIZE * 0.45, MIMIC_SIZE * 0.5, bandTop, bandBottom)
      if (mi) intervals.push(mi)
    }

    // Fern — blocks text when walking or pulling
    if (fernState === 'running') {
      const fi = getEllipseIntervalForBand(fernX, fernY, FERN_SIZE * 0.35, FERN_SIZE * 0.5, bandTop, bandBottom)
      if (fi) intervals.push(fi)
    } else if (fernState === 'pulling') {
      // Sprite is anchored at (mimicX-20, mimicY), half=90px — block the entire corner area
      const pullAnchorY = mimicY
      const half = FERN_PULL_SIZE / 2
      if (bandBottom > pullAnchorY - half && bandTop < pullAnchorY + half) {
        intervals.push({ left: mimicX - 20 - half - 10, right: window.innerWidth + 100 })
      }
    }

    // Demon repulsion circles (floating demons also push text)
    for (const d of demons) {
      if (d.state !== 'floating') continue
      const bob = Math.sin(d.phase) * 5
      const di = getCircleIntervalForBand(d.x, d.y + bob, DEMON_RADIUS + 10, bandTop, bandBottom)
      if (di) intervals.push(di)
    }

    // Active beam capsules — radius shrinks as beam fades so text flows back
    for (const beam of beams) {
      const age     = Math.min(1, (timestamp - beam.startTime) / BEAM_DURATION)
      const effRadius = BEAM_TEXT_RADIUS * (1 - age)   // linear shrink
      if (effRadius < 2) continue
      const bi = getBeamIntervalForBand(beam.x1, beam.y1, beam.x2, beam.y2, effRadius, bandTop, bandBottom)
      if (bi) intervals.push(bi)
    }

    return intervals
  }

  // Lay out each paragraph separately, advancing y after each one
  const allLines: PositionedLine[] = []
  let currentY = region.y

  for (const para of prepared) {
    const paraRegion: Rect = {
      x: region.x,
      y: currentY,
      width: region.width,
      height: region.y + region.height - currentY,
    }
    const paraLines = layoutColumn(para, { segmentIndex: 0, graphemeIndex: 0 }, paraRegion, LINE_HEIGHT, getBlocked)
    if (paraLines.length === 0) break
    // Mark last line of paragraph so justify doesn't stretch it
    paraLines[paraLines.length - 1].isLastLine = true
    allLines.push(...paraLines)
    currentY = paraLines[paraLines.length - 1].y + LINE_HEIGHT + PARA_GAP
  }

  return allLines
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function lerpColor(from: string, to: string, t: number): string {
  const f  = hexToRgb(from)
  const tt = hexToRgb(to)
  const r  = Math.round(f.r + (tt.r - f.r) * t)
  const g  = Math.round(f.g + (tt.g - f.g) * t)
  const b  = Math.round(f.b + (tt.b - f.b) * t)
  return `rgb(${r},${g},${b})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/**
 * Binary-search for the character index where prefix width first reaches targetX.
 */
function findSplitIndex(text: string, targetX: number, lineStartX: number): number {
  const rel = targetX - lineStartX
  if (rel <= 0) return 0
  const totalWidth = ctx.measureText(text).width
  if (rel >= totalWidth) return text.length
  let lo = 0, hi = text.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (ctx.measureText(text.slice(0, mid)).width < rel) lo = mid + 1
    else hi = mid
  }
  return lo
}

// ─── Rendering ───────────────────────────────────────────────────────────────

/** Set ctx.wordSpacing to justify a line within its slot. Reset to '0px' after drawing. */
function setJustifySpacing(line: PositionedLine): void {
  // Last line of a paragraph: always left-align (never stretch)
  if (line.isLastLine) { ;(ctx as any).wordSpacing = '0px'; return }
  const spaces = (line.text.match(/ /g) ?? []).length
  // Only justify if line is long enough (avoid stretching very short last lines)
  if (spaces > 0 && line.width / line.slotWidth > 0.55) {
    const extra = (line.slotWidth - line.width) / spaces
    ;(ctx as any).wordSpacing = `${extra}px`
  } else {
    ;(ctx as any).wordSpacing = '0px'
  }
}

function renderTextWithProximityColor(lines: PositionedLine[]): void {
  ctx.font = FONT
  ctx.textBaseline = 'top'

  const onScreen = cursor.x > -1000

  for (const line of lines) {
    setJustifySpacing(line)
    if (!onScreen) {
      ctx.fillStyle = TEXT_COLOR
      ctx.fillText(line.text, line.x, line.y)
      continue
    }

    const lineCenterY = line.y + LINE_HEIGHT / 2
    const dy = Math.abs(lineCenterY - cursor.y)

    if (dy >= cursor.radius) {
      ctx.fillStyle = TEXT_COLOR
      ctx.fillText(line.text, line.x, line.y)
      continue
    }

    const tintStrength = 1 - dy / cursor.radius
    const lineMidX = line.x + line.width / 2

    if (lineMidX < cursor.x) {
      // LEFT slot — tint chars at the right edge (closest to circle boundary)
      const fadeStart = line.x + line.width - FADE_PX * tintStrength
      const splitIdx  = findSplitIndex(line.text, fadeStart, line.x)
      const normal    = line.text.slice(0, splitIdx)
      const tinted    = line.text.slice(splitIdx)

      ctx.fillStyle = TEXT_COLOR
      if (normal) ctx.fillText(normal, line.x, line.y)
      if (tinted) {
        const tintedX = line.x + ctx.measureText(normal).width
        ctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tintStrength)
        ctx.fillText(tinted, tintedX, line.y)
      }
    } else {
      // RIGHT slot — tint chars at the left edge (closest to circle boundary)
      const fadeEnd  = line.x + FADE_PX * tintStrength
      const splitIdx = findSplitIndex(line.text, fadeEnd, line.x)
      const tinted   = line.text.slice(0, splitIdx)
      const normal   = line.text.slice(splitIdx)

      if (tinted) {
        ctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tintStrength)
        ctx.fillText(tinted, line.x, line.y)
      }
      if (normal) {
        const normalX = line.x + ctx.measureText(tinted).width
        ctx.fillStyle = TEXT_COLOR
        ctx.fillText(normal, normalX, line.y)
      }
    }
  }
  ;(ctx as any).wordSpacing = '0px'  // reset after all lines
}

// ─── Aim reticle (Phase 5 UX) ────────────────────────────────────────────────
/**
 * Show the raw mouse position as a small crosshair.
 * Frieren's body lags via lerp — the gap between reticle and Frieren IS the aiming system.
 * Click fires from Frieren toward the reticle.
 */
function renderAimReticle(): void {
  if (cursor.mouseX < -1000 || cursor.trapped) return

  const mx = cursor.mouseX
  const my = cursor.mouseY
  const S  = 8  // crosshair arm length

  ctx.save()
  ctx.strokeStyle = MAGIC_COLOR
  ctx.lineWidth   = 1.5
  ctx.globalAlpha = 0.7
  ctx.setLineDash([])

  // Cross
  ctx.beginPath()
  ctx.moveTo(mx - S, my); ctx.lineTo(mx + S, my)
  ctx.moveTo(mx, my - S); ctx.lineTo(mx, my + S)
  ctx.stroke()

  // Outer ring
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.arc(mx, my, 5, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

// ─── Phase 4: state-based cursor rendering ───────────────────────────────────
function spriteColorForState(state: SpriteState): string {
  switch (state) {
    case 'idle':      return GOLD_COLOR          // warm gold
    case 'gliding':   return '#D4B86A'            // lighter gold
    case 'dashing':   return MAGIC_COLOR          // magic blue burst
    case 'attacking': return '#FFE066'            // bright yellow flash
    case 'trapped':   return '#CC4444'            // red caught
  }
}

// ─── Background (Frieren theme: parchment gradient + nemophila flowers) ───────
const flowerImg = new Image()
flowerImg.src = flowerSrc

const BG_FLOWERS: Array<{ x: number; y: number; size: number; a: number; rot: number }> = Array.from({ length: 40 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 22 + Math.random() * 20,
  a: 0.10 + Math.random() * 0.16,
  rot: Math.random() * Math.PI * 2,
}))

function renderBackground(w: number, h: number): void {
  // Frieren theme: misty blue-purple (top) → warm parchment (bottom)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0,   '#D8DCF0')   // muted lavender-blue
  grad.addColorStop(0.45, '#E8EAF2')  // soft mid-tone
  grad.addColorStop(1,   '#F0E8D8')   // warm parchment
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Nemophila flowers scattered in background
  if (flowerImg.complete && flowerImg.naturalWidth > 0) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    for (const s of BG_FLOWERS) {
      ctx.save()
      ctx.globalAlpha = s.a
      ctx.translate(s.x * w, s.y * h)
      ctx.rotate(s.rot)
      ctx.drawImage(flowerImg, -s.size / 2, -s.size / 2, s.size, s.size)
      ctx.restore()
    }
    ctx.restore()
  }
}

function renderCursor(timestamp: number): void {
  if (cursor.x < -1000) return
  // Frieren is visually handled by mimic/fern sprites during trap — skip separate render
  if (cursor.trapped) return

  const floatOffset = Math.sin(timestamp / 300) * 4
  const cx = cursor.x
  const cy = cursor.y + floatOffset

  // Dashing: stretch horizontally
  const scaleX = cursor.spriteState === 'dashing' ? 1.4 : 1
  const scaleY = cursor.spriteState === 'dashing' ? 0.8 : 1
  // Attacking: flash alpha
  const alpha  = cursor.spriteState === 'attacking' ? 0.7 + 0.3 * Math.sin(timestamp / 40) : 1

  // Frieren body
  ctx.save()
  ctx.translate(cx, cy)
  if (cursor.facingLeft) ctx.scale(-1, 1)
  ctx.scale(scaleX, scaleY)
  ctx.globalAlpha = alpha

  if (cursor.spriteState === 'trapped') {
    ctx.translate(Math.sin(timestamp / 60) * 3, 0)
  }

  const spriteMap: Partial<Record<SpriteState, { frames: HTMLImageElement[], loaded: boolean, fps?: number }>> = {
    idle:      { frames: idleFrames,      loaded: idleLoaded },
    gliding:   { frames: glidingFrames,   loaded: glidingLoaded },
    dashing:   { frames: dashingFrames,   loaded: dashingLoaded },
    attacking: { frames: attackingFrames, loaded: attackingLoaded, fps: ATTACKING_FPS },
  }
  const spriteEntry = spriteMap[cursor.spriteState]

  if (spriteEntry?.loaded) {
    const fps = spriteEntry.fps ?? SPRITE_FPS
    const frameIdx = Math.floor(timestamp / (1000 / fps)) % spriteEntry.frames.length
    const scale = SPRITE_DISPLAY_SCALE[cursor.spriteState] ?? 1.0
    const drawSize = CURSOR_SIZE * scale
    // expose current frame for hitmap collision
    _currentSpriteFrame    = spriteEntry.frames[frameIdx]
    _currentSpriteDrawSize = Math.round(drawSize)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      spriteEntry.frames[frameIdx],
      -drawSize / 2, -drawSize / 2,
      drawSize, drawSize,
    )
  } else {
    // ── Colored placeholder for states without sprites yet ──
    ctx.fillStyle = spriteColorForState(cursor.spriteState)
    ctx.fillRect(-CURSOR_SIZE / 2, -CURSOR_SIZE / 2, CURSOR_SIZE, CURSOR_SIZE)

    ctx.fillStyle = TEXT_COLOR
    ctx.beginPath()
    ctx.moveTo(CURSOR_SIZE / 2 - 8, -6)
    ctx.lineTo(CURSOR_SIZE / 2 - 8,  6)
    ctx.lineTo(CURSOR_SIZE / 2, 0)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = cursor.spriteState === 'dashing' ? '#fff' : TEXT_COLOR
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(cursor.spriteState === 'trapped' ? '≋Frieren≋' : cursor.spriteState, 0, 0)
  }

  ctx.restore()
}

// ─── Phase 5: beam & demon rendering ─────────────────────────────────────────
function renderBeams(timestamp: number): void {
  beams = beams.filter(b => timestamp - b.startTime < BEAM_DURATION)

  for (const b of beams) {
    const t     = (timestamp - b.startTime) / BEAM_DURATION
    const alpha = Math.max(0, 1 - t * t)

    ctx.save()
    ctx.globalAlpha = alpha

    // Outer glow pass (wide, soft)
    ctx.strokeStyle = MAGIC_COLOR
    ctx.lineWidth   = 28 * (1 - t) + 4
    ctx.shadowBlur  = 30
    ctx.shadowColor = MAGIC_COLOR
    ctx.globalAlpha = alpha * 0.35
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke()

    // Core bright pass (narrow, opaque)
    ctx.strokeStyle = '#DFFFFF'
    ctx.lineWidth   = 6 * (1 - t) + 1.5
    ctx.shadowBlur  = 10
    ctx.shadowColor = '#fff'
    ctx.globalAlpha = alpha
    ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke()

    ctx.restore()
  }
}

function renderDemons(timestamp: number): void {
  for (const d of demons) {
    if (d.state === 'dead') continue

    const bob = Math.sin(d.phase) * 5
    const drawX = d.x
    const drawY = d.y + bob

    if (d.state === 'dying') {
      const elapsed = timestamp - d.deathStart
      const t = elapsed / DEMON_DEATH_MS
      if (t >= 1) { d.state = 'dead'; continue }

      // Death flash + particles
      ctx.save()
      ctx.globalAlpha = 1 - t
      // Expanding ring
      ctx.strokeStyle = '#CC4444'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(drawX, drawY, DEMON_RADIUS + 30 * t, 0, Math.PI * 2)
      ctx.stroke()
      // Shrinking body
      ctx.fillStyle = '#CC4444'
      ctx.beginPath()
      ctx.arc(drawX, drawY, DEMON_RADIUS * (1 - t * 0.8), 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      continue
    }

    // Floating demon
    ctx.save()
    ctx.fillStyle = '#4A3F6B'
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.arc(drawX, drawY, DEMON_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    // Inner glow eyes
    ctx.fillStyle = '#CC4444'
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(drawX - 7, drawY - 4, 4, 0, Math.PI * 2)
    ctx.arc(drawX + 7, drawY - 4, 4, 0, Math.PI * 2)
    ctx.fill()

    // Label
    ctx.fillStyle = '#ddd'
    ctx.globalAlpha = 0.7
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('魔族', drawX, drawY + 10)

    ctx.restore()
  }
}

// ─── Phase 6: mimic & Fern rendering ─────────────────────────────────────────
function renderMimic(timestamp: number): void {
  // Fern pulling sprite already shows mimic — skip separate render
  if (fernState === 'pulling') return

  ctx.save()
  ctx.translate(mimicX, mimicY)
  ctx.scale(-1, 1)  // mimic is bottom-right, face left
  ctx.imageSmoothingEnabled = false

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
    // Fallback placeholder while sprites load
    const w = 60, h = 50
    ctx.fillStyle = mimicState === 'closed' ? GOLD_COLOR : '#8B2020'
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.fillStyle = TEXT_COLOR
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('寶箱怪', 0, 0)
  }

  ctx.restore()
}

function renderFern(timestamp: number): void {
  if (fernState === 'idle') return

  const isPulling = fernState === 'pulling'
  const drawSize  = isPulling ? FERN_PULL_SIZE : FERN_SIZE
  const half      = drawSize / 2
  const anchorX   = isPulling ? mimicX - 20 : fernX
  const anchorY   = isPulling ? mimicY : fernY

  ctx.save()
  ctx.translate(anchorX, anchorY)
  ctx.imageSmoothingEnabled = false

  if (fernState === 'running' && fernWalkLoaded) {
    const fi = Math.floor(timestamp / (1000 / FERN_WALK_FPS)) % fernWalkFrames.length
    ctx.drawImage(fernWalkFrames[fi], -half, -half, drawSize, drawSize)
  } else if (fernState === 'pulling' && fernPullLoaded) {
    const fi = Math.floor(timestamp / (1000 / FERN_PULL_FPS)) % fernPullFrames.length
    ctx.drawImage(fernPullFrames[fi], -half, -half, drawSize, drawSize)
  } else {
    // Fallback placeholder while sprites load
    ctx.fillStyle = '#6B4E8A'
    ctx.fillRect(-20, -26, 40, 52)
    ctx.fillStyle = '#fff'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Fern', 0, 0)
  }

  ctx.restore()
}

// ─── Main render frame ────────────────────────────────────────────────────────
function render(timestamp: number): void {
  scheduled = false

  updateCursor(cursor)
  // updateDemons(timestamp)  // Phase 5 — disabled for now
  updateTrap(timestamp)
  checkMimicTrap(timestamp)

  const lines = computeLayout(timestamp)
  lastLines = lines

  renderBackground(window.innerWidth, window.innerHeight)
  renderTextWithProximityColor(lines)
  // renderDemons(timestamp)  // Phase 5 — disabled for now
  renderBeams(timestamp)
  renderMimic(timestamp)
  renderFern(timestamp)
  renderCursor(timestamp)
  renderAimReticle()  // drawn on top so it's always visible

  // Keep ticking while moving or during active animations
  const dx = cursor.mouseX - cursor.x
  const dy = cursor.mouseY - cursor.y
  const hasMovement   = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5
  const hasBeams      = beams.some(b => timestamp - b.startTime < BEAM_DURATION)
  const hasDying      = demons.some(d => d.state === 'dying')
  const isTrapActive  = trapActive
  const isFernMoving  = fernState === 'running'
  const isMimicAnimed = mimicState !== 'closed'
  const cursorOnScreen = cursor.x > -1000  // always animate sprite while visible

  if (cursorOnScreen || hasMovement || hasBeams || hasDying || isTrapActive || isFernMoving || isMimicAnimed) {
    scheduleRender()
  }
}

function scheduleRender(): void {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(render)
}

// ─── Events ──────────────────────────────────────────────────────────────────
window.addEventListener('mousemove', (e) => {
  if (cursor.mouseX < -1000) {
    cursor.x = e.clientX
    cursor.y = e.clientY
  }
  if (!cursor.trapped) {
    cursor.mouseX = e.clientX
    cursor.mouseY = e.clientY
  }
  scheduleRender()
})

window.addEventListener('mousedown', (e) => {
  if (cursor.trapped) return
  if (e.button === 0) {
    requestAnimationFrame((ts) => fireZoltraak(e.clientX, e.clientY, ts))
  }
})

window.addEventListener('resize', () => {
  resizeCanvas()
  scheduleRender()
})

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init(): Promise<void> {
  resizeCanvas()
  await document.fonts.ready
  prepared = BIO_PARAGRAPHS.map(p => prepareWithSegments(p, FONT))
  // spawnDemons()  // Phase 5 — disabled for now
  scheduleRender()
}

init()
