// -*- coding: utf-8 -*-

export interface IssueDraft {
  title?: string;
  description?: string;
  projectId?: number;
  parentId?: number | null;
  priorityId?: number;
  statusId?: number;
  assigneeId?: number | undefined;
  dueDate?: string;
  plannedStartDate?: string;
  customFields?: Record<string, any>;
  savedAt?: number;
}

export interface IssueEditDraft extends IssueDraft {
  issueId: number;
  typeId?: number;
  progress?: number;
  actualStartDate?: string;
  actualEndDate?: string;
  customFieldsData?: Record<string, any>;
  savedAt: number;
}

export interface IssueCreateDraft extends IssueDraft {
  savedAt: number;
}

const EDIT_DRAFT_PREFIX = 'ag_draft_issue_edit_';
const CREATE_DRAFT_KEY = 'ag_draft_issue_create';
const LEGACY_DRAFT_PREFIX = 'ag_draft_issue_';

/**
 * 📦 draftStorage 통합 객체 (하위 호환 및 WorkspaceContext 지원)
 */
export const draftStorage = {
  getIssueDraft: (key: string | number): IssueDraft | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw) as IssueDraft;
    } catch {
      return null;
    }
  },
  saveIssueDraft: (key: string | number, draft: Partial<IssueDraft>): void => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
      const payload: IssueDraft = {
        ...draft,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to write draftStorage:', e);
    }
  },
  clearIssueDraft: (key: string | number): void => {
    if (typeof window === 'undefined') return;
    try {
      const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
      window.localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to remove draftStorage:', e);
    }
  },
  hasIssueDraft: (key: string | number): boolean => {
    if (typeof window === 'undefined') return false;
    const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
    return !!window.localStorage.getItem(storageKey);
  },
  get: (key: string | number) => draftStorage.getIssueDraft(key),
  set: (key: string | number, draft: Partial<IssueDraft>) => draftStorage.saveIssueDraft(key, draft),
  remove: (key: string | number) => draftStorage.clearIssueDraft(key),
};

/**
 * 💾 이슈 편집 임시 저장본 저장
 */
export const saveIssueEditDraft = (issueId: number, draft: Omit<IssueEditDraft, 'issueId' | 'savedAt'>) => {
  if (!issueId) return;
  try {
    const payload: IssueEditDraft = {
      ...draft,
      issueId,
      savedAt: Date.now(),
    };
    localStorage.setItem(`${EDIT_DRAFT_PREFIX}${issueId}`, JSON.stringify(payload));
    draftStorage.saveIssueDraft(`edit_${issueId}`, payload);
  } catch (err) {
    console.error('Failed to save issue edit draft to storage:', err);
  }
};

/**
 * 📖 이슈 편집 임시 저장본 조회
 */
export const getIssueEditDraft = (issueId: number): IssueEditDraft | null => {
  if (!issueId) return null;
  try {
    const raw = localStorage.getItem(`${EDIT_DRAFT_PREFIX}${issueId}`);
    if (raw) return JSON.parse(raw) as IssueEditDraft;
    const legacy = draftStorage.getIssueDraft(`edit_${issueId}`);
    if (legacy) return { ...legacy, issueId, savedAt: legacy.savedAt || Date.now() } as IssueEditDraft;
    return null;
  } catch (err) {
    console.error('Failed to parse issue edit draft from storage:', err);
    return null;
  }
};

/**
 * 🗑️ 이슈 편집 임시 저장본 삭제 (저장 완료 또는 취소 시)
 */
export const clearIssueEditDraft = (issueId: number) => {
  if (!issueId) return;
  try {
    localStorage.removeItem(`${EDIT_DRAFT_PREFIX}${issueId}`);
    draftStorage.clearIssueDraft(`edit_${issueId}`);
  } catch (err) {
    console.error('Failed to clear issue edit draft:', err);
  }
};

/**
 * 💾 신규 이슈 생성 임시 저장본 저장
 */
export const saveIssueCreateDraft = (draft: Omit<IssueCreateDraft, 'savedAt'>) => {
  try {
    const payload: IssueCreateDraft = {
      ...draft,
      savedAt: Date.now(),
    };
    localStorage.setItem(CREATE_DRAFT_KEY, JSON.stringify(payload));
    draftStorage.saveIssueDraft('new', payload);
  } catch (err) {
    console.error('Failed to save issue create draft:', err);
  }
};

/**
 * 📖 신규 이슈 생성 임시 저장본 조회
 */
export const getIssueCreateDraft = (): IssueCreateDraft | null => {
  try {
    const raw = localStorage.getItem(CREATE_DRAFT_KEY);
    if (raw) return JSON.parse(raw) as IssueCreateDraft;
    const legacy = draftStorage.getIssueDraft('new');
    if (legacy) return { ...legacy, savedAt: legacy.savedAt || Date.now() } as IssueCreateDraft;
    return null;
  } catch (err) {
    console.error('Failed to get issue create draft:', err);
    return null;
  }
};

/**
 * 🗑️ 신규 이슈 생성 임시 저장본 삭제
 */
export const clearIssueCreateDraft = () => {
  try {
    localStorage.removeItem(CREATE_DRAFT_KEY);
    draftStorage.clearIssueDraft('new');
  } catch (err) {
    console.error('Failed to clear issue create draft:', err);
  }
};
