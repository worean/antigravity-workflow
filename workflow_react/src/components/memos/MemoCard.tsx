import React from 'react';
import type { UserMemoItem, MemoColor } from '@/types/memo';
import { MarkdownViewer } from '@/components/common/MarkdownViewer';
import { Pin, Trash2, Edit3, ExternalLink } from 'lucide-react';
import { formatDateOnly } from '@/utils/dateUtils';

export interface MemoCardProps {
  memo: UserMemoItem;
  onEdit: (memo: UserMemoItem) => void;
  onDelete: (memoId: string) => void;
  onTogglePin: (memoId: string) => void;
  onSelectIssue?: (issueId: number) => void;
}

const COLOR_MAP: Record<MemoColor, { bg: string; border: string; accent: string; header: string }> = {
  yellow: {
    bg: 'rgba(234, 179, 8, 0.08)',
    border: 'rgba(234, 179, 8, 0.35)',
    accent: '#eab308',
    header: 'rgba(234, 179, 8, 0.2)',
  },
  blue: {
    bg: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.35)',
    accent: '#3b82f6',
    header: 'rgba(59, 130, 246, 0.2)',
  },
  green: {
    bg: 'rgba(34, 197, 94, 0.08)',
    border: 'rgba(34, 197, 94, 0.35)',
    accent: '#22c55e',
    header: 'rgba(34, 197, 94, 0.2)',
  },
  pink: {
    bg: 'rgba(236, 72, 153, 0.08)',
    border: 'rgba(236, 72, 153, 0.35)',
    accent: '#ec4899',
    header: 'rgba(236, 72, 153, 0.2)',
  },
  purple: {
    bg: 'rgba(168, 85, 247, 0.08)',
    border: 'rgba(168, 85, 247, 0.35)',
    accent: '#a855f7',
    header: 'rgba(168, 85, 247, 0.2)',
  },
};

export const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  onEdit,
  onDelete,
  onTogglePin,
  onSelectIssue,
}) => {
  const theme = COLOR_MAP[memo.color] || COLOR_MAP.yellow;

  return (
    <div
      onClick={() => onEdit(memo)}
      style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 'var(--radius-sm, 6px)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        boxShadow: memo.isPinned ? `0 2px 12px ${theme.accent}33` : '0 2px 6px rgba(0,0,0,0.2)',
        position: 'relative',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 16px ${theme.accent}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = memo.isPinned ? `0 2px 12px ${theme.accent}33` : '0 2px 6px rgba(0,0,0,0.2)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(memo.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: memo.isPinned ? '#eab308' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={memo.isPinned ? '고정 해제' : '상단 고정'}
          >
            <Pin size={13} fill={memo.isPinned ? '#eab308' : 'none'} />
          </button>

          {memo.issueId ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectIssue) onSelectIssue(memo.issueId!);
              }}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--primary)',
                background: 'rgba(0, 122, 204, 0.15)',
                padding: '1px 6px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="연동된 이슈 바로가기"
            >
              #{memo.issueId} <ExternalLink size={10} />
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              단독 메모
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(memo);
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            title="확대 편집"
          >
            <Edit3 size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('이 메모를 영구 삭제하시겠습니까?')) {
                onDelete(memo.id);
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
            title="삭제"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div
        style={{
          fontSize: '0.8rem',
          lineHeight: 1.45,
          color: 'var(--text-bright)',
          maxHeight: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 7,
          WebkitBoxOrient: 'vertical',
        }}
      >
        <MarkdownViewer
          content={memo.content}
          placeholder="내용이 없는 빈 메모입니다."
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0',
            fontSize: '0.78rem',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '6px',
          marginTop: 'auto',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
        }}
      >
        <span>{formatDateOnly(memo.updatedAt)}</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.accent }} />
      </div>
    </div>
  );
};
