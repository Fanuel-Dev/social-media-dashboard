/* ---------------- Platforms ---------------- */
const PLATFORMS = [
  { id:'twitter',   name:'X (Twitter)', badge:'X',  color:'#55688a', followers:18400, growth:2.3,  engagement:3.1, limit:280 },
  { id:'instagram', name:'Instagram',   badge:'IG', color:'#d6487a', followers:42100, growth:4.8,  engagement:5.4, limit:2200 },
  { id:'facebook',  name:'Facebook',    badge:'FB', color:'#4d72b8', followers:9800,  growth:-0.6, engagement:1.8, limit:63206 },
  { id:'linkedin',  name:'LinkedIn',    badge:'in', color:'#2f8fb0', followers:6250,  growth:6.1,  engagement:2.9, limit:3000 },
  { id:'tiktok',    name:'TikTok',      badge:'TT', color:'#2ec4c4', followers:27300, growth:9.4,  engagement:7.2, limit:2200 },
];
function platform(id){ return PLATFORMS.find(p => p.id === id); }

function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260728);
function genSeries(n, base, volatility){
  const arr = []; let v = base;
  for(let i=0;i<n;i++){ v += (rng()-0.45)*volatility; v = Math.max(base*0.5, v); arr.push(v); }
  return arr;
}
const platformSeries = {};
PLATFORMS.forEach(p => { platformSeries[p.id] = genSeries(14, p.engagement, p.engagement*0.35); });

function greet(){
  const h = new Date().getHours();
  document.getElementById('timeOfDay').textContent = h<12 ? 'morning' : h<18 ? 'afternoon' : 'evening';
}
greet();

function renderAvatars(){
  document.getElementById('avatarsRow').innerHTML = PLATFORMS.map(p =>
    `<div class="platform-avatar" style="background:${p.color}" title="${p.name}">${p.badge}</div>`).join('');
}
renderAvatars();

/* ---------------- Platform cards ---------------- */
function sparkPath(values, w, h){
  const min = Math.min(...values), max = Math.max(...values);
  const span = (max-min) || 1;
  return values.map((v,i) => {
    const x = (i/(values.length-1))*w;
    const y = h - ((v-min)/span)*h;
    return (i===0?'M':'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
}
function renderPlatformCards(){
  const grid = document.getElementById('platformGrid');
  grid.innerHTML = PLATFORMS.map(p => `
    <div class="platform-card" style="--pcolor:${p.color}">
      <div class="platform-head">
        <div class="platform-badge">${p.badge}</div>
        <div class="platform-name">${p.name}</div>
      </div>
      <div class="platform-followers">${p.followers.toLocaleString()}</div>
      <div class="platform-growth ${p.growth>=0?'up':'down'}">${p.growth>=0?'▲':'▼'} ${Math.abs(p.growth)}%</div>
      <svg class="platform-spark" viewBox="0 0 160 26" preserveAspectRatio="none">
        <path d="${sparkPath(platformSeries[p.id],160,26)}" fill="none" stroke="${p.color}" stroke-width="2"/>
      </svg>
      <div class="platform-eng">${p.engagement}% avg engagement rate</div>
    </div>
  `).join('');
}
renderPlatformCards();

/* ---------------- Multi-line engagement chart ---------------- */
let visiblePlatforms = new Set(PLATFORMS.map(p => p.id));
function renderLegend(){
  const el = document.getElementById('legendToggles');
  el.innerHTML = PLATFORMS.map(p => `<div class="legend-chip active" data-id="${p.id}"><span class="sw" style="background:${p.color}"></span>${p.name}</div>`).join('');
  el.querySelectorAll('.legend-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      if(visiblePlatforms.has(id)) visiblePlatforms.delete(id); else visiblePlatforms.add(id);
      chip.classList.toggle('active');
      renderChart();
    });
  });
}
function renderChart(){
  const svg = document.getElementById('engagementChart');
  const W=640,H=200,PAD=20;
  const allVals = PLATFORMS.flatMap(p => platformSeries[p.id]);
  const min = Math.min(...allVals), max = Math.max(...allVals);
  const span = (max-min)||1;
  let gridLines = '';
  for(let i=0;i<=4;i++){ const y=PAD+i*(H-PAD*2)/4; gridLines += `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`; }
  let paths = '';
  PLATFORMS.forEach(p => {
    if(!visiblePlatforms.has(p.id)) return;
    const vals = platformSeries[p.id];
    const d = vals.map((v,i) => {
      const x = PAD + (i/(vals.length-1))*(W-PAD*2);
      const y = H-PAD - ((v-min)/span)*(H-PAD*2);
      return (i===0?'M':'L')+x.toFixed(1)+','+y.toFixed(1);
    }).join(' ');
    paths += `<path d="${d}" fill="none" stroke="${p.color}" stroke-width="2.5" opacity="0.9"/>`;
  });
  svg.innerHTML = gridLines + paths;
}
renderLegend();
renderChart();

/* ---------------- Top posts ---------------- */
const SAMPLE_TEXTS = [
  'Behind the scenes of our new product shoot 📸',
  '5 small habits that changed how our team works',
  'We just hit a big milestone — thank you all 🎉',
  'A quick look at what we shipped this week',
  'Our favorite customer story from this month',
  'Q&A: your top questions, answered',
];
let topPosts = SAMPLE_TEXTS.map((text,i) => {
  const p = PLATFORMS[i % PLATFORMS.length];
  const likes = Math.round(rng()*4000+200);
  const comments = Math.round(rng()*300+10);
  const shares = Math.round(rng()*150+5);
  return { text, platform: p, likes, comments, shares, score: likes + comments*2 + shares*3 };
}).sort((a,b) => b.score - a.score).slice(0,5);

function renderTopPosts(){
  document.getElementById('topPosts').innerHTML = topPosts.map(post => `
    <div class="post-row">
      <div class="pbadge" style="background:${post.platform.color}">${post.platform.badge}</div>
      <div class="ptext">${escapeHtml(post.text)}</div>
      <div class="pstats">${post.likes.toLocaleString()} ♥ · ${post.comments} 💬 · ${post.shares} ↻</div>
    </div>
  `).join('');
}
renderTopPosts();
function escapeHtml(str){ const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }

/* ---------------- Tabs ---------------- */
document.querySelectorAll('#tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b===btn));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-'+btn.dataset.page).classList.add('active');
    if(btn.dataset.page === 'schedule') renderSchedule();
  });
});

/* ---------------- Storage ---------------- */
async function safeGet(key){ try{ const r = await window.storage.get(key,false); return r?r.value:null; }catch(e){ return null; } }
async function safeSet(key,val){ try{ return await window.storage.set(key,val,false); }catch(e){ return null; } }
async function safeDelete(key){ try{ return await window.storage.delete(key,false); }catch(e){ return null; } }

let posts = []; // {id, text, platforms:[ids], scheduledAt: iso|null, status:'scheduled'|'posted'}
async function loadPosts(){
  const raw = await safeGet('social:posts');
  posts = raw ? JSON.parse(raw) : [];
}
async function persistPosts(){ await safeSet('social:posts', JSON.stringify(posts)); }

/* ---------------- Compose ---------------- */
let selectedPlatforms = new Set(['instagram']);
function renderPlatformSelect(){
  const el = document.getElementById('platformSelect');
  el.innerHTML = PLATFORMS.map(p => `<div class="platform-chip ${selectedPlatforms.has(p.id)?'selected':''}" style="--pcolor:${p.color}" data-id="${p.id}"><span>${p.badge}</span>${p.name}</div>`).join('');
  el.querySelectorAll('.platform-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.dataset.id;
      if(selectedPlatforms.has(id)) selectedPlatforms.delete(id); else selectedPlatforms.add(id);
      renderPlatformSelect();
      updateCompose();
    });
  });
}
function currentLimit(){
  if(!selectedPlatforms.size) return 280;
  return Math.min(...Array.from(selectedPlatforms).map(id => platform(id).limit));
}
function updateCompose(){
  const text = document.getElementById('composeText').value;
  const limit = currentLimit();
  const charRow = document.getElementById('charRow');
  charRow.textContent = `${text.length} / ${limit}`;
  charRow.classList.toggle('warn', text.length > limit);
  document.getElementById('submitPost').disabled = text.trim().length === 0 || text.length > limit || selectedPlatforms.size === 0;

  const stack = document.getElementById('previewStack');
  if(!text.trim() || selectedPlatforms.size === 0){
    stack.innerHTML = '<div class="preview-empty">Select a platform and start typing to preview your post.</div>';
    return;
  }
  stack.innerHTML = Array.from(selectedPlatforms).map(id => {
    const p = platform(id);
    return `<div class="preview-card">
      <div class="preview-top">
        <div class="preview-avatar" style="background:${p.color}">${p.badge}</div>
        <div><div class="preview-name">Your Brand</div><div class="preview-meta">${p.name} · just now</div></div>
      </div>
      <div class="preview-text">${escapeHtml(text)}</div>
    </div>`;
  }).join('');
}
document.getElementById('composeText').addEventListener('input', updateCompose);
renderPlatformSelect();
updateCompose();

let postMode = 'now';
document.querySelectorAll('#postMode button').forEach(btn => {
  btn.addEventListener('click', () => {
    postMode = btn.dataset.mode;
    document.querySelectorAll('#postMode button').forEach(b => b.classList.toggle('active', b===btn));
    document.getElementById('schedDate').style.display = postMode==='later' ? 'block' : 'none';
    document.getElementById('schedTime').style.display = postMode==='later' ? 'block' : 'none';
    document.getElementById('submitPost').textContent = postMode==='later' ? 'Schedule post' : 'Post now';
  });
});

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

document.getElementById('submitPost').addEventListener('click', async () => {
  const text = document.getElementById('composeText').value.trim();
  if(!text || selectedPlatforms.size === 0) return;
  let scheduledAt = null, status = 'posted';
  if(postMode === 'later'){
    const d = document.getElementById('schedDate').value, t = document.getElementById('schedTime').value;
    if(!d || !t){ showToast('Pick a date and time to schedule.'); return; }
    scheduledAt = new Date(`${d}T${t}:00`).toISOString();
    status = 'scheduled';
  }
  const post = { id:'post_'+Date.now(), text, platforms:Array.from(selectedPlatforms), scheduledAt, status, createdAt:Date.now() };
  posts.unshift(post);
  await persistPosts();
  document.getElementById('composeText').value = '';
  updateCompose();
  showToast(status === 'posted' ? 'Posted!' : 'Scheduled!');
});

/* ---------------- Schedule page ---------------- */
function fmtSchedTime(post){
  if(post.status === 'posted') return 'posted';
  const d = new Date(post.scheduledAt);
  return d.toLocaleDateString([], {month:'short', day:'numeric'}) + ' · ' + d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
}
function isOverdue(post){ return post.status === 'scheduled' && new Date(post.scheduledAt) < new Date(); }

function renderSchedule(){
  const list = document.getElementById('schedList');
  if(!posts.length){
    list.innerHTML = '<div class="empty-note">No posts yet — compose one to see it here.</div>';
    return;
  }
  const sorted = posts.slice().sort((a,b) => {
    const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : a.createdAt;
    const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : b.createdAt;
    return tb - ta;
  });
  list.innerHTML = sorted.map(post => `
    <div class="sched-row ${isOverdue(post)?'overdue':''}">
      <div class="sched-platforms">${post.platforms.map(id => `<span style="background:${platform(id).color}">${platform(id).badge}</span>`).join('')}</div>
      <div class="sched-text">${escapeHtml(post.text)}</div>
      <div class="sched-time">${isOverdue(post) ? '⚠ overdue' : fmtSchedTime(post)}</div>
      <div class="sched-actions">
        <button data-id="${post.id}" class="del-post">✕</button>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('.del-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      posts = posts.filter(p => p.id !== btn.dataset.id);
      await persistPosts();
      renderSchedule();
    });
  });
}

/* ---------------- Init ---------------- */
(async function init(){
  await loadPosts();
})();