// -*- coding: utf-8 -*-
/**
 * 🍪 Lightweight Cookie / Web Storage based Issue Draft Utility
 * 
 * React Context의 리렌더링이나 무거운 상태 관리 없이,
 * 사용자의 일감 작성/수정 중인 폼 데이터를 브라우저 쿠키/스토리지에 경량으로 안전하게 보존합니다.
 */

export interface IssueDraft {
  title: string;
  description: string;
  projectId?: number;
  statusId?: number;
  priorityId?: number;
  assigneeId?: number | null;
  dueDate?: string | null;
  startDate?: string | null;
  plannedStartDate?: string | null;
  tags?: string[];
  customFields?: Record<string, any>;
  updatedAt: number;
}

const DRAFT_COOKIE_PREFIX = 'agy_draft_';

// 🍪 쿠키 읽기 헬퍼
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// 🍪 쿠키 쓰기 헬퍼 (유효기간 7일)
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// 🍪 쿠키 삭제 헬퍼
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const draftStorage = {
  getIssueDraft(key: string | number): IssueDraft | null {
    const cookieName = `${DRAFT_COOKIE_PREFIX}${key}`;
    const raw = getCookie(cookieName);
    if (!raw) {
      // sessionStorage fallback
      if (typeof window !== 'undefined') {
        const sessionRaw = window.sessionStorage.getItem(cookieName);
        if (sessionRaw) {
          try {
            return JSON.parse(sessionRaw);
          } catch {}
        }
      }
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveIssueDraft(key: string | number, draft: Partial<IssueDraft>): void {
    const cookieName = `${DRAFT_COOKIE_PREFIX}${key}`;
    const existing = draftStorage.getIssueDraft(key) || { title: '', description: '', updatedAt: Date.now() };
    const payload: IssueDraft = {
      ...existing,
      ...draft,
      updatedAt: Date.now(),
    };
    const json = JSON.stringify(payload);
    try {
      // 4KB 쿠키 사이즈 제한 고려 (초과 시 sessionStorage 활용)
      if (json.length < 3800) {
        setCookie(cookieName, json, 7);
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(cookieName, json);
      }
    } catch (e) {
      console.warn('[draftStorage] Failed to save draft:', e);
    }
  },

  clearIssueDraft(key: string | number): void {
    const cookieName = `${DRAFT_COOKIE_PREFIX}${key}`;
    deleteCookie(cookieName);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(cookieName);
    }
  },

  hasIssueDraft(key: string | number): boolean {
    const draft = draftStorage.getIssueDraft(key);
    return !!draft && (!!draft.title?.trim() || !!draft.description?.trim());
  },
};
