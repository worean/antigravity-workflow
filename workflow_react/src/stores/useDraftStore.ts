import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IssueDraft } from '@/utils/draftStorage';

export interface DraftStoreState {
  drafts: Record<string, IssueDraft>;
  getDraft: (key: string | number) => IssueDraft | null;
  saveDraft: (key: string | number, draft: Partial<IssueDraft>) => void;
  clearDraft: (key: string | number) => void;
  hasDraft: (key: string | number) => boolean;
}

export const useDraftStore = create<DraftStoreState>()(
  persist(
    (set, get) => ({
      drafts: {},

      getDraft: (key) => {
        const k = String(key);
        return get().drafts[k] || null;
      },

      saveDraft: (key, draft) => {
        const k = String(key);
        const payload: IssueDraft = {
          ...draft,
          savedAt: Date.now(),
        };
        set((state) => ({
          drafts: {
            ...state.drafts,
            [k]: payload,
          },
        }));
      },

      clearDraft: (key) => {
        const k = String(key);
        set((state) => {
          const next = { ...state.drafts };
          delete next[k];
          return { drafts: next };
        });
      },

      hasDraft: (key) => {
        const k = String(key);
        return Boolean(get().drafts[k]);
      },
    }),
    {
      name: 'ag_issue_drafts',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
