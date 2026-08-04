# 状态记录（STATUS）

> 会话与阶段进度。完成实际开发改动后更新本文件。

---

## 当前阶段

**Phase 5 — AutoFix**（2026-08-04）

---

## 已完成

### Phase 0–4

- 文档、Monorepo、DSL、Vision→JSON、扫描、Generator、多图抽离。

### Phase 5

- `@ui-restore/autofix`
  - Playwright 截图（DSL→HTML 预览，或 `--url`）
  - Sharp 像素 Diff + heatmap；score ∈ [0,1]
  - 循环：截图 → Diff → 修订 DSL → 再生成 Vue
  - Provider：`mock`（参考图区域采样修正 background）/ `openai`
- CLI：`ui-restore autofix <pageId> --reference <img>`
- 产物：`.ui-restore/autofix/<pageId>/round-N/`

---

## 后续工作

1. Phase 6：开源体验（README/LICENSE/CI/Agent）
2. 更强几何修正、实页 Vite Diff 默认化

---

## 用户明确要求不能修改的文件

（暂无）

---

## 验证结果

- `pnpm build` 通过
- autofix 单测：相似度 **49.3% → 99.9%**
- 需本机已安装 Chromium：`pnpm --filter @ui-restore/autofix exec playwright install chromium`

---

## 关键决策备忘

| 决策 | 结论 |
|------|------|
| 修正主路径 | 改 DSL，再 Generator 覆盖 Vue |
| Diff 算法 | mean absolute RGB |
| 默认截图 | DSL HTML 预览；可用 `--url` 截实页 |
| mock | 采样参考色修正 background，保证可离线验证 |
