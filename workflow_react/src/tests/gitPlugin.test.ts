import { describe, it, expect } from 'vitest';
import { gitPluginKeys } from '@/api/gitPlugin';
import type { GitPluginConfig, GitPullRequestItem, GitCommitItem } from '@/api/gitPlugin';

describe('🧪 [Frontend Git Plugin] Data Types & Query Keys Unit Tests', () => {
  it('TC-POS-01: gitPluginKeys 팩토리가 도메인별 일관된 캐시 키를 생성해야 한다', () => {
    expect(gitPluginKeys.all).toEqual(['git-plugin']);
    expect(gitPluginKeys.config()).toEqual(['git-plugin', 'config']);
    expect(gitPluginKeys.mappings()).toEqual(['git-plugin', 'mappings', 'all']);
    expect(gitPluginKeys.mappings(10)).toEqual(['git-plugin', 'mappings', 10]);
    expect(gitPluginKeys.issueData(42)).toEqual(['git-plugin', 'issue', 42]);
    expect(gitPluginKeys.pipelines(5)).toEqual(['git-plugin', 'pipelines', 5]);
  });

  it('TC-POS-02: 사양서 명세에 따른 GitPluginConfig Mock Data 규격 검증', () => {
    const mockConfig: GitPluginConfig = {
      id: 1,
      workspaceId: 10,
      isEnabled: true,
      provider: 'GITHUB',
      serverUrl: 'https://api.github.com',
      hasToken: true,
      maskedToken: 'ghp_************abcd',
      autoCloseIssueOnMerge: true,
      webhookUrl: 'https://api.antigravity.com/api/plugins/git/webhook?ws=10',
    };

    expect(mockConfig.isEnabled).toBe(true);
    expect(mockConfig.provider).toBe('GITHUB');
    expect(mockConfig.maskedToken).toContain('************');
    expect(mockConfig.webhookUrl).toContain('/api/plugins/git/webhook');
  });

  it('TC-POS-03: 사양서 명세에 따른 GitPullRequestItem Mock Data 규격 검증', () => {
    const mockPr: GitPullRequestItem = {
      id: 101,
      prNumber: 42,
      title: 'feat(core): implement git integration plugin',
      sourceBranch: 'feature/issue-123-git-plugin',
      targetBranch: 'main',
      state: 'OPEN',
      authorName: 'honggildong',
      url: 'https://github.com/myorg/myrepo/pull/42',
      ciStatus: 'SUCCESS',
      createdAt: '2026-10-14T09:00:00Z',
      updatedAt: '2026-10-14T09:30:00Z',
    };

    expect(mockPr.prNumber).toBe(42);
    expect(['OPEN', 'MERGED', 'CLOSED']).toContain(mockPr.state);
    expect(['SUCCESS', 'FAILED', 'RUNNING', 'PENDING']).toContain(mockPr.ciStatus);
  });

  it('TC-POS-04: 사양서 명세에 따른 GitCommitItem 40자 SHA 및 타임스탬프 검증', () => {
    const mockCommit: GitCommitItem = {
      id: 201,
      commitHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      message: 'feat: add git plugin data models and schemas (#123)',
      authorName: '홍길동',
      committedAt: '2026-10-14T09:30:00.000Z',
      createdAt: '2026-10-14T09:30:00.000Z',
    };

    expect(mockCommit.commitHash.length).toBe(40);
    expect(mockCommit.message).toContain('#123');
    expect(mockCommit.commitHash.slice(0, 7)).toBe('a1b2c3d');
  });
});
