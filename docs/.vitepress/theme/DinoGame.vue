<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

// 精灵图来自 Chromium 离线小恐龙，BSD 许可。见 /img/offline-sprite-LICENSE.txt
const SPRITE_URL = '/img/offline-sprite-2x.png'

const route = useRoute()
const { isDark } = useData()
const show = computed(() => route.path === '/')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const duckRef = ref<HTMLButtonElement | null>(null)

let destroy: (() => void) | null = null
let bootToken = 0

async function boot () {
  const token = ++bootToken
  destroy?.()
  destroy = null
  if (!show.value) return
  await nextTick()
  if (token !== bootToken || !canvasRef.value) return
  destroy = createGame(canvasRef.value, duckRef.value, () => isDark.value)
}

onMounted(boot)
watch(() => route.path, boot)
onBeforeUnmount(() => {
  bootToken++
  destroy?.()
  destroy = null
})

const HI_KEY = 'zqdejob-dino-hi'
const H = 150
const GROUND_TOP = 93
const FEET = 140

const HD = {
  cactusSmall: { x: 446, y: 2 },
  cactusLarge: { x: 652, y: 2 },
  cloud: { x: 166, y: 2 },
  horizon: { x: 2, y: 104 },
  bird: { x: 260, y: 2 },
  restart: { x: 2, y: 130 },
  text: { x: 1294, y: 2 },
  trex: { x: 1678, y: 2 }
}

type Box = { x: number, y: number, w: number, h: number }

const TREX_BOXES: Box[] = [
  { x: 22, y: 0, w: 17, h: 16 },
  { x: 1, y: 18, w: 30, h: 9 },
  { x: 10, y: 35, w: 14, h: 8 },
  { x: 1, y: 24, w: 29, h: 5 },
  { x: 5, y: 30, w: 21, h: 4 },
  { x: 9, y: 34, w: 15, h: 4 }
]
const DUCK_BOXES: Box[] = [{ x: 1, y: 18, w: 55, h: 25 }]
const SMALL_BOXES: Box[] = [
  { x: 0, y: 7, w: 5, h: 27 },
  { x: 4, y: 0, w: 6, h: 34 },
  { x: 10, y: 4, w: 7, h: 14 }
]
const LARGE_BOXES: Box[] = [
  { x: 0, y: 12, w: 7, h: 38 },
  { x: 8, y: 0, w: 7, h: 49 },
  { x: 13, y: 10, w: 10, h: 38 }
]
const BIRD_BOXES: Box[] = [
  { x: 15, y: 15, w: 16, h: 5 },
  { x: 18, y: 21, w: 24, h: 6 },
  { x: 2, y: 14, w: 4, h: 3 },
  { x: 6, y: 10, w: 4, h: 7 },
  { x: 10, y: 8, w: 6, h: 9 }
]

function repeatBoxes (base: Box[], size: number, unit: number): Box[] {
  const boxes: Box[] = []
  for (let i = 0; i < size; i++) {
    for (const box of base) {
      boxes.push({ x: box.x + i * unit, y: box.y, w: box.w, h: box.h })
    }
  }
  return boxes
}

function createGame (
  canvas: HTMLCanvasElement,
  duckBtn: HTMLButtonElement | null,
  getDark: () => boolean
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  const image = new Image()
  image.src = SPRITE_URL
  let imageReady = false
  image.onload = () => { imageReady = true }

  let worldW = 600
  let laidW = 0
  let laidH = 0
  let raf = 0
  let last = performance.now()
  let state: 'ready' | 'running' | 'over' = 'ready'
  let speed = 6
  let distance = 0
  let score = 0
  let hi = loadHi()
  let y = GROUND_TOP
  let vy = 0
  let jumping = false
  let reachedMin = false
  let ducking = false
  let runTime = 0
  let horizon = 0
  let spawnIn = 420
  let birdTimer = 0
  let birdFrame = 0

  type Obstacle = {
    kind: 'cactus' | 'bird'
    x: number
    y: number
    w: number
    h: number
    sx: number
    sy: number
    sw: number
    sh: number
    frameW: number
    boxes: Box[]
    speedOffset: number
  }

  let obstacles: Obstacle[] = []
  const clouds = [
    { x: 80, y: 36 },
    { x: 280, y: 58 },
    { x: 520, y: 28 }
  ]

  function loadHi () {
    try {
      const n = Number(localStorage.getItem(HI_KEY))
      return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
    } catch {
      return 0
    }
  }

  function saveHi (n: number) {
    try {
      localStorage.setItem(HI_KEY, String(n))
    } catch {
      // 写不进去就只留在这一局里
    }
  }

  function layout () {
    const cssW = canvas.clientWidth || 600
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(cssW * dpr))
    const h = Math.max(1, Math.round(H * dpr))
    if (w !== laidW || h !== laidH) {
      canvas.width = w
      canvas.height = h
      laidW = w
      laidH = h
    }
    worldW = cssW
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function reset () {
    obstacles = []
    speed = 6
    distance = 0
    score = 0
    y = GROUND_TOP
    vy = 0
    jumping = false
    reachedMin = false
    ducking = false
    runTime = 0
    spawnIn = 420
    birdFrame = 0
    birdTimer = 0
  }

  function jump () {
    if (state !== 'running') {
      reset()
      state = 'running'
    }
    ducking = false
    if (!jumping && y >= GROUND_TOP - 0.5) {
      jumping = true
      reachedMin = false
      vy = -10 - speed / 10
    }
  }

  function releaseJump () {
    if (reachedMin && vy < -5) vy = -5
  }

  function spawnCactus (kind: 'small' | 'large') {
    const unit = kind === 'small' ? 17 : 25
    const height = kind === 'small' ? 35 : 50
    const top = kind === 'small' ? 105 : 90
    const multipleAt = kind === 'small' ? 4 : 7
    const origin = kind === 'small' ? HD.cactusSmall : HD.cactusLarge
    const base = kind === 'small' ? SMALL_BOXES : LARGE_BOXES
    let size = 1 + Math.floor(Math.random() * 3)
    if (size > 1 && multipleAt > speed) size = 1
    const sourceWidth = unit * 2
    const sx = (sourceWidth * size) * (0.5 * (size - 1)) + origin.x
    obstacles.push({
      kind: 'cactus',
      x: worldW + 20,
      y: top,
      w: unit * size,
      h: height,
      sx,
      sy: origin.y,
      sw: sourceWidth * size,
      sh: height * 2,
      frameW: 0,
      boxes: repeatBoxes(base, size, unit),
      speedOffset: 0
    })
  }

  function spawnBird () {
    const tops = [100, 75, 50]
    obstacles.push({
      kind: 'bird',
      x: worldW + 20,
      y: tops[Math.floor(Math.random() * tops.length)],
      w: 46,
      h: 40,
      sx: HD.bird.x,
      sy: HD.bird.y,
      sw: 92,
      sh: 80,
      frameW: 92,
      boxes: BIRD_BOXES,
      speedOffset: 0.8
    })
  }

  function spawn () {
    if (speed >= 8.5 && Math.random() < 0.28) spawnBird()
    else if (Math.random() < 0.55) spawnCactus('small')
    else spawnCactus('large')
  }

  function overlaps (ax: number, ay: number, a: Box, bx: number, by: number, b: Box) {
    return ax + a.x < bx + b.x + b.w &&
      ax + a.x + a.w > bx + b.x &&
      ay + a.y < by + b.y + b.h &&
      ay + a.y + a.h > by + b.y
  }

  function hit () {
    const boxes = ducking ? DUCK_BOXES : TREX_BOXES
    for (const item of obstacles) {
      for (const a of boxes) {
        for (const b of item.boxes) {
          if (overlaps(50, y, a, item.x, item.y, b)) return true
        }
      }
    }
    return false
  }

  function step (now: number) {
    const delta = Math.min(40, now - last)
    last = now
    const frames = delta / (1000 / 60)
    if (state !== 'running') return
    runTime += delta
    if (speed < 13) speed += 0.001 * frames
    distance += speed * frames
    score = Math.round(distance * 0.025)

    if (jumping) {
      if (ducking) y += vy * 3 * frames
      else y += vy * frames
      vy += 0.6 * frames
      if (y < GROUND_TOP - 30) reachedMin = true
      if (y < 30 && reachedMin && vy < -5) vy = -5
      if (y >= GROUND_TOP) {
        y = GROUND_TOP
        vy = 0
        jumping = false
        reachedMin = false
      }
    }

    const move = (speed * 60 / 1000) * delta
    horizon += move
    for (const cloud of clouds) cloud.x -= move * 0.16
    for (const item of obstacles) item.x -= move * (item.speedOffset ? (speed + item.speedOffset) / speed : 1)
    obstacles = obstacles.filter((item) => item.x + item.w > -20)

    birdTimer += delta
    if (birdTimer > 1000 / 6) {
      birdTimer = 0
      birdFrame = birdFrame === 0 ? 1 : 0
    }

    spawnIn -= move
    if (spawnIn <= 0) {
      spawn()
      spawnIn = 140 + Math.random() * 180 + speed * 8
    }

    if (hit()) {
      if (score > hi) {
        hi = score
        saveHi(hi)
      }
      state = 'over'
      jumping = false
      ducking = false
    }
  }

  function blit (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) {
    if (!imageReady) return
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh)
  }

  function drawTrex () {
    let offset = 0
    let width = 44
    if (state === 'over') {
      offset = 220
    } else if (ducking && state === 'running') {
      offset = Math.floor(runTime / 125) % 2 === 0 ? 264 : 323
      width = 59
    } else if (jumping) {
      offset = 0
    } else if (state === 'running') {
      offset = Math.floor(runTime / 83) % 2 === 0 ? 88 : 132
    } else {
      const blink = Math.floor(performance.now() / 220) % 14 === 0
      offset = blink ? 44 : 0
    }
    blit(
      HD.trex.x + offset * 2,
      HD.trex.y,
      width * 2,
      94,
      50,
      y,
      width,
      47
    )
  }

  function drawDigits (text: string, right: number, top: number) {
    const dest = 11
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const dx = right - (text.length - i) * dest
      if (ch === ' ') continue
      const value = ch === 'H' ? 10 : ch === 'I' ? 11 : Number(ch)
      if (!Number.isFinite(value)) continue
      blit(HD.text.x + value * 20, HD.text.y, 20, 26, dx, top, 10, 13)
    }
  }

  function draw () {
    layout()
    const night = state === 'running' && Math.floor(score / 700) % 2 === 1
    const lightOnDark = getDark() !== night
    ctx.filter = 'none'
    ctx.fillStyle = lightOnDark ? '#111111' : '#f7f7f7'
    ctx.fillRect(0, 0, worldW, H)
    ctx.filter = lightOnDark ? 'invert(1)' : 'none'

    for (const cloud of clouds) {
      if (cloud.x < -50) cloud.x = worldW + 30 + Math.random() * 80
      blit(HD.cloud.x, HD.cloud.y, 92, 28, cloud.x, cloud.y, 46, 14)
    }

    const tile = 600
    const shift = horizon % tile
    for (let x = -shift; x < worldW; x += tile) {
      blit(HD.horizon.x, HD.horizon.y, 1200, 24, x, 127, 600, 12)
    }

    for (const item of obstacles) {
      const sx = item.kind === 'bird' ? item.sx + birdFrame * item.frameW : item.sx
      blit(sx, item.sy, item.sw, item.sh, item.x, item.y, item.w, item.h)
    }

    drawTrex()

    const current = String(Math.min(99999, score)).padStart(5, '0')
    if (hi > 0) {
      drawDigits(`HI ${String(Math.min(99999, hi)).padStart(5, '0')} ${current}`, worldW - 14, 4)
    } else {
      drawDigits(current, worldW - 14, 4)
    }

    if (state === 'over') {
      blit(HD.text.x, 28, 382, 22, Math.round(worldW / 2 - 95), 32, 191, 11)
      blit(HD.restart.x, HD.restart.y, 72, 64, Math.round(worldW / 2 - 18), 58, 36, 32)
    }

    ctx.filter = 'none'
  }

  function frame (now: number) {
    step(now)
    draw()
    raf = requestAnimationFrame(frame)
  }

  function onKeyDown (event: KeyboardEvent) {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault()
      if (event.repeat) return
      jump()
    } else if (event.code === 'ArrowDown') {
      event.preventDefault()
      if (state === 'running') {
        ducking = true
        if (jumping) vy = 1
      }
    }
  }

  function onKeyUp (event: KeyboardEvent) {
    if (event.code === 'Space' || event.code === 'ArrowUp') releaseJump()
    if (event.code === 'ArrowDown') ducking = false
  }

  function onPointerDown () {
    canvas.focus({ preventScroll: true })
    jump()
  }

  function onDuckDown (event: PointerEvent) {
    event.preventDefault()
    if (state === 'running') {
      ducking = true
      if (jumping) vy = 1
    }
    duckBtn?.setPointerCapture(event.pointerId)
  }

  function onDuckUp () {
    ducking = false
  }

  function onResize () {
    laidW = 0
    laidH = 0
  }

  canvas.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', releaseJump)
  duckBtn?.addEventListener('pointerdown', onDuckDown)
  window.addEventListener('pointerup', onDuckUp)
  window.addEventListener('resize', onResize)
  const observer = new ResizeObserver(onResize)
  observer.observe(canvas)
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    observer.disconnect()
    canvas.removeEventListener('keydown', onKeyDown)
    canvas.removeEventListener('keyup', onKeyUp)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', releaseJump)
    duckBtn?.removeEventListener('pointerdown', onDuckDown)
    window.removeEventListener('pointerup', onDuckUp)
    window.removeEventListener('resize', onResize)
  }
}
</script>

<template>
  <div v-if="show" class="dino-game">
    <div class="dino-bar">
      <span class="name">小恐龙</span>
      <span class="hint">空格或点击跳跃，按住 ↓ 蹲下躲飞鸟</span>
      <button
        ref="duckRef"
        type="button"
        class="duck"
        tabindex="-1"
      >
        蹲下
      </button>
    </div>
    <canvas
      ref="canvasRef"
      class="dino-canvas"
      tabindex="0"
      role="application"
      aria-label="小恐龙。空格或点击跳跃，下方向键蹲下。"
    />
  </div>
</template>

<style scoped>
.dino-game {
  margin-top: 2rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  user-select: none;
}

.dino-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 13px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}

.name {
  flex: none;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.hint {
  flex: 1;
  min-width: 0;
}

.duck {
  flex: none;
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 0.15rem 0.7rem;
  font: inherit;
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
}

.duck:active {
  background: var(--vp-c-default-soft);
}

.dino-canvas {
  display: block;
  width: 100%;
  height: 150px;
  touch-action: none;
  cursor: pointer;
}

.dino-canvas:focus {
  outline: none;
}

.dino-canvas:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

@media (max-width: 640px) {
  .hint {
    display: none;
  }
}
</style>
