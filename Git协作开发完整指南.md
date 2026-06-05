# 🎮 Git 双机协作完整指南

> **你的仓库**：https://github.com/M1kasa0ix03/cpp-projects（私有）
> **最后更新**：2026-06-05

---

## 📍 你的双机环境

| | 💻 Mac | 🪟 Windows |
|---|---|---|
| **本地路径** | `~/Desktop/c++` | `d:\code` |
| **GitHub** | `M1kasa0ix03` | `M1kasa0ix03` |
| **分支** | `main` | `main` |

---

## 🔄 每日工作流程（背下这个就够了）

```
┌─────────────────────────────────────────────────┐
│  每 次 开 始 写 代 码 之 前                      │
│  1. git pull    ← 拉取另一台机子的最新改动       │
│  2. 写代码...                                     │
│  3. git add .                                     │
│  4. git commit -m "干了什么"                      │
│  5. git push    ← 上传到 GitHub                   │
└─────────────────────────────────────────────────┘
```

> ⚠️ **黄金法则：先 pull → 再写 → 再 push，永远不要反过来！**

---

## 🪟 Win 终端操作（你现在的机子）

打开 VS Code 终端（Ctrl + `），确认你在仓库里：

```bash
cd d:\code
```

### 查看当前状态
```bash
git status
```
会告诉你：哪些文件改了 / 哪些还没保存 / 和云端是否同步

### 查看提交历史
```bash
git log --oneline -5
```
每行一条记录，最新在最上面

---

## 📤 上传代码（三种方式）

### 方式一：用 VS Code 图形界面（最简单）
1. 左侧点 **源代码管理** 图标（或 Ctrl+Shift+G）
2. 在 Message 框输入描述，如 `"新增xxx功能"`
3. 点 **✓ 提交** → 点 **同步更改**

### 方式二：用 AI 帮你操作
直接对 Copilot 说：
```
帮我把 d:\code 里所有改动上传到 GitHub
```

### 方式三：终端手敲命令
```bash
git add .                              # 添加所有改动
git commit -m "描述你改了什么"          # 提交（拍快照）
git push                               # 推到云端
```

---

## 📥 拉取代码

另一台机子改完推了之后，在这台拉下来：

```bash
git pull
```

---

## 🚨 常见问题 & 解决办法

### ❌ 忘记 pull 就改了，push 时报错

```
! [rejected]  main -> main (fetch first)
```

**解决：**
```bash
git pull                                # 先拉
# 如果有冲突，解决冲突 → 保存
git add .
git commit -m "合并冲突"
git push
```

### ❌ 想撤销还没提交的修改

```bash
git checkout -- 文件名                  # 撤销单个文件
git checkout -- .                       # 撤销所有文件
```

### ❌ 提交信息写错了

```bash
git commit --amend -m "新的提交信息"
```

### ❌ add 了不想 add 的文件

```bash
git reset HEAD 文件名                   # 取消暂存
```

### ❌ 想回到之前的某个版本

```bash
git log --oneline -10                  # 查看最近10条记录
# 记下你想回到的那个版本号（前7位），然后：
git checkout 版本号 -- 文件名           # 只恢复某个文件
# 或者告诉 AI：帮我把 xxx 文件回退到版本 a1b2c3d
```

---

## 📋 命令速查表

| 命令 | 作用 | 什么时候用 |
|------|------|-----------|
| `git status` | 查看当前状态 | 不知道发生了什么的时候 |
| `git log --oneline` | 看提交历史 | 想看之前改了什么 |
| `git pull` | 拉取云端代码 | **每次写代码前** |
| `git add .` | 暂存所有改动 | 准备提交前 |
| `git commit -m "xxx"` | 提交改动 | add 完之后 |
| `git push` | 推送到 GitHub | commit 完之后 |
| `git diff` | 查看具体改了什么 | 提交前确认一下 |

---

## 🤖 对 AI 说的常用话

| 你想做的事 | 对 Copilot 说 |
|-----------|-------------|
| 上传当前文件 | `帮我把当前文件上传到 GitHub` |
| 上传所有改动 | `帮我把 d:\code 所有改动 add+commit+push` |
| 拉取最新代码 | `帮我 git pull 拉最新代码` |
| 看仓库状态 | `帮我看看仓库状态和最近提交` |
| 撤销修改 | `帮我撤销 xxx.cpp 的改动` |
| 看历史 | `帮我看看最近 10 条提交记录` |

---

## ⚡ 换机子前检查清单

```
□ git status（确保没有未提交的改动）
□ git push（确保所有改动已上传）
□ 关闭 VS Code
□ 到另一台机子，先 git pull
```

---

## 🔑 Token 管理

- 查看/重新生成 Token：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Token 和密码一样重要，**不要发到群聊/截图给别人**
- 如果泄露了，马上去 GitHub 删除重建

---

> 💡 **一句话总结**：把你电脑当作终点站，GitHub 当作中转站。每次写完推到中转站，换机子从中转站拉下来，就这么简单。
