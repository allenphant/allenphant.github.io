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
  attackTimer: number // frames remaining in attack flash
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

export function updateCursor(state: CursorState): void {
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

  // Lerp toward mouse position
  state.x += (state.mouseX - state.x) * LERP_FACTOR
  state.y += (state.mouseY - state.y) * LERP_FACTOR

  // Velocity from lerp only — used for facing direction (recoil excluded)
  state.vx = state.x - prevX
  state.vy = state.y - prevY

  // Apply and decay recoil impulse (after velocity, so facing is unaffected)
  state.x += state.recoilVx
  state.y += state.recoilVy
  state.recoilVx *= 0.72
  state.recoilVy *= 0.72
  state.speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy)

  // Facing direction: follow mouse position relative to cursor (instant, no dead zone needed)
  const dx = state.mouseX - state.x
  if (dx < 0) {
    state.facingLeft = true
  } else if (dx > 0) {
    state.facingLeft = false
  }

  // Sprite state machine — attack takes priority
  if (state.attackTimer > 0) {
    state.attackTimer--
    state.spriteState = 'attacking'
  } else if (state.speed >= SPEED_DASHING) {
    state.spriteState = 'dashing'
  } else if (state.speed >= SPEED_GLIDING) {
    state.spriteState = 'gliding'
  } else {
    state.spriteState = 'idle'
  }
}
