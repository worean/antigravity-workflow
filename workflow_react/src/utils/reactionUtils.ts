/**
 * AntiGravity Unified Reaction Calculation & Grouping Utilities
 * - 채팅 메시지 및 일감 댓글의 이모지 리액션 중복 제거 및 집계 (Group by Emoji)
 * - 현재 로그인 유저의 리액션 여부(hasReacted) 판별
 * - 2개 이상일 때 숫자 표기 및 정렬 기준 제공
 */

export interface ReactionUser {
  id: number;
  name: string;
  email?: string;
}

export interface GroupedReaction {
  emoji: string;
  count: number;
  users: ReactionUser[];
  hasReacted: boolean;
}

/**
 * Raw 또는 Grouped 형태의 리액션 배열을 이모지별 단일 그룹 목록으로 정규화합니다.
 * @param reactions 서버 또는 로컬 상태의 reactions 배열 (ChatMessageReaction[] 또는 GroupedReaction[])
 * @param currentUserId 현재 로그인한 사용자의 ID
 * @returns 이모지별로 중복이 제거되고 count 및 hasReacted가 계산된 GroupedReaction 배열
 */
export const groupReactions = (
  reactions?: any[] | null,
  currentUserId?: number | null
): GroupedReaction[] => {
  if (!reactions || !Array.isArray(reactions) || reactions.length === 0) {
    return [];
  }

  const groupMap = new Map<string, GroupedReaction>();

  for (const item of reactions) {
    if (!item || !item.emoji) continue;

    const emoji = String(item.emoji).trim();
    if (!emoji) continue;

    if (!groupMap.has(emoji)) {
      groupMap.set(emoji, {
        emoji,
        count: 0,
        users: [],
        hasReacted: false,
      });
    }

    const group = groupMap.get(emoji)!;

    // 1. 이미 count와 users가 제공된 GroupedReaction 형태인 경우
    if (typeof item.count === 'number' && Array.isArray(item.users)) {
      // 만약 이미 그룹핑된 객체라면
      group.count = Math.max(group.count, item.count);
      item.users.forEach((u: any) => {
        if (u && typeof u.id === 'number') {
          if (!group.users.some((existing) => existing.id === u.id)) {
            group.users.push({ id: u.id, name: u.name || '', email: u.email });
          }
        }
      });
      if (item.hasReacted === true) {
        group.hasReacted = true;
      }
    } else {
      // 2. DB Raw 형태 ({ id, emoji, userId, user?: { id, name } })인 경우
      const userId = item.userId ?? item.user?.id;
      const userName = item.user?.name ?? item.userName;

      // 동일 유저가 같은 이모지에 대해 중복 카운트되지 않도록 검사
      const alreadyHasUser = userId ? group.users.some((u) => u.id === userId) : false;
      if (!alreadyHasUser) {
        group.count += 1;
        if (userId) {
          group.users.push({ id: userId, name: userName || '' });
        }
      }
    }

    // 현재 로그인된 유저가 리액션했는지 확인
    if (currentUserId && !group.hasReacted) {
      const isMyReaction =
        item.userId === currentUserId ||
        item.user?.id === currentUserId ||
        group.users.some((u) => u.id === currentUserId) ||
        item.hasReacted === true;
      if (isMyReaction) {
        group.hasReacted = true;
      }
    }
  }

  // users 배열의 길이와 count 정합성 보정 (users가 더 많으면 users 길이 우선)
  for (const group of groupMap.values()) {
    if (group.users.length > 0 && group.count < group.users.length) {
      group.count = group.users.length;
    }
    // currentUserId 기반 최종 재확인
    if (currentUserId && !group.hasReacted) {
      group.hasReacted = group.users.some((u) => u.id === currentUserId);
    }
  }

  return Array.from(groupMap.values());
};

/**
 * 리액션 툴팁에 표시할 사용자 목록 텍스트를 생성합니다.
 * 예: "홍길동, 이순신" 또는 "내가 반응함"
 */
export const formatReactionTooltip = (
  reaction: GroupedReaction,
  currentUserId?: number | null
): string => {
  const names: string[] = [];
  reaction.users.forEach((u) => {
    if (currentUserId && u.id === currentUserId) {
      names.push(`${u.name || '나'} (나)`);
    } else if (u.name) {
      names.push(u.name);
    }
  });

  if (names.length === 0) {
    return reaction.count > 0 ? `${reaction.count}명 참여` : reaction.emoji;
  }
  return names.join(', ');
};
