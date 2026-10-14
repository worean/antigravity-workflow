﻿import React, { useState } from 'react';
import { GitBranch, GitPullRequest, GitCommit, RefreshCw, Plus, AlertCircle } from 'lucide-react';
import { useIssueGitData } from '@/api/gitPlugin';
import { GitPullRequestList } from './GitPullRequestList';
import { GitCommitList } from './GitCommitList';
import { CreateBranchModal } from './CreateBranchModal';
import { CreatePullRequestModal } from './CreatePullRequestModal';

interface IssueGitSectionProps {
  issueId: number;
  issueNumber: number;
  issueTitle: string;
}

export const IssueGitSection: React.FC<IssueGitSectionProps> = ({
  issueId,
  issueNumber,
  issueTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'prs' | 'commits'>('prs');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching, error } = useIssueGitData(issueId);

  const repositories = data?.availableRepositories || [];
  const hasRepositories = repositories.length > 0;
  const pullRequests = data?.pullRequests || [];
  const commits = data?.commits || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
      {/* 1. 상단 컨트롤 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)' }}>연동 저장소:</span>
          {hasRepositories ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {repositories.map((repo) => (
                <span
                  key={repo.id}
                  style={{
                    padding: '2px 8px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--accent-cyan)',
                  }}
                >
                  {repo.repoIdentifier}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>연결된 Git 저장소 없음</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            title="새로고침"
            style={{
              padding: '6px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-sub)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsBranchModalOpen(true)}
            disabled={!hasRepositories}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              color: hasRepositories ? 'var(--text-main)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: hasRepositories ? 'pointer' : 'not-allowed',
            }}
          >
            <GitBranch size={13} />
            <span>브랜치 생성</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrModalOpen(true)}
            disabled={!hasRepositories}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              backgroundColor: hasRepositories ? 'var(--primary)' : 'var(--bg-input)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: hasRepositories ? 'var(--text-on-primary)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: hasRepositories ? 'pointer' : 'not-allowed',
            }}
          >
            <Plus size={13} />
            <span>PR 생성</span>
          </button>
        </div>
      </div>

      {!hasRepositories && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid var(--accent-amber)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--accent-amber)',
            fontSize: '13px',
          }}
        >
          <AlertCircle size={16} />
          <span>현재 프로젝트에 매핑된 Git 저장소가 없습니다. 프로젝트 설정에서 저장소를 연결해주세요.</span>
        </div>
      )}

      {/* 2. 서브 탭 헤더 */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-divider)', paddingBottom: '2px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('prs')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: activeTab === 'prs' ? 600 : 400,
            color: activeTab === 'prs' ? 'var(--primary)' : 'var(--text-sub)',
            borderBottom: activeTab === 'prs' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <GitPullRequest size={14} />
          <span>Pull Requests ({pullRequests.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('commits')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: activeTab === 'commits' ? 600 : 400,
            color: activeTab === 'commits' ? 'var(--primary)' : 'var(--text-sub)',
            borderBottom: activeTab === 'commits' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <GitCommit size={14} />
          <span>Commits ({commits.length})</span>
        </button>
      </div>

      {/* 3. 탭 본문 */}
      {error ? (
        <div style={{ padding: '16px', color: 'var(--accent-rose)', fontSize: '13px' }}>
          Git 데이터를 불러오는 중 오류가 발생했습니다.
        </div>
      ) : activeTab === 'prs' ? (
        <GitPullRequestList pullRequests={pullRequests} isLoading={isLoading} />
      ) : (
        <GitCommitList commits={commits} isLoading={isLoading} />
      )}

      {/* 4. 모달 팝업 */}
      {hasRepositories && (
        <>
          <CreateBranchModal
            isOpen={isBranchModalOpen}
            onClose={() => {
              setIsBranchModalOpen(false);
              refetch();
            }}
            issueNumber={issueNumber}
            issueTitle={issueTitle}
            availableRepositories={repositories}
          />

          <CreatePullRequestModal
            isOpen={isPrModalOpen}
            onClose={() => {
              setIsPrModalOpen(false);
              refetch();
            }}
            issueId={issueId}
            issueNumber={issueNumber}
            issueTitle={issueTitle}
            availableRepositories={repositories}
          />
        </>
      )}
    </div>
  );
};
