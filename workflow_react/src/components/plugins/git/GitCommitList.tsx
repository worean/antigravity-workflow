﻿import React, { useState } from 'react';
import { GitCommit, Copy, Check, Loader2 } from 'lucide-react';
import type { GitCommitItem } from '@/api/gitPlugin';

interface GitCommitListProps {
  commits: GitCommitItem[];
  isLoading?: boolean;
}

export const GitCommitList: React.FC<GitCommitListProps> = ({ commits, isLoading }) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => {
      setCopiedHash(null);
    }, 2000);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '8px', color: 'var(--text-sub)' }}>
        <Loader2 size={18} className="animate-spin" />
        <span>커밋 내역을 불러오는 중...</span>
      </div>
    );
  }

  if (!commits || commits.length === 0) {
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
        <GitCommit size={28} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>연결된 커밋 내역이 없습니다</div>
        <div style={{ fontSize: '13px' }}>
          커밋 메시지에 일감 번호(예: <code>#123</code>)를 포함하여 푸시하면 자동으로 연결됩니다.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {commits.map((c) => {
        const shortHash = c.commitHash.slice(0, 7);
        const isCopied = copiedHash === c.commitHash;

        return (
          <div
            key={c.id || c.commitHash}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={() => handleCopy(c.commitHash)}
              title={`전체 해시 복사: ${c.commitHash}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 6px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--accent-cyan)',
                fontSize: '11px',
                fontFamily: 'monospace',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <GitCommit size={12} />
              <span>{shortHash}</span>
              {isCopied ? <Check size={11} style={{ color: 'var(--secondary)' }} /> : <Copy size={11} />}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 500,
                  wordBreak: 'break-word',
                  lineHeight: '1.4',
                }}
              >
                {c.message}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-sub)' }}>
                <span>{c.authorName}</span>
                {c.authorEmail && <span>&lt;{c.authorEmail}&gt;</span>}
                <span>•</span>
                <span>{formatDate(c.committedAt)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
