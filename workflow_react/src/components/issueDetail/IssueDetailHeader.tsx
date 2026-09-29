import React from 'react';
import {
  ArrowLeft,
  Columns,
  Heart,
  Edit3,
  Trash2,
  Lock,
  StickyNote,
} from 'lucide-react';
import type { Issue } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useMemoStore } from '@/stores/useMemoStore';

interface IssueDetailHeaderProps {
  issue: Issue | null;
  projectId?: number | null;
  onBack: () => void;
  onGoToList?: () => void;
  isAuthenticated: boolean;
  isLiked: boolean;
  likesCount: number;
  handleLike: () => Promise<void>;
  isEditing: boolean;
  toggleEditing: (targetEditing?: boolean) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  onOpenAuth?: () => void;
}

export const IssueDetailHeader: React.FC<IssueDetailHeaderProps> = ({
  issue,
  projectId,
  onBack,
  onGoToList,
  isAuthenticated,
  isLiked,
  likesCount,
  handleLike,
  isEditing,
  toggleEditing,
  setShowDeleteConfirm,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const memos = useMemoStore((s) => s.memos);
  const currentMemo = React.useMemo(() => (issue ? memos.find((m) => m.issueId === issue.id) : undefined), [memos, issue?.id]);
  const createMemo = useMemoStore((s) => s.createMemo);
  const setActiveMemoId = useMemoStore((s) => s.setActiveMemoId);

  const handleOpenMemo = () => {
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!issue) return;
    if (currentMemo) {
      setActiveMemoId(currentMemo.id);
    } else {
      const created = createMemo(user?.id || 1, { issueId: issue.id, color: 'yellow', content: '' });
      setActiveMemoId(created.id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '6px',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onBack}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ArrowLeft size={13} /> 이전
        </button>

        {onGoToList && (
          <button
            onClick={onGoToList}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Columns size={13} /> 이슈 목록
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>프로젝트: <strong>{issue?.project?.name || `#${projectId || issue?.projectId}`}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Like Button */}
        <button
          onClick={handleLike}
          className="btn btn-secondary btn-sm"
          style={{
            color: isLiked ? '#f43f5e' : 'var(--text-sub)',
            borderColor: isLiked ? 'rgba(244, 63, 94, 0.4)' : undefined,
            background: isLiked ? 'rgba(244, 63, 94, 0.1)' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={isAuthenticated ? '좋아요' : '로그인 후 좋아요 가능'}
        >
          <Heart size={13} fill={isLiked ? '#f43f5e' : 'none'} />
          <span>{likesCount}</span>
        </button>

        {/* Edit / View Mode Toggle Button */}
        {isAuthenticated ? (
          <button
            onClick={() => toggleEditing(!isEditing)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit3 size={13} /> {isEditing ? '읽기 모드' : '수정'}
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            title="로그인하여 이슈를 수정하세요"
          >
            <Lock size={13} /> 로그인 후 수정
          </button>
        )}

        {/* Private Memo Button */}
        <button
          type="button"
          onClick={handleOpenMemo}
          className="btn btn-secondary btn-sm"
          style={{
            color: currentMemo ? '#eab308' : 'var(--text-sub)',
            borderColor: currentMemo ? 'rgba(234, 179, 8, 0.4)' : undefined,
            background: currentMemo ? 'rgba(234, 179, 8, 0.12)' : undefined,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={currentMemo ? '내 개인 메모 확인/편집' : '이 이슈에 개인 메모 작성'}
        >
          <StickyNote size={13} fill={currentMemo ? '#eab308' : 'none'} />
          <span>{currentMemo ? '내 메모' : '메모 추가'}</span>
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-secondary btn-sm"
            style={{ color: '#f14c4c', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={13} /> 삭제
          </button>
        )}
      </div>
    </div>
  );
};