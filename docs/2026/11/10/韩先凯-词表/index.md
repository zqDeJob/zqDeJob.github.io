---
title: 词表
date: 2026-11-10 00:53:00
category: 生活乐子
series: 韩先凯-人生进阶指南
anchors: true
comments: true
---

# 词表

这些词来自韩先凯《人生进阶指南》的主题词表，仓库在 [byoungd/up](https://github.com/byoungd/up)，正文按 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 授权。下面按原表收录，方便查阅。词表是查阅清单，不是背诵数量。一个词要进词汇证据卡，才算从眼熟变成能用：能读出发音，能用自己的话讲当前义项，能说出常见搭配，合上材料还能在一句新的话里用出来。

一轮只从眼前的真实任务里挑 5 到 8 个。不影响主旨的放过，挡住理解的先查当前义项，两周内会用到的才进入主动学习。涉及安全、法律、版本和责任的词，回到现行文档或找懂的人核对，不要只信一张中英对照。

## Common

abstraction、algorithm、architecture、asynchronous、atomic、benchmark、binary、bug、cache、callback、coercion、compile、concurrency、constraint、context、debug、dependency、deploy、deterministic、dispatch、encapsulation、endpoint、event loop、framework、garbage collection、generic、granularity、immutable、immediate、implement、inheritance、interface、latency、library、lifecycle、memory、microservice、middleware、mutation、optimization、overhead、performance、polymorphism、pragmatic、precedence、protocol、refactor、reliability、resource、robust、schema、serialize、syntax、throughput、thread、timeout、trace、undefined behavior、versioning。

这些词跨语言都会碰到。先分清近义：`latency` 是等待有多久，`throughput` 是单位时间做完多少；`immutable` 是改不了这份数据，`atomic` 是这一步要么全部完成要么像没发生。写进自己的句子里再算记住。

## Go

buffered channel、channel、context、defer、embedding、escape analysis、go mod、goroutine、interface、map、mutex、package、pointer、receiver、select、slice、struct、sync、testing、type assertion、zero value。

读 Go 代码时先抓住所有权和并发：`goroutine` 是一条可以同时跑的流程，`channel` 用来传值，`select` 在多个通道里等其中一个先到。`defer` 把收尾登记到函数结束时再做。`slice` 是一段可变长的视图，底层数组可能被共享，改一个切片有时会改到另一个。`zero value` 是声明了但还没赋值时的默认值，很多 Go 代码靠它能直接用。

## Java

abstract、aforementioned、application、appropriate、arithmetic、aspect、associate、attribute、atomic、buffer、cache、component、concurrent、conjunction、connection、constrain、context、correspond、costly、declared、default、deliberate、descriptor、destructive、deterministic、equivalence、extend、external、final、flush、hierarchical、implements、impose、inconsistent、indicating、instance、interface、interpreted、iterator、library、malicious、manipulated、multicast、notation、object oriented、obsolete、optimization、pointcut、primitive、prohibit、provider、reconstruct、resource、retrieve、scanline、schema、sequence、serialize、static、stipulation、synchronized、thread、underlying、unsigned、volatile、bytecode、classpath、comparable、comparator、completablefuture、dependency injection、garbage collection、generic、heap、JDK、JRE、JVM、lambda、module、reflection、runtime、stack、stream、type erasure。

文档里的前半段多是说明文字：`aforementioned` 是前面说过的，`stipulation` 是写明的条件，`underlying` 是底下真正起作用的那一层。后半段才是 Java 自己的词。`JDK` 是开发套件，`JRE` 是运行环境，`JVM` 是跑字节码的虚拟机。`heap` 放对象，`stack` 放一次调用的局部状态。`generic` 在编译期做类型检查，运行时经常发生 `type erasure`，类型参数不再留在字节码里。`synchronized` 让一段代码在同一时刻只被一个线程执行。

## JavaScript

animation、async、await、canvas、closure、decode、document、element、event loop、fetch、frames、hoisting、JSON、localStorage、Infinity、navigator、npm、performance、promise、prompt、prototype、runtime、screen、scroll、typeof、undefined、yield、webpack。

页面和脚本里最常卡住的是时间。`promise` 表示一件还没做完的事，`async` / `await` 让你按顺序写异步，底下仍然是事件循环。`closure` 是函数带走了它定义时能看见的变量，回调结束以后那些变量还在。`hoisting` 是声明会在当前作用域里提前被登记，不等于赋值也提前完成。`undefined` 是有这个位置但没有值，和 `null`、没声明不是一回事。

## PHP

syntax、protocol、wrapper、binary、composer、session、quote、persistent、garbage、manipulate、authentic、specific、crypto、generate、autoload、namespace、trait、mysqli、PDO、opcode、session cookie、serialization、templating。

`composer` 管依赖，`autoload` 按命名空间把类文件找出来，不用每个文件手动 include。`session` 把一次访问的状态放在服务端，浏览器里通常只留一枚 `session cookie`。`mysqli` 和 `PDO` 都是连数据库的接口，PDO 更便于换驱动。`opcode` 是源码编译后给执行器跑的中间指令。`trait` 是把一段方法复用进多个类，不是继承。

## Prompt

acceptance criteria、constraints、context、context window、delimiter、developer message、evaluation、few-shot、format spec、function calling、guardrails、instruction hierarchy、JSON schema、negative prompt、output format、persona、prompt template、prompt injection、RAG、retrieval、role、rubric、stop sequence、system prompt、temperature、token、token budget、tool use、user prompt、zero-shot。

写提示先分清谁在说话。`system prompt` 定任务边界，`user prompt` 是这一次的问题，`developer message` 是给应用开发者的指令。`context window` 是这一次能放进模型的材料上限，`token budget` 是你打算花多少。`few-shot` 给例子，`zero-shot` 不给例子直接问。`RAG` 先检索再回答，检索到的材料要能回到出处。`prompt injection` 是材料里夹了一句「忽略之前的要求」，它只能当被分析的文字，不能变成新的授权。`temperature` 调采样的随机程度，不负责事实对不对。

## Python

approximate、backport、circumstance、coercion、compound、contiguous、decoupling、deliberately、dispatch、generic function、granularity、gratuitously、heterogeneous、hierarchies、homogeneous、inheritance、introspection、provisional、robust、short-circuit、wildcard、open-circuit、contingency、feedback、sinusoidal、async、await、bytecode、comprehension、coroutine、dataclass、decorator、duck typing、generator、GIL、import、iterator、lambda、mypy、pip、pytest、type hint、virtualenv。

`duck typing` 是不看类型名，看对象能不能做这个操作。`decorator` 在不改原函数主体的情况下包一层行为。`generator` 用 `yield` 一次吐一个值，不必先把整列放进内存。`GIL` 是 CPython 里让同一时刻只有一个线程执行 Python 字节码的锁，所以多线程不等于多核同时跑 Python 代码。`type hint` 是给人和检查器看的标注，`mypy` 用来查这些标注。`virtualenv` 把一个项目的依赖和别的项目隔开。

## Swift

infix、prefix、postfix、unary、overflow、guard、bitwise、extension、protocol、internal、clause、constraint、optional、closures、actor、ARC、async、await、class、enum、generic、initializer、mutating、property wrapper、struct、type inference。

`optional` 表示这个值可能没有，用之前要解开。`guard` 在条件不成立时提前离开，剩下的代码可以假设条件已经成立。`struct` 是值，赋值通常得到一份拷贝；`class` 是引用，多个名字可以指向同一份对象。`mutating` 标在结构体方法上，表示这个方法会改自己。`ARC` 按引用计数回收类实例。`actor` 用来隔离可变状态，避免并发下随便改同一份数据。

## Rust

allocator、async、await、borrow、borrow checker、boxing、cargo、crate、derive、drop、dyn、enum、feature flag、foreign function interface、generic、impl、interior mutability、iterator、lifetimes、macro、match、monomorphization、move、mut、mutex、ownership、panic、pattern matching、pin、pub、reference、result、rustfmt、send、sync、trait、type inference、unsafe、workspace。

所有权是这条线的中心。值有一个主人，`move` 把主人换掉，旧名字不能再用。`borrow` 是暂时借走，借的时候主人还在；`borrow checker` 检查借用没有超过主人的寿命，也没有在别人还借着的时候把值改掉或扔掉。`lifetime` 就是这次借用允许活多久。`Result` 用来带回成功或失败，`panic` 是已经无法按正常路径继续。`unsafe` 表示编译器在这一段不再替你检查某些内存规则，责任回到写代码的人。`Send` 和 `Sync` 决定这个类型能不能跨线程移交或共享。

## Vibe Coding

agent、agentic、autopilot、boilerplate、brain dump、codegen、context window、copy-paste programming、diff、edit loop、fast feedback、flow、guardrails、hallucination、human-in-the-loop、incremental changes、iteration、lint、minimal repro、pair programming、patch、prompt-driven、prototype、quickstart、refactor、regression、review、rubber ducking、sandbox、scaffolding、scope creep、smoke test、spike、telemetry、test harness、timebox、tooling、trace、triage。

边说边改的时候，这些词用来给过程命名。`brain dump` 是先把知道的倒出来。`scaffolding` 是先搭一个能跑的架子。`spike` 是为了弄清可行性而写的短试验，试完可以扔掉。`minimal repro` 是能复现问题的最小例子。`human-in-the-loop` 是关键步骤必须有人看过再继续。`hallucination` 是模型说得很顺，但事实或代码并不存在。`scope creep` 是任务边界一点点被加宽。`smoke test` 只检查主路径能不能点通，不代替完整测试。`timebox` 是给这一轮定一个到点就停的时间。
