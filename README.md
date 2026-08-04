# ui-restore

> **Restore UI into your existing Vue project. Not generate another demo.**

把设计图恢复进**已有 Vue 3 项目**：复用你的组件、抽离多图公共块、用截图 Diff 自动修正。  
不是再生成一套独立 Demo。

[文档](./docs/PRD.md) · [架构](./docs/ARCHITECTURE.md) · [路线图](./docs/ROADMAP.md) · [发布](./docs/PUBLISH.md) · [贡献](./CONTRIBUTING.md) · [Cursor Agent](./docs/AGENT.md)

---

## 为什么不是 Image-to-Code Demo？

| | 常见工具 | ui-restore |
|--|----------|------------|
| 输出 | 新 Demo 工程 | **写入你现有仓库** |
| 中间层 | 常不稳定 | **固定 JSON DSL**（换模型不换 Generator） |
| 组件 | 原生 HTML 为主 | **优先项目组件** |
| 多图 | 各自复制一份 | **DSL 层抽离公共组件** |
| 质量 | 一次生成 | **AutoFix 截图 Diff 闭环** |

---

## 小白先看

### 这是什么？

一个本地 **CLI**：你提供设计图 → 工具写出 JSON DSL → 再生成 `.vue`，写进**你已有的 Vue 3 项目**。  
**不是**在线 SaaS，也**不是**把你的项目绑死在某一家 AI 厂商。

| 东西 | 谁提供 | 说明 |
|------|--------|------|
| `ui-restore` 命令 | 本仓库（工具） | 装在你电脑上，负责流水线与生成代码 |
| 看图的 AI 模型 | **你自己** | 你选 provider / 模型，自己带 API Key；也可以先用 `mock` 不花钱跑通 |

### 怎么装？（现状）

**目前尚未发布到 npm**，暂时不能 `npx @ui-restore/cli`。请从源码安装 CLI（只需装一次）：

```bash
git clone https://github.com/wuhujiang/ui-restore.git
cd ui-restore
pnpm install   # 需要 Node.js 22+、pnpm 10+
pnpm build
```

之后两种用法任选：

1. **推荐**：仍在 `ui-restore` 仓库根目录执行命令，用 `--cwd` 指向你的 Vue 项目。
2. **可选**：`cd packages/cli && pnpm link --global`，之后在任意目录直接打 `ui-restore`（默认对应当前目录）。

发布成功后，用户侧将改为：

```bash
pnpm add -D @ui-restore/cli
pnpm exec ui-restore init
# 或
npx @ui-restore/cli --help
```

维护者发布步骤见 [`docs/PUBLISH.md`](./docs/PUBLISH.md)（包元数据已就绪，执行 `pnpm publish` 即可）。

### 接到我自己的 Vue 项目怎么跑？

假设你的项目在 `/path/to/your-vue-app`，设计图是 `login.png`：

```bash
# 在 ui-restore 仓库根目录
pnpm ui-restore init --cwd /path/to/your-vue-app
pnpm ui-restore scan --cwd /path/to/your-vue-app
pnpm ui-restore restore --provider mock --cwd /path/to/your-vue-app /path/to/login.png
```

- `--cwd` = **你的 Vue 项目根目录**（配置、组件扫描、生成的 `.vue` 都写在这里）。
- 图片路径按**你敲命令时的当前目录**解析（一般在 ui-restore 仓库根）。
- 先改生成的 `ui-restore.config.ts`：确认 `components` / `pages` / `lang`（`ts`|`js`）。

不必把 ui-restore 源码拷进你的业务仓库；CLI 和业务项目是分开的。

### 模型和 Key 怎么选？会不会绑死一家？

**不会。** 模型只负责「看图 → 输出固定 JSON DSL」；生成 Vue 永远走本地 Generator，换模型不用改生成逻辑。

| provider | 要不要 Key | 用途 |
|----------|------------|------|
| `mock` | 否 | 离线跑通流水线、看命令与产物（不真「看」你的设计图） |
| `openai` | 是（`OPENAI_API_KEY`） | 真实 Vision；也兼容多数 OpenAI 协议网关 |

```bash
# 离线
pnpm ui-restore restore --provider mock --cwd /path/to/your-vue-app login.png

# 真实模型（bash）
export OPENAI_API_KEY=sk-...
pnpm ui-restore restore --provider openai --cwd /path/to/your-vue-app login.png

# 换模型名 / 兼容网关（可选）
export OPENAI_BASE_URL=https://your-gateway.example/v1
export UI_RESTORE_VISION_MODEL=gpt-4.1
pnpm ui-restore restore --provider openai --cwd /path/to/your-vue-app login.png
```

也可在目标项目的 `ui-restore.config.ts` 里写 `vision.provider` / `vision.model`，或用环境变量 `UI_RESTORE_VISION_PROVIDER` / `UI_RESTORE_VISION_MODEL` 覆盖。  
目前内置 adapter：`mock`、`openai`（含兼容 API）；更多厂商见 [路线图](./docs/ROADMAP.md)。

### 常见疑问

- **装了是不是只能用 GPT？** 否。工具与模型分离；默认示例用 OpenAI 协议，可换模型名或兼容网关。
- **必须先有 API Key 吗？** 否。`--provider mock` 即可验证安装与命令。
- **会不会改坏我整个仓库？** 主要写入你配置的 pages / components 路径，以及 `.ui-restore/` 调试产物（默认 gitignore）。建议先在分支上试。

---

## 30 分钟快速开始

### 0. 环境

- Node.js **22+**
- [pnpm](https://pnpm.io) 10+

```bash
git clone <this-repo> ui-restore
cd ui-restore
pnpm install
pnpm build
```

### 1. 用仓库自带靶场（最快验证）

```bash
# 离线 mock，无需 API Key
pnpm ui-restore restore --provider mock --cwd test-project examples/home.png examples/profile.png

cd test-project
pnpm dev
```

打开后应看到生成的页面；公共头组件在 `src/components/restored/AppHeader.vue`。

### 2. 接到你自己的 Vue 3 项目

见上文「接到我自己的 Vue 项目怎么跑？」；真实 Vision 用 `--provider openai` 并设置 `OPENAI_API_KEY`。

### 3. AutoFix（可选）

```bash
pnpm --filter @ui-restore/autofix exec playwright install chromium

pnpm ui-restore autofix home \
  --provider mock \
  --cwd test-project \
  --reference examples/home.png \
  --threshold 0.9
```

---

## CLI 一览

| 命令 | 作用 |
|------|------|
| `ui-restore init` | 生成 `ui-restore.config.ts` |
| `ui-restore scan` | 扫描组件 → `.ui-restore/component-index.json` |
| `ui-restore restore <images...>` | 图片 → DSL →（抽离）→ Vue |
| `ui-restore autofix <pageId>` | 截图 Diff 修订 DSL 并重生成 |
| `ui-restore dsl-version` | 打印 DSL 版本 |

常用参数：`--cwd`、`--provider mock|openai`、`--dsl-only`、`--no-extract`、`--reference`、`--threshold`、`--url`。

---

## 核心流水线

```text
图片 → Vision → 固定 UI JSON DSL → 扫描/匹配组件
     →（多图）抽离 shared → Generator(.vue) → AutoFix
```

**禁止：** 图片直接生成 Vue。这是和其他工具最大的架构差别。

---

## 调试产物（请保留审查）

| 路径 | 内容 |
|------|------|
| `.ui-restore/dsl/*.json` | 每页 DSL |
| `.ui-restore/bundle.json` | 多图抽离结果 |
| `.ui-restore/component-index.json` | 组件索引 |
| `.ui-restore/autofix/<pageId>/` | 每轮截图、diff heatmap、summary |

这些目录默认 gitignore；本地调试时直接打开即可。

---

## 在 Cursor 里用

说「恢复登录页」时，Agent 应调用 CLI，而不是手写一页 Demo。

- 说明：[`docs/AGENT.md`](./docs/AGENT.md)
- Skill：[`.cursor/skills/ui-restore/SKILL.md`](./.cursor/skills/ui-restore/SKILL.md)

---

## 文档与包

| 文档 | 内容 |
|------|------|
| [docs/PRD.md](./docs/PRD.md) | 产品需求 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 模块与 DSL |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 版本节奏 |
| [docs/PROMPT.md](./docs/PROMPT.md) | 模型契约 |
| [docs/PUBLISH.md](./docs/PUBLISH.md) | npm 发布清单（维护者） |
| [STATUS.md](./STATUS.md) | 当前进度 |

Monorepo 包：`cli` / `shared` / `vision` / `parser` / `scanner` / `generator` / `autofix` — 见 [`packages/README.md`](./packages/README.md)。

---

## 开发

```bash
pnpm install
pnpm build
pnpm test
```

贡献指南：[CONTRIBUTING.md](./CONTRIBUTING.md)  
许可证：[MIT](./LICENSE)

---

## 状态

Phase 0–5 已落地（骨架 → Vision → Generator → 多图抽离 → AutoFix）。  
Phase 6 起打磨开源体验与 Agent 工作流；React 等扩展见 Roadmap Phase 7+。
