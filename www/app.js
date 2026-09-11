/* =========================================================
   AURASTAGRAM — Pure Vanilla JS Instagram Clone
   All data stored in localStorage. No backend required.
   ========================================================= */

// ─── STORAGE HELPERS ───────────────────────────────────────
const S = {
  get(k, def=null){ try{ const v=localStorage.getItem('ag_'+k); return v?JSON.parse(v):def; }catch{ return def; } },
  set(k,v){ localStorage.setItem('ag_'+k, JSON.stringify(v)); },
  del(k){ localStorage.removeItem('ag_'+k); }
};

// ─── IMAGE HELPERS ─────────────────────────────────────────
function toBase64(file, maxW=1080){ return new Promise(res=>{
  const r=new FileReader(); r.onload=e=>{
    const img=new Image(); img.onload=()=>{
      const c=document.createElement('canvas');
      const sc=Math.min(1,maxW/Math.max(img.width,img.height));
      c.width=img.width*sc; c.height=img.height*sc;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      res(c.toDataURL('image/jpeg',0.82));
    }; img.src=e.target.result;
  }; r.readAsDataURL(file);
});}

function avatarHtml(url, size=34){
  if(url) return `<img src="${url}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:50%" alt="" />`;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:#262626;display:flex;align-items:center;justify-content:center;color:#737373;font-size:${Math.round(size*.45)}px;font-weight:700;flex-shrink:0">👤</div>`;
}

function timeAgo(ts){
  const d=(Date.now()-ts)/1000;
  if(d<60) return 'Şimdi';
  if(d<3600) return Math.floor(d/60)+'dk';
  if(d<86400) return Math.floor(d/3600)+'s';
  if(d<604800) return Math.floor(d/86400)+'g';
  return new Date(ts).toLocaleDateString('tr-TR');
}

function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }

function showToast(msg, dur=2500){
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.transform='translateX(-50%) translateY(0)'; t.style.opacity='1';
  setTimeout(()=>{ t.style.transform='translateX(-50%) translateY(-80px)'; t.style.opacity='0'; },dur);
}

// ─── STATE ─────────────────────────────────────────────────
let currentUser = null;
let currentTab = 'home';
let activePostId = null;    // for comments
let storyQueue = [];        // [{userId, stories:[{img,caption,ts}]}]
let storyQueueIdx = 0;      // which user
let storyIdx = 0;           // which story in user group
let storyTimer = null;
let createStep = 0;         // 0=pick, 1=filter, 2=share
let createImgB64 = null;
let createFilter = 'none';
let storyImgB64 = null;
let viewingProfileId = null;
let chatPartnerId = null;
let optionsCallback = null;

// ─── API & DATA SYNC ──────────────────────────────────────
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'https://aurastagram.onrender.com';
const DATA_VERSION = 'v3';

function generateDefaultAvatar(name){
  const initial = (name || 'U').charAt(0).toUpperCase();
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="%23262626"/><text x="50" y="55" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="44" font-weight="bold" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text></svg>`;
}

async function apiCall(endpoint, method='GET', body=null){
  try {
    const opts = { method, headers: {} };
    if(body){
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(API_BASE + endpoint, opts);
    return await res.json();
  } catch(e) {
    return null;
  }
}

async function syncData(silent = false){
  const data = await apiCall('/api/data');
  if(data && data.users){
    S.set('users', data.users);
    S.set('posts', data.posts || []);
    S.set('stories', data.stories || []);
    S.set('messages', data.messages || {});
    S.set('notifications', data.notifications || []);

    if(currentUser){
      const refreshed = data.users.find(u => u.id === currentUser.id);
      if(refreshed){
        currentUser = refreshed;
      }
    }

    if(!silent && currentUser){
      if(currentTab === 'home'){ renderStories(); renderFeed(); }
      else if(currentTab === 'explore'){ renderExplore(); }
      else if(currentTab === 'profile'){ renderProfile(); }
      else if(currentTab === 'direct'){
        if(chatPartnerId) renderChatMessages();
        else renderDM();
      }
      else if(currentTab === 'notifications'){ renderNotifications(); }
      renderDMBadge();
      renderNotifBadge();
    }
  }
}

function initData(){
  if(S.get('data_version') !== DATA_VERSION){
    localStorage.clear();
    S.set('data_version', DATA_VERSION);
  }
  if(!S.get('users')) S.set('users', []);
  if(!S.get('posts')) S.set('posts', []);
  if(!S.get('stories')) S.set('stories', []);
  if(!S.get('messages')) S.set('messages', {});
  if(!S.get('notifications')) S.set('notifications', []);
}

function getUsers(){ return S.get('users',[]); }
function getPosts(){ return S.get('posts',[]); }
function getStories(){ return S.get('stories',[]); }
function getUser(id){ return getUsers().find(u=>u.id===id)||null; }
function getPost(id){ return getPosts().find(p=>p.id===id)||null; }

function saveUsers(arr){ S.set('users',arr); }
function savePosts(arr){ S.set('posts',arr); }
function saveStories(arr){ S.set('stories',arr); }

function updateUser(id, changes){
  const arr=getUsers(); const i=arr.findIndex(u=>u.id===id);
  if(i<0) return; Object.assign(arr[i],changes); saveUsers(arr);
  if(currentUser&&currentUser.id===id) currentUser=arr[i];
}
function updatePost(id, changes){
  const arr=getPosts(); const i=arr.findIndex(p=>p.id===id);
  if(i<0) return; Object.assign(arr[i],changes); savePosts(arr);
}

// ─── PUSH NOTIFICATION ─────────────────────────────────────
function pushNotif(toUserId, type, fromUserId, postId=null){
  if(toUserId===fromUserId) return;
  const notifs=S.get('notifications',[]);
  notifs.unshift({id:uid(),type,fromUserId,postId,toUserId,ts:Date.now(),read:false});
  S.set('notifications',notifs.slice(0,100));
  if(currentUser&&currentUser.id===toUserId) renderNotifBadge();
}

// ─── AUTH ───────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const id=document.getElementById('login-identifier').value.trim();
  const pw=document.getElementById('login-password').value;
  if(!id||!pw){ showAuthError('login','Lütfen tüm alanları doldurun.'); return; }

  // 1. Try server login
  const res = await apiCall('/api/login', 'POST', { identifier: id, password: pw });
  if(res && res.success && res.user){
    doLogin(res.user);
    await syncData(true);
    return;
  } else if(res && res.error){
    showAuthError('login', res.error);
    return;
  }

  // 2. Offline fallback
  const users=getUsers();
  const u=users.find(x=>(x.username.toLowerCase()===id.toLowerCase()||x.email.toLowerCase()===id.toLowerCase())&&x.password===pw);
  if(!u){ showAuthError('login','Kullanıcı adı veya şifre hatalı.'); return; }
  doLogin(u);
});

document.getElementById('register-form').addEventListener('submit', async e=>{
  e.preventDefault();
  const email=document.getElementById('reg-email').value.trim().toLowerCase();
  const fullname=document.getElementById('reg-fullname').value.trim();
  const username=document.getElementById('reg-username').value.trim().toLowerCase();
  const password=document.getElementById('reg-password').value;
  const avatarImg=document.getElementById('reg-av-preview');
  const avatar=(avatarImg && avatarImg.src && !avatarImg.src.endsWith('#') && avatarImg.style.display !== 'none') ? avatarImg.src : generateDefaultAvatar(username);

  if(!email||!fullname||!username||!password){ showAuthError('reg','Tüm alanları doldurun.'); return; }
  if(password.length<6){ showAuthError('reg','Şifre en az 6 karakter olmalı.'); return; }
  if(!/^[a-z0-9_.]+$/.test(username)){ showAuthError('reg','Kullanıcı adı sadece harf, rakam, nokta ve alt çizgi içerebilir.'); return; }

  // 1. Try server register
  const res = await apiCall('/api/register', 'POST', { username, fullname, email, password, avatar });
  if(res && res.success && res.user){
    const users = getUsers();
    users.push(res.user);
    saveUsers(users);
    doLogin(res.user);
    await syncData(true);
    showToast('Hoş geldin, @' + username + '!');
    return;
  } else if(res && res.error){
    showAuthError('reg', res.error);
    return;
  }

  // 2. Offline fallback
  const users=getUsers();
  if(users.find(u=>u.username===username)){ showAuthError('reg','Bu kullanıcı adı alınmış.'); return; }
  if(users.find(u=>u.email===email)){ showAuthError('reg','Bu e-posta ile zaten kayıt var.'); return; }

  const newUser={id:'u_'+uid(),username,fullname,email,password,bio:'',website:'',
    avatar,
    followers:[],following:[],posts:[],stories:[],saved:[],created:Date.now()};
  users.push(newUser); saveUsers(users);
  doLogin(newUser);
  showToast('Hoş geldin, @' + username + '!');
});

function showAuthError(form, msg){
  const el=document.getElementById(form==='login'?'login-error':'reg-error');
  const txt=document.getElementById(form==='login'?'login-error-text':'reg-error-text');
  el.style.display='flex'; txt.textContent=msg;
}

function previewRegAvatar(input){
  if(!input.files[0]) return;
  toBase64(input.files[0],200).then(b64=>{
    const img=document.getElementById('reg-av-preview');
    img.src=b64; img.style.display='block';
    document.querySelector('#av-circle svg')&&(document.querySelector('#av-circle svg').style.display='none');
  });
}

function doLogin(user){
  currentUser=user;
  S.set('currentUserId', user.id);
  document.getElementById('auth-wrapper').style.display='none';
  document.getElementById('main-app').style.display='flex';
  document.getElementById('main-app').style.flexDirection='column';
  document.getElementById('main-app').style.height='100vh';
  // update nav avatar
  const na=document.getElementById('nav-avatar');
  na.src=user.avatar||generateDefaultAvatar(user.username);
  na.style.display='block';
  renderNotifBadge();
  switchTab('home');
}

function showLogin(){ document.getElementById('login-screen').style.display='flex'; document.getElementById('register-screen').style.display='none'; }
function showRegister(){ document.getElementById('login-screen').style.display='none'; document.getElementById('register-screen').style.display='flex'; }

// ─── AUTO-LOGIN & LIVE SYNC ────────────────────────────────
(async function(){
  initData();
  await syncData(true);
  const savedId=S.get('currentUserId');
  if(savedId){
    const u=getUser(savedId);
    if(u){ doLogin(u); }
    else { document.getElementById('login-screen').style.display='flex'; }
  } else {
    document.getElementById('login-screen').style.display='flex';
  }
  // Sync live every 4 seconds so other registered users & posts show up automatically
  setInterval(() => syncData(false), 4000);
})();

// ─── TAB NAVIGATION ─────────────────────────────────────────
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll('.tab-view').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el=>el.classList.remove('active'));

  const tabEl=document.getElementById('tab-'+tab);
  if(tabEl) tabEl.classList.add('active');
  const navEl=document.getElementById('nav-'+tab);
  if(navEl) navEl.classList.add('active');

  // Show/hide header for certain tabs
  const header=document.getElementById('top-header');
  const showHeader=['home','explore'].includes(tab);
  header.style.display=showHeader?'flex':'none';

  // Scroll to top
  document.getElementById('main-scroll').scrollTop=0;

  if(tab==='home'){ renderStories(); renderFeed(); }
  else if(tab==='explore'){ renderExplore(); }
  else if(tab==='reels'){ renderReels(); }
  else if(tab==='profile'){ viewingProfileId=currentUser.id; renderProfile(); }
  else if(tab==='direct'){ renderDM(); }
  else if(tab==='notifications'){ renderNotifications(); }
}

function openMyProfile(){ viewingProfileId=currentUser.id; switchTab('profile'); }

// ─── STORIES ────────────────────────────────────────────────
function renderStories(){
  const bar=document.getElementById('stories-bar');
  const users=getUsers();
  const stories=getStories();
  const now=Date.now();
  let html='';

  // My story first
  const myStories=stories.filter(s=>s.userId===currentUser.id&&now-s.ts<86400000);
  html+=`<div class="story-item" onclick="openCreateStory()">
    <div class="story-ring ${myStories.length?'':'seen'}" style="position:relative">
      <div class="story-ring-inner">${avatarHtml(currentUser.avatar,56)}</div>
      <span class="story-add-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
    </div>
    <span class="story-username">Hikayeniz</span>
  </div>`;

  // Others' stories
  const me=currentUser;
  const storyUsers=users.filter(u=>u.id!==me.id&&u.stories&&u.stories.length);
  storyUsers.forEach(u=>{
    const uStories=stories.filter(s=>s.userId===u.id&&now-s.ts<86400000);
    if(!uStories.length) return;
    const allSeen=uStories.every(s=>s.viewers&&s.viewers.includes(me.id));
    html+=`<div class="story-item" onclick="openStories('${u.id}')">
      <div class="story-ring ${allSeen?'seen':''}">
        <div class="story-ring-inner">${avatarHtml(u.avatar,56)}</div>
      </div>
      <span class="story-username">${esc(u.username)}</span>
    </div>`;
  });

  bar.innerHTML=html;
}

// ─── FEED ───────────────────────────────────────────────────
function renderFeed(){
  const feed=document.getElementById('feed-list');
  const allPosts=getPosts().sort((a,b)=>b.ts-a.ts);
  const me=currentUser;
  const users=getUsers();

  // If user is following someone, show posts from self + following. If following is empty, show all posts so feed is alive!
  const visible = (me.following && me.following.length > 0)
    ? allPosts.filter(p=>p.userId===me.id||me.following.includes(p.userId))
    : allPosts;

  if(!visible.length){
    const otherUsers = users.filter(u=>u.id!==me.id);
    feed.innerHTML=`<div class="empty-state" style="padding:32px 16px">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <h3>Akışın Boş</h3>
      <p>Henüz gönderi yok. İlk gönderini paylaş veya diğer kullanıcıları takip et!</p>
      ${otherUsers.length ? `
        <div style="margin-top:20px;width:100%">
          <div style="font-size:12px;font-weight:700;color:#a8a8a8;text-transform:uppercase;margin-bottom:12px;text-align:left">Kayıtlı Kullanıcılar</div>
          ${otherUsers.map(u=>`
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #1a1a1a">
              <div onclick="viewProfile('${u.id}')" style="cursor:pointer">${avatarHtml(u.avatar, 40)}</div>
              <div style="flex:1;text-align:left;cursor:pointer" onclick="viewProfile('${u.id}')">
                <div style="font-weight:600;font-size:13px">${esc(u.username)}</div>
                <div style="font-size:11px;color:#737373">${esc(u.fullname)}</div>
              </div>
              <button onclick="toggleFollow('${u.id}');renderFeed();" style="background:#0095f6;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">Takip Et</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>`;
    return;
  }
  feed.innerHTML=visible.map(p=>postCardHtml(p,me)).join('');
  // attach double-tap
  document.querySelectorAll('.post-media').forEach(el=>{
    let last=0;
    el.addEventListener('click',()=>{
      const now=Date.now(); if(now-last<300){ toggleLike(el.dataset.postId); }
      last=now;
    });
  });
}

function postCardHtml(p, me){
  const author=getUser(p.userId); if(!author) return '';
  const liked=p.likes.includes(me.id);
  const saved=(p.saved||[]).includes(me.id);
  const count=p.likes.length;
  const commentCount=p.comments.length;
  const filterStyle=filterCSS(p.filter||'none');
  return `<div class="post-card" id="post-${p.id}">
    <div class="post-header">
      <div class="post-user" onclick="viewProfile('${author.id}')">
        <div class="post-avatar-ring"><div class="post-avatar-inner">${avatarHtml(author.avatar,30)}</div></div>
        <div>
          <div class="post-username">${esc(author.username)}</div>
          ${p.location?`<div class="post-location">${esc(p.location)}</div>`:''}
        </div>
      </div>
      <button class="post-more" onclick="openPostOptions('${p.id}')">
        <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>
    <div class="post-media" data-post-id="${p.id}" onclick="handlePostClick(event,'${p.id}')">
      <img src="${p.img}" alt="" style="${filterStyle};width:100%;height:100%;object-fit:cover;display:block" />
      <div class="heart-burst" id="hb-${p.id}">
        <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
    </div>
    <div class="post-actions">
      <div class="post-left-actions">
        <button class="action-btn ${liked?'liked':''}" onclick="toggleLike('${p.id}')" id="like-btn-${p.id}">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="action-btn" onclick="openComments('${p.id}')">
          <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button class="action-btn" style="transform:rotate(-12deg)">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <button class="action-btn ${saved?'saved':''}" onclick="toggleSave('${p.id}')" id="save-btn-${p.id}">
        <svg viewBox="0 0 24 24"><polygon points="19 21 12 16 5 21 5 3 19 3"/></svg>
      </button>
    </div>
    ${count?`<div class="post-likes">${count} beğeni</div>`:''}
    ${p.caption?`<div class="post-caption"><strong onclick="viewProfile('${author.id}')">${esc(author.username)}</strong>${esc(p.caption)}</div>`:''}
    ${commentCount?`<div class="post-comments-link" onclick="openComments('${p.id}')">Tüm ${commentCount} yorumu gör</div>`:''}
    <div class="post-time">${timeAgo(p.ts)}</div>
  </div>`;
}

function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

let lastClickTime={};
function handlePostClick(e, postId){
  const now=Date.now();
  if(lastClickTime[postId]&&now-lastClickTime[postId]<300){ triggerLikeAnim(postId); toggleLike(postId); }
  lastClickTime[postId]=now;
}

function triggerLikeAnim(postId){
  const hb=document.getElementById('hb-'+postId); if(!hb) return;
  hb.style.display='block'; hb.classList.remove('animate');
  void hb.offsetWidth; hb.classList.add('animate');
  setTimeout(()=>hb.classList.remove('animate'),900);
}

function toggleLike(postId){
  const posts=getPosts(); const pi=posts.findIndex(p=>p.id===postId); if(pi<0) return;
  const p=posts[pi]; const me=currentUser.id;
  const li=p.likes.indexOf(me);
  if(li>-1){ p.likes.splice(li,1); } else { p.likes.push(me); pushNotif(p.userId,'like',me,postId); }
  savePosts(posts);
  // Update UI
  const btn=document.getElementById('like-btn-'+postId);
  if(btn){ btn.classList.toggle('liked', li<0); }
  const likeEl=document.querySelector(`#post-${postId} .post-likes`);
  if(likeEl){ likeEl.textContent=p.likes.length?p.likes.length+' beğeni':''; }
  apiCall('/api/posts/like', 'POST', { postId, userId: me });
}

function toggleSave(postId){
  const posts=getPosts(); const pi=posts.findIndex(p=>p.id===postId); if(pi<0) return;
  const p=posts[pi]; const me=currentUser.id;
  const si=(p.saved||[]).indexOf(me);
  if(!p.saved) p.saved=[];
  if(si>-1){ p.saved.splice(si,1); showToast('Kaydedilenlerden kaldırıldı'); }
  else { p.saved.push(me); showToast('Kaydedildi ✓'); }
  savePosts(posts);
  const btn=document.getElementById('save-btn-'+postId);
  if(btn) btn.classList.toggle('saved', si<0);
  // update user saved list
  const users=getUsers(); const ui=users.findIndex(u=>u.id===me);
  if(ui>-1){ if(!users[ui].saved) users[ui].saved=[];
    const idx=users[ui].saved.indexOf(postId);
    if(idx>-1) users[ui].saved.splice(idx,1); else users[ui].saved.push(postId);
    saveUsers(users); if(currentUser.id===me) currentUser=users[ui];
  }
  apiCall('/api/posts/save', 'POST', { postId, userId: me });
}

// ─── COMMENTS ───────────────────────────────────────────────
function openComments(postId){
  activePostId=postId;
  renderCommentsList();
  const modal=document.getElementById('comments-modal');
  modal.style.display='flex';
  const inp=document.getElementById('comment-input');
  inp.value=''; inp.focus();
  const btn=document.getElementById('comment-post-btn');
  btn.style.opacity='0.5'; btn.disabled=true;
  inp.oninput=()=>{ btn.disabled=!inp.value.trim(); btn.style.opacity=inp.value.trim()?'1':'0.5'; };
  // my avatar
  const a=document.getElementById('comment-input-avatar'); a.src=currentUser.avatar||'';
}

function renderCommentsList(){
  const p=getPost(activePostId); if(!p) return;
  const list=document.getElementById('comments-list');
  if(!p.comments.length){ list.innerHTML='<div style="text-align:center;color:#737373;font-size:12px;padding:32px">Henüz yorum yok. İlk yorumu sen yap!</div>'; return; }
  list.innerHTML=p.comments.map(c=>{
    const u=getUser(c.userId); if(!u) return '';
    const liked=(c.likes||[]).includes(currentUser.id);
    return `<div style="display:flex;gap:10px">
      ${avatarHtml(u.avatar,30)}
      <div style="flex:1;font-size:12px">
        <strong style="font-weight:600;color:#fff;margin-right:4px">${esc(u.username)}</strong><span style="color:#e0e0e0">${esc(c.text)}</span>
        <div style="display:flex;gap:12px;margin-top:4px">
          <span style="color:#737373;font-size:10px">${timeAgo(c.ts)}</span>
          <button style="color:#737373;font-size:10px;font-weight:600;cursor:pointer;background:none;border:none">Yanıtla</button>
          <button onclick="toggleCommentLike('${p.id}','${c.id}')" style="background:none;border:none;cursor:pointer;margin-left:auto;color:${liked?'#ff3040':'#737373'}" id="cl-${c.id}">
            <svg viewBox="0 0 24 24" width="12" height="12" ${liked?'fill="#ff3040" stroke="#ff3040"':''}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function closeComments(){ document.getElementById('comments-modal').style.display='none'; activePostId=null; }

function postComment(){
  const inp=document.getElementById('comment-input');
  const text=inp.value.trim(); if(!text||!activePostId) return;
  const posts=getPosts(); const pi=posts.findIndex(p=>p.id===activePostId); if(pi<0) return;
  const c={id:'c_'+uid(),userId:currentUser.id,text,ts:Date.now(),likes:[]};
  posts[pi].comments.push(c);
  savePosts(posts);
  pushNotif(posts[pi].userId,'comment',currentUser.id,activePostId);
  inp.value='';
  document.getElementById('comment-post-btn').disabled=true;
  document.getElementById('comment-post-btn').style.opacity='0.5';
  renderCommentsList();
  const list=document.getElementById('comments-list'); list.scrollTop=list.scrollHeight;
  apiCall('/api/posts/comment', 'POST', { postId: activePostId, comment: c });
}

function addEmoji(emoji){
  const inp=document.getElementById('comment-input'); inp.value+=emoji;
  document.getElementById('comment-post-btn').disabled=false;
  document.getElementById('comment-post-btn').style.opacity='1';
}

function toggleCommentLike(postId,commentId){
  const posts=getPosts(); const pi=posts.findIndex(p=>p.id===postId); if(pi<0) return;
  const ci=posts[pi].comments.findIndex(c=>c.id===commentId); if(ci<0) return;
  if(!posts[pi].comments[ci].likes) posts[pi].comments[ci].likes=[];
  const li=posts[pi].comments[ci].likes.indexOf(currentUser.id);
  if(li>-1) posts[pi].comments[ci].likes.splice(li,1);
  else posts[pi].comments[ci].likes.push(currentUser.id);
  savePosts(posts);
  renderCommentsList();
}

// ─── STORY VIEWER ───────────────────────────────────────────
function openStories(userId){
  const stories=getStories().filter(s=>s.userId===userId&&Date.now()-s.ts<86400000);
  if(!stories.length){ showToast('Hikaye bulunamadı'); return; }
  storyQueue=[{userId, stories}]; storyQueueIdx=0; storyIdx=0;
  showCurrentStory();
  document.getElementById('story-viewer').style.display='flex';
  document.getElementById('story-viewer').style.flexDirection='column';
}

function showCurrentStory(){
  const group=storyQueue[storyQueueIdx]; if(!group) return closeStoryViewer();
  const story=group.stories[storyIdx]; if(!story) return closeStoryViewer();
  const u=getUser(group.userId); if(!u) return closeStoryViewer();

  document.getElementById('sv-avatar').src=u.avatar||'';
  document.getElementById('sv-name').textContent=u.username;
  document.getElementById('sv-time').textContent=timeAgo(story.ts);
  document.getElementById('sv-img').src=story.img||'';
  const capEl=document.getElementById('sv-caption');
  capEl.innerHTML=story.caption?`<span style="background:rgba(0,0,0,.6);backdrop-filter:blur(4px);padding:6px 14px;border-radius:12px;font-size:13px;color:#fff">${esc(story.caption)}</span>`:'';

  // Mark viewed
  const stories=getStories(); const si=stories.findIndex(s=>s.id===story.id);
  if(si>-1&&!(stories[si].viewers||[]).includes(currentUser.id)){
    if(!stories[si].viewers) stories[si].viewers=[];
    stories[si].viewers.push(currentUser.id); saveStories(stories);
  }

  // progress bars
  const bar=document.getElementById('story-progress-bar');
  bar.innerHTML=group.stories.map((_,i)=>`<div style="flex:1;height:2px;background:${i<storyIdx?'#fff':'rgba(255,255,255,.3)'};border-radius:2px;overflow:hidden">
    <div id="spfill-${i}" style="height:100%;background:#fff;width:${i<storyIdx?'100':i===storyIdx?'0':'0'}%;transition:width .05s linear"></div>
  </div>`).join('');

  clearInterval(storyTimer);
  let pct=0;
  storyTimer=setInterval(()=>{
    pct+=0.5;
    const fill=document.getElementById('spfill-'+storyIdx);
    if(fill) fill.style.width=pct+'%';
    if(pct>=100){ clearInterval(storyTimer); storyNext(); }
  },25);

  // heart button
  const liked=(story.likes||[]).includes(currentUser.id);
  const hb=document.getElementById('sv-heart-btn');
  hb.querySelector('svg').setAttribute('fill', liked?'#ff3040':'none');
  hb.querySelector('svg').setAttribute('stroke', liked?'#ff3040':'currentColor');
}

function storyNext(){
  clearInterval(storyTimer);
  const group=storyQueue[storyQueueIdx];
  if(storyIdx<group.stories.length-1){ storyIdx++; showCurrentStory(); }
  else if(storyQueueIdx<storyQueue.length-1){ storyQueueIdx++; storyIdx=0; showCurrentStory(); }
  else closeStoryViewer();
}
function storyPrev(){ clearInterval(storyTimer); if(storyIdx>0){ storyIdx--; showCurrentStory(); } }
function closeStoryViewer(){ clearInterval(storyTimer); document.getElementById('story-viewer').style.display='none'; }
function toggleStoryHeart(){
  const group=storyQueue[storyQueueIdx]; if(!group) return;
  const story=group.stories[storyIdx]; if(!story) return;
  const stories=getStories(); const si=stories.findIndex(s=>s.id===story.id); if(si<0) return;
  if(!stories[si].likes) stories[si].likes=[];
  const li=stories[si].likes.indexOf(currentUser.id);
  if(li>-1) stories[si].likes.splice(li,1); else stories[si].likes.push(currentUser.id);
  saveStories(stories);
  group.stories[storyIdx]=stories[si];
  const liked=li<0;
  const hb=document.getElementById('sv-heart-btn');
  hb.querySelector('svg').setAttribute('fill',liked?'#ff3040':'none');
  hb.querySelector('svg').setAttribute('stroke',liked?'#ff3040':'currentColor');
}

// ─── EXPLORE ────────────────────────────────────────────────
function renderExplore(){
  document.getElementById('search-input').value='';
  document.getElementById('search-clear').style.display='none';
  renderExploreGrid();
}

function renderExploreGrid(){
  const posts=getPosts().sort(()=>Math.random()-.5);
  const container=document.getElementById('explore-content');
  const users=getUsers().filter(u=>u.id!==currentUser.id);

  let html = '';
  if(users.length > 0){
    html += '<div style="padding:12px 16px 6px;font-size:12px;font-weight:700;color:#a8a8a8;text-transform:uppercase;letter-spacing:0.5px">Kayıtlı Kullanıcılar</div>';
    html += '<div style="display:flex;gap:12px;overflow-x:auto;padding:6px 16px 14px;scrollbar-width:none">';
    users.forEach(u => {
      const isFollowing = currentUser.following.includes(u.id);
      html += `<div style="display:flex;flex-direction:column;align-items:center;min-width:90px;background:#181818;border:1px solid #262626;border-radius:12px;padding:12px 8px;cursor:pointer" onclick="viewProfile('${u.id}')">
        ${avatarHtml(u.avatar, 52)}
        <div style="font-size:12px;font-weight:600;color:#fff;margin-top:6px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(u.username)}</div>
        <div style="font-size:10px;color:#737373;margin-bottom:8px">${u.followers.length} takipçi</div>
        <button onclick="event.stopPropagation();toggleFollow('${u.id}');renderExploreGrid();" style="background:${isFollowing?'#262626':'#0095f6'};border:none;color:#fff;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">${isFollowing?'Takip':'Takip Et'}</button>
      </div>`;
    });
    html += '</div>';
  }

  if(!posts.length){
    html += '<div class="empty-state"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>İçerik Yok</h3><p>Yeni fotoğraflar paylaşıldığında burada görünecek.</p></div>';
    container.innerHTML = html;
    return;
  }
  html += '<div class="explore-grid">';
  posts.forEach((p,i)=>{
    const large=(i%10===0);
    html+=`<div class="explore-cell${large?' large':''}" onclick="openPostInExplore('${p.id}')">
      <img src="${p.img}" alt="" loading="lazy" />
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function openPostInExplore(postId){
  const p=getPost(postId); if(!p) return;
  const author=getUser(p.userId); if(!author) return;
  openComments(postId);
}

function handleSearch(q){
  q=q.trim();
  document.getElementById('search-clear').style.display=q?'block':'none';
  if(!q){ renderExploreGrid(); return; }
  const users=getUsers().filter(u=>u.id!==currentUser.id&&(u.username.includes(q)||u.fullname.toLowerCase().includes(q.toLowerCase())));
  const cont=document.getElementById('explore-content');
  if(!users.length){ cont.innerHTML='<div class="empty-state"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>Sonuç Bulunamadı</h3><p>"'+esc(q)+'" için sonuç yok.</p></div>'; return; }
  cont.innerHTML=users.map(u=>{
    const following=currentUser.following.includes(u.id);
    return `<div class="user-result" onclick="viewProfile('${u.id}')">
      ${avatarHtml(u.avatar,44)}
      <div style="flex:1">
        <div class="user-result-name">${esc(u.username)}</div>
        <div class="user-result-sub">${esc(u.fullname)} · ${u.followers.length} takipçi</div>
      </div>
      <button onclick="event.stopPropagation();toggleFollow('${u.id}')" style="background:${following?'#262626':'#0095f6'};border:none;color:#fff;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer" id="fb-${u.id}">${following?'Takip Ediliyor':'Takip Et'}</button>
    </div>`;
  }).join('');
}

function clearSearch(){ document.getElementById('search-input').value=''; handleSearch(''); }

// ─── REELS ──────────────────────────────────────────────────
let reelIdx=0;
function renderReels(){
  const posts=getPosts().filter(p=>p.img); // use posts as reels (images)
  const container=document.getElementById('reels-view');
  if(!posts.length){ container.innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:#fff"><svg viewBox="0 0 24 24" style="width:60px;height:60px;color:#737373"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg><h3>Reel Yok</h3><p style="color:#737373;font-size:12px">Henüz paylaşılan içerik yok.</p></div>'; return; }
  if(reelIdx>=posts.length) reelIdx=0;
  const p=posts[reelIdx];
  const author=getUser(p.userId); if(!author) return;
  const liked=p.likes.includes(currentUser.id);
  const meFollowing=currentUser.following.includes(author.id);

  container.innerHTML=`
    <div class="reel-card">
      <img class="reel-bg" src="${p.img}" alt="" style="filter:${filterCSS(p.filter||'none')}" />
      <div class="reel-gradient"></div>
      <div class="reels-top-bar">
        <span class="reels-top-title">Reels</span>
        <svg viewBox="0 0 24 24" style="width:22px;height:22px;color:#fff;cursor:pointer"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </div>
      <div class="reel-side">
        <div class="reel-action">
          <button class="reel-action-btn ${liked?'liked':''}" id="reel-like-btn" onclick="reelLike('${p.id}')">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <span class="reel-action-count">${p.likes.length||''}</span>
        </div>
        <div class="reel-action">
          <button class="reel-action-btn" onclick="openComments('${p.id}')">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <span class="reel-action-count">${p.comments.length||''}</span>
        </div>
        <div class="reel-action">
          <button class="reel-action-btn">
            <svg viewBox="0 0 24 24" style="transform:rotate(-12deg)"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div class="reel-disc" onclick="viewProfile('${author.id}')">
          <img src="${author.avatar||''}" alt="" />
        </div>
      </div>
      <div class="reel-bottom">
        <div class="reel-user">
          <img class="reel-user-avatar" src="${author.avatar||''}" onclick="viewProfile('${author.id}')" alt="" />
          <span class="reel-username">@${esc(author.username)}</span>
          ${author.id!==currentUser.id?`<button class="follow-pill" id="reel-follow-btn" onclick="reelFollow('${author.id}')">${meFollowing?'Takip Ediliyor':'Takip Et'}</button>`:''}
        </div>
        ${p.caption?`<div class="reel-caption">${esc(p.caption)}</div>`:''}
        <div class="reel-audio"><svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> Orijinal ses</div>
      </div>
    </div>`;

  // swipe
  let sy=0;
  container.ontouchstart=e=>sy=e.touches[0].clientY;
  container.ontouchend=e=>{ const dy=sy-e.changedTouches[0].clientY; if(Math.abs(dy)>50){ if(dy>0) reelIdx=Math.min(reelIdx+1,posts.length-1); else reelIdx=Math.max(reelIdx-1,0); renderReels(); } };
}

function reelLike(postId){ toggleLike(postId); renderReels(); }
function reelFollow(userId){ toggleFollow(userId); renderReels(); }

// ─── PROFILE ────────────────────────────────────────────────
function viewProfile(userId){
  viewingProfileId=userId;
  switchTab('profile');
  renderProfile();
}

function renderProfile(){
  const userId=viewingProfileId||currentUser.id;
  const u=getUser(userId); if(!u) return;
  const isMe=u.id===currentUser.id;
  const amFollowing=currentUser.following.includes(u.id);
  const posts=getPosts().filter(p=>p.userId===u.id).sort((a,b)=>b.ts-a.ts);
  const cont=document.getElementById('profile-content');

  cont.innerHTML=`
    <div class="profile-header-bar">
      ${!isMe?`<button class="icon-btn" onclick="switchTab('home')"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>`:'<div></div>'}
      <h2>${esc(u.username)}</h2>
      <div style="display:flex;gap:8px">
        ${isMe?`
          <button class="icon-btn" onclick="openCreatePost()"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></button>
          <button class="icon-btn" onclick="openProfileOptions()"><svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
        `:'<div></div>'}
      </div>
    </div>
    <div class="profile-top">
      <div style="display:flex;align-items:center">
        <div style="cursor:pointer" ${isMe?'onclick="openEditProfile()"':''}>
          <div class="profile-avatar-ring">
            <div class="profile-avatar-inner">${avatarHtml(u.avatar,72)}</div>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item"><span class="stat-num">${posts.length}</span><span class="stat-label">gönderi</span></div>
          <div class="stat-item" onclick="showFollowers('${u.id}')"><span class="stat-num">${u.followers.length}</span><span class="stat-label">takipçi</span></div>
          <div class="stat-item" onclick="showFollowing('${u.id}')"><span class="stat-num">${u.following.length}</span><span class="stat-label">takip</span></div>
        </div>
      </div>
      <div class="profile-name">${esc(u.fullname||u.username)}</div>
      ${u.bio?`<div class="profile-bio-text">${esc(u.bio)}</div>`:''}
      ${u.website?`<a href="${esc(u.website)}" class="profile-website" target="_blank">${esc(u.website)}</a>`:''}
      <div class="profile-actions">
        ${isMe?`
          <button class="btn btn-secondary" style="flex:1" onclick="openEditProfile()">Profili Düzenle</button>
          <button class="btn btn-secondary" style="flex:1" onclick="showToast('Yakında!')">Profili Paylaş</button>
        `:`
          <button class="btn ${amFollowing?'btn-secondary':'btn-primary'}" style="flex:1" id="prof-follow-btn" onclick="toggleFollowProfile('${u.id}')">${amFollowing?'Takip Ediliyor':'Takip Et'}</button>
          <button class="btn btn-secondary" style="flex:1" onclick="openChat('${u.id}')">Mesaj</button>
          <button class="btn btn-secondary" style="width:40px;padding:7px" onclick="showToast('Yakında!')"><svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></button>
        `}
      </div>
    </div>
    <div class="profile-tabs">
      <button class="profile-tab active" id="ptab-grid" onclick="switchProfileTab('grid')">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      </button>
      ${isMe?`<button class="profile-tab" id="ptab-saved" onclick="switchProfileTab('saved')">
        <svg viewBox="0 0 24 24"><polygon points="19 21 12 16 5 21 5 3 19 3"/></svg>
      </button>`:''}
    </div>
    <div id="profile-posts-grid">${renderProfileGrid(posts)}</div>
    ${isMe?`<div id="profile-saved-grid" style="display:none">${renderSavedGrid()}</div>`:''}
  `;
}

function renderProfileGrid(posts){
  if(!posts.length) return `<div style="text-align:center;padding:40px 24px;color:#737373;font-size:12px"><strong style="display:block;color:#fff;font-size:14px;margin-bottom:6px">Henüz Gönderi Yok</strong>Paylaşmaya başla!</div>`;
  return `<div class="profile-grid">${posts.map(p=>`<div class="profile-grid-cell" onclick="openComments('${p.id}')"><img src="${p.img}" alt="" loading="lazy" /></div>`).join('')}</div>`;
}

function renderSavedGrid(){
  const saved=currentUser.saved||[];
  const posts=getPosts().filter(p=>saved.includes(p.id));
  if(!posts.length) return `<div style="text-align:center;padding:40px 24px;color:#737373;font-size:12px"><strong style="display:block;color:#fff;font-size:14px;margin-bottom:6px">Kaydedilen Yok</strong>Beğendiğin gönderileri kaydet.</div>`;
  return `<div class="profile-grid">${posts.map(p=>`<div class="profile-grid-cell" onclick="openComments('${p.id}')"><img src="${p.img}" alt="" loading="lazy" /></div>`).join('')}</div>`;
}

function switchProfileTab(tab){
  document.querySelectorAll('.profile-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('ptab-'+tab)&&document.getElementById('ptab-'+tab).classList.add('active');
  document.getElementById('profile-posts-grid').style.display=tab==='grid'?'block':'none';
  const sg=document.getElementById('profile-saved-grid');
  if(sg) sg.style.display=tab==='saved'?'block':'none';
}

function toggleFollow(userId){
  const users=getUsers();
  const me=users.findIndex(u=>u.id===currentUser.id);
  const them=users.findIndex(u=>u.id===userId);
  if(me<0||them<0) return;
  const fi=users[me].following.indexOf(userId);
  if(fi>-1){ users[me].following.splice(fi,1); const ri=users[them].followers.indexOf(currentUser.id); if(ri>-1) users[them].followers.splice(ri,1); }
  else { users[me].following.push(userId); users[them].followers.push(currentUser.id); pushNotif(userId,'follow',currentUser.id); }
  saveUsers(users); currentUser=users[me];
  apiCall('/api/follow', 'POST', { myId: currentUser.id, targetId: userId });
}

function toggleFollowProfile(userId){
  toggleFollow(userId);
  const btn=document.getElementById('prof-follow-btn'); if(!btn) return;
  const amNow=currentUser.following.includes(userId);
  btn.textContent=amNow?'Takip Ediliyor':'Takip Et';
  btn.className='btn '+(amNow?'btn-secondary':'btn-primary')+' '+btn.className.split(' ').slice(2).join(' ');
}

// ─── EDIT PROFILE ───────────────────────────────────────────
let newAvatarB64=null;
function openEditProfile(){
  const u=currentUser;
  document.getElementById('edit-avatar-img').src=u.avatar||'';
  document.getElementById('edit-fullname').value=u.fullname||'';
  document.getElementById('edit-username').value=u.username||'';
  document.getElementById('edit-bio').value=u.bio||'';
  document.getElementById('edit-website').value=u.website||'';
  newAvatarB64=null;
  const modal=document.getElementById('edit-profile-modal');
  modal.style.display='flex'; modal.style.flexDirection='column'; modal.style.height='100vh';
}
function closeEditProfile(){ document.getElementById('edit-profile-modal').style.display='none'; newAvatarB64=null; }
function editAvatarSelected(input){
  if(!input.files[0]) return;
  toBase64(input.files[0],200).then(b64=>{ newAvatarB64=b64; document.getElementById('edit-avatar-img').src=b64; });
}
function saveProfile(){
  const fullname=document.getElementById('edit-fullname').value.trim();
  const username=document.getElementById('edit-username').value.trim();
  const bio=document.getElementById('edit-bio').value.trim();
  const website=document.getElementById('edit-website').value.trim();
  if(!username){ showToast('Kullanıcı adı boş olamaz'); return; }
  const users=getUsers();
  if(users.find(u=>u.id!==currentUser.id&&u.username.toLowerCase()===username.toLowerCase())){ showToast('Bu kullanıcı adı alınmış'); return; }
  const changes={fullname,username,bio,website};
  if(newAvatarB64) changes.avatar=newAvatarB64;
  updateUser(currentUser.id, changes);
  document.getElementById('nav-avatar').src=newAvatarB64||currentUser.avatar||'';
  closeEditProfile();
  showToast('Profil güncellendi ✓');
  renderProfile();
  apiCall('/api/profile', 'POST', { userId: currentUser.id, changes });
}

// ─── PROFILE OPTIONS ────────────────────────────────────────
function openProfileOptions(){
  openOptions([
    {label:'Ayarlar', icon:'⚙️', action:()=>showToast('Yakında!')},
    {label:'Arşiv', icon:'📁', action:()=>showToast('Yakında!')},
    {label:'QR Kodu', icon:'📷', action:()=>showToast('Yakında!')},
    {label:'Çıkış Yap', icon:'🚪', danger:true, action:logout},
  ]);
}

function openPostOptions(postId){
  const p=getPost(postId); if(!p) return;
  const isOwner=p.userId===currentUser.id;
  const opts=isOwner?[
    {label:'Gönderiyi Sil', icon:'🗑️', danger:true, action:()=>deletePost(postId)},
    {label:'Konumu Düzenle', icon:'📍', action:()=>showToast('Yakında!')},
  ]:[
    {label:'Beğenmemeyi Bildir', icon:'🚩', action:()=>showToast('Şikayetiniz iletildi')},
    {label:'Bu Hesabı Gizle', icon:'🙈', action:()=>showToast('Hesap gizlendi')},
  ];
  openOptions(opts);
}

function deletePost(postId){
  const posts=getPosts().filter(p=>p.id!==postId); savePosts(posts);
  // remove from user
  const users=getUsers(); const ui=users.findIndex(u=>u.id===currentUser.id);
  if(ui>-1){ users[ui].posts=users[ui].posts.filter(id=>id!==postId); saveUsers(users); currentUser=users[ui]; }
  showToast('Gönderi silindi');
  if(currentTab==='home') renderFeed();
  else if(currentTab==='profile') renderProfile();
  apiCall('/api/posts/delete', 'POST', { postId, userId: currentUser.id });
}

function logout(){
  S.del('currentUserId'); currentUser=null;
  document.getElementById('main-app').style.display='none';
  document.getElementById('auth-wrapper').style.display='block';
  document.getElementById('login-screen').style.display='flex';
  document.getElementById('register-screen').style.display='none';
  showToast('Çıkış yapıldı');
}

// ─── OPTIONS SHEET ──────────────────────────────────────────
function openOptions(items){
  const sheet=document.getElementById('options-sheet');
  const overlay=document.getElementById('options-overlay');
  sheet.innerHTML=items.map(item=>`
    <button class="options-item ${item.danger?'danger':''}" onclick="handleOption(${items.indexOf(item)})">
      ${item.icon?item.icon+' ':''} ${esc(item.label)}
    </button>
  `).join('')+`<button class="options-item" style="color:#737373" onclick="closeOptions()">İptal</button>`;
  optionsCallback=items;
  overlay.style.display='flex';
}
function handleOption(idx){ optionsCallback&&optionsCallback[idx]&&optionsCallback[idx].action(); closeOptions(); }
function closeOptions(){ document.getElementById('options-overlay').style.display='none'; optionsCallback=null; }

// ─── FOLLOWERS/FOLLOWING LISTS ──────────────────────────────
function showFollowers(userId){
  const u=getUser(userId); if(!u) return;
  const list=u.followers.map(id=>getUser(id)).filter(Boolean);
  openUserListSheet('Takipçiler',list);
}
function showFollowing(userId){
  const u=getUser(userId); if(!u) return;
  const list=u.following.map(id=>getUser(id)).filter(Boolean);
  openUserListSheet('Takip Edilenler',list);
}
function openUserListSheet(title, users){
  const sheet=document.getElementById('options-sheet');
  const overlay=document.getElementById('options-overlay');
  let html=`<div style="padding:14px 16px;font-weight:700;font-size:14px;border-bottom:1px solid #262626;text-align:center">${esc(title)}</div>`;
  if(!users.length) html+=`<div style="padding:24px;text-align:center;color:#737373;font-size:12px">Kimse yok</div>`;
  else html+=users.map(u=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer" onclick="closeOptions();viewProfile('${u.id}')">
    ${avatarHtml(u.avatar,40)}<div><div style="font-size:13px;font-weight:600">${esc(u.username)}</div><div style="font-size:11px;color:#737373">${esc(u.fullname)}</div></div>
  </div>`).join('');
  html+=`<button class="options-item" style="color:#737373" onclick="closeOptions()">Kapat</button>`;
  sheet.innerHTML=html;
  overlay.style.display='flex';
}

// ─── CREATE POST ────────────────────────────────────────────
const FILTERS=[
  {name:'Normal',css:'none'},{name:'Clarendon',css:'contrast(1.2) saturate(1.35)'},
  {name:'Gingham',css:'brightness(1.05) hue-rotate(350deg)'},
  {name:'Moon',css:'grayscale(1) contrast(1.1) brightness(1.1)'},
  {name:'Lark',css:'contrast(.9) brightness(1.1) saturate(1.3)'},
  {name:'Reyes',css:'sepia(.22) contrast(.85) brightness(1.1) saturate(.75)'},
  {name:'Juno',css:'contrast(1.2) sepia(.35) saturate(1.8)'},
  {name:'Slumber',css:'saturate(.66) brightness(1.05)'},
  {name:'Crema',css:'contrast(1.04) saturate(.82) sepia(.22) brightness(1.07)'},
  {name:'Ludwig',css:'contrast(1.05) brightness(1.06) saturate(.85)'},
  {name:'Aden',css:'hue-rotate(20deg) contrast(.9) saturate(.85) brightness(1.2)'},
  {name:'Perpetua',css:'contrast(1.1) brightness(1.25) saturate(1)'},
];

function filterCSS(name){
  const f=FILTERS.find(x=>x.name===name||x.css===name);
  if(!f||f.css==='none') return '';
  return 'filter:'+f.css;
}

function openCreatePost(){
  createStep=0; createImgB64=null; createFilter='none';
  document.getElementById('create-step-pick').style.display='flex';
  document.getElementById('create-step-filter').style.display='none';
  document.getElementById('create-step-share').style.display='none';
  document.getElementById('create-next-btn').style.display='none';
  document.getElementById('create-modal-title').textContent='Yeni Gönderi';
  const modal=document.getElementById('create-modal');
  modal.style.display='flex'; modal.style.flexDirection='column'; modal.style.height='100vh';
}

function closeCreateModal(){ document.getElementById('create-modal').style.display='none'; }

function postImageSelected(input){
  if(!input.files[0]) return;
  toBase64(input.files[0]).then(b64=>{
    createImgB64=b64; createFilter='none';
    document.getElementById('create-preview').src=b64;
    document.getElementById('create-preview').style.filter='';
    renderFilterRow();
    document.getElementById('create-step-pick').style.display='none';
    document.getElementById('create-step-filter').style.display='flex';
    document.getElementById('create-next-btn').style.display='block';
    document.getElementById('create-modal-title').textContent='Filtreler';
    createStep=1;
  });
}

function renderFilterRow(){
  const row=document.getElementById('filters-row');
  row.innerHTML=FILTERS.map((f,i)=>`<div class="filter-item${f.name==='Normal'?' active':''}" id="fi-${i}" onclick="applyFilter('${f.name}',${i})">
    <div class="filter-thumb"><img src="${createImgB64}" alt="${f.name}" style="filter:${f.css}" /></div>
    <span class="filter-name">${f.name}</span>
  </div>`).join('');
}

function applyFilter(name, idx){
  createFilter=name;
  const f=FILTERS.find(x=>x.name===name); if(!f) return;
  document.getElementById('create-preview').style.filter=f.css==='none'?'':f.css;
  document.querySelectorAll('.filter-item').forEach(el=>el.classList.remove('active'));
  document.getElementById('fi-'+idx)&&document.getElementById('fi-'+idx).classList.add('active');
}

function createModalNext(){
  if(createStep===1){
    document.getElementById('share-thumb').src=createImgB64;
    document.getElementById('share-thumb').style.filter=document.getElementById('create-preview').style.filter;
    document.getElementById('share-caption').value='';
    document.getElementById('share-location').value='';
    document.getElementById('create-step-filter').style.display='none';
    document.getElementById('create-step-share').style.display='flex';
    document.getElementById('create-step-share').style.flexDirection='column';
    document.getElementById('create-modal-title').textContent='Yeni Gönderi';
    document.getElementById('create-next-btn').style.display='none';
    createStep=2;
  }
}

function publishPost(){
  if(!createImgB64){ showToast('Önce bir fotoğraf seçin'); return; }
  const caption=document.getElementById('share-caption').value.trim();
  const location=document.getElementById('share-location').value.trim();
  const newPost={id:'p_'+uid(),userId:currentUser.id,img:createImgB64,caption,location,filter:createFilter,likes:[],comments:[],saved:[],ts:Date.now()};
  const posts=getPosts(); posts.unshift(newPost); savePosts(posts);
  // Add to user posts
  const users=getUsers(); const ui=users.findIndex(u=>u.id===currentUser.id);
  if(ui>-1){ users[ui].posts.unshift(newPost.id); saveUsers(users); currentUser=users[ui]; }
  closeCreateModal();
  showToast('Gönderi paylaşıldı! 🎉');
  switchTab('home');

  apiCall('/api/posts', 'POST', { post: newPost });
}

// ─── CREATE STORY ────────────────────────────────────────────
function openCreateStory(){
  storyImgB64=null;
  const body=document.getElementById('story-create-body');
  body.innerHTML=`<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center">
    <div style="width:80px;height:80px;border-radius:50%;background:#1e1e1e;border:1.5px dashed #262626;display:flex;align-items:center;justify-content:center">
      <svg viewBox="0 0 24 24" style="width:36px;height:36px;color:#737373"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
    </div>
    <h3 style="color:#fff">Hikaye Fotoğrafı Seç</h3>
    <p style="font-size:12px;color:#a8a8a8;max-width:220px;line-height:1.5">Hikayen 24 saat boyunca görünür kalır.</p>
    <button class="btn btn-primary" style="width:auto;padding:10px 24px" onclick="document.getElementById('story-file-input').click()">Fotoğraf Seç</button>
    <input type="file" id="story-file-input" accept="image/*" style="display:none" onchange="storyImageSelected(this)" />
  </div>`;
  document.getElementById('story-publish-btn').style.display='none';
  const modal=document.getElementById('story-create-modal');
  modal.style.display='flex'; modal.style.flexDirection='column'; modal.style.height='100vh';
}

function closeStoryCreate(){ document.getElementById('story-create-modal').style.display='none'; storyImgB64=null; }

function storyImageSelected(input){
  if(!input.files[0]) return;
  toBase64(input.files[0]).then(b64=>{
    storyImgB64=b64;
    document.getElementById('story-create-body').innerHTML=`
      <img src="${b64}" alt="" style="width:100%;height:100%;object-fit:contain;display:block" />
      <input type="text" id="story-caption-input" style="position:absolute;bottom:20px;left:16px;right:16px;background:rgba(0,0,0,.5);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);border-radius:24px;padding:10px 18px;color:#fff;font-size:13px;outline:none;font-family:inherit;text-align:center" placeholder="Metin ekle..." />`;
    document.getElementById('story-publish-btn').style.display='block';
  });
}

function publishStory(){
  if(!storyImgB64){ showToast('Önce fotoğraf seçin'); return; }
  const caption=(document.getElementById('story-caption-input')||{}).value||'';
  const newStory={id:'s_'+uid(),userId:currentUser.id,img:storyImgB64,caption,ts:Date.now(),viewers:[],likes:[]};
  const stories=getStories(); stories.push(newStory); saveStories(stories);
  const users=getUsers(); const ui=users.findIndex(u=>u.id===currentUser.id);
  if(ui>-1){ if(!users[ui].stories) users[ui].stories=[]; users[ui].stories.push(newStory.id); saveUsers(users); currentUser=users[ui]; }
  closeStoryCreate();
  showToast('Hikayeniz paylaşıldı! ✨');
  renderStories();

  apiCall('/api/stories', 'POST', { story: newStory });
}

// ─── DIRECT MESSAGES ────────────────────────────────────────
let chatTimer=null;

function renderDM(){
  chatPartnerId=null;
  const header=document.getElementById('top-header'); header.style.display='none';
  const cont=document.getElementById('dm-content');
  const msgs=S.get('messages',{});
  const users=getUsers().filter(u=>u.id!==currentUser.id);

  // Build conversation list
  const convs=[];
  users.forEach(u=>{
    const key=convKey(currentUser.id,u.id);
    const thread=msgs[key]||[];
    const last=thread[thread.length-1];
    convs.push({user:u, last, ts:last?last.ts:0});
  });
  convs.sort((a,b)=>b.ts-a.ts);

  if(!convs.filter(c=>c.last).length && users.length){
    // Show all users to start a chat
    cont.innerHTML=`<div style="padding:12px;color:#a8a8a8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px">Sohbet Başlat</div>`+
    users.map(u=>`<div class="dm-user-item" onclick="openChat('${u.id}')">
      ${avatarHtml(u.avatar,50)}
      <div><div class="dm-user-name">${esc(u.username)}</div><div class="dm-user-sub">${esc(u.fullname)}</div></div>
    </div>`).join('');
    return;
  }

  cont.innerHTML=convs.map(c=>{
    const preview=c.last?(c.last.senderId===currentUser.id?'Siz: ':'')+c.last.text.substring(0,40):'Mesaj başlat...';
    return `<div class="dm-user-item" onclick="openChat('${c.user.id}')">
      <div style="position:relative">
        ${avatarHtml(c.user.avatar,50)}
        <span class="online-dot" style="position:absolute;bottom:1px;right:1px;width:12px;height:12px;background:#3bd671;border-radius:50%;border:2px solid #000"></span>
      </div>
      <div style="flex:1;min-width:0">
        <div class="dm-user-name">${esc(c.user.username)}</div>
        <div class="dm-user-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(preview)}</div>
      </div>
      ${c.ts?`<div style="font-size:10px;color:#737373">${timeAgo(c.ts)}</div>`:''}
    </div>`;
  }).join('');
}

function convKey(a,b){ return [a,b].sort().join(':'); }

function openChat(userId){
  chatPartnerId=userId;
  const u=getUser(userId); if(!u) return;
  const scroll=document.getElementById('main-scroll');
  scroll.innerHTML=`<div style="display:flex;flex-direction:column;height:calc(100vh - 52px);overflow:hidden" id="chat-room">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #262626;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:10px">
        <button onclick="goBackToDM()" style="background:none;border:none;color:#fff;cursor:pointer"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="15 18 9 12 15 6"/></svg></button>
        ${avatarHtml(u.avatar,34)}
        <div>
          <div style="font-size:13px;font-weight:600">${esc(u.username)}</div>
          <div style="font-size:11px;color:#3bd671">Aktif</div>
        </div>
      </div>
      <div style="display:flex;gap:14px">
        <button onclick="showToast('Sesli arama yakında!')" style="background:none;border:none;color:#a8a8a8;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.12-1.12a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
        <button onclick="showToast('Görüntülü arama yakında!')" style="background:none;border:none;color:#a8a8a8;cursor:pointer"><svg viewBox="0 0 24 24" width="22" height="22"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></button>
      </div>
    </div>
    <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px"></div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid #262626;flex-shrink:0;background:#000">
      <div style="flex:1;display:flex;align-items:center;background:#262626;border-radius:22px;padding:9px 14px">
        <input type="text" id="chat-input" style="flex:1;background:none;border:none;color:#fff;font-size:13px;outline:none;font-family:inherit" placeholder="Mesaj..." onkeydown="if(event.key==='Enter')sendMessage()" />
        <button onclick="sendMessage()" style="background:none;border:none;color:#0095f6;font-size:13px;font-weight:700;cursor:pointer;padding:0 0 0 8px">Gönder</button>
      </div>
      <button onclick="sendHeart()" style="background:none;border:none;cursor:pointer;font-size:24px">❤️</button>
    </div>
  </div>`;
  renderChatMessages();
}

function goBackToDM(){
  clearTimeout(chatTimer); chatPartnerId=null;
  // Restore main scroll structure
  document.getElementById('main-scroll').innerHTML=`
    <div id="tab-home" class="tab-view ${currentTab==='home'?'active':''}"><div id="stories-bar" class="stories-bar"></div><div id="feed-list"></div></div>
    <div id="tab-explore" class="tab-view ${currentTab==='explore'?'active':''}">
      <div class="explore-top"><div class="search-bar"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input type="text" id="search-input" placeholder="Ara..." oninput="handleSearch(this.value)" /><button id="search-clear" style="display:none;background:none;border:none;color:#737373;cursor:pointer" onclick="clearSearch()">✕</button></div></div>
      <div id="explore-content"></div>
    </div>
    <div id="tab-reels" class="tab-view ${currentTab==='reels'?'active':''}"><div id="reels-view" class="reels-view"></div></div>
    <div id="tab-profile" class="tab-view ${currentTab==='profile'?'active':''}"><div id="profile-content"></div></div>
    <div id="tab-direct" class="tab-view active"><div class="dm-header"><button class="dm-back" onclick="switchTab('home')"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="15 18 9 12 15 6"/></svg></button><span class="dm-title">Mesajlar</span></div><div id="dm-content"></div></div>
    <div id="tab-notifications" class="tab-view ${currentTab==='notifications'?'active':''}"><div class="dm-header"><button class="dm-back" onclick="switchTab('home')"><svg viewBox="0 0 24 24" width="24" height="24"><polyline points="15 18 9 12 15 6"/></svg></button><span class="dm-title">Bildirimler</span></div><div id="notif-content"></div></div>
  `;
  switchTab('direct');
}

function renderChatMessages(){
  if(!chatPartnerId) return;
  const msgs=S.get('messages',{});
  const key=convKey(currentUser.id,chatPartnerId);
  const thread=msgs[key]||[];
  const partner=getUser(chatPartnerId);
  const cont=document.getElementById('chat-messages'); if(!cont) return;

  let html='';
  if(!thread.length){
    html=`<div style="display:flex;flex-direction:column;align-items:center;padding:20px 0 12px;gap:6px">
      ${avatarHtml(partner.avatar,70)}
      <div style="font-size:14px;font-weight:700">${esc(partner.username)}</div>
      <div style="font-size:11px;color:#737373">${esc(partner.fullname)} · Instagram</div>
    </div><div style="text-align:center;color:#737373;font-size:12px;padding:20px">Henüz mesaj yok. Merhaba de! 👋</div>`;
  } else {
    html=thread.map(m=>{
      const mine=m.senderId===currentUser.id;
      const isEmoji=/^[\p{Emoji}\s]+$/u.test(m.text)&&m.text.length<=8;
      return `<div class="msg-row ${mine?'mine':''}">
        ${!mine?avatarHtml(partner.avatar,22):''}
        <div class="msg-bubble ${mine?'mine':'theirs'} ${isEmoji?'emoji-only':''}" style="${isEmoji?'background:transparent;font-size:36px;padding:2px 4px':''}">${esc(m.text)}<span class="msg-time">${timeAgo(m.ts)}</span></div>
      </div>`;
    }).join('');
  }
  cont.innerHTML=html;
  cont.scrollTop=cont.scrollHeight;
}

function sendMessage(){
  const inp=document.getElementById('chat-input'); if(!inp) return;
  const text=inp.value.trim(); if(!text) return;
  const key=convKey(currentUser.id,chatPartnerId);
  const msgs=S.get('messages',{});
  if(!msgs[key]) msgs[key]=[];
  const newMsg={id:'m_'+uid(),senderId:currentUser.id,text,ts:Date.now(),read:false};
  msgs[key].push(newMsg);
  S.set('messages',msgs);
  inp.value='';
  renderChatMessages();

  apiCall('/api/messages', 'POST', { key, message: newMsg });
}

function sendHeart(){
  const inp=document.getElementById('chat-input'); if(!inp) return;
  inp.value='❤️'; sendMessage();
}

function renderDMBadge(){
  const msgs=S.get('messages',{});
  const badge=document.getElementById('dm-badge');
  if(!badge) return;
  let unread=0;
  Object.values(msgs).forEach(thread=>{ thread.forEach(m=>{ if(m.senderId!==currentUser.id&&!m.read) unread++; }); });
  if(unread){ badge.style.display='flex'; badge.textContent=unread>9?'9+':unread; }
  else badge.style.display='none';
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
function renderNotifications(){
  const notifs=S.get('notifications',[]).filter(n=>n.toUserId===currentUser.id);
  const cont=document.getElementById('notif-content');
  // Mark all read
  const all=S.get('notifications',[]);
  all.forEach(n=>{ if(n.toUserId===currentUser.id) n.read=true; }); S.set('notifications',all);
  renderNotifBadge();

  if(!notifs.length){
    cont.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><h3>Bildirim Yok</h3><p>Hesabınla etkileşimde bulunulduğunda burada göreceksin.</p></div>`;
    return;
  }

  const typeLabels={like:'gönderini beğendi.',comment:'gönderine yorum yaptı.',follow:'seni takip etmeye başladı.'};
  const typeIcons={like:'❤️',comment:'💬',follow:'👤'};

  cont.innerHTML=notifs.map(n=>{
    const from=getUser(n.fromUserId); if(!from) return '';
    const post=n.postId?getPost(n.postId):null;
    return `<div class="notif-item" onclick="${n.postId?`openComments('${n.postId}')`:`viewProfile('${n.fromUserId}')`}">
      ${avatarHtml(from.avatar,44)}
      <div class="notif-text">
        <strong>${esc(from.username)}</strong> <span>${typeLabels[n.type]||''}</span>
        <span class="notif-time">${timeAgo(n.ts)}</span>
      </div>
      ${post?`<img src="${post.img}" class="notif-post-thumb" alt="" style="width:42px;height:42px;border-radius:4px;object-fit:cover" />`:`<span style="font-size:18px">${typeIcons[n.type]||''}</span>`}
    </div>`;
  }).join('');
}

function renderNotifBadge(){
  const notifs=S.get('notifications',[]).filter(n=>n.toUserId===currentUser.id&&!n.read);
  const badge=document.getElementById('notif-badge');
  if(!badge) return;
  if(notifs.length){ badge.style.display='block'; }
  else badge.style.display='none';
}

// ─── MANIFEST ────────────────────────────────────────────────
// Dynamically create manifest
const manifest={name:'Instagram',short_name:'Instagram',start_url:'/',display:'standalone',background_color:'#000000',theme_color:'#000000',icons:[{src:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%23e1306c"/><text y=".9em" font-size="80">📸</text></svg>',sizes:'any',type:'image/svg+xml'}]};
const mBlob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
const mUrl=URL.createObjectURL(mBlob);
const mLink=document.createElement('link'); mLink.rel='manifest'; mLink.href=mUrl; document.head.appendChild(mLink);

// ─── KEYBOARD: close modals on ESC ───────────────────────────
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(document.getElementById('story-viewer').style.display!=='none') closeStoryViewer();
    else if(document.getElementById('comments-modal').style.display!=='none') closeComments();
    else if(document.getElementById('create-modal').style.display!=='none') closeCreateModal();
    else if(document.getElementById('options-overlay').style.display!=='none') closeOptions();
    else if(document.getElementById('edit-profile-modal').style.display!=='none') closeEditProfile();
    else if(document.getElementById('story-create-modal').style.display!=='none') closeStoryCreate();
  }
});

// ─── RESIZE: maintain full height on mobile ──────────────────
function fixHeight(){ document.getElementById('main-app')&&(document.getElementById('main-app').style.height=window.innerHeight+'px'); }
window.addEventListener('resize',fixHeight); fixHeight();

console.log('%c🌟 Aurastagram %c— Pure HTML/CSS/JS Instagram Clone', 'color:#e1306c;font-size:16px;font-weight:bold','color:#737373;font-size:12px');
