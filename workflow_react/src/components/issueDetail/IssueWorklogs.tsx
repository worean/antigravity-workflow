import React, { useState } from 'react';
import { Clock, Plus, GitCommit, Trash2, Loader2 } from 'lucide-react';
import type { Worklog } from '@/types';
import { Avatar } from '@/components/common';
import { formatWorklogTime } from '@/utils/worklogUtils';
import {
  useLinkCommitToWorklog,
  useUnlinkCommitFromWorklog,
  useRepoMappings,
} from '@/api/gitPlugin';
import { GitCommitDetailModal } from '@/components/plugins/git/GitCommitDetailModal';
import { GitCommitPickerModal } from '@/components/plugins/git/GitCommitPickerModal';

interface IssueWorklogsProps {
  worklogs: Worklog[];
  isAuthenticated: boolean;
  showWorklogForm: boolean;
  setShowWorklogForm: (show: boolean) => void;
  worklogHoursInput: string;
  setWorklogHoursInput: (hours: string) => void;
  worklogDescInput: string;
  setWorklogDescInput: (desc: string) => void;
  isLoggingWork: boolean;
  handleCreateWorklog: (e: React.FormEvent) => Promise<void>;
  currentUserId?: number;
  projectId?: number;
}

export const IssueWorklogs: React.FC<IssueWorklogsProps> = ({
  worklogs,
  isAuthenticated,
  showWorklogForm,
  setShowWorklogForm,
  worklogHoursInput,
  setWorklogHoursInput,
  worklogDescInput,
  setWorklogDescInput,
  isLoggingWork,
  handleCreateWorklog,
  currentUserId,
  projectId,
}) => {
  const [selectedCommitForDetail, setSelectedCommitForDetail] = useState<{
    repoMappingId: number;
    commitHash: string;
    repoIdentifier?: string;
  } | null>(null);
  const [selectedWorklogForPicker, setSelectedWorklogForPicker] = useState<Worklog | null>(null);

  const linkMutation = useLinkCommitToWorklog();
  const unlinkMutation = useUnlinkCommitFromWorklog();

  const effectiveProjectId = projectId || worklogs[0]?.issue?.projectId;
  const { data: mappings = [] } = useRepoMappings(effectiveProjectId);

  const totalSpentMinutes = worklogs.reduce((acc, curr) => acc + Number(curr.timeSpent || 0), 0);

  const handleSelectCommit = async (commitData: {
    repoMappingId: number;
    commitHash: string;
    message: string;
    authorName: string;
    authorEmail?: string;
    committedAt?: string;
  }) => {
    if (!selectedWorklogForPicker) return;
    await linkMutation.mutateAsync({
      worklogId: selectedWorklogForPicker.id,
      ...commitData,
    });
    setSelectedWorklogForPicker(null);
  };

  const handleUnlink = async (e: React.MouseEvent, worklogId: number) => {
    e.stopPropagation();
    if (confirm('이 작업로그에서 Git 커밋 연결을 해제하시겠습니까?')) {
      await unlinkMutation.mutateAsync(worklogId);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '12px 14px', marginTop: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={15} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-bright)' }}>
            작업 시간 기록 (Worklogs)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.15)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
            총 {formatWorklogTime(totalSpentMinutes)}
          </span>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowWorklogForm(!showWorklogForm)}
            style={{ fontSize: '0.7rem', height: '22px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={11} /> {showWorklogForm ? '입력 닫기' : '작업 시간 등록'}
          </button>
        )}
      </div>

      {showWorklogForm && (
        <form onSubmit={handleCreateWorklog} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', padding: '8px 10px', borderRadius: 'var(--radius-xs)', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: '6px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>소요 시간 (시간) *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="24"
                className="input-field"
                style={{ height: '26px', fontSize: '0.75rem' }}
                value={worklogHoursInput}
                onChange={(e) => setWorklogHoursInput(e.target.value)}
                placeholder="예: 1.5"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>작업 내용 / 비고 (선택)</label>
              <input
                type="text"
                className="input-field"
                style={{ height: '26px', fontSize: '0.75rem' }}
                value={worklogDescInput}
                onChange={(e) => setWorklogDescInput(e.target.value)}
                placeholder="어떤 작업을 진행했는지 간단히 입력하세요"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: '26px', fontSize: '0.72rem' }}
              disabled={isLoggingWork}
            >
              {isLoggingWork ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      )}

      {worklogs.length === 0 ? (
        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          기록된 작업 시간이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {worklogs.map((w) => {
            const gitCommit = w.gitCommit;
            const canEdit = isAuthenticated && (currentUserId === w.userId);

            return (
              <div
                key={w.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '2px',
                  fontSize: '0.75rem',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <Avatar user={w.user} name={w.user?.name || ''} size={20} shape="circle" />
                  <span style={{ fontWeight: 600, color: 'var(--text-bright)', flexShrink: 0 }}>{w.user?.name || '사용자'}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', flexShrink: 0 }}>+{formatWorklogTime(w.timeSpent)}</span>
                  {w.description && (
                    <span style={{ color: 'var(--text-sub)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      - {w.description}
                    </span>
                  )}

                  {/* ⭐️ 작업로그 연결된 1개 Git 커밋 뱃지 */}
                  {gitCommit ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setSelectedCommitForDetail({
                          repoMappingId: gitCommit.repoMappingId,
                          commitHash: gitCommit.commitHash,
                          repoIdentifier: gitCommit.repoMapping?.repoIdentifier,
                        })}
                        title={`커밋 수정사항 확인: ${gitCommit.commitHash}\n${gitCommit.message}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 5px',
                          backgroundColor: 'rgba(0, 122, 204, 0.12)',
                          border: '1px solid var(--primary)',
                          borderRadius: 'var(--radius-xs)',
                          color: 'var(--accent-cyan)',
                          fontSize: '10.5px',
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                        }}
                      >
                        <GitCommit size={10} />
                        <span>{gitCommit.commitHash.slice(0, 7)}</span>
                        <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {gitCommit.message}
                        </span>
                      </button>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={(e) => handleUnlink(e, w.id)}
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
                          {unlinkMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                        </button>
                      )}
                    </div>
                  ) : (
                    canEdit && mappings.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedWorklogForPicker(w)}
                        title="이 작업로그에 Git 커밋 1개 연결"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '1px 5px',
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(w.startedAt || w.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 커밋 상세 Unified Diff 모달 */}
      {selectedCommitForDetail && (
        <GitCommitDetailModal
          isOpen={true}
          onClose={() => setSelectedCommitForDetail(null)}
          repoMappingId={selectedCommitForDetail.repoMappingId}
          commitHash={selectedCommitForDetail.commitHash}
          repoIdentifier={selectedCommitForDetail.repoIdentifier}
        />
      )}

      {/* 작업로그 1:1 커밋 선택/입력 모달 */}
      {selectedWorklogForPicker && (
        <GitCommitPickerModal
          isOpen={true}
          onClose={() => setSelectedWorklogForPicker(null)}
          title={`작업로그 #${selectedWorklogForPicker.id}에 Git 커밋 연결`}
          availableRepositories={mappings}
          onSelectCommit={handleSelectCommit}
        />
      )}
    </div>
  );
};