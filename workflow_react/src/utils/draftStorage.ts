import { useDraftStore } from '@/stores/useDraftStore';

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
 * 📦 draftStorage 통합 객체 (Zustand `useDraftStore` 기반 단일 진실 공급원)
 */
export const draftStorage = {
  getIssueDraft: (key: string | number): IssueDraft | null => {
    // 1) Zustand 스토어 우선 조회
    const storeDraft = useDraftStore.getState().getDraft(key);
    if (storeDraft) return storeDraft;

    // 2) 레거시 LocalStorage 폴백 & 마이그레이션
    if (typeof window === 'undefined') return null;
    try {
      const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as IssueDraft;
      // 스토어로 이관
      useDraftStore.getState().saveDraft(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  },

  saveIssueDraft: (key: string | number, draft: Partial<IssueDraft>): void => {
    useDraftStore.getState().saveDraft(key, draft);
  },

  clearIssueDraft: (key: string | number): void => {
    useDraftStore.getState().clearDraft(key);
    // 레거시 키 정리
    if (typeof window !== 'undefined') {
      try {
        const storageKey = typeof key === 'string' && key.startsWith('ag_') ? key : `${LEGACY_DRAFT_PREFIX}${key}`;
        window.localStorage.removeItem(storageKey);
      } catch {}
    }
  },

  hasIssueDraft: (key: string | number): boolean => {
    if (useDraftStore.getState().hasDraft(key)) return true;
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
  const payload: IssueEditDraft = {
    ...draft,
    issueId,
    savedAt: Date.now(),
  };
  draftStorage.saveIssueDraft(`edit_${issueId}`, payload);
};

/**
 * 📖 이슈 편집 임시 저장본 조회
 */
export const getIssueEditDraft = (issueId: number): IssueEditDraft | null => {
  if (!issueId) return null;
  const draft = draftStorage.getIssueDraft(`edit_${issueId}`);
  if (draft) {
    return { ...draft, issueId, savedAt: draft.savedAt || Date.now() } as IssueEditDraft;
  }
  // 레거시 키 폴백
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${EDIT_DRAFT_PREFIX}${issueId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as IssueEditDraft;
        draftStorage.saveIssueDraft(`edit_${issueId}`, parsed);
        return parsed;
      }
    } catch {}
  }
  return null;
};

/**
 * 🗑️ 이슈 편집 임시 저장본 삭제
 */
export const clearIssueEditDraft = (issueId: number) => {
  if (!issueId) return;
  draftStorage.clearIssueDraft(`edit_${issueId}`);
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`${EDIT_DRAFT_PREFIX}${issueId}`);
    } catch {}
  }
};

/**
 * 💾 신규 이슈 생성 임시 저장본 저장
 */
export const saveIssueCreateDraft = (draft: Omit<IssueCreateDraft, 'savedAt'>) => {
  const payload: IssueCreateDraft = {
    ...draft,
    savedAt: Date.now(),
  };
  draftStorage.saveIssueDraft('new', payload);
};

/**
 * 📖 신규 이슈 생성 임시 저장본 조회
 */
export const getIssueCreateDraft = (): IssueCreateDraft | null => {
  const draft = draftStorage.getIssueDraft('new');
  if (draft) return { ...draft, savedAt: draft.savedAt || Date.now() } as IssueCreateDraft;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CREATE_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as IssueCreateDraft;
        draftStorage.saveIssueDraft('new', parsed);
        return parsed;
      }
    } catch {}
  }
  return null;
};

/**
 * 🗑️ 신규 이슈 생성 임시 저장본 삭제
 */
export const clearIssueCreateDraft = () => {
  draftStorage.clearIssueDraft('new');
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CREATE_DRAFT_KEY);
    } catch {}
  }
};
