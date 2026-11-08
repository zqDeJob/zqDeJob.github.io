<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const caption = ref('跟着指针')
const ready = ref(false)

const INK = [31 / 255, 26 / 255, 27 / 255]
const BG = [255 / 255, 11 / 255, 54 / 255, 1]

type Tex = WebGLTexture

type Part = {
  tex: Tex
  index: number
  cols: number
  rows: number
  x: number
  y: number
  sx: number
  sy: number
  order: number
  parallax: number
  show: number
  dither?: boolean
  opacity?: number
  world?: boolean
  layer?: 'face' | 'skull'
}

let gl: WebGLRenderingContext | null = null
let faceProg: WebGLProgram | null = null
let inkProg: WebGLProgram | null = null
let mixProg: WebGLProgram | null = null
let buf: WebGLBuffer | null = null
let noise: Tex | null = null
let faceTarget: { tex: Tex, fb: WebGLFramebuffer, w: number, h: number } | null = null
let skullTarget: { tex: Tex, fb: WebGLFramebuffer, w: number, h: number } | null = null
let flowTex: Tex | null = null
const FLOW_SIZE = 128
const flowSrc = new Float32Array(FLOW_SIZE * FLOW_SIZE * 3)
const flowDst = new Float32Array(FLOW_SIZE * FLOW_SIZE * 3)
const flowBytes = new Uint8Array(FLOW_SIZE * FLOW_SIZE * 4)
let flowUseSrc = true
let raf = 0
let alive = true
let showAt = 0
let clock0 = 0

let tx = 0
let ty = 0
let cx = 0
let cy = 0
let hovering = false
let dragging = false
let hoverFactor = 0
let dragFactor = 0
let laughUntil = 0
let blinkAt = 0
let rightBlinkAt = 0
let dragMag = 0
let wiping = false
let pointerX = 0
let pointerY = 0
let pointerU = 0.5
let pointerV = 0.5
let flowPrevX = 0
let flowPrevY = 0
let flowClock = 0
let velX = 0
let velY = 0
let easedU = 0.5
let easedV = 0.5

const parts: Part[] = []

function elasticOut (t: number, period = 0.35) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const s = period / 4
  return 2 ** (-10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1
}

function stepped (t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return Math.min(1, Math.floor(t * 12) / 12)
}

function mul (a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3]
    }
  }
  return o
}

function perspective (fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2)
  const nf = 1 / (near - far)
  const m = new Float32Array(16)
  m[0] = f / aspect
  m[5] = f
  m[10] = (far + near) * nf
  m[11] = -1
  m[14] = 2 * far * near * nf
  return m
}

function model (x: number, y: number, rot: number, sx: number, sy: number) {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  const m = new Float32Array(16)
  m[0] = c * sx
  m[1] = s * sx
  m[4] = -s * sy
  m[5] = c * sy
  m[10] = 1
  m[12] = x
  m[13] = y
  m[15] = 1
  return m
}

function compile (context: WebGLRenderingContext, type: number, source: string) {
  const shader = context.createShader(type)
  if (!shader) throw new Error('shader')
  context.shaderSource(shader, source)
  context.compileShader(shader)
  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    throw new Error(context.getShaderInfoLog(shader) || 'compile')
  }
  return shader
}

function program (context: WebGLRenderingContext, vert: string, frag: string) {
  const prog = context.createProgram()
  if (!prog) throw new Error('program')
  context.attachShader(prog, compile(context, context.VERTEX_SHADER, vert))
  context.attachShader(prog, compile(context, context.FRAGMENT_SHADER, frag))
  context.bindAttribLocation(prog, 0, 'aPos')
  context.bindAttribLocation(prog, 1, 'aUv')
  context.linkProgram(prog)
  if (!context.getProgramParameter(prog, context.LINK_STATUS)) {
    throw new Error(context.getProgramInfoLog(prog) || 'link')
  }
  return prog
}

const VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
uniform mat4 uMvp;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = uMvp * vec4(aPos, 0.0, 1.0);
}
`

const FACE_FRAG = `
precision highp float;
uniform sampler2D uMap;
uniform float uIndex;
uniform float uCols;
uniform float uRows;
varying vec2 vUv;
void main() {
  float row = (uRows - 1.0) - floor(uIndex / uCols);
  float col = mod(uIndex, uCols);
  vec2 uv = vec2(col / uCols + vUv.x / uCols, row / uRows + vUv.y / uRows);
  vec4 tex = texture2D(uMap, uv);
  if (tex.a < 0.1) discard;
  gl_FragColor = vec4(max(tex.rgb, vec3(0.012)), 1.0);
}
`

const INK_FRAG = `
precision highp float;
uniform sampler2D uMap;
uniform sampler2D uNoise;
uniform vec3 uColor;
uniform vec2 uScreen;
uniform float uIndex;
uniform float uCols;
uniform float uRows;
uniform float uVisibility;
uniform float uOpacity;
uniform float uTime;
varying vec2 vUv;
void main() {
  float row = (uRows - 1.0) - floor(uIndex / uCols);
  float col = mod(uIndex, uCols);
  vec2 uv = vec2(col / uCols + vUv.x / uCols, row / uRows + vUv.y / uRows);
  float ink = texture2D(uMap, uv).r;
  vec2 screenUv = gl_FragCoord.xy / uScreen;
  float grain = texture2D(uNoise, fract(screenUv * 0.5 + uTime)).r;
  float dither = 1.0 - uVisibility * 0.98;
  float alpha = step(0.1, ink * step(dither, grain)) * uOpacity;
  if (alpha < 0.5) discard;
  gl_FragColor = vec4(uColor, 1.0);
}
`

const MIX_VERT = `
attribute vec2 aPos;
attribute vec2 aUv;
varying vec2 vUv;
void main() {
  vUv = aUv;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`

const MIX_FRAG = `
precision highp float;
uniform sampler2D uFace;
uniform sampler2D uSkull;
uniform sampler2D uFlow;
uniform sampler2D uNoise;
uniform vec2 uScreen;
uniform float uTime;
varying vec2 vUv;

float sdRound(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

void main() {
  float cols = 20.0;
  float rows = max(floor(cols * uScreen.y / uScreen.x), 1.0);
  vec2 grid = vec2(cols, rows);
  vec2 uvFlow = floor(vUv * grid) / grid;
  vec3 face = texture2D(uFace, vUv).rgb;
  vec3 skull = texture2D(uSkull, vUv).rgb;
  float flow = texture2D(uFlow, uvFlow + 0.5 / grid).r;
  float shown = smoothstep(0.72, 1.0, flow);
  float cell = 1.0 - 0.3 * (1.0 - shown);
  float radius = 0.5 - 0.3 * shown;
  vec2 local = fract(vUv * grid) * 2.0 - 1.0;
  float box = sdRound(local, vec2(cell), radius);
  float rounded = 1.0 - step(0.0, box);
  float grain = texture2D(uNoise, fract(vUv * 3.0 + uTime)).r;
  float mask = step(grain, shown * 0.9) * rounded;
  gl_FragColor = vec4(mix(face, skull, mask), 1.0);
}
`

function makeTitle (context: WebGLRenderingContext) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 420
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '700 68px "Comic Sans MS", "Chalkboard SE", cursive'
  const lines = ['how are you,', 'i am fine thank you,', 'and you']
  const gap = 96
  const top = canvas.height / 2 - gap
  lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width / 2, top + index * gap)
  })
  return upload(context, canvas, context.CLAMP_TO_EDGE)
}

function loadImage (src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(src))
    img.src = src
  })
}

function upload (
  context: WebGLRenderingContext,
  img: TexImageSource,
  wrap: number
) {
  const tex = context.createTexture()
  if (!tex) throw new Error('texture')
  context.bindTexture(context.TEXTURE_2D, tex)
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1)
  context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, img)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.NEAREST)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.NEAREST)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, wrap)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, wrap)
  return tex
}

function pointerToWorld (event: PointerEvent) {
  const canvas = canvasRef.value
  if (!canvas) return
  const box = canvas.getBoundingClientRect()
  const aspect = box.width / Math.max(box.height, 1)
  const vHeight = 2 * Math.tan((45 * Math.PI) / 180 / 2) * 5
  const vWidth = vHeight * aspect
  tx = ((event.clientX - box.left) / box.width - 0.5) * 2
  ty = -((event.clientY - box.top) / box.height - 0.5) * 2
  pointerX = event.clientX - box.left
  pointerY = event.clientY - box.top
  pointerU = pointerX / Math.max(box.width, 1)
  pointerV = 1 - pointerY / Math.max(box.height, 1)
  return {
    x: ((event.clientX - box.left) / box.width - 0.5) * vWidth,
    y: -((event.clientY - box.top) / box.height - 0.5) * vHeight
  }
}

function headCenter () {
  const pt = { x: cx, y: cy }
  let hx = pt.x * 0.05
  let hy = pt.y * 0.035
  if (dragFactor > 0.2) {
    hx += pt.x * 0.8 * dragFactor
    hy += pt.y * 0.55 * dragFactor
  }
  return { x: hx, y: hy }
}

function onMove (event: PointerEvent) {
  const world = pointerToWorld(event)
  if (!world) return
  const head = headCenter()
  const near = Math.hypot(world.x - head.x, world.y - head.y) < 0.95
  if (!dragging) hovering = near
}

function onLeave () {
  if (dragging || wiping) return
  tx = 0
  ty = 0
  hovering = false
}

function onDown (event: PointerEvent) {
  const world = pointerToWorld(event)
  if (!world) return
  const target = event.currentTarget as HTMLElement
  try { target.setPointerCapture(event.pointerId) } catch { /* 合成事件没有活动指针 */ }
  const head = headCenter()
  if (Math.hypot(world.x - head.x, world.y - head.y) <= 0.95) {
    dragging = true
    hovering = true
    wiping = false
    laughUntil = 0
    dragMag = 0
    return
  }
  wiping = true
}

function onUp () {
  if (dragging) laughUntil = performance.now() + 420
  dragging = false
  wiping = false
}

function replay () {
  showAt = performance.now()
}

function resize () {
  const canvas = canvasRef.value
  if (!canvas || !gl) return
  const box = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = Math.max(1, Math.round(box.width * dpr))
  const h = Math.max(1, Math.round(box.height * dpr))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  gl.viewport(0, 0, w, h)
}

function drawSprite (
  context: WebGLRenderingContext,
  prog: WebGLProgram,
  mvp: Float32Array,
  part: Part,
  visibility: number
) {
  context.useProgram(prog)
  context.bindBuffer(context.ARRAY_BUFFER, buf)
  context.enableVertexAttribArray(0)
  context.enableVertexAttribArray(1)
  context.vertexAttribPointer(0, 2, context.FLOAT, false, 16, 0)
  context.vertexAttribPointer(1, 2, context.FLOAT, false, 16, 8)
  context.uniformMatrix4fv(context.getUniformLocation(prog, 'uMvp'), false, mvp)
  context.uniform1f(context.getUniformLocation(prog, 'uIndex'), part.index)
  context.uniform1f(context.getUniformLocation(prog, 'uCols'), part.cols)
  context.uniform1f(context.getUniformLocation(prog, 'uRows'), part.rows)
  context.activeTexture(context.TEXTURE0)
  context.bindTexture(context.TEXTURE_2D, part.tex)
  context.uniform1i(context.getUniformLocation(prog, 'uMap'), 0)
  if (part.dither && noise) {
    context.activeTexture(context.TEXTURE1)
    context.bindTexture(context.TEXTURE_2D, noise)
    context.uniform1i(context.getUniformLocation(prog, 'uNoise'), 1)
    context.uniform3f(context.getUniformLocation(prog, 'uColor'), INK[0], INK[1], INK[2])
    context.uniform2f(context.getUniformLocation(prog, 'uScreen'), context.drawingBufferWidth, context.drawingBufferHeight)
    context.uniform1f(context.getUniformLocation(prog, 'uVisibility'), visibility)
    context.uniform1f(context.getUniformLocation(prog, 'uOpacity'), part.opacity ?? 1)
    context.uniform1f(context.getUniformLocation(prog, 'uTime'), ((performance.now() - clock0) * 0.00002))
  }
  context.drawArrays(context.TRIANGLE_STRIP, 0, 4)
}

function allocTarget (context: WebGLRenderingContext, w: number, h: number) {
  const tex = context.createTexture()
  const fb = context.createFramebuffer()
  if (!tex || !fb) throw new Error('fbo')
  context.bindTexture(context.TEXTURE_2D, tex)
  context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, w, h, 0, context.RGBA, context.UNSIGNED_BYTE, null)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE)
  context.bindFramebuffer(context.FRAMEBUFFER, fb)
  context.framebufferTexture2D(context.FRAMEBUFFER, context.COLOR_ATTACHMENT0, context.TEXTURE_2D, tex, 0)
  context.bindFramebuffer(context.FRAMEBUFFER, null)
  return { tex, fb, w, h }
}

function ensureTargets (context: WebGLRenderingContext, w: number, h: number) {
  if (faceTarget && skullTarget && faceTarget.w === w && faceTarget.h === h) return
  faceTarget = allocTarget(context, w, h)
  skullTarget = allocTarget(context, w, h)
}

function smooth (edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function sampleFlow (src: Float32Array, u: number, v: number) {
  const x = Math.min(FLOW_SIZE - 1, Math.max(0, u)) * (FLOW_SIZE - 1)
  const y = Math.min(FLOW_SIZE - 1, Math.max(0, v)) * (FLOW_SIZE - 1)
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(FLOW_SIZE - 1, x0 + 1)
  const y1 = Math.min(FLOW_SIZE - 1, y0 + 1)
  const tx = x - x0
  const ty = y - y0
  const at = (ix: number, iy: number, channel: number) => src[(iy * FLOW_SIZE + ix) * 3 + channel]
  const mix = (channel: number) => {
    const a = at(x0, y0, channel) + (at(x1, y0, channel) - at(x0, y0, channel)) * tx
    const b = at(x0, y1, channel) + (at(x1, y1, channel) - at(x0, y1, channel)) * tx
    return a + (b - a) * ty
  }
  return [mix(0), mix(1), mix(2)]
}

function updateFlow (context: WebGLRenderingContext) {
  if (!flowTex) return
  const now = performance.now()
  if (!flowClock) {
    flowClock = now
    flowPrevX = pointerX
    flowPrevY = pointerY
    easedU = pointerU
    easedV = pointerV
  }
  const dt = Math.max(14, now - flowClock)
  flowClock = now
  const box = canvasRef.value?.getBoundingClientRect()
  const width = box?.width || 1
  const height = box?.height || 1
  const instVx = (flowPrevX - pointerX) / dt
  const instVy = (flowPrevY - pointerY) / dt
  velX += (instVx - velX) * 0.35
  velY += (instVy - velY) * 0.35
  flowPrevX = pointerX
  flowPrevY = pointerY
  easedU += (pointerU - easedU) * 0.2
  easedV += (pointerV - easedV) * 0.2

  const speed = Math.min(1.2, Math.max(Math.hypot(velX, velY), Math.hypot(instVx, instVy)))
  const stampSize = 0.3 * (0.5 + speed * 0.5)
  const strength = 1 - (1 - Math.min(1, speed)) ** 3
  const aspect = width / Math.max(height, 1)
  const stamp = wiping ? 1 : 0
  const steps = Math.min(2, dt / 16.67)
  const fade = 0.99 ** steps
  const invScale = 1 / (0.9925 ** steps)
  const src = flowUseSrc ? flowSrc : flowDst
  const dst = flowUseSrc ? flowDst : flowSrc

  for (let y = 0; y < FLOW_SIZE; y++) {
    const v = (y + 0.5) / FLOW_SIZE
    for (let x = 0; x < FLOW_SIZE; x++) {
      const u = (x + 0.5) / FLOW_SIZE
      let su = (u * 2 - -0.2) * invScale
      let sv = (v * 2 - 2.4) * invScale
      su = su * 0.5 - 0.1
      sv = sv * 0.5 + 1.2
      const prev = sampleFlow(src, su, sv)
      let r = prev[0] * fade
      let g = prev[1] * fade
      let b = prev[2] * fade
      if (stamp) {
        const dist = Math.hypot((u - easedU) * aspect, v - easedV)
        const fall = smooth(stampSize, 0, dist)
        r += velX * fall
        g += -velY * fall
        b += strength * fall
      }
      const i = (y * FLOW_SIZE + x) * 3
      dst[i] = r
      dst[i + 1] = g
      dst[i + 2] = b
    }
  }
  flowUseSrc = !flowUseSrc

  for (let i = 0, p = 0; i < FLOW_SIZE * FLOW_SIZE; i++, p += 4) {
    const o = i * 3
    const flow = Math.hypot((dst[o] + 1) * 0.5, (dst[o + 1] + 1) * 0.5, dst[o + 2] * 0.5)
    const byte = Math.max(0, Math.min(255, Math.round(flow * 255)))
    flowBytes[p] = byte
    flowBytes[p + 1] = byte
    flowBytes[p + 2] = byte
    flowBytes[p + 3] = 255
  }
  context.bindTexture(context.TEXTURE_2D, flowTex)
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 0)
  context.texImage2D(
    context.TEXTURE_2D,
    0,
    context.RGBA,
    FLOW_SIZE,
    FLOW_SIZE,
    0,
    context.RGBA,
    context.UNSIGNED_BYTE,
    flowBytes
  )
}

function frame () {
  if (!alive) return
  raf = requestAnimationFrame(frame)
  const context = gl
  const canvas = canvasRef.value
  if (!context || !canvas || !faceProg || !inkProg || !ready.value) return
  resize()

  const now = performance.now()
  const elapsed = now - clock0
  cx += (tx - cx) * 0.075
  cy += (ty - cy) * 0.075
  hoverFactor += ((hovering ? 1 : 0) - hoverFactor) * 0.12
  dragFactor += ((dragging ? 1 : 0) - dragFactor) * 0.18
  if (dragging) dragMag = Math.min(1.2, dragMag + 0.01)

  const eyesShut = dragging || (now < blinkAt + 140)
  const rightShut = dragging || (now < rightBlinkAt + 140)
  if (!dragging && now > blinkAt + 2800) {
    blinkAt = now
    rightBlinkAt = now + 70
  }

  let mouth = 14
  if (dragging) mouth = 7
  else if (now < laughUntil) mouth = 6
  else if (hovering) mouth = 11

  const eyeLeft = parts.find((part) => part.show === 6)
  const eyeRight = parts.find((part) => part.show === 7)
  const mouthPart = parts.find((part) => part.show === 8)
  if (eyeLeft) eyeLeft.index = eyesShut ? 44 : 36
  if (eyeRight) eyeRight.index = rightShut ? 60 : 52
  if (mouthPart) mouthPart.index = mouth

  caption.value = wiping
    ? '刮开骷髅'
    : dragging
      ? '拖着 :x'
      : now < laughUntil
        ? '松开 :D'
        : hovering
          ? '悬停 :o'
          : '跟着指针'

  const aspect = canvas.width / Math.max(canvas.height, 1)
  const fov = (45 * Math.PI) / 180
  const vHeight = 2 * Math.tan(fov / 2) * 5
  const vWidth = vHeight * aspect
  const proj = perspective(fov, aspect, 0.1, 1000)
  const view = new Float32Array(16)
  view[0] = view[5] = view[10] = view[15] = 1
  view[14] = -5
  const vp = mul(proj, view)

  const pt = { x: cx, y: cy }
  let hx = pt.x * 0.05
  let hy = pt.y * 0.035
  let hs = 0.825 + hoverFactor * 0.15
  const a = dragMag
  hx += pt.x * 0.8 * dragFactor
  hy += pt.y * 0.55 * dragFactor
  hs += -dragFactor * (0.15 + 0.1 * a)
  hx += Math.cos(elapsed * 0.075) * dragFactor * (0.0035 + a * 0.005)
  hy += Math.sin(elapsed * 0.075 + 0.1) * dragFactor * (0.0035 + a * 0.005)
  const idle = 1 - dragFactor
  const wobble = elapsed * 0.0125
  hx += Math.sin(wobble * 0.5) * idle * 0.035
  hy += Math.cos(wobble) * idle * 0.025
  const rot = -Math.sin(wobble * 0.5) * idle * 0.035
  const ptx = pt.x - hx * 5
  const pty = pt.y - hy * 5
  const head = model(hx, hy, rot, hs, hs)

  const since = (now - showAt) / 1000
  const drawList = [...parts].sort((p, q) => p.order - q.order)
  const paint = (layer: 'face' | 'skull') => {
  for (const part of drawList) {
    if ((part.layer || 'face') !== layer) continue
    const growT = (since - part.show * 0.035) / (part.dither ? 1 : 1.15)
    const grow = elasticOut(growT, part.dither ? 0.3 : 0.35)
    const shown = Math.max(0, part.dither ? 0.5 + 0.5 * grow : grow)
    if (shown <= 0.001) continue
    const revealT = (since - (part.dither ? part.show * 0.035 : 0)) / 0.3
    const visibility = part.dither ? stepped(revealT) : 1
    let mvp: Float32Array
    if (part.world) {
      const x = part.x * (part.dither ? vWidth : 1)
      const y = part.y * (part.dither ? vHeight : 1)
      mvp = mul(vp, model(x, y, 0, part.sx * shown, part.sy * shown))
    } else if (part.order >= 10) {
      const x = part.x * vWidth + pt.y * 0
      const y = part.y * vHeight + cy * 0.25
      const local = model(part.order === 11 ? -0.3 : 0, part.order === 11 ? -0.0375 : 0, 0, part.sx, part.sy)
      mvp = mul(vp, mul(model(x, y, 0, shown, shown), local))
    } else {
      const local = model(
        part.x + ptx * part.parallax,
        part.y + pty * part.parallax,
        0,
        part.sx * shown,
        part.sy * shown
      )
      mvp = mul(vp, mul(head, local))
    }
    drawSprite(context, part.dither ? inkProg : faceProg, mvp, part, visibility)
  }
  }

  ensureTargets(context, canvas.width, canvas.height)
  updateFlow(context)
  if (faceTarget && skullTarget && flowTex && mixProg && noise) {
    context.bindFramebuffer(context.FRAMEBUFFER, faceTarget.fb)
    context.viewport(0, 0, canvas.width, canvas.height)
    context.clearColor(BG[0], BG[1], BG[2], BG[3])
    context.clear(context.COLOR_BUFFER_BIT)
    paint('face')
    context.bindFramebuffer(context.FRAMEBUFFER, skullTarget.fb)
    context.clearColor(INK[0], INK[1], INK[2], 1)
    context.clear(context.COLOR_BUFFER_BIT)
    paint('skull')
    const mix = mixProg
    context.bindFramebuffer(context.FRAMEBUFFER, null)
    context.viewport(0, 0, canvas.width, canvas.height)
    context.useProgram(mix)
    context.bindBuffer(context.ARRAY_BUFFER, buf)
    context.enableVertexAttribArray(0)
    context.enableVertexAttribArray(1)
    context.vertexAttribPointer(0, 2, context.FLOAT, false, 16, 0)
    context.vertexAttribPointer(1, 2, context.FLOAT, false, 16, 8)
    const bind = (unit: number, tex: Tex, name: string) => {
      context.activeTexture(context.TEXTURE0 + unit)
      context.bindTexture(context.TEXTURE_2D, tex)
      context.uniform1i(context.getUniformLocation(mix, name), unit)
    }
    bind(0, faceTarget.tex, 'uFace')
    bind(1, skullTarget.tex, 'uSkull')
    bind(2, flowTex, 'uFlow')
    bind(3, noise, 'uNoise')
    context.uniform2f(context.getUniformLocation(mix, 'uScreen'), canvas.width, canvas.height)
    context.uniform1f(context.getUniformLocation(mix, 'uTime'), elapsed * 0.00002)
    context.drawArrays(context.TRIANGLE_STRIP, 0, 4)
  } else {
    context.bindFramebuffer(context.FRAMEBUFFER, null)
    context.clearColor(BG[0], BG[1], BG[2], BG[3])
    context.clear(context.COLOR_BUFFER_BIT)
    paint('face')
  }
}

onMounted(async () => {
  const canvas = canvasRef.value
  if (!canvas) return
  gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false })
  if (!gl) return
  const context = gl
  faceProg = program(context, VERT, FACE_FRAG)
  inkProg = program(context, VERT, INK_FRAG)
  mixProg = program(context, MIX_VERT, MIX_FRAG)
  flowTex = context.createTexture()
  context.bindTexture(context.TEXTURE_2D, flowTex)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE)
  context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE)
  buf = context.createBuffer()
  context.bindBuffer(context.ARRAY_BUFFER, buf)
  context.bufferData(context.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0, 0,
    1, -1, 1, 0,
    -1, 1, 0, 1,
    1, 1, 1, 1
  ]), context.STATIC_DRAW)
  context.disable(context.DEPTH_TEST)

  const base = '/img/adrien/'
  const [sheet1, sheet2, scribbles, hand, grain, flames] = await Promise.all([
    loadImage(base + 'tex_sheet_parts_1.webp'),
    loadImage(base + 'tex_sheet_parts_2.webp'),
    loadImage(base + 'tex_scribbles_2.webp'),
    loadImage(base + 'tex_hand.webp'),
    loadImage(base + 'noise_blue_1.webp'),
    loadImage(base + 'tex_sheet_flames_bw.webp')
  ])
  if (!alive || !gl) return
  const face1 = upload(context, sheet1, context.CLAMP_TO_EDGE)
  const face2 = upload(context, sheet2, context.CLAMP_TO_EDGE)
  const words = upload(context, scribbles, context.CLAMP_TO_EDGE)
  const handTex = upload(context, hand, context.CLAMP_TO_EDGE)
  const flameTex = upload(context, flames, context.CLAMP_TO_EDGE)
  noise = upload(context, grain, context.CLAMP_TO_EDGE)

  const skull = [
    { tex: flameTex, index: 0, cols: 3, rows: 2, x: -0.309, y: 0.527, sx: 1.03, sy: 1.03, order: 1, parallax: 0.06, show: 0 },
    { tex: face2, index: 0, cols: 2, rows: 2, x: 0.185, y: -0.525, sx: 0.576, sy: 0.576, order: 2, parallax: 0.1, show: 1 },
    { tex: face2, index: 2, cols: 2, rows: 2, x: 0.059, y: 0.1, sx: 0.682, sy: 0.682, order: 3, parallax: 0.12, show: 2 },
    { tex: face2, index: 55, cols: 8, rows: 8, x: -0.071, y: -0.173, sx: 0.151, sy: 0.151, order: 4, parallax: 0.13, show: 3 },
    { tex: face2, index: 62, cols: 8, rows: 8, x: 0.399, y: 0.068, sx: 0.146, sy: 0.146, order: 4, parallax: 0.13, show: 4 },
    { tex: face2, index: 63, cols: 8, rows: 8, x: 0.191, y: -0.051, sx: 0.094, sy: 0.094, order: 4, parallax: 0.12, show: 5 }
  ]
  for (const item of skull) parts.push({ ...item, layer: 'skull' })

  const face: Array<Omit<Part, 'tex'> & { sheet: 1 | 2 }> = [
    { sheet: 1, index: 0, cols: 2, rows: 2, x: 0, y: 0, sx: 1, sy: 1, order: 1, parallax: 0.06, show: 1 },
    { sheet: 2, index: 2, cols: 4, rows: 4, x: -0.461, y: -0.416, sx: 0.377, sy: 0.377, order: 2, parallax: 0.075, show: 3 },
    { sheet: 2, index: 3, cols: 4, rows: 4, x: 0.621, y: 0.085, sx: 0.377, sy: 0.377, order: 2, parallax: 0.075, show: 4 },
    { sheet: 1, index: 1, cols: 2, rows: 2, x: 0, y: 0, sx: 1, sy: 1, order: 3, parallax: 0.1, show: 0 },
    { sheet: 1, index: 36, cols: 8, rows: 8, x: -0.053, y: -0.1, sx: 0.144, sy: 0.144, order: 4, parallax: 0.135, show: 6 },
    { sheet: 1, index: 52, cols: 8, rows: 8, x: 0.35, y: 0.073, sx: 0.144, sy: 0.144, order: 4, parallax: 0.135, show: 7 },
    { sheet: 2, index: 14, cols: 4, rows: 4, x: 0.285, y: -0.339, sx: 0.44, sy: 0.44, order: 4, parallax: 0.125, show: 8 },
    { sheet: 2, index: 54, cols: 8, rows: 8, x: 0.187, y: -0.047, sx: 0.099, sy: 0.099, order: 4, parallax: 0.13, show: 5 },
    { sheet: 1, index: 2, cols: 2, rows: 2, x: 0, y: 0, sx: 1, sy: 1, order: 5, parallax: 0.125, show: 2 }
  ]
  for (const item of face) {
    const { sheet, ...rest } = item
    parts.push({ ...rest, tex: sheet === 1 ? face1 : face2 })
  }

  parts.push({
    tex: makeTitle(context),
    index: 0,
    cols: 1,
    rows: 1,
    x: 0,
    y: 0.34,
    sx: 1.2,
    sy: 0.5,
    order: 0,
    parallax: 0,
    show: 0,
    dither: true,
    opacity: 1,
    world: true
  })

  const notes = [
    { index: 2, x: -0.175, y: -0.125, s: 0.5, opacity: 1, show: 1 },
    { index: 4, x: -0.04, y: -0.335, s: 0.5, opacity: 0.75, show: 2 },
    { index: 5, x: 0.04, y: -0.335, s: 0.5, opacity: 0.75, show: 3 },
    { index: 6, x: 0.325, y: -0.015, s: 0.5, opacity: 0.75, show: 4 }
  ]
  for (const note of notes) {
    parts.push({
      tex: words,
      index: note.index,
      cols: 4,
      rows: 3,
      x: note.x,
      y: note.y,
      sx: note.s,
      sy: note.s,
      order: 0,
      parallax: 0,
      show: note.show,
      dither: true,
      opacity: note.opacity,
      world: true
    })
  }

  parts.push({
    tex: handTex,
    index: 1,
    cols: 2,
    rows: 2,
    x: 0.5,
    y: 0,
    sx: 0.4,
    sy: 0.4,
    order: 10,
    parallax: 0,
    show: 5,
    world: false
  })
  parts.push({
    tex: handTex,
    index: 0,
    cols: 2,
    rows: 2,
    x: 0.5,
    y: 0,
    sx: 0.27,
    sy: 0.27,
    order: 11,
    parallax: 0,
    show: 6,
    world: false
  })

  showAt = performance.now()
  clock0 = showAt
  blinkAt = showAt
  ready.value = true
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  alive = false
  cancelAnimationFrame(raf)
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
})
</script>

<template>
  <div class="al-demo">
    <canvas
      ref="canvasRef"
      @pointermove="onMove"
      @pointerleave="onLeave"
      @pointerdown="onDown"
      @pointerup="onUp"
      @pointercancel="onUp"
    />
    <p class="caption">{{ caption }}</p>
    <button type="button" class="replay" @click="replay">再播一次</button>
  </div>
  <p class="hint">在红底上移动指针。悬停脸会换嘴，按住脸可以拖。按住左键在红底上划，会刮出底下的骷髅。</p>
</template>

<style scoped>
.al-demo {
  position: relative;
  height: 560px;
  margin: 8px 0 0;
  overflow: hidden;
  border-radius: 8px;
  background: #ff0b36;
  user-select: none;
  touch-action: none;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: default;
}

.caption {
  position: absolute;
  left: 16px;
  bottom: 14px;
  margin: 0;
  color: #1f1a1b;
  font-size: 13px;
  font-family: "Comic Sans MS", "Chalkboard SE", cursive;
  pointer-events: none;
}

.replay {
  position: absolute;
  right: 12px;
  bottom: 10px;
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: #1f1a1b;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.hint {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
