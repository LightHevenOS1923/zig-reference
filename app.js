// ── Supabase Config (fill your keys from supabase.com) ──
const SUPABASE_URL = localStorage.getItem('supabase_url') || '';
const SUPABASE_KEY = localStorage.getItem('supabase_key') || '';
let supabase = null;

// ── State ──
const state = { user: null, view: 'feed', posts: [], users: [] };

// ── Mock Data (fallback when Supabase not configured) ──
const MOCK_USERS = [
  {id:1,name:'Zig Learner',handle:'ziglearner',bio:'Learning Zig one comptime at a time',posts:12,followers:156,following:89},
  {id:2,name:'Systems Dev',handle:'sysdev',bio:'Systems programmer, Zig enthusiast',posts:28,followers:203,following:67},
  {id:3,name:'أحمد الفرا',handle:'ahmedfr',bio:'مبرمج أنظمة عربي',posts:7,followers:89,following:34},
  {id:4,name:'Code Wizard',handle:'codewiz',bio:'Comptime is magic',posts:19,followers:312,following:45},
  {id:5,name:'RustConvert',handle:'rustconvert',bio:'Came from Rust, stayed for Zig',posts:33,followers:178,following:92},
];
const MOCK_POSTS = [
  {id:1,uid:1,user:'Zig Learner',time:'2h',text:'Just discovered Zig\'s comptime! You can run code at compile time and generate types dynamically.',code:'const std = @import("std");\n\nfn T(comptime T: type) type {\n    return struct { data: T };\n}\n\npub fn main() void {\n    const S = T(i32);\n    const s = S{ .data = 42 };\n    std.debug.print("{d}", .{s.data});\n}',likes:24,comments:5,liked:false},
  {id:2,uid:2,user:'Systems Dev',time:'5h',text:'Zig\'s allocator pattern is genius. Every allocation is explicit. No hidden mallocs.',code:'const std = @import("std");\n\npub fn main() !void {\n    var gpa = std.heap.GeneralPurposeAllocator(.{}){};\n    defer _ = gpa.deinit();\n    const a = gpa.allocator();\n    var list = try std.ArrayList(u8).initCapacity(a, 4);\n    defer list.deinit();\n    try list.appendSlice("Zig");\n    std.debug.print("{s}", .{list.items});\n}',likes:42,comments:8,liked:true},
  {id:3,uid:3,user:'أحمد الفرا',time:'1d',text:'بدأت أتعلم Zig بعد C. لا header، لا preprocessor، compiler أسرع. أنصح بها.',code:'const std = @import("std");\n\npub fn main() void {\n    const msg = "مرحبا";\n    std.debug.print("{s}\\n", .{msg});\n    const x: u8 = 255;\n    std.debug.print("{d}", .{x +% 1});\n}',likes:36,comments:12,liked:false},
  {id:4,uid:4,user:'Code Wizard',time:'2d',text:'HTTP server in pure Zig std lib. No dependencies!',code:'const std = @import("std");\nconst net = std.net;\n\npub fn main() !void {\n    var srv = try net.StreamServer.init(.{.reuse_address=true});\n    defer srv.deinit();\n    try srv.listen(net.Address.parseIp("0.0.0.0",8080) catch unreachable);\n    while(true) {\n        const c = try srv.accept();\n        defer c.stream.close();\n        _ = try c.stream.write("HTTP/1.1 200 OK\\r\\n\\r\\nHi Zig!");\n    }\n}',likes:53,comments:9,liked:false},
  {id:5,uid:5,user:'RustConvert',time:'3d',text:'From Rust to Zig. No borrow checker, no lifetimes. Just write code. So fast.',likes:18,comments:7,liked:false},
];
const MOCK_PROJECTS = [
  {title:'Zig HTTP Parser',desc:'Fast HTTP/1.1 parser in Zig',author:'sysdev',tags:['network','parser']},
  {title:'TigerBE Engine',desc:'Game engine with Vulkan',author:'ahmedfr',tags:['graphics','game-dev']},
  {title:'Zig SQLite',desc:'Zero-cost SQLite bindings',author:'codewiz',tags:['database','bindings']},
  {title:'Comptime JSON',desc:'JSON parsing at compile time',author:'ziglearner',tags:['comptime','json']},
  {title:'Zig TLS 1.3',desc:'TLS in pure Zig',author:'rustconvert',tags:['security','crypto']},
  {title:'Zig Web',desc:'Express-inspired web framework',author:'sysdev',tags:['web','framework']},
];

// ── Init Supabase ──
async function initSupabase(url, key) {
  if (!url || !key) return false;
  if (!window.supabase) {
    try { await loadScript('https://unpkg.com/@supabase/supabase-js@2'); } catch(e) { return false; }
  }
  supabase = window.supabase.createClient(url, key);
  return true;
}

function loadScript(src) {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

// ── Auth ──
async function authSignUp(name, email, pass) {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email, password: pass,
      options: { data: { full_name: name } }
    });
    if (error) return error.message;
    state.user = data.user;
    return null;
  }
  state.user = { id: Date.now(), email, user_metadata: { full_name: name } };
  return null;
}

async function authSignIn(email, pass) {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return error.message;
    state.user = data.user;
    return null;
  }
  state.user = { id: Date.now(), email, user_metadata: { full_name: email.split('@')[0] } };
  return null;
}

async function authSignOut() {
  if (supabase) await supabase.auth.signOut();
  state.user = null;
  render();
}

async function authGitHub() {
  if (supabase) {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
    return;
  }
  state.user = { id: Date.now(), email: 'github@user.com', user_metadata: { full_name: 'GitHub User' } };
  render();
}

// ── Posts ──
async function loadPosts() {
  if (supabase) {
    const { data } = await supabase.from('posts')
      .select('*, profiles(username,display_name)')
      .order('created_at', { ascending: false });
    if (data) return data;
  }
  return MOCK_POSTS;
}

async function createPost(text, code) {
  if (supabase && state.user) {
    await supabase.from('posts').insert({
      user_id: state.user.id,
      content: text,
      code: code || ''
    });
    await loadAndRender();
    return;
  }
  MOCK_POSTS.unshift({
    id: Date.now(), uid: 0, user: state.user?.user_metadata?.full_name || 'You',
    time: 'now', text, code, likes: 0, comments: 0, liked: false
  });
  await loadAndRender();
}

async function toggleLikePost(postId, liked, likes) {
  if (supabase && state.user) {
    if (liked) {
      await supabase.from('likes').delete().match({ user_id: state.user.id, post_id: postId });
    } else {
      await supabase.from('likes').insert({ user_id: state.user.id, post_id: postId });
    }
  }
}

// ── Router ──
function navigate(v) {
  state.view = v;
  window.location.hash = v;
  render();
}
window.addEventListener('hashchange', () => {
  state.view = window.location.hash.slice(1) || 'feed';
  render();
});

// ── Render ──
async function loadAndRender() {
  state.posts = await loadPosts();
  render();
}

function render() {
  const m = document.getElementById('main');
  if (!m) return;
  const v = state.view;
  const nm = state.user?.user_metadata?.full_name || 'Z';
  document.querySelectorAll('.nav-c a').forEach(el => el.classList.toggle('active', el.dataset.v === v));

  switch(v) {
    case 'feed': renderFeed(m, nm); break;
    case 'explore': renderExplore(m); break;
    case 'learn': renderLearn(m); break;
    case 'community': renderCommunity(m); break;
    case 'profile': renderProfile(m, nm); break;
    case 'login': renderLogin(m); break;
    case 'signup': renderSignup(m); break;
    default: renderFeed(m, nm);
  }
}

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// ── FEED ──
function renderFeed(m, nm) {
  let h = `<div class="creator"><div class="post-av">${nm[0]}</div><input class="input" placeholder="Share about Zig..." onclick="openNewPost()" readonly></div>`;
  const posts = state.posts.length ? state.posts : MOCK_POSTS;
  for (const p of posts) {
    const un = p.user || p.profiles?.display_name || 'User';
    const time = p.time || 'now';
    h += `<div class="post">
      <div class="post-h"><div class="post-av">${un[0]}</div><div><div class="post-n">${esc(un)}</div><div class="post-t">${time}</div></div></div>
      <div class="post-body">${esc(p.text || p.content)}</div>`;
    if (p.code) h += `<div class="post-code">${esc(p.code)}</div>`;
    const lid = `p${p.id}`;
    const likes = p.likes || 0;
    h += `<div class="post-a">
      <button onclick="tL('${lid}')" id="${lid}-b">${p.liked ? '❤️' : '🤍'} <span id="${lid}-c">${likes}</span></button>
      <button onclick="document.getElementById('${lid}-c').classList.toggle('show')">💬 ${p.comments || 0}</button>
      <button>🔗</button>
    </div>
    <div class="post-c" id="${lid}-c"><div class="cm"><div class="cm-av">S</div><div class="cm-b"><span class="cm-u">Systems Dev</span> <span class="cm-t">Great post!</span></div></div></div>
    </div>`;
  }
  m.innerHTML = h;
}

function tL(id) {
  const b = document.getElementById(id + '-b');
  const c = document.getElementById(id + '-c');
  if (!b || !c) return;
  let n = parseInt(c.textContent);
  if (b.textContent.includes('❤')) {
    b.innerHTML = `🤍 <span id="${id}-c">${n-1}</span>`;
  } else {
    b.innerHTML = `❤️ <span id="${id}-c">${n+1}</span>`;
  }
}

// ── EXPLORE ──
function renderExplore(m) {
  let h = '<h2 style="font-size:1.15em;margin-bottom:10px;">🔥 Projects</h2><div class="exp-g">';
  for (const p of MOCK_PROJECTS) {
    h += `<div class="exp-c"><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div style="font-size:.7em;color:var(--text3);margin:3px 0">by @${p.author}</div>${p.tags.map(t=>`<span class="tag">#${t}</span>`).join('')}</div>`;
  }
  h += '</div>';
  h += '<h2 style="font-size:1.15em;margin:20px 0 10px;">📚 Tutorials</h2><div class="exp-g">';
  const tuts = [
    {title:'Getting Started',desc:'Install & first program',tag:'Beginner'},
    {title:'Comptime',desc:'Master compile-time code',tag:'Intermediate'},
    {title:'Memory',desc:'Allocators & arenas',tag:'Advanced'},
    {title:'CLI Apps',desc:'Build CLI tools',tag:'Intermediate'},
  ];
  for (const t of tuts) {
    h += `<div class="exp-c"><h3>${t.title}</h3><p>${t.desc}</p><span class="tag">${t.tag}</span></div>`;
  }
  h += '</div>';
  m.innerHTML = h;
}

// ── LEARN ──
function renderLearn(m) {
  m.innerHTML = `
    <h2 style="font-size:1.15em;margin-bottom:4px;">📖 Bilingual Reference</h2>
    <p style="color:var(--text2);font-size:.82em;margin-bottom:12px;">Zig 0.16.0 · English + Arabic · 354 sections</p>
    <div class="post" style="padding:16px;">
      <p style="font-size:.88em;margin-bottom:10px;">Full bilingual reference with code examples, vocabulary, notes, and exercises.</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <a href="reference.html" target="_blank" class="btn btn-p btn-s">📘 Open Reference</a>
        <a href="reference.html#Introduction" target="_blank" class="btn btn-o btn-s">Start</a>
        <a href="reference.html#Basic_Syntax" target="_blank" class="btn btn-o btn-s">Syntax</a>
        <a href="reference.html#Memory" target="_blank" class="btn btn-o btn-s">Memory</a>
        <a href="reference.html#Comptime" target="_blank" class="btn btn-o btn-s">Comptime</a>
      </div>
    </div>
    <div class="post" style="padding:16px;">
      <div class="post-h"><div class="post-av" style="background:var(--accent2);font-size:.65em;">🚀</div><div><div class="post-n">Quick Start</div></div></div>
      <div class="post-code">curl -fsSL https://ziglang.org/download/0.16.0/zig-linux-x86_64-0.16.0.tar.xz | tar -xJ<br>./zig-linux-x86_64-0.16.0/zig version<br><br>echo 'const std = @import("std");<br>pub fn main() void {<br>    std.debug.print("Hello!\\n", .{});<br>}' > hello.zig<br>./zig run hello.zig</div>
    </div>`;
}

// ── COMMUNITY ──
function renderCommunity(m) {
  m.innerHTML = `
    <h2 style="font-size:1.15em;margin-bottom:10px;">🌍 Community Hub</h2>
    <div class="comm-g">
      <div class="comm-c"><div class="ic">💬</div><h3>Telegram</h3><p>Arabic & English group</p><a href="https://t.me/ZigArab" target="_blank" class="btn btn-p btn-s">Join</a></div>
      <div class="comm-c"><div class="ic">🎮</div><h3>Discord</h3><p>Official Zig server</p><a href="https://discord.gg/zig" target="_blank" class="btn btn-o btn-s">Join</a></div>
      <div class="comm-c"><div class="ic">📖</div><h3>GitHub</h3><p>Source & contributions</p><a href="https://github.com/LightHevenOS1923/zig-reference" target="_blank" class="btn btn-o btn-s">View</a></div>
      <div class="comm-c"><div class="ic">🔗</div><h3>Zig Forum</h3><p>Discussions & Q&A</p><a href="https://ziggit.dev" target="_blank" class="btn btn-o btn-s">Visit</a></div>
    </div>
    <div class="post" style="margin-top:10px;padding:14px;">
      <h3 style="font-size:.9em;margin-bottom:6px;">📢 Rules</h3>
      <ul style="color:var(--text2);font-size:.8em;padding-left:18px;">
        <li>Be respectful and inclusive</li>
        <li>Stay on topic: Zig</li>
        <li>Help others learn</li>
        <li>Share your projects</li>
      </ul>
    </div>`;
}

// ── PROFILE ──
function renderProfile(m, nm) {
  const u = state.user?.user_metadata || { full_name: 'Guest', preferred_username: 'guest' };
  const handle = u.preferred_username || (u.full_name || '').toLowerCase().replace(/\s+/g, '') || 'guest';
  m.innerHTML = `
    <div class="prof">
      <div class="prof-av">${(u.full_name||'Z')[0]}</div>
      <div class="prof-info">
        <h2>${esc(u.full_name||'Zig User')}</h2>
        <div class="h">@${handle}</div>
        <div class="prof-st">
          <div><div class="n">12</div><div class="l">Posts</div></div>
          <div><div class="n">156</div><div class="l">Followers</div></div>
          <div><div class="n">89</div><div class="l">Following</div></div>
        </div>
      </div>
    </div>
    <div class="prof-t">
      <button class="on">Posts</button>
      <button>Code</button>
      <button>Likes</button>
    </div>
    ${state.user ? `<button class="btn btn-d btn-s" onclick="authSignOut();render()" style="margin-top:8px;">Sign Out</button>` : ''}
    <p style="color:var(--text3);font-size:.82em;margin-top:10px;">Your posts will appear here.</p>`;
}

// ── AUTH ──
function renderLogin(m) {
  m.innerHTML = `<div class="auth-p"><div class="auth-c">
    <h2>Welcome Back</h2>
    <div class="sub">Sign in to ZigHub</div>
    <div class="err" id="err"></div>
    <input class="input" id="le" type="email" placeholder="Email">
    <input class="input" id="lp" type="password" placeholder="Password">
    <button class="btn btn-p" onclick="hLogin()">Sign In</button>
    <div style="text-align:center;color:var(--text3);font-size:.75em;margin:10px 0;">or</div>
    <button class="btn btn-o" onclick="hGitHub()">🔵 GitHub</button>
    <div class="auth-switch">No account? <span onclick="navigate('signup')">Sign up</span></div>
  </div></div>`;
}

function renderSignup(m) {
  m.innerHTML = `<div class="auth-p"><div class="auth-c">
    <h2>Create Account</h2>
    <div class="sub">Join the Zig community</div>
    <div class="err" id="err"></div>
    <input class="input" id="sn" placeholder="Full name">
    <input class="input" id="se" type="email" placeholder="Email">
    <input class="input" id="sp" type="password" placeholder="Password (6+ chars)">
    <button class="btn btn-p" onclick="hSignup()">Create Account</button>
    <div style="text-align:center;color:var(--text3);font-size:.75em;margin:10px 0;">or</div>
    <button class="btn btn-o" onclick="hGitHub()">🔵 GitHub</button>
    <div class="auth-switch">Have an account? <span onclick="navigate('login')">Sign in</span></div>
  </div></div>`;
}

// ── Handlers ──
async function hLogin() {
  const e = document.getElementById('le')?.value;
  const p = document.getElementById('lp')?.value;
  if (!e||!p) return showErr('Fill all fields');
  const err = await authSignIn(e, p);
  if (err) return showErr(err);
  await loadAndRender();
}
async function hSignup() {
  const n = document.getElementById('sn')?.value;
  const e = document.getElementById('se')?.value;
  const p = document.getElementById('sp')?.value;
  if (!n||!e||!p) return showErr('Fill all fields');
  if (p.length<6) return showErr('Password too short');
  const err = await authSignUp(n, e, p);
  if (err) return showErr(err);
  await loadAndRender();
}
async function hGitHub() {
  await authGitHub();
  await loadAndRender();
}
function showErr(m) {
  const el = document.getElementById('err');
  if (el) { el.textContent = m; el.style.display = 'block'; }
}

function openNewPost() {
  if (!state.user) return navigate('login');
  document.getElementById('postModal').classList.add('on');
  document.getElementById('postText').value = '';
  document.getElementById('postCode').value = '';
}

async function submitPost() {
  const t = document.getElementById('postText').value;
  const c = document.getElementById('postCode').value;
  if (!t) return;
  await createPost(t, c);
  document.getElementById('postModal').classList.remove('on');
}

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  const hash = window.location.hash.slice(1);
  if (hash) state.view = hash;

  // Try Supabase if configured
  if (SUPABASE_URL && SUPABASE_KEY) {
    const ok = await initSupabase(SUPABASE_URL, SUPABASE_KEY);
    if (ok && supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) state.user = user;
    }
  }

  await loadAndRender();
});
