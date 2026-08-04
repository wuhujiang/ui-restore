# 发布到 npm（维护者）

面向仓库维护者。用户安装说明见根目录 [README.md](../README.md)。

根包 `ui-restore` 为 `private: true`，**不要发布**。用户安装入口是 `@ui-restore/cli`。

## 发布哪些包

| 顺序 | 包名 | 说明 |
|------|------|------|
| 1 | `@ui-restore/shared` | DSL / 类型 |
| 2 | `@ui-restore/parser` | 校验 / 抽离 |
| 2 | `@ui-restore/scanner` | 组件扫描 |
| 2 | `@ui-restore/vision` | Vision 适配 |
| 3 | `@ui-restore/generator` | DSL → Vue |
| 3 | `@ui-restore/autofix` | Diff 闭环 |
| 4 | `@ui-restore/cli` | CLI（`bin: ui-restore`） |

同序号包可并行；跨序号须先发完再发下一层。  
`workspace:*` 在 `pnpm publish` 时会自动替换为真实版本，无需手改。

## 发布前检查

1. [ ] `npm login` 且 `npm whoami` 正常
2. [ ] 拥有 scope `@ui-restore` 的发布权限（Organization 或首次占名）
3. [ ] 各 `packages/*/package.json` 已含 `license` / `publishConfig.access: public` / `repository`
4. [ ] 版本号已 bump（首次可用 `0.1.0`）
5. [ ] `pnpm install && pnpm build && pnpm test` 通过
6. [ ] 工作区干净或已提交（否则可能需 `--no-git-checks`，不推荐成习惯）
7. [ ] dry-run 检查 tarball 未误带密钥 / 源码意外文件

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @ui-restore/shared publish --dry-run
```

## 正式发布

按依赖顺序：

```bash
pnpm --filter @ui-restore/shared publish
pnpm --filter @ui-restore/parser publish
pnpm --filter @ui-restore/scanner publish
pnpm --filter @ui-restore/vision publish
pnpm --filter @ui-restore/generator publish
pnpm --filter @ui-restore/autofix publish
pnpm --filter @ui-restore/cli publish
```

或一次性：

```bash
pnpm -r publish --filter './packages/*'
```

各包已配置 `"publishConfig": { "access": "public" }`，scoped 包会发成公开包。

可选打 Git tag：

```bash
git tag v0.1.0
git push origin v0.1.0
```

## 发布后验证

```bash
npm view @ui-restore/cli version
npx @ui-restore/cli --help

# 在任意空目录 / Vue 项目
pnpm add -D @ui-restore/cli
pnpm exec ui-restore init
```

然后更新：

1. [README.md](../README.md)「怎么装」改为以 npm / `npx` 为主，源码安装改为「开发本仓库」
2. [STATUS.md](../STATUS.md) 勾掉「发布 npm」
3. 本文件若有流程变更一并改

## 升级版本

1. 同步修改各包 `version`（或后续引入 changesets）
2. `pnpm build && pnpm test`
3. 按同样顺序 `publish`
4. DSL / 公开 API 破坏性变更 → 升 major，并更新 `docs/ARCHITECTURE.md`

## 常见问题

| 现象 | 处理 |
|------|------|
| `ENEEDAUTH` | `npm login` |
| `402 Payment Required` / 私有包 | 确认 `publishConfig.access` 为 `public` |
| scope 404 / 无权限 | 在 npm 创建 Organization `ui-restore` 或换有权限的账号 |
| `workspace:` 解析失败 | 各包需有 `version`；先 `pnpm install` |
| Git dirty 拒绝发布 | 先 commit，或临时 `--no-git-checks` |
