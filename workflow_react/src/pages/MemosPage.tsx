import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMemos, useDeleteMemo } from '@/api/memo';
import { useUIStore } from '@/stores/useUIStore';
import type { MemoFilterType, MemoDto } from '@/types/memo';
import { MemoFilterBar, MemoGrid } from '@/components/memos';
import { StickyNote, Lock } from 'lucide-react';

interface MemosPageProps {
  onOpenAuth?: () => void;
  onSelectIssue?: (issueId: number) => void;
}

export const MemosPage: React.FC<MemosPageProps> = ({ onOpenAuth }) => {
  const { isAuthenticated } = useAuth();
  const showToast = useUIStore((s) => s.showToast);
  const openMemoDetail = useUIStore((s) => s.openMemoDetail);
  const openMemoEditor = useUIStore((s) => s.openMemoEditor);
  const deleteMutation = useDeleteMemo();

  // 검색 및 필터 상태
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemoFilterType>('all');

  // TanStack Query 백엔드 API 연동
  const { data: memos = [], isLoading } = useMemos(
    {
      search: search.trim() || undefined,
      filter,
      workspaceId: 1,
    },
    { enabled: isAuthenticated }
  );

  const handleNewMemo = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    openMemoEditor(null);
  };

  const handleEditMemo = (memoId: number) => {
    openMemoEditor(memoId);
  };

  const handleDeleteMemo = async (memoId: number) => {
    if (!window.confirm('정말 이 메모를 삭제하시겠습니까?')) return;
    try {
      await deleteMutation.mutateAsync(memoId);
      showToast('메모가 삭제되었습니다.', 'success');
    } catch (err: any) {
      showToast(err.message || '메모 삭제에 실패했습니다.', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '40px',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        <Lock size={48} style={{ opacity: 0.35, marginBottom: '14px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-bright)', marginBottom: '6px' }}>
          워크스페이스 공유 메모장은 로그인 후 이용 가능합니다
        </h3>
        <p style={{ fontSize: '0.82rem', maxWidth: '380px', marginBottom: '16px', lineHeight: 1.5 }}>
          팀원들과 지식을 공유하거나 나만의 비공개 노트를 안전하게 보관하세요.
        </p>
        {onOpenAuth && (
          <button type="button" onClick={onOpenAuth} className="btn btn-primary">
            로그인하기
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-bright)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0,
            }}
          >
            <StickyNote size={20} color="var(--primary)" />
            공유 메모장 (Shared Memos)
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            워크스페이스 공개 메모 및 나만의 비공개 노트를 관리합니다. 5MB 첨부파일과 <code>@메모제목</code> 링크를 지원합니다.
          </p>
        </div>
      </div>

      <MemoFilterBar
        search={search}
        filter={filter}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onNewMemo={handleNewMemo}
        totalCount={memos.length}
      />

      <MemoGrid
        memos={memos}
        isLoading={isLoading}
        onSelectMemo={(memo: MemoDto) => openMemoDetail(memo.id)}
        onEditMemo={handleEditMemo}
        onDeleteMemo={handleDeleteMemo}
        onNewMemo={handleNewMemo}
      />
    </div>
  );
};
