// ── Supabase Configuration ──
// 1. Go to https://supabase.com and sign up (free)
// 2. Create a new project
// 3. Go to Project Settings > API
// 4. Copy your URL and anon key below
// 5. Run schema.sql in the SQL Editor
// 6. Enable Email auth in Authentication > Providers

const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL',     // e.g. https://xyzabc.supabase.co
  anonKey: 'YOUR_ANON_KEY',     // e.g. eyJhbGciOiJIUzI1NiIs...
};

// ── Integration Guide ──
// To integrate Supabase into app.js:
//
// 1. Add this script to index.html <head>:
//    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
//
// 2. In app.js, initialize:
//    const supabase = window.supabase.createClient(
//      SUPABASE_CONFIG.url,
//      SUPABASE_CONFIG.anonKey
//    );
//
// 3. Auth functions:
//    // Sign up
//    const { data, error } = await supabase.auth.signUp({
//      email: 'user@email.com',
//      password: 'password123',
//    });
//
//    // Sign in
//    const { data, error } = await supabase.auth.signInWithPassword({
//      email: 'user@email.com',
//      password: 'password123',
//    });
//
//    // Sign out
//    await supabase.auth.signOut();
//
// 4. Database queries:
//    // Get posts with user profiles
//    const { data: posts } = await supabase
//      .from('posts')
//      .select('*, profiles(username, display_name, avatar_url)')
//      .order('created_at', { ascending: false });
//
//    // Create a post
//    const { data, error } = await supabase
//      .from('posts')
//      .insert({ content: 'Hello Zig!', code: '...' });
//
//    // Like a post
//    await supabase.from('likes').insert({ post_id: 1 });
//
//    // Realtime subscription
//    supabase
//      .channel('public:posts')
//      .on('postgres_changes',
//        { event: 'INSERT', schema: 'public', table: 'posts' },
//        payload => console.log('New post:', payload)
//      )
//      .subscribe();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}
