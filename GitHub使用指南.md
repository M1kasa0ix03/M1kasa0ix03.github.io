# 🌐 GitHub 是什么 & 怎么用

---

## 一、GitHub 是什么？

一句话：**GitHub 就是代码的"百度网盘 + 协作平台"。**

| 对比 | 百度网盘 | GitHub |
|------|---------|--------|
| 存什么 | 照片、视频、文件 | 代码、文档 |
| 怎么同步 | 上传/下载 | `git push` / `git pull` |
| 版本管理 | ❌ 覆盖就没了 | ✅ 每次修改都有记录，能回退 |
| 多人协作 | ❌ 不行 | ✅ 多人同时写一个项目 |
| 查看历史 | ❌ 看不到 | ✅ 谁在什么时候改了什么，一清二楚 |

---

## 二、为什么程序员都用它？

- 📁 **云备份**：代码不会丢，换电脑也能继续写
- ⏪ **时光机**：改坏了？一键回到之前的版本
- 👥 **协作**：和朋友一起写项目，互不干扰
- 📝 **简历**：你的 GitHub 主页就是最好的技术简历
- 🌍 **开源**：全世界的程序员在上面分享代码，免费学习

---

## 三、核心概念

```
你的电脑  <────── Git ──────>  GitHub（云端）
  (本地)      推送/拉取          (远程)
```

### 三个关键词

| 名词 | 解释 | 比喻 |
|------|------|------|
| **仓库（Repository）** | 存放一个项目的文件夹 | 📁 你的项目文件夹 |
| **提交（Commit）** | 一次保存操作 | 📸 给代码拍一张快照 |
| **推送（Push）** | 把代码上传到云端 | ☁️ 上传到百度网盘 |

---

## 四、你的仓库信息

> 🔗 仓库地址：**https://github.com/M1kasa0ix03/cpp-projects**
> 
> 💻 Mac 本地路径：`~/Desktop/c++`
> 
> 🪟 Win 本地路径：`~/Desktop/c++`

---

## 五、日常操作（三板斧）

### 📤 上传代码（写完就做）

```bash
git add .                        # 打包所有修改
git commit -m "写了什么"          # 贴标签、做记录
git push                         # 推到云端
```

### 📥 下载最新代码（开始写之前做）

```bash
git pull
```

### 📋 查看状态

```bash
git status          # 看看改了哪些文件
git log --oneline   # 看看提交历史
```

---

## 六、Win 电脑首次设置（只做一次）

1. 确保电脑装了 Git（Win 上搜一下有没有 **Git Bash**）
2. 打开 VS Code → 按 `Ctrl + `` 打开终端
3. 依次运行：

```bash
git config --global user.name "M1kasa0ix03"
```
```bash
git config --global user.email "m1kasa0ix03@gmail.com"
```
```bash
cd ~/Desktop && git clone https://github.com/M1kasa0ix03/cpp-projects.git c++
```

---

## 七、两台电脑同步流程

```
🖥 Mac                               🪟 Win
─────                               ─────
开机                                 开机
git pull   ←── 拉最新代码 ──         git pull
写代码                                写代码
git add .                            git add .
git commit -m "..."                  git commit -m "..."
git push  ───→ ☁️ GitHub ☁️ ←───     git push
关机                                 关机
```

### ⚠️ 铁律

> **开机先 pull，关机前 push。** 
> 永远不要两台电脑同时改同一个文件。

---

## 八、常见问题

| 问题 | 解决 |
|------|------|
| `git push` 报错 "rejected" | 先 `git pull`，再 `git push` |
| 想要撤销还没 push 的修改 | `git checkout -- 文件名` |
| 忘了刚才改了什么 | `git status` 和 `git diff` |
| 想回到之前的版本 | `git log --oneline` 找到版本号，问我 |
| 提示输入密码 | 输入 Token（见项目中的 Token.txt） |

---

## 九、GitHub 网页能干什么

打开 **https://github.com/M1kasa0ix03/cpp-projects**，你可以：

- 📂 在线浏览所有代码文件
- 📜 查看每次修改的历史记录
- ⬇️ 下载整个项目的 zip 包
- 🔍 搜索文件内容

---

## 十、一个完整的例子

> 场景：你在 Win 上写了一个 `hello.cpp`

```
步骤1: 把 hello.cpp 放到 C:\Users\...\Desktop\c++ 文件夹
步骤2: 打开 VS Code → Ctrl + ` → cd ~/Desktop/c++
步骤3: git add .
步骤4: git commit -m "写了Hello World程序"
步骤5: git push
步骤6: 打开 https://github.com/M1kasa0ix03/cpp-projects 刷新 → 看到了！
步骤7: 到 Mac 上 → VS Code → git pull → hello.cpp 出现了！
```

---

> 🕐 最后更新：2026-06-05
> 
> 💡 有任何不懂的直接问我，别自己乱试！
