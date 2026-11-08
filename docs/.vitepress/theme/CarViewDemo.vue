<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PerspectiveCamera, Scene, WebGLRenderer } from 'three'

const views = [
  {
    name: '左前',
    theta: -0.75,
    phi: 1.28,
    radius: 8.2,
    fov: 28,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_b17cd635454d46ea9e88045606070571_1750000640545.jpg'
  },
  {
    name: '正侧',
    theta: Math.PI / 2,
    phi: 1.38,
    radius: 9.2,
    fov: 26,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_f06436d018ff4e5884511858e4e75209_1750000624577.jpg'
  },
  {
    name: '后侧',
    theta: 2.35,
    phi: 1.3,
    radius: 8.4,
    fov: 28,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_087ec81bf5bb4df7813319efe092c53e_1749999848865.jpg'
  },
  {
    name: '正后',
    theta: Math.PI,
    phi: 1.32,
    radius: 8.6,
    fov: 26,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_f39120ca0d044168b4274d2705cd08da_1750000138765.jpg'
  },
  {
    name: '右前',
    theta: 0.75,
    phi: 1.28,
    radius: 8.2,
    fov: 28,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_643b118b1c594b3db335bbcf01149992_1750000535554.jpg'
  },
  {
    name: '正前',
    theta: 0,
    phi: 1.32,
    radius: 8.8,
    fov: 26,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_1314daddf69f4bbabfae396c79664330_1750001151933.jpg'
  },
  {
    name: '顶部',
    theta: 0.35,
    phi: 0.22,
    radius: 9.4,
    fov: 32,
    src: 'https://img.v.mifile.cn/nr-upload-car/image_887f8b871f8b40088ce68275c2259e45_1750001417121.jpg'
  }
]

const TAU = Math.PI * 2

function shot (src: string, width: number) {
  return `${src}?x-fds-process=image/resize,w_${width},m_lfit,f_webp`
}

function step (current: number, target: number, dt: number, smoothing: number) {
  if (smoothing <= 0) return target
  const delta = target - current
  if (Math.abs(delta) < 1e-4) return target
  const t = Math.min(Math.max(smoothing * dt, 0), 1)
  return current + delta * t
}

function shortest (current: number, target: number) {
  let best = target
  let bestD = Infinity
  for (const option of [target, target + TAU, target - TAU]) {
    const d = Math.abs(option - current)
    if (d < bestD) {
      bestD = d
      best = option
    }
  }
  return best
}

function angleDiff (a: number, b: number) {
  const d = Math.abs(a - b) % TAU
  return Math.min(d, TAU - d)
}

const mode = ref<'2d' | '3d'>('2d')
const index = ref(0)
const current = computed(() => views[index.value])
const stageRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const readoutRef = ref<HTMLElement | null>(null)

let originX = 0
let originY = 0
let originIndex = 0
let dragTheta = 0
let dragPhi = 0
let dragging = false

let theta = views[0].theta
let phi = views[0].phi
let radius = views[0].radius
let fov = views[0].fov
let aimTheta = theta
let aimPhi = phi
let aimRadius = radius
let aimFov = fov

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let booting: Promise<void> | null = null
let raf = 0
let last = 0
let observer: ResizeObserver | null = null

function wrap (n: number) {
  const len = views.length
  return ((n % len) + len) % len
}

function placeCamera () {
  if (!camera) return
  const y = radius * Math.cos(phi)
  const flat = radius * Math.sin(phi)
  camera.position.set(flat * Math.sin(theta), y + 0.72, flat * Math.cos(theta))
  camera.lookAt(0, 0.72, 0)
  camera.fov = fov
  camera.updateProjectionMatrix()
}

function writeReadout () {
  const el = readoutRef.value
  if (!el) return
  el.textContent = `${current.value.name}   θ ${theta.toFixed(2)}   φ ${phi.toFixed(2)}   距离 ${radius.toFixed(1)}`
}

function resize () {
  const stage = stageRef.value
  if (!stage || !renderer || !camera) return
  const width = stage.clientWidth
  const height = stage.clientHeight
  if (width < 2 || height < 2) return
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

function nearestPreset () {
  if (phi < 0.5) return views.length - 1
  let best = 0
  let bestD = Infinity
  views.forEach((view, i) => {
    if (view.name === '顶部') return
    const d = angleDiff(theta, view.theta)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

function goTo (i: number) {
  index.value = i
  const view = views[i]
  aimTheta = shortest(theta, view.theta)
  aimPhi = view.phi
  aimRadius = view.radius
  aimFov = view.fov
}

async function boot () {
  const canvas = canvasRef.value
  if (!canvas || renderer) return
  const THREE = await import('three')
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js')

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0c0c0c)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  pmrem.dispose()

  camera = new THREE.PerspectiveCamera(26, 1, 0.1, 80)
  scene.add(buildCar(THREE))

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 64),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 1, metalness: 0 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const key = new THREE.DirectionalLight(0xffffff, 2.4)
  key.position.set(5, 9, 6)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  scene.add(key)
  scene.add(new THREE.AmbientLight(0xb9c4d6, 0.25))

  resize()
  placeCamera()
  last = performance.now()
  raf = requestAnimationFrame(tick)
}

function ensure3d () {
  if (renderer) {
    resize()
    return
  }
  if (!booting) booting = boot()
}

function tick (now: number) {
  raf = requestAnimationFrame(tick)
  if (mode.value !== '3d' || !renderer || !scene || !camera) return
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  if (!dragging) {
    theta = step(theta, aimTheta, dt, 5)
    phi = step(phi, aimPhi, dt, 5)
    radius = step(radius, aimRadius, dt, 5)
    fov = step(fov, aimFov, dt, 5)
  }
  placeCamera()
  renderer.render(scene, camera)
  writeReadout()
}

function onPointerDown (event: PointerEvent) {
  dragging = true
  originX = event.clientX
  originY = event.clientY
  originIndex = index.value
  dragTheta = theta
  dragPhi = phi
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove (event: PointerEvent) {
  if (!dragging) return
  if (mode.value === '2d') {
    index.value = wrap(originIndex + Math.round((originX - event.clientX) / 80))
    return
  }
  theta = dragTheta - (event.clientX - originX) * 0.005
  phi = Math.min(1.48, Math.max(0.12, dragPhi + (event.clientY - originY) * 0.004))
  aimTheta = theta
  aimPhi = phi
}

function onPointerUp () {
  if (dragging && mode.value === '3d') index.value = nearestPreset()
  dragging = false
}

function buildCar (THREE: typeof import('three')) {
  const car = new THREE.Group()
  const paint = new THREE.MeshStandardMaterial({ color: 0xd5d8dc, metalness: 0.82, roughness: 0.28 })
  const glass = new THREE.MeshStandardMaterial({ color: 0x1c232c, metalness: 0.55, roughness: 0.08 })
  const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 })
  const lamp = new THREE.MeshStandardMaterial({ color: 0xf2f6ff, emissive: 0xdfe7ff, emissiveIntensity: 0.8, roughness: 0.3 })
  const tail = new THREE.MeshStandardMaterial({ color: 0x5a1018, emissive: 0xff2244, emissiveIntensity: 0.7, roughness: 0.4 })

  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.42, 4.5), paint)
  lower.position.y = 0.58
  lower.castShadow = true
  car.add(lower)

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.28, 1.35), paint)
  hood.position.set(0, 0.88, 1.45)
  hood.castShadow = true
  car.add(hood)

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.55, 2.05), paint)
  cabin.position.set(0, 1.02, -0.35)
  cabin.castShadow = true
  car.add(cabin)

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 0.05), glass)
  windshield.position.set(0, 1.1, 0.62)
  windshield.rotation.x = 0.42
  car.add(windshield)

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.42, 0.05), glass)
  rearWindow.position.set(0, 1.12, -1.32)
  rearWindow.rotation.x = -0.45
  car.add(rearWindow)

  const sideWindow = new THREE.BoxGeometry(0.04, 0.34, 1.15)
  for (const x of [-0.9, 0.9]) {
    const pane = new THREE.Mesh(sideWindow, glass)
    pane.position.set(x, 1.1, -0.28)
    car.add(pane)
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.08, 1.5), paint)
  roof.position.set(0, 1.32, -0.4)
  car.add(roof)

  const grille = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.16, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x22262c, metalness: 0.6, roughness: 0.4 })
  )
  grille.position.set(0, 0.7, 2.48)
  car.add(grille)

  const headGeo = new THREE.BoxGeometry(0.32, 0.1, 0.06)
  for (const x of [-0.62, 0.62]) {
    const head = new THREE.Mesh(headGeo, lamp)
    head.position.set(x, 0.78, 2.48)
    car.add(head)
  }
  const tailGeo = new THREE.BoxGeometry(0.38, 0.1, 0.05)
  for (const x of [-0.62, 0.62]) {
    const light = new THREE.Mesh(tailGeo, tail)
    light.position.set(x, 0.82, -2.2)
    car.add(light)
  }

  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 20)
  wheelGeo.rotateZ(Math.PI / 2)
  const rimGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 12)
  rimGeo.rotateZ(Math.PI / 2)
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x2a2e33, metalness: 0.85, roughness: 0.3 })
  for (const [x, z] of [[-0.95, 1.35], [0.95, 1.35], [-0.95, -1.4], [0.95, -1.4]] as const) {
    const wheel = new THREE.Mesh(wheelGeo, rubber)
    wheel.position.set(x, 0.36, z)
    wheel.castShadow = true
    car.add(wheel)
    const rim = new THREE.Mesh(rimGeo, rimMat)
    rim.position.set(x, 0.36, z)
    car.add(rim)
  }
  return car
}

function onPointerDownStage (event: PointerEvent) {
  onPointerDown(event)
}

watch(mode, async (value) => {
  if (value !== '3d') return
  goTo(index.value)
  await nextTick()
  ensure3d()
})

onMounted(() => {
  for (const view of views) {
    const img = new Image()
    img.src = shot(view.src, 1280)
  }
  observer = new ResizeObserver(() => resize())
  if (stageRef.value) observer.observe(stageRef.value)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  renderer?.dispose()
  renderer = null
})
</script>

<template>
  <div class="car-demo">
    <div
      ref="stageRef"
      class="stage"
      @pointerdown="onPointerDownStage"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="modes" @pointerdown.stop>
        <button type="button" :class="{ on: mode === '2d' }" @click="mode = '2d'">2D</button>
        <span>|</span>
        <button type="button" :class="{ on: mode === '3d' }" @click="mode = '3d'">3D</button>
      </div>
      <img
        v-show="mode === '2d'"
        :key="current.name"
        class="shot"
        :src="shot(current.src, 1280)"
        :alt="current.name"
        draggable="false"
      >
      <canvas v-show="mode === '3d'" ref="canvasRef" class="gl" />
      <span v-show="mode === '2d'" class="badge">{{ current.name }}</span>
      <span v-show="mode === '3d'" ref="readoutRef" class="badge" />
    </div>
    <div class="views" role="tablist" aria-label="机位">
      <button
        v-for="(view, i) in views"
        :key="view.name"
        type="button"
        role="tab"
        :aria-selected="i === index"
        :class="{ on: i === index }"
        @click="goTo(i)"
      >
        <img :src="shot(view.src, 320)" :alt="view.name" draggable="false">
        <span>{{ view.name }}</span>
      </button>
    </div>
  </div>
  <p class="hint">左上角换 2D / 3D。2D 左右拖，大约每 80 像素换一张成片。3D 左右拖改水平角，上下拖改俯仰；点机位后，相机会按平滑步进滑到那一组角度。</p>
</template>

<style scoped>
.car-demo {
  background: #111;
  border-radius: 8px;
  overflow: hidden;
}

.stage {
  position: relative;
  height: 360px;
  background: #0c0c0c;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.stage:active {
  cursor: grabbing;
}

.shot,
.gl {
  width: 100%;
  height: 100%;
  display: block;
}

.shot {
  object-fit: contain;
  animation: settle 0.45s ease;
}

@keyframes settle {
  from {
    opacity: 0.35;
    transform: scale(1.04);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modes {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.45);
  color: #9a9a9a;
  font-size: 13px;
}

.modes button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.modes button.on {
  color: #fff;
}

.badge {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}

.views {
  display: flex;
  gap: 8px;
  padding: 10px;
  overflow-x: auto;
}

.views button {
  flex: 0 0 92px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #1b1b1b;
  color: #c8c8c8;
  cursor: pointer;
  overflow: hidden;
}

.views button.on {
  border-color: #fff;
  color: #fff;
}

.views img {
  display: block;
  width: 100%;
  height: 52px;
  object-fit: cover;
}

.views span {
  display: block;
  padding: 4px 0 6px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.hint {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
