/**
 * AntiGravity Workflow - Universal Desktop & Web Notification Utility
 */

import { prefRepository } from '@/lib/prefRepository';

export interface NotificationPayload {
  title: string;
  body: string;
  priority?: any;
  tag?: string;
}

/**
 * 데스크톱 알림 활성화 여부 확인 (기본값: true)
 */
export const isNotificationEnabled = (): boolean => {
  return prefRepository.desktopNotifications;
};

/**
 * 브라우저 웹 알림 권한 요청 (웹 모드 fallback)
 */
export const requestWebNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

/**
 * 데스크톱 / 웹 네이티브 알림 발송
 */
export const sendDesktopNotification = async (payload: NotificationPayload): Promise<boolean> => {
  if (!isNotificationEnabled()) {
    return false;
  }

  const { title, body, priority, tag } = payload;
  const isCritical = priority === 'CRITICAL' || priority === 4 || priority === '4';
  const isHigh = priority === 'HIGH' || priority === 3 || priority === '3';
  const urgency = isCritical || isHigh ? 'critical' : 'normal';

  // 1. Electron Desktop 환경 우선 처리
  if (window.electronAPI?.showNotification) {
    try {
      const res = await window.electronAPI.showNotification({
        title,
        body,
        urgency,
        tag,
      });
      return res.success;
    } catch (err) {
      console.warn('Failed to send Electron notification:', err);
    }
  }

  // 2. Web Browser Fallback (HTML5 Web Notifications API)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          tag,
          requireInteraction: isCritical,
        });
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, {
            body,
            tag,
            requireInteraction: isCritical,
          });
          return true;
        }
      }
    } catch (err) {
      console.warn('Web notification error:', err);
    }
  }

  return false;
};
