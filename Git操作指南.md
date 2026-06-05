# 🚀 Git + GitHub 操作指南

> 仓库地址：`https://github.com/M1kasa0ix03/cpp-projects`

---

## 🪟 Win 电脑首次配置（只做一次）

打开 VS Code，按 **Ctrl + `** 打开终端，依次复制运行：

```bash
git config --global user.name "M1kasa0ix03"
```
```bash
git config --global user.email "m1kasa0ix03@gmail.com"
```
```bash
cd ~/Desktop && git clone https://github.com/M1kasa0ix03/cpp-projects.git c++
```

完成后桌面上会出现 `c++` 文件夹，以后所有代码都放这里面。

---

## 📤 上传文件到 GitHub（每次写完代码做一次）

确保终端在 `c++` 文件夹里（如果是刚打开终端，先 `cd ~/Desktop/c++`），然后：

```bash
git add .
```
```bash
git commit -m "写清楚你干了什么"
```
```bash
git push
```

> 💡 把 `写清楚你干了什么` 改成实际内容，比如 `"添加了贪吃蛇游戏"` 或 `"修复了一个bug"`

---

## 📥 从 GitHub 下拉最新代码（每次开始写代码前做一次）

```bash
git pull
```

---

## 🔄 日常完整流程

```
开机 → git pull → 写代码 → git add . → git commit -m "..." → git push → 关机
```

**记住口诀：开机先 pull，关机前 push。**

---

## ❓ 常见情况

| 你想做什么 | 命令 |
|-----------|------|
| 看看改了哪些文件 | `git status` |
| 查看提交历史 | `git log --oneline` |
| 撤销还没 add 的修改 | `git checkout -- 文件名` |

---

## ⚠️ 避坑规则

1. **永远先 `git pull` 再开始写代码**，不然容易冲突
2. 不要修改 `.gitignore` 文件
3. 如果 `git push` 报错说被拒绝，先 `git pull` 再 `git push`
4. 遇到任何报错，看不懂的就截图发给我

---

> 🕐 最后更新：2026-06-05
