﻿import React from 'react';
import { GitPullRequest, GitMerge, ExternalLink, CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import type { GitPullRequestItem } from '@/api/gitPlugin';

interface GitPullRequestListProps {
  pullRequests: GitPullRequestItem[];
  isLoading?: boolean;
}

export const GitPullRequestList: React.FC<GitPullRequestListProps> = ({ pullRequests, isLoading }) => {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '8px', color: 'var(--text-sub)' }}>
        <Loader2 size={18} className="animate-spin" />
        <span>Pull Request 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (!pullRequests || pullRequests.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '36px 16px',
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-light)',
          color: 'var(--text-sub)',
          textAlign: 'center',
          gap: '8px',
        }}
      >
        <GitPullRequest size={28} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>연결된 Pull / Merge Request가 없습니다</div>
        <div style={{ fontSize: '13px' }}>상단의 'PR 생성' 버튼을 눌러 원격 저장소에 새로운 요청을 생성해 보세요.</div>
      </div>
    );
  }

  const renderStateBadge = (state: GitPullRequestItem['state']) => {
    let bg = 'rgba(59, 130, 246, 0.15)';
    let color = '#3b82f6';
    let label = 'OPEN';
    let icon = <GitPullRequest size={12} />;

    if (state === 'MERGED') {
      bg = 'rgba(168, 85, 247, 0.15)';
      color = '#a855f7';
      label = 'MERGED';
      icon = <GitMerge size={12} />;
    } else if (state === 'CLOSED') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#ef4444';
      label = 'CLOSED';
      icon = <AlertCircle size={12} />;
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: bg,
          color,
          letterSpacing: '0.5px',
        }}
      >
        {icon}
        {label}
      </span>
    );
  };

  const renderCiBadge = (ciStatus?: string | null) => {
    if (!ciStatus) return null;

    let icon = <Clock size={12} />;
    let text = ciStatus;
    let color = 'var(--text-sub)';

    if (ciStatus === 'SUCCESS') {
      icon = <CheckCircle2 size={12} />;
      color = 'var(--secondary)';
      text = 'Checks passed';
    } else if (ciStatus === 'FAILED') {
      icon = <AlertCircle size={12} />;
      color = 'var(--accent-rose)';
      text = 'Checks failed';
    } else if (ciStatus === 'RUNNING' || ciStatus === 'PENDING') {
      icon = <Loader2 size={12} className="animate-spin" />;
      color = 'var(--accent-amber)';
      text = 'Checks in progress';
    }

    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color }}>
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {pullRequests.map((pr) => (
        <div
          key={pr.id || pr.prNumber}
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            gap: '8px',
            transition: 'border-color 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              {renderStateBadge(pr.state)}
              <span style={{ color: 'var(--text-sub)', fontSize: '12px', fontWeight: 600 }}>#{pr.prNumber}</span>
              <span
                style={{
                  color: 'var(--text-bright)',
                  fontSize: '13px',
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={pr.title}
              >
                {pr.title}
              </span>
            </div>

            {pr.url && (
              <a
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--primary)',
                  fontSize: '12px',
                  textDecoration: 'none',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-subtle)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                <span>원문 보기</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-sub)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ padding: '2px 6px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', fontFamily: 'monospace' }}>
                {pr.sourceBranch}
              </span>
              <span>→</span>
              <span style={{ padding: '2px 6px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', fontFamily: 'monospace' }}>
                {pr.targetBranch}
              </span>
              <span>•</span>
              <span>작성자: {pr.authorName}</span>
            </div>

            {renderCiBadge(pr.ciStatus)}
          </div>
        </div>
      ))}
    </div>
  );
};
