const { app, BrowserWindow, ipcMain, Notification, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 680,
    title: 'AntiGravity Workflow System',
    backgroundColor: '#1e1e1e',
    titleBarStyle: 'default',
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
    // mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션 빌드 파일 로드
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(() => {
      // 빌드 파일이 없을 경우 기본 dev url 시도
      mainWindow.loadURL('http://localhost:5173');
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
    version: app.getVersion() || '2.4.0',
    isElectron: true,
    platform: process.platform,
  };
});

app.whenReady().then(() => {
  // 기본 메뉴바 숨김 처리 (클린 다크 테마 유지)
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
