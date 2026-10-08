import React from 'react';
import { Globe, Lock, Paperclip, Calendar, User, Edit3, Trash2 } from 'lucide-react';
import type { MemoDto } from '@/types/memo';
import { useAuth } from '@/context/AuthContext';
import { renderTextWithMemoMentions } from './MemoMentionLink';

export interface MemoCardProps {
  memo: MemoDto;
  onClick: (memo: MemoDto) => void;
  onEdit?: (memoId: number) => void;
  onDelete?: (memoId: number) => void;
}

export const MemoCard: React.FC<MemoCardProps> = ({
  memo,
  onClick,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuth();
  const isAuthor = user?.id && memo.authorId === user.id;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(memo.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(memo.id);
  };

  return (
    <div
      onClick={() => onClick(memo)}
      style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: '10px',
        border: '1px solid var(--border-light)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        minHeight: '160px',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      <div>
        {/* 상단 뱃지 & 액션 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: memo.isPublic ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
              color: memo.isPublic ? 'var(--status-done, #22c55e)' : 'var(--status-todo, #eab308)',
            }}
          >
            {memo.isPublic ? <Globe size={11} /> : <Lock size={11} />}
            {memo.isPublic ? '공개' : '비공개'}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {memo.attachments && memo.attachments.length > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
                title={`첨부파일 ${memo.attachments.length}개`}
              >
                <Paperclip size={11} />
                {memo.attachments.length}
              </span>
            )}

            {isAuthor && (
              <>
                <button
                  type="button"
                  onClick={handleEdit}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '3px',
                    borderRadius: '4px',
                  }}
                  title="수정"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--status-urgent, #ef4444)',
                    cursor: 'pointer',
                    padding: '3px',
                    borderRadius: '4px',
                  }}
                  title="삭제"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 제목 */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '0.98rem',
            fontWeight: 700,
            color: 'var(--text-bright)',
            lineHeight: 1.35,
          }}
        >
          {memo.title}
        </h3>

        {/* 본문 미리보기 (최대 3줄) */}
        <div
          style={{
            fontSize: '0.84rem',
            lineHeight: 1.5,
            color: 'var(--text-main)',
            opacity: 0.85,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {renderTextWithMemoMentions(memo.content || '(내용 없음)')}
        </div>
      </div>

      {/* 하단 푸터 (작성자 & 날짜) */}
      <div
        style={{
          marginTop: '14px',
          paddingTop: '10px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} />
          {memo.author?.name || memo.author?.email?.split('@')[0] || '작성자'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} />
          {new Date(memo.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};
