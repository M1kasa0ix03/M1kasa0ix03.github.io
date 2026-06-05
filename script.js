/* ============================================
   个人博客 - 交互脚本
   Author: M1kasa
   ============================================ */

// ===== 用户系统 =====
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'bh_' + Math.abs(hash).toString(36);
}

function loadUsers() {
    try {
        const data = localStorage.getItem('blog_users');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem('blog_users', JSON.stringify(users));
}

function initDefaultAdmin() {
    let users = loadUsers();
    // 如果没有管理员，创建默认管理员账号
    if (!users.some(u => u.role === 'admin')) {
        users.unshift({
            id: 1,
            username: 'M1kasa',
            password: simpleHash('admin123'),
            role: 'admin',
            createdAt: '2026-06-05'
        });
        saveUsers(users);
        console.log('✅ 默认管理员已创建: M1kasa / admin123');
    }
}

function getCurrentUser() {
    try {
        const data = localStorage.getItem('blog_current_user');
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('blog_current_user', JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role
        }));
    } else {
        localStorage.removeItem('blog_current_user');
    }
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// ===== 博客数据 =====
const blogPosts = [
    {
        id: 1,
        title: "从零搭建个人博客 — 完整指南",
        excerpt: "手把手教你如何从零开始搭建一个现代化的个人博客，包含域名注册、服务器配置、前端开发全流程。",
        tags: ["前端", "工具"],
        date: "2026-06-01",
        readTime: "8 分钟",
        emoji: "🚀",
        body: `
            <p>搭建个人博客是每个开发者的必经之路。它不仅是一个展示技术的窗口，更是记录成长、沉淀知识的最佳方式。</p>

            <h2>为什么要有自己的博客？</h2>
            <p>在这个信息爆炸的时代，拥有一个属于自己的独立博客变得越来越重要：</p>
            <ul>
                <li><strong>知识沉淀</strong>：写作是最好的学习方式。把学到的知识写下来，不仅加深理解，还能帮助他人。</li>
                <li><strong>个人品牌</strong>：博客是展示技术能力和思维方式的最佳简历。</li>
                <li><strong>技术积累</strong>：遇到的问题和解决方案记录下来，未来可以快速回顾。</li>
            </ul>

            <h2>技术选型</h2>
            <p>对于技术博客，推荐以下技术栈：</p>

            <h3>静态站点生成器</h3>
            <p>最流行的选择有 <code>Next.js</code>、<code>VitePress</code>、<code>Astro</code> 等。它们可以让你专注于写作，自动处理构建和部署。</p>

            <h3>部署方案</h3>
            <p>推荐使用 <code>Vercel</code> 或 <code>GitHub Pages</code> 进行部署，它们都提供免费的 HTTPS 和全球 CDN 加速。</p>

            <h2>总结</h2>
            <p>搭建博客并不复杂，关键在于坚持输出优质内容。希望这篇指南对你有所帮助！</p>
        `
    },
    {
        id: 2,
        title: "深入理解 JavaScript 异步编程",
        excerpt: "从回调函数到 Promise，再到 async/await，全面解析 JavaScript 异步编程的演进和最佳实践。",
        tags: ["前端"],
        date: "2026-05-28",
        readTime: "12 分钟",
        emoji: "⚡",
        body: `
            <p>JavaScript 的异步编程模型是前端开发中最重要的概念之一。理解它对于写出高效、可维护的代码至关重要。</p>

            <h2>为什么需要异步？</h2>
            <p>JavaScript 是单线程语言，如果所有操作都是同步的，那么任何耗时操作（如网络请求）都会阻塞整个页面，导致用户体验极差。</p>

            <h2>回调函数时代</h2>
            <p>最早的异步解决方案是回调函数（Callback）。但嵌套回调会引发著名的"回调地狱"问题：</p>
            <pre><code>getData(function(a) {
    getMoreData(a, function(b) {
        getMoreData(b, function(c) {
            console.log(c);
        });
    });
});</code></pre>

            <h2>Promise 的诞生</h2>
            <p><code>Promise</code> 提供了一种更优雅的异步处理方式，支持链式调用和统一的错误处理：</p>
            <pre><code>getData()
    .then(a => getMoreData(a))
    .then(b => getMoreData(b))
    .then(c => console.log(c))
    .catch(err => console.error(err));</code></pre>

            <h2>async/await 革命</h2>
            <p><code>async/await</code> 让异步代码看起来像同步代码，大大提升了可读性：</p>
            <pre><code>async function fetchAll() {
    try {
        const a = await getData();
        const b = await getMoreData(a);
        const c = await getMoreData(b);
        console.log(c);
    } catch (err) {
        console.error(err);
    }
}</code></pre>

            <h2>最佳实践</h2>
            <ul>
                <li>优先使用 <code>async/await</code> 而非 Promise 链</li>
                <li>使用 <code>Promise.all()</code> 并行执行独立请求</li>
                <li>始终做好错误处理</li>
            </ul>
        `
    },
    {
        id: 3,
        title: "C++ 高性能编程技巧",
        excerpt: "分享几个实用的 C++ 性能优化技巧，包括内存管理、算法选择和编译器优化，提升程序运行效率。",
        tags: ["后端", "算法"],
        date: "2026-05-20",
        readTime: "10 分钟",
        emoji: "💻",
        body: `
            <p>C++ 以其卓越的性能著称，但要充分发挥其潜力，需要掌握一些关键的性能优化技巧。</p>

            <h2>内存管理优化</h2>
            <p>内存访问模式对性能影响巨大。应尽量保证数据的连续访问，利用 CPU 缓存：</p>
            <ul>
                <li>使用 <code>std::vector</code> 而非 <code>std::list</code>（内存连续）</li>
                <li>使用对象池减少频繁分配</li>
                <li>利用 <code>reserve()</code> 预分配内存</li>
            </ul>

            <h2>移动语义</h2>
            <p>C++11 引入的移动语义可以避免不必要的拷贝，显著提升性能：</p>
            <pre><code>std::vector&lt;int&gt; createLargeVector() {
    std::vector&lt;int&gt; v(1000000);
    return v; // 移动而非拷贝（RVO/NRVO）
}</code></pre>

            <h2>编译器优化</h2>
            <p>善用编译器优化选项：</p>
            <ul>
                <li>使用 <code>-O2</code> 或 <code>-O3</code> 优化级别</li>
                <li>启用链接时优化 <code>-flto</code></li>
                <li>使用 <code>constexpr</code> 进行编译期计算</li>
            </ul>
        `
    },
    {
        id: 4,
        title: "Git 进阶：团队协作最佳实践",
        excerpt: "掌握 Git 高级用法：分支策略、代码审查流程、冲突解决技巧，让团队协作更高效。",
        tags: ["工具"],
        date: "2026-05-15",
        readTime: "7 分钟",
        emoji: "🔧",
        body: `
            <p>Git 是现代软件开发不可或缺的工具。掌握其高级用法能大大提升团队协作效率。</p>

            <h2>分支策略</h2>
            <p>推荐使用 <strong>Git Flow</strong> 或 <strong>Trunk-Based Development</strong>：</p>
            <ul>
                <li><code>main</code>：生产代码，始终保持可部署状态</li>
                <li><code>develop</code>：开发主线</li>
                <li><code>feature/*</code>：功能分支</li>
                <li><code>hotfix/*</code>：紧急修复分支</li>
            </ul>

            <h2>Commit 规范</h2>
            <p>使用 <strong>Conventional Commits</strong> 规范：</p>
            <pre><code>feat: 添加用户登录功能
fix: 修复导航栏样式错乱
docs: 更新 README 文档
refactor: 重构数据处理模块</code></pre>

            <h2>代码审查</h2>
            <p>Pull Request 是代码审查的核心环节，建议：</p>
            <ul>
                <li>每个 PR 保持小而专注</li>
                <li>添加清晰的描述和截图</li>
                <li>及时响应审查意见</li>
            </ul>
        `
    },
    {
        id: 5,
        title: "算法入门：排序算法图解",
        excerpt: "用通俗易懂的方式讲解冒泡排序、快速排序、归并排序等经典算法，附带图解和代码实现。",
        tags: ["算法"],
        date: "2026-05-08",
        readTime: "15 分钟",
        emoji: "📊",
        body: `
            <p>排序算法是计算机科学中最基础的算法之一，理解它们对培养算法思维非常有帮助。</p>

            <h2>冒泡排序</h2>
            <p>最简单的排序算法，重复遍历待排序序列，依次比较相邻元素。</p>
            <p><strong>时间复杂度</strong>：O(n²) | <strong>空间复杂度</strong>：O(1)</p>

            <h2>快速排序</h2>
            <p>分治法的经典应用。选取一个基准值，将数组分为小于和大于基准值两部分，递归排序。</p>
            <pre><code>void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}</code></pre>
            <p><strong>时间复杂度</strong>：O(n log n)（平均）</p>

            <h2>归并排序</h2>
            <p>同样是分治法，先递归地将数组分成两半，排序后合并。</p>
            <p><strong>时间复杂度</strong>：O(n log n) | <strong>空间复杂度</strong>：O(n)</p>
            <p>归并排序是稳定排序，适合链表等数据结构。</p>
        `
    },
    {
        id: 6,
        title: "写给开发者的写作指南",
        excerpt: "技术写作并不难！分享如何写出清晰易懂的技术文章，让你的博客更有影响力。",
        tags: ["随笔"],
        date: "2026-04-30",
        readTime: "6 分钟",
        emoji: "✍️",
        body: `
            <p>作为开发者，写作能力往往被低估。实际上，优秀的写作能力能让你在职场中脱颖而出。</p>

            <h2>为什么要写作？</h2>
            <ul>
                <li><strong>深化理解</strong>：教是最好的学</li>
                <li><strong>建立影响力</strong>：分享知识，帮助他人</li>
                <li><strong>提升沟通能力</strong>：学会清晰表达复杂概念</li>
            </ul>

            <h2>写好技术文章的技巧</h2>

            <h3>1. 明确目标读者</h3>
            <p>是写给新手还是经验丰富的开发者？不同的读者需要不同的深度和语言风格。</p>

            <h3>2. 结构清晰</h3>
            <p>使用标题、列表、代码块等元素组织内容。好的结构让文章一目了然。</p>

            <h3>3. 用实例说话</h3>
            <p>抽象的概念配上一个简单示例，效果远胜长篇大论。</p>

            <h3>4. 反复修改</h3>
            <p>初稿不需要完美。写完放一天再读，会有新的发现。永远记得：写作就是重写。</p>
        `
    }
];

// ===== 加载用户文章 =====
function loadUserPosts() {
    try {
        const data = localStorage.getItem('blog_user_posts');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveUserPosts(posts) {
    localStorage.setItem('blog_user_posts', JSON.stringify(posts));
}

function getAllPosts() {
    return [...blogPosts, ...loadUserPosts()];
}

// ===== 状态管理 =====
let currentTag = 'all';
let visibleCount = 4;
const postsPerPage = 4;

// ===== DOM 元素 =====
const blogGrid = document.getElementById('blogGrid');
const searchInput = document.getElementById('searchInput');
const tagFilters = document.getElementById('tagFilters');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreDiv = document.getElementById('loadMore');
const postModal = document.getElementById('postModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const postDetail = document.getElementById('postDetail');
const commentsSection = document.getElementById('commentsSection');
const commentsList = document.getElementById('commentsList');
const commentBody = document.getElementById('commentBody');
const btnSubmitComment = document.getElementById('btnSubmitComment');
const commentHint = document.getElementById('commentHint');
const backToTop = document.getElementById('backToTop');
const themeToggle = document.getElementById('themeToggle');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navbar = document.getElementById('navbar');

// 编辑器 DOM
const editorModal = document.getElementById('editorModal');
const editorOverlay = document.getElementById('editorOverlay');
const editorClose = document.getElementById('editorClose');
const btnWriteArticle = document.getElementById('btnWriteArticle');
const editTitle = document.getElementById('editTitle');
const editExcerpt = document.getElementById('editExcerpt');
const editTag = document.getElementById('editTag');
const editEmoji = document.getElementById('editEmoji');
const editBody = document.getElementById('editBody');
const editorToolbar = document.getElementById('editorToolbar');
const btnPublish = document.getElementById('btnPublish');
const editorHint = document.getElementById('editorHint');

let currentPostId = null; // 当前打开的文章 ID

// 认证 DOM
const authButtons = document.getElementById('authButtons');
const userDropdown = document.getElementById('userDropdown');
const userAvatarBtn = document.getElementById('userAvatarBtn');
const userNavName = document.getElementById('userNavName');
const userMenu = document.getElementById('userMenu');
const btnLogout = document.getElementById('btnLogout');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');
const authModal = document.getElementById('authModal');
const authOverlay = document.getElementById('authOverlay');
const authClose = document.getElementById('authClose');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginHint = document.getElementById('loginHint');
const btnLoginSubmit = document.getElementById('btnLoginSubmit');
const regUsername = document.getElementById('regUsername');
const regPassword = document.getElementById('regPassword');
const regPasswordConfirm = document.getElementById('regPasswordConfirm');
const registerHint = document.getElementById('registerHint');
const btnRegisterSubmit = document.getElementById('btnRegisterSubmit');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const commentFormWrapper = document.getElementById('commentFormWrapper');
const commentLoginNag = document.getElementById('commentLoginNag');
const commentLoginLink = document.getElementById('commentLoginLink');

// ===== 渲染文章卡片 =====
function renderPosts(posts) {
    blogGrid.innerHTML = '';
    const userPosts = loadUserPosts();
    if (posts.length === 0) {
        blogGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
                <p style="font-size: 3rem; margin-bottom: 12px;">🔍</p>
                <p style="font-size: 1.1rem;">没有找到相关文章，试试其他关键词吧</p>
            </div>`;
        return;
    }
    posts.forEach((post, index) => {
        const comments = loadComments(post.id);
        const card = document.createElement('div');
        card.className = 'blog-card fade-in';
        card.style.transitionDelay = `${index * 0.08}s`;
        const isUserPost = userPosts.some(p => p.id === post.id);
        card.innerHTML = `
            <div class="card-image">
                <span class="card-emoji">${post.emoji}</span>
            </div>
            <div class="card-body">
                <div class="card-tags">
                    ${post.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
                </div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-excerpt">${post.excerpt}</p>
                <div class="card-footer">
                    <span><i class="far fa-calendar"></i> ${post.date}</span>
                    <span><i class="far fa-clock"></i> ${post.readTime}</span>
                    <span><i class="far fa-comment"></i> ${comments.length}</span>
                </div>
            </div>
            ${isUserPost ? `<button class="card-delete-btn" title="删除文章"><i class="fas fa-trash"></i></button>` : ''}`;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-delete-btn')) return;
            openPost(post);
        });
        if (isUserPost) {
            card.querySelector('.card-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePost(post.id);
            });
        }
        blogGrid.appendChild(card);
    });

    // 触发淡入动画
    requestAnimationFrame(() => {
        document.querySelectorAll('.blog-card.fade-in').forEach(el => el.classList.add('visible'));
    });
}

// ===== 筛选文章 =====
function filterPosts() {
    const query = searchInput.value.toLowerCase().trim();
    const allPosts = getAllPosts();
    let filtered = allPosts;

    if (currentTag !== 'all') {
        filtered = filtered.filter(p => p.tags.includes(currentTag));
    }

    if (query) {
        filtered = filtered.filter(p =>
            p.title.toLowerCase().includes(query) ||
            p.excerpt.toLowerCase().includes(query) ||
            p.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    visibleCount = postsPerPage;
    const visible = filtered.slice(0, visibleCount);
    renderPosts(visible);

    if (filtered.length > visibleCount) {
        loadMoreDiv.style.display = 'block';
    } else {
        loadMoreDiv.style.display = 'none';
    }

    loadMoreDiv.dataset.filtered = JSON.stringify(filtered.map(p => p.id));
    return filtered;
}

// ===== 加载更多 =====
loadMoreBtn.addEventListener('click', () => {
    const filteredIds = JSON.parse(loadMoreDiv.dataset.filtered || '[]');
    const allPosts = getAllPosts();
    const filtered = allPosts.filter(p => filteredIds.includes(p.id));
    visibleCount += postsPerPage;
    const visible = filtered.slice(0, visibleCount);
    renderPosts(visible);

    if (filtered.length <= visibleCount) {
        loadMoreDiv.style.display = 'none';
    }
});

// ===== 搜索 =====
searchInput.addEventListener('input', filterPosts);

// ===== 标签筛选 =====
tagFilters.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-btn')) {
        document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentTag = e.target.dataset.tag;
        filterPosts();
    }
});

// ===== 文章弹窗 =====
function openPost(post) {
    currentPostId = post.id;
    postDetail.innerHTML = `
        <h1>${post.title}</h1>
        <div class="post-meta">
            <span><i class="far fa-calendar"></i> ${post.date}</span>
            <span><i class="far fa-clock"></i> ${post.readTime}</span>
            <span>${post.tags.map(t => `<span style="color:var(--accent);">#${t}</span>`).join(' ')}</span>
        </div>
        <div class="post-body">${post.body}</div>`;
    renderComments(post.id);
    updateCommentFormUI();
    // 清空评论表单
    commentBody.value = '';
    commentHint.textContent = '';
    postModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // 滚动到顶部
    postModal.querySelector('.modal-content').scrollTop = 0;
}

function closePost() {
    postModal.classList.remove('active');
    document.body.style.overflow = '';
    currentPostId = null;
}

modalClose.addEventListener('click', closePost);
modalOverlay.addEventListener('click', closePost);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (editorModal.classList.contains('active')) {
            closeEditor();
        } else if (postModal.classList.contains('active')) {
            closePost();
        }
    }
});

// ===== 评论区 =====
function loadComments(postId) {
    try {
        const data = localStorage.getItem('blog_comments_' + postId);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveComments(postId, comments) {
    localStorage.setItem('blog_comments_' + postId, JSON.stringify(comments));
}

function renderComments(postId) {
    const comments = loadComments(postId);
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="comments-empty">💭 还没有评论，来抢沙发吧~</p>';
    } else {
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-item-header">
                    <span class="comment-item-name">${escapeHtml(c.name)}</span>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="comment-item-time">${c.time}</span>
                        ${(isAdmin() || (getCurrentUser() && getCurrentUser().id === c.userId)) ? `<button class="comment-item-delete" data-comment-id="${c.id}" title="删除">🗑</button>` : ''}
                    </div>
                </div>
                <p class="comment-item-body">${escapeHtml(c.body)}</p>
            </div>
        `).join('');

        // 删除评论事件
        commentsList.querySelectorAll('.comment-item-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定要删除这条评论吗？')) {
                    deleteComment(postId, parseInt(btn.dataset.commentId));
                }
            });
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function submitComment() {
    const user = getCurrentUser();
    if (!user) {
        commentHint.textContent = '⚠️ 请先登录后再评论';
        return;
    }

    const body = commentBody.value.trim();

    if (!body) { commentHint.textContent = '请输入评论内容'; return; }
    if (!currentPostId) return;

    const comments = loadComments(currentPostId);
    const newId = comments.length > 0 ? Math.max(...comments.map(c => c.id)) + 1 : 1;
    const now = new Date();
    const timeStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

    comments.push({ id: newId, name: user.username, userId: user.id, body, time: timeStr });
    saveComments(currentPostId, comments);
    renderComments(currentPostId);
    commentBody.value = '';
    commentHint.textContent = '✅ 评论发表成功！';
    setTimeout(() => { commentHint.textContent = ''; }, 2000);

    // 刷新文章卡片上的评论数
    filterPosts();
}

function deleteComment(postId, commentId) {
    let comments = loadComments(postId);
    comments = comments.filter(c => c.id !== commentId);
    saveComments(postId, comments);
    renderComments(postId);
    filterPosts();
}

btnSubmitComment.addEventListener('click', submitComment);
// Enter 提交评论（Ctrl+Enter）
commentBody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        submitComment();
    }
});

// ===== 写文章编辑器 =====
function openEditor() {
    if (!isAdmin()) {
        alert('⚠️ 只有管理员才能发布文章。\n\n当前登录账号无此权限。');
        return;
    }
    editorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    editTitle.value = '';
    editExcerpt.value = '';
    editTag.value = '前端';
    editEmoji.value = '🚀';
    editBody.value = '';
    editorHint.textContent = '';
    editTitle.focus();
}

function closeEditor() {
    editorModal.classList.remove('active');
    document.body.style.overflow = '';
}

function publishPost() {
    const title = editTitle.value.trim();
    const excerpt = editExcerpt.value.trim();
    const tag = editTag.value;
    const emoji = editEmoji.value;
    const body = editBody.value.trim();

    if (!title) { editorHint.textContent = '⚠️ 请输入文章标题'; return; }
    if (!excerpt) { editorHint.textContent = '⚠️ 请输入文章摘要'; return; }
    if (!body) { editorHint.textContent = '⚠️ 请输入文章内容'; return; }

    const userPosts = loadUserPosts();
    const newId = Date.now();
    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    const wordCount = body.replace(/<[^>]*>/g, '').length;
    const readTime = Math.max(1, Math.ceil(wordCount / 400)) + ' 分钟';

    const newPost = {
        id: newId,
        title,
        excerpt,
        tags: [tag],
        date: dateStr,
        readTime,
        emoji,
        body: `<p>${body.replace(/\n/g, '</p><p>')}</p>`
    };

    userPosts.unshift(newPost);
    saveUserPosts(userPosts);

    editorHint.textContent = '✅ 文章发布成功！';
    setTimeout(() => {
        closeEditor();
        currentTag = 'all';
        searchInput.value = '';
        document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.tag-btn[data-tag="all"]').classList.add('active');
        filterPosts();
        document.getElementById('blog').scrollIntoView({ behavior: 'smooth' });
    }, 800);
}

function deletePost(postId) {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    let userPosts = loadUserPosts();
    userPosts = userPosts.filter(p => p.id !== postId);
    saveUserPosts(userPosts);
    // 也删除相关评论
    localStorage.removeItem('blog_comments_' + postId);
    filterPosts();
}

// 编辑器工具栏
editorToolbar.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const tag = e.target.dataset.tag;
        const textarea = editBody;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.substring(start, end) || '内容';
        let insert = '';

        switch (tag) {
            case 'h2': insert = `<h2>${selected}</h2>`; break;
            case 'h3': insert = `<h3>${selected}</h3>`; break;
            case 'p': insert = `<p>${selected}</p>`; break;
            case 'strong': insert = `<strong>${selected}</strong>`; break;
            case 'code': insert = `<code>${selected}</code>`; break;
            case 'pre': insert = `<pre><code>${selected}</code></pre>`; break;
            case 'ul': insert = `<ul>\n  <li>${selected}</li>\n  <li>项目2</li>\n</ul>`; break;
            case 'ol': insert = `<ol>\n  <li>${selected}</li>\n  <li>项目2</li>\n</ol>`; break;
        }

        textarea.value = textarea.value.substring(0, start) + insert + textarea.value.substring(end);
        textarea.focus();
        textarea.setSelectionRange(start + insert.length, start + insert.length);
    }
});

btnWriteArticle.addEventListener('click', openEditor);
btnPublish.addEventListener('click', publishPost);
editorClose.addEventListener('click', closeEditor);
editorOverlay.addEventListener('click', closeEditor);

// ===== 用户界面更新 =====
function updateAuthUI() {
    const user = getCurrentUser();
    if (user) {
        authButtons.style.display = 'none';
        userDropdown.style.display = 'block';
        userNavName.textContent = user.username;
        document.getElementById('menuUserName').textContent = user.username;
        document.getElementById('menuUserRole').textContent = user.role === 'admin' ? '管理员' : '普通用户';
        document.getElementById('menuUserRole').className = 'user-role-badge ' + (user.role === 'admin' ? 'admin' : 'user');
        // 更新写文章按钮可见性
        if (btnWriteArticle) {
            btnWriteArticle.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
        }
    } else {
        authButtons.style.display = 'flex';
        userDropdown.style.display = 'none';
        if (btnWriteArticle) {
            btnWriteArticle.style.display = 'none';
        }
    }
}

function updateCommentFormUI() {
    if (isLoggedIn()) {
        commentFormWrapper.style.display = 'flex';
        commentLoginNag.style.display = 'none';
        const user = getCurrentUser();
        if (commentBody) {
            commentBody.placeholder = `以 ${user.username} 的身份评论...（Ctrl+Enter 发表）`;
        }
    } else {
        commentFormWrapper.style.display = 'none';
        commentLoginNag.style.display = 'block';
    }
}

// ===== 登录/注册弹窗 =====
function openAuthModal(mode) {
    authModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (mode === 'register') {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        regUsername.value = '';
        regPassword.value = '';
        regPasswordConfirm.value = '';
        registerHint.textContent = '';
    } else {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        loginUsername.value = '';
        loginPassword.value = '';
        loginHint.textContent = '';
        loginHint.className = 'auth-hint';
    }
    setTimeout(() => {
        const input = mode === 'register' ? regUsername : loginUsername;
        if (input) input.focus();
    }, 300);
}

function closeAuthModal() {
    authModal.classList.remove('active');
    document.body.style.overflow = '';
}

function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username) { loginHint.textContent = '请输入用户名'; loginHint.className = 'auth-hint error'; return; }
    if (!password) { loginHint.textContent = '请输入密码'; loginHint.className = 'auth-hint error'; return; }

    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === simpleHash(password));

    if (user) {
        setCurrentUser(user);
        loginHint.textContent = '✅ 登录成功！';
        loginHint.className = 'auth-hint success';
        setTimeout(() => {
            closeAuthModal();
            updateAuthUI();
            updateCommentFormUI();
            filterPosts();
        }, 600);
    } else {
        loginHint.textContent = '❌ 用户名或密码错误';
        loginHint.className = 'auth-hint error';
    }
}

function handleRegister() {
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();
    const passwordConfirm = regPasswordConfirm.value.trim();

    if (!username || username.length < 3) { registerHint.textContent = '用户名至少需要3个字符'; registerHint.className = 'auth-hint error'; return; }
    if (!password || password.length < 6) { registerHint.textContent = '密码至少需要6个字符'; registerHint.className = 'auth-hint error'; return; }
    if (password !== passwordConfirm) { registerHint.textContent = '两次密码不一致'; registerHint.className = 'auth-hint error'; return; }

    const users = loadUsers();
    if (users.some(u => u.username === username)) {
        registerHint.textContent = '该用户名已被注册';
        registerHint.className = 'auth-hint error';
        return;
    }

    const newUser = {
        id: Date.now(),
        username,
        password: simpleHash(password),
        role: 'user',
        createdAt: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);
    saveUsers(users);

    registerHint.textContent = '✅ 注册成功！正在自动登录...';
    registerHint.className = 'auth-hint success';

    setTimeout(() => {
        setCurrentUser(newUser);
        closeAuthModal();
        updateAuthUI();
        updateCommentFormUI();
        filterPosts();
    }, 800);
}

function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        setCurrentUser(null);
        userMenu.parentElement.classList.remove('open');
        updateAuthUI();
        updateCommentFormUI();
        filterPosts();
        // 如果当前在文章弹窗，也更新评论表单
        if (currentPostId) {
            renderComments(currentPostId);
        }
    }
}

// 用户下拉菜单
userAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('open');
});

document.addEventListener('click', () => {
    userDropdown.classList.remove('open');
});

userDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});

btnLogout.addEventListener('click', handleLogout);

// 登录/注册按钮
btnLogin.addEventListener('click', () => openAuthModal('login'));
btnRegister.addEventListener('click', () => openAuthModal('register'));
btnLoginSubmit.addEventListener('click', handleLogin);
btnRegisterSubmit.addEventListener('click', handleRegister);

// 回车提交
loginPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
loginUsername.addEventListener('keydown', (e) => { if (e.key === 'Enter') loginPassword.focus(); });
regPasswordConfirm.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

// 切换登录/注册
switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    loginHint.textContent = '';
    registerHint.textContent = '';
    regUsername.focus();
});

switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    loginHint.textContent = '';
    registerHint.textContent = '';
    loginUsername.focus();
});

// 弹窗关闭
authClose.addEventListener('click', closeAuthModal);
authOverlay.addEventListener('click', closeAuthModal);

// 评论区登录链接
commentLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal('login');
});

// ===== 回到顶部 =====
window.addEventListener('scroll', () => {
    if (window.scrollY > 600) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }

    // 导航栏阴影
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // 滚动渐入动画
    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 60) {
            el.classList.add('visible');
        }
    });
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== 主题切换 =====
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
});

function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ===== 移动端菜单 =====
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// 点击导航链接关闭菜单
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// ===== 导航高亮 =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===== 数字递增动画 =====
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    statNumbers.forEach(el => {
        const target = parseInt(el.dataset.count);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * ease);
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + '+';
            }
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(update);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        observer.observe(el);
    });
}

// ===== 初始化 =====
function init() {
    initDefaultAdmin();
    updateAuthUI();
    filterPosts();
    animateStats();

    console.log('🔐 默认管理员: M1kasa / admin123');
    console.log('👤 登录后即可评论 | 管理员可发布文章');

    // 初始滚动渐入
    setTimeout(() => {
        document.querySelectorAll('.fade-in').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('visible');
            }
        });
    }, 200);
}

init();
