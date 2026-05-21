// ── State ──
const state = {
  user: null,
  view: 'feed',
  posts: [],
  users: USERS,
  comments: {},
};

// ── Mock Data ──
const USERS = [
  { id: 1, name: 'Zig Learner', handle: 'ziglearner', bio: 'Learning Zig one comptime at a time', posts: 12 },
  { id: 2, name: 'Systems Dev', handle: 'sysdev', bio: 'Systems programmer, Zig enthusiast', posts: 28 },
  { id: 3, name: 'أحمد الفرا', handle: 'ahmedfr', bio: 'مبرمج أنظمة عربي', posts: 7 },
  { id: 4, name: 'Code Wizard', handle: 'codewiz', bio: 'Comptime is magic', posts: 19 },
  { id: 5, name: 'RustConvert', handle: 'rustconvert', bio: 'Came from Rust, stayed for Zig', posts: 33 },
];

const FEED = [
  {
    id: 1, userId: 1, time: '2h ago',
    text: 'Just discovered Zig\'s comptime! This is incredible. You can run code at compile time and generate types dynamically. No macros needed.',
    code: 'const std = @import("std");\n\nfn ComptimeFn(comptime T: type) type {\n    return struct {\n        data: T,\n        fn init(v: T) @This() { return .{ .data = v }; }\n    };\n}\n\npub fn main() void {\n    const S = ComptimeFn(i32);\n    const s = S.init(42);\n    std.debug.print("{d}", .{s.data});\n}',
    likes: 24, comments: 5, liked: false,
  },
  {
    id: 2, userId: 2, time: '5h ago',
    text: 'Zig\'s allocator pattern is genius. Every allocation is explicit. No hidden mallocs. You pass the allocator to functions that need it. This is how systems programming should be done.',
    code: 'const std = @import("std");\n\npub fn main() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    defer _ = gpa.deinit();\n    const allocator = gpa.allocator();\n\n    const list = try std.ArrayList(u8).initCapacity(allocator, 4);\n    defer list.deinit();\n    \n    try list.appendSlice("Zig");\n    std.debug.print("{s}", .{list.items});\n}',
    likes: 42, comments: 8, liked: true,
  },
  {
    id: 3, userId: 3, time: '1d ago',
    text: 'بدأت أتعلم Zig بعد سنوات من C والفرق كبير. لا header files، لا preprocessor، compiler أسرع، ورسائل خطأ واضحة. أنصح كل مبرمج C بتجربتها.',
    code: 'const std = @import("std");\n\npub fn main() void {\n    const msg = "مرحبا بالعالم";\n    std.debug.print("{s}\\n", .{msg});\n    \n    // No UB by default!\n    const x: u8 = 255;\n    const y = x +% 1;  // wrapping add\n    std.debug.print("{d}", .{y});\n}',
    likes: 36, comments: 12, liked: false,
  },
  {
    id: 4, userId: 4, time: '2d ago',
    text: 'Built a simple HTTP server in Zig using the standard library. The @import system is so clean. No external dependencies needed for basic networking.',
    code: 'const std = @import("std");\nconst net = std.net;\n\npub fn main() !void {\n    var server = try net.StreamServer.init(.{ .reuse_address = true });\n    defer server.deinit();\n    \n    try server.listen(net.Address.parseIp("0.0.0.0", 8080) catch unreachable);\n    \n    while (true) {\n        const conn = try server.accept();\n        defer conn.stream.close();\n        _ = try conn.stream.write("HTTP/1.1 200 OK\\r\\n\\r\\nHello Zig!");\n    }\n}',
    likes: 53, comments: 9, liked: false,
  },
  {
    id: 5, userId: 5, time: '3d ago',
    text: 'Coming from Rust, Zig feels liberating. No borrow checker fights, no lifetime annotations. Just write code and it works. And it\'s FAST.',
    likes: 18, comments: 7, liked: false,
  },
];

const PROJECTS = [
  { title: 'Zig HTTP Parser', desc: 'Fast HTTP/1.1 parser written in Zig', author: 'sysdev', tags: ['network', 'parser'] },
  { title: 'TigerBE Game Engine', desc: 'Game engine in Zig with Vulkan backend', author: 'ahmedfr', tags: ['graphics', 'game-dev'] },
  { title: 'Zig SQLite Bindings', desc: 'Zero-cost bindings to SQLite', author: 'codewiz', tags: ['database', 'bindings'] },
  { title: 'Comptime JSON', desc: 'JSON parsing at compile time', author: 'ziglearner', tags: ['comptime', 'json'] },
  { title: 'Zig TLS 1.3', desc: 'TLS 1.3 implementation in pure Zig', author: 'rustconvert', tags: ['security', 'crypto'] },
  { title: 'Zig Web Framework', desc: 'Minimal web framework inspired by Express', author: 'sysdev', tags: ['web', 'framework'] },
];

const TUTORIALS = [
  { title: 'Getting Started with Zig', desc: 'Install Zig and write your first program', level: 'Beginner', time: '10 min' },
  { title: 'Understanding Comptime', desc: 'Master Zig\'s compile-time execution', level: 'Intermediate', time: '30 min' },
  { title: 'Memory Management in Zig', desc: 'Allocators, arenas, and custom memory strategies', level: 'Advanced', time: '45 min' },
  { title: 'Zig vs C: A Comparison', desc: 'For C programmers learning Zig', level: 'Intermediate', time: '20 min' },
  { title: 'Building a CLI Tool', desc: 'Create a command-line application in Zig', level: 'Intermediate', time: '40 min' },
];

// ── Router ──
function navigate(view) {
  state.view = view;
  window.location.hash = view;
  render();
}

window.addEventListener('hashchange', () => {
  state.view = window.location.hash.slice(1) || 'feed';
  render();
});

// ── Render ──
function render() {
  const main = document.getElementById('mainContent');
  const view = state.view;
  if (!main) return;

  // Update active nav
  document.querySelectorAll('.nav-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));
  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.toggle('active', el.dataset.view === view));

  switch (view) {
    case 'feed': renderFeed(main); break;
    case 'profile': renderProfile(main); break;
    case 'explore': renderExplore(main); break;
    case 'learn': renderLearn(main); break;
    case 'community': renderCommunity(main); break;
    case 'login': renderLogin(main); break;
    case 'signup': renderSignup(main); break;
    default: renderFeed(main); break;
  }
}

// ── Feed ──
function renderFeed(main) {
  main.className = 'main-content';
  let html = '<div class="post-creator">';
  html += `<div class="card-avatar">${state.user ? state.user.name[0] : 'G'}</div>`;
  html += '<div style="flex:1"><input class="input" placeholder="Share something about Zig..." readonly onclick="openNewPost()"></div></div>';

  for (const post of FEED) {
    const user = USERS.find(u => u.id === post.userId);
    if (!user) continue;
    html += `<div class="card">
      <div class="card-header">
        <div class="card-avatar">${user.name[0]}</div>
        <div><div class="card-user">${esc(user.name)}</div><div class="card-time">${post.time}</div></div>
      </div>
      <div class="card-body">${esc(post.text)}</div>`;
    if (post.code) {
      html += `<div class="card-code"><pre>${esc(post.code)}</pre></div>`;
    }
    html += `<div class="card-actions">
      <button class="card-action ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">${post.liked ? '❤️' : '🤍'} ${post.likes}</button>
      <button class="card-action commented" onclick="toggleComments(${post.id})">💬 ${post.comments}</button>
      <button class="card-action">🔗 Share</button>
    </div>`;
    html += `<div class="card-comments hidden" id="comments-${post.id}">`;
    // Simulated comments
    const commenters = [USERS[(post.userId % 5)], USERS[(post.userId + 1) % 5]];
    for (let i = 0; i < Math.min(post.comments, 3); i++) {
      const c = commenters[i % commenters.length];
      html += `<div class="comment">
        <div class="comment-avatar">${c.name[0]}</div>
        <div class="comment-body"><span class="comment-user">${esc(c.name)}</span> <span class="comment-text">Great post! Zig is amazing 🚀</span></div>
      </div>`;
    }
    html += '</div></div>';
  }
  main.innerHTML = html;
}

// ── Profile ──
function renderProfile(main) {
  const u = USERS[0];
  main.className = 'main-content';
  main.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${u.name[0]}</div>
      <div class="profile-info">
        <h2>${esc(u.name)}</h2>
        <p>@${u.handle} · ${esc(u.bio)}</p>
        <div class="profile-stats">
          <div class="profile-stat"><div class="num">${u.posts}</div><div class="lbl">Posts</div></div>
          <div class="profile-stat"><div class="num">156</div><div class="lbl">Followers</div></div>
          <div class="profile-stat"><div class="num">89</div><div class="lbl">Following</div></div>
        </div>
      </div>
    </div>
    <div class="profile-tabs">
      <button class="profile-tab active">Posts</button>
      <button class="profile-tab">Code</button>
      <button class="profile-tab">Likes</button>
    </div>
    <p style="color:var(--text3);font-size:.85em;">No posts yet. Share your first Zig code!</p>`;
}

// ── Explore ──
function renderExplore(main) {
  main.className = 'main-content wide';
  let html = '<h2 style="margin-bottom:16px;font-size:1.2em;">🔥 Trending Projects</h2>';
  html += '<div class="explore-grid">';
  for (const p of PROJECTS) {
    html += `<div class="explore-card">
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.desc)}</p>
      <div>by @${p.author}</div>
      <div>${p.tags.map(t => `<span class="tag">#${t}</span>`).join(' ')}</div>
    </div>`;
  }
  html += '</div>';

  html += '<h2 style="margin:24px 0 16px;font-size:1.2em;">📚 Tutorials</h2>';
  html += '<div class="explore-grid">';
  for (const t of TUTORIALS) {
    html += `<div class="explore-card">
      <h3>${esc(t.title)}</h3>
      <p>${esc(t.desc)}</p>
      <div style="display:flex;gap:8px;margin-top:6px;">
        <span class="tag">${t.level}</span>
        <span class="tag">${t.time}</span>
      </div>
    </div>`;
  }
  html += '</div>';
  main.innerHTML = html;
}

// ── Learn ──
function renderLearn(main) {
  main.className = 'main-content wide';
  main.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h2 style="font-size:1.2em;">📖 Bilingual Reference</h2>
      <a href="reference.html" target="_blank" class="btn btn-accent">Open Full Reference →</a>
    </div>
    <div class="card">
      <div class="card-body">
        <strong>Zig 0.16.0 Complete Reference</strong><br>
        English + Arabic  ·  354 sections  ·  317 code examples  ·  52 chapters
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <a href="reference.html" target="_blank" class="btn btn-outline btn-sm">📘 Full Reference</a>
        <a href="reference.html#Introduction" target="_blank" class="btn btn-outline btn-sm">Getting Started</a>
        <a href="reference.html#Basic_Syntax" target="_blank" class="btn btn-outline btn-sm">Basic Syntax</a>
        <a href="reference.html#Memory" target="_blank" class="btn btn-outline btn-sm">Memory</a>
        <a href="reference.html#Comptime" target="_blank" class="btn btn-outline btn-sm">Comptime</a>
      </div>
    </div>
    <div class="card" style="margin-top:14px;">
      <div class="card-header"><div class="card-avatar">📄</div><div><div class="card-user">Quick Start</div></div></div>
      <div class="card-body">Install Zig and write your first program in 2 minutes.</div>
      <div class="card-code"><pre># Install on Linux/macOS
curl -fsSL https://ziglang.org/download/0.16.0/zig-linux-x86_64-0.16.0.tar.xz | tar -xJ
./zig-linux-x86_64-0.16.0/zig version

# Create and run your first program
echo 'const std = @import("std");
pub fn main() void {
    std.debug.print("Hello Zig!\\n", .{});
}' > hello.zig
./zig run hello.zig</pre></div>
    </div>`;
}

// ── Community ──
function renderCommunity(main) {
  main.className = 'main-content wide';
  main.innerHTML = `
    <h2 style="margin-bottom:16px;font-size:1.2em;">🌍 Community Hub</h2>
    <div class="community-grid">
      <div class="community-card">
        <div class="icon" style="background:rgba(0,212,170,0.1);color:var(--accent2);">💬</div>
        <h3>Telegram Group</h3>
        <p>Arabic & English discussion for Zig programmers</p>
        <a href="https://t.me/ZigArab" target="_blank" class="btn btn-accent btn-sm">Join Telegram</a>
      </div>
      <div class="community-card">
        <div class="icon" style="background:rgba(88,101,242,0.1);color:#5865F2;">🎮</div>
        <h3>Discord</h3>
        <p>Official Discord with thousands of Zig developers</p>
        <a href="https://discord.gg/zig" target="_blank" class="btn btn-outline btn-sm">Join Discord</a>
      </div>
      <div class="community-card">
        <div class="icon" style="background:rgba(255,255,255,0.05);color:#fff;">📖</div>
        <h3>GitHub</h3>
        <p>Source code, issues, and contributions welcome</p>
        <a href="https://github.com/LightHevenOS1923/zig-reference" target="_blank" class="btn btn-outline btn-sm">View Source</a>
      </div>
      <div class="community-card">
        <div class="icon" style="background:rgba(247,164,29,0.1);color:var(--accent);">🔗</div>
        <h3>Zig Forum</h3>
        <p>Official Zig discussion forum and Q&A</p>
        <a href="https://ziggit.dev" target="_blank" class="btn btn-outline btn-sm">Visit Forum</a>
      </div>
    </div>
    <div class="card" style="margin-top:20px;">
      <h3 style="margin-bottom:10px;">📢 Community Rules</h3>
      <ul style="color:var(--text2);font-size:.85em;padding-left:20px;">
        <li>Be respectful and inclusive</li>
        <li>Stay on topic: Zig programming language</li>
        <li>Help others learn and grow</li>
        <li>Share your projects and code</li>
        <li>No spam or self-promotion</li>
      </ul>
    </div>`;
}

// ── Auth ──
function renderLogin(main) {
  main.className = 'main-content';
  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p>Sign in to the Zig community</p>
        <div class="auth-error" id="authError"></div>
        <input class="input" type="email" id="loginEmail" placeholder="Email address">
        <input class="input" type="password" id="loginPass" placeholder="Password">
        <button class="btn btn-accent" onclick="handleLogin()">Sign In</button>
        <div class="auth-divider">or continue with</div>
        <button class="btn btn-outline" onclick="handleSocialLogin()">🔵 Sign in with GitHub</button>
        <div class="auth-switch">Don't have an account? <a onclick="navigate('signup')">Sign up</a></div>
      </div>
    </div>`;
}

function renderSignup(main) {
  main.className = 'main-content';
  main.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p>Join the Zig programming community</p>
        <div class="auth-error" id="authError"></div>
        <input class="input" type="text" id="signupName" placeholder="Full name">
        <input class="input" type="email" id="signupEmail" placeholder="Email address">
        <input class="input" type="password" id="signupPass" placeholder="Password (min 6 characters)">
        <button class="btn btn-accent" onclick="handleSignup()">Create Account</button>
        <div class="auth-divider">or continue with</div>
        <button class="btn btn-outline" onclick="handleSocialLogin()">🔵 Sign up with GitHub</button>
        <div class="auth-switch">Already have an account? <a onclick="navigate('login')">Sign in</a></div>
      </div>
    </div>`;
}

// ── Actions ──
function toggleLike(postId) {
  const post = FEED.find(p => p.id === postId);
  if (!post) return;
  post.liked = !post.liked;
  post.likes += post.liked ? 1 : -1;
  render();
}

function toggleComments(postId) {
  const el = document.getElementById(`comments-${postId}`);
  if (el) el.classList.toggle('hidden');
}

function openNewPost() {
  if (!state.user) {
    navigate('login');
    return;
  }
  alert('New post feature coming with Supabase backend!');
}

function handleLogin() {
  const email = document.getElementById('loginEmail')?.value;
  const pass = document.getElementById('loginPass')?.value;
  if (!email || !pass) {
    showAuthError('Please fill in all fields');
    return;
  }
  state.user = { name: 'Zig User', email, handle: 'ziguser' };
  navigate('feed');
}

function handleSignup() {
  const name = document.getElementById('signupName')?.value;
  const email = document.getElementById('signupEmail')?.value;
  const pass = document.getElementById('signupPass')?.value;
  if (!name || !email || !pass) {
    showAuthError('Please fill in all fields');
    return;
  }
  if (pass.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }
  state.user = { name, email, handle: name.toLowerCase().replace(/\\s+/g, '') };
  navigate('feed');
}

function handleSocialLogin() {
  state.user = { name: 'GitHub User', email: 'user@github.com', handle: 'githubuser' };
  navigate('feed');
}

function showAuthError(msg) {
  const el = document.getElementById('authError');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.slice(1);
  if (hash) state.view = hash;
  render();
});
