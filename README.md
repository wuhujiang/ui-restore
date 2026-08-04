# ui-restore

> Restore UI into your existing Vue project. Not generate another demo.

把设计图恢复进**已有 Vue 3 项目**，复用项目组件；支持多图抽离公共组件。不是再生成一套 Demo。

## 当前状态

**Phase 5 — AutoFix（可用）**

截图 Diff 闭环：修订 DSL → 再生成 Vue。支持 `mock` / `openai`。

## 快速开始（开发）

```bash
pnpm install
pnpm build
pnpm --filter @ui-restore/autofix exec playwright install chromium

# 先 restore，再 autofix
pnpm ui-restore restore --provider mock --cwd test-project examples/home.png
pnpm ui-restore autofix home --provider mock --cwd test-project --reference examples/home.png --threshold 0.9
```

产物：`.ui-restore/autofix/<pageId>/`（每轮截图、diff heatmap、DSL）

## 文档

| 文档 | 内容 |
|------|------|
| [docs/PRD.md](./docs/PRD.md) | 产品需求与成功标准 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 模块边界、数据流、UI JSON DSL |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 阶段与版本节奏 |
| [docs/PROMPT.md](./docs/PROMPT.md) | Vision / 抽离 / AutoFix 的模型契约 |
| [STATUS.md](./STATUS.md) | 进度记录 |

## 技术方向（已定）

- Vue 3 优先（TypeScript / JavaScript）
- 图片 → Vision → **固定 JSON DSL** → Generator → AutoFix
- Vision Provider **可插拔**（配置 / 环境变量），不写死某一家模型

## 仓库结构

```text
docs/  packages/  examples/  playground/  test-project/
```
