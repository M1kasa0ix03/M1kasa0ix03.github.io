# Supabase 云数据库 — 部署与使用说明

> 📅 创建日期：2026-06-05  
> ☁️ 平台：Supabase（https://supabase.com）  
> 📦 项目：my-blog  
> 🌐 关联博客：https://m1kasa0ix03.github.io

---

## 一、什么是 Supabase？

Supabase 是一个**云数据库服务平台**，可以理解为一个"线上的 Excel 表格"，但它更强大：

- 免费使用（500MB 存储，日常博客足够）
- 数据永久保存在云端，不会因为清除浏览器缓存而丢失
- 任何设备登录博客都能看到同一份数据

### 通俗类比

| 概念 | 类比 |
|------|------|
| Supabase | 一个在线的保险柜 |
| 项目（Project） | 保险柜里的一个抽屉 |
| 表（Table） | 抽屉里的一个文件夹 |
| 行（Row） | 文件夹里的一张纸 |
| API Key | 打开抽屉的钥匙 |

---

## 二、做了什么？

### 2.1 注册 Supabase 账号

| 项目 | 详情 |
|------|------|
| 注册邮箱 | m1kasa0ix03@gmail.com |
| 注册时间 | 2026-06-05 |
| 计划 | Free（免费） |

### 2.2 创建项目

在 Supabase 中创建了一个名为 **my-blog** 的项目：

| 配置项 | 值 |
|------|-----|
| 项目名 | my-blog |
| 数据库密码 | Pefe7LMgEHLNJkmr |
| 服务器位置 | Asia-Pacific（亚洲） |

### 2.3 创建了 5 张数据表

就像 Excel 里建了 5 个工作表，每个表存不同类型的数据：

| 表名 | 作用 | 存什么 |
|------|------|------|
| `users` | 用户账号 | 用户名、密码、角色 |
| `visits` | 访客记录 | 谁登录了、登录时间、次数 |
| `guestbook` | 留言板 | 访客给作者的留言 |
| `comments` | 文章评论 | 每篇文章下方的评论 |
| `user_posts` | 用户文章 | 管理员发布的文章 |

### 2.4 配置了访问权限（RLS）

默认情况下数据库是锁着的，必须告诉它"谁可以读写"。

我们配置了公开权限，让博客可以自由读写数据库：

```sql
-- 允许任何人读取数据
CREATE POLICY "public_select" ON visits FOR SELECT USING (true);
-- 允许任何人写入数据
CREATE POLICY "public_insert" ON visits FOR INSERT WITH CHECK (true);
-- 允许任何人删除数据
CREATE POLICY "public_delete" ON visits FOR DELETE USING (true);
```

> ⚠️ 这是适合个人博客的简单配置。如果是商业项目，需要更严格的权限控制。

### 2.5 连接到博客

在博客的 `script.js` 中配置了两行关键代码：

```javascript
// 数据库地址
const SUPABASE_URL = 'https://evvmlhqfwjonkznjaibz.supabase.co';
// 访问密钥（相当于密码）
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

同时通过 CDN 加载了 Supabase 的 JS 库：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 三、数据是如何流转的？

### 3.1 写入流程（以"发表留言"为例）

```
用户在留言板输入文字
        ↓
  点击"发表留言"
        ↓
  ① 先存到浏览器本地（localStorage）—— 保证断网也能用
        ↓
  ② 同时异步发送到 Supabase 云端 —— 永久保存
        ↓
  ③ 渲染页面显示新留言
```

### 3.2 读取流程

```
用户打开博客
        ↓
  ① 从浏览器本地加载数据（秒开）
        ↓
  ② 后台自动从 Supabase 拉取最新数据
        ↓
  ③ 如果云端数据比本地多，自动合并
```

### 3.3 同步策略

| 场景 | 行为 |
|------|------|
| 正常使用 | 本地 + 云端双写 |
| 断网 | 只用本地，不影响操作 |
| 换设备登录 | 从云端拉取，数据同步过来 |
| 清除浏览器缓存 | 数据仍在云端，刷新后自动恢复 |

---

## 四、连接信息速查表

### API 密钥（保存在 `script.js` 中）

| 名称 | 值 |
|------|-----|
| Project URL | `https://evvmlhqfwjonkznjaibz.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dm1saHFmd2pvbmt6bmphaWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTE3ODksImV4cCI6MjA5NjIyNzc4OX0.c-W6ckwKpL_TO93k_6mcVsZNGFX7gok3uEI5rwLLm8w` |

### 管理后台

| 地址 | 用途 |
|------|------|
| https://supabase.com/dashboard | 登录后台 |
| 项目页面 | 左侧选 my-blog → Table Editor 查看数据 |
| SQL Editor | 左侧选 SQL Editor → 执行 SQL 语句 |

### 数据库密码

```
Pefe7LMgEHLNJkmr
```

> ⚠️ 这是数据库的管理密码，一般只在后台操作时需要，博客代码中用不到

---

## 五、数据表结构详解

### 5.1 users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | 数字 | 唯一编号（自动递增） |
| username | 文本 | 用户名（唯一） |
| password | 文本 | 密码（哈希存储） |
| role | 文本 | 角色：admin（管理员）或 user（普通用户） |
| created_at | 文本 | 注册日期 |

**示例数据：**

| id | username | password | role | created_at |
|----|----------|----------|------|------------|
| 1 | M1kasa | bh_f8d3a2... | admin | 2026-06-05 |
| 2 | TestUser | bh_c7e1b9... | user | 2026-06-05 |

### 5.2 visits（访客记录表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | 数字 | 唯一编号 |
| username | 文本 | 用户名 |
| user_id | 数字 | 用户编号 |
| first_login | 文本 | 首次登录时间 |
| last_login | 文本 | 最后登录时间 |
| count | 数字 | 累计登录次数 |

### 5.3 guestbook（留言板）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | 数字 | 唯一编号 |
| username | 文本 | 留言者用户名 |
| user_id | 数字 | 留言者编号 |
| body | 文本 | 留言内容 |
| time | 文本 | 留言时间 |

### 5.4 comments（文章评论）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | 数字 | 唯一编号 |
| post_id | 数字 | 对应文章的编号 |
| username | 文本 | 评论者用户名 |
| user_id | 数字 | 评论者编号 |
| body | 文本 | 评论内容 |
| time | 文本 | 评论时间 |

### 5.5 user_posts（用户文章）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | 数字 | 文章编号 |
| title | 文本 | 文章标题 |
| excerpt | 文本 | 文章摘要 |
| tags | 文本 | 标签（如"前端"） |
| date | 文本 | 发布日期 |
| readTime | 文本 | 阅读时间 |
| emoji | 文本 | 封面图标 |
| body | 文本 | 文章正文（HTML） |

---

## 六、如何在后台查看数据？

### 方法一：Table Editor（图形界面）

1. 打开 https://supabase.com/dashboard
2. 登录后选择 **my-blog** 项目
3. 左侧菜单点 **Table Editor**
4. 点击表名（如 `guestbook`）即可看到所有数据
5. 支持增、删、改、查，像 Excel 一样操作

### 方法二：SQL Editor（写代码）

1. 左侧菜单点 **SQL Editor**
2. 点 **New query**
3. 输入查询语句，例如：

```sql
-- 查看所有留言
SELECT * FROM guestbook ORDER BY time DESC;

-- 查看所有用户
SELECT * FROM users;

-- 查看某用户的登录记录
SELECT * FROM visits WHERE username = 'TestUser';

-- 删除某条留言
DELETE FROM guestbook WHERE id = 3;
```

4. 点 **Run** 执行

---

## 七、常见问题

### Q：数据会丢吗？

不会。数据存在 Supabase 服务器上，不会因为清理浏览器缓存而丢失。

### Q：免费够用吗？

完全够。免费计划包含：
- 500MB 数据库空间（纯文本博客能用很多年）
- 每月 5GB 数据传输
- 50,000 月活用户
- 2 个项目

### Q：怎么重置所有数据？

在 SQL Editor 中执行：

```sql
DELETE FROM users;      -- 清空用户（注意：会删掉管理员）
DELETE FROM visits;     -- 清空访客记录
DELETE FROM guestbook;  -- 清空留言板
DELETE FROM comments;   -- 清空评论
DELETE FROM user_posts; -- 清空文章
```

> ⚠️ 如果删了 users 表，刷新博客会自动重建默认管理员 M1kasa / admin123

### Q：怎么改管理员密码？

在博客上用管理员登录后……当前版本暂不支持在线修改密码。如需修改，在 SQL Editor 中执行：

```sql
UPDATE users SET password = '新密码的哈希值' WHERE username = 'M1kasa';
```

或者在浏览器 Console 中重新运行 `initDefaultAdmin()` 函数。

### Q：Superbase 需要续费吗？

不需要。免费计划没有时间限制，只要不超出用量就一直免费。

---

## 八、代码映射关系

| 博客功能 | 前端文件 | JS 函数 | 数据库表 |
|----------|----------|---------|----------|
| 注册/登录 | `script.js` | `handleRegister()` / `handleLogin()` | `users` |
| 发表留言 | `script.js` | `submitGuestbook()` | `guestbook` |
| 文章评论 | `script.js` | `submitComment()` | `comments` |
| 访客记录 | `script.js` | `recordVisit()` | `visits` |
| 写文章 | `script.js` | `publishPost()` | `user_posts` |
| 云同步(写) | `script.js` | `syncToCloud()` | 全部表 |
| 云同步(读) | `script.js` | `pullFromCloud()` | 全部表 |

---

## 九、费用总计

| 项目 | 费用 |
|------|------|
| GitHub Pages（托管博客） | 免费 |
| Supabase（云数据库） | 免费 |
| 域名 | 免费（使用 github.io 子域名） |
| **合计** | **$0 / 月** |

---

*文档生成于 2026-06-05 · 由 GitHub Copilot 协助整理*
