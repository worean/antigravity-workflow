import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSprintWorklogsService } from '../modules/sprints/services/getSprintWorklogs.service.js';
import { prisma } from '#lib/prisma.js';

vi.mock('#lib/prisma.js', () => ({
  prisma: {
    issue: {
      findMany: vi.fn(),
    },
    worklog: {
      findMany: vi.fn(),
    },
  },
}));

describe('sprints.getSprintWorklogs Sub-Service Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. 스프린트 ID가 유효하지 않으면 에러를 던져야 한다', async () => {
    await expect(getSprintWorklogsService(0)).rejects.toThrow('Valid Sprint ID is required');
  });

  it('2. 스프린트에 속한 이슈가 없으면 빈 배열을 반환해야 한다', async () => {
    vi.mocked(prisma.issue.findMany).mockResolvedValueOnce([]);

    const result = await getSprintWorklogsService(5);
    expect(result).toEqual([]);
    expect(prisma.worklog.findMany).not.toHaveBeenCalled();
  });

  it('3. 스프린트에 속한 이슈들의 작업 일지를 최신순으로 반환해야 한다', async () => {
    vi.mocked(prisma.issue.findMany).mockResolvedValueOnce([{ id: 201 } as any]);

    const mockWorklogs = [
      {
        id: 10,
        timeSpent: 120,
        timeSpentHours: 2,
        description: '스프린트 버그 수정',
        issueId: 201,
        createdAt: new Date('2026-08-27T11:00:00Z'),
        user: { id: 1, name: '홍길동' },
        issue: { id: 201, title: '로그인 오류' },
      },
    ];

    vi.mocked(prisma.worklog.findMany).mockResolvedValueOnce(mockWorklogs as any);

    const result = await getSprintWorklogsService(5);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('스프린트 버그 수정');
    expect(prisma.worklog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { issueId: { in: [201] } },
        orderBy: { createdAt: 'desc' },
      })
    );
  });
});