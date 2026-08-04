# ui-restore test-project

Vue 3 + Vite 靶场，用于验证「写入已有项目」。

## 用法

```bash
# 在仓库根目录
pnpm build
pnpm ui-restore restore --provider mock --cwd test-project examples/login.png

# 在 test-project 内预览
cd test-project
pnpm install
pnpm dev
```

内置组件：`Button`、`AppInput`（restore 时应优先复用 `Button`）。
