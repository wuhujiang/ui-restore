# packages

| 包 | 状态 | 职责 |
|----|------|------|
| `@ui-restore/cli` | Phase 5 可用 | `init` / `scan` / `restore` / `autofix` |
| `@ui-restore/shared` | 可用 | DSL 类型、Zod schema、样例 |
| `@ui-restore/vision` | 可用 | Sharp + mock/openai |
| `@ui-restore/parser` | 可用 | 校验 + 抽离 |
| `@ui-restore/scanner` | 可用 | 扫描 SFC + 组件匹配 |
| `@ui-restore/generator` | 可用 | 页面 + shared 组件 SFC |
| `@ui-restore/autofix` | Phase 5 可用 | Playwright Diff 闭环 |

详见 `docs/ARCHITECTURE.md`。
