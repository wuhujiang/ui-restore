# examples

| 文件 | 说明 |
|------|------|
| `login.dsl.json` | 官方 DSL v0.1 登录页样例 |
| `login.png` / `home.png` / `profile.png` | 占位图（mock restore 用） |

```bash
# 单图
pnpm ui-restore restore --provider mock --cwd test-project examples/login.png

# 多图抽离公共组件（AppHeader）
pnpm ui-restore restore --provider mock --cwd test-project examples/home.png examples/profile.png
```
