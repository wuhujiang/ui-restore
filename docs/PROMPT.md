# ui-restore — Prompt 与模型契约（PROMPT）

> 版本：0.1.0-draft  
> 更新日期：2026-08-04  
> 状态：设计中  
> 相关：`ARCHITECTURE.md` 中的 UI JSON DSL v0

---

## 1. 目的

本文件定义所有 LLM / Vision 调用的**输入输出契约**。

目标：

- 换 GPT / Claude / Gemini **不换 Generator**。
- 模型只负责「看懂」与「结构化」；写文件、抽组件、生成 Vue 由本地代码完成。
- Prompt 可版本化、可测试（固定样例图 → 固定 Schema 校验）。

---

## 2. 总规则（所有 Prompt 共用）

1. **只输出合法 JSON**（或实现层要求的 JSON 代码块）；不要 Markdown 解释。
2. **必须符合当前 DSL `version`**（现阶段 `"0.1"`）。
3. **禁止** 输出 Vue / React / HTML 源码。
4. **禁止** 输出 CSS 选择器字符串大段代码；样式只能写在节点 `style` 对象。
5. 坐标系：原点在画布左上；单位 px；`box` 使用整数。
6. 不确定的视觉细节：用 `View` + 近似 `style`，不要编造业务逻辑。
7. 文本从设计图中**如实读取**；看不清则 `"text": null` 并降低把握（若有 `confidence` 字段）。

---

## 3. Prompt 种类

| ID | 名称 | 阶段 | 输入 | 输出 |
|----|------|------|------|------|
| V1 | Vision 单页解析 | Phase 2 | 图片 + 页名 | `UiDocument` |
| V2 | Vision 多页解析 | Phase 2/4 | 多图 | `UiDocument[]`（可分次调用 V1） |
| E1 | 公共组件抽离 | Phase 4 | `UiDocument[]` | `RestoreBundle`（含 shared） |
| M1 | 组件匹配 | Phase 3 | 节点 + ComponentIndex | 带 `componentRef` 的节点 |
| A1 | AutoFix 修订 | Phase 5 | DSL/SFC + Diff 描述 | 修订后的 DSL（优先）或受控 patch |

---

## 4. V1 — Vision 单页解析

### 4.1 System（草案）

```text
你是 UI 结构分析器。你的任务是把设计图转换为 ui-restore UI JSON DSL。

硬性要求：
- 只输出 JSON，符合 version "0.1" 的 UiDocument。
- 不要输出任何框架代码（Vue/React/HTML/CSS 文件）。
- 使用语义 type：Text | Image | Button | Input | View | List | Avatar | Icon | Component。
- 每个可见区块都要有 box：{ x, y, width, height }。
- 可复用的区块可设 extractCandidate: true，但不要自行拆文件。
- style 只使用扁平 JSON 字段（如 fontSize, color, background, borderRadius, opacity）。
- children 表达父子结构；不要用绝对 z 字段除非必要。
```

### 4.2 User（草案模板）

```text
页面 id：{{pageId}}
页面名称：{{pageName}}
设计稿宽度：{{width}}（若未知则根据图片推断）
设计稿高度：{{height}}

请把附图转换为 UiDocument JSON。
```

### 4.3 期望输出骨架

```json
{
  "version": "0.1",
  "page": {
    "id": "login",
    "name": "Login",
    "width": 375,
    "height": 812,
    "background": "#FFFFFF",
    "children": [
      {
        "id": "n_logo",
        "type": "Image",
        "box": { "x": 140, "y": 96, "width": 96, "height": 96 },
        "style": {},
        "children": [],
        "extractCandidate": false
      },
      {
        "id": "n_title",
        "type": "Text",
        "text": "欢迎登录",
        "box": { "x": 24, "y": 220, "width": 327, "height": 32 },
        "style": { "fontSize": 24, "fontWeight": 600, "color": "#111111" },
        "children": []
      },
      {
        "id": "n_submit",
        "type": "Button",
        "text": "登录",
        "box": { "x": 24, "y": 420, "width": 327, "height": 48 },
        "style": { "background": "#1677FF", "color": "#FFFFFF", "borderRadius": 8 },
        "extractCandidate": true,
        "children": []
      }
    ]
  },
  "components": []
}
```

### 4.4 校验失败时

本地 `parser` 抛出结构化错误；可触发 **一次**「修复 JSON」微 Prompt（只修 Schema，不重新理解布局），仍不得输出源码。

---

## 5. E1 — 公共组件抽离

### 5.1 何时用模型

优先用**确定性算法**（结构哈希 / 子树相似度）抽离；模型用于：

- 命名（`UserCard` / `SearchBar`）
- 边界歧义时的裁决
- 生成简短组件职责说明（可选）

### 5.2 System（草案）

```text
你是 UI DSL 重构助手。输入是多个页面的 UiDocument。
任务：找出跨页重复的子树，抽成 sharedComponents，并改写各页对应节点为 componentRef。

规则：
- 只输出 version "0.1" 的 RestoreBundle JSON。
- 不要输出 Vue 源码。
- 保留各页独有结构；只抽真正重复且独立的块。
- shared 组件 name 使用 PascalCase。
- 每个被替换位置必须有 componentRef：{ "name": "...", "from": "shared" }。
```

### 5.3 期望输出骨架

```json
{
  "version": "0.1",
  "pages": [
    {
      "version": "0.1",
      "page": {
        "id": "home",
        "name": "Home",
        "width": 375,
        "height": 812,
        "children": [
          {
            "id": "n_card_1",
            "type": "Component",
            "componentRef": { "name": "UserCard", "from": "shared" },
            "box": { "x": 16, "y": 120, "width": 343, "height": 88 }
          }
        ]
      }
    }
  ],
  "sharedComponents": [
    {
      "name": "UserCard",
      "sourcePageIds": ["home", "profile"],
      "root": {
        "type": "View",
        "box": { "x": 0, "y": 0, "width": 343, "height": 88 },
        "children": []
      }
    }
  ]
}
```

### 5.4 产品约束（写进 Prompt + 本地再校验）

- 至少在 **2 个页面** 出现才允许抽离（可配置）。
- 与 `ComponentIndex` 已有组件高度相似时，应改为 `from: "project"`，不要再造 shared。
- 允许「先报告、后写盘」模式：输出抽离计划供用户确认（实现期 CLI flag）。

---

## 6. M1 — 组件匹配

### 6.1 System（草案）

```text
你是组件匹配器。给定 DSL 节点与项目 ComponentIndex，为节点选择最合适的项目组件。

规则：
- 只能从索引中的 name 选择，或保持不匹配。
- 不要发明索引中不存在的组件。
- 输出 JSON：{ "nodeId": string, "componentName": string | null, "props": object }[]
- 不要输出源码。
```

### 6.2 本地兜底

无模型时：同名 / 别名表匹配。模型仅作增强。

---

## 7. A1 — AutoFix 修订

### 7.1 原则

**优先修订 DSL，再 Generator 覆盖生成。**  
避免模型直接大面积重写 `.vue`。

### 7.2 System（草案）

```text
你是 UI 还原修正器。根据参考图与当前渲染差异，修订 UiDocument DSL。

规则：
- 只输出完整或 JSON Patch 形式的 DSL 更新（由本地约定一种；默认输出完整 page.children 替换需谨慎，优先小范围节点更新）。
- 不要输出 Vue/HTML/CSS 源码文件。
- 只修改与 Diff 相关的节点：box、style、text、层次。
- 保持 id 稳定，便于下一轮对齐。
```

### 7.3 User 应提供的上下文

- 参考图（或裁剪区域）
- 当前截图
- Diff 摘要（分数、主要差异区域）
- 相关节点 DSL 片段
- 配置中的 `threshold` / 当前 round

---

## 8. Provider 适配层

```text
原始模型输出
  → strip code fences
  → JSON.parse
  → zod/schema validate
  → normalize（缺省字段、type 别名、box 取整）
  → UiDocument | RestoreBundle
```

任何 Provider 的差异（工具调用、特殊字段）**止于 adapter**，不得泄漏进 Generator。

---

## 9. Prompt 版本管理

- 本文件版本与 DSL `version` 分开；但发布说明中需同时记录。
- Prompt 文本最终应落在代码仓（如 `packages/vision/prompts/v1.md`），与本文件同步。
- 变更 Prompt 必须：更新本文件 + 增加至少 1 个样例的回归（Schema 通过率）。

---

## 10. 今日冻结的共识

1. 模型输出 = JSON DSL，不是 Vue。
2. 多图抽离在 DSL 层完成，再生成代码。
3. 第一目标是 Vue 3；Prompt 不包含 React 示例，以免污染输出。
4. AutoFix 以修订 DSL 为主路径。

---

## 11. 待实现期补全

- 各 Provider 的 token / 图片大小限制与压缩策略（Sharp）。
- `confidence`、`notes` 等可选字段是否进入 v0.1。
- JSON Patch vs 全量回写的最终选择。
- 中英双语 Prompt 是否维护两套（建议：系统 Prompt 英文更稳，用户文档中文）。
