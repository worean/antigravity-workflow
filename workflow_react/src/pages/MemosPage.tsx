import React, { useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMemoStore } from '@/stores/useMemoStore';
import { MemoFilterBar, MemoGrid, MemoEditorModal } from '@/components/memos';
import { StickyNote, Lock } from 'lucide-react';

interface MemosPageProps {
  onOpenAuth?: () => void;
  onSelectIssue?: (issueId: number) => void;
}

export const MemosPage: React.FC<MemosPageProps> = ({
  onOpenAuth,
  onSelectIssue,
}) => {
  const { user, isAuthenticated } = useAuth();

  const memos = useMemoStore((s) => s.memos);
  const activeMemoId = useMemoStore((s) => s.activeMemoId);
  const filter = useMemoStore((s) => s.filter);
  const initUserMemos = useMemoStore((s) => s.initUserMemos);
  const setActiveMemoId = useMemoStore((s) => s.setActiveMemoId);
  const setFilter = useMemoStore((s) => s.setFilter);
  const createMemo = useMemoStore((s) => s.createMemo);
  const deleteMemo = useMemoStore((s) => s.deleteMemo);
  const togglePin = useMemoStore((s) => s.togglePin);

  useEffect(() => {
    if (user?.id) {
      initUserMemos(user.id);
    }
  }, [user?.id, initUserMemos]);

  const filteredMemos = useMemo(() => {
    return memos.filter((m) => {
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const contentMatch = m.content.toLowerCase().includes(query);
        const issueMatch = m.issueId ? String(m.issueId).includes(query) : false;
        if (!contentMatch && !issueMatch) return false;
      }

      if (filter.issueFilter === 'ISSUE_ONLY' && !m.issueId) return false;
      if (filter.issueFilter === 'STANDALONE' && m.issueId) return false;

      if (filter.color !== 'ALL' && m.color !== filter.color) return false;

      return true;
    });
  }, [memos, filter]);

  const handleNewMemo = () => {
    if (!isAuthenticated || !user?.id) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    createMemo(user.id, {
      content: '',
      color: 'yellow',
      isPinned: false,
    });
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
        <Lock size={48} style={{ opacity: 0.3, marginBottom: '14px' }} />
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-bright)', marginBottom: '6px' }}>
          개인 메모 기능은 로그인 후 이용 가능합니다
        </h3>
        <p style={{ fontSize: '0.82rem', maxWidth: '360px', marginBottom: '16px', lineHeight: 1.5 }}>
          나만의 작업 힌트와 비공개 체크리스트를 안전하게 보관하세요. 다른 팀원에게는 전혀 노출되지 않습니다.
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
            개인 메모 (Personal Memos)
          </h1>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            작업자 본인만 열람할 수 있는 비공개 포스트잇 메모입니다. 칸반, 스프린트, WBS 이슈에도 연동됩니다.
          </p>
        </div>
      </div>

      <MemoFilterBar
        search={filter.search}
        issueFilter={filter.issueFilter}
        selectedColor={filter.color}
        onSearchChange={(search) => setFilter({ search })}
        onIssueFilterChange={(issueFilter) => setFilter({ issueFilter })}
        onColorChange={(color) => setFilter({ color })}
        totalCount={memos.length}
        filteredCount={filteredMemos.length}
        onNewMemo={handleNewMemo}
      />

      <MemoGrid
        memos={filteredMemos}
        onEdit={(m) => setActiveMemoId(m.id)}
        onDelete={(id) => deleteMemo(id)}
        onTogglePin={(id) => togglePin(id)}
        onSelectIssue={onSelectIssue}
        onNewMemo={handleNewMemo}
      />

      <MemoEditorModal
        isOpen={!!activeMemoId}
        memoId={activeMemoId}
        onClose={() => setActiveMemoId(null)}
        onSelectIssue={onSelectIssue}
      />
    </div>
  );
};
