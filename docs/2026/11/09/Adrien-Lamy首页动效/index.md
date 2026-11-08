---
title: Adrien Lamy 首页动效
date: 2026-11-09 00:40:00
category: 研发二三事
series: 网页技术扒一扒
comments: true
---

# Adrien Lamy 首页动效

[adrienlamy.fr](https://adrienlamy.fr/) 打开后是一块红底。中间一张手绘的脸，头顶写着 WHO AM I? ADRIEN LAMY，旁边还有 ME、DRAG、GRAB、PULL 这几行字。鼠标一动，五官会跟着偏；悬停脸会张嘴，按住拖走时眼睛闭上。字本身不跟鼠标，它是进场时一格一格弹出来的。

页面标题在无障碍树里是 `Who am I? Adrien Lamy`，视觉上那行字不在 DOM 里，画在整页的 WebGL 画布上。下面按线上打包文件里的实现来说。

## 技术栈

| 层 | 用的东西 |
| --- | --- |
| 页面 | Vite 打的 Vue 单页，首页路由只有 `/` |
| 画面 | Three.js。脸、手、字都是贴图平面，没有 glTF 骨骼 |
| 贴图 | webp 精灵图，`nearestFilter`，像素边缘不发糊 |
| 动效 | GSAP 时间轴。进场用 `elastic.out`，字的显现用 `steps` |
| 输入 | 自己的指针状态。桌面用鼠标相对屏幕中心的位置，手机用设备方向 |
| 链接字 | DOM 上的小字另做了一套拆字，字体是 Comic CAT |

构建产物是一份 `assets/index-*.js` 和一份 CSS。角色贴图在 `webgl/textures/headParts/`，手在 `webgl/textures/hand/`，字在 `webgl/textures/scribbles/tex_scribbles_2.webp`。

## 字是精灵图，不是逐个字母

大标题和 ME、DRAG、GRAB、PULL 都是同一张精灵图上的格子，3 行 4 列。每句字是一个平面，用格子序号取样：

```js
const currentRow = (rowCount - 1) - Math.floor(index / colCount)
const currentCol = index % colCount
const spriteUv = [
  currentCol / colCount + uv.x / colCount,
  currentRow / rowCount + uv.y / rowCount
]
```

`rowCount - 1` 是因为贴图开了 `flipY`。标题用 `index: 0`，ME 用 `2`，光标提示、抓取提示、更多提示分别是 `4`、`5`、`6`。

进场是两条叠在一起的 GSAP：

```js
timeline
  .fromTo(scales,
    { x: 0.5, y: 0.5, z: 1 },
    { x: 1, y: 1, z: 1, duration: 1, stagger: 0.035, ease: 'elastic.out(1.0, 0.3)' },
    0.1)
  .fromTo(visibility,
    { value: 0 },
    { value: 1, duration: 0.3, stagger: 0.035, ease: 'steps(12)' },
    0)
```

缩放从一半弹到 1，每句字错开 0.035 秒。真正让笔画“长出来”的是 `visibility`。片元着色器拿一张蓝噪声，按可见度做抖动裁切，再把结果卡成硬边：

```glsl
float ditherFactor = 1.0 - uVisibility * 0.98;
float alpha = texDiffuse.r * step(ditherFactor, texNoiseBlue.r);
alpha = step(0.1, alpha);
```

`steps(12)` 让这个裁切一档一档跳，所以字不是淡入，是噪点里逐渐露出来。噪声坐标还加了一点时间，颗粒会慢慢爬。

每帧只是把 GSAP 写出的位置、旋转、缩放抄到网格上。这些字不读鼠标。

页面两侧的 Linkedin、邮箱这种小链接是另一套。自定义拆字把标签切成 `.char`，悬停时用 `elastic.out` 把每个字的 `x` 推开再收回，时长 0.5 秒，错开 0.02 秒。

## 脸是好几层贴图，视差不一样

头、后发、前发、左右耳、鼻子各一层，眼睛和嘴单独处理，因为它们要换格子。眼睛有睁开和闭上两帧，嘴有默认、大笑、撇嘴、惊讶。贴图同样来自精灵图，`sheet_parts_1` 和 `sheet_parts_2`。

鼠标先做缓动，系数 `0.075`，得到相对屏幕中心的 `partsTarget`。每一层再乘自己的 `parallaxAmount`：

| 部位 | parallaxAmount |
| --- | --- |
| 后发 | 0.06 |
| 耳朵 | 0.075 |
| 头 | 0.1 |
| 嘴、前发 | 0.125 |
| 鼻子 | 0.13 |
| 眼睛 | 0.135 |

眼睛移得比头多，看起来就是在看鼠标。整颗头还会再跟一点点：`x += partsTarget.x * 0.05`，`y += partsTarget.y * 0.035`。算完之后把这个位移从 `partsTarget` 里减回去，五官的视差是相对头的，不会和头的位移叠成两倍。

没在拖的时候，头还有一点自己的浮动：

```js
const idle = 1 - dragFactor
const t = elapsed * 0.0125
position.x += Math.sin(t * 0.5) * idle * 0.035
position.y += Math.cos(t) * idle * 0.025
rotation.z -= Math.sin(t * 0.5) * idle * 0.035
```

眨眼是定时器，不是骨骼。左眼大约每 2800 毫秒闭 140 毫秒，右眼晚 70 毫秒。拖拽开始会清掉这次眨眼，并且强制闭上。

交互和表情是绑在一起的：

- 指针先动过，再移到脸上：光标变成 `grab`，浏览器标签改成 `Adrien Lamy :o`，嘴切到惊讶那一格，头放大约 15%（`hoverFactor * 0.15`）。
- 按下拖拽：光标 `grabbing`，标签变成 `Adrien Lamy x/`，眼睛闭上，嘴变成撇嘴。位移加大到 `x * 0.8`、`y * 0.55`，同时缩小，并加一点正弦晃动。
- 松开：嘴先切到大笑，再回到默认，眼睛睁开。人还在脸上就回到 `:o`，否则回到 `:D`。
- 按住左键在红底上划，而且不是在拖脸或拖手指：指针速度（像素/毫秒）加进一张 128 的 flow 贴图，笔刷跟着速度变大。原站每帧乘 0.985。这里用同一套盖章和消退，只是放慢了一些，松手后骷髅大约还能再看几秒。合成时用它当遮罩，配大约 20 列的圆角马赛克和蓝噪声，把底下那层黑底骷髅刮出来。

右边那只手是另一张精灵图，手掌和食指分开。拖食指会触发另一套事件，标题回到惊讶。手机上没有那三行拖拽提示。

## Demo

下面这块画布用的是原站那几张精灵图，片元着色器也是同一套：字按蓝噪声做 `step` 裁切，脸按格子序号取样。头顶那句不在原图里，改成了 how are you, i am fine thank you, and you，仍走同一套裁切。按住左键在红底上划，会刮出黑底骷髅，松手后还会留几秒再淡回去。没有引 Three.js，相机、视差、眨眼和拖拽的数跟上面一致。

<FaceParallaxDemo />
