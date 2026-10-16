import React, { useState } from 'react';
import { CheckSquare, Clock, GitCommit, Trash2, Loader2 } from 'lucide-react';
import type { Worklog, User } from '@/types';
import { UserBadge } from '@/components/common';
import { formatWorklogTime } from '@/utils/worklogUtils';
import {
  useLinkCommitToWorklog,
  useUnlinkCommitFromWorklog,
  useRepoMappings,
} from '@/api/gitPlugin';
import { GitCommitDetailModal } from '@/components/plugins/git/GitCommitDetailModal';
import { GitCommitPickerModal } from '@/components/plugins/git/GitCommitPickerModal';

interface WorklogListItemProps {
  worklog: Worklog;
  currentUser: User | null;
}

export const WorklogListItem: React.FC<WorklogListItemProps> = ({ worklog, currentUser }) => {
  const [showCommitDetail, setShowCommitDetail] = useState(false);
  const [showCommitPicker, setShowCommitPicker] = useState(false);

  const linkMutation = useLinkCommitToWorklog();
  const unlinkMutation = useUnlinkCommitFromWorklog();

  const projectId = worklog.issue?.projectId;
  const { data: mappings = [] } = useRepoMappings(projectId);

  const canEdit = currentUser?.id === worklog.userId || currentUser?.role === 'ADMIN';
  const gitCommit = worklog.gitCommit;

  const handleSelectCommit = async (commitData: {
    repoMappingId: number;
    commitHash: string;
    message: string;
    authorName: string;
    authorEmail?: string;
    committedAt?: string;
  }) => {
    await linkMutation.mutateAsync({
      worklogId: worklog.id,
      ...commitData,
    });
  };

  const handleUnlink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 작업로그에서 Git 커밋 연결을 해제하시겠습니까?')) {
      await unlinkMutation.mutateAsync(worklog.id);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 'var(--radius-xs)',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border-light)',
        fontSize: '0.78rem',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <CheckSquare size={13} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: 'var(--text-bright)', whiteSpace: 'nowrap' }}>
          #{worklog.issueId} {worklog.issue?.title ? `- ${worklog.issue.title}` : ''}
        </span>
        <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
          {worklog.description ? `| ${worklog.description}` : ''}
        </span>

        {/* ⭐️ 작업로그 연결된 1개 Git 커밋 뱃지 */}
        {gitCommit ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowCommitDetail(true)}
              title={`커밋 수정사항 확인: ${gitCommit.commitHash}\n${gitCommit.message}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(0, 122, 204, 0.12)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--accent-cyan)',
                fontSize: '11px',
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              <GitCommit size={11} />
              <span>{gitCommit.commitHash.slice(0, 7)}</span>
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {gitCommit.message}
              </span>
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleUnlink}
                disabled={unlinkMutation.isPending}
                title="커밋 연결 해제"
                style={{
                  padding: '2px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-rose)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {unlinkMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
              </button>
            )}
          </div>
        ) : (
          canEdit && mappings.length > 0 && (
            <button
              type="button"
              onClick={() => setShowCommitPicker(true)}
              title="이 작업로그에 Git 커밋 1개 연결"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '1px 6px',
                backgroundColor: 'var(--bg-input)',
                border: '1px dashed var(--border-light)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-muted)',
                fontSize: '10px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              <GitCommit size={10} />
              <span>커밋 연결</span>
            </button>
          )
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary)' }}>
          <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
          {formatWorklogTime(worklog.timeSpent)}
        </div>
        <UserBadge user={worklog.user} currentUserId={currentUser?.id} size="sm" />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {new Date(worklog.createdAt).toLocaleDateString('ko-KR')}
        </span>
      </div>

      {/* 커밋 상세 Diff 모달 */}
      {gitCommit && (
        <GitCommitDetailModal
          isOpen={showCommitDetail}
          onClose={() => setShowCommitDetail(false)}
          repoMappingId={gitCommit.repoMappingId}
          commitHash={gitCommit.commitHash}
          repoIdentifier={gitCommit.repoMapping?.repoIdentifier}
        />
      )}

      {/* 커밋 선택 모달 (작업로그 1:1 연결) */}
      <GitCommitPickerModal
        isOpen={showCommitPicker}
        onClose={() => setShowCommitPicker(false)}
        title={`작업로그 #${worklog.id}에 Git 커밋 연결`}
        availableRepositories={mappings}
        onSelectCommit={handleSelectCommit}
      />
    </div>
  );
};