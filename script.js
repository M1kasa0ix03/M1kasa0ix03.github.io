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
    // 在此处添加你的文章数据
    // {
    //     id: 1,
    //     title: "文章标题",
    //     excerpt: "文章摘要",
    //     tags: ["前端"],
    //     date: "2026-06-05",
    //     readTime: "5 分钟",
    //     emoji: "🚀",
    //     body: `<p>文章内容（支持 HTML）</p>`
    // }
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
