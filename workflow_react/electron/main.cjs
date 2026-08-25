// -*- coding: utf-8 -*-
const { app, BrowserWindow, ipcMain, Notification, Menu, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// GPU process crash 방지 및 모든 환경 호환성 보장
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-gpu-rasterization');
app.commandLine.appendSwitch('disable-software-rasterizer', 'false');
app.commandLine.appendSwitch('no-sandbox');

const logFile = path.join(app.getPath('userData'), 'electron-debug.log');
function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}\n`;
  try {
    fs.appendFileSync(logFile, msg, 'utf-8');
  } catch {}
  console.log(...args);
}

log('App starting. Version:', app.getVersion(), 'Platform:', process.platform);

process.on('uncaughtException', (err) => {
  log('Uncaught Exception:', err.stack || err);
});

process.on('unhandledRejection', (reason) => {
  log('Unhandled Rejection:', reason);
});

let mainWindow = null;

// Single Instance Lock (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log('Another instance is running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    log('Second instance attempted. Restoring main window.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  try {
    log('Creating main window...');
    const preloadPath = path.join(__dirname, 'preload.cjs');
    log('Preload path:', preloadPath, 'Exists:', fs.existsSync(preloadPath));

    mainWindow = new BrowserWindow({
      width: 1320,
      height: 860,
      minWidth: 1040,
      minHeight: 700,
      title: 'AntiGravity Workflow System',
      backgroundColor: '#1e1e1e',
      frame: false, // Custom frameless titlebar
      autoHideMenuBar: true,
      show: true, // Ensure window is immediately visible
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    const indexPath = path.join(__dirname, '../dist/index.html');
    log('Index path:', indexPath, 'Exists:', fs.existsSync(indexPath));

    // 개발 환경 또는 로컬 Vite 서버 감지
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5173' : null);

    if (devServerUrl) {
      log('Loading dev server URL:', devServerUrl);
      mainWindow.loadURL(devServerUrl);
    } else {
      log('Loading production file:', indexPath);
      mainWindow.loadFile(indexPath).catch((err) => {
        log('loadFile failed:', err.message, '- fallback to dev URL');
        mainWindow.loadURL('http://localhost:5173').catch((e2) => {
          log('fallback loadURL also failed:', e2.message);
        });
      });
    }

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
      log('did-fail-load:', errorCode, errorDescription, validatedURL);
    });

    mainWindow.webContents.on('did-finish-load', () => {
      log('Page finished loading successfully.');
    });

    mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
      log(`[Renderer Console] [Level ${level}] ${message} (at ${sourceId}:${line})`);
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
      log('Render process gone / crashed:', details);
    });

    mainWindow.on('close', (e) => {
      log('MainWindow close event triggered.');
    });

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
  } catch (winErr) {
    log('Error inside createWindow:', winErr.stack || winErr);
  }
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

app.whenReady()
  .then(() => {
    log('app.whenReady resolved. Initializing UI...');
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((err) => {
    log('app.whenReady rejected:', err.stack || err);
  });

app.on('window-all-closed', () => {
  log('window-all-closed event fired.');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
