# Contributing to ui-restore

感谢你愿意一起把这个工具做得「每天能用」。

## 原则

1. **所有开发围绕 `docs/`**：偏离先改文档再改代码。
2. **禁止图片直接出 Vue**：必须经过固定 UI JSON DSL。
3. **技术决策标准**：以后你每天都能用——不为技术而技术。
4. **小步可运行**：每个 PR 尽量有可验证产物（测试 / CLI 演示）。

## 开发环境

- Node.js `>=22`
- pnpm `10+`（仓库已锁定 `packageManager`）

```bash
pnpm install
pnpm build
pnpm test
```

AutoFix 相关测试需要 Chromium：

```bash
pnpm --filter @ui-restore/autofix exec playwright install chromium
```

## 包边界

| 包 | 可改范围 |
|----|----------|
| `shared` | DSL 类型 / Zod（破坏性变更需升版本并写迁移） |
| `vision` | Provider 适配，不得泄漏到 Generator |
| `parser` | 校验 / 归一化 / 抽离 |
| `scanner` | 组件扫描与匹配 |
| `generator` | 只消费 DSL + Index → Vue |
| `autofix` | 截图 Diff；优先改 DSL |
| `cli` | 命令编排 |

依赖方向见 `docs/ARCHITECTURE.md`。

## 提 PR 前检查

- [ ] `pnpm build` 通过
- [ ] `pnpm test` 通过
- [ ] 若改 DSL：更新 `docs/ARCHITECTURE.md` + 样例 + 契约测试
- [ ] 若改 Prompt：更新 `docs/PROMPT.md` 与代码内 prompt 文本
- [ ] 功能变化：同步 `docs/` 与 `STATUS.md`（若你在维护状态）

## 发布到 npm

维护者按 [`docs/PUBLISH.md`](./docs/PUBLISH.md) 执行。根包不发布；用户入口为 `@ui-restore/cli`。

## Commit 风格

简洁说明「为什么」，例如：

- `fix(autofix): treat empty screenshots as score 0`
- `feat(parser): extract shared headers across pages`

## 行为准则

保持尊重、就事论事。Issue / PR 请附最小复现（配置、图片类型、命令、日志）。
