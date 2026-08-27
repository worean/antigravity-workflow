// -*- coding: utf-8 -*-
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSprintDiscussionsService } from '../modules/sprints/services/getSprintDiscussions.service.js';
import { prisma } from '#lib/prisma.js';

vi.mock('#lib/prisma.js', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
    },
  },
}));

describe('sprints.getSprintDiscussions Sub-Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 스프린트 ID가 유효하지 않으면 에러를 던져야 한다', async () => {
    await expect(getSprintDiscussionsService(0)).rejects.toThrow('Valid Sprint ID is required');
    await expect(getSprintDiscussionsService(NaN as any)).rejects.toThrow('Valid Sprint ID is required');
  });

  it('2. 스프린트에 속한 이슈가 없으면 빈 배열을 반환해야 한다', async () => {
    vi.mocked(prisma.issue.findMany).mockResolvedValueOnce([]);

    const result = await getSprintDiscussionsService(10);
    expect(result).toEqual([]);
    expect(prisma.comment.findMany).not.toHaveBeenCalled();
  });

  it('3. 스프린트에 속한 이슈들의 댓글을 최신순으로 반환해야 한다', async () => {
    vi.mocked(prisma.issue.findMany).mockResolvedValueOnce([
      { id: 101 } as any,
      { id: 102 } as any,
    ]);

    const mockComments = [
      {
        id: 1,
        content: '두 번째 이슈 피드백입니다.',
        issueId: 102,
        createdAt: new Date('2026-08-27T10:00:00Z'),
        user: { id: 1, name: '홍길동' },
        issue: { id: 102, title: '채팅 UI 구현' },
      },
      {
        id: 2,
        content: '첫 번째 이슈 댓글입니다.',
        issueId: 101,
        createdAt: new Date('2026-08-27T09:00:00Z'),
        user: { id: 2, name: '이순신' },
        issue: { id: 101, title: '백엔드 API 구현' },
      },
    ];

    vi.mocked(prisma.comment.findMany).mockResolvedValueOnce(mockComments as any);

    const result = await getSprintDiscussionsService(10);
    expect(result).toHaveLength(2);
    expect(result[0].content).toBe('두 번째 이슈 피드백입니다.');
    expect(prisma.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { issueId: { in: [101, 102] } },
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});