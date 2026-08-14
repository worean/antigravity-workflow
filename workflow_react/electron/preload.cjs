const { contextBridge, ipcRenderer } = require('electron');

// 안전한 Context Isolation API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  onNotificationClick: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('notification-clicked', subscription);
    return () => ipcRenderer.removeListener('notification-clicked', subscription);
  },
});
