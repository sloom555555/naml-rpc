const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rpc', {
  loadConfig: () => ipcRenderer.invoke('rpc-load-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('rpc-save-config', cfg),
  start: (cfg) => ipcRenderer.invoke('rpc-start', cfg),
  stop: () => ipcRenderer.invoke('rpc-stop'),
  status: () => ipcRenderer.invoke('rpc-status'),
  uploadImage: (b64) => ipcRenderer.invoke('rpc-upload-image', b64),
  loadProfiles: () => ipcRenderer.invoke('profiles-load'),
  saveProfiles: (list) => ipcRenderer.invoke('profiles-save', list),
  loadBots: () => ipcRenderer.invoke('bots-load'),
  saveBots: (bots) => ipcRenderer.invoke('bots-save', bots),
  loadSettings: () => ipcRenderer.invoke('settings-load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings-save', settings),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  exportBackup: () => ipcRenderer.invoke('export-backup'),
  importBackup: () => ipcRenderer.invoke('import-backup'),
  selfRepair: () => ipcRenderer.invoke('app-self-repair'),
  secureDownload: (url, fileName) => ipcRenderer.invoke('secure-download-file', { url, fileName }),
  onDownloadProgress: (cb) => ipcRenderer.on('download-progress', (_e, data) => cb(data)),
  checkDiscordProcess: () => ipcRenderer.invoke('check-discord-process'),
  getDiscordUser: () => ipcRenderer.invoke('get-discord-user'),
  onDiscordUserChanged: (cb) => ipcRenderer.on('discord-user-changed', (_e, data) => cb(data)),
  onStopped: (cb) => ipcRenderer.on('rpc-stopped', cb),
  onAppHidden: (cb) => ipcRenderer.on('app-hidden', cb),
  onAppShown: (cb) => ipcRenderer.on('app-shown', cb),
  trimMemory: () => ipcRenderer.invoke('app-trim-memory'),
  sendWebhook: (data) => ipcRenderer.invoke('discord-send-webhook', data),
  getCurrentMedia: () => ipcRenderer.invoke('get-current-media')
});


