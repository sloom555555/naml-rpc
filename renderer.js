// ══════════════════════════════════════════
//  SentryRPC — Renderer
// ══════════════════════════════════════════

// ── State ──
let isRpcActive = false;
let elapsedStart = null;
let elapsedInterval = null;
let profiles = [];
let bots = [];
let cropTarget = null; // 'large' | 'small'
let cropSrc    = null;
let previewDebounce = null;

const QUICK_PRESETS = [
  { emoji:'<span class="status-dot" style="background:var(--color-error, #ef4444); display:inline-block; margin-left:4px;"></span>', name:'بث تويتش',     sub:'Streaming',        details:'Streaming on Twitch',  state:'<span class="status-dot" style="background:var(--color-error, #ef4444); display:inline-block; margin-left:4px;"></span> Live Now',     largeImageKey:'twitch',    button1Label:'Watch Stream', button1Url:'https://twitch.tv' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>', name:'VS Code',       sub:'Coding',           details:'Editing Code',          state:'Workspace: Main',  largeImageKey:'vscode' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>', name:'سبوتيفاي',      sub:'Listening',        details:'Listening to Spotify',  state:'The Weeknd',       largeImageKey:'spotify',   button1Label:'Spotify', button1Url:'https://spotify.com' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>', name:'GTA V',         sub:'Gaming',           details:'Grand Theft Auto V',    state:'FiveM — City RP',  largeImageKey:'gtav' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>', name:'فوتوشوب',       sub:'Designing',        details:'Adobe Photoshop 2025',  state:'Editing Logo.psd', largeImageKey:'photoshop' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>', name:'ديسكورد',       sub:'Chatting',         details:'SentryKSA Community',   state:'في الروم الصوتي',  largeImageKey:'discord',   partySize:1, partyMax:10 },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>', name:'يوتيوب',        sub:'Watching',         details:'Watching YouTube',       state:'SentryKSA Channel',largeImageKey:'youtube',   button1Label:'Watch', button1Url:'https://youtube.com' },
  { emoji:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>', name:'استراحة',       sub:'Chilling',         details:'Taking a break',         state:'عند القهوة <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',   largeImageKey:'' },
];

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', async () => {
  buildQuickPresets();
  const [cfg, profs, botsData] = await Promise.all([
    window.rpc.loadConfig(),
    window.rpc.loadProfiles(),
    window.rpc.loadBots(),
  ]);
  applyConfigToForm(cfg);
  profiles = profs || [];
  bots     = botsData || [];
  renderProfiles();
  renderBots();
  updatePreview();
  await loadCurrentSettings();

  const st = await window.rpc.status();
  if (st.active) setRpcState(true);

  window.rpc.onStopped(() => setRpcState(false));

  if (window.rpc?.onDownloadProgress) {
    window.rpc.onDownloadProgress((data) => {
      const box = document.getElementById('download-progress-box');
      const bar = document.getElementById('download-bar');
      const fn = document.getElementById('download-filename');
      const pct = document.getElementById('download-percent');
      if (box) box.style.display = 'block';
      if (bar) bar.style.width = `${data.percent}%`;
      if (pct) pct.textContent = `${data.percent}%`;
      if (fn) fn.textContent = `جاري تحميل ${data.fileName}... (${Math.round(data.received/1024)} KB)`;
    });
  }

  handleQuickDiscordCheck();
  setInterval(handleQuickDiscordCheck, 15000);

  if (window.rpc?.onDiscordUserChanged) {
    window.rpc.onDiscordUserChanged((user) => {
      updateDiscordProfileUI(user);
      toast(`🔄 تم التعرف على حساب ديسكورد: ${user.global_name || user.username}`, 'info');
    });
  }
  handleRefreshDiscordUser(true);

  if (window.rpc?.onAppHidden) {
    window.rpc.onAppHidden(() => {
      console.log('App entered tray background mode');
    });
  }
  if (window.rpc?.onAppShown) {
    window.rpc.onAppShown(() => {
      console.log('App restored from tray');
      handleQuickDiscordCheck();
    });
  }

  // Char counters
  ['details','state'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => updateCharCount(id));
  });

  // Auto-Save: attach to all inputs in RPC tab & rotator
  const rpcPanel = document.getElementById('panel-rpc');
  if (rpcPanel) {
    rpcPanel.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => debouncedAutoSave(false));
      el.addEventListener('change', () => debouncedAutoSave(true));
    });
  }

  const whPanel = document.getElementById('panel-webhook');
  if (whPanel) {
    whPanel.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => debouncedAutoSave(false));
      el.addEventListener('change', () => debouncedAutoSave(true));
    });
  }

  // Auto-Save flush on window closing / unloading
  window.addEventListener('beforeunload', () => {
    try {
      const cfg = collectConfig();
      window.rpc.saveConfig(cfg);
    } catch (e) {}
  });
  window.addEventListener('pagehide', () => {
    try {
      const cfg = collectConfig();
      window.rpc.saveConfig(cfg);
    } catch (e) {}
  });
});

// ══════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById(`panel-${name}`)?.classList.add('active');
  if (name === 'preview') {
    updatePreview();
    handleRefreshDiscordUser(true);
  } else if (name === 'webhook') {
    updateWebhookEmbedPreview();
  }
}

// ══════════════════════════════════════════
//  CONFIG
// ══════════════════════════════════════════
let rotatorFramesList = [];

function onActivityTypeChange() {
  const type = document.getElementById('activityType')?.value;
  const streamField = document.getElementById('stream-url-field');
  if (streamField) {
    streamField.style.display = (type === '1') ? 'block' : 'none';
  }
}

function toggleMetricsUI() {
  const enabled = document.getElementById('enableSystemMetrics')?.checked;
  const box = document.getElementById('metrics-options-box');
  if (box) box.style.display = enabled ? 'flex' : 'none';
}

function collectConfig() {
  return {
    clientId:             v('clientId') || '1533169274401849414',
    activityType:         parseInt(document.getElementById('activityType')?.value) || 0,
    streamUrl:            v('streamUrl'),
    details:              v('details'),
    state:                v('state'),
    largeImageKey:        v('largeImageKey'),
    largeImageText:       v('largeImageText'),
    smallImageKey:        v('smallImageKey'),
    smallImageText:       v('smallImageText'),
    
    partyId:              v('partyId'),
    partySize:            parseInt(v('partySize')) || 0,
    partyMax:             parseInt(v('partyMax'))  || 0,
    
    startTimestamp:       document.getElementById('startTimestamp').checked,
    endTimestamp:         parseInt(v('endTimestamp')) || 0,
    instance:             document.getElementById('instance').checked,
    
    matchSecret:          v('matchSecret'),
    joinSecret:           v('joinSecret'),
    spectateSecret:       v('spectateSecret'),

    button1Label:         v('button1Label'),
    button1Url:           v('button1Url'),
    button2Label:         v('button2Label'),
    button2Url:           v('button2Url'),

    rotationEnabled:      document.getElementById('rotationEnabled')?.checked || false,
    rotationMode:         document.getElementById('rotationMode')?.value || 'sequential',
    liveMediaEnabled:     document.getElementById('liveMediaEnabled')?.checked || false,
    enableSystemMetrics:  document.getElementById('enableSystemMetrics')?.checked || false,
    metricsFormat:        document.getElementById('metricsFormat')?.value || 'full',
    metricsPlacement:     document.getElementById('metricsPlacement')?.value || 'state',
    rotationInterval:     parseInt(document.getElementById('rotationInterval')?.value) || 5,
    rotationFrames:       rotatorFramesList,

    webhookUrl:           v('wh-url'),
    webhookUsername:      v('wh-username'),
    webhookAvatar:        v('wh-avatar')
  };
}

function applyConfigToForm(cfg) {
  const fields = ['clientId','details','state','largeImageKey','largeImageText','smallImageKey','smallImageText','button1Label','button1Url','button2Label','button2Url','partyId','matchSecret','joinSecret','spectateSecret','streamUrl'];
  fields.forEach(f => { const el = document.getElementById(f); if (el) el.value = cfg[f] || ''; });

  if (document.getElementById('activityType')) {
    document.getElementById('activityType').value = cfg.activityType !== undefined ? cfg.activityType : 0;
  }
  onActivityTypeChange();

  if (cfg.webhookUrl && document.getElementById('wh-url')) document.getElementById('wh-url').value = cfg.webhookUrl;
  if (cfg.webhookUsername && document.getElementById('wh-username')) document.getElementById('wh-username').value = cfg.webhookUsername;
  if (cfg.webhookAvatar && document.getElementById('wh-avatar')) document.getElementById('wh-avatar').value = cfg.webhookAvatar;
  updateWebhookEmbedPreview();
  
  if (cfg.partySize) document.getElementById('partySize').value = cfg.partySize;
  if (cfg.partyMax)  document.getElementById('partyMax').value  = cfg.partyMax;
  if (cfg.endTimestamp) document.getElementById('endTimestamp').value = cfg.endTimestamp;
  
  document.getElementById('startTimestamp').checked = cfg.startTimestamp !== false;
  document.getElementById('instance').checked = cfg.instance === true;
  
  if (document.getElementById('rotationEnabled')) {
    document.getElementById('rotationEnabled').checked = !!cfg.rotationEnabled;
  }
  if (document.getElementById('rotationMode') && cfg.rotationMode) {
    document.getElementById('rotationMode').value = cfg.rotationMode;
  }
  if (document.getElementById('liveMediaEnabled')) {
    document.getElementById('liveMediaEnabled').checked = !!cfg.liveMediaEnabled;
  }
  if (document.getElementById('enableSystemMetrics')) {
    document.getElementById('enableSystemMetrics').checked = !!cfg.enableSystemMetrics;
  }
  if (document.getElementById('metricsFormat') && cfg.metricsFormat) {
    document.getElementById('metricsFormat').value = cfg.metricsFormat;
  }
  if (document.getElementById('metricsPlacement') && cfg.metricsPlacement) {
    document.getElementById('metricsPlacement').value = cfg.metricsPlacement;
  }
  if (document.getElementById('rotationInterval') && cfg.rotationInterval) {
    document.getElementById('rotationInterval').value = cfg.rotationInterval;
  }

  rotatorFramesList = Array.isArray(cfg.rotationFrames) ? cfg.rotationFrames : [];
  toggleRotatorUI();
  toggleMetricsUI();
  renderRotatorFrames();

  updateThumb('large', cfg.largeImageKey);
  updateThumb('small', cfg.smallImageKey);
  ['details','state'].forEach(id => updateCharCount(id));
}

let autoSaveTimer = null;

function showAutoSaveStatus(state) {
  const el = document.getElementById('autosave-indicator');
  if (!el) return;
  if (state === 'saving') {
    el.className = 'autosave-indicator saving';
    el.innerHTML = '<span class="save-spinner"></span> <span class="save-text">جاري الحفظ...</span>';
    el.style.opacity = '1';
  } else if (state === 'saved') {
    el.className = 'autosave-indicator saved';
    el.innerHTML = '<span class="save-check">✓</span> <span class="save-text">محفوظ تلقائياً</span>';
    el.style.opacity = '1';
  } else if (state === 'error') {
    el.className = 'autosave-indicator error';
    el.innerHTML = '<span class="save-check">⚠️</span> <span class="save-text">خطأ بالحفظ</span>';
    el.style.opacity = '1';
  }
}

function debouncedAutoSave(immediate = false) {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }

  showAutoSaveStatus('saving');

  const executeSave = async () => {
    try {
      const cfg = collectConfig();
      await window.rpc.saveConfig(cfg);
      showAutoSaveStatus('saved');
    } catch (err) {
      console.error('AutoSave failed:', err);
      showAutoSaveStatus('error');
    }
  };

  if (immediate) {
    executeSave();
  } else {
    autoSaveTimer = setTimeout(executeSave, 300);
  }
}

async function handleSaveConfig() {
  debouncedAutoSave(true);
  toast('✅ تم حفظ الإعدادات', 'success');
}

// ══════════════════════════════════════════
//  RPC START / STOP
// ══════════════════════════════════════════
async function handleStart() {
  const cfg = collectConfig();
  const startBtn = document.getElementById('btn-start');
  startBtn.disabled = true;
  startBtn.innerHTML = '<span class="spinner"></span> جاري الاتصال...';

  const res = await window.rpc.start(cfg);
  startBtn.disabled = false;
  startBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> تشغيل';

  if (res?.success) {
    setRpcState(true);
    toast('<span class="status-dot" style="background:var(--color-success, #22c55e); display:inline-block; margin-left:4px;"></span> الـ RPC يعمل! افتح ديسكورد وشوف ملفك الشخصي', 'success');
  } else {
    toast('❌ ' + (res?.error || 'فشل الاتصال. تأكد أن ديسكورد يعمل.'), 'error');
  }
}

async function handleStop() {
  await window.rpc.stop();
  setRpcState(false);
  toast('تم إيقاف الـ RPC', 'info');
}

function setRpcState(active) {
  isRpcActive = active;
  document.getElementById('btn-start').style.display = active ? 'none' : '';
  document.getElementById('btn-stop').style.display  = active ? '' : 'none';

  const badge = document.getElementById('tl-status');
  const txt   = document.getElementById('tl-status-text');
  badge.className = 'tl-status ' + (active ? 'on' : 'off');
  txt.innerHTML = active ? 'نشط' : 'غير نشط';

  const elapsed = document.getElementById('tl-elapsed');
  if (active) {
    elapsedStart = Date.now();
    elapsed.style.display = '';
    elapsedInterval = setInterval(updateElapsed, 1000);
  } else {
    elapsed.style.display = 'none';
    clearInterval(elapsedInterval);
  }
}

function updateElapsed() {
  if (!elapsedStart) return;
  const s = Math.floor((Date.now() - elapsedStart) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const txt = h > 0 ? `${h}:${pad(m%60)}:${pad(s%60)}` : `${m}:${pad(s%60)}`;
  document.getElementById('elapsed-text').textContent = txt;
}
const pad = n => String(n).padStart(2, '0');

// ══════════════════════════════════════════
//  QUICK PRESETS
// ══════════════════════════════════════════
function buildQuickPresets() {
  const grid = document.getElementById('quick-presets');
  QUICK_PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'preset-btn';
    btn.innerHTML = `<span class="preset-emoji">${p.emoji}</span><div class="preset-info"><div class="preset-name">${p.name}</div><div class="preset-sub">${p.sub}</div></div>`;
    btn.onclick = () => applyPreset(p);
    grid.appendChild(btn);
  });
}

function applyPreset(p) {
  const map = {details:'',state:'',largeImageKey:'',largeImageText:'',smallImageKey:'',smallImageText:'',button1Label:'',button1Url:'',button2Label:'',button2Url:'',partySize:'',partyMax:''};
  Object.keys(map).forEach(k => {
    const el = document.getElementById(k);
    if (el) el.value = p[k] !== undefined ? p[k] : '';
  });
  updateThumb('large', p.largeImageKey || '');
  updateThumb('small', p.smallImageKey || '');
  debouncedPreview();
  debouncedAutoSave(true);
  toast(`تم تطبيق: ${p.emoji} ${p.name}`, 'info');
}

// ══════════════════════════════════════════
//  PROFILES
// ══════════════════════════════════════════
function renderProfiles() {
  const list  = document.getElementById('profiles-list');
  const empty = document.getElementById('profiles-empty');
  list.innerHTML = '';
  if (profiles.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';
  profiles.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-icon">${p.emoji || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>'}</div>
      <div class="item-info">
        <div class="item-name">${esc(p.name)}</div>
        <div class="item-sub">${esc(p.details || '—')} · ${esc(p.state || '—')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-sm" title="تحميل" onclick="loadProfile(${i})">▶</button>
        <button class="btn-sm danger" title="حذف" onclick="deleteProfile(${i})">✕</button>
      </div>`;
    list.appendChild(card);
  });
}

function openSaveProfileModal() {
  document.getElementById('profile-name-input').value = '';
  document.getElementById('profile-emoji-input').value = '';
  showModal('modal-save-profile');
  setTimeout(() => document.getElementById('profile-name-input').focus(), 100);
}

async function confirmSaveProfile() {
  const name  = document.getElementById('profile-name-input').value.trim();
  const emoji = document.getElementById('profile-emoji-input').value.trim() || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>';
  if (!name) { toast('أدخل اسم للبروفايل', 'error'); return; }
  const cfg = collectConfig();
  profiles.push({ name, emoji, ...cfg, savedAt: Date.now() });
  await window.rpc.saveProfiles(profiles);
  renderProfiles();
  debouncedAutoSave(true);
  closeModal('modal-save-profile');
  toast(`✅ تم حفظ البروفايل: ${emoji} ${name}`, 'success');
}

function loadProfile(i) {
  const p = profiles[i];
  if (!p) return;
  applyConfigToForm(p);
  switchTab('rpc');
  debouncedPreview();
  debouncedAutoSave(true);
  toast(`تم تحميل: ${p.emoji || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line></svg>'} ${p.name}`, 'info');
}

async function deleteProfile(i) {
  profiles.splice(i, 1);
  await window.rpc.saveProfiles(profiles);
  renderProfiles();
  toast('تم حذف البروفايل', 'info');
}

// ══════════════════════════════════════════
//  BOTS
// ══════════════════════════════════════════
let activeBotIndex = null; // which bot is currently being customized
let bcAvatarBase64 = null; // pending new avatar data
let bcBannerBase64 = null; // pending new banner data
let currentBotUsername = ''; // track current username so we only patch if changed

function renderBots() {
  const list  = document.getElementById('bots-list');
  const empty = document.getElementById('bots-empty');
  const customizer = document.getElementById('bot-customizer');
  list.innerHTML = '';
  customizer.style.display = 'none';
  activeBotIndex = null;
  if (bots.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';
  bots.forEach((b, i) => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg></div>
      <div class="item-info">
        <div class="item-name">${esc(b.name)}</div>
        <div class="item-sub">${b.token ? b.token.substring(0,14) + '••••' : '—'}</div>
      </div>
      <div class="item-actions">
        <button class="btn-sm" title="تخصيص" onclick="openBotCustomizer(${i})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
        <button class="btn-sm danger" title="حذف" onclick="deleteBot(${i})">✕</button>
      </div>`;
    list.appendChild(card);
  });
}

function openAddBotModal() {
  document.getElementById('bot-name-input').value  = '';
  document.getElementById('bot-token-input').value = '';
  showModal('modal-add-bot');
  setTimeout(() => document.getElementById('bot-name-input').focus(), 100);
}

async function confirmAddBot() {
  const name  = document.getElementById('bot-name-input').value.trim();
  const token = document.getElementById('bot-token-input').value.trim();
  if (!name || !token) { toast('أدخل الاسم والتوكن', 'error'); return; }
  bots.push({ name, token });
  await window.rpc.saveBots(bots);
  renderBots();
  closeModal('modal-add-bot');
  toast('✅ تم حفظ التوكن بشكل مشفر', 'success');
}

function toggleTokenVis() {
  const inp = document.getElementById('bot-token-input');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function openBotCustomizer(i) {
  const b = bots[i];
  if (!b?.token) return;
  activeBotIndex = i;
  bcAvatarBase64 = null;

  toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> جاري جلب بيانات البوت...', 'info');
  document.getElementById('bot-customizer').style.display = 'block';

  try {
    const [userRes, appRes] = await Promise.all([
      fetch('https://discord.com/api/v10/users/@me', { headers: { Authorization: `Bot ${b.token}` }, signal: AbortSignal.timeout(8000) }),
      fetch('https://discord.com/api/v10/oauth2/applications/@me', { headers: { Authorization: `Bot ${b.token}` }, signal: AbortSignal.timeout(8000) }),
    ]);
    const userData = await userRes.json();
    const appData  = appRes.ok ? await appRes.json() : {};

    if (!userRes.ok) { toast('❌ توكن غير صالح', 'error'); document.getElementById('bot-customizer').style.display='none'; return; }

    const av = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=256`
      : `https://cdn.discordapp.com/embed/avatars/0.png`;

    const banner = userData.banner
      ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png?size=512`
      : '';
    document.getElementById('bc-banner-bg').style.backgroundImage = banner ? `url('${banner}')` : '';

    currentBotUsername = userData.username;
    document.getElementById('bc-avatar').src         = av;
    document.getElementById('bc-display-name').textContent = userData.username;
    document.getElementById('bc-display-tag').textContent  = `#${userData.discriminator || '0000'} · ${userData.id}`;
    document.getElementById('bc-username').value     = userData.username;
    document.getElementById('bc-bio').value          = appData.description || '';
    updateBioCount();

    toast(`✅ ${userData.username} — جاهز للتعديل`, 'success');
  } catch (e) {
    toast('❌ فشل الاتصال', 'error');
    document.getElementById('bot-customizer').style.display = 'none';
  }
}

function handleBotAvatarFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    bcAvatarBase64 = reader.result;
    document.getElementById('bc-avatar').src = reader.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function handleBotBannerFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => {
    bcBannerBase64 = reader.result;
    document.getElementById('bc-banner-bg').style.backgroundImage = `url('${reader.result}')`;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

async function updateBotProfile() {
  if (activeBotIndex === null) return;
  const b = bots[activeBotIndex];
  const btn = document.getElementById('bc-save-txt');
  btn.innerHTML = '<span class="spinner"></span>';

  const newUsername = document.getElementById('bc-username').value.trim();
  const payload = {};
  
  if (newUsername && newUsername !== currentBotUsername) payload.username = newUsername;
  if (bcAvatarBase64) payload.avatar = bcAvatarBase64;
  if (bcBannerBase64) payload.banner = bcBannerBase64;

  try {
    let successCount = 0;
    
    // Only call users API if we have something to update there
    if (Object.keys(payload).length > 0) {
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        method: 'PATCH',
        headers: { Authorization: `Bot ${b.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (!res.ok) {
        let errMsg = '❌ فشل التحديث: ' + JSON.stringify(data);
        if (data.retry_after) {
          errMsg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> Rate Limit: انتظر ${Math.ceil(data.retry_after)} ثانية لتغيير معلومات الحساب`;
        } else if (data.errors?.username?._errors?.[0]) {
          const uErr = data.errors.username._errors[0];
          if (uErr.code === 'USERNAME_TOO_MANY_USERS') {
            errMsg = '❌ هذا الاسم مستخدم بكثرة (أكثر من اللازم). جرب اسماً مختلفاً أو أضف رمزاً.';
          } else {
            errMsg = `❌ خطأ في الاسم: ${uErr.message}`;
          }
        }
        toast(errMsg, 'error', 5000);
        btn.innerHTML = ' width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> حفظ التغييرات';
        return;
      } else {
        document.getElementById('bc-display-name').textContent = data.username;
        currentBotUsername = data.username;
      }
    }

    // Update bio via application endpoint
    const bio = document.getElementById('bc-bio').value.trim();
    const appRes = await fetch('https://discord.com/api/v10/applications/@me', {
      method: 'PATCH',
      headers: { Authorization: `Bot ${b.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: bio }),
      signal: AbortSignal.timeout(10000),
    });

    if (appRes.ok) {
      bcAvatarBase64 = null;
      bcBannerBase64 = null;
      toast('✅ تم تحديث ملف البوت بنجاح!', 'success');
    } else {
      toast('⚠️ تم التحديث جزئياً، فشل تحديث البايو', 'error');
    }
  } catch (e) { toast('❌ فشل الاتصال بخوادم ديسكورد', 'error'); }
  btn.innerHTML = ' width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> حفظ التغييرات';
}

let bcStatus = 'online';
let botGatewayWs = null;
let botHeartbeatInterval = null;

function setStatusPill(status) {
  bcStatus = status;
  document.querySelectorAll('.status-pill').forEach(p => p.classList.toggle('active', p.dataset.status === status));
}

function toggleBotStreamUrl(val) {
  const field = document.getElementById('bc-stream-field');
  if (field) field.style.display = parseInt(val) === 1 ? 'block' : 'none';
}

async function updateBotStatus() {
  if (activeBotIndex === null) return;
  const b = bots[activeBotIndex];
  const actType = parseInt(document.getElementById('bc-activity-type').value);
  const actName = document.getElementById('bc-activity-name').value.trim();
  const streamUrl = document.getElementById('bc-stream-url')?.value.trim() || 'https://twitch.tv/discord';
  const btnText = document.getElementById('bc-status-txt');
  const btnParent = btnText.parentElement;
  
  if (botGatewayWs) {
    if (botGatewayWs.readyState === WebSocket.OPEN) {
      botGatewayWs.send(JSON.stringify({
        op: 3,
        d: { status: 'invisible', since: 0, afk: false, activities: [] }
      }));
    }
    botGatewayWs.close(1000);
    botGatewayWs = null;
    if (botHeartbeatInterval) clearInterval(botHeartbeatInterval);
    btnText.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg> تطبيق الحالة';
    btnParent.classList.remove('btn-3d-red');
    btnParent.classList.add('btn-3d-green');
    toast('🛑 تم إيقاف اتصال البوت', 'info');
    return;
  }

  btnText.innerHTML = '<span class="spinner"></span> جاري الاتصال...';

  try {
    botGatewayWs = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    
    botGatewayWs.onopen = () => {
      const activities = [];
      if (actName) {
        const actObj = { name: actName, type: actType };
        if (actType === 1 && streamUrl) {
          actObj.url = streamUrl;
        }
        activities.push(actObj);
      }

      // Send Identify
      const payload = {
        op: 2,
        d: {
          token: b.token,
          properties: { os: 'windows', browser: 'SentryRPC', device: 'SentryRPC' },
          presence: {
            status: bcStatus,
            since: 0,
            afk: false,
            activities: activities
          },
          intents: 0
        }
      };
      botGatewayWs.send(JSON.stringify(payload));
    };

    botGatewayWs.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      if (data.op === 10) {
        botHeartbeatInterval = setInterval(() => {
          if (botGatewayWs && botGatewayWs.readyState === WebSocket.OPEN) {
            botGatewayWs.send(JSON.stringify({ op: 1, d: null }));
          }
        }, data.d.heartbeat_interval);
        
        btnText.innerHTML = 'إيقاف البوت';
        btnParent.classList.remove('btn-3d-green');
        btnParent.classList.add('btn-3d-red');
        toast('<span class="status-dot" style="background:var(--color-success, #22c55e); display:inline-block; margin-left:4px;"></span> البوت متصل الآن بالحالة الجديدة!', 'success');
      }
      if (data.op === 9) {
        toast('❌ انتهت الجلسة (Invalid Session)', 'error');
        botGatewayWs.close();
      }
    };

    botGatewayWs.onclose = () => {
      botGatewayWs = null;
      if (botHeartbeatInterval) clearInterval(botHeartbeatInterval);
      btnText.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg> تطبيق الحالة';
      btnParent.classList.remove('btn-3d-red');
      btnParent.classList.add('btn-3d-green');
    };
    
    botGatewayWs.onerror = () => {
      toast('❌ فشل الاتصال بخوادم ديسكورد', 'error');
      btnText.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg> تطبيق الحالة';
      btnParent.classList.remove('btn-3d-red');
      btnParent.classList.add('btn-3d-green');
    };

  } catch (e) {
    toast('❌ خطأ غير متوقع', 'error');
    btnText.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4 11a9 9 0 0 1 9 9"></path><path d="M4 4a16 16 0 0 1 16 16"></path><circle cx="5" cy="19" r="1"></circle></svg> تطبيق الحالة';
  }
}

function updateBioCount() {
  const bio = document.getElementById('bc-bio');
  const cc  = document.getElementById('bc-bio-count');
  if (!bio || !cc) return;
  cc.textContent = `${bio.value.length}/190`;
  bio.addEventListener('input', () => { cc.textContent = `${bio.value.length}/190`; });
}

async function deleteBot(i) {
  bots.splice(i, 1);
  await window.rpc.saveBots(bots);
  renderBots();
  toast('تم حذف التوكن', 'info');
}

// ══════════════════════════════════════════
//  GUILDS / SERVERS INFO
// ══════════════════════════════════════════
async function loadBotGuilds() {
  if (activeBotIndex === null) return;
  const b = bots[activeBotIndex];
  const listEl  = document.getElementById('bc-guilds-list');
  const statsEl = document.getElementById('bc-guilds-stats');
  listEl.innerHTML = '<div class="guilds-placeholder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> جاري التحميل...</div>';

  try {
    const res  = await fetch('https://discord.com/api/v10/users/@me/guilds?with_counts=true', {
      headers: { Authorization: `Bot ${b.token}` },
      signal: AbortSignal.timeout(10000),
    });
    const guilds = await res.json();
    if (!res.ok) { listEl.innerHTML = '<div class="guilds-placeholder">❌ فشل التحميل</div>'; return; }

    // Stats
    const totalMembers = guilds.reduce((s, g) => s + (g.approximate_member_count || 0), 0);
    document.getElementById('bc-guild-count').textContent = `${guilds.length} سيرفر`;
    document.getElementById('bc-member-est').textContent  = totalMembers > 0 ? `~${totalMembers.toLocaleString()} عضو` : '— عضو';
    statsEl.style.display = 'flex';

    // List
    listEl.innerHTML = '';
    if (guilds.length === 0) {
      listEl.innerHTML = '<div class="guilds-placeholder">البوت غير موجود في أي سيرفر</div>';
      return;
    }

    guilds.forEach(g => {
      const item = document.createElement('div');
      item.className = 'guild-item';

      // Determine role badge
      const isOwner = g.owner;
      const isAdmin = !isOwner && (g.permissions & 0x8) !== 0;
      const badge   = isOwner ? '<span class="guild-badge owner"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><polygon points="2 16 22 16 18 4 15 10 12 2 9 10 6 4 2 16"></polygon><path d="M2 20h20"></path></svg> مالك</span>'
                    : isAdmin ? '<span class="guild-badge admin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> أدمن</span>'
                    :           '<span class="guild-badge member">عضو</span>';

      // Icon
      const iconHtml = g.icon
        ? `<div class="guild-icon"><img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64" alt="" onerror="this.parentElement.textContent='${esc(g.name[0]||'?')}'" /></div>`
        : `<div class="guild-icon">${esc(g.name[0] || '?')}</div>`;

      const memberCount = g.approximate_member_count ? `· ${g.approximate_member_count.toLocaleString()} عضو` : '';

      item.innerHTML = `
        ${iconHtml}
        <div class="guild-info">
          <div class="guild-name">${esc(g.name)}</div>
          <div class="guild-id">${g.id} ${memberCount}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          ${badge}
        </div>`;

      if (!isOwner) {
        const btn = document.createElement('button');
        btn.className = 'btn-sm danger';
        btn.style = 'padding:4px 8px; font-size:11px; background:var(--color-error); border:none; border-radius:4px; color:#fff; cursor:pointer; margin-right:8px;';
        btn.title = 'مغادرة السيرفر';
        btn.innerHTML = svgIcon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>');
        btn.onclick = () => leaveGuild(g.id, g.name);
        item.querySelector('div[style*="display:flex"]').appendChild(btn);
      }

      listEl.appendChild(item);
    });

    toast(`✅ تم تحميل ${guilds.length} سيرفر`, 'success');
  } catch (e) {
    listEl.innerHTML = '<div class="guilds-placeholder">❌ فشل الاتصال</div>';
    toast('❌ فشل جلب السيرفرات', 'error');
  }
}

// ══════════════════════════════════════════

async function leaveGuild(guildId, guildName) {
  if (activeBotIndex === null) return;
  if (!confirm(`هل أنت متأكد من رغبتك في مغادرة البوت لسيرفر: ${guildName}؟`)) return;
  const b = bots[activeBotIndex];
  toast('⏳ جاري المغادرة...', 'info');
  try {
    const res = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bot ${b.token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok || res.status === 204) {
      toast('✅ تمت المغادرة بنجاح!', 'success');
      loadBotGuilds();
    } else {
      const d = await res.json().catch(()=>({}));
      toast('❌ فشل المغادرة: ' + (d.message || 'خطأ'), 'error');
    }
  } catch (e) {
    toast('❌ فشل الاتصال بخوادم ديسكورد', 'error');
  }
}

//  MESSAGE SENDER
// ══════════════════════════════════════════
let msgType = 'dm'; // 'dm' | 'channel'

function setMsgType(type) {
  msgType = type;
  document.getElementById('msgt-dm').classList.toggle('active',      type === 'dm');
  document.getElementById('msgt-channel').classList.toggle('active', type === 'channel');
  document.getElementById('msg-target-label').textContent =
    type === 'dm' ? 'معرّف المستخدم (User ID)' : 'معرّف الروم / القناة (Channel ID)';
  document.getElementById('msg-target').placeholder =
    type === 'dm' ? '123456789012345678' : '987654321098765432';
  document.getElementById('msg-result').style.display = 'none';
}

function toggleEmbedFields() {
  const on = document.getElementById('msg-embed-toggle').checked;
  document.getElementById('embed-fields').style.display = on ? 'flex' : 'none';
}

// Init message char counter
document.addEventListener('DOMContentLoaded', () => {
  const mc = document.getElementById('msg-content');
  if (mc) mc.addEventListener('input', () => {
    document.getElementById('msg-cc').textContent = `${mc.value.length}/2000`;
  });
});

async function sendBotMessage() {
  if (activeBotIndex === null) { toast('اختر بوتاً أولاً', 'error'); return; }
  const b       = bots[activeBotIndex];
  const target  = document.getElementById('msg-target').value.trim();
  const content = document.getElementById('msg-content').value.trim();
  const useEmbed= document.getElementById('msg-embed-toggle').checked;

  if (!target)  { toast('أدخل معرّف المستخدم أو الروم', 'error'); return; }
  if (!content && !useEmbed) { toast('أدخل نص الرسالة', 'error'); return; }

  const btn = document.getElementById('msg-send-txt');
  btn.innerHTML = '<span class="spinner"></span>';

  const resultEl = document.getElementById('msg-result');
  resultEl.style.display = 'none';

  try {
    let channelId = target;

    // For DM: first open DM channel
    if (msgType === 'dm') {
      const dmRes  = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: { Authorization: `Bot ${b.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: target }),
        signal: AbortSignal.timeout(8000),
      });
      const dmData = await dmRes.json();
      if (!dmRes.ok) {
        const err = dmData.message || JSON.stringify(dmData);
        showMsgResult('error', `❌ فشل فتح رسالة خاصة: ${err}`);
        btn.innerHTML = buildSendBtnContent();
        return;
      }
      channelId = dmData.id;
    }

    // Build message body
    const body = {};
    if (content) body.content = content;
    if (useEmbed) {
      const title  = document.getElementById('embed-title').value.trim();
      const desc   = document.getElementById('embed-desc').value.trim();
      const img    = document.getElementById('embed-img').value.trim();
      
      const thumbEl = document.getElementById('embed-thumb');
      const authorEl = document.getElementById('embed-author');
      const authorIconEl = document.getElementById('embed-author-icon');
      const footerEl = document.getElementById('embed-footer');
      const footerIconEl = document.getElementById('embed-footer-icon');
      
      const thumb  = thumbEl ? thumbEl.value.trim() : '';
      const author = authorEl ? authorEl.value.trim() : '';
      const authorIcon = authorIconEl ? authorIconEl.value.trim() : '';
      const footer = footerEl ? footerEl.value.trim() : '';
      const footerIcon = footerIconEl ? footerIconEl.value.trim() : '';
      
      const hexCol = document.getElementById('embed-color').value.trim().replace('#', '');
      const color  = hexCol ? parseInt(hexCol, 16) : 0x6366f1;
      const embed  = { color };
      
      if (title) embed.title = title;
      if (desc)  embed.description = desc;
      if (img)   embed.image = { url: img };
      if (thumb) embed.thumbnail = { url: thumb };
      
      if (author || authorIcon) {
        embed.author = {};
        if (author) embed.author.name = author;
        if (authorIcon) embed.author.icon_url = authorIcon;
      }
      
      if (footer || footerIcon) {
        embed.footer = {};
        if (footer) embed.footer.text = footer;
        if (footerIcon) embed.footer.icon_url = footerIcon;
      }
      
      body.embeds = [embed];
    }

    const sendRes  = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${b.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const sendData = await sendRes.json();

    if (sendRes.ok) {
      const dest = msgType === 'dm' ? `خاص مع ${target}` : `روم ${channelId}`;
      showMsgResult('ok', `✅ تم الإرسال بنجاح إلى ${dest}`);
      toast('✅ الرسالة وصلت!', 'success');
      document.getElementById('msg-content').value = '';
      document.getElementById('msg-cc').textContent = '0/2000';
    } else {
      const err = sendData.message || JSON.stringify(sendData);
      showMsgResult('error', `❌ ${err}`);
    }
  } catch (e) {
    showMsgResult('error', '❌ فشل الاتصال: ' + e.message);
  }

  btn.innerHTML = buildSendBtnContent();
}

function buildSendBtnContent() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> إرسال`;
}

function showMsgResult(type, msg) {
  const el = document.getElementById('msg-result');
  el.className = 'msg-result ' + type;
  el.innerHTML = msg;
  el.style.display = 'block';
}

// ══════════════════════════════════════════
//  PREVIEW
// ══════════════════════════════════════════
function debouncedPreview() {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(updatePreview, 400);
}

function updatePreview() {
  if (isSimulating) return;
  const cfg = collectConfig();

  const largeEl = document.getElementById('pv-large-img');
  const smallEl = document.getElementById('pv-small-img');
  const details  = document.getElementById('pv-details');
  const state    = document.getElementById('pv-state');
  const timeEl   = document.getElementById('pv-time');
  const btns     = document.getElementById('pv-buttons');
  const labelEl  = document.getElementById('pv-section-label');

  if (labelEl) {
    const actType = parseInt(cfg.activityType) || 0;
    if (actType === 1) labelEl.innerHTML = '<span style="color:#a855f7;font-weight:700;">🔴 يبث مباشر</span>';
    else if (actType === 2) labelEl.innerHTML = '<span style="color:#22c55e;font-weight:700;">🎧 يستمع إلى</span>';
    else if (actType === 3) labelEl.innerHTML = '<span style="color:#38bdf8;font-weight:700;">📺 يشاهد</span>';
    else if (actType === 5) labelEl.innerHTML = '<span style="color:#f59e0b;font-weight:700;">🏆 يتنافس في</span>';
    else labelEl.innerHTML = '<span>🎮 يلعب</span>';
  }

  if (cfg.largeImageKey?.startsWith('http') || cfg.largeImageKey?.startsWith('data:image')) {
    largeEl.src = cfg.largeImageKey; largeEl.classList.add('show');
  } else { largeEl.classList.remove('show'); }

  if (cfg.smallImageKey?.startsWith('http') || cfg.smallImageKey?.startsWith('data:image')) {
    smallEl.src = cfg.smallImageKey; smallEl.classList.add('show');
  } else { smallEl.classList.remove('show'); }

  let detailsText = cfg.details || '';
  let stateText   = cfg.state || '';

  if (cfg.enableSystemMetrics) {
    const fmt = cfg.metricsFormat || 'full';
    let sampleMetrics = '⚡ RAM 4.2GB (26%) | 💻 CPU 12%';
    if (fmt === 'percent') sampleMetrics = 'RAM 26% | CPU 12%';
    else if (fmt === 'compact') sampleMetrics = '⚡ RAM | 💻 CPU';
    else if (fmt === 'ram_only') sampleMetrics = 'RAM 4.2GB (26%)';
    else if (fmt === 'cpu_only') sampleMetrics = 'CPU 12%';

    const placement = cfg.metricsPlacement || 'state';
    if (placement === 'state') {
      stateText = stateText ? `${stateText} | ${sampleMetrics}` : sampleMetrics;
    } else if (placement === 'details') {
      detailsText = detailsText ? `${detailsText} | ${sampleMetrics}` : sampleMetrics;
    }
  }

  if (detailsText) { details.textContent = detailsText; details.style.display = ''; }
  else { details.style.display = 'none'; }

  if (stateText) { state.textContent = stateText; state.style.display = ''; }
  else { state.style.display = 'none'; }

  if (cfg.startTimestamp) { timeEl.textContent = '00:00 مضت'; timeEl.style.display = ''; }
  else { timeEl.style.display = 'none'; }

  btns.innerHTML = '';
  if (cfg.button1Label) { const d = document.createElement('div'); d.className='dc-btn'; d.textContent=cfg.button1Label; btns.appendChild(d); }
  if (cfg.button2Label) { const d = document.createElement('div'); d.className='dc-btn'; d.textContent=cfg.button2Label; btns.appendChild(d); }
}

// ══════════════════════════════════════════
//  DISCORD PROFILE & BADGES
// ══════════════════════════════════════════
let currentDiscordUser = null;

const DISCORD_BADGE_DEFS = [
  { key: 'nitro', name: 'مشترك ديسكورد نيترو (Discord Nitro)', check: (_f, p) => p > 0, svg: `<svg viewBox="0 0 24 24" fill="#f47fff"><path d="M4.09 13.43c-.45.31-.69.83-.62 1.37.28 2.25 1.48 4.25 3.29 5.48.44.3 1.01.29 1.43-.03l3.81-2.93-7.91-3.89zm15.82 0l-7.91 3.89 3.81 2.93c.42.32.99.33 1.43.03 1.81-1.23 3.01-3.23 3.29-5.48.07-.54-.17-1.06-.62-1.37zM12 2L9.17 7.74 3.02 8.63c-.53.08-.74.73-.36 1.1l4.45 4.34-1.05 6.13c-.09.53.47.93.94.69L12 18l5 2.89c.47.24 1.03-.16.94-.69l-1.05-6.13 4.45-4.34c.38-.37.17-1.02-.36-1.1l-6.15-.89L12 2z"/></svg>` },
  { key: 'hypesquad_bravery', name: 'هايب سكواد الشجاعة (HypeSquad Bravery)', check: (f) => !!(f & (1 << 6)), svg: `<svg viewBox="0 0 24 24"><path fill="#9c84ef" d="M12 2.5L3.5 6.5V12C3.5 17.5 7.1 22.1 12 23.5C16.9 22.1 20.5 17.5 20.5 12V6.5L12 2.5ZM12 6.2L17.5 8.8V12C17.5 15.6 15.1 18.9 12 20.1C8.9 18.9 6.5 15.6 6.5 12V8.8L12 6.2ZM12 8.5L9 14.5H11.5V17.5L15 11.5H12.5V8.5Z"/></svg>` },
  { key: 'hypesquad_brilliance', name: 'هايب سكواد الذكاء (HypeSquad Brilliance)', check: (f) => !!(f & (1 << 7)), svg: `<svg viewBox="0 0 24 24"><path fill="#f47b67" d="M12 2.5L3.5 6.5V12C3.5 17.5 7.1 22.1 12 23.5C16.9 22.1 20.5 17.5 20.5 12V6.5L12 2.5ZM12 6.5L17 12L12 17.5L7 12L12 6.5Z"/></svg>` },
  { key: 'hypesquad_balance', name: 'هايب سكواد التوازن (HypeSquad Balance)', check: (f) => !!(f & (1 << 8)), svg: `<svg viewBox="0 0 24 24"><path fill="#45ddc0" d="M12 2.5L3.5 6.5V12C3.5 17.5 7.1 22.1 12 23.5C16.9 22.1 20.5 17.5 20.5 12V6.5L12 2.5ZM7.5 10.5L12 7.5L16.5 10.5L12 18.5L7.5 10.5Z"/></svg>` },
  { key: 'active_dev', name: 'مطور نشط (Active Developer)', check: (f) => !!(f & (1 << 22)), svg: `<svg viewBox="0 0 24 24"><path fill="#23a55a" d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM8.46 8.46L11 11L8.46 13.54L7.05 12.12L8.17 11L7.05 9.88L8.46 8.46ZM12 16H17V14.5H12V16ZM15.54 11L16.95 9.59L15.54 8.17L14.12 9.59L15.54 11Z"/></svg>` },
  { key: 'early_supporter', name: 'داعم مبكر (Early Supporter)', check: (f) => !!(f & (1 << 9)), svg: `<svg viewBox="0 0 24 24"><path fill="#f47fff" d="M19 4h-2V2H7v2H5c-1.1 0-2 .9-2 2v3c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 17.9V20H8v2h8v-2h-3v-2.1c1.92-.45 3.42-1.99 3.61-3.96C19.08 13.63 21 11.55 21 9V6c0-1.1-.9-2-2-2zM5 9V6h2v5.08C5.83 10.63 5 9.9 5 9zm14 0c0 .9-.83 1.63-2 2.08V6h2v3z"/></svg>` },
  { key: 'bot_dev', name: 'مطور بوت معتمد مبكر (Verified Bot Developer)', check: (f) => !!(f & (1 << 17)), svg: `<svg viewBox="0 0 24 24"><path fill="#5865f2" d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 4.5L19.5 8.25V15.75L12 19.5L4.5 15.75V8.25L12 4.5ZM10.5 7.5L8.5 9.5L11 12L8.5 14.5L10.5 16.5L14.5 12.5L10.5 7.5Z"/></svg>` },
  { key: 'bug_hunter_1', name: 'صياد ثغرات المستوى 1 (Bug Hunter)', check: (f) => !!(f & (1 << 3)), svg: `<svg viewBox="0 0 24 24"><path fill="#3ba55c" d="M19 8h-1.81a5.985 5.985 0 0 0-1.82-1.96l1.39-1.39-1.41-1.41-1.83 1.83C12.8 4.7 12.41 4.56 12 4.56c-.41 0-.8.14-1.52.51L8.65 3.24 7.24 4.65l1.39 1.39A5.985 5.985 0 0 0 6.81 8H5v2h1.09c-.06.33-.09.66-.09 1v1H4v2h2v1c0 .34.03.67.09 1H5v2h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19v-2h-1.09c.06-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.03-.67-.09-1H19V8zm-6 8h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>` },
  { key: 'bug_hunter_2', name: 'صياد ثغرات ذهبي المستوى 2 (Bug Hunter Gold)', check: (f) => !!(f & (1 << 14)), svg: `<svg viewBox="0 0 24 24"><path fill="#faa61a" d="M19 8h-1.81a5.985 5.985 0 0 0-1.82-1.96l1.39-1.39-1.41-1.41-1.83 1.83C12.8 4.7 12.41 4.56 12 4.56c-.41 0-.8.14-1.52.51L8.65 3.24 7.24 4.65l1.39 1.39A5.985 5.985 0 0 0 6.81 8H5v2h1.09c-.06.33-.09.66-.09 1v1H4v2h2v1c0 .34.03.67.09 1H5v2h1.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H19v-2h-1.09c.06-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.03-.67-.09-1H19V8zm-6 8h-2v-2h2v2zm0-4h-2v-2h2v2z"/></svg>` },
  { key: 'certified_mod', name: 'مشرف ديسكورد معتمد (Discord Moderator)', check: (f) => !!(f & (1 << 18)), svg: `<svg viewBox="0 0 24 24"><path fill="#5865f2" d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm6 9.09c0 4-2.55 7.7-6 8.83-3.45-1.13-6-4.82-6-8.83V6.31l6-2.25 6 2.25v4.78zM12 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>` },
  { key: 'partner', name: 'مالك سيرفر شريك (Partnered Server Owner)', check: (f) => !!(f & (1 << 1)), svg: `<svg viewBox="0 0 24 24"><path fill="#5865f2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>` },
  { key: 'staff', name: 'موظف ديسكورد (Discord Staff)', check: (f) => !!(f & (1 << 0)), svg: `<svg viewBox="0 0 24 24"><path fill="#5865f2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V7h2v4z"/></svg>` }
];

function updateDiscordProfileUI(user) {
  if (!user || !user.id) return;
  currentDiscordUser = user;

  // 1. Avatar
  const avEl = document.getElementById('pv-avatar');
  if (avEl && user.avatarUrl) {
    avEl.src = user.avatarUrl;
  }

  // 2. Avatar Decoration
  const decorEl = document.getElementById('pv-avatar-decor');
  if (decorEl) {
    if (user.avatarDecorationUrl) {
      decorEl.src = user.avatarDecorationUrl;
      decorEl.style.display = 'block';
    } else {
      decorEl.style.display = 'none';
      decorEl.src = '';
    }
  }

  // 3. Names
  const gnEl = document.getElementById('pv-globalname');
  if (gnEl) {
    gnEl.textContent = user.global_name || user.username || 'مستخدم ديسكورد';
  }
  const unEl = document.getElementById('pv-username');
  if (unEl) {
    unEl.textContent = `@${user.username}`;
  }

  // 4. Badges
  const badgesEl = document.getElementById('pv-badges');
  if (badgesEl) {
    const matchedBadges = DISCORD_BADGE_DEFS.filter(b => b.check(user.flags, user.premiumType));
    if (matchedBadges.length > 0) {
      badgesEl.innerHTML = matchedBadges.map(b => `
        <div class="dc-badge-chip" title="${esc(b.name)}" data-badge="${b.key}">
          ${b.svg}
        </div>
      `).join('');
      badgesEl.style.display = 'flex';
    } else {
      badgesEl.innerHTML = '';
      badgesEl.style.display = 'none';
    }
  }

  // 5. Titlebar Discord Status Pill
  const dot = document.getElementById('discord-dot');
  const txt = document.getElementById('discord-text');
  if (dot) dot.style.background = '#22c55e';
  if (txt) {
    txt.style.color = '#22c55e';
    txt.textContent = user.global_name || user.username;
  }

  // 6. Account Sync Bar
  const dabDot = document.getElementById('dab-dot');
  if (dabDot) dabDot.classList.add('online');
  const dabInfo = document.getElementById('dab-account-info');
  if (dabInfo) {
    dabInfo.textContent = `متصل بحساب: ${user.global_name || user.username} (@${user.username})`;
  }
  const dabId = document.getElementById('dab-user-id');
  if (dabId) {
    dabId.textContent = `ID: ${user.id}`;
    dabId.style.display = 'block';
  }
}

async function handleRefreshDiscordUser(silent = false) {
  const syncBtn = document.getElementById('btn-sync-discord');
  if (syncBtn && !silent) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span class="spinner"></span>';
  }

  try {
    const user = await window.rpc.getDiscordUser();
    if (user && user.id) {
      updateDiscordProfileUI(user);
      if (!silent) {
        toast(`✅ تم تحديث بروفايل ديسكورد: ${user.global_name || user.username}`, 'success');
      }
    } else {
      if (!silent) {
        toast('❌ ' + (user?.error || 'تعذر الاتصال بديسكورد. تأكد أنه يعمل.'), 'error');
      }
    }
  } catch (e) {
    if (!silent) toast('❌ خطأ في الاتصال بديسكورد', 'error');
  } finally {
    if (syncBtn && !silent) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg> تحديث الحساب';
    }
  }
}

function handleCopyDiscordUserId() {
  if (currentDiscordUser && currentDiscordUser.id) {
    navigator.clipboard.writeText(currentDiscordUser.id);
    toast(`📋 تم نسخ معرف الحساب (${currentDiscordUser.id}) بنجاح`, 'success');
  } else {
    toast('⚠️ لم يتم التعرف على حساب متصل بعد', 'info');
  }
}

// ══════════════════════════════════════════
//  IMAGE UPLOAD & CROP
// ══════════════════════════════════════════
function handleFileUpload(e, target) {
  const file = e.target.files[0];
  if (!file) return;
  cropTarget = target;
  const reader = new FileReader();
  reader.onloadend = () => { cropSrc = reader.result; openCropModal(reader.result); };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function openCropModal(src) {
  const img  = document.getElementById('crop-img');
  img.src    = src;
  document.getElementById('crop-zoom').value = 1;
  document.getElementById('crop-x').value    = 0;
  document.getElementById('crop-y').value    = 0;
  document.getElementById('crop-zoom-val').textContent = '1.0×';
  applyCropTransform();
  showModal('modal-crop');
}

function applyCropTransform() {
  const zoom = parseFloat(document.getElementById('crop-zoom').value);
  const x    = parseInt(document.getElementById('crop-x').value);
  const y    = parseInt(document.getElementById('crop-y').value);
  document.getElementById('crop-zoom-val').textContent = zoom.toFixed(1) + '×';
  document.getElementById('crop-img').style.transform =
    `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${zoom})`;
}

async function confirmCrop() {
  if (!cropSrc) return;
  const btn = document.getElementById('crop-btn-txt');
  btn.innerHTML = '<span class="spinner"></span>';
  document.getElementById('crop-confirm-btn').disabled = true;

  const zoom = parseFloat(document.getElementById('crop-zoom').value);
  const cx   = parseInt(document.getElementById('crop-x').value);
  const cy   = parseInt(document.getElementById('crop-y').value);

  const container = document.getElementById('crop-container');
  const w = container.offsetWidth, h = container.offsetHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const image = new Image();
  image.src   = cropSrc;
  await new Promise(r => { image.onload = r; });

  const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight) * zoom;
  const iw = image.naturalWidth * scale;
  const ih = image.naturalHeight * scale;
  ctx.drawImage(image, (w - iw) / 2 + cx, (h - ih) / 2 + cy, iw, ih);

  const dataUrl = canvas.toDataURL('image/png', 0.92);
  toast('<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg> جاري رفع الصورة...', 'info');
  const res = await window.rpc.uploadImage(dataUrl);

  btn.textContent = 'رفع الصورة';
  document.getElementById('crop-confirm-btn').disabled = false;

  if (res?.success) {
    const field = cropTarget === 'large' ? 'largeImageKey' : 'smallImageKey';
    document.getElementById(field).value = res.url;
    updateThumb(cropTarget, res.url);
    debouncedPreview();
    debouncedAutoSave(true);
    closeModal('modal-crop');
    toast('✅ تم رفع الصورة بنجاح!', 'success');
  } else {
    toast('❌ فشل الرفع: ' + (res?.error || 'خطأ'), 'error');
  }
}

function onImageKeyInput(which) {
  updateThumb(which, document.getElementById(which === 'large' ? 'largeImageKey' : 'smallImageKey').value);
  debouncedPreview();
  debouncedAutoSave(false);
}

function updateThumb(which, url) {
  const id  = which === 'large' ? 'large-thumb' : 'small-thumb';
  const img = document.getElementById(id);
  if (url?.startsWith('http')) { img.src = url; img.classList.add('show'); }
  else { img.classList.remove('show'); img.src = ''; }
}

// ══════════════════════════════════════════
//  COLLAPSE
// ══════════════════════════════════════════
function toggleCollapse(name) {
  const body = document.getElementById(`body-${name}`);
  const chev = document.getElementById(`chev-${name}`);
  body.classList.toggle('open');
  chev.classList.toggle('open');
}

// ══════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id){ document.getElementById(id).style.display = 'none'; }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
});

// ══════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════
function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, duration);
}

// ══════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════
function v(id){ return (document.getElementById(id)?.value || '').trim(); }
function esc(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }

function updateCharCount(id) {
  const el = document.getElementById(id);
  const cc = document.getElementById(`cc-${id}`);
  if (!el || !cc) return;
  cc.textContent = `${el.value.length}/128`;
  cc.style.color = el.value.length > 110 ? '#eab308' : '';
}

// Translations and Internationalization (i18n)
const translations = {
  ar: {
    tab_rpc: 'الـ RPC',
    tab_profiles: 'البروفايلات',
    tab_bots: 'التوكنات',
    tab_preview: 'المعاينة',
    tab_settings: 'الإعدادات',
    tab_about: 'حول',
    preview_note: '* هذه معاينة تقريبية، مظهر ديسكورد الحقيقي قد يختلف قليلاً',
    settings_title: 'إعدادات التطبيق',
    settings_sub: 'تخصيص الخيارات، السلوك، واللغات',
    card_language: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> لغة التطبيق / Language',
    lbl_select_lang: 'اختر اللغة المفضلة للواجهة',
    card_system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> سلوك التطبيق والنظام',
    opt_autostart: 'التشغيل تلقائياً مع ويندوز',
    opt_autostart_hint: 'بدء SentryRPC تلقائياً عند تسجيل الدخول',
    opt_min_tray: 'التصغير لشريط المهام (Tray) عند الإغلاق',
    opt_min_tray_hint: 'إبقاء التطبيق يعمل في الخلفية بدلاً من الإغلاق الكامل',
    opt_start_min: 'التشغيل مصغراً',
    opt_start_min_hint: 'بدء التطبيق مخفياً في شريط المهام فور التشغيل',
    card_appearance: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg> المظهر واللون الرئيسي',
    lbl_accent_color: 'لون التمييز (Accent Color)',
    about_desc: 'منصة احترافية متكاملة للتحكم في Discord Rich Presence وإدارة توكنات البوتات بأسلوب 3D Anime عصري ومميز.',
    about_server_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> مجتمع وسيرفر الدعم الفني',
    about_server_desc: 'انضم إلى سيرفر الديسكورد الرسمي للحصول على التحديثات، الدعم الفني، والمشاركة في تطوير المشروع:',
    btn_join_discord: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> الانضمام لسيرفر ديسكورد',
    about_dev_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> المبرمج والمشروع',
    lbl_developer: 'المبرمج:',
    lbl_license: 'الترخيص:',
    lbl_framework: 'التقنيات:',
    lbl_security: 'الأمان:',
    val_security: 'تشفير محلي 100% بدون خوادم خارجية',
    rotator_card_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> الـ RPC المتحرك والحي (Dynamic Rotator)',
    rotator_toggle: 'تفعيل الـ RPC المتحرك المتغير',
    rotator_toggle_hint: 'التنقل التلقائي بين فريمات ومشاهد RPC مخصصة',
    metrics_toggle: 'عرض مواصفات الجهاز حياً (Live Hardware Monitor)',
    metrics_toggle_hint: 'إظهار نسبة استهلاك المعالج (CPU) والرام (RAM) حياً في حالة ديسكورد',
    rotator_interval_label: 'سرعة التنقل بين الفريمات',
    rotator_preset_label: 'سيناريو متحرك جاهز',
    frames_list_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg> فريمات المشهد المتحرك:',
    btn_add_frame: '+ إضافة فريم جديد'
  },
  en: {
    tab_rpc: 'RPC',
    tab_profiles: 'Profiles',
    tab_bots: 'Bot Tokens',
    tab_preview: 'Preview',
    tab_settings: 'Settings',
    tab_about: 'About',
    preview_note: '* Approximate preview. Actual Discord appearance may vary.',
    settings_title: 'Application Settings',
    settings_sub: 'Customize options, behavior, and languages',
    card_language: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Language Settings',
    lbl_select_lang: 'Select your preferred interface language',
    card_system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> App & System Behavior',
    opt_autostart: 'Start with Windows',
    opt_autostart_hint: 'Automatically launch SentryRPC on system boot',
    opt_min_tray: 'Minimize to Tray on Close',
    opt_min_tray_hint: 'Keep application running in background when closing',
    opt_start_min: 'Start Minimized',
    opt_start_min_hint: 'Launch app hidden in system tray',
    card_appearance: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg> Theme & Accent Color',
    lbl_accent_color: 'Accent Color',
    about_desc: 'Comprehensive professional suite for Discord Rich Presence & Bot profile management with a sleek 3D Anime aesthetic.',
    about_server_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg> Official Community & Support',
    about_server_desc: 'Join our official Discord server for updates, support, and community discussions:',
    btn_join_discord: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg> Join Discord Server',
    about_dev_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Developer & Project',
    lbl_developer: 'Developer:',
    lbl_license: 'License:',
    lbl_framework: 'Framework:',
    lbl_security: 'Security:',
    val_security: '100% Local Encryption without external servers',
    rotator_card_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> Dynamic Animated RPC Rotator',
    rotator_toggle: 'Enable Dynamic Animated RPC',
    rotator_toggle_hint: 'Automatically cycle through custom RPC scenes & frames',
    metrics_toggle: 'Live Hardware Monitor (CPU & RAM)',
    metrics_toggle_hint: 'Show live system CPU load and RAM usage in Discord status',
    rotator_interval_label: 'Frame Switch Speed',
    rotator_preset_label: 'Pre-made Animated Scenario',
    frames_list_title: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-bottom: 2px;"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg> Scene Animated Frames:',
    btn_add_frame: '+ Add New Frame'
  }
};

let currentSettings = {
  language: 'ar',
  autoStart: false,
  minimizeToTray: true,
  startMinimized: false,
  accentColor: '#06b6d4'
};

function changeLanguage(lang) {
  currentSettings.language = lang;
  applyLanguage(lang);
  saveCurrentSettings();
}

function applyLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  const dict = translations[lang] || translations.ar;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });

  const arBtn = document.getElementById('lang-ar-btn');
  const enBtn = document.getElementById('lang-en-btn');
  if (arBtn && enBtn) {
    if (lang === 'ar') {
      arBtn.style.borderColor = 'var(--accent)';
      arBtn.style.color = 'var(--accent2)';
      enBtn.style.borderColor = '';
      enBtn.style.color = '';
    } else {
      enBtn.style.borderColor = 'var(--accent)';
      enBtn.style.color = 'var(--accent2)';
      arBtn.style.borderColor = '';
      arBtn.style.color = '';
    }
  }
}

function setAccentColor(color) {
  currentSettings.accentColor = color;
  document.documentElement.style.setProperty('--accent', color);
  document.documentElement.style.setProperty('--accent2', color);
  saveCurrentSettings();
  
  document.querySelectorAll('.color-dot').forEach(dot => {
    const bg = dot.style.backgroundColor || dot.style.background;
    dot.classList.toggle('active', bg === color || bg.includes(color));
  });
}

async function loadCurrentSettings() {
  if (!window.rpc?.loadSettings) return;
  const s = await window.rpc.loadSettings();
  if (s) {
    currentSettings = { ...currentSettings, ...s };
  }
  
  const autoStartEl = document.getElementById('setting-autostart');
  const minTrayEl = document.getElementById('setting-min-tray');
  const startMinEl = document.getElementById('setting-start-min');
  
  if (autoStartEl) autoStartEl.checked = !!currentSettings.autoStart;
  if (minTrayEl) minTrayEl.checked = !!currentSettings.minimizeToTray;
  if (startMinEl) startMinEl.checked = !!currentSettings.startMinimized;
  
  if (currentSettings.accentColor) {
    setAccentColor(currentSettings.accentColor);
  }
  
  applyLanguage(currentSettings.language || 'ar');
}

async function saveCurrentSettings() {
  const autoStartEl = document.getElementById('setting-autostart');
  const minTrayEl = document.getElementById('setting-min-tray');
  const startMinEl = document.getElementById('setting-start-min');
  
  if (autoStartEl) currentSettings.autoStart = autoStartEl.checked;
  if (minTrayEl) currentSettings.minimizeToTray = minTrayEl.checked;
  if (startMinEl) currentSettings.startMinimized = startMinEl.checked;
  
  if (window.rpc?.saveSettings) {
    await window.rpc.saveSettings(currentSettings);
  }
}

// Rotator Engine Handlers
function toggleRotatorUI() {
  const enabled = document.getElementById('rotationEnabled')?.checked;
  const area = document.getElementById('rotator-settings-area');
  if (area) area.style.display = enabled ? 'block' : 'none';
}

function renderRotatorFrames() {
  const container = document.getElementById('rotator-frames-list');
  if (!container) return;
  
  if (rotatorFramesList.length === 0) {
    container.innerHTML = `<div style="font-size:11px;color:var(--muted);text-align:center;padding:12px;background:var(--surface3);border-radius:6px">لا توجد فريمات متحركة بعد. اضغط «إضافة فريم جديد» أو اختر سيناريو جاهز.</div>`;
    return;
  }

  container.innerHTML = rotatorFramesList.map((f, i) => {
    let thumbSrc = f.largeImageKey || '';
    const hasThumb = thumbSrc.startsWith('http') || thumbSrc.startsWith('data:image');
    return `
    <div class="rotator-frame-item">
      ${hasThumb 
        ? `<img class="rotator-frame-thumb" src="${esc(thumbSrc)}" alt=""/>` 
        : `<div class="rotator-frame-thumb" style="display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--accent2);">${i + 1}</div>`}
      <div class="rotator-frame-info">
        <div class="rotator-frame-title">
          ${esc(f.name || `فريم ${i + 1}`)}
          <span style="font-size:10px;background:rgba(99,102,241,0.15);color:var(--accent2);padding:2px 6px;border-radius:4px;font-weight:700;margin-right:6px;">⏱ ${f.duration || 5}ث</span>
        </div>
        <div class="rotator-frame-sub">${esc(f.details || '—')} | ${esc(f.state || '—')}</div>
      </div>
      <div class="rotator-frame-actions">
        <button class="btn-sm" onclick="moveFrame(${i}, -1)" ${i === 0 ? 'disabled style="opacity:0.35"' : ''} title="تحريك لأعلى">▲</button>
        <button class="btn-sm" onclick="moveFrame(${i}, 1)" ${i === rotatorFramesList.length - 1 ? 'disabled style="opacity:0.35"' : ''} title="تحريك لأسفل">▼</button>
        <button class="btn-sm" onclick="duplicateFrame(${i})" title="تكرار / نسخ">⎘</button>
        <button class="btn-sm" onclick="editFrame(${i})" title="تعديل">✎</button>
        <button class="btn-sm btn-3d-red" onclick="deleteFrame(${i})" title="حذف">✕</button>
      </div>
    </div>
  `}).join('');
}

function moveFrame(index, dir) {
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= rotatorFramesList.length) return;
  const item = rotatorFramesList.splice(index, 1)[0];
  rotatorFramesList.splice(targetIndex, 0, item);
  renderRotatorFrames();
  debouncedAutoSave(true);
}

function duplicateFrame(index) {
  const item = rotatorFramesList[index];
  if (!item) return;
  const copy = JSON.parse(JSON.stringify(item));
  copy.name = (copy.name || `فريم ${index + 1}`) + ' (نسخة)';
  rotatorFramesList.splice(index + 1, 0, copy);
  renderRotatorFrames();
  debouncedAutoSave(true);
  toast('📋 تم تكرار الفريم بنجاح', 'success');
}

function triggerFrameUpload(target) {
  const fileInput = document.getElementById(`frame-file-${target}`);
  if (fileInput) fileInput.click();
}

async function handleFrameFileSelect(e, target) {
  const file = e.target.files[0];
  if (!file) return;
  
  toast('⏳ جاري تجهيز ورفع صورة الفريم...', 'info');
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64Data = reader.result;
    const thumb = document.getElementById(`frame-${target}-thumb`);
    if (thumb) {
      thumb.src = base64Data;
      thumb.style.display = 'block';
    }

    if (window.rpc?.uploadImage) {
      try {
        const res = await window.rpc.uploadImage(base64Data);
        if (res?.success && res.url) {
          const input = document.getElementById(`frame-${target}-img-input`);
          if (input) input.value = res.url;
          if (thumb) thumb.src = res.url;
          updateMiniFramePreview();
          toast('✅ تم رفع صورة الفريم بنجاح', 'success');
          return;
        }
      } catch (err) {}
    }
    const input = document.getElementById(`frame-${target}-img-input`);
    if (input) input.value = base64Data;
    updateMiniFramePreview();
    toast('✅ تم تعيين الصورة محلياً للفريم', 'info');
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function updateFrameThumb(target) {
  const input = document.getElementById(`frame-${target}-img-input`);
  const thumb = document.getElementById(`frame-${target}-thumb`);
  if (!input || !thumb) return;
  const val = input.value.trim();
  if (val && (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image'))) {
    thumb.src = val;
    thumb.style.display = 'block';
  } else {
    thumb.style.display = 'none';
    thumb.src = '';
  }
}

function selectQuickFrameIcon(url) {
  const largeInput = document.getElementById('frame-large-img-input');
  if (largeInput) {
    largeInput.value = url;
    updateFrameThumb('large');
    updateMiniFramePreview();
  }
}

function updateMiniFramePreview() {
  const name = document.getElementById('frame-name-input')?.value || 'اسم الفريم';
  const details = document.getElementById('frame-details-input')?.value || 'التفاصيل...';
  const state = document.getElementById('frame-state-input')?.value || 'الحالة...';
  const largeKey = document.getElementById('frame-large-img-input')?.value || '';
  const smallKey = document.getElementById('frame-small-img-input')?.value || '';

  const prevName = document.getElementById('mini-prev-name');
  const prevDetails = document.getElementById('mini-prev-details');
  const prevState = document.getElementById('mini-prev-state');
  const prevLarge = document.getElementById('mini-prev-large');
  const prevSmall = document.getElementById('mini-prev-small');

  if (prevName) prevName.textContent = name;
  if (prevDetails) prevDetails.textContent = details;
  if (prevState) prevState.textContent = state;

  if (prevLarge) {
    if (largeKey.startsWith('http://') || largeKey.startsWith('https://') || largeKey.startsWith('data:image')) {
      prevLarge.src = largeKey;
    } else {
      prevLarge.src = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
    }
  }

  if (prevSmall) {
    if (smallKey.startsWith('http://') || smallKey.startsWith('https://') || smallKey.startsWith('data:image')) {
      prevSmall.src = smallKey;
      prevSmall.style.display = 'block';
    } else {
      prevSmall.style.display = 'none';
      prevSmall.src = '';
    }
  }
}

function openAddFrameModal() {
  const titleEl = document.getElementById('frame-modal-title-text');
  if (titleEl) titleEl.textContent = 'إضافة فريم متحرك جديد';
  document.getElementById('frame-edit-index').value = '-1';
  document.getElementById('frame-name-input').value = '';
  document.getElementById('frame-details-input').value = '';
  document.getElementById('frame-state-input').value = '';
  document.getElementById('frame-large-img-input').value = '';
  document.getElementById('frame-small-img-input').value = '';
  if (document.getElementById('frame-duration-input')) {
    document.getElementById('frame-duration-input').value = '5';
  }
  updateFrameThumb('large');
  updateFrameThumb('small');
  updateMiniFramePreview();
  showModal('modal-frame');
}

function editFrame(index) {
  const f = rotatorFramesList[index];
  if (!f) return;
  const titleEl = document.getElementById('frame-modal-title-text');
  if (titleEl) titleEl.textContent = `تعديل الفريم ${index + 1}`;
  document.getElementById('frame-edit-index').value = index;
  document.getElementById('frame-name-input').value = f.name || '';
  document.getElementById('frame-details-input').value = f.details || '';
  document.getElementById('frame-state-input').value = f.state || '';
  document.getElementById('frame-large-img-input').value = f.largeImageKey || '';
  document.getElementById('frame-small-img-input').value = f.smallImageKey || '';
  if (document.getElementById('frame-duration-input')) {
    document.getElementById('frame-duration-input').value = f.duration || 5;
  }
  updateFrameThumb('large');
  updateFrameThumb('small');
  updateMiniFramePreview();
  showModal('modal-frame');
}

function deleteFrame(index) {
  rotatorFramesList.splice(index, 1);
  renderRotatorFrames();
  debouncedAutoSave(true);
  toast('🗑️ تم حذف الفريم', 'info');
}

function saveFrameFromModal() {
  const index = parseInt(document.getElementById('frame-edit-index').value);
  const frameObj = {
    name: v('frame-name-input'),
    details: v('frame-details-input'),
    state: v('frame-state-input'),
    largeImageKey: v('frame-large-img-input'),
    smallImageKey: v('frame-small-img-input'),
    duration: Math.max(2, parseInt(document.getElementById('frame-duration-input')?.value) || 5)
  };

  if (index >= 0 && index < rotatorFramesList.length) {
    rotatorFramesList[index] = frameObj;
    toast('✅ تم تحديث الفريم', 'success');
  } else {
    rotatorFramesList.push(frameObj);
    toast('✅ تم إضافة الفريم', 'success');
  }

  closeModal('modal-frame');
  renderRotatorFrames();
  debouncedAutoSave(true);
}

function applyRotatorScenario(key) {
  if (!key) return;
  document.getElementById('rotationEnabled').checked = true;
  toggleRotatorUI();

  if (key === 'gamer') {
    rotatorFramesList = [
      { name: '🎮 Grand Theft Auto V', details: 'Playing GTA V - FiveM RP', state: 'Server: Sentry City | Online: 128', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/686/686589.png', smallImageKey: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png' },
      { name: '🔫 Valorant Ranked', details: 'Competitive Match - Ascendant', state: 'Score: 11 - 9 (Match Point)', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/785/785116.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' }
    ];
  } else if (key === 'streamer') {
    rotatorFramesList = [
      { name: '🔴 بث حي تويتش', details: 'Live Streaming Twitch', state: 'Playing GTA V RP & Chilling', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png', smallImageKey: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png' },
      { name: '🎥 بث حي يوتيوب', details: 'Live on YouTube Gaming', state: 'Chatting with Subscribers', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/785/785116.png' }
    ];
  } else if (key === 'developer') {
    rotatorFramesList = [
      { name: '💻 VS Code Studio', details: 'Developing Naml RPC 3.0', state: 'Workspace: Clean Source v3.0.0', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/906/906324.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
      { name: '⚡ GitHub Push', details: 'Open Source Repository', state: 'Branch: main (Clean Build)', largeImageKey: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/785/785116.png' }
    ];
  } else if (key === 'music') {
    rotatorFramesList = [
      { name: '🎧 Spotify Playlist', details: 'Listening to Lofi Beats', state: 'ChilledCow - Lofi Girl', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/174/174872.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
      { name: '🌙 Night Synthwave', details: 'Synthwave & Chill Melodies', state: '03:12 / 04:45', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/174/174872.png', smallImageKey: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png' }
    ];
  } else if (key === 'designer') {
    rotatorFramesList = [
      { name: '🎨 Adobe Photoshop', details: 'Designing 3D UI & Assets', state: 'Editing Poster.psd (4K)', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/686/686589.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
      { name: '🖌️ Blender 3D Rendering', details: '3D Scene & Lighting', state: 'Frame 150/300 Rendering', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/906/906324.png', smallImageKey: 'https://cdn-icons-png.flaticon.com/512/785/785116.png' }
    ];
  } else if (key === 'coffee') {
    rotatorFramesList = [
      { name: '☕ استراحة قهوة', details: 'Taking a Coffee Break', state: 'AFK for a few minutes', largeImageKey: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', smallImageKey: 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png' }
    ];
  }

  renderRotatorFrames();
  debouncedAutoSave(true);
  toast('✨ تم تطبيق السيناريو المتحرك بنجاح', 'success');
}

async function handleCheckUpdates() {
  const btn = document.getElementById('btn-check-updates');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري الفحص...';
  }
  try {
    const res = await window.rpc.checkForUpdates();
    if (res?.isLatest) {
      toast('✅ أنت على أحدث إصدار (' + res.currentVersion + ')', 'success');
      const title = document.getElementById('update-status-title');
      const sub = document.getElementById('update-status-sub');
      if (title) title.textContent = 'أنت تستخدم أحدث إصدار مستقر (v' + res.currentVersion + ')';
      if (sub) sub.textContent = 'تم التحقق بنجاح — لا توجد تحديثات معلقة';
    } else {
      toast('🚀 يوجد تحديث جديد متوفر (' + res.latestVersion + ')', 'info');
    }
  } catch (e) {
    toast('⚠️ تعذر فحص التحديثات حالياً', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> <span>فحص التحديثات</span>';
    }
  }
}

async function handleQuickDiscordCheck() {
  try {
    const isRunning = await window.rpc.checkDiscordProcess();
    const dot = document.getElementById('discord-dot');
    const txt = document.getElementById('discord-text');
    if (dot && txt) {
      if (isRunning) {
        dot.style.background = '#22c55e';
        txt.style.color = '#22c55e';
        txt.textContent = 'ديسكورد متصل';
      } else {
        dot.style.background = '#ef4444';
        txt.style.color = '#ef4444';
        txt.textContent = 'ديسكورد مغلق';
      }
    }
    return isRunning;
  } catch (e) {
    return false;
  }
}

async function handleSelfRepair() {
  toast('⏳ جاري فحص وإصلاح التطبيق...', 'info');
  try {
    const report = await window.rpc.selfRepair();
    const container = document.getElementById('repair-steps-container');
    if (container && report.steps) {
      container.innerHTML = report.steps.map(s => `
        <div style="background:var(--surface);border:1px solid var(--border);border-right:3px solid ${s.ok ? 'var(--green)' : 'var(--color-error)'};border-radius:6px;padding:8px 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
            <div style="font-weight:700;font-size:12px;color:${s.ok ? 'var(--green)' : 'var(--color-error)'}">${s.ok ? '✅' : '❌'} ${esc(s.name)}</div>
          </div>
          <div style="font-size:11px;color:var(--muted);">${esc(s.detail)}</div>
        </div>
      `).join('');
    }
    showModal('modal-repair');
    handleQuickDiscordCheck();
    toast(report.success ? '✅ اكتمل الفحص والإصلاح بنجاح' : '⚠️ تم الإصلاح مع وجود تنبيهات', report.success ? 'success' : 'info');
  } catch (e) {
    toast('❌ حدث خطأ أثناء عملية الإصلاح: ' + e.message, 'error');
  }
}

async function handleExportBackup() {
  try {
    const res = await window.rpc.exportBackup();
    if (res?.success) {
      toast('✅ تم تصدير النسخة الاحتياطية بنجاح', 'success');
    } else if (!res?.canceled) {
      toast('❌ فشل التصدير: ' + (res?.error || 'خطأ غير معروف'), 'error');
    }
  } catch (e) {
    toast('❌ تعذر تصدير النسخة الاحتياطية', 'error');
  }
}

async function handleImportBackup() {
  try {
    const res = await window.rpc.importBackup();
    if (res?.success) {
      if (res.config) applyConfigToForm(res.config);
      if (res.profiles) {
        profiles = res.profiles;
        renderProfiles();
      }
      if (res.settings) await loadCurrentSettings();
      updatePreview();
      toast('✅ تم استيراد النسخة الاحتياطية وتحديث الواجهة بنجاح', 'success');
    } else if (!res?.canceled) {
      toast('❌ فشل الاستيراد: ' + (res?.error || 'ملف غير صالح'), 'error');
    }
  } catch (e) {
    toast('❌ تعذر استيراد النسخة الاحتياطية', 'error');
  }
}

async function handleSecureDownload() {
  const urlInput = document.getElementById('custom-download-url');
  const url = (urlInput?.value || '').trim();
  if (!url) {
    toast('⚠️ يُرجى إدخال رابط التحميل أولاً', 'error');
    return;
  }

  const btn = document.getElementById('btn-secure-download');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري التحميل...';
  }

  try {
    const res = await window.rpc.secureDownload(url);
    if (res?.success) {
      toast('✅ تم تحميل الملف بأمان: ' + res.fileName, 'success');
      if (res.fileName.endsWith('.json')) {
        toast('💡 تم حفظ الملف في مجلد التنزيلات الخاص بالتطبيق', 'info');
      }
    } else {
      toast('❌ ' + (res?.error || 'فشل التحميل الآمن'), 'error');
    }
  } catch (e) {
    toast('❌ خطأ في التحميل: ' + e.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> تحميل وتثبيت';
    }
  }
}

// ══════════════════════════════════════════
//  LIVE ROTATOR SIMULATION ENGINE (Feature 4)
// ══════════════════════════════════════════
let isSimulating = false;
let simFrameIndex = 0;
let simTimer = null;
let simProgressTimer = null;
let simPingPongDir = 1;
let simTotalMs = 5000;

function toggleRotatorSimulation() {
  if (isSimulating) {
    stopRotatorSimulation();
  } else {
    startRotatorSimulation();
  }
}

function startRotatorSimulation() {
  if (!rotatorFramesList || rotatorFramesList.length === 0) {
    toast('⚠️ لا توجد فريمات للمعاينة. أضف فريماً أولاً أو اختر سيناريو جاهز.', 'info');
    return;
  }

  isSimulating = true;
  simFrameIndex = 0;
  simPingPongDir = 1;

  const dot = document.getElementById('sim-dot');
  const btn = document.getElementById('btn-sim-toggle');
  const iconSpan = document.getElementById('sim-play-icon');
  if (dot) dot.classList.add('active');
  if (btn) btn.classList.add('sim-btn-active');
  if (iconSpan) {
    iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
  }

  toast('▶ تم بدء المحاكاة الحية للفريمات في شاشة المعاينة', 'info');
  runSimFrame();
}

function stopRotatorSimulation() {
  isSimulating = false;
  if (simTimer) {
    clearTimeout(simTimer);
    simTimer = null;
  }
  if (simProgressTimer) {
    clearInterval(simProgressTimer);
    simProgressTimer = null;
  }

  const dot = document.getElementById('sim-dot');
  const btn = document.getElementById('btn-sim-toggle');
  const iconSpan = document.getElementById('sim-play-icon');
  const counter = document.getElementById('sim-counter-text');
  const fill = document.getElementById('sim-progress-fill');

  if (dot) dot.classList.remove('active');
  if (btn) btn.classList.remove('sim-btn-active');
  if (iconSpan) {
    iconSpan.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  }
  if (counter) counter.textContent = 'المحاكاة متوقفة — اضغط تشغيل للمعاينة الحية';
  if (fill) fill.style.width = '0%';

  updatePreview();
}

function simStepFrame(dir) {
  if (!rotatorFramesList || rotatorFramesList.length === 0) return;
  if (simTimer) clearTimeout(simTimer);
  if (simProgressTimer) clearInterval(simProgressTimer);

  simFrameIndex = (simFrameIndex + dir + rotatorFramesList.length) % rotatorFramesList.length;
  if (isSimulating) {
    runSimFrame();
  } else {
    renderSimFrameUI(simFrameIndex);
  }
}

function renderSimFrameUI(index) {
  const f = rotatorFramesList[index];
  if (!f) return;

  const largeEl = document.getElementById('pv-large-img');
  const smallEl = document.getElementById('pv-small-img');
  const details  = document.getElementById('pv-details');
  const state    = document.getElementById('pv-state');
  const timeEl   = document.getElementById('pv-time');

  if (f.largeImageKey?.startsWith('http') || f.largeImageKey?.startsWith('data:image')) {
    largeEl.src = f.largeImageKey; largeEl.classList.add('show');
  } else { largeEl.classList.remove('show'); }

  if (f.smallImageKey?.startsWith('http') || f.smallImageKey?.startsWith('data:image')) {
    smallEl.src = f.smallImageKey; smallEl.classList.add('show');
  } else { smallEl.classList.remove('show'); }

  if (f.details) { details.textContent = f.details; details.style.display = ''; }
  else { details.style.display = 'none'; }

  if (f.state) { state.textContent = f.state; state.style.display = ''; }
  else { state.style.display = 'none'; }

  if (timeEl) { timeEl.textContent = '00:00 مضت'; timeEl.style.display = ''; }

  const counter = document.getElementById('sim-counter-text');
  if (counter) {
    counter.textContent = `فريم ${index + 1} من ${rotatorFramesList.length} (${f.name || 'بدون اسم'}) — المدة: ${f.duration || 5} ثواني`;
  }
}

function runSimFrame() {
  if (!isSimulating || !rotatorFramesList || rotatorFramesList.length === 0) return;

  if (simFrameIndex >= rotatorFramesList.length) simFrameIndex = 0;
  const currentFrame = rotatorFramesList[simFrameIndex];
  if (!currentFrame) return;

  renderSimFrameUI(simFrameIndex);

  const durationSec = Math.max(2, parseInt(currentFrame.duration) || parseInt(document.getElementById('rotationInterval')?.value) || 5);
  simTotalMs = durationSec * 1000;

  const fill = document.getElementById('sim-progress-fill');
  if (fill) fill.style.width = '0%';

  const startTime = Date.now();
  if (simProgressTimer) clearInterval(simProgressTimer);

  simProgressTimer = setInterval(() => {
    if (!isSimulating) return;
    const elapsed = Date.now() - startTime;
    const pct = Math.min(100, Math.round((elapsed / simTotalMs) * 100));
    if (fill) fill.style.width = `${pct}%`;
    const remSec = Math.max(0, Math.ceil((simTotalMs - elapsed) / 1000));
    const counter = document.getElementById('sim-counter-text');
    if (counter) {
      counter.textContent = `فريم ${simFrameIndex + 1} من ${rotatorFramesList.length} (${currentFrame.name || 'بدون اسم'}) — متبقي ${remSec} ثواني`;
    }
  }, 100);

  simTimer = setTimeout(() => {
    if (!isSimulating) return;
    if (simProgressTimer) clearInterval(simProgressTimer);

    const mode = document.getElementById('rotationMode')?.value || 'sequential';
    let nextIndex = 0;
    if (mode === 'random') {
      if (rotatorFramesList.length > 1) {
        let r;
        do {
          r = Math.floor(Math.random() * rotatorFramesList.length);
        } while (r === simFrameIndex);
        nextIndex = r;
      } else {
        nextIndex = 0;
      }
    } else if (mode === 'pingpong') {
      if (rotatorFramesList.length <= 1) {
        nextIndex = 0;
      } else {
        nextIndex = simFrameIndex + simPingPongDir;
        if (nextIndex >= rotatorFramesList.length) {
          simPingPongDir = -1;
          nextIndex = Math.max(0, rotatorFramesList.length - 2);
        } else if (nextIndex < 0) {
          simPingPongDir = 1;
          nextIndex = Math.min(rotatorFramesList.length - 1, 1);
        }
      }
    } else {
      nextIndex = (simFrameIndex + 1) % rotatorFramesList.length;
    }

    simFrameIndex = nextIndex;
    runSimFrame();
  }, simTotalMs);
}

// ══════════════════════════════════════════
//  WEBHOOK STUDIO & EMBED BUILDER (Feature 6)
// ══════════════════════════════════════════
let webhookFields = [];

function setWebhookColor(hex) {
  const picker = document.getElementById('wh-color-picker');
  const text = document.getElementById('wh-color-hex');
  if (picker) picker.value = hex;
  if (text) text.value = hex;
  updateWebhookEmbedPreview();
  debouncedAutoSave(true);
}

function syncWebhookColor(val) {
  const text = document.getElementById('wh-color-hex');
  if (text) text.value = val;
  updateWebhookEmbedPreview();
  debouncedAutoSave(true);
}

function syncWebhookColorHex(val) {
  const picker = document.getElementById('wh-color-picker');
  if (picker && /^#[0-9A-F]{6}$/i.test(val)) {
    picker.value = val;
  }
  updateWebhookEmbedPreview();
  debouncedAutoSave(true);
}

function addWebhookField(name = '', value = '', inline = false) {
  webhookFields.push({ name, value, inline });
  renderWebhookFields();
  updateWebhookEmbedPreview();
  debouncedAutoSave(true);
}

function removeWebhookField(index) {
  webhookFields.splice(index, 1);
  renderWebhookFields();
  updateWebhookEmbedPreview();
  debouncedAutoSave(true);
}

function renderWebhookFields() {
  const container = document.getElementById('wh-fields-list');
  if (!container) return;

  if (webhookFields.length === 0) {
    container.innerHTML = `<div style="font-size:11px;color:var(--muted);padding:6px;text-align:center;">لا توجد حقول إضافية بعد. اضغط «+ إضافة حقل».</div>`;
    return;
  }

  container.innerHTML = webhookFields.map((f, i) => `
    <div class="wh-field-row">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
        <input type="text" placeholder="عنوان الحقل (Name)..." value="${esc(f.name)}" oninput="webhookFields[${i}].name = this.value; updateWebhookEmbedPreview(); debouncedAutoSave(true)" style="flex:1;font-size:12px;padding:5px 8px;"/>
        <label style="font-size:11px;color:var(--muted);display:flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap;">
          <input type="checkbox" ${f.inline ? 'checked' : ''} onchange="webhookFields[${i}].inline = this.checked; updateWebhookEmbedPreview(); debouncedAutoSave(true)"/> بجانب بعض (Inline)
        </label>
        <button type="button" class="btn-sm btn-3d-red" onclick="removeWebhookField(${i})" title="حذف الحقل" style="padding:2px 6px;">✕</button>
      </div>
      <textarea rows="2" placeholder="محتوى الحقل (Value)..." oninput="webhookFields[${i}].value = this.value; updateWebhookEmbedPreview(); debouncedAutoSave(true)" style="background:var(--surface3);border:1px solid var(--border);border-radius:4px;color:var(--text);font-family:inherit;font-size:11px;padding:6px 8px;width:100%;outline:none;resize:vertical;">${esc(f.value)}</textarea>
    </div>
  `).join('');
}

function updateWebhookEmbedPreview() {
  const username = document.getElementById('wh-username')?.value.trim() || 'Naml Webhook';
  const avatar = document.getElementById('wh-avatar')?.value.trim() || 'https://cdn.discordapp.com/embed/avatars/0.png';
  const content = document.getElementById('wh-content')?.value || '';
  const authorName = document.getElementById('wh-author-name')?.value.trim();
  const authorIcon = document.getElementById('wh-author-icon')?.value.trim();
  const title = document.getElementById('wh-title')?.value.trim();
  const titleUrl = document.getElementById('wh-title-url')?.value.trim();
  const desc = document.getElementById('wh-desc')?.value.trim();
  const colorHex = document.getElementById('wh-color-hex')?.value.trim() || '#5865f2';
  const image = document.getElementById('wh-image-url')?.value.trim();
  const thumb = document.getElementById('wh-thumb-url')?.value.trim();
  const footerText = document.getElementById('wh-footer-text')?.value.trim();
  const footerIcon = document.getElementById('wh-footer-icon')?.value.trim();
  const includeTimestamp = document.getElementById('wh-include-timestamp')?.checked;

  // Header
  const userEl = document.getElementById('wh-prev-username');
  if (userEl) userEl.textContent = username;
  const avEl = document.getElementById('wh-prev-avatar');
  if (avEl) avEl.src = avatar;

  // Content
  const contentEl = document.getElementById('wh-prev-content');
  if (contentEl) {
    if (content) {
      contentEl.textContent = content;
      contentEl.style.display = 'block';
    } else {
      contentEl.style.display = 'none';
    }
  }

  // Embed Card
  const embedCard = document.getElementById('wh-embed-card');
  if (embedCard) {
    embedCard.style.borderRightColor = colorHex;
  }

  // Author
  const authorWrap = document.getElementById('wh-prev-author-wrap');
  const authorNameEl = document.getElementById('wh-prev-author-name');
  const authorImgEl = document.getElementById('wh-prev-author-img');
  if (authorWrap && authorNameEl) {
    if (authorName) {
      authorWrap.style.display = 'flex';
      authorNameEl.textContent = authorName;
      if (authorImgEl) {
        if (authorIcon) {
          authorImgEl.src = authorIcon;
          authorImgEl.style.display = 'block';
        } else {
          authorImgEl.style.display = 'none';
        }
      }
    } else {
      authorWrap.style.display = 'none';
    }
  }

  // Thumbnail
  const thumbEl = document.getElementById('wh-prev-thumb');
  if (thumbEl) {
    if (thumb) {
      thumbEl.src = thumb;
      thumbEl.style.display = 'block';
    } else {
      thumbEl.style.display = 'none';
    }
  }

  // Title
  const titleEl = document.getElementById('wh-prev-title');
  if (titleEl) {
    if (title) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
      if (titleUrl) {
        titleEl.href = titleUrl;
        titleEl.style.cursor = 'pointer';
      } else {
        titleEl.removeAttribute('href');
        titleEl.style.cursor = 'default';
      }
    } else {
      titleEl.style.display = 'none';
    }
  }

  // Description
  const descEl = document.getElementById('wh-prev-desc');
  if (descEl) {
    if (desc) {
      descEl.textContent = desc;
      descEl.style.display = 'block';
    } else {
      descEl.style.display = 'none';
    }
  }

  // Fields
  const fieldsContainer = document.getElementById('wh-prev-fields');
  if (fieldsContainer) {
    const validFields = webhookFields.filter(f => f.name || f.value);
    if (validFields.length > 0) {
      fieldsContainer.style.display = 'grid';
      fieldsContainer.innerHTML = validFields.map(f => `
        <div class="wh-field" style="${f.inline ? 'grid-column: span 1;' : 'grid-column: 1 / -1;'}">
          <div class="wh-field-name">${esc(f.name || '—')}</div>
          <div class="wh-field-val">${esc(f.value || '—')}</div>
        </div>
      `).join('');
    } else {
      fieldsContainer.style.display = 'none';
      fieldsContainer.innerHTML = '';
    }
  }

  // Image
  const imgEl = document.getElementById('wh-prev-image');
  if (imgEl) {
    if (image) {
      imgEl.src = image;
      imgEl.style.display = 'block';
    } else {
      imgEl.style.display = 'none';
    }
  }

  // Footer
  const footerWrap = document.getElementById('wh-prev-footer-wrap');
  const footerTextEl = document.getElementById('wh-prev-footer-text');
  const footerImgEl = document.getElementById('wh-prev-footer-icon');
  const footerTimeEl = document.getElementById('wh-prev-footer-time');

  if (footerWrap) {
    if (footerText || includeTimestamp) {
      footerWrap.style.display = 'flex';
      if (footerTextEl) footerTextEl.textContent = footerText || '';
      if (footerImgEl) {
        if (footerIcon) {
          footerImgEl.src = footerIcon;
          footerImgEl.style.display = 'block';
        } else {
          footerImgEl.style.display = 'none';
        }
      }
      if (footerTimeEl) {
        if (includeTimestamp) {
          const now = new Date();
          footerTimeEl.textContent = `• اليوم الساعة ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
          footerTimeEl.style.display = 'inline';
        } else {
          footerTimeEl.style.display = 'none';
        }
      }
    } else {
      footerWrap.style.display = 'none';
    }
  }
}

function buildWebhookPayload() {
  const username = document.getElementById('wh-username')?.value.trim();
  const avatar = document.getElementById('wh-avatar')?.value.trim();
  const content = document.getElementById('wh-content')?.value;
  const authorName = document.getElementById('wh-author-name')?.value.trim();
  const authorIcon = document.getElementById('wh-author-icon')?.value.trim();
  const title = document.getElementById('wh-title')?.value.trim();
  const titleUrl = document.getElementById('wh-title-url')?.value.trim();
  const desc = document.getElementById('wh-desc')?.value.trim();
  const colorHex = document.getElementById('wh-color-hex')?.value.trim() || '#5865f2';
  const image = document.getElementById('wh-image-url')?.value.trim();
  const thumb = document.getElementById('wh-thumb-url')?.value.trim();
  const footerText = document.getElementById('wh-footer-text')?.value.trim();
  const footerIcon = document.getElementById('wh-footer-icon')?.value.trim();
  const includeTimestamp = document.getElementById('wh-include-timestamp')?.checked;

  const payload = {};
  if (username) payload.username = username;
  if (avatar) payload.avatar_url = avatar;
  if (content) payload.content = content;

  const embed = {};
  if (title) embed.title = title;
  if (titleUrl) embed.url = titleUrl;
  if (desc) embed.description = desc;

  try {
    const cleanHex = colorHex.replace('#', '');
    embed.color = parseInt(cleanHex, 16);
  } catch (e) {
    embed.color = 0x5865f2;
  }

  if (authorName) {
    embed.author = { name: authorName };
    if (authorIcon) embed.author.icon_url = authorIcon;
  }

  if (image) embed.image = { url: image };
  if (thumb) embed.thumbnail = { url: thumb };

  const validFields = webhookFields.filter(f => f.name || f.value);
  if (validFields.length > 0) {
    embed.fields = validFields.map(f => ({
      name: f.name || '\u200B',
      value: f.value || '\u200B',
      inline: !!f.inline
    }));
  }

  if (footerText) {
    embed.footer = { text: footerText };
    if (footerIcon) embed.footer.icon_url = footerIcon;
  }

  if (includeTimestamp) {
    embed.timestamp = new Date().toISOString();
  }

  if (Object.keys(embed).length > 1 || embed.title || embed.description || (embed.fields && embed.fields.length > 0)) {
    payload.embeds = [embed];
  }

  return payload;
}

function copyWebhookJson() {
  const payload = buildWebhookPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    toast('📋 تم نسخ كود الـ JSON إلى الحافظة بنجاح', 'success');
  }).catch(() => {
    toast('❌ تعذر نسخ الكود', 'error');
  });
}

function resetWebhookForm() {
  ['wh-username','wh-avatar','wh-content','wh-author-name','wh-author-icon','wh-title','wh-title-url','wh-desc','wh-image-url','wh-thumb-url','wh-footer-text','wh-footer-icon'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  webhookFields = [];
  setWebhookColor('#5865f2');
  renderWebhookFields();
  updateWebhookEmbedPreview();
  toast('↺ تم مسح بيانات الويب هوك والبدء من جديد', 'info');
}

function applyWebhookTemplate(key) {
  if (key === 'announcement') {
    document.getElementById('wh-username').value = 'إعلانات السيرفر الرسمية';
    document.getElementById('wh-avatar').value = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
    document.getElementById('wh-content').value = '@everyone إعلان هام لجميع الأعضاء!';
    document.getElementById('wh-author-name').value = 'مجلس إدارة السيرفر';
    document.getElementById('wh-author-icon').value = 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png';
    document.getElementById('wh-title').value = '📢 تحديثات وفعاليات جديدة قادمة للسيرفر';
    document.getElementById('wh-title-url').value = 'https://discord.gg';
    document.getElementById('wh-desc').value = 'يسعدنا أن نعلن لجميع أعضائنا الكرام عن إطلاق حزمة فعاليات وبطولات أسبوعية بجوائز قيّمة!\n\nنتمنى لكم قضاء أمتع الأوقات معنا.';
    setWebhookColor('#5865f2');
    webhookFields = [
      { name: '🏆 موعد الفعالية الأولى', value: 'الجمعة القادم الساعة 8:00 مساءً بتوقيت مكة', inline: true },
      { name: '🎁 مجموع الجوائز', value: 'اشتراكات نيترو ورتب حصرية ومكافآت', inline: true }
    ];
    document.getElementById('wh-image-url').value = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&q=80';
    document.getElementById('wh-thumb-url').value = 'https://cdn-icons-png.flaticon.com/512/785/785116.png';
    document.getElementById('wh-footer-text').value = 'سنتري كي اس اي • مجتمع ديسكورد العربي الأول';
    document.getElementById('wh-footer-icon').value = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
  } else if (key === 'rules') {
    document.getElementById('wh-username').value = 'دليل وقوانين السيرفر';
    document.getElementById('wh-avatar').value = 'https://cdn-icons-png.flaticon.com/512/906/906324.png';
    document.getElementById('wh-content').value = '';
    document.getElementById('wh-author-name').value = 'إدارة النظام والأمن';
    document.getElementById('wh-title').value = '📜 قوانين وإرشادات السيرفر الأساسية';
    document.getElementById('wh-desc').value = 'للحفاظ على بيئة محترمة وممتعة للجميع، يُرجى من جميع الأعضاء الالتزام بالقوانين التالية:\n\n1. الاحترام المتبادل بين جميع الأعضاء وتجنب الخلافات.\n2. يُمنع نشر الروابط والإعلانات دون إذن مسبق.\n3. الالتزام بمواضيع الرومات المحددة.\n4. الامتثال لتوجيهات المشرفين والإدارة.';
    setWebhookColor('#f59e0b');
    webhookFields = [
      { name: '🛡️ الإبلاغ عن المخالفات', value: 'تواصل مع أي مشرف متواجد أو افتح تذكرة دعم', inline: true },
      { name: '⚖️ العقوبات', value: 'تحذير ← ميوت مؤقت ← حظر نهائي في حال التكرار', inline: true }
    ];
    document.getElementById('wh-image-url').value = '';
    document.getElementById('wh-thumb-url').value = 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png';
    document.getElementById('wh-footer-text').value = 'سنتري كي اس اي • نتمنى لكم إقامة طيبة';
  } else if (key === 'update') {
    document.getElementById('wh-username').value = 'نامل — تحديثات النظام';
    document.getElementById('wh-avatar').value = 'https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png';
    document.getElementById('wh-content').value = '🚀 صدور التحديث الضخم نامل الإصدار 3.0.0 (Naml v3.0.0)!';
    document.getElementById('wh-author-name').value = 'QZV سنتري كي اس اي';
    document.getElementById('wh-title').value = '🎉 إطلاق نامل 3.0.0 — قفزة نوعية في عالم الـ Rich Presence';
    document.getElementById('wh-desc').value = 'يسرنا تقديم النسخة الجديدة كلياً من نامل الغنية بالميزات الاستثنائية للتحكم بالظهور وإدارة البوتات والويب هوك.';
    setWebhookColor('#22c55e');
    webhookFields = [
      { name: '🎮 أنواع النشاط المخصصة', value: 'دعم البث المباشر والموسيقى والمشاهدة والتنافس', inline: true },
      { name: '⏱ فريمات متحركة مستقلة', value: 'تحديد وقت مستقل لكل فريم وأنماط عشوائية وذهاب وإياب', inline: true },
      { name: '🎵 وسائط الموسيقى الحية', value: 'اكتشاف أغاني Spotify والوسائط تلقائياً وإظهارها فوراً', inline: true },
      { name: '📡 استوديو الويب هوك', value: 'تصميم وإرسال Embeds ورسائل غنية لسيرفرك بنقرة زر', inline: true }
    ];
    document.getElementById('wh-image-url').value = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80';
    document.getElementById('wh-thumb-url').value = 'https://cdn-icons-png.flaticon.com/512/5968/5968819.png';
    document.getElementById('wh-footer-text').value = 'جميع الحقوق محفوظة لـ QZV سنتري كي اس اي';
  } else if (key === 'welcome') {
    document.getElementById('wh-username').value = 'مساعد الترحيب';
    document.getElementById('wh-avatar').value = 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png';
    document.getElementById('wh-content').value = 'أهلاً وسهلاً بك في سيرفرنا! 👋';
    document.getElementById('wh-author-name').value = 'ترحيب بالأعضاء الجدد';
    document.getElementById('wh-title').value = 'نورت السيرفر وانضمامك يسعدنا! 🌟';
    document.getElementById('wh-desc').value = 'نتمنى أن تجد في مجتمعنا كل ما يفيدك ويمتعك. خذ جولة في الرومات وتعرف على الأصدقاء.';
    setWebhookColor('#eb459e');
    webhookFields = [
      { name: '📌 البداية', value: 'تفضل بالاطلاع على القوانين في روم الإرشادات', inline: true },
      { name: '💬 الدردشة', value: 'شارك معنا الحديث في الشات العام', inline: true }
    ];
    document.getElementById('wh-thumb-url').value = 'https://cdn-icons-png.flaticon.com/512/174/174872.png';
    document.getElementById('wh-footer-text').value = 'سنتري كي اس اي • مجتمع القادة والمبدعين';
  }

  renderWebhookFields();
  updateWebhookEmbedPreview();
  toast('✨ تم تطبيق القالب بنجاح', 'success');
}

async function sendDiscordWebhook() {
  const url = document.getElementById('wh-url')?.value.trim();
  if (!url) {
    toast('⚠️ يُرجى إدخال رابط الويب هوك (Webhook URL) أولاً', 'error');
    document.getElementById('wh-url')?.focus();
    return;
  }
  if (!url.startsWith('https://discord.com/api/webhooks/')) {
    toast('⚠️ رابط الويب هوك غير صالح، يجب أن يبدأ بـ https://discord.com/api/webhooks/', 'error');
    return;
  }

  const payload = buildWebhookPayload();
  if (!payload.content && (!payload.embeds || payload.embeds.length === 0)) {
    toast('⚠️ يُرجى كتابة محتوى للرسالة أو تصميم Embed قبل الإرسال', 'error');
    return;
  }

  const btn = document.getElementById('btn-send-webhook');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري الإرسال...';
  }

  const statusMsg = document.getElementById('wh-status-msg');
  if (statusMsg) statusMsg.style.display = 'none';

  try {
    const res = await window.rpc.sendWebhook({ webhookUrl: url, payload });
    if (res?.success) {
      toast('🚀 تم إرسال رسالة الويب هوك إلى ديسكورد بنجاح!', 'success');
      if (statusMsg) {
        statusMsg.className = 'msg-result success';
        statusMsg.style.display = 'block';
        statusMsg.style.background = 'rgba(34,197,94,0.15)';
        statusMsg.style.color = '#22c55e';
        statusMsg.style.border = '1px solid rgba(34,197,94,0.3)';
        statusMsg.textContent = '✅ تم إرسال الرسالة إلى ديسكورد بنجاح (HTTP 204)';
      }
    } else {
      toast('❌ فشل إرسال الويب هوك: ' + (res?.error || 'خطأ غير معروف'), 'error');
      if (statusMsg) {
        statusMsg.className = 'msg-result error';
        statusMsg.style.display = 'block';
        statusMsg.style.background = 'rgba(239,68,68,0.15)';
        statusMsg.style.color = '#ef4444';
        statusMsg.style.border = '1px solid rgba(239,68,68,0.3)';
        statusMsg.textContent = '❌ فشل الإرسال: ' + (res?.error || 'تحقق من صحة رابط الويب هوك والبيانات');
      }
    }
  } catch (err) {
    toast('❌ حدث خطأ أثناء إرسال الويب هوك: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> إرسال الآن 🚀';
    }
  }
}


