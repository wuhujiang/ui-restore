# ui-restore

> **Restore UI into your existing Vue project. Not generate another demo.**

把设计图恢复进**已有 Vue 3 项目**：复用你的组件、抽离多图公共块、用截图 Diff 自动修正。  
不是再生成一套独立 Demo。

[文档](./docs/PRD.md) · [架构](./docs/ARCHITECTURE.md) · [路线图](./docs/ROADMAP.md) · [贡献](./CONTRIBUTING.md) · [Cursor Agent](./docs/AGENT.md)

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

```bash
# 在 ui-restore 仓库根目录
pnpm ui-restore init --cwd /path/to/your-vue-app
pnpm ui-restore scan --cwd /path/to/your-vue-app
pnpm ui-restore restore --provider mock --cwd /path/to/your-vue-app /path/to/login.png
```

编辑生成的 `ui-restore.config.ts`：确认 `components` / `pages` / `lang`（`ts`|`js`）。

真实 Vision（可选）：

```bash
export OPENAI_API_KEY=sk-...
pnpm ui-restore restore --provider openai --cwd /path/to/your-vue-app login.png
```

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
