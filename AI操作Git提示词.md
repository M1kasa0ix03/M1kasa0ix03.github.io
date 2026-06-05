# 🤖 VS Code AI 操作 Git 的提示词

> 把下面的内容复制粘贴给 VS Code 里的 AI（Copilot），它就能帮你操作 Git。
> 每次只贴你需要的那一段。

---

## 📋 环境信息（每次对话先贴这段）

```
我的开发环境：
- 仓库名称：cpp-projects
- GitHub 用户名：M1kasa0ix03
- 仓库地址：https://github.com/M1kasa0ix03/cpp-projects.git
- Mac 本地路径：~/Desktop/c++
- Win 本地路径：~/Desktop/c++
- Token：你的Token（在GitHub → Settings → Developer settings → Personal access tokens → Tokens(classic) 查看）
- 仓库是私有的，Git 已经配好，直接操作即可。
```

---

## 🔧 常用操作指令

### 上传当前文件

```
帮我把当前打开的文件上传到 GitHub。先 add、再 commit、最后 push。
commit 信息用"上传xxx文件"。
```

### 拉取最新代码

```
帮我把远程仓库最新代码拉下来。执行 git pull。
```

### 查看仓库状态

```
帮我看看仓库当前状态，执行 git status 和 git log --oneline。
```

### 撤销修改

```
帮我撤销当前文件的所有修改。执行 git checkout -- 当前文件名。
```

### 上传整个文件夹的所有改动

```
帮我把 c++ 文件夹里所有改动上传到 GitHub。
执行 git add . 、git commit -m "日常更新"、git push。
```

### 回退到某个版本

```
帮我看看最近 10 条提交记录（git log --oneline -10），然后告诉我怎么回退。
```

---

## 🪟 Win 电脑首次克隆（只跑一次）

```
帮我在 ~/Desktop 下克隆私有仓库。
执行：
git clone https://你的Token@github.com/M1kasa0ix03/cpp-projects.git c++
```

---

## ⚡ 快捷版（一句话搞定）

```
我的仓库在 ~/Desktop/c++，远程是 https://github.com/M1kasa0ix03/cpp-projects.git。
帮我[上传 / 拉取 / 查看状态]，Token 是我的GitHub Token。
```

---

> 💡 提示：把 Token 那行 **加密保存**，不要发给别人。如果 Token 泄露了，去 GitHub Settings → Developer settings → Tokens 删除重建。
