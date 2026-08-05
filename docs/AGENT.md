# Cursor Agent — ui-restore

把自然语言意图映射到本仓库 CLI。开发与贡献前先读 `docs/`。

## 一句话定位

**Restore UI into your existing Vue project. Not generate another demo.**

面向人类用户的安装说明、工具与模型分离、`--cwd` 用法见仓库根目录 [`README.md`](../README.md)「小白先看」。Agent 回答「怎么装 / 会不会绑死模型」时优先对齐该节，勿暗示已可 `npx`（npm 尚未发布；发布流程见 [`PUBLISH.md`](./PUBLISH.md)）。

## 用户说法 → 命令

| 用户意图 | 建议执行 |
|----------|----------|
| 初始化 / 生成配置 | `pnpm ui-restore init --cwd <vue-project>` |
| 恢复登录页 / restore xxx.png | `pnpm ui-restore restore --cwd <vue-project> <image>` |
| 多图并抽公共组件 | `pnpm ui-restore restore --cwd <vue-project> a.png b.png` |
| 扫描组件库 | `pnpm ui-restore scan --cwd <vue-project>` |
| 自动修正 / 对比设计图 | `pnpm ui-restore autofix <pageId> --cwd <vue-project> --reference <image> --url <实际页面 URL>` |

在 monorepo 根目录开发时，先 `pnpm build`，再用 `pnpm ui-restore ...`。

## 硬约束（Agent 不得违反）

1. **禁止**跳过 JSON DSL，直接让模型写 `.vue` 大文件交差。
2. Vision / AutoFix 输出必须是 DSL；换模型不改 Generator。
3. 优先复用项目已有组件（`scan` / ComponentIndex）。
4. 多图默认抽离公共组件；用户明确说不要时加 `--no-extract`。
5. AutoFix 优先改 DSL，再重新生成 Vue。

## 无密钥本地验证

```bash
pnpm ui-restore restore --provider mock --cwd test-project examples/home.png
# 先在另一个终端启动：cd test-project && pnpm dev
pnpm ui-restore autofix home --provider mock --cwd test-project --reference examples/home.png --url http://localhost:5173 --threshold 0.9
```

## 调试产物（保留，便于审查）

| 路径 | 含义 |
|------|------|
| `.ui-restore/dsl/*.json` | 页面 DSL |
| `.ui-restore/bundle.json` | 多图抽离结果 |
| `.ui-restore/component-index.json` | 组件扫描索引 |
| `.ui-restore/autofix/<pageId>/` | 每轮截图、diff、summary |

## Provider

- 环境变量：`UI_RESTORE_VISION_PROVIDER` / `UI_RESTORE_VISION_MODEL` / `OPENAI_API_KEY`
- 可插拔，不写死厂商；`mock` 用于离线跑通。

## 相关文档

- `docs/PRD.md` / `ARCHITECTURE.md` / `ROADMAP.md` / `PROMPT.md`
- 仓库内 Cursor Skill：`.cursor/skills/ui-restore/SKILL.md`
