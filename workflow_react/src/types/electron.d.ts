export interface ElectronNotificationOptions {
  title: string;
  body: string;
  urgency?: 'normal' | 'critical' | 'low';
  tag?: string;
}

export interface ElectronAppInfo {
  name: string;
  version: string;
  isElectron: boolean;
  platform: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  showNotification: (options: ElectronNotificationOptions) => Promise<{ success: boolean; reason?: string }>;
  getAppInfo: () => Promise<ElectronAppInfo>;
  onNotificationClick: (callback: (data: { title: string; tag?: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
