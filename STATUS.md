# 状态记录（STATUS）

> 会话与阶段进度。完成实际开发改动后更新本文件。

---

## 当前阶段

**Phase 6 — Agent 与开源体验**（2026-08-04）

---

## 已完成

### Phase 0–5

- 文档驱动设计；Monorepo；DSL；Vision→JSON；扫描 + Generator；多图抽离；AutoFix。

### Phase 6

- README：一句话定位 + 30 分钟快速开始 + 与 Image-to-Code 对比表
- `LICENSE`（MIT）、`CONTRIBUTING.md`
- GitHub Actions CI：Node 22 + pnpm build/test + Playwright Chromium
- Cursor：`docs/AGENT.md`、`.cursor/skills/ui-restore/SKILL.md`、`.cursor/rules/ui-restore.mdc`
- `docs/DEBUG.md`：`.ui-restore/` 产物说明
- README「小白先看」：源码安装（未发 npm）、`--cwd` 接到自有项目、工具≠模型、`mock`/`openai`/兼容网关、常见疑问；`docs/AGENT.md` 对齐该说明
- npm 发布准备：`packages/*` 补齐 `license` / `engines` / `publishConfig.access` / `repository`；新增 `docs/PUBLISH.md`；README / CONTRIBUTING / AGENT 交叉引用

---

## 后续工作

1. Phase 7+：样式体系 / 布局推断 / React / 更多 Provider（按「每天能用」排序）
2. 执行 `docs/PUBLISH.md` 正式发布 npm；发布后回写 README 安装节为 `npx` / `pnpm add`；补充示例设计图
3. AutoFix 几何修正与实页 Diff 体验加强

---

## 用户明确要求不能修改的文件

（暂无）

---

## 验证结果

- Phase 5 autofix 单测：49.3% → 99.9%
- Phase 6：文档与 CI/Agent 文件已落地（CI 将在推送到 GitHub 后由 Actions 执行）
- 2026-08-04：补充 README「小白先看」与 AGENT 交叉引用（文档改动，未跑构建）
- 2026-08-04：包元数据与 PUBLISH 清单已补齐（未执行 `npm publish`）

---

## 关键决策备忘

| 决策 | 结论 |
|------|------|
| 开源协议 | MIT |
| Agent 路径 | 自然语言 → CLI，禁止跳过 DSL |
| 新人路径 | README「小白先看」+ 30 分钟；优先 `test-project`；明确未发 npm、工具≠模型 |
| 调试 | 保留 `.ui-restore/` 中间产物 |
| npm 入口 | 只发 `packages/*`；用户装 `@ui-restore/cli`；根包 private |
