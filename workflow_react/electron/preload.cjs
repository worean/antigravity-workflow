// -*- coding: utf-8 -*-
const { contextBridge, ipcRenderer } = require('electron');

// 안전한 Context Isolation API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
  onWindowMaximizedChange: (callback) => {
    const subscription = (_event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window-maximized-changed', subscription);
    return () => ipcRenderer.removeListener('window-maximized-changed', subscription);
  },
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  onNotificationClick: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('notification-clicked', subscription);
    return () => ipcRenderer.removeListener('notification-clicked', subscription);
  },
});
