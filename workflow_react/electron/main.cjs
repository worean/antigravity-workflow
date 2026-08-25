// -*- coding: utf-8 -*-
const { app, BrowserWindow, ipcMain, Notification, Menu, dialog, shell } = require('electron');
const path = require('path');

let mainWindow = null;

// Single Instance Lock (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1040,
    minHeight: 700,
    title: 'AntiGravity Workflow System',
    backgroundColor: '#1e1e1e',
    frame: false, // Custom frameless titlebar
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // 개발 환경 또는 로컬 Vite 서버 감지
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null);

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    // 프로덕션 빌드 파일 로드
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
      mainWindow.loadURL('http://localhost:5173');
    });
  }

  // 윈도우 최대화 상태 변경 감지
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized-changed', false);
  });

  // 외부 링크는 기본 브라우저로 오픈
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==========================================
// 🪟 IPC Window Control Handlers
// ==========================================
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
    return true;
  }
  return false;
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
    return true;
  }
  return false;
});

ipcMain.handle('is-window-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ==========================================
// 🔔 IPC Desktop Notification Handlers
// ==========================================
ipcMain.handle('show-notification', async (_event, options = {}) => {
  const { title = 'AntiGravity Workflow', body = '', urgency = 'normal', tag = '' } = options;

  if (Notification.isSupported()) {
    const notification = new Notification({
      title,
      body,
      urgency: urgency === 'critical' ? 'critical' : urgency === 'high' ? 'critical' : 'normal',
      timeoutType: urgency === 'critical' ? 'never' : 'default',
      silent: false,
    });

    notification.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        mainWindow.webContents.send('notification-clicked', { title, tag });
      }
    });

    notification.show();
    return { success: true };
  } else {
    return { success: false, reason: 'Notification not supported on this platform' };
  }
});

ipcMain.handle('get-app-info', async () => {
  return {
    name: 'AntiGravity Workflow',
    version: app.getVersion() || '2.5.0',
    isElectron: true,
    platform: process.platform,
  };
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
