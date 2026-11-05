const LERP_FACTOR = 0.01

// Speed thresholds (lerp-pixels per frame)
const SPEED_GLIDING = 1
const SPEED_DASHING = 6.4

export type SpriteState = 'idle' | 'gliding' | 'dashing' | 'attacking' | 'trapped'

export type CursorState = {
  mouseX: number
  mouseY: number
  x: number
  y: number
  vx: number
  vy: number
  speed: number
  facingLeft: boolean
  radius: number
  spriteState: SpriteState
  trapped: boolean
  attackTimer: number // 60Hz frames remaining in attack flash
  recoilVx: number   // impulse velocity added on shot, decays each frame
  recoilVy: number
}

export function createCursor(radius = 100): CursorState {
  return {
    mouseX: -9999,
    mouseY: -9999,
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    speed: 0,
    facingLeft: false,
    radius,
    spriteState: 'idle',
    trapped: false,
    attackTimer: 0,
    recoilVx: 0,
    recoilVy: 0,
  }
}

/** Below this distance (px) the cursor snaps onto its target, so it truly comes to rest. */
const SNAP_DIST = 0.5
/** Recoil below this (px per 60Hz frame) is treated as zero. */
const RECOIL_EPS = 0.01

/**
 * Advance the cursor simulation.
 *
 * `steps` is the elapsed time expressed in 60Hz frames (1 = 16.7ms). All
 * tuning constants were authored for 60Hz, so scaling by `steps` keeps the
 * motion identical on 60/120/144Hz displays. Defaults to 1 for callers that
 * step once per frame.
 */
export function updateCursor(state: CursorState, steps = 1): void {
  if (state.trapped) {
    // Cursor locked during mimic trap
    state.speed = 0
    state.vx = 0
    state.vy = 0
    state.spriteState = 'trapped'
    return
  }

  const prevX = state.x
  const prevY = state.y

  // Lerp toward mouse position (frame-rate independent exponential smoothing)
  const k = 1 - Math.pow(1 - LERP_FACTOR, steps)
  state.x += (state.mouseX - state.x) * k
  state.y += (state.mouseY - state.y) * k
  if (Math.abs(state.mouseX - state.x) < SNAP_DIST && Math.abs(state.mouseY - state.y) < SNAP_DIST) {
    state.x = state.mouseX
    state.y = state.mouseY
  }

  // Velocity from lerp only, in px per 60Hz frame — used for facing and the
  // speed thresholds below (recoil excluded)
  state.vx = (state.x - prevX) / steps
  state.vy = (state.y - prevY) / steps

  // Apply and decay recoil impulse (after velocity, so facing is unaffected)
  state.x += state.recoilVx * steps
  state.y += state.recoilVy * steps
  const decay = Math.pow(0.72, steps)
  state.recoilVx *= decay
  state.recoilVy *= decay
  if (Math.abs(state.recoilVx) < RECOIL_EPS) state.recoilVx = 0
  if (Math.abs(state.recoilVy) < RECOIL_EPS) state.recoilVy = 0
  state.speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)

  // Facing direction: follow mouse position relative to cursor (instant, no dead zone needed)
  const dx = state.mouseX - state.x
  if (dx < 0) {
    state.facingLeft = true
  } else if (dx > 0) {
    state.facingLeft = false
  }

  // Sprite state machine — attack takes priority.
  // attackTimer counts 60Hz frames, so it is decremented by elapsed steps.
  if (state.attackTimer > 0) {
    state.attackTimer = Math.max(0, state.attackTimer - steps)
    state.spriteState = 'attacking'
  } else if (state.speed >= SPEED_DASHING) {
    state.spriteState = 'dashing'
  } else if (state.speed >= SPEED_GLIDING) {
    state.spriteState = 'gliding'
  } else {
    state.spriteState = 'idle'
  }
}
