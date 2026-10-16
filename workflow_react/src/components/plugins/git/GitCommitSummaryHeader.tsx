import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Plus, Minus } from 'lucide-react';
import type { GitCommitDetail, GitCommitFileDiff } from '@/api/gitPlugin';

interface GitCommitSummaryHeaderProps {
  commit: GitCommitDetail;
  activeFiles: GitCommitFileDiff[];
}

export const GitCommitSummaryHeader: React.FC<GitCommitSummaryHeaderProps> = ({
  commit,
  activeFiles,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const messageParts = (commit.message || '').split('\n');
  const commitTitle = messageParts[0] || '커밋 상세 정보';
  const commitBody = messageParts.slice(1).join('\n').trim();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
      }}
    >
      {/* 커밋 타이틀 & 원격 링크 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text-bright)',
              lineHeight: '1.4',
              wordBreak: 'break-word',
            }}
          >
            {commitTitle}
          </h3>
          {commitBody && (
            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-sub)',
                whiteSpace: 'pre-wrap',
                maxHeight: '70px',
                overflowY: 'auto',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {commitBody}
            </div>
          )}
        </div>

        {commit.url && (
          <a
            href={commit.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11.5px',
              color: 'var(--primary)',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span>GitHub/원격에서 보기</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* 커밋 메타데이터 & 통계 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          fontSize: '12px',
          color: 'var(--text-sub)',
          borderTop: '1px solid var(--border-divider)',
          paddingTop: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'var(--text-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              {commit.authorName.slice(0, 1).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{commit.authorName}</span>
          </div>

          <span>committed on {formatDate(commit.committedAt)}</span>

          <span style={{ color: 'var(--border-light)' }}>|</span>

          {/* SHA 해시 복사 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
            <span style={{ color: 'var(--text-bright)' }}>{commit.commitHash.slice(0, 7)}</span>
            <button
              type="button"
              onClick={() => handleCopy(commit.commitHash)}
              title="전체 커밋 SHA 복사"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                padding: '2px',
              }}
            >
              {copied ? <Check size={12} style={{ color: 'var(--secondary)' }} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {commit.stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-bright)' }}>
              {activeFiles.length} changed files
            </span>
            <span style={{ color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <Plus size={12} /> {commit.stats.additions}
            </span>
            <span style={{ color: 'var(--accent-rose)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <Minus size={12} /> {commit.stats.deletions}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
