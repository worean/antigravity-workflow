import { create } from 'zustand';
import { safeStorage } from '@/utils/safeStorage';
import type { UserMemoItem, MemoFilterState, CreateMemoInput, UpdateMemoInput } from '@/types/memo';

interface MemoStoreState {
  memos: UserMemoItem[];
  activeMemoId: string | null;
  filter: MemoFilterState;
  currentUserId: number | null;
  isSaving: boolean;

  initUserMemos: (userId: number) => void;
  setActiveMemoId: (id: string | null) => void;
  setFilter: (patch: Partial<MemoFilterState>) => void;
  resetFilter: () => void;

  createMemo: (userId: number, input?: CreateMemoInput) => UserMemoItem;
  updateMemo: (id: string, input: UpdateMemoInput) => void;
  deleteMemo: (id: string) => void;
  togglePin: (id: string) => void;
  getMemoByIssueId: (issueId: number) => UserMemoItem | undefined;
  flushDebouncedSave: () => void;
}

const STORAGE_KEY_PREFIX = 'user_memos_';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSaveUserId: number | null = null;
let pendingSaveData: UserMemoItem[] | null = null;

const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `memo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useMemoStore = create<MemoStoreState>((set, get) => ({
  memos: [],
  activeMemoId: null,
  currentUserId: null,
  isSaving: false,
  filter: {
    search: '',
    issueFilter: 'ALL',
    color: 'ALL',
  },

  initUserMemos: (userId: number) => {
    if (!userId) return;
    const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
    const loaded = safeStorage.getItem<UserMemoItem[]>(storageKey, []);
    set({
      currentUserId: userId,
      memos: Array.isArray(loaded) ? loaded : [],
    });
  },

  setActiveMemoId: (id: string | null) => {
    get().flushDebouncedSave();
    set({ activeMemoId: id });
  },

  setFilter: (patch: Partial<MemoFilterState>) => {
    set((state) => ({
      filter: { ...state.filter, ...patch },
    }));
  },

  resetFilter: () => {
    set({
      filter: {
        search: '',
        issueFilter: 'ALL',
        color: 'ALL',
      },
    });
  },

  createMemo: (userId: number, input?: CreateMemoInput) => {
    const now = new Date().toISOString();
    const newMemo: UserMemoItem = {
      id: generateUuid(),
      userId,
      issueId: input?.issueId ?? null,
      content: input?.content ?? '',
      color: input?.color ?? 'yellow',
      isPinned: input?.isPinned ?? false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const updated = [newMemo, ...state.memos];
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      safeStorage.setItem(storageKey, updated);
      return { memos: updated, activeMemoId: newMemo.id };
    });

    return newMemo;
  },

  updateMemo: (id: string, input: UpdateMemoInput) => {
    const userId = get().currentUserId;
    if (!userId) return;

    set((state) => {
      const now = new Date().toISOString();
      const updated = state.memos.map((memo) => {
        if (memo.id !== id) return memo;
        return {
          ...memo,
          ...input,
          updatedAt: now,
        };
      });

      pendingSaveUserId = userId;
      pendingSaveData = updated;

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        if (pendingSaveUserId && pendingSaveData) {
          const key = `${STORAGE_KEY_PREFIX}${pendingSaveUserId}`;
          safeStorage.setItem(key, pendingSaveData);
          set({ isSaving: false });
        }
        debounceTimer = null;
        pendingSaveUserId = null;
        pendingSaveData = null;
      }, 600);

      return { memos: updated, isSaving: true };
    });
  },

  flushDebouncedSave: () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (pendingSaveUserId && pendingSaveData) {
      const key = `${STORAGE_KEY_PREFIX}${pendingSaveUserId}`;
      safeStorage.setItem(key, pendingSaveData);
      set({ isSaving: false });
      pendingSaveUserId = null;
      pendingSaveData = null;
    }
  },

  deleteMemo: (id: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    get().flushDebouncedSave();

    set((state) => {
      const updated = state.memos.filter((m) => m.id !== id);
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      safeStorage.setItem(storageKey, updated);
      return {
        memos: updated,
        activeMemoId: state.activeMemoId === id ? null : state.activeMemoId,
      };
    });
  },

  togglePin: (id: string) => {
    const userId = get().currentUserId;
    if (!userId) return;

    get().flushDebouncedSave();

    set((state) => {
      const now = new Date().toISOString();
      const updated = state.memos.map((m) =>
        m.id === id ? { ...m, isPinned: !m.isPinned, updatedAt: now } : m
      );
      const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;
      safeStorage.setItem(storageKey, updated);
      return { memos: updated };
    });
  },

  getMemoByIssueId: (issueId: number) => {
    const { memos } = get();
    return memos.find((m) => m.issueId === issueId);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('ag_user_memos_')) {
      const currentUserId = useMemoStore.getState().currentUserId;
      if (currentUserId && e.key === `ag_user_memos_${currentUserId}`) {
        try {
          const freshMemos = e.newValue ? JSON.parse(e.newValue) : [];
          useMemoStore.setState({ memos: freshMemos });
        } catch (err) {
          console.warn('[useMemoStore] Failed to sync cross-tab storage:', err);
        }
      }
    }
  });
}
