import React from 'react';
import { ChevronLeft, ChevronRight, FileCode2, Layers } from 'lucide-react';
import type { GitCommitFileDiff } from '@/api/gitPlugin';

interface GitCommitDiffToolbarProps {
  activeFiles: GitCommitFileDiff[];
  currentFile?: GitCommitFileDiff;
  currentIndex: number;
  viewMode: 'single' | 'all';
  onPrevFile: () => void;
  onNextFile: () => void;
  onViewModeChange: (mode: 'single' | 'all') => void;
}

export const GitCommitDiffToolbar: React.FC<GitCommitDiffToolbarProps> = ({
  activeFiles,
  currentFile,
  currentIndex,
  viewMode,
  onPrevFile,
  onNextFile,
  onViewModeChange,
}) => {
  if (activeFiles.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        fontSize: '12px',
        flexShrink: 0,
        gap: '10px',
      }}
    >
      {/* 파일 인덱스 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            type="button"
            onClick={onPrevFile}
            disabled={currentIndex <= 0}
            title="이전 파일 (Ctrl+Left)"
            style={{
              padding: '3px 6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
              opacity: currentIndex <= 0 ? 0.4 : 1,
              color: 'var(--text-bright)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNextFile}
            disabled={currentIndex >= activeFiles.length - 1}
            title="다음 파일 (Ctrl+Right)"
            style={{
              padding: '3px 6px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              cursor: currentIndex >= activeFiles.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentIndex >= activeFiles.length - 1 ? 0.4 : 1,
              color: 'var(--text-bright)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <span style={{ color: 'var(--text-sub)', fontSize: '11px', whiteSpace: 'nowrap' }}>
          {activeFiles.length > 0 ? `${currentIndex + 1} / ${activeFiles.length}` : '0 / 0'}
        </span>

        {currentFile && (
          <span
            style={{
              fontFamily: 'monospace',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={currentFile.filename}
          >
            {currentFile.filename}
          </span>
        )}
      </div>

      {/* 뷰 모드 토글: 단일 파일 포커스 뷰 vs 전체 모아보기 */}
      <div
        style={{
          display: 'flex',
          gap: '2px',
          backgroundColor: 'var(--bg-card)',
          padding: '2px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-light)',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => onViewModeChange('single')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: viewMode === 'single' ? 600 : 400,
            backgroundColor: viewMode === 'single' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'single' ? 'var(--text-on-primary)' : 'var(--text-sub)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
          }}
        >
          <FileCode2 size={12} />
          <span>선택 파일 상세</span>
        </button>

        <button
          type="button"
          onClick={() => onViewModeChange('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            fontWeight: viewMode === 'all' ? 600 : 400,
            backgroundColor: viewMode === 'all' ? 'var(--primary)' : 'transparent',
            color: viewMode === 'all' ? 'var(--text-on-primary)' : 'var(--text-sub)',
            border: 'none',
            borderRadius: 'var(--radius-xs)',
            cursor: 'pointer',
          }}
        >
          <Layers size={12} />
          <span>전체 모아보기 ({activeFiles.length})</span>
        </button>
      </div>
    </div>
  );
};
