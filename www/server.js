const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Database Helpers
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: [], posts: [], stories: [], messages: {}, notifications: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db:', err);
    return { users: [], posts: [], stories: [], messages: {}, notifications: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing db:', err);
  }
}

// ─── API ROUTES ──────────────────────────────────────────

// Get all public app data
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json({
    users: db.users || [],
    posts: db.posts || [],
    stories: db.stories || [],
    messages: db.messages || {},
    notifications: db.notifications || []
  });
});

// Restore & Merge from client backup (prevents data loss when free container restarts)
app.post('/api/sync-restore', (req, res) => {
  const incoming = req.body;
  if (!incoming) return res.json({ success: false });

  const db = readDB();
  db.users = db.users || [];
  db.posts = db.posts || [];
  db.stories = db.stories || [];
  db.messages = db.messages || {};
  db.notifications = db.notifications || [];

  // Merge users
  if (Array.isArray(incoming.users)) {
    incoming.users.forEach(u => {
      const idx = db.users.findIndex(x => x.id === u.id || x.username.toLowerCase() === u.username.toLowerCase());
      if (idx > -1) {
        db.users[idx] = Object.assign({}, db.users[idx], u);
      } else {
        db.users.push(u);
      }
    });
  }

  // Merge posts
  if (Array.isArray(incoming.posts)) {
    incoming.posts.forEach(p => {
      const idx = db.posts.findIndex(x => x.id === p.id);
      if (idx > -1) {
        const mergedLikes = Array.from(new Set([...(db.posts[idx].likes || []), ...(p.likes || [])]));
        const mergedSaved = Array.from(new Set([...(db.posts[idx].saved || []), ...(p.saved || [])]));
        db.posts[idx] = Object.assign({}, db.posts[idx], p, { likes: mergedLikes, saved: mergedSaved });
      } else {
        db.posts.push(p);
      }
    });
    db.posts.sort((a, b) => b.ts - a.ts);
  }

  // Merge stories
  if (Array.isArray(incoming.stories)) {
    const now = Date.now();
    incoming.stories.forEach(s => {
      if (now - s.ts < 86400000) {
        const idx = db.stories.findIndex(x => x.id === s.id);
        if (idx === -1) db.stories.push(s);
      }
    });
  }

  // Merge messages
  if (incoming.messages && typeof incoming.messages === 'object') {
    Object.keys(incoming.messages).forEach(k => {
      if (!db.messages[k]) db.messages[k] = [];
      const existingIds = new Set(db.messages[k].map(m => m.id));
      (incoming.messages[k] || []).forEach(m => {
        if (!existingIds.has(m.id)) {
          db.messages[k].push(m);
        }
      });
      db.messages[k].sort((a, b) => a.ts - b.ts);
    });
  }

  writeDB(db);
  res.json({
    success: true,
    users: db.users,
    posts: db.posts,
    stories: db.stories,
    messages: db.messages
  });
});

// Register
app.post('/api/register', (req, res) => {
  const { username, fullname, email, password, avatar } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Tüm zorunlu alanları doldurun.' });
  }

  const db = readDB();
  db.users = db.users || [];

  if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
  }
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Bu e-posta ile zaten kayıt olunmuş.' });
  }

  const newUser = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    username,
    fullname: fullname || username,
    email,
    password,
    bio: '',
    website: '',
    avatar: avatar || '',
    followers: [],
    following: [],
    posts: [],
    stories: [],
    saved: [],
    created: Date.now()
  };

  db.users.push(newUser);
  writeDB(db);

  res.json({ success: true, user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Kullanıcı adı/e-posta ve şifre girin.' });
  }

  const db = readDB();
  const idLower = identifier.toLowerCase();
  const user = (db.users || []).find(
    u => (u.username.toLowerCase() === idLower || u.email.toLowerCase() === idLower) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  res.json({ success: true, user });
});

// Create Post
app.post('/api/posts', (req, res) => {
  const { post } = req.body;
  if (!post || !post.userId || !post.img) {
    return res.status(400).json({ error: 'Geçersiz gönderi verisi.' });
  }

  const db = readDB();
  db.posts = db.posts || [];
  db.posts.unshift(post);

  db.users = db.users || [];
  const u = db.users.find(x => x.id === post.userId);
  if (u) {
    u.posts = u.posts || [];
    u.posts.unshift(post.id);
  }

  writeDB(db);
  res.json({ success: true, post });
});

// Toggle Like Post
app.post('/api/posts/like', (req, res) => {
  const { postId, userId } = req.body;
  const db = readDB();
  const p = (db.posts || []).find(x => x.id === postId);
  if (!p) return res.status(404).json({ error: 'Gönderi bulunamadı.' });

  p.likes = p.likes || [];
  const idx = p.likes.indexOf(userId);
  let liked = false;
  if (idx > -1) {
    p.likes.splice(idx, 1);
  } else {
    p.likes.push(userId);
    liked = true;
    // Push notification
    if (p.userId !== userId) {
      db.notifications = db.notifications || [];
      db.notifications.unshift({
        id: 'n_' + Date.now().toString(36),
        type: 'like',
        fromUserId: userId,
        postId: p.id,
        toUserId: p.userId,
        ts: Date.now(),
        read: false
      });
    }
  }

  writeDB(db);
  res.json({ success: true, liked, likes: p.likes });
});

// Save / Unsave Post
app.post('/api/posts/save', (req, res) => {
  const { postId, userId } = req.body;
  const db = readDB();
  const p = (db.posts || []).find(x => x.id === postId);
  const u = (db.users || []).find(x => x.id === userId);
  if (!p || !u) return res.status(404).json({ error: 'Bulunamadı.' });

  p.saved = p.saved || [];
  u.saved = u.saved || [];

  const pi = p.saved.indexOf(userId);
  const ui = u.saved.indexOf(postId);
  let saved = false;

  if (pi > -1) p.saved.splice(pi, 1);
  else { p.saved.push(userId); saved = true; }

  if (ui > -1) u.saved.splice(ui, 1);
  else if (saved) u.saved.push(postId);

  writeDB(db);
  res.json({ success: true, saved });
});

// Comment on Post
app.post('/api/posts/comment', (req, res) => {
  const { postId, comment } = req.body;
  const db = readDB();
  const p = (db.posts || []).find(x => x.id === postId);
  if (!p) return res.status(404).json({ error: 'Gönderi bulunamadı.' });

  p.comments = p.comments || [];
  p.comments.push(comment);

  if (p.userId !== comment.userId) {
    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: 'n_' + Date.now().toString(36),
      type: 'comment',
      fromUserId: comment.userId,
      postId: p.id,
      toUserId: p.userId,
      ts: Date.now(),
      read: false
    });
  }

  writeDB(db);
  res.json({ success: true, comments: p.comments });
});

// Delete Post
app.post('/api/posts/delete', (req, res) => {
  const { postId, userId } = req.body;
  const db = readDB();
  db.posts = (db.posts || []).filter(p => p.id !== postId);

  const u = (db.users || []).find(x => x.id === userId);
  if (u && u.posts) {
    u.posts = u.posts.filter(id => id !== postId);
  }

  writeDB(db);
  res.json({ success: true });
});

// Create Story
app.post('/api/stories', (req, res) => {
  const { story } = req.body;
  if (!story || !story.userId) return res.status(400).json({ error: 'Geçersiz hikaye verisi.' });

  const db = readDB();
  db.stories = db.stories || [];
  db.stories.push(story);

  const u = (db.users || []).find(x => x.id === story.userId);
  if (u) {
    u.stories = u.stories || [];
    u.stories.push(story.id);
  }

  writeDB(db);
  res.json({ success: true, story });
});

// Follow / Unfollow
app.post('/api/follow', (req, res) => {
  const { myId, targetId } = req.body;
  const db = readDB();
  const me = (db.users || []).find(x => x.id === myId);
  const target = (db.users || []).find(x => x.id === targetId);
  if (!me || !target) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  me.following = me.following || [];
  target.followers = target.followers || [];

  const idx = me.following.indexOf(targetId);
  let following = false;
  if (idx > -1) {
    me.following.splice(idx, 1);
    const ti = target.followers.indexOf(myId);
    if (ti > -1) target.followers.splice(ti, 1);
  } else {
    me.following.push(targetId);
    target.followers.push(myId);
    following = true;

    db.notifications = db.notifications || [];
    db.notifications.unshift({
      id: 'n_' + Date.now().toString(36),
      type: 'follow',
      fromUserId: myId,
      toUserId: targetId,
      ts: Date.now(),
      read: false
    });
  }

  writeDB(db);
  res.json({ success: true, following });
});

// Update Profile
app.post('/api/profile', (req, res) => {
  const { userId, changes } = req.body;
  const db = readDB();
  const u = (db.users || []).find(x => x.id === userId);
  if (!u) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

  if (changes.username && changes.username.toLowerCase() !== u.username.toLowerCase()) {
    if (db.users.some(x => x.id !== userId && x.username.toLowerCase() === changes.username.toLowerCase())) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }
  }

  Object.assign(u, changes);
  writeDB(db);
  res.json({ success: true, user: u });
});

// Send Message
app.post('/api/messages', (req, res) => {
  const { key, message } = req.body;
  const db = readDB();
  db.messages = db.messages || {};
  if (!db.messages[key]) db.messages[key] = [];
  db.messages[key].push(message);

  writeDB(db);
  res.json({ success: true, message });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Aurastagram server running on port ${PORT}`);
});
