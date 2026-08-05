# ui-restore — 架构设计（ARCHITECTURE）

> 版本：0.1.0-draft  
> 更新日期：2026-08-04  
> 状态：设计中

---

## 1. 目标

把「设计图 → 可维护的 Vue 代码」拆成稳定、可替换的流水线。

**硬约束：**

1. **禁止** 图片直接生成 Vue 源码。
2. Vision / LLM **必须** 输出固定 **UI JSON DSL**；Generator 只消费 DSL。
3. 第一目标框架：**Vue 3**（`lang: 'ts' | 'js'`）。
4. 多图必须支持 **跨页公共组件抽离**。
5. 技术选型以「以后每天能用、基本不会换」为准。

---

## 2. 仓库结构（目标形态）

```text
ui-restore/
├── README.md
├── LICENSE
├── STATUS.md
├── package.json                 # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── PROMPT.md
├── packages/
│   ├── cli/                     # Commander 入口
│   ├── vision/                  # 图片 → DSL（调用模型 / 本地预处理）
│   ├── parser/                  # DSL 校验、归一化、跨页抽离
│   ├── generator/               # DSL + 组件索引 → Vue 文件
│   ├── autofix/                 # 截图 Diff 闭环
│   ├── scanner/                 # 扫描项目组件，建立索引（可并入 parser，见下）
│   └── shared/                  # 类型、DSL schema、工具函数
├── examples/                    # 对外示例说明 / 样例图
├── playground/                  # 本地试验（可选）
└── test-project/                # 真实 Vue3 靶场项目（回归用）
```

### 2.1 包边界

| 包 | 职责 | 不做什么 |
|----|------|----------|
| `@ui-restore/cli` | 解析命令、读配置、编排流水线 | 不含模型 Prompt 细节、不含代码生成模板核心 |
| `@ui-restore/vision` | 图片预处理（Sharp）、调用 Vision、得到原始 DSL | 不写文件到业务项目 |
| `@ui-restore/parser` | DSL schema 校验、归一化、多图合并与公共组件抽离 | 不调用浏览器 |
| `@ui-restore/scanner` | 扫描 `components` 目录，产出组件索引 | 不生成页面 |
| `@ui-restore/generator` | 根据 DSL + 索引生成 `.vue` / 样式 | 不直接读图片 |
| `@ui-restore/autofix` | 启动/渲染、截图、Diff、请求修改建议、写回 | 不重新做 Vision 布局理解（可引用 DSL） |
| `@ui-restore/shared` | `UiDocument` 类型、zod/json-schema、常量 | 无业务副作用 |

> 实现阶段若包过碎，允许 `scanner` 暂挂在 `parser` 下，但逻辑边界必须保留。

---

## 3. 技术栈（固定）

| 技术 | 用途 | 为何固定 |
|------|------|----------|
| Node.js 22+ | 运行时 | LTS 向，现代 API |
| TypeScript | 全仓语言 | 类型即契约（尤其 DSL） |
| pnpm | 包管理 | 与 Monorepo 配合稳定 |
| TurboRepo | 构建编排 | 多包缓存与任务图 |
| Commander | CLI | 成熟、足够 |
| ts-morph | 组件扫描 / 部分代码改写 | 结构化操作 TS/JS |
| Playwright | 页面截图与 AutoFix | 真实渲染 |
| Sharp | 图片预处理 / Diff 辅助 | 本地高性能 |

AI Provider（OpenAI / Claude / Gemini 等）属于**可替换适配层**，放在 `vision` / `autofix` 内，不进入核心 DSL。

---

## 4. 端到端数据流

### 4.1 单图

```text
login.png
  → vision: preprocess + LLM → UiDocument (JSON)
  → parser: validate + normalize
  → scanner: ComponentIndex（已有项目组件）
  → parser/matcher: 节点绑定到已有组件（可选）
  → generator: 写入 pages/login/index.vue (+ style)
  → autofix（后续）: screenshot ↔ diff ↔ patch loop
```

### 4.2 多图 + 公共组件抽离

```text
[login.png, home.png, profile.png]
  → vision × N → UiDocument[]
  → parser.validate each
  → parser.extractSharedComponents(docs)
       → SharedComponent[]          // 抽离出的公共 DSL 组件
       → UiDocument[] (rewritten)   // 页面节点改为引用 shared
  → scanner: ComponentIndex
  → matcher: shared / 页面节点 vs 已有组件
  → generator:
       → components/.../*.vue       // 新公共组件
       → pages/.../*.vue            // 页面引用公共组件
  → autofix（按页或按组件，后续定）
```

**关键点：** 抽离发生在 **JSON DSL 层**，不是在生成后的 Vue AST 里事后拆文件。这样 Generator 永远只做「DSL → 代码」，边界清晰。

---

## 5. UI JSON DSL（v0 草案）

> 这是全项目最核心的契约。GPT / Claude / Gemini **全部输出这一种**；Generator **只认这一种**。

### 5.1 设计目标

- 表达布局与语义结构，而不是某一框架的语法。
- 足够稳定：字段增删走版本号，不随意改名。
- 支持：坐标/盒子、组件类型、文本、图片、样式令牌、**组件引用**、**可抽离标记**。

### 5.2 顶层结构

```json
{
  "version": "0.1",
  "page": {
    "id": "login",
    "name": "Login",
    "width": 375,
    "height": 812,
    "background": "#FFFFFF",
    "children": []
  },
  "components": []
}
```

多图场景下，流水线内部使用：

```ts
type RestoreBundle = {
  version: '0.1'
  pages: UiDocument[]
  sharedComponents: UiComponentDef[]
}
```

单图可视为 `pages.length === 1` 且 `sharedComponents` 为空的退化形式。

### 5.3 节点（Node）

```json
{
  "id": "n_btn_submit",
  "type": "Button",
  "name": "SubmitButton",
  "box": { "x": 24, "y": 640, "width": 327, "height": 48 },
  "text": "登录",
  "style": {
    "fontSize": 16,
    "fontWeight": 600,
    "color": "#FFFFFF",
    "background": "#1677FF",
    "borderRadius": 8
  },
  "props": {},
  "children": [],
  "componentRef": null,
  "extractCandidate": false
}
```

字段说明：

| 字段 | 含义 |
|------|------|
| `id` | 稳定节点 ID（抽离与 AutoFix 对齐用） |
| `type` | 语义类型：`Text` / `Image` / `Button` / `Input` / `View` / `List` / …（枚举可扩展） |
| `box` | 相对页面的布局盒（单位 px，设计稿坐标系） |
| `text` | 可见文本（若有） |
| `style` | 视觉样式（保持扁平、可序列化；不写 CSS 选择器） |
| `props` | 传给目标组件的属性（匹配到项目组件后填充） |
| `children` | 子节点 |
| `componentRef` | 若引用已有或抽离组件：`{ "name": "AppButton", "from": "project" \| "shared" }` |
| `extractCandidate` | Vision 提示：该子树可能是可复用块（抽离阶段再决策） |

### 5.4 公共组件定义（抽离结果）

```json
{
  "name": "UserCard",
  "sourcePageIds": ["home", "profile"],
  "root": {
    "type": "View",
    "children": []
  }
}
```

页面中对应位置变为：

```json
{
  "type": "Component",
  "componentRef": { "name": "UserCard", "from": "shared" },
  "box": { "x": 16, "y": 120, "width": 343, "height": 88 }
}
```

### 5.5 版本策略

- `version` 字段强制存在。
- 破坏性变更升主版本（`0.x` → `0.y` 也需迁移说明）。
- `shared` 包导出 JSON Schema / Zod，**CI 用契约测试锁死**。

### 5.6 反例（禁止）

- DSL 中直接出现 Vue 模板字符串、`class="xxx"` 选择器大段 CSS。
- DSL 中出现框架专有生命周期或路由代码。
- 不同模型输出不同 schema（必须经 adapter 归一到本 DSL）。

---

## 6. 配置文件

路径：项目根目录 `ui-restore.config.ts`（亦计划支持 `.mts` / `.js`）。

```ts
export default {
  framework: 'vue',          // 一期仅 vue
  lang: 'ts',                // 'ts' | 'js'
  style: 'css',              // 默认无需额外依赖；使用 'scss' 前需在目标项目安装 sass
  components: 'src/components',
  pages: 'src/pages',
  sharedComponents: 'src/components/restored',
  entry: {
    // 可选：AutoFix 的实际页面 URL；可被 --url 覆盖
    // devServer: 'http://localhost:5173'
  },
  /**
   * Vision 为可插拔适配层，不是写死某家模型。
   * 示例里的 provider/model 只是默认占位，可随时改配置或用环境变量覆盖：
   *   UI_RESTORE_VISION_PROVIDER / UI_RESTORE_VISION_MODEL
   * 换 GPT / Claude / Gemini 只换 adapter + 配置，不改 DSL / Generator。
   */
  vision: {
    provider: 'openai', // 'openai' | 'anthropic' | 'google' | string
    model: 'gpt-4.1',   // 具体型号不锁定；以你本地可用的为准
  },
  autofix: {
    threshold: 0.98,
    maxRounds: 5
  }
}
```

`init` 命令负责交互或默认生成该文件。

---

## 7. CLI 命令（设计）

| 命令 | 行为 |
|------|------|
| `ui-restore init` | 生成配置；探测是否 Vue 项目（启发式） |
| `ui-restore restore <images...>` | 执行恢复流水线 |
| `ui-restore scan` | 仅扫描组件索引并打印/缓存 |
| `ui-restore autofix <page>` | 对已生成页面跑 Diff 闭环（后期） |

一期最小实现：`restore` 可先 stub 打印「解析图片中...」，但参数与出口结构按最终形态预留。

---

## 8. 组件扫描与匹配

### 8.1 扫描产出（ComponentIndex）

```json
{
  "Button": {
    "name": "Button",
    "path": "src/components/Button.vue",
    "export": "default",
    "props": ["type", "size", "disabled"]
  },
  "AppInput": {
    "name": "AppInput",
    "path": "src/components/AppInput.vue",
    "props": ["modelValue", "placeholder"]
  }
}
```

实现手段：文件系统 + `ts-morph` / SFC 解析（`vue/compiler-sfc`）。

### 8.2 匹配策略（分层）

1. **精确**：DSL `type` / `name` 与索引同名。
2. **别名表**：配置或内置映射（`Text` → 无组件则用原生 / 项目 Typography）。
3. **LLM 辅助（可选）**：在索引候选内选择，不得发明索引外组件名（除非生成新 shared 组件）。

匹配后写入节点 `componentRef` 与 `props`，Generator 据此发 import。

---

## 9. Generator（Vue 3）

### 9.1 输出形态示例

```text
src/pages/login/index.vue
src/components/restored/UserCard.vue
```

`lang: 'ts'` → `<script setup lang="ts">`  
`lang: 'js'` → `<script setup>`

样式按 `style` 配置：`scoped` + scss / css / module。

### 9.2 原则

- 只消费 **已校验 DSL + ComponentIndex**。
- 布局初期可用绝对定位贴近设计盒；后续可进化为 flex/grid 推断（不阻塞 v0）。
- 生成代码必须可读、可手改；禁止巨型单文件无结构堆砌（多图抽离就是为了这个）。

---

## 10. AutoFix

```text
reference.png + generated page
  → Playwright 打开预览 URL / 本地静态挂载
  → screenshot
  → Sharp / 感知对比 → score
  → score < threshold → LLM（输入：DSL 片段 + diff 描述 + 当前 SFC）
  → 得到 patch（仍建议回到 DSL 修正再生成，或受控的 SFC patch）
  → 循环直至达标或 maxRounds
```

**推荐主路径：** 修正仍落在 DSL，再 Generator 覆盖生成，避免 LLM 直接乱改 SFC 导致不可维护。  
**例外路径：** 样式微调可允许受控 SFC patch（需在实现期用测试锁住）。

---

## 11. 目录与包依赖方向

```text
cli → vision → parser → generator
        ↓         ↓
     shared ←←←←←┘
cli → scanner → shared
cli → autofix → generator / shared
```

依赖规则：**禁止** `shared` 依赖任何业务包；**禁止** `generator` 依赖 `vision`。

---

## 12. 测试策略（架构层）

| 层级 | 内容 |
|------|------|
| 契约测试 | DSL JSON Schema 固定样例 |
| 单元测试 | parser 抽离算法、matcher、config 加载 |
| 快照测试 | generator 对固定 DSL 的 `.vue` 输出 |
| 端到端 | `test-project` + 样例图跑 CLI（后期 + AutoFix） |

---

## 13. 安全与密钥

- API Key 仅来自环境变量或本地忽略文件（如 `.env.local`），不入库。
- 默认不上传用户项目源码到第三方；若某 Provider 需要上下文，须在文档中明示最小上传集。

---

## 14. 今日不实现、但架构必须预留的扩展点

- React 等 `framework` 适配（Generator 插件化）。
- 多种 style engine。
- Provider 插件（vision / autofix）。
- Cursor Agent / MCP 封装（调用同一套 CLI）。
