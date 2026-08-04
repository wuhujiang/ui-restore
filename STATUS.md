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

---

## 后续工作

1. Phase 7+：样式体系 / 布局推断 / React / 更多 Provider（按「每天能用」排序）
2. 发布 npm 包与更完整示例设计图
3. AutoFix 几何修正与实页 Diff 体验加强

---

## 用户明确要求不能修改的文件

（暂无）

---

## 验证结果

- Phase 5 autofix 单测：49.3% → 99.9%
- Phase 6：文档与 CI/Agent 文件已落地（CI 将在推送到 GitHub 后由 Actions 执行）

---

## 关键决策备忘

| 决策 | 结论 |
|------|------|
| 开源协议 | MIT |
| Agent 路径 | 自然语言 → CLI，禁止跳过 DSL |
| 新人路径 | README 30 分钟；优先 `test-project` |
| 调试 | 保留 `.ui-restore/` 中间产物 |
