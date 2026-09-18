const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, safeStorage, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec } = require('child_process');

app.setName('naml');
try {
  app.setPath('userData', path.join(app.getPath('appData'), 'naml'));
} catch (e) {}

// Enforce single instance to prevent Discord pipe collisions
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

function getAllDataDirs() {
  const dirs = [
    app.getPath('userData'),
    path.join(app.getPath('appData'), 'naml'),
    path.join(app.getPath('appData'), 'sentry-rpc'),
    path.join(app.getPath('appData'), 'Electron'),
    __dirname
  ];
  return [...new Set(dirs.filter(Boolean))];
}

function writeToAllDestinations(filename, content) {
  const targetDirs = [
    app.getPath('userData'),
    path.join(app.getPath('appData'), 'naml'),
    path.join(app.getPath('appData'), 'sentry-rpc'),
    __dirname
  ];
  const uniqueDirs = [...new Set(targetDirs.filter(Boolean))];

  for (const dir of uniqueDirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const targetPath = path.join(dir, filename);
      fs.writeFileSync(targetPath, content, typeof content === 'string' ? 'utf-8' : undefined);
    } catch (err) {
      console.error(`Failed to write ${filename} to ${dir}:`, err);
    }
  }
}

const DATA_FILE = path.join(app.getPath('userData'), 'sentry-rpc-config.json');
const PROFILES_FILE = path.join(app.getPath('userData'), 'sentry-rpc-profiles.json');
const BOTS_FILE = path.join(app.getPath('userData'), 'sentry-rpc-bots.enc');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'sentry-rpc-settings.json');

let mainWindow = null;
let tray = null;
let activeRpcClient = null;
let rpcInterval = null;
let activeActivity = null;
let isQuitting = false;

const DEFAULT_CONFIG = {
  clientId: '1533169274401849414',
  details: '',
  state: '',
  largeImageKey: '',
  largeImageText: '',
  smallImageKey: '',
  smallImageText: '',
  partySize: 0,
  partyMax: 0,
  startTimestamp: true,
  button1Label: '',
  button1Url: '',
  button2Label: '',
  button2Url: ''
};

const DEFAULT_SETTINGS = {
  language: 'ar',
  autoStart: false,
  minimizeToTray: true,
  startMinimized: false,
  accentColor: '#6366f1'
};

function loadConfig() {
  try {
    const candidateDirs = getAllDataDirs();
    let bestConfig = null;
    let newestMtime = -1;
    let fallbackFrames = [];

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, 'sentry-rpc-config.json');
      try {
        if (fs.existsSync(fullPath)) {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const stat = fs.statSync(fullPath);
          if (Array.isArray(parsed.rotationFrames) && parsed.rotationFrames.length > fallbackFrames.length) {
            fallbackFrames = parsed.rotationFrames;
          }
          if (stat.mtimeMs > newestMtime) {
            newestMtime = stat.mtimeMs;
            bestConfig = parsed;
          }
        }
      } catch (e) {}
    }

    if (bestConfig) {
      if ((!Array.isArray(bestConfig.rotationFrames) || bestConfig.rotationFrames.length === 0) && fallbackFrames.length > 0) {
        bestConfig.rotationFrames = fallbackFrames;
      }
      const merged = { ...DEFAULT_CONFIG, ...bestConfig };
      writeToAllDestinations('sentry-rpc-config.json', JSON.stringify(merged, null, 2));
      return merged;
    }
  } catch (e) {
    console.error('loadConfig error:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    const safe = { ...config };
    delete safe.botToken;
    writeToAllDestinations('sentry-rpc-config.json', JSON.stringify(safe, null, 2));
    return { success: true };
  } catch (e) {
    console.error('Save config error:', e);
    return { success: false, error: e.message };
  }
}

function loadProfiles() {
  try {
    const candidateDirs = getAllDataDirs();
    let bestProfiles = [];
    let newestMtime = -1;

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, 'sentry-rpc-profiles.json');
      try {
        if (fs.existsSync(fullPath)) {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const stat = fs.statSync(fullPath);
          if (Array.isArray(parsed) && stat.mtimeMs > newestMtime) {
            newestMtime = stat.mtimeMs;
            bestProfiles = parsed;
          }
        }
      } catch (e) {}
    }

    if (bestProfiles.length > 0) {
      writeToAllDestinations('sentry-rpc-profiles.json', JSON.stringify(bestProfiles, null, 2));
      return bestProfiles;
    }
  } catch (e) {
    console.error('loadProfiles error:', e);
  }
  return [];
}

function saveProfiles(profiles) {
  try {
    writeToAllDestinations('sentry-rpc-profiles.json', JSON.stringify(profiles, null, 2));
    return { success: true };
  } catch (e) {
    console.error('Save profiles error:', e);
    return { success: false, error: e.message };
  }
}

function loadBots() {
  try {
    const candidateDirs = getAllDataDirs();
    let bestBots = [];
    let newestMtime = -1;

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, 'sentry-rpc-bots.enc');
      try {
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs > newestMtime) {
            const raw = fs.readFileSync(fullPath);
            let str;
            if (safeStorage.isEncryptionAvailable()) {
              try {
                str = safeStorage.decryptString(raw);
              } catch (decErr) {
                str = Buffer.from(raw.toString(), 'base64').toString('utf-8');
              }
            } else {
              str = Buffer.from(raw.toString(), 'base64').toString('utf-8');
            }
            const parsed = JSON.parse(str);
            if (Array.isArray(parsed)) {
              newestMtime = stat.mtimeMs;
              bestBots = parsed;
            }
          }
        }
      } catch (e) {}
    }

    if (bestBots.length > 0) {
      saveBots(bestBots);
      return bestBots;
    }
  } catch (e) {}
  return [];
}

function saveBots(bots) {
  try {
    const str = JSON.stringify(bots);
    let payload;
    if (safeStorage.isEncryptionAvailable()) {
      try {
        payload = safeStorage.encryptString(str);
      } catch {
        payload = Buffer.from(str).toString('base64');
      }
    } else {
      payload = Buffer.from(str).toString('base64');
    }
    writeToAllDestinations('sentry-rpc-bots.enc', payload);
    return { success: true };
  } catch (e) {
    console.error('Save bots error:', e);
    return { success: false, error: e.message };
  }
}

function loadSettings() {
  try {
    const candidateDirs = getAllDataDirs();
    let bestSettings = null;
    let newestMtime = -1;

    for (const dir of candidateDirs) {
      const fullPath = path.join(dir, 'sentry-rpc-settings.json');
      try {
        if (fs.existsSync(fullPath)) {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const stat = fs.statSync(fullPath);
          if (stat.mtimeMs > newestMtime) {
            newestMtime = stat.mtimeMs;
            bestSettings = parsed;
          }
        }
      } catch (e) {}
    }

    if (bestSettings) {
      const merged = { ...DEFAULT_SETTINGS, ...bestSettings };
      writeToAllDestinations('sentry-rpc-settings.json', JSON.stringify(merged, null, 2));
      return merged;
    }
  } catch (e) {
    console.error('loadSettings error:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    const updated = { ...DEFAULT_SETTINGS, ...settings };
    writeToAllDestinations('sentry-rpc-settings.json', JSON.stringify(updated, null, 2));
    
    app.setLoginItemSettings({
      openAtLogin: !!updated.autoStart,
      openAsHidden: !!updated.startMinimized
    });
    
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

const os = require('os');

let rotationFrames = [];
let currentFrameIndex = 0;

let prevCpuTimes = null;
let cachedCpuPercent = 0;

function calculateCpuPercent() {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return 0;
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  if (prevCpuTimes) {
    const idleDiff = idle - prevCpuTimes.idle;
    const totalDiff = total - prevCpuTimes.total;
    if (totalDiff > 0) {
      cachedCpuPercent = Math.max(0, Math.min(100, Math.round((1 - (idleDiff / totalDiff)) * 100)));
    }
  }

  prevCpuTimes = { idle, total };
  return cachedCpuPercent;
}

function getSystemMetricsText(format = 'full') {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = Math.max(0, totalMem - freeMem);
  const ramPercent = Math.round((usedMem / totalMem) * 100);
  const usedGB = (usedMem / (1024 * 1024 * 1024)).toFixed(1);
  const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(1);
  const cpuLoad = calculateCpuPercent();

  if (format === 'percent') {
    return `الرام: ${ramPercent}% | المعالج: ${cpuLoad}%`;
  }
  if (format === 'compact') {
    return `⚡ RAM: ${usedGB}GB (${ramPercent}%) | 💻 CPU: ${cpuLoad}%`;
  }
  if (format === 'ram_only') {
    return `الرام: ${usedGB}GB (${ramPercent}%)`;
  }
  if (format === 'cpu_only') {
    return `المعالج: ${cpuLoad}%`;
  }
  return `الرام: ${usedGB}GB / ${totalGB}GB (${ramPercent}%) | المعالج: ${cpuLoad}%`;
}

async function startRpc(config) {
  if (activeRpcClient) {
    try {
      await activeRpcClient.clearActivity();
      await new Promise(r => setTimeout(r, 100));
      await activeRpcClient.destroy();
    } catch (e) {}
    activeRpcClient = null;
    await new Promise(r => setTimeout(r, 200));
  }
  if (rpcInterval) {
    clearInterval(rpcInterval);
    rpcInterval = null;
  }

  // Check if Discord process is running first
  const isUp = await checkDiscordRunning();
  if (!isUp) {
    return { success: false, error: 'تطبيق ديسكورد غير مفتوح. يُرجى فتح تطبيق ديسكورد في جهازك ثم المحاولة.' };
  }

  const DiscordRPC = require('discord-rpc');
  const clientId = String(config.clientId || '1533169274401849414').trim();
  try {
    DiscordRPC.register(clientId);
  } catch (e) {}

  const client = new DiscordRPC.Client({ transport: 'ipc' });

  return new Promise((resolve) => {
    let resolved = false;

    client.on('ready', () => {
      activeRpcClient = client;
      if (client.user) {
        lastKnownDiscordUser = formatDiscordUser(client.user);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('discord-user-changed', lastKnownDiscordUser);
        }
      }

      // Detect if user exits Discord or switches account while RPC is active
      client.transport?.once('close', () => {
        if (activeRpcClient === client) {
          activeRpcClient = null;
          if (rpcInterval) {
            clearInterval(rpcInterval);
            rpcInterval = null;
          }
        }
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('rpc-stopped');
        }
      });

      if (config.rotationEnabled && Array.isArray(config.rotationFrames) && config.rotationFrames.length > 0) {
        rotationFrames = config.rotationFrames;
        currentFrameIndex = 0;
        const intervalMs = Math.max(3000, (parseInt(config.rotationInterval) || 5) * 1000);

        const applyNextFrame = () => {
          if (!activeRpcClient) return;
          const currentFrame = rotationFrames[currentFrameIndex];
          const mergedConfig = { ...config, ...currentFrame };
          activeActivity = buildActivity(mergedConfig);
          activeRpcClient.setActivity(activeActivity).catch(() => {});
          currentFrameIndex = (currentFrameIndex + 1) % rotationFrames.length;
        };

        applyNextFrame();
        rpcInterval = setInterval(applyNextFrame, intervalMs);
      } else {
        activeActivity = buildActivity(config);
        client.setActivity(activeActivity).catch(() => {});

        rpcInterval = setInterval(() => {
          if (activeRpcClient && activeActivity) {
            const freshActivity = config.enableSystemMetrics ? buildActivity(config) : activeActivity;
            activeRpcClient.setActivity(freshActivity).catch(() => {});
          }
        }, 15000);
      }

      if (!resolved) {
        resolved = true;
        resolve({ success: true });
      }
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try { client.destroy(); } catch (e) {}
        resolve({ success: false, error: 'انتهت مهلة الاتصال بديسكورد. تأكد أن تطبيق ديسكورد يعمل ومعرف التطبيق صحيح.' });
      }
    }, 7000);

    client.login({ clientId }).catch((err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try { client.destroy(); } catch (e) {}
        resolve({ success: false, error: 'تعذر الاتصال بديسكورد (' + err.message + '). تأكد أن ديسكورد يعمل.' });
      }
    });
  });
}

function buildActivity(config) {
  const activity = {};
  let details = config.details || '';
  let state = config.state || '';
  let largeImageText = config.largeImageText || '';
  let smallImageText = config.smallImageText || '';

  if (config.enableSystemMetrics) {
    const metricsStr = getSystemMetricsText(config.metricsFormat || 'full');
    const placement = config.metricsPlacement || 'state';

    if (placement === 'details') {
      details = details ? `${details} | ${metricsStr}` : metricsStr;
    } else if (placement === 'large_text') {
      largeImageText = largeImageText ? `${largeImageText} | ${metricsStr}` : metricsStr;
    } else if (placement === 'small_text') {
      smallImageText = smallImageText ? `${smallImageText} | ${metricsStr}` : metricsStr;
    } else {
      state = state ? `${state} | ${metricsStr}` : metricsStr;
    }
  }

  if (details) activity.details = String(details).substring(0, 128);
  if (state) activity.state = String(state).substring(0, 128);
  if (config.largeImageKey) activity.largeImageKey = config.largeImageKey;
  if (largeImageText) activity.largeImageText = String(largeImageText).substring(0, 128);
  if (config.smallImageKey) activity.smallImageKey = config.smallImageKey;
  if (smallImageText) activity.smallImageText = String(smallImageText).substring(0, 128);

  if (config.startTimestamp) activity.startTimestamp = config.startTimestampVal || Date.now();
  if (config.endTimestamp && config.endTimestamp > 0) {
    activity.endTimestamp = Date.now() + (config.endTimestamp * 60000);
  }

  if (config.partyId) activity.partyId = config.partyId;
  if (config.partySize && config.partyMax) {
    activity.partySize = parseInt(config.partySize);
    activity.partyMax = parseInt(config.partyMax);
  }

  if (config.joinSecret) activity.joinSecret = config.joinSecret;
  if (config.spectateSecret) activity.spectateSecret = config.spectateSecret;
  if (config.matchSecret) activity.matchSecret = config.matchSecret;
  if (config.instance) activity.instance = true;

  const buttons = [];
  if (config.button1Label && config.button1Url) buttons.push({ label: config.button1Label, url: config.button1Url });
  if (config.button2Label && config.button2Url) buttons.push({ label: config.button2Label, url: config.button2Url });
  if (buttons.length > 0) activity.buttons = buttons;

  return activity;
}

async function stopRpc() {
  if (rpcInterval) {
    clearInterval(rpcInterval);
    rpcInterval = null;
  }
  if (activeRpcClient) {
    try {
      await activeRpcClient.clearActivity();
      await new Promise(r => setTimeout(r, 150));
      await activeRpcClient.destroy();
    } catch (e) {}
    activeRpcClient = null;
  }
  activeActivity = null;
  return { success: true };
}

async function uploadImage(base64DataUrl) {
  try {
    const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    const body = new URLSearchParams();
    body.append('key', '6d207e02198a847aa98d0a2a901485a5');
    body.append('action', 'upload');
    body.append('source', base64);
    body.append('format', 'json');
    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(15000)
    });
    const json = await res.json();
    if (json?.status_code === 200 && json?.image?.url) {
      return { success: true, url: json.image.url };
    }
    return { success: false, error: json?.status_txt || 'Upload failed' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

ipcMain.handle('rpc-load-config', () => loadConfig());
ipcMain.handle('rpc-save-config', (_e, cfg) => { saveConfig(cfg); return { success: true }; });
ipcMain.handle('rpc-start', async (_e, cfg) => { saveConfig(cfg); return startRpc(cfg); });
ipcMain.handle('rpc-stop', async () => stopRpc());
ipcMain.handle('rpc-upload-image', async (_e, b64) => uploadImage(b64));
ipcMain.handle('rpc-status', () => ({ active: activeRpcClient !== null }));
ipcMain.handle('open-external', async (_e, url) => {
  if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL' };
});

ipcMain.handle('check-for-updates', async () => {
  return {
    currentVersion: '2.0.0',
    isLatest: true,
    latestVersion: '2.0.0',
    releaseDate: '2026-09-18',
    changelog: [
      {
        title: 'استرجاع وحماية بيانات الحفظ والبروفايلات',
        desc: 'نظام تخزين ذكي موحد يحمي إعداداتك وبروفايلاتك وتوكناتك من الضياع.'
      },
      {
        title: 'أيقونة نامل الرسمية لشريط المهام وسطح المكتب',
        desc: 'تشغيل مباشر بنقرة زر بالأيقونة الأصلية دون الحاجة لفتح سطر الأوامر.'
      },
      {
        title: 'تعزيز الأمان والحماية البرمجية',
        desc: 'عزل تام للتصفح الخارجي، وتأمين بروتوكول فتح الروابط، وتشفير التوكنات.'
      },
      {
        title: 'شاشة سجل التغييرات وفحص التحديثات',
        desc: 'متابعة سجل التحديثات ومعرفة ما تمت إضافته في كل إصدار فورياً.'
      }
    ]
  };
});

ipcMain.handle('profiles-load', () => loadProfiles());
ipcMain.handle('profiles-save', (_e, list) => saveProfiles(list));

ipcMain.handle('bots-load', () => loadBots());
ipcMain.handle('bots-save', (_e, bots) => saveBots(bots));

ipcMain.handle('settings-load', () => loadSettings());
ipcMain.handle('settings-save', (_e, s) => saveSettings(s));

function checkDiscordRunning() {
  return new Promise((resolve) => {
    exec('tasklist /FI "IMAGENAME eq Discord.exe" /NH', (err, stdout) => {
      if (err || !stdout) return resolve(false);
      resolve(stdout.toLowerCase().includes('discord.exe'));
    });
  });
}

let lastKnownDiscordUser = null;
let accountWatcherInterval = null;

function formatDiscordUser(user) {
  if (!user) return null;
  const isGif = user.avatar && user.avatar.startsWith('a_');
  const ext = isGif ? 'gif' : 'png';
  let avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png';
  if (user.avatar) {
    avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  } else if (user.discriminator === '0' || !user.discriminator) {
    try {
      const idx = Number((BigInt(user.id) >> 22n) % 6n);
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    } catch {
      avatarUrl = `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
  } else {
    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
  }

  let decorationUrl = null;
  if (user.avatar_decoration_data && user.avatar_decoration_data.asset) {
    decorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${user.avatar_decoration_data.asset}.png?size=256&passthrough=true`;
  }

  return {
    id: String(user.id || ''),
    username: String(user.username || ''),
    discriminator: String(user.discriminator || '0'),
    global_name: String(user.global_name || user.username || ''),
    avatar: user.avatar || null,
    avatarUrl,
    avatarDecorationUrl: decorationUrl,
    flags: Number(user.flags || 0),
    premiumType: Number(user.premium_type || 0),
    bot: !!user.bot
  };
}

let isProbing = false;

async function fetchDiscordUser(targetClientId) {
  if (activeRpcClient && activeRpcClient.user) {
    const formatted = formatDiscordUser(activeRpcClient.user);
    lastKnownDiscordUser = formatted;
    return formatted;
  }

  if (isProbing) {
    return lastKnownDiscordUser || { error: 'جاري الاتصال بديسكورد...' };
  }

  const isRunning = await checkDiscordRunning();
  if (!isRunning) {
    return { error: 'Discord is not running', cached: lastKnownDiscordUser };
  }

  isProbing = true;
  const cfg = loadConfig();
  const clientId = String(targetClientId || cfg.clientId || '1533169274401849414').trim();

  const DiscordRPC = require('discord-rpc');
  try {
    DiscordRPC.register(clientId);
  } catch (e) {}

  return new Promise((resolve) => {
    let resolved = false;
    let probeClient = null;

    const cleanup = async () => {
      isProbing = false;
      if (probeClient) {
        try {
          await probeClient.destroy();
        } catch (e) {}
        probeClient = null;
      }
    };

    const timer = setTimeout(async () => {
      if (!resolved) {
        resolved = true;
        await cleanup();
        resolve(lastKnownDiscordUser || { error: 'Connection timeout' });
      }
    }, 4000);

    try {
      probeClient = new DiscordRPC.Client({ transport: 'ipc' });

      probeClient.on('ready', async () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (probeClient.user) {
            const formatted = formatDiscordUser(probeClient.user);
            lastKnownDiscordUser = formatted;
            await cleanup();
            resolve(formatted);
          } else {
            await cleanup();
            resolve(lastKnownDiscordUser || { error: 'No user data' });
          }
        }
      });

      probeClient.transport?.on('close', async () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          await cleanup();
          resolve(lastKnownDiscordUser || { error: 'Connection closed' });
        }
      });

      probeClient.login({ clientId }).catch(async (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          await cleanup();
          resolve(lastKnownDiscordUser || { error: err.message });
        }
      });
    } catch (err) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve(lastKnownDiscordUser || { error: err.message });
      }
    }
  });
}

function setupDiscordWatcher(win) {
  if (!win) return;
  win.on('focus', async () => {
    if (!activeRpcClient) {
      try {
        const isUp = await checkDiscordRunning();
        if (isUp) {
          const user = await fetchDiscordUser();
          if (user && user.id && (!lastKnownDiscordUser || lastKnownDiscordUser.id !== user.id)) {
            lastKnownDiscordUser = user;
            win.webContents.send('discord-user-changed', user);
          }
        }
      } catch (e) {}
    }
  });
}

ipcMain.handle('check-discord-process', async () => {
  return checkDiscordRunning();
});

ipcMain.handle('get-discord-user', async () => {
  return fetchDiscordUser();
});

ipcMain.handle('app-self-repair', async () => {
  const results = { steps: [], success: true };
  
  // 1. Check data files & repair
  try {
    const cfg = loadConfig();
    saveConfig(cfg);
    const profs = loadProfiles();
    saveProfiles(profs);
    const sets = loadSettings();
    saveSettings(sets);
    results.steps.push({ name: 'سلامة ملفات التخزين والبيانات', ok: true, detail: 'تم فحص سلامة الملفات وإعادة فهرستها بنجاح' });
  } catch (e) {
    results.steps.push({ name: 'سلامة ملفات التخزين والبيانات', ok: false, detail: e.message });
    results.success = false;
  }

  // 2. Clear Session Cache
  try {
    if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
      await mainWindow.webContents.session.clearCache();
      results.steps.push({ name: 'تنظيف الذاكرة المؤقتة (Cache)', ok: true, detail: 'تم مسح الكاش بنجاح واستعادة السرعة القصوى' });
    }
  } catch (e) {
    results.steps.push({ name: 'تنظيف الذاكرة المؤقتة', ok: false, detail: e.message });
  }

  // 3. Check Discord.exe status
  try {
    const isDiscordUp = await checkDiscordRunning();
    results.discordRunning = isDiscordUp;
    if (isDiscordUp) {
      results.steps.push({ name: 'حالة تطبيق ديسكورد', ok: true, detail: 'تطبيق ديسكورد يعمل في الخلفية وجاهز للاتصال' });
    } else {
      results.steps.push({ name: 'حالة تطبيق ديسكورد', ok: false, detail: 'ديسكورد غير مشغّل حالياً — يُرجى تشغيله لتفعيل الـ RPC' });
    }
  } catch (e) {
    results.steps.push({ name: 'حالة تطبيق ديسكورد', ok: false, detail: e.message });
  }

  // 4. Reset RPC connection
  try {
    if (activeRpcClient) {
      await stopRpc();
      results.steps.push({ name: 'إعادة تهيئة اتصال الـ RPC', ok: true, detail: 'تمت إعادة ضبط الاتصال وجاهز لتشغيل جديد' });
    } else {
      results.steps.push({ name: 'إعادة تهيئة اتصال الـ RPC', ok: true, detail: 'محرك الاتصال جاهز ومستقر' });
    }
  } catch (e) {
    results.steps.push({ name: 'إعادة تهيئة اتصال الـ RPC', ok: false, detail: e.message });
  }

  return results;
});

ipcMain.handle('secure-download-file', async (_e, { url, fileName }) => {
  if (!url || typeof url !== 'string') return { success: false, error: 'رابط التحميل غير صالح' };
  
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return { success: false, error: 'يُسمح بالتحميل عبر بروتوكول HTTPS المشفر والآمن فقط' };
    }
    
    const allowedHosts = ['github.com', 'raw.githubusercontent.com', 'objects.githubusercontent.com', 'api.github.com', 'iili.io', 'cdn.discordapp.com'];
    const isAllowed = allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h));
    if (!isAllowed) {
      return { success: false, error: 'نطاق التحميل غير مصرح به؛ يُسمح بـ GitHub والمواقع الرسمية المعتمدة فقط' };
    }

    const downloadDir = path.join(app.getPath('userData'), 'downloads');
    if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

    const safeName = (fileName || path.basename(parsed.pathname) || 'download.json').replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetPath = path.join(downloadDir, safeName);

    return new Promise((resolve) => {
      const fileStream = fs.createWriteStream(targetPath);
      
      const request = (targetUrl) => {
        https.get(targetUrl, { headers: { 'User-Agent': 'Naml-RPC-Studio' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return request(res.headers.location);
          }
          if (res.statusCode !== 200) {
            fileStream.close();
            fs.unlink(targetPath, () => {});
            return resolve({ success: false, error: `فشل التنزيل: رمز الخطأ ${res.statusCode}` });
          }

          const total = parseInt(res.headers['content-length'], 10) || 0;
          let received = 0;

          res.on('data', (chunk) => {
            received += chunk.length;
            if (total > 0 && mainWindow) {
              const percent = Math.round((received / total) * 100);
              mainWindow.webContents.send('download-progress', { percent, received, total, fileName: safeName });
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close(() => {
              resolve({
                success: true,
                filePath: targetPath,
                fileName: safeName,
                bytes: received
              });
            });
          });
        }).on('error', (err) => {
          fileStream.close();
          fs.unlink(targetPath, () => {});
          resolve({ success: false, error: err.message });
        });
      };

      request(url);
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('export-backup', async () => {
  try {
    const backupData = {
      app: 'naml',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      rights: 'جميع الحقوق محفوظة لـ QZV سنتري كي اس اي',
      config: loadConfig(),
      profiles: loadProfiles(),
      settings: loadSettings()
    };

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'حفظ نسخة احتياطية — نامل',
      defaultPath: `naml-backup-${Date.now()}.json`,
      filters: [{ name: 'Naml Backup (*.json)', extensions: ['json'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('import-backup', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'استيراد نسخة احتياطية — نامل',
      filters: [{ name: 'Naml Backup (*.json)', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (canceled || !filePaths || filePaths.length === 0) return { success: false, canceled: true };

    const raw = fs.readFileSync(filePaths[0], 'utf-8');
    const data = JSON.parse(raw);

    if (data.config) saveConfig(data.config);
    if (Array.isArray(data.profiles)) saveProfiles(data.profiles);
    if (data.settings) saveSettings(data.settings);

    return {
      success: true,
      config: data.config,
      profiles: data.profiles,
      settings: data.settings
    };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

app.commandLine.appendSwitch('js-flags', '--expose-gc --max-old-space-size=128');
app.commandLine.appendSwitch('disable-site-isolation-trials');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion,HardwareMediaKeyHandling');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-print-preview');

function trimProcessMemory() {
  try {
    if (global.gc) global.gc();
    if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
      mainWindow.webContents.session.clearCache().catch(() => {});
    }
    if (process.platform === 'win32') {
      exec('powershell -NoProfile -Command "[System.Diagnostics.Process]::GetProcessesByName(\'naml\') | ForEach-Object { $_.MinWorkingSet = [System.IntPtr]::Zero }"', () => {});
    }
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('app-hidden');
    }
  } catch (e) {}
}

ipcMain.handle('app-trim-memory', () => {
  trimProcessMemory();
  const mem = process.memoryUsage();
  return { success: true, rssMB: Math.round(mem.rss / (1024 * 1024)) };
});

let hasShownTrayNotice = false;

function createWindow() {
  const settings = loadSettings();
  
  mainWindow = new BrowserWindow({
    width: 580,
    height: 780,
    minWidth: 480,
    minHeight: 640,
    resizable: true,
    frame: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    backgroundColor: '#080b14',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#080b14', symbolColor: '#818cf8', height: 40 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      backgroundThrottling: false
    },
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) {
      event.preventDefault();
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
    }
  });

  mainWindow.once('ready-to-show', () => {
    const s = loadSettings();
    if (s.startMinimized) {
      mainWindow.hide();
      trimProcessMemory();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    updateTrayMenu();
  });

  mainWindow.on('show', () => {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('app-shown');
    }
    updateTrayMenu();
  });

  mainWindow.on('close', (e) => {
    const currentSettings = loadSettings();
    if (currentSettings.minimizeToTray !== false && !isQuitting && tray) {
      e.preventDefault();
      mainWindow.hide();
      trimProcessMemory();
      updateTrayMenu();
      if (!hasShownTrayNotice) {
        hasShownTrayNotice = true;
        try {
          tray.displayBalloon({
            iconType: 'info',
            title: 'نامل — في الخلفية',
            content: 'يستمر نامل بالعمل في الخلفية بأقل استهلاك للرام. للإغلاق النهائي انقر باليمين على الأيقونة.'
          });
        } catch (err) {}
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  setupDiscordWatcher(mainWindow);
}

function updateTrayMenu() {
  if (!tray) return;
  const mem = process.memoryUsage();
  const ramMB = Math.round(mem.rss / (1024 * 1024));
  const rpcOn = activeRpcClient !== null;

  const menu = Menu.buildFromTemplate([
    { label: `نامل (v2.0.0) — ${rpcOn ? '🟢 الـ RPC نشط' : '⚪ غير نشط'}`, enabled: false },
    { label: `استهلاك الذاكرة: ~${ramMB} MB`, enabled: false },
    { type: 'separator' },
    { label: 'إظهار التطبيق', click: () => { mainWindow?.show(); mainWindow?.focus(); mainWindow?.webContents.send('app-shown'); updateTrayMenu(); } },
    { label: rpcOn ? 'إيقاف الـ RPC' : 'تشغيل الـ RPC', click: async () => {
        if (rpcOn) {
          await stopRpc();
          mainWindow?.webContents.send('rpc-stopped');
        } else {
          const cfg = loadConfig();
          await startRpc(cfg);
          mainWindow?.webContents.send('rpc-started');
        }
        updateTrayMenu();
      }
    },
    { label: 'تنظيف الذاكرة الآن ⚡', click: () => { trimProcessMemory(); updateTrayMenu(); } },
    { type: 'separator' },
    { label: 'إنهاء التطبيق نهائياً', click: () => { isQuitting = true; app.quit(); } }
  ]);
  tray.setContextMenu(menu);
  tray.setToolTip(`نامل — ${rpcOn ? 'نشط' : 'غير نشط'} (~${ramMB}MB)`);
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-new.png');
  const fallbackPath = path.join(__dirname, 'assets', 'naml-logo.png');
  const usePath = fs.existsSync(iconPath) ? iconPath : fallbackPath;
  const icon = nativeImage.createFromPath(usePath).resize({ width: 22, height: 22 });
  tray = new Tray(icon);
  updateTrayMenu();
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
    mainWindow?.webContents.send('app-shown');
    updateTrayMenu();
  });
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.naml.app');
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  isQuitting = true;
  await stopRpc();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

