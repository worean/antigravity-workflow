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

export interface ElectronBackendConfig {
  backendApiUrl?: string;
  [key: string]: any;
}

export interface ElectronAPI {
  isElectron: boolean;
  minimizeWindow?: () => Promise<boolean>;
  maximizeWindow?: () => Promise<boolean>;
  closeWindow?: () => Promise<boolean>;
  isWindowMaximized?: () => Promise<boolean>;
  onWindowMaximizedChange?: (callback: (isMaximized: boolean) => void) => () => void;
  showNotification: (options: ElectronNotificationOptions) => Promise<{ success: boolean; reason?: string }>;
  getAppInfo: () => Promise<ElectronAppInfo>;
  getBackendConfig?: () => Promise<ElectronBackendConfig>;
  setBackendConfig?: (config: ElectronBackendConfig) => Promise<ElectronBackendConfig | null>;
  onNotificationClick: (callback: (data: { title: string; tag?: string }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
