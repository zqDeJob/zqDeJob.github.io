---
title: 车企 3D 旋转看车
date: 2026-11-09 00:40:00
category: 研发二三事
series: 网页技术扒一扒
comments: true
---

# 车企 3D 旋转看车

[小米汽车 YU7 配置器](https://www.xiaomiev.com/configurator/select?goodsId=500015457&itemId=500015457&ssuId=600019695&type=3d) 左边是车，可以拖着转，底下一排小图用来跳机位。地址上的 `type=3d` 换成 `type=2d` 就是极速模式。两套看的是同一辆车，做法不一样。

下面按 2026 年 11 月打开这页时实际加载的文件说。车型包版本是 `bundle_yu7/PC/26_0_01`。

## 两套实现

| | 3D | 2D 极速 |
| --- | --- | --- |
| 画面 | `#container_3d` 里的 canvas，`data-engine` 写着 `three.js r169` | `#PC_COLOR_PAGE_OUTCOME` 里的 canvas，把成片画上去 |
| 车从哪来 | `assets.mi`，大约 53MB | 每个机位一张成片 |
| 拖拽 | 改相机的球坐标 | 换一张已经渲染好的图 |
| 点机位 | 相机在 1.5 秒左右滑到那一组角度 | canvas 的 `transform` 用 500ms 过渡 |

3D 脚本和 Three.js 打在同一个包里，里面能看到 `GLTFLoader`、`DRACOLoader`、`KTX2Loader`，也带了 `OrbitControls`。

## 3D 转的是相机

车停在原点。相机用球坐标绕着一个看点转。看点在车身中部，`lookAt` 是 `{ x: 0, y: 0.733, z: 0 }`。

配置在 [ConfigTable.json](https://s1.xiaomiev.com/activity-outer-assets/bundle_yu7/PC/26_0_01/ConfigTable.json)。每个机位一组数，车漆视角是这样：

```json
{
  "name": "车漆视角",
  "duration": 1.5,
  "smoothing": 5,
  "springLength": 15,
  "theta": 5.3796,
  "phi": 1.5428,
  "lookAt": { "x": 0, "y": 0.733, "z": 0 },
  "fov": 16.3,
  "phiMin": 0.001,
  "phiMax": 1.55,
  "distanceMin": 12.5,
  "distanceMax": 18
}
```

这几个字段的意思：

| 字段 | 作用 |
| --- | --- |
| `theta` | 水平角，绕着车转 |
| `phi` | 俯仰角。接近 0 是顶视，接近 `π/2` 是平视 |
| `springLength` | 相机到看点的距离 |
| `fov` | 视野 |
| `phiMin` / `phiMax` | 俯仰夹住，避免钻到车底 |
| `distanceMin` / `distanceMax` | 推拉的最近最远 |
| `duration` | 这次切机位的时长，车漆是 1.5 秒，顶视是 2 秒 |
| `smoothing` | 每帧往目标追多快，这里是 5 |

同一份表里还有轮毂、尾翼、前灯、迎宾踏板这些外观机位，以及一串 `panorama*` 内饰机位。内饰相机更新时会顺手调用 `panoramaTiles.update()`，座舱那一段走的是全景贴片。

切机位时，当前角度和目标角度各有一份：`_spherical.theta` 对 `_targetTheta`，`phi`、距离、`fov` 同样。每帧用同一个步进把当前值往目标拉：

```js
function step (current, target, dt, smoothing) {
  if (smoothing <= 0) return target
  const delta = target - current
  if (Math.abs(delta) < 1e-6) return target
  const t = Math.min(Math.max(smoothing * dt, 0), 1)
  return current + delta * t
}
```

`smoothing` 为 5、帧间隔大约 0.016 秒时，每帧只走完剩余差距的大约 8%，所以是越靠近越慢。水平角会先在 `目标`、`目标 + 2π`、`目标 - 2π` 里挑离当前最近的那个，避免车身多转一整圈。

拖拽走另一条。增量加在球面角上，再乘 `dampingFactor`，和 Three.js 的 `OrbitControls` 同一类。松手以后角度自己滑停，同时仍受 `phi` 和距离的上下限约束。

## 模型包

车型地址是 `https://s1.xiaomiev.com/activity-outer-assets/bundle_yu7/PC/26_0_01/assets.mi`，响应头里的长度是 55162640 字节。文件头不是 glTF 的 `glTF`，页面先拉 `plugin3D/decrypt/v3/wasm_crypto_bg.wasm`，用里面的 `decrypt_xor` 解开，再交给 `GLTFLoader`。网格走 Draco（`draco_decoder.wasm`），贴图走 Basis / KTX2（`basis_transcoder.wasm`）。

所以 3D 模式要等这一包解密和解压。2D 模式只换图，配置器把它标成「极速模式」。

## 2D 按机位换图

2D 的机位名固定这 7 个：

```js
const views = [
  'front_left_45deg',
  'side',
  'behind_45deg',
  'behind',
  'front_right_45deg',
  'front',
  'top'
]
```

成片画进 `#PC_COLOR_PAGE_OUTCOME` 的 canvas。当前这页上量到的样式是 `transform` 和 `opacity` 一起过渡，时长 500ms，缓动 `ease-in-out`。底部那排小图是同一批机位，画在 600×337 的小 canvas 里，样式带 `scale(1.75)`，等于把图放大后裁中间。

素材接口里除了整车 jpg，还有车身、后视镜、轮毂的透明 png。缩略图和轮毂页用的是这套切图，大图用的是整车成片。

## 页面里试一下

左上角可以在两套之间换。2D 用配置器的 7 张成片，顺序和上面的机位名一致。3D 用同一批机位：拖拽直接改 `theta` 和 `phi`，点某一张则把目标角度交给上一节的 `step`，`smoothing` 取 5。示意车身用来看相机怎么绕，原站的网格在加密的 `assets.mi` 里。

<CarViewDemo />
