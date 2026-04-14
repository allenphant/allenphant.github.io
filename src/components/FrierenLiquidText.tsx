import { useRef, useEffect } from 'react'
import { prepareWithSegments, type PreparedTextWithSegments } from '@chenglou/pretext'
import { layoutColumn, type Interval, type PositionedLine, type Rect } from '../../prototype/layout-engine'
import { createCursor, updateCursor, type CursorState, type SpriteState } from '../../prototype/cursor'
import { getCircleIntervalForBand, getEllipseIntervalForBand } from '../../prototype/obstacle'
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

const BEAM_DURATION    = 500
const BEAM_TEXT_RADIUS = 40
const DEMON_RADIUS     = 24
const DEMON_DEATH_MS   = 600
const DEMON_COUNT      = 4

const MIMIC_HITBOX_R   = 70
const FERN_SPEED       = 1.2
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
type Demon = {
  id: number; x: number; y: number; vx: number; vy: number
  phase: number; state: 'floating' | 'dying' | 'dead'; deathStart: number
}
type ZoltraakBeam = {
  x1: number; y1: number; x2: number; y2: number
  startTime: number; hitDemonId: number | null
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

function raycastHits(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number, r: number): boolean {
  const dx = x2 - x1, dy = y2 - y1, fx = x1 - cx, fy = y1 - cy
  const a = dx * dx + dy * dy, b = 2 * (fx * dx + fy * dy), c = fx * fx + fy * fy - r * r
  let disc = b * b - 4 * a * c
  if (disc < 0) return false
  disc = Math.sqrt(disc)
  const t1 = (-b - disc) / (2 * a), t2 = (-b + disc) / (2 * a)
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)
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
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

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

    let demons: Demon[] = []
    let beams: ZoltraakBeam[] = []
    let demonIdCounter = 0

    let mimicState: MimicAnimState = 'closed'
    let mimicX = 0, mimicY = 0
    let trapActive = false, chompStartTime = 0, trapCooldownEnd = 0
    let fernX = -200, fernY = 0
    let fernState: 'idle' | 'running' | 'pulling' = 'idle'
    let fernPullStartTime = 0
    let fernTargetX = 0, fernTargetY = 0

    // ── Canvas resize ──
    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth, h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      mimicX = w - 90; mimicY = h - 90
      fernTargetX = mimicX - 80; fernTargetY = mimicY
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

    // ── Demons ──
    function spawnDemons() {
      demons = []
      for (let i = 0; i < DEMON_COUNT; i++) {
        const m = 60
        const x = m + Math.random() * (window.innerWidth - m * 2)
        const y = m + Math.random() * (window.innerHeight * 0.5)
        const angle = Math.random() * Math.PI * 2
        const spd = 0.4 + Math.random() * 0.6
        demons.push({ id: demonIdCounter++, x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, phase: Math.random() * Math.PI * 2, state: 'floating', deathStart: 0 })
      }
    }

    function updateDemons() {
      for (const d of demons) {
        if (d.state !== 'floating') continue
        d.phase += 0.03; d.x += d.vx; d.y += d.vy
        if (d.x < DEMON_RADIUS || d.x > window.innerWidth  - DEMON_RADIUS) { d.vx *= -1; d.x = Math.max(DEMON_RADIUS, Math.min(window.innerWidth  - DEMON_RADIUS, d.x)) }
        if (d.y < DEMON_RADIUS || d.y > window.innerHeight * 0.6)          { d.vy *= -1; d.y = Math.max(DEMON_RADIUS, Math.min(window.innerHeight * 0.6, d.y)) }
      }
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
      const beam: ZoltraakBeam = { x1: beamOriginX, y1: beamOriginY, x2: endX, y2: endY, startTime: timestamp, hitDemonId: null }
      const HIT_R = DEMON_RADIUS + 14
      for (const d of demons) {
        if (d.state !== 'floating') continue
        const bob = Math.sin(d.phase) * 5
        if (raycastHits(beam.x1, beam.y1, beam.x2, beam.y2, d.x, d.y + bob, HIT_R)) {
          d.state = 'dying'; d.deathStart = timestamp; beam.hitDemonId = d.id; break
        }
      }
      beams.push(beam)
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
        fernX = Math.max(0, mimicX - 600); fernY = mimicY; fernState = 'running'
      }
    }

    function updateTrap(timestamp: number) {
      if (!trapActive) return
      if (mimicState === 'chomping' && timestamp - chompStartTime > 200) mimicState = 'chewing'
      if (fernState === 'running') {
        fernX += FERN_SPEED
        if (fernX >= fernTargetX) { fernX = fernTargetX; fernState = 'pulling'; fernPullStartTime = timestamp }
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
      const region: Rect = { x: GUTTER, y: GUTTER, width: window.innerWidth - GUTTER * 2, height: window.innerHeight - GUTTER * 2 }

      const getBlocked = (bandTop: number, bandBottom: number): Interval[] => {
        const intervals: Interval[] = []

        // Frieren — pixel hitmap
        if (cursor.x > -1000 && !cursor.trapped) {
          if (currentSpriteFrame) {
            if (!hitmap || hitmap.img !== currentSpriteFrame || hitmap.size !== currentSpriteDrawSize || hitmap.facingLeft !== cursor.facingLeft) {
              hitmap = buildHitmap(currentSpriteFrame, currentSpriteDrawSize, cursor.facingLeft)
            }
            const si = getSpriteInterval(cursor.x, cursor.y, hitmap, bandTop, bandBottom)
            if (si) intervals.push(si)
          } else {
            const ci = getEllipseIntervalForBand(cursor.x, cursor.y, cursor.radius * 0.42, cursor.radius, bandTop, bandBottom)
            if (ci) intervals.push(ci)
          }
        }

        // Mimic — always blocks (permanent fixture)
        {
          const mi = getEllipseIntervalForBand(mimicX, mimicY, MIMIC_SIZE * 0.45, MIMIC_SIZE * 0.5, bandTop, bandBottom)
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

        // Demons
        for (const d of demons) {
          if (d.state !== 'floating') continue
          const bob = Math.sin(d.phase) * 5
          const di = getCircleIntervalForBand(d.x, d.y + bob, DEMON_RADIUS + 10, bandTop, bandBottom)
          if (di) intervals.push(di)
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
      return allLines
    }

    // ── Text rendering ──
    function setJustifySpacing(line: PositionedLine) {
      if (line.isLastLine) { ;(ctx as any).wordSpacing = '0px'; return }
      const spaces = (line.text.match(/ /g) ?? []).length
      if (spaces > 0 && line.width / line.slotWidth > 0.55) {
        ;(ctx as any).wordSpacing = `${(line.slotWidth - line.width) / spaces}px`
      } else {
        ;(ctx as any).wordSpacing = '0px'
      }
    }

    function findSplitIndex(text: string, targetX: number, lineStartX: number): number {
      const rel = targetX - lineStartX
      if (rel <= 0) return 0
      if (rel >= ctx.measureText(text).width) return text.length
      let lo = 0, hi = text.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (ctx.measureText(text.slice(0, mid)).width < rel) { lo = mid + 1 } else { hi = mid }
      }
      return lo
    }

    function renderTextWithProximityColor(lines: PositionedLine[]) {
      ctx.font = FONT; ctx.textBaseline = 'top'
      const onScreen = cursor.x > -1000
      for (const line of lines) {
        setJustifySpacing(line)
        if (!onScreen) { ctx.fillStyle = TEXT_COLOR; ctx.fillText(line.text, line.x, line.y); continue }
        const dy = Math.abs(line.y + LINE_HEIGHT / 2 - cursor.y)
        if (dy >= cursor.radius) { ctx.fillStyle = TEXT_COLOR; ctx.fillText(line.text, line.x, line.y); continue }
        const tint = 1 - dy / cursor.radius
        const lineMidX = line.x + line.width / 2
        if (lineMidX < cursor.x) {
          const fadeStart = line.x + line.width - FADE_PX * tint
          const si = findSplitIndex(line.text, fadeStart, line.x)
          const normal = line.text.slice(0, si), tinted = line.text.slice(si)
          ctx.fillStyle = TEXT_COLOR; if (normal) ctx.fillText(normal, line.x, line.y)
          if (tinted) { ctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tint); ctx.fillText(tinted, line.x + ctx.measureText(normal).width, line.y) }
        } else {
          const fadeEnd = line.x + FADE_PX * tint
          const si = findSplitIndex(line.text, fadeEnd, line.x)
          const tinted = line.text.slice(0, si), normal = line.text.slice(si)
          if (tinted) { ctx.fillStyle = lerpColor(TEXT_COLOR, MAGIC_COLOR, tint); ctx.fillText(tinted, line.x, line.y) }
          if (normal) { ctx.fillStyle = TEXT_COLOR; ctx.fillText(normal, line.x + ctx.measureText(tinted).width, line.y) }
        }
      }
      ;(ctx as any).wordSpacing = '0px'
    }

    // ── Background ──
    function renderBackground(w: number, h: number) {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0,    '#F0EAE2')   // matches site bg-primary — seamless top edge
      grad.addColorStop(0.55, '#E8EAF2')   // soft mid-tone
      grad.addColorStop(1,    '#D8DCF0')   // muted lavender-blue at bottom
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h)

      if (flowerImg.complete && flowerImg.naturalWidth > 0) {
        ctx.save(); ctx.imageSmoothingEnabled = false
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

    // ── Cursor rendering ──
    function renderCursor(timestamp: number) {
      if (cursor.x < -1000 || cursor.trapped) return
      const floatOffset = Math.sin(timestamp / 300) * 4
      const cx = cursor.x, cy = cursor.y + floatOffset
      const scaleX = cursor.spriteState === 'dashing' ? 1.4 : 1
      const scaleY = cursor.spriteState === 'dashing' ? 0.8 : 1
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
      beams = beams.filter(b => timestamp - b.startTime < BEAM_DURATION)
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

    // ── Demon rendering ──
    function renderDemons(timestamp: number) {
      for (const d of demons) {
        if (d.state === 'dead') continue
        const bob = Math.sin(d.phase) * 5
        const dx = d.x, dy = d.y + bob
        if (d.state === 'dying') {
          const t = Math.min(1, (timestamp - d.deathStart) / DEMON_DEATH_MS)
          if (t >= 1) { d.state = 'dead'; continue }
          ctx.save(); ctx.globalAlpha = 1 - t
          ctx.strokeStyle = '#CC4444'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.arc(dx, dy, DEMON_RADIUS + 30 * t, 0, Math.PI * 2); ctx.stroke()
          ctx.fillStyle = '#CC4444'; ctx.beginPath(); ctx.arc(dx, dy, DEMON_RADIUS * (1 - t * 0.8), 0, Math.PI * 2); ctx.fill()
          ctx.restore(); continue
        }
        ctx.save()
        ctx.fillStyle = '#4A3F6B'; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(dx, dy, DEMON_RADIUS, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#CC4444'; ctx.globalAlpha = 0.9
        ctx.beginPath(); ctx.arc(dx - 7, dy - 4, 4, 0, Math.PI * 2); ctx.arc(dx + 7, dy - 4, 4, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#ddd'; ctx.globalAlpha = 0.7; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText('魔族', dx, dy + 10)
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
    function render(timestamp: number) {
      scheduled = false
      updateCursor(cursor)
      // updateDemons()  // Phase 5 — disabled
      updateTrap(timestamp)
      checkMimicTrap(timestamp)

      const lines = computeLayout(timestamp)
      renderBackground(window.innerWidth, window.innerHeight)
      renderTextWithProximityColor(lines)
      // renderDemons(timestamp)  // Phase 5 — disabled
      renderBeams(timestamp)
      renderMimic(timestamp)
      renderFern(timestamp)
      renderCursor(timestamp)
      renderAimReticle()

      const cursorOnScreen = cursor.x > -1000
      const hasMovement  = Math.abs(cursor.mouseX - cursor.x) > 0.5 || Math.abs(cursor.mouseY - cursor.y) > 0.5
      const hasBeams     = beams.some(b => timestamp - b.startTime < BEAM_DURATION)
      const hasDying     = demons.some(d => d.state === 'dying')

      if (cursorOnScreen || hasMovement || hasBeams || hasDying || trapActive || fernState === 'running' || mimicState !== 'closed') {
        scheduleRender()
      }
    }

    function scheduleRender() {
      if (scheduled) return
      scheduled = true
      rafId = requestAnimationFrame(render)
    }

    // ── Events ──
    const onMouseMove = (e: MouseEvent) => {
      if (cursor.mouseX < -1000) { cursor.x = e.clientX; cursor.y = e.clientY }
      if (!cursor.trapped) { cursor.mouseX = e.clientX; cursor.mouseY = e.clientY }
      scheduleRender()
    }
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) requestAnimationFrame((ts) => fireZoltraak(e.clientX, e.clientY, ts))
    }
    const onResize = () => { resizeCanvas(); scheduleRender() }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('resize', onResize)

    // ── Init ──
    async function init() {
      resizeCanvas()
      await document.fonts.ready
      prepared = BIO_PARAGRAPHS.map(p => prepareWithSegments(p, FONT))
      // spawnDemons()  // Phase 5 — disabled
      scheduleRender()
    }
    init()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%', cursor: 'none' }}
    />
  )
}
