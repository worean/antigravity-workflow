import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMemoStore } from '@/stores/useMemoStore';
import { MemoQuickAdd } from './MemoQuickAdd';
import { MarkdownViewer } from '@/components/common/MarkdownViewer';
import { StickyNote, Plus, Edit3, Trash2, Pin } from 'lucide-react';

export interface IssueMemoSectionProps {
  issueId: number;
  onOpenAuth?: () => void;
}

export const IssueMemoSection: React.FC<IssueMemoSectionProps> = ({
  issueId,
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const memos = useMemoStore((s) => s.memos);
  const currentMemo = React.useMemo(() => memos.find((m) => m.issueId === issueId), [memos, issueId]);
  const deleteMemo = useMemoStore((s) => s.deleteMemo);
  const togglePin = useMemoStore((s) => s.togglePin);
  const setActiveMemoId = useMemoStore((s) => s.setActiveMemoId);

  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <div
      style={{
        background: currentMemo ? 'rgba(234, 179, 8, 0.08)' : 'rgba(255, 255, 255, 0.02)',
        border: currentMemo ? '1px solid rgba(234, 179, 8, 0.35)' : '1px dashed #3c3c3c',
        borderRadius: 'var(--radius-xs, 4px)',
        padding: '10px 12px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: currentMemo || showQuickAdd ? '8px' : '0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <StickyNote size={14} color="#eab308" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            내 개인 메모 (Private Memo)
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            - 오직 나에게만 보이는 비공개 작업 노트
          </span>
        </div>

        {isAuthenticated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {currentMemo ? (
              <>
                <button
                  type="button"
                  onClick={() => togglePin(currentMemo.id)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.7rem',
                    height: '22px',
                    padding: '0 6px',
                    color: currentMemo.isPinned ? '#eab308' : 'var(--text-muted)',
                  }}
                  title={currentMemo.isPinned ? '상단 고정 해제' : '상단 고정'}
                >
                  <Pin size={11} fill={currentMemo.isPinned ? '#eab308' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMemoId(currentMemo.id)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.7rem',
                    height: '22px',
                    padding: '0 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                  title="전체 화면으로 확대하여 편집"
                >
                  <Edit3 size={11} /> 확대 편집
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('이 개인 메모를 삭제하시겠습니까?')) {
                      deleteMemo(currentMemo.id);
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.7rem', height: '22px', padding: '0 6px', color: '#f14c4c' }}
                  title="메모 삭제"
                >
                  <Trash2 size={11} />
                </button>
              </>
            ) : !showQuickAdd ? (
              <button
                type="button"
                onClick={() => setShowQuickAdd(true)}
                className="btn btn-primary btn-sm"
                style={{
                  fontSize: '0.7rem',
                  height: '22px',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Plus size={11} /> 메모 작성
              </button>
            ) : null}
          </div>
        )}
      </div>

      {currentMemo ? (
        <div
          onClick={() => setActiveMemoId(currentMemo.id)}
          style={{
            cursor: 'pointer',
            padding: '8px 10px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.8rem',
            color: 'var(--text-bright)',
          }}
          title="클릭하여 확대 편집"
        >
          <MarkdownViewer
            content={currentMemo.content}
            placeholder="내용이 없는 빈 메모입니다. 클릭하여 작성하세요."
            style={{ background: 'transparent', padding: 0, fontSize: '0.78rem' }}
          />
        </div>
      ) : showQuickAdd ? (
        <MemoQuickAdd
          issueId={issueId}
          onSuccess={() => setShowQuickAdd(false)}
          onCancel={() => setShowQuickAdd(false)}
          placeholder="이 이슈에 대한 개인 작업 힌트나 체크리스트를 메모하세요..."
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            이 이슈에 작성된 개인 메모가 없습니다.
          </span>
          {!isAuthenticated && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem', height: '22px' }}
            >
              로그인 후 작성
            </button>
          )}
        </div>
      )}
    </div>
  );
};
