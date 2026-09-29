import React, { useState, useEffect } from 'react';
import { ModalWrapper } from '@/components/common/ModalWrapper';
import { MarkdownViewer } from '@/components/common/MarkdownViewer';
import { useMemoStore } from '@/stores/useMemoStore';
import type { MemoColor } from '@/types/memo';
import { Pin, Trash2, CheckCircle, ExternalLink } from 'lucide-react';

export interface MemoEditorModalProps {
  isOpen: boolean;
  memoId: string | null;
  onClose: () => void;
  onSelectIssue?: (issueId: number) => void;
}

const COLOR_OPTIONS: MemoColor[] = ['yellow', 'blue', 'green', 'pink', 'purple'];
const COLOR_HEX: Record<MemoColor, string> = {
  yellow: '#eab308',
  blue: '#3b82f6',
  green: '#22c55e',
  pink: '#ec4899',
  purple: '#a855f7',
};

export const MemoEditorModal: React.FC<MemoEditorModalProps> = ({
  isOpen,
  memoId,
  onClose,
  onSelectIssue,
}) => {
  const memos = useMemoStore((s) => s.memos);
  const updateMemo = useMemoStore((s) => s.updateMemo);
  const deleteMemo = useMemoStore((s) => s.deleteMemo);
  const flushDebouncedSave = useMemoStore((s) => s.flushDebouncedSave);
  const isSaving = useMemoStore((s) => s.isSaving);

  const targetMemo = memos.find((m) => m.id === memoId);

  const [content, setContent] = useState<string>('');
  const [color, setColor] = useState<MemoColor>('yellow');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    if (targetMemo) {
      setContent(targetMemo.content || '');
      setColor(targetMemo.color || 'yellow');
      setIsPinned(targetMemo.isPinned || false);
    }
  }, [targetMemo?.id]);

  if (!isOpen || !targetMemo) return null;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    updateMemo(targetMemo.id, { content: val });
  };

  const handleColorChange = (c: MemoColor) => {
    setColor(c);
    updateMemo(targetMemo.id, { color: c });
  };

  const handleTogglePin = () => {
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    updateMemo(targetMemo.id, { isPinned: nextPin });
  };

  const handleClose = () => {
    flushDebouncedSave();
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('이 메모를 삭제하시겠습니까?')) {
      deleteMemo(targetMemo.id);
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLOR_HEX[color] }} />
          <span>개인 포스트잇 메모</span>
          {targetMemo.issueId && (
            <span
              onClick={() => {
                if (onSelectIssue && targetMemo.issueId) {
                  handleClose();
                  onSelectIssue(targetMemo.issueId);
                }
              }}
              style={{
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--primary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
              title="연동 이슈 열기"
            >
              (이슈 #{targetMemo.issueId} <ExternalLink size={11} />)
            </span>
          )}
        </div>
      }
      maxWidth="780px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>테마 색상:</span>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleColorChange(c)}
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: COLOR_HEX[c],
                  border: color === c ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  transform: color === c ? 'scale(1.2)' : 'none',
                  transition: 'transform 0.15s ease',
                  padding: 0,
                }}
                title={c}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleTogglePin}
              className={`btn btn-sm ${isPinned ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.72rem', height: '24px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Pin size={11} fill={isPinned ? 'currentColor' : 'none'} />
              {isPinned ? '고정됨' : '상단 고정'}
            </button>

            <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setViewMode('write')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  border: 'none',
                  background: viewMode === 'write' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'write' ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '3px 0 0 3px',
                  cursor: 'pointer',
                }}
              >
                편집기
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.72rem',
                  border: 'none',
                  background: viewMode === 'preview' ? 'var(--primary)' : 'transparent',
                  color: viewMode === 'preview' ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '0 3px 3px 0',
                  cursor: 'pointer',
                }}
              >
                미리보기
              </button>
            </div>
          </div>
        </div>

        <div style={{ minHeight: '280px', maxHeight: '55vh', overflowY: 'auto', overflowX: 'auto' }}>
          {viewMode === 'write' ? (
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="마크다운 형식으로 자유롭게 메모를 작성하세요...&#10;- 체크리스트: [ ] 할 일&#10;- 강조: **굵게**, *기울임*&#10;- 코드: `코드`"
              style={{
                width: '100%',
                minHeight: '280px',
                height: '100%',
                padding: '12px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: '4px',
                color: 'var(--text-bright)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div style={{ padding: '6px', background: 'var(--bg-subtle)', borderRadius: '4px', minHeight: '280px' }}>
              <MarkdownViewer content={content} placeholder="작성된 내용이 없습니다." />
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {isSaving ? (
              <span>저장 중...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#4ec9b0' }}>
                <CheckCircle size={12} /> 실시간 자동 저장됨
              </span>
            )}
            <span>• 글자 수: {content.length}자</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger btn-sm"
              style={{ fontSize: '0.74rem', height: '26px' }}
            >
              <Trash2 size={12} style={{ marginRight: '4px' }} /> 삭제
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-primary btn-sm"
              style={{ fontSize: '0.74rem', height: '26px' }}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
};
