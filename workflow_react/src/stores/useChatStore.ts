import { create } from 'zustand';

export interface ChatStoreState {
  // 채널별 읽지 않은 메시지 수 매핑
  channelUnreadMap: Record<number, number>;
  // 채널별 멘션 포함 여부 매핑
  channelMentionMap: Record<number, boolean>;
  // 전체 읽지 않은 메시지 합계 (Menu 알림 뱃지용)
  totalUnreadCount: number;
  // 전체 읽지 않은 멘션 존재 여부
  hasMentionUnread: boolean;
  // 현재 활성화된 채팅방 ID
  selectedChannelId: number | null;

  // 액션
  setSelectedChannelId: (channelId: number | null) => void;
  syncChannels: (channels: { id: number; unreadCount?: number; hasMention?: boolean }[]) => void;
  markChannelAsRead: (channelId: number) => void;
  markAllAsRead: () => void;
  onNewMessageReceived: (channelId: number, hasMention?: boolean) => void;
}

const computeStats = (
  unreadMap: Record<number, number>,
  mentionMap: Record<number, boolean>
): { totalUnreadCount: number; hasMentionUnread: boolean } => {
  let total = 0;
  let hasMention = false;

  for (const [chIdStr, count] of Object.entries(unreadMap)) {
    const chId = Number(chIdStr);
    if (count > 0) {
      total += count;
      if (mentionMap[chId]) {
        hasMention = true;
      }
    }
  }

  return { totalUnreadCount: total, hasMentionUnread: hasMention };
};

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  channelUnreadMap: {},
  channelMentionMap: {},
  totalUnreadCount: 0,
  hasMentionUnread: false,
  selectedChannelId: null,

  setSelectedChannelId: (channelId) => {
    set({ selectedChannelId: channelId });
    if (channelId !== null) {
      // 선택된 방은 즉시 읽음 처리 (Optimistic UI 갱신)
      get().markChannelAsRead(channelId);
    }
  },

  syncChannels: (channels) => {
    const unreadMap: Record<number, number> = {};
    const mentionMap: Record<number, boolean> = {};
    const currentSelected = get().selectedChannelId;

    for (const ch of channels) {
      // 현재 보고 있는 방이면 0으로 강제 보정
      const count = ch.id === currentSelected ? 0 : ch.unreadCount || 0;
      unreadMap[ch.id] = count;
      mentionMap[ch.id] = count > 0 && !!ch.hasMention;
    }

    const { totalUnreadCount, hasMentionUnread } = computeStats(unreadMap, mentionMap);
    set({
      channelUnreadMap: unreadMap,
      channelMentionMap: mentionMap,
      totalUnreadCount,
      hasMentionUnread,
    });
  },

  markChannelAsRead: (channelId) => {
    const state = get();
    if ((state.channelUnreadMap[channelId] || 0) === 0 && !state.channelMentionMap[channelId]) {
      return; // 이미 0이면 불필요한 리렌더 방지
    }

    const nextUnreadMap = { ...state.channelUnreadMap, [channelId]: 0 };
    const nextMentionMap = { ...state.channelMentionMap, [channelId]: false };
    const { totalUnreadCount, hasMentionUnread } = computeStats(nextUnreadMap, nextMentionMap);

    set({
      channelUnreadMap: nextUnreadMap,
      channelMentionMap: nextMentionMap,
      totalUnreadCount,
      hasMentionUnread,
    });
  },

  markAllAsRead: () => {
    const nextUnreadMap: Record<number, number> = {};
    const nextMentionMap: Record<number, boolean> = {};

    for (const key of Object.keys(get().channelUnreadMap)) {
      nextUnreadMap[Number(key)] = 0;
      nextMentionMap[Number(key)] = false;
    }

    set({
      channelUnreadMap: nextUnreadMap,
      channelMentionMap: nextMentionMap,
      totalUnreadCount: 0,
      hasMentionUnread: false,
    });
  },

  onNewMessageReceived: (channelId, hasMention = false) => {
    const state = get();
    // 사용자가 현재 해당 채팅방을 보고 있는 경우 카운트를 올리지 않음 (0 유지)
    if (state.selectedChannelId === channelId) {
      return;
    }

    const nextCount = (state.channelUnreadMap[channelId] || 0) + 1;
    const nextUnreadMap = { ...state.channelUnreadMap, [channelId]: nextCount };
    const nextMentionMap = {
      ...state.channelMentionMap,
      [channelId]: (state.channelMentionMap[channelId] || false) || hasMention,
    };
    const { totalUnreadCount, hasMentionUnread } = computeStats(nextUnreadMap, nextMentionMap);

    set({
      channelUnreadMap: nextUnreadMap,
      channelMentionMap: nextMentionMap,
      totalUnreadCount,
      hasMentionUnread,
    });
  },
}));
