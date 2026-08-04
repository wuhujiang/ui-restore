# ui-restore — 路线图（ROADMAP）

> 版本：0.1.0-draft  
> 更新日期：2026-08-04  
> 状态：设计中

---

## 1. 版本哲学

- **小步可运行**：每个阶段结束都有可执行产物，而不是半成品堆砌。
- **契约优先**：DSL 与模块边界先于功能堆叠。
- **Vue 3 先深后广**：先把 Vue 3（TS/JS）做到「每天能用」，再考虑 React。
- **文档驱动**：实现必须可回溯到 `docs/`；偏离先改文档再改代码。

---

## 2. 阶段总览

```text
Phase 0  设计定稿（今天）
Phase 1  工程跑通（约一周）
Phase 2  DSL + Vision 接入
Phase 3  扫描 + Generator（真实 Vue 输出）
Phase 4  多图公共组件抽离
Phase 5  AutoFix 闭环
Phase 6  Cursor Agent / 打磨开源体验
Phase 7+ 框架扩展（React 等）与生态
```

---

## 3. Phase 0 — 设计定稿

**目标：** 只做设计，不写业务实现代码。

- [x] 明确产品定位与原则（PRD）
- [x] 明确架构、包边界、数据流（ARCHITECTURE）
- [x] 明确版本节奏（ROADMAP）
- [x] 明确 Prompt / DSL 输出契约（PROMPT）
- [x] 仓库目录占位：`docs/` `packages/` `examples/` `playground/` `test-project/`

**退出标准：** 四份文档齐备，团队对 Vue 3 优先、JSON DSL、多图抽离无分歧。

---

## 4. Phase 1 — 工程跑通（第一周）

**只做三件事：**

1. **Monorepo 骨架**  
   Node 22+ / TypeScript / pnpm / TurboRepo；`packages/cli` 等包壳就位。
2. **UI JSON DSL v0**  
   类型 + JSON Schema（或 Zod）落在 `@ui-restore/shared`；样例入库。
3. **最小命令**  
   `ui-restore restore login.png` 可执行（可先打印「解析图片中...」）；  
   `ui-restore init` 生成 `ui-restore.config.ts`（Vue 3 / ts|js 字段齐全）。

**退出标准：**

- [x] `pnpm install` + `pnpm build`（或 `turbo build`）通过。
- [x] `pnpm ui-restore` / `node packages/cli/dist/index.js` 能跑通 `init` / `restore` 入口。
- [x] DSL 有至少 1 个官方样例 JSON（`packages/shared/samples/login.json`）。

**本阶段不做：** 真 Vision、真生成 `.vue`、AutoFix。

> 2026-08-04：Phase 1 骨架与最小 CLI 已落地；Vision / Generator 仍为 stub。

---

## 5. Phase 2 — Vision → JSON

- [x] 接入图片预处理（Sharp）。
- [x] 实现至少一个 Vision Provider（`openai` + 离线 `mock`）。
- [x] Prompt 严格约束输出为 DSL（见 `PROMPT.md` / `packages/vision/src/prompts/v1.ts`）。
- [x] `parser`：校验 + 归一化；失败可诊断；校验失败可触发一次 repair。

**退出标准：** 单张典型登录页图片 → 合法 `UiDocument` JSON，可保存到磁盘供审查。

> 2026-08-04：可用 `ui-restore restore --provider mock login.png` 无密钥跑通；真实模型设 `OPENAI_API_KEY` + `--provider openai`。

---

## 6. Phase 3 — 扫描 + Generator

- [x] `scanner`：扫描 Vue SFC，建立 ComponentIndex。
- [x] `generator`：DSL → `.vue`（支持 `lang: ts|js`，基础 style）。
- [x] `restore` 写入 `test-project` 可编译。
- [x] `ui-restore scan` 命令。

**退出标准：** 在 `test-project` 中恢复单页，项目可 `dev` 打开，结构可读。

> 2026-08-04：`pnpm ui-restore restore --provider mock --cwd test-project examples/login.png` 生成 `src/pages/login/index.vue`，并复用 `Button`。

---

## 7. Phase 4 — 多图公共组件抽离

- [x] 多文件输入。
- [x] `extractSharedComponents`：DSL 层确定性抽离（结构签名，≥2 页）。
- [x] Generator 输出 shared 组件 + 页面引用。
- [x] 与已有组件库合并策略（先 project match，再抽离；`--no-extract` 可关）。

**退出标准：** ≥2 张含重复结构的图，只生成一份公共组件，两页均引用。

> 2026-08-04：`restore --provider mock --cwd test-project examples/home.png examples/profile.png` 抽离 `AppHeader`。

---

## 8. Phase 5 — AutoFix

- [x] Playwright 截图（DSL→HTML 预览，或可选 `--url` 实页）。
- [x] Sharp Diff 与 score（像素相似度 + heatmap）。
- [x] 迭代修正（优先改 DSL 再 Generator 覆盖 Vue）。
- [x] `threshold` / `maxRounds` 可配置；provider：`mock` / `openai`。

**退出标准：** 固定样例上，AutoFix 能相对首轮生成明显提升还原分；文档标明算法与限制。

> 2026-08-04：`ui-restore autofix <pageId> --reference <img> --provider mock`  
> 算法：mean absolute RGB → score∈[0,1]；mock 按参考图区域采样修正 `background`。  
> 限制：几何大偏移需更强模型；默认截的是 DSL HTML 预览而非完整 Vite 样式（可用 `--url`）。

---

## 9. Phase 6 — Agent 与开源体验

- [x] README 一句话定位与 30 分钟快速开始。
- [x] Cursor Agent / Skill：自然语言 → CLI（`docs/AGENT.md` + `.cursor/skills`）。
- [x] examples、LICENSE（MIT）、基础 CI、贡献指南。
- [x] 调试友好：`.ui-restore/` 产物说明（`docs/DEBUG.md`）。

**退出标准：** 新用户按 README 30 分钟内在自有 Vue 3 项目（或 `test-project`）跑通一次 restore。

> 2026-08-04：开源门面与 CI / Agent 文档已齐；后续可持续打磨发布流程与示例图。

---

## 10. Phase 7+ — 扩展

按「每天能用」优先级排序，不提前挖坑：

| 方向 | 说明 |
|------|------|
| 更多样式体系 | Tailwind / UnoCSS 等 |
| React 支持 | 新 Generator 适配，DSL 尽量不动 |
| 更好的布局推断 | 绝对定位 → flex/grid |
| Provider 生态 | 更多模型与本地模型 |
| VS Code / Cursor 更深集成 | 面板、可视化 Diff |

---

## 11. 第一周任务拆解（建议）

| 日 | 产出 |
|----|------|
| D1 | pnpm workspace + turbo + tsconfig 基线；空包创建 |
| D2 | `@ui-restore/shared` DSL 类型与样例；契约测试 |
| D3 | `@ui-restore/cli`：Commander、`init`、配置加载 |
| D4 | `restore` stub 串联；读图路径校验 |
| D5 | `test-project` 最小 Vue3 靶场；README 开发说明；文档按实现微调 |

---

## 12. 里程碑与发布标签（建议）

| Tag | 含义 |
|-----|------|
| `v0.0.0` | 仅文档 + 空骨架 |
| `v0.1.0` | Phase 1 完成：CLI 可跑 + DSL v0 |
| `v0.2.0` | Vision → JSON 可用 |
| `v0.3.0` | Generator 单页可用 |
| `v0.4.0` | 多图抽离可用 |
| `v0.5.0` | AutoFix 可用 |
| `v1.0.0` | Vue 3 日常可用 + 文档与测试达标 |

版本号可在实现期按实际合并调整，但**语义保持不变**。

---

## 13. 风险与缓释

| 风险 | 缓释 |
|------|------|
| 过早接多模型导致 DSL 漂移 | Schema 契约测试 + adapter 归一 |
| 直接生成 SFC 不可维护 | 架构禁止跳过 DSL；Review 卡点 |
| 抽离误伤（不该合并的合并） | 可配置阈值；先产出报告再写盘 |
| AutoFix 成本高 / 不稳定 | maxRounds、人工确认模式 |
| 范围膨胀到 React / SaaS | Roadmap 门禁：Vue 日常可用前不做 |

---

## 14. 协作方式（固定）

| 角色 | 职责 |
|------|------|
| 架构侧（你） | 架构、Prompt、DSL、Generator/AutoFix 设计、Review、防跑偏 |
| 实现侧（Cursor Agent） | 在仓库内实现、跑通、反馈报错与效果、按文档改代码 |

每次阶段开始：先对一下本 Phase 退出标准；结束后更新 `STATUS.md`。
