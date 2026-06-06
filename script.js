/* ============================================
   个人博客 - 交互脚本（Supabase 云存储版）
   Author: M1kasa
   ============================================ */

// ===== Supabase 配置 =====
const SUPABASE_URL = 'https://evvmlhqfwjonkznjaibz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dm1saHFmd2pvbmt6bmphaWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTE3ODksImV4cCI6MjA5NjIyNzc4OX0.c-W6ckwKpL_TO93k_6mcVsZNGFX7gok3uEI5rwLLm8w';

let dbClient = null;
let dbReady = false;
let _supabaseRetries = 0;

// 离线状态横幅
function showOfflineBanner(msg) {
    let bar = document.getElementById('offlineBar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'offlineBar';
        bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:10px 16px;text-align:center;font-size:14px;font-weight:600;background:#fbbf24;color:#1a1a2e;transition:transform 0.3s;transform:translateY(-100%);';
        document.body.prepend(bar);
    }
    bar.textContent = msg;
    bar.style.transform = 'translateY(0)';
    // 导航栏往下移，不被横幅遮挡
    const nb = document.getElementById('navbar');
    if (nb) nb.style.top = '40px';
}
function hideOfflineBanner() {
    const bar = document.getElementById('offlineBar');
    if (bar) {
        bar.style.background = '#10b981';
        bar.style.color = '#fff';
        bar.textContent = '✅ 云数据库已连接';
        const nb = document.getElementById('navbar');
        if (nb) nb.style.top = '0';
        setTimeout(() => { if (bar) bar.style.transform = 'translateY(-100%)'; }, 1500);
    }
}

// 启动时显示离线横幅
showOfflineBanner('🔄 正在连接云数据库...');

(function connectSupabase() {
    if (typeof window.supabase !== 'undefined') {
        try {
            dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            dbReady = true;
            console.log('☁️ Supabase 云数据库已连接');
            hideOfflineBanner();
            pullFromCloud();
        } catch (e) {
            showOfflineBanner('⚠️ 云数据库连接失败，仅使用本地存储');
        }
    } else if (_supabaseRetries < 20) {
        _supabaseRetries++;
        if (_supabaseRetries === 10) showOfflineBanner('⏳ 加载较慢，请耐心等待...');
        setTimeout(connectSupabase, 500);
    } else {
        showOfflineBanner('❌ 云数据库加载超时，仅使用本地存储（刷新页面重试）');
    }
})();

// ===== 通用存储层 =====
// 云端操作：增删改查
async function cloudInsert(table, row) {
    if (!dbReady || !dbClient) return;
    try { const { error } = await dbClient.from(table).insert(row); if (error) console.warn('☁️ insert err', table, error.message); } catch(e) {}
}
async function cloudDelete(table, id) {
    if (!dbReady || !dbClient) return;
    try { await dbClient.from(table).delete().eq('id', id); } catch(e) {}
}
async function cloudSelectAll(table) {
    if (!dbReady || !dbClient) return null;
    try { const { data, error } = await dbClient.from(table).select('*'); if (error) throw error; return data; } catch(e) { return null; }
}

// 本地缓存读写
function cacheGet(key) { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : []; } catch(e) { return []; } }
function cacheSet(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// 云端写入：只 upsert 到云端，不覆盖本地缓存（本地缓存由 pullFromCloud 统一管理）
function saveAndSync(key, table, data) {
    if (dbReady && dbClient) {
        // 逐条 upsert：如果 id 已存在则更新，否则插入
        data.forEach(r => {
            dbClient.from(table).upsert(r).then(({ error }) => {
                if (error) console.warn('☁️ upsert err', table, error.message);
            }).catch(() => {});
        });
    }
}

// 云端优先加载：返回本地数据，同时从云端刷新
function loadAndSync(key, table, callback) {
    const local = cacheGet(key);
    // 后台从云端拉取
    if (dbReady && dbClient) {
        cloudSelectAll(table).then(cloud => {
            if (cloud && cloud.length > 0) {
                cacheSet(key, cloud);
                if (callback) callback(cloud);
            }
        }).catch(() => {});
    }
    return local;
}

// ===== 用户系统（云端 + 本地同步） =====
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'bh_' + Math.abs(hash).toString(36);
}

function loadUsers() { return cacheGet('blog_users'); }
function saveUsers(users) { saveAndSync('blog_users', 'users', users); }

function initDefaultAdmin() {
    let users = loadUsers();
    if (!users.some(u => u.role === 'admin')) {
        const admin = { id: 1, username: 'M1kasa', password: simpleHash('admin123'), role: 'admin', created_at: '2026-06-05' };
        users.unshift(admin);
        cacheSet('blog_users', users);
        // 通过 RPC 注册管理员（数据库内部操作）
        if (dbReady && dbClient) {
            dbClient.rpc('register_user', { p_username: 'M1kasa', p_password: simpleHash('admin123') }).then(({ error }) => {
                if (error) console.warn('☁️ 管理员同步失败:', error.message);
                else console.log('✅ 管理员已同步到云端');
            }).catch(() => {});
        }
        console.log('✅ 默认管理员已创建: M1kasa / admin123');
    }
}

// ===== 访客记录 =====
function getTimeStr() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' +
        String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
}

// 计算相对时间（如：3小时前、2天前）
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const past = new Date(dateStr);
    const now = new Date();
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '刚刚';
    if (diffMin < 60) return diffMin + ' 分钟前';
    if (diffHr < 24) return diffHr + ' 小时前';
    if (diffDay < 30) return diffDay + ' 天前';
    if (diffDay < 365) return Math.floor(diffDay / 30) + ' 个月前';
    return Math.floor(diffDay / 365) + ' 年前';
}

function loadVisits() { return cacheGet('blog_visits'); }
function saveVisits(visits) { saveAndSync('blog_visits', 'visits', visits); }

// 生成安全的整数 ID（PostgreSQL INTEGER 范围：1 ~ 2147483647）
function genSafeId() {
    return Math.floor(Math.random() * 2000000000) + 1;
}
async function pullFromCloud() {
    if (!dbReady) {
        showSyncToast('⚠️ 云数据库未连接，仅使用本地存储', 'error');
        return;
    }
    showSyncToast('☁️ 正在同步云端数据...', 'loading');
    try {
        const tables = ['visits', 'guestbook', 'user_posts'];
        for (const t of tables) {
            const cloud = await cloudSelectAll(t);
            if (cloud && cloud.length > 0) {
                const key = t === 'user_posts' ? 'blog_user_posts' : 'blog_' + t;
                if (t === 'user_posts') {
                    // user_posts 特殊处理：补齐 readTime/emoji，修复 tags 格式
                    const fixed = cloud.map(cp => {
                        // tags 可能是 JSON 字符串（DB存为text），也可能是数组
                        let tags = cp.tags;
                        if (typeof tags === 'string') {
                            try { tags = JSON.parse(tags); } catch (_) { tags = [tags]; }
                        }
                        if (!Array.isArray(tags)) tags = [];
                        return {
                            ...cp,
                            tags: tags,
                            readTime: cp.readtime || '1 分钟',
                            emoji: cp.emoji || '📝',
                            cover_image: cp.cover_image || null
                        };
                    });
                    cacheSet(key, fixed);
                } else {
                    cacheSet(key, cloud);
                }
                console.log('☁️ ' + t + ': ' + cloud.length + ' 条');
            } else {
                console.log('☁️ ' + t + ': 云端无数据（可能 RLS 拦截或确实为空）');
            }
        }
        // 评论特殊处理：按 post_id 分发到各篇文章的本地缓存
        const cloudComments = await cloudSelectAll('comments');
        if (cloudComments && cloudComments.length > 0) {
            cacheSet('blog_comments_all', cloudComments);
            const byPost = {};
            cloudComments.forEach(c => {
                const k = 'blog_comments_' + c.post_id;
                if (!byPost[k]) byPost[k] = [];
                byPost[k].push(c);
            });
            Object.entries(byPost).forEach(([k, v]) => cacheSet(k, v));
            console.log('☁️ comments: ' + cloudComments.length + ' 条');
        } else {
            console.log('☁️ comments: 云端无数据');
        }
        renderGuestbook();
        renderVisitorsPanel();
        filterPosts();
        showSyncToast('✅ 云端同步完成', 'success');
        console.log('☁️ 云端数据已同步');
    } catch (e) {
        showSyncToast('❌ 同步失败: ' + e.message, 'error');
        console.log('☁️ 同步跳过:', e.message);
    }
}

// 页面顶部同步状态提示
function showSyncToast(msg, type) {
    let toast = document.getElementById('syncToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'syncToast';
        toast.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:500;transition:opacity 0.3s;pointer-events:none;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    if (type === 'success') {
        toast.style.background = '#10b981'; toast.style.color = '#fff';
        setTimeout(() => { toast.style.opacity = '0'; }, 2000);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 2500);
    } else if (type === 'error') {
        toast.style.background = '#ef4444'; toast.style.color = '#fff';
        setTimeout(() => { toast.style.opacity = '0'; }, 4000);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4500);
    } else {
        toast.style.background = '#6366f1'; toast.style.color = '#fff';
    }
    toast.style.opacity = '1';
}

function recordVisit(user) {
    const visits = loadVisits();
    const existing = visits.find(v => v.username === user.username);
    if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.last_login = getTimeStr();
    } else {
        visits.push({
            username: user.username,
            user_id: user.id,
            first_login: getTimeStr(),
            last_login: getTimeStr(),
            count: 1
        });
    }
    // 仅本地存储（visits 表已启用 RLS，保护访客隐私）
    cacheSet('blog_visits', visits);
    renderVisitorsPanel();
}

function renderVisitorsPanel() {
    const panel = document.getElementById('visitorsPanel');
    const tbody = document.getElementById('visitorsTableBody');
    if (!panel || !tbody) return;

    if (!isAdmin()) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    const visits = loadVisits();
    if (visits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="visitors-empty">还没有访客记录</td></tr>';
        return;
    }

    const sorted = [...visits].sort((a, b) => (b.last_login || '').localeCompare(a.last_login || ''));

    tbody.innerHTML = sorted.map(v => `
        <tr>
            <td>
                <div class="visitor-name">
                    <span class="visitor-avatar-sm">${escapeHtml(v.username).charAt(0).toUpperCase()}</span>
                    ${escapeHtml(v.username)}
                </div>
            </td>
            <td>${v.last_login || v.lastLogin}</td>
            <td><span class="visit-count">${v.count}</span></td>
        </tr>
    `).join('');
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
    return cacheGet('blog_user_posts');
}

function saveUserPosts(posts) {
    saveAndSync('blog_user_posts', 'user_posts', posts);
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
// 封面图片
const editCover = document.getElementById('editCover');
const btnPickCover = document.getElementById('btnPickCover');
const btnClearCover = document.getElementById('btnClearCover');
const coverPreview = document.getElementById('coverPreview');
const coverPreviewImg = document.getElementById('coverPreviewImg');
let coverImageData = null; // Base64 data URL

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

// 留言板 DOM
const guestbookMessages = document.getElementById('guestbookMessages');
const guestbookBody = document.getElementById('guestbookBody');
const btnGuestbookSubmit = document.getElementById('btnGuestbookSubmit');
const guestbookHint = document.getElementById('guestbookHint');
const guestbookFormWrapper = document.getElementById('guestbookFormWrapper');
const guestbookLoginNag = document.getElementById('guestbookLoginNag');
const guestbookLoginLink = document.getElementById('guestbookLoginLink');

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
                ${post.cover_image ? `<img src="${escapeHtml(post.cover_image)}" class="card-cover-img" alt="${escapeHtml(post.title)}">` : `<span class="card-emoji">${post.emoji}</span>`}
            </div>
            <div class="card-body">
                <div class="card-tags">
                    ${post.tags.map(t => `<span class="card-tag">${t}</span>`).join('')}
                </div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-excerpt">${post.excerpt}</p>
                <div class="card-footer">
                    <span><i class="far fa-clock"></i> ${timeAgo(post.date)}</span>
                    <span><i class="far fa-calendar"></i> ${post.date}</span>
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
            <span><i class="far fa-clock"></i> ${timeAgo(post.date)}</span>
            <span><i class="far fa-calendar"></i> ${post.date}</span>
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
    const key = 'blog_comments_' + postId;
    return cacheGet(key);
}

function saveComments(postId, comments) {
    saveAndSync('blog_comments_' + postId, 'comments', comments);
}

function renderComments(postId) {
    const comments = loadComments(postId);
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="comments-empty">💭 还没有评论，来抢沙发吧~</p>';
    } else {
        commentsList.innerHTML = comments.map(c => `
            <div class="comment-item">
                <div class="comment-item-header">
                    <span class="comment-item-name">${escapeHtml(c.username)}</span>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="comment-item-time">${c.time}</span>
                        ${(isAdmin() || (getCurrentUser() && getCurrentUser().id === c.user_id)) ? `<button class="comment-item-delete" data-comment-id="${c.id}" title="删除">🗑</button>` : ''}
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

async function submitComment() {
    const user = getCurrentUser();
    if (!user) {
        commentHint.textContent = '⚠️ 请先登录后再评论';
        return;
    }

    const body = commentBody.value.trim();

    if (!body) { commentHint.textContent = '请输入评论内容'; return; }
    if (!currentPostId) return;

    const now = new Date();
    const timeStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

    const newComment = { id: genSafeId(), username: user.username, user_id: user.id, post_id: currentPostId, body, time: timeStr };

    // 先添加到本地缓存，立即显示
    const key = 'blog_comments_' + currentPostId;
    const local = cacheGet(key);
    local.push(newComment);
    cacheSet(key, local);
    renderComments(currentPostId);
    commentBody.value = '';
    commentHint.textContent = '✅ 评论发表成功！';
    setTimeout(() => { commentHint.textContent = ''; }, 2000);

    // 刷新文章卡片上的评论数
    filterPosts();

    // 上传到云端，然后从云端拉取最新数据（包含其他用户的评论）
    if (dbReady && dbClient) {
        try {
            await dbClient.from('comments').upsert(newComment);
            const { data: cloud } = await dbClient.from('comments').select('*').eq('post_id', currentPostId);
            if (cloud && cloud.length > 0) {
                cacheSet(key, cloud);
                renderComments(currentPostId);
                filterPosts();
            }
        } catch (e) {
            console.warn('☁️ 评论同步失败:', e.message);
        }
    }
}

function deleteComment(postId, commentId) {
    // 先从本地缓存移除，立即更新 UI
    const key = 'blog_comments_' + postId;
    let comments = cacheGet(key);
    comments = comments.filter(c => c.id !== commentId);
    cacheSet(key, comments);
    renderComments(postId);
    filterPosts();

    // 从云端删除
    if (dbReady && dbClient) {
        dbClient.from('comments').delete().eq('id', commentId).then(({ error }) => {
            if (error) console.warn('☁️ 删除评论失败:', error.message);
        }).catch(() => {});
    }
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
    // 清除封面图片
    coverImageData = null;
    editCover.value = '';
    coverPreview.style.display = 'none';
    coverPreviewImg.src = '';
    btnClearCover.style.display = 'none';
    btnPickCover.style.display = 'inline-flex';
    editTitle.focus();
}

function closeEditor() {
    editorModal.classList.remove('active');
    document.body.style.overflow = '';
    // 清除封面图片状态
    coverImageData = null;
    editCover.value = '';
    coverPreview.style.display = 'none';
    coverPreviewImg.src = '';
    btnClearCover.style.display = 'none';
    btnPickCover.style.display = 'inline-flex';
}

async function publishPost() {
    const title = editTitle.value.trim();
    const excerpt = editExcerpt.value.trim();
    const tag = editTag.value;
    const emoji = editEmoji.value;
    const body = editBody.value.trim();

    if (!title) { editorHint.textContent = '⚠️ 请输入文章标题'; return; }
    if (!excerpt) { editorHint.textContent = '⚠️ 请输入文章摘要'; return; }
    if (!body) { editorHint.textContent = '⚠️ 请输入文章内容'; return; }

    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    const wordCount = body.replace(/<[^>]*>/g, '').length;
    const readTime = Math.max(1, Math.ceil(wordCount / 400)) + ' 分钟';

    const newPost = {
        id: genSafeId(),
        title,
        excerpt,
        tags: [tag],
        date: dateStr,
        readTime,
        emoji,
        cover_image: coverImageData || null,
        body: `<p>${body.replace(/\n/g, '</p><p>')}</p>`
    };

    // 先添加到本地缓存，立即显示
    const local = cacheGet('blog_user_posts');
    local.unshift(newPost);
    cacheSet('blog_user_posts', local);

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

    // 上传到云端，然后从云端拉取最新数据
    if (dbReady && dbClient) {
        try {
            // DB 列: id, title, excerpt, tags, date, readtime, emoji, body（均为 NOT NULL）
            // tags 需转 JSON 字符串（DB 列类型为 text）
            const dbPost = {
                id: newPost.id,
                title: newPost.title,
                excerpt: newPost.excerpt,
                tags: JSON.stringify(newPost.tags),
                date: newPost.date,
                readtime: newPost.readTime,
                emoji: newPost.emoji,
                cover_image: newPost.cover_image || null,
                body: newPost.body
            };
            const { error } = await dbClient.from('user_posts').upsert(dbPost);
            if (error) {
                console.warn('☁️ 文章 upsert 失败:', error.message);
            }
            const { data: cloud } = await dbClient.from('user_posts').select('*');
            if (cloud && cloud.length > 0) {
                // 合并云数据：parse tags JSON，补齐 readTime/emoji
                const merged = cloud.map(cp => {
                    let tags = cp.tags;
                    if (typeof tags === 'string') {
                        try { tags = JSON.parse(tags); } catch (_) { tags = [tags]; }
                    }
                    if (!Array.isArray(tags)) tags = [];
                    return {
                        ...cp,
                        tags: tags,
                        readTime: cp.readtime || '1 分钟',
                        emoji: cp.emoji || '📝',
                        cover_image: cp.cover_image || null
                    };
                });
                cacheSet('blog_user_posts', merged);
                filterPosts();
                console.log('☁️ user_posts 同步完成: ' + merged.length + ' 篇');
            }
        } catch (e) {
            console.warn('☁️ 文章同步失败:', e.message);
        }
    }
}

function deletePost(postId) {
    if (!confirm('确定要删除这篇文章吗？此操作不可撤销。')) return;
    // 先从本地缓存移除
    let userPosts = cacheGet('blog_user_posts');
    userPosts = userPosts.filter(p => p.id !== postId);
    cacheSet('blog_user_posts', userPosts);
    // 也删除相关评论
    localStorage.removeItem('blog_comments_' + postId);
    filterPosts();

    // 从云端删除
    if (dbReady && dbClient) {
        dbClient.from('user_posts').delete().eq('id', postId).then(({ error }) => {
            if (error) console.warn('☁️ 删除文章失败:', error.message);
        }).catch(() => {});
    }
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

// 封面图片选择
btnPickCover.addEventListener('click', () => editCover.click());
editCover.addEventListener('change', () => {
    const file = editCover.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        coverImageData = reader.result;
        coverPreview.style.display = 'block';
        coverPreviewImg.src = reader.result;
        btnClearCover.style.display = 'inline-flex';
        btnPickCover.style.display = 'none';
    };
    reader.readAsDataURL(file);
});
btnClearCover.addEventListener('click', () => {
    coverImageData = null;
    editCover.value = '';
    coverPreview.style.display = 'none';
    coverPreviewImg.src = '';
    btnClearCover.style.display = 'none';
    btnPickCover.style.display = 'inline-flex';
});

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
    updateCommentFormUI();
    updateGuestbookFormUI();
    renderVisitorsPanel();
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

// ===== 留言板 =====
function loadGuestbookMessages() {
    return cacheGet('blog_guestbook');
}

function saveGuestbookMessages(messages) {
    saveAndSync('blog_guestbook', 'guestbook', messages);
}

function renderGuestbook() {
    const messages = loadGuestbookMessages();
    if (messages.length === 0) {
        guestbookMessages.innerHTML = '<div class="guestbook-empty"><div class="empty-icon">💭</div><p>还没有留言，来做第一个留言的人吧~</p></div>';
    } else {
        // 最新在前
        const sorted = [...messages].reverse();
        guestbookMessages.innerHTML = sorted.map(m => `
            <div class="guestbook-item">
                <div class="guestbook-item-header">
                    <div class="guestbook-item-user">
                        <div class="guestbook-item-avatar">${escapeHtml(m.username).charAt(0).toUpperCase()}</div>
                        <span class="guestbook-item-name">${escapeHtml(m.username)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span class="guestbook-item-time">${m.time}</span>
                        ${(isAdmin() || (getCurrentUser() && getCurrentUser().id === m.user_id)) ? `<button class="guestbook-item-delete" data-gb-id="${m.id}" title="删除">🗑</button>` : ''}
                    </div>
                </div>
                <p class="guestbook-item-body">${escapeHtml(m.body)}</p>
            </div>
        `).join('');

        // 删除事件
        guestbookMessages.querySelectorAll('.guestbook-item-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('确定要删除这条留言吗？')) {
                    deleteGuestbookMessage(parseInt(btn.dataset.gbId));
                }
            });
        });
    }
}

function updateGuestbookFormUI() {
    if (isLoggedIn()) {
        guestbookFormWrapper.style.display = 'flex';
        guestbookLoginNag.style.display = 'none';
        const user = getCurrentUser();
        if (guestbookBody) {
            guestbookBody.placeholder = `以 ${user.username} 的身份留言...（Ctrl+Enter 发表）`;
        }
    } else {
        guestbookFormWrapper.style.display = 'none';
        guestbookLoginNag.style.display = 'block';
    }
}

async function submitGuestbook() {
    const user = getCurrentUser();
    if (!user) {
        guestbookHint.textContent = '⚠️ 请先登录后再留言';
        return;
    }
    const body = guestbookBody.value.trim();
    if (!body) { guestbookHint.textContent = '请输入留言内容'; return; }

    const now = new Date();
    const timeStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' +
        String(now.getMinutes()).padStart(2, '0');

    const newMsg = { id: genSafeId(), username: user.username, user_id: user.id, body, time: timeStr };

    // 先添加到本地缓存，立即显示
    const local = cacheGet('blog_guestbook');
    local.push(newMsg);
    cacheSet('blog_guestbook', local);
    renderGuestbook();
    guestbookBody.value = '';
    guestbookHint.textContent = '✅ 留言发表成功！';
    setTimeout(() => { guestbookHint.textContent = ''; }, 2000);

    // 上传到云端，然后从云端拉取最新数据（包含其他用户的留言）
    if (dbReady && dbClient) {
        try {
            await dbClient.from('guestbook').upsert(newMsg);
            const { data: cloud } = await dbClient.from('guestbook').select('*');
            if (cloud && cloud.length > 0) {
                cacheSet('blog_guestbook', cloud);
                renderGuestbook();
            }
        } catch (e) {
            console.warn('☁️ 留言同步失败:', e.message);
        }
    }
}

function deleteGuestbookMessage(msgId) {
    // 先从本地缓存移除，立即更新 UI
    let messages = cacheGet('blog_guestbook');
    messages = messages.filter(m => m.id !== msgId);
    cacheSet('blog_guestbook', messages);
    renderGuestbook();

    // 从云端删除
    if (dbReady && dbClient) {
        dbClient.from('guestbook').delete().eq('id', msgId).then(({ error }) => {
            if (error) console.warn('☁️ 删除留言失败:', error.message);
        }).catch(() => {});
    }
}

btnGuestbookSubmit.addEventListener('click', submitGuestbook);
guestbookBody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) submitGuestbook();
});
guestbookLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal('login');
});

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

async function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username) { loginHint.textContent = '请输入用户名'; loginHint.className = 'auth-hint error'; return; }
    if (!password) { loginHint.textContent = '请输入密码'; loginHint.className = 'auth-hint error'; return; }

    loginHint.textContent = '🔄 正在验证...';
    loginHint.className = 'auth-hint';

    // 通过 RPC 函数在数据库内部验证密码，外部无法读取 users 表
    if (dbReady && dbClient) {
        try {
            const { data: result, error } = await dbClient.rpc('login_user', {
                p_username: username,
                p_password: simpleHash(password)
            });
            if (error) throw error;
            if (result && !result.error) {
                const user = result;
                setCurrentUser(user);
                recordVisit(user);
                loginHint.textContent = '✅ 登录成功！';
                loginHint.className = 'auth-hint success';
                setTimeout(() => {
                    closeAuthModal();
                    updateAuthUI();
                    updateCommentFormUI();
                    filterPosts();
                }, 600);
                return;
            }
        } catch (e) {
            console.warn('☁️ 登录验证失败:', e.message);
        }
    }

    // 回退到本地缓存（断网情况）
    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === simpleHash(password));
    if (user) {
        setCurrentUser(user);
        loginHint.textContent = '✅ 登录成功！（离线模式）';
        loginHint.className = 'auth-hint success';
        setTimeout(() => {
            closeAuthModal();
            updateAuthUI();
            updateCommentFormUI();
            filterPosts();
        }, 600);
        return;
    }

    loginHint.textContent = '❌ 用户名或密码错误';
    loginHint.className = 'auth-hint error';
}

async function handleRegister() {
    const username = regUsername.value.trim();
    const password = regPassword.value.trim();
    const passwordConfirm = regPasswordConfirm.value.trim();

    if (!username || username.length < 3) { registerHint.textContent = '用户名至少需要3个字符'; registerHint.className = 'auth-hint error'; return; }
    if (!password || password.length < 6) { registerHint.textContent = '密码至少需要6个字符'; registerHint.className = 'auth-hint error'; return; }
    if (password !== passwordConfirm) { registerHint.textContent = '两次密码不一致'; registerHint.className = 'auth-hint error'; return; }

    registerHint.textContent = '🔄 正在注册...';
    registerHint.className = 'auth-hint';

    const hashedPw = simpleHash(password);

    // 通过 RPC 函数在数据库内部注册（避免 anon 直接操作 users 表）
    if (dbReady && dbClient) {
        try {
            const { data: result, error } = await dbClient.rpc('register_user', {
                p_username: username,
                p_password: hashedPw
            });
            if (error) throw error;
            if (result && result.error) {
                registerHint.textContent = '❌ ' + result.error;
                registerHint.className = 'auth-hint error';
                return;
            }
            if (result && result.id) {
                const newUser = result;
                // 保存到本地缓存
                const users = loadUsers();
                users.push(newUser);
                cacheSet('blog_users', users);

                registerHint.textContent = '✅ 注册成功！正在自动登录...';
                registerHint.className = 'auth-hint success';

                setTimeout(() => {
                    setCurrentUser(newUser);
                    recordVisit(newUser);
                    closeAuthModal();
                    updateAuthUI();
                    updateCommentFormUI();
                    filterPosts();
                }, 800);
                return;
            }
        } catch (e) {
            console.warn('☁️ 注册失败:', e.message);
        }
    }

    // 回退到本地注册（断网情况）
    const users = loadUsers();
    if (users.some(u => u.username === username)) {
        registerHint.textContent = '该用户名已被注册';
        registerHint.className = 'auth-hint error';
        return;
    }
    const newUser = { id: genSafeId(), username, password: hashedPw, role: 'user', created_at: new Date().toISOString().split('T')[0] };
    users.push(newUser);
    cacheSet('blog_users', users);
    registerHint.textContent = '✅ 注册成功！（离线模式）';
    registerHint.className = 'auth-hint success';
    setTimeout(() => {
        setCurrentUser(newUser);
        recordVisit(newUser);
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
    renderGuestbook();
    renderVisitorsPanel();
    animateStats();

    // 从云端拉取数据（异步，后台静默进行）
    pullFromCloud();

    console.log('☁️ 数据同步: 本地 + Supabase 云端');
    console.log('🔐 默认管理员: M1kasa / admin123');

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
