import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, FileCode } from 'lucide-react';
import type { GitCommitFileDiff } from '@/api/gitPlugin';

interface GitCommitDiffCardProps {
  file: GitCommitFileDiff;
  fillContainer?: boolean;
  maxHeight?: string;
}

export const GitCommitDiffCard: React.FC<GitCommitDiffCardProps> = ({
  file,
  fillContainer = false,
  maxHeight,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(file.filename);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'added':
        return (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--secondary)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            + Added
          </span>
        );
      case 'deleted':
        return (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--accent-rose)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            - Deleted
          </span>
        );
      case 'renamed':
        return (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--accent-amber)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            ↔ Renamed
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              color: 'var(--accent-cyan)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            • Modified
          </span>
        );
    }
  };

  const renderDiffLines = (patch: string) => {
    // CRLF 정규화 및 분할
    const normalizedPatch = patch.replace(/\r\n/g, '\n');
    const lines = normalizedPatch.split('\n');
    let oldLine = 0;
    let newLine = 0;

    return lines.map((line, idx) => {
      let bg = 'transparent';
      let textColor = 'var(--text-main)';
      let oldNumStr = '';
      let newNumStr = '';
      let prefix = ' ';
      let content = line;

      if (line.startsWith('@@')) {
        bg = 'rgba(168, 85, 247, 0.12)';
        textColor = 'var(--accent-purple, #c084fc)';
        // @@ -1,5 +1,6 @@ 파싱
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
        }
        prefix = '@';
        content = line;
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        bg = 'rgba(34, 197, 94, 0.14)';
        textColor = 'var(--secondary)';
        newNumStr = String(newLine++);
        prefix = '+';
        content = line.slice(1);
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        bg = 'rgba(239, 68, 68, 0.14)';
        textColor = 'var(--accent-rose)';
        oldNumStr = String(oldLine++);
        prefix = '-';
        content = line.slice(1);
      } else if (line.startsWith('\\')) {
        // \ No newline at end of file
        textColor = 'var(--text-muted)';
        prefix = '\\';
        content = line.slice(1);
      } else {
        oldNumStr = String(oldLine++);
        newNumStr = String(newLine++);
        prefix = ' ';
        content = line.startsWith(' ') ? line.slice(1) : line;
      }

      return (
        <div
          key={idx}
          style={{
            display: 'flex',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
            lineHeight: '20px',
            minHeight: '20px',
            backgroundColor: bg,
            color: textColor,
          }}
        >
          {/* Old line number */}
          <span
            style={{
              width: '42px',
              textAlign: 'right',
              paddingRight: '6px',
              userSelect: 'none',
              color: 'var(--text-muted)',
              borderRight: '1px solid var(--border-divider)',
              flexShrink: 0,
            }}
          >
            {oldNumStr}
          </span>
          {/* New line number */}
          <span
            style={{
              width: '42px',
              textAlign: 'right',
              paddingRight: '6px',
              userSelect: 'none',
              color: 'var(--text-muted)',
              borderRight: '1px solid var(--border-divider)',
              flexShrink: 0,
            }}
          >
            {newNumStr}
          </span>
          {/* Diff prefix symbol (+ / - / space) */}
          <span
            style={{
              width: '20px',
              textAlign: 'center',
              userSelect: 'none',
              fontWeight: 700,
              flexShrink: 0,
              color: prefix === '+' ? 'var(--secondary)' : prefix === '-' ? 'var(--accent-rose)' : 'var(--text-muted)',
            }}
          >
            {prefix !== '@' && prefix !== ' ' ? prefix : ''}
          </span>
          {/* Code content */}
          <span
            style={{
              flex: 1,
              paddingLeft: '4px',
              paddingRight: '12px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {content || ' '}
          </span>
        </div>
      );
    });
  };

  const fileDomId = `file-diff-${encodeURIComponent(file.filename).replace(/[%._]/g, '-')}`;

  return (
    <div
      id={fileDomId}
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-card)',
        scrollMarginTop: '12px',
        ...(fillContainer
          ? {
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 0,
              flex: 1,
            }
          : {}),
      }}
    >
      {/* GitHub 스타일 Diff 카드 헤더 */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-subtle)',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-light)',
          cursor: 'pointer',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', minWidth: 0 }}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          <FileCode size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-bright)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.filename}
          </span>
          <button
            type="button"
            onClick={handleCopyPath}
            title="파일 경로 복사"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            {copied ? <Check size={12} style={{ color: 'var(--secondary)' }} /> : <Copy size={12} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {getStatusBadge(file.status)}
          <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
            <span style={{ color: 'var(--secondary)' }}>+{file.additions}</span>{' '}
            <span style={{ color: 'var(--accent-rose)' }}>-{file.deletions}</span>
          </span>
        </div>
      </div>

      {/* Diff 본문 (세로 및 가로 스크롤 완벽 지원) */}
      {!isCollapsed && (
        <div
          className="custom-scrollbar"
          style={{
            backgroundColor: 'var(--bg-app)',
            overflowX: 'auto',
            overflowY: 'auto',
            padding: '4px 0',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--scrollbar-thumb) transparent',
            ...(fillContainer
              ? {
                  flex: 1,
                  minHeight: 0,
                  height: '100%',
                }
              : {
                  maxHeight: maxHeight || '600px',
                }),
          }}
        >
          {file.patch ? (
            renderDiffLines(file.patch)
          ) : (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', textAlign: 'center' }}>
              바이너리 파일이거나 변경 diff 상세 내용이 제공되지 않습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
