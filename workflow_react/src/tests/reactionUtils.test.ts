import { describe, it, expect } from 'vitest';
import { groupReactions, formatReactionTooltip } from '../utils/reactionUtils';

describe('reactionUtils', () => {
  describe('groupReactions', () => {
    it('빈 배열이나 null/undefined 입력 시 빈 배열을 반환해야 한다', () => {
      expect(groupReactions(null)).toEqual([]);
      expect(groupReactions(undefined)).toEqual([]);
      expect(groupReactions([])).toEqual([]);
    });

    it('동일한 이모지의 raw DB 리액션들이 하나의 그룹으로 합쳐지고 count가 정확히 집계되어야 한다', () => {
      const rawReactions = [
        { id: 1, emoji: '👍', userId: 101, user: { id: 101, name: '홍길동' } },
        { id: 2, emoji: '👍', userId: 102, user: { id: 102, name: '이순신' } },
        { id: 3, emoji: '❤️', userId: 101, user: { id: 101, name: '홍길동' } },
      ];

      const grouped = groupReactions(rawReactions, 101);

      expect(grouped).toHaveLength(2);

      const thumbsUp = grouped.find((g) => g.emoji === '👍');
      expect(thumbsUp).toBeDefined();
      expect(thumbsUp?.count).toBe(2);
      expect(thumbsUp?.users).toHaveLength(2);
      // 로그인한 유저(101)가 리액션했으므로 hasReacted가 true
      expect(thumbsUp?.hasReacted).toBe(true);

      const heart = grouped.find((g) => g.emoji === '❤️');
      expect(heart).toBeDefined();
      expect(heart?.count).toBe(1);
      expect(heart?.hasReacted).toBe(true);
    });

    it('내가 반응하지 않은 이모지는 hasReacted가 false여야 한다', () => {
      const rawReactions = [
        { id: 1, emoji: '🎉', userId: 999, user: { id: 999, name: '외부유저' } },
      ];

      const grouped = groupReactions(rawReactions, 101);
      expect(grouped[0].hasReacted).toBe(false);
    });

    it('동일 유저가 동일 이모지에 대해 중복 raw 레코드를 가져도 count가 중복 집계되지 않아야 한다', () => {
      const duplicateReactions = [
        { id: 1, emoji: '🔥', userId: 101, user: { id: 101, name: '홍길동' } },
        { id: 2, emoji: '🔥', userId: 101, user: { id: 101, name: '홍길동' } },
      ];

      const grouped = groupReactions(duplicateReactions, 101);
      expect(grouped).toHaveLength(1);
      expect(grouped[0].count).toBe(1);
      expect(grouped[0].users).toHaveLength(1);
    });

    it('이미 Grouped 형태로 내려온 데이터도 올바르게 정규화하고 hasReacted를 판별해야 한다', () => {
      const groupedData = [
        {
          emoji: '🚀',
          count: 3,
          users: [
            { id: 201, name: 'Alice' },
            { id: 202, name: 'Bob' },
            { id: 101, name: '홍길동' },
          ],
        },
      ];

      const result = groupReactions(groupedData, 101);
      expect(result).toHaveLength(1);
      expect(result[0].emoji).toBe('🚀');
      expect(result[0].count).toBe(3);
      expect(result[0].hasReacted).toBe(true);
    });
  });

  describe('formatReactionTooltip', () => {
    it('반응한 유저 목록을 쉼표로 연결하고 로그인 유저에게 (나)를 표기해야 한다', () => {
      const reaction = {
        emoji: '👍',
        count: 2,
        users: [
          { id: 101, name: '홍길동' },
          { id: 102, name: '이순신' },
        ],
        hasReacted: true,
      };

      const tooltip = formatReactionTooltip(reaction, 101);
      expect(tooltip).toBe('홍길동 (나), 이순신');
    });

    it('유저 이름 정보가 없을 경우 참여 인원수를 표기해야 한다', () => {
      const reaction = {
        emoji: '👍',
        count: 3,
        users: [],
        hasReacted: false,
      };

      const tooltip = formatReactionTooltip(reaction, 101);
      expect(tooltip).toBe('3명 참여');
    });
  });
});
