﻿import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMemos, useCreateMemo, useDeleteMemo } from '@/api/memo';
import { safeStorage } from '@/utils/safeStorage';
import { Spinner, Button } from '@/components/common';
import { Plus, Trash2, Calendar, FileText } from 'lucide-react';
import { formatDateOnly } from '@/utils/dateUtils';
import type { MemoDto } from '@/types/memo';

interface LocalQuickMemo {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

const LOCAL_MEMO_KEY = 'dashboard_quick_memos';

export const MemoWidget: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expandedMemoId, setExpandedMemoId] = useState<number | null>(null);

  // 1. Server Memos (로그인 사용자용)
  const { data: serverMemos = [], isLoading: isServerLoading } = useMemos(
    { filter: 'all' },
    { enabled: isAuthenticated }
  );
  const createMemoMutation = useCreateMemo();
  const deleteMemoMutation = useDeleteMemo();

  // 2. Local Memos (비로그인 사용자 fallback)
  const [localMemos, setLocalMemos] = useState<LocalQuickMemo[]>(() => {
    return safeStorage.getItem<LocalQuickMemo[]>(LOCAL_MEMO_KEY, []);
  });

  const saveLocalMemos = (nextList: LocalQuickMemo[]) => {
    setLocalMemos(nextList);
    safeStorage.setItem(LOCAL_MEMO_KEY, nextList);
  };

  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    if (isAuthenticated) {
      try {
        await createMemoMutation.mutateAsync({
          title: trimmedTitle,
          content: content.trim(),
          isPublic: false,
        });
        setTitle('');
        setContent('');
      } catch (err) {
        console.error('Failed to create server memo:', err);
      }
    } else {
      const newMemo: LocalQuickMemo = {
        id: Date.now(),
        title: trimmedTitle,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      saveLocalMemos([newMemo, ...localMemos]);
      setTitle('');
      setContent('');
    }
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (isAuthenticated) {
      try {
        await deleteMemoMutation.mutateAsync(memoId);
      } catch (err) {
        console.error('Failed to delete server memo:', err);
      }
    } else {
      saveLocalMemos(localMemos.filter((m) => m.id !== memoId));
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedMemoId((prev) => (prev === id ? null : id));
  };

  if (isAuthenticated && isServerLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
        <Spinner centered label="메모 데이터를 불러오는 중..." />
      </div>
    );
  }

  const memoList = isAuthenticated
    ? serverMemos.map((m: MemoDto) => ({
        id: m.id,
        title: m.title,
        content: m.content || '',
        createdAt: m.createdAt,
      }))
    : localMemos;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '220px',
        padding: '10px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-xs)',
        overflow: 'hidden',
        gap: '10px',
      }}
    >
      {/* 1. Quick Add Form */}
      <form
        onSubmit={handleAddMemo}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: 'var(--bg-subtle)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            placeholder="새 메모 제목을 입력하세요..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              background: 'var(--bg-card)',
              color: 'var(--text-bright)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '5px 8px',
              fontSize: '0.78rem',
              outline: 'none',
            }}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!title.trim() || createMemoMutation.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.74rem',
              padding: '0 10px',
              height: '28px',
              flexShrink: 0,
            }}
          >
            <Plus size={13} /> 추가
          </Button>
        </div>

        <textarea
          placeholder="메모 상세 내용 (선택사항)..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-xs)',
            padding: '5px 8px',
            fontSize: '0.74rem',
            resize: 'none',
            outline: 'none',
          }}
        />
      </form>

      {/* 2. Memo List Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          paddingRight: '2px',
        }}
      >
        {memoList.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: '120px',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              textAlign: 'center',
              gap: '4px',
            }}
          >
            <FileText size={24} style={{ opacity: 0.5, marginBottom: '2px' }} />
            <span>등록된 메모가 없습니다.</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
              상단 입력창을 통해 업무 아이디어나 메모를 남겨보세요.
            </span>
          </div>
        ) : (
          memoList.map((memo) => {
            const isExpanded = expandedMemoId === memo.id;
            return (
              <div
                key={memo.id}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'background 0.12s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: memo.content ? 'pointer' : 'default',
                  }}
                  onClick={() => memo.content && toggleExpand(memo.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <FileText size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-bright)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {memo.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <Calendar size={10} />
                      {formatDateOnly(memo.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMemo(memo.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '3px',
                      }}
                      title="메모 삭제"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#f14c4c')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Content preview or expanded */}
                {memo.content && (
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-sub)',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      marginTop: '2px',
                      paddingTop: '4px',
                      borderTop: '1px dashed var(--border-divider)',
                      maxHeight: isExpanded ? 'none' : '42px',
                      overflow: 'hidden',
                      textOverflow: isExpanded ? 'unset' : 'ellipsis',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(memo.id)}
                    title={isExpanded ? '접기' : '더보기'}
                  >
                    {memo.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
