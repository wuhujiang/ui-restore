# ui-restore — 产品需求文档（PRD）

> 版本：0.1.0-draft  
> 更新日期：2026-08-04  
> 状态：设计中（本日只做设计，不写实现代码）

---

## 1. 一句话定位

**Restore UI into your existing Vue project. Not generate another demo.**

把设计图恢复进**已有 Vue 项目**，复用项目里的组件与约定；不是再生成一套独立 Demo。

---

## 2. 设计原则

所有技术决策以这一条为准：

> **以后你每天都能用。**

不是为了技术而技术。从第一天起按开源项目标准推进：有文档、有版本规划、有模块边界、有测试。

---

## 3. 要解决的问题

现有 Image-to-Code 工具的常见问题：

| 问题 | 表现 |
|------|------|
| 生成 Demo 工程 | 无法直接落入现有业务仓库 |
| 图片直接出代码 | 换模型就要改 Generator，难维护 |
| 忽略现有组件库 | 到处写原生标签，风格不一致 |
| 一次性输出 | 没有截图 Diff 闭环，还原度靠运气 |
| 单页思维 | 多图时大量重复结构，不抽公共组件 |

**ui-restore 的目标**：在真实项目里，稳定、可迭代地把 UI 设计图变成可维护的 Vue 代码。

---

## 4. 目标用户

| 角色 | 场景 |
|------|------|
| 前端开发者（主用户） | 每天根据设计稿补页面 / 改页面 |
| 独立开发者 | 快速把多张设计图落进自己的 Vue 仓库 |
| 小团队 | 统一「图 → 结构化描述 → 代码」流程，减少手写布局时间 |

**非目标用户（短期）**：需要像素级设计工具替代品的人；需要无代码可视化搭建平台的人。

---

## 5. 成功标准

满足以下条件才算「能每天用」：

1. 在**已有 Vue 3 项目**中，通过 CLI 完成配置与恢复，无需迁仓库。
2. 输出优先使用项目内已有组件（如 `<Button />`），而不是裸 `<button>`。
3. 多张设计图可识别并抽离公共组件，避免复制粘贴式页面。
4. Vision / LLM 只输出**固定 JSON DSL**；换模型不改 Generator。
5. AutoFix 能通过「生成 → 截图 → Diff → 修改」迭代逼近目标还原度（目标 ≥ 98%）。
6. 文档与模块边界清晰，新人能按 `docs/` 独立推进。

---

## 6. 范围

### 6.1 第一阶段必须支持（In Scope）

- **框架**：Vue 3（Composition API / `<script setup>`）
- **语言**：TypeScript 与 JavaScript 均可（由配置决定）
- **样式**：优先支持项目已有方案（初期以 SCSS / CSS Modules / scoped CSS 为主，见配置）
- **输入**：单图恢复；多图恢复 + **公共组件抽离**
- **输出**：写入项目约定目录的页面与组件（`.vue`），不是独立 Demo 工程
- **配置驱动**：`ui-restore.config.ts`（或 `.js` / `.mjs`）决定路径与约定
- **中间表示**：固定 UI JSON DSL（所有模型统一输出）

### 6.2 明确不做（Out of Scope，近期）

- React / 其他框架（路线图后续阶段再开）
- 图片直接生成 Vue 源码（禁止跳过 JSON DSL）
- 完整设计工具（标注、版本协作、设计稿托管）
- 无已有项目时的「从零脚手架生成业务系统」（`init` 只生成配置，不造业务工程）
- 服务端托管的 SaaS 平台（先做本地 CLI + 可接 Cursor Agent）

---

## 7. 核心用户流程

### 7.1 初始化

```text
ui-restore init
```

生成 `ui-restore.config.ts`（示例字段见 Architecture），写入框架、语言、组件目录、页面目录等约定。

### 7.2 单图恢复

```text
ui-restore restore login.png
```

流程：

```text
图片 → Vision → JSON DSL →（可选）匹配已有组件 → Generator → 写入页面
```

### 7.3 多图恢复 + 公共组件抽离

```text
ui-restore restore login.png home.png profile.png
```

或目录输入（实现阶段再定具体参数）：

```text
ui-restore restore ./designs/
```

流程：

```text
多图
  → 各自 Vision → 多份 JSON DSL
  → 跨页相似结构比对 / 抽离公共组件
  → 写入 shared components
  → 各页引用公共组件生成页面
  →（后续）AutoFix
```

**抽离原则（产品层）**：

- 跨页重复的结构（头部、列表项、卡片、表单字段组等）应优先抽成公共组件。
- 已与项目组件库匹配的节点，复用已有组件，不重复生成。
- 抽离结果可审查、可命名、可落盘到配置指定的 `components` 目录。

### 7.4 自动修正（亮点能力，稍后实现）

```text
图片 → 生成 Vue → 启动 / 渲染页面 → 截图
  → Diff → LLM 修改 → 再截图 → 再 Diff
  → 直到达到阈值阈值（默认目标 98%）
```

### 7.5 Cursor Agent（更后）

用户说「恢复登录页」，Agent 自动执行 `ui-restore restore login.png` 等命令，把流程嵌进日常 IDE 工作流。

---

## 8. 功能需求清单

### P0 — 每天能用的底座

| ID | 需求 | 说明 |
|----|------|------|
| P0-1 | Monorepo 工程可运行 | pnpm + TurboRepo，CLI 可执行 |
| P0-2 | `init` | 生成配置文件 |
| P0-3 | `restore` 最小闭环 | 至少能跑通命令入口（可先 stub） |
| P0-4 | UI JSON DSL 定稿 v0 | 作为 Vision 与 Generator 的唯一桥梁 |
| P0-5 | Vue 3 输出约定 | TS / JS 两种模式由配置切换 |
| P0-6 | 多图公共组件抽离（设计落地） | DSL / 流程支持跨页 component 提取 |

### P1 — 可用恢复

| ID | 需求 | 说明 |
|----|------|------|
| P1-1 | Vision → JSON | 多模型统一 DSL |
| P1-2 | 项目组件扫描 | 建立组件索引，供匹配使用 |
| P1-3 | Generator | 生成真实 `.vue` 页面与样式 |
| P1-4 | 多图抽离实现 | 跨页比对 + 公共组件落盘 + 页面引用 |
| P1-5 | 配置完备 | 路径、语言、样式方案、阈值阈值等 |

### P2 — 生产力闭环

| ID | 需求 | 说明 |
|----|------|------|
| P2-1 | AutoFix | 截图 Diff 迭代修正 |
| P2-2 | Cursor Agent 集成说明 / Skill | 一句话触发恢复 |
| P2-3 | examples / test-project | 可演示、可回归 |
| P2-4 | 测试与 CI | 核心包单测 + DSL 契约测试 |

---

## 9. 非功能需求

- **可维护**：模块边界清晰（cli / vision / parser / generator / autofix / shared）
- **可替换**：Vision / LLM Provider 可换，DSL 不变
- **可本地运行**：默认本地 CLI，密钥走环境变量 / 本地配置，不强制上云
- **可审查**：中间 JSON、生成的组件、Diff 结果都应对用户可见（调试友好）
- **性能（初期）**：正确性与可维护性优先于极致速度；AutoFix 轮次可配置上限

---

## 10. 配置（产品视角示例）

```ts
// ui-restore.config.ts
export default {
  framework: 'vue',
  lang: 'ts', // 'ts' | 'js'
  style: 'scss', // 初期枚举后续在 Architecture 定稿
  components: 'src/components',
  pages: 'src/pages',
  // 后续可扩展：
  // sharedComponents: 'src/components/restored',
  // autofix: { threshold: 0.98, maxRounds: 5 }
}
```

---

## 11. 与「Image to Code Demo」的差异（对外话术）

| | 常见 Image-to-Code | ui-restore |
|--|-------------------|------------|
| 输出目标 | 新 Demo 工程 | 现有 Vue 仓库 |
| 中间层 | 常无 / 不稳定 | 固定 JSON DSL |
| 组件 | 原生 HTML 为主 | 优先项目组件 |
| 多图 | 各自生成 | 抽离公共组件 |
| 质量 | 一次生成 | AutoFix 闭环 |

---

## 12. 开放问题（需后续拍板，不阻塞今日文档）

1. 多图输入的 CLI 形态：多文件参数 vs 目录 vs manifest。
2. 公共组件命名策略：启发式自动命名 vs 交互确认 vs LLM 命名。
3. 样式方案优先级：是否第一期同时支持 UnoCSS / Tailwind。
4. 相似度阈值：视觉 Diff 用像素 / 感知哈希 / 结构对比的具体算法。
5. React 支持的时间点（明确排在 Vue 稳定之后）。

---

## 13. 文档关系

| 文档 | 职责 |
|------|------|
| `PRD.md` | 做什么、为谁做、成功标准 |
| `ARCHITECTURE.md` | 怎么拆模块、数据流、DSL、配置 |
| `ROADMAP.md` | 什么时候做、版本节奏 |
| `PROMPT.md` | Vision / 抽离 / AutoFix 的 Prompt 契约 |

**所有开发围绕 `docs/` 进行；实现不得绕过已定 DSL 与模块边界。**
