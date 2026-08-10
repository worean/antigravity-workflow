import React, { useState, useEffect } from 'react';
import type { Issue, Project, User } from '../types';
import { getIssues, getProjects, getUsers, updateIssue, toggleLikeIssue, deleteIssue } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Heart, Trash2, Layers, User as UserIcon, Search } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface IssuesPageProps {
  onOpenCreateIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
  selectedProjectId?: number | null;
}

export const IssuesPage: React.FC<IssuesPageProps> = ({
  onOpenCreateIssue,
  onSelectIssue,
  selectedProjectId,
}) => {
  const { isAuthenticated, user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number | 'ALL'>(selectedProjectId || 'ALL');
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | 'ALL' | 'MY'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Deletion confirm modal state
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProjectId) {
      setFilterProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const loadInitData = async () => {
    try {
      const [pData, uData] = await Promise.all([getProjects(), getUsers()]);
      setProjects(pData);
      setUsers(uData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const pid = filterProjectId === 'ALL' ? undefined : filterProjectId;
      let aid: number | undefined = undefined;

      if (filterAssigneeId === 'MY') {
        aid = user?.id;
      } else if (filterAssigneeId !== 'ALL') {
        aid = Number(filterAssigneeId);
      }

      const iData = await getIssues({
        projectId: pid,
        assigneeId: aid,
        search: searchTerm.trim() || undefined,
      });
      setIssues(iData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitData();
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [filterProjectId, filterAssigneeId, searchTerm]);

  const handleStatusChange = async (issueId: number, newStatusCategory: string) => {
    try {
      const statusMap: Record<string, number> = { TODO: 1, IN_PROGRESS: 2, IN_REVIEW: 3, DONE: 4 };
      const updated = await updateIssue(issueId, {
        statusId: statusMap[newStatusCategory] || 1,
      });
      setIssues((prev) =>
        prev.map((item) => (item.id === issueId ? { ...item, status: updated.status } : item))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) return alert('좋아요 기능은 로그인 후 이용 가능합니다.');

    try {
      const res = await toggleLikeIssue(issue.id);
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issue.id
            ? {
                ...i,
                isLiked: res.isLiked,
                likesCount: res.likesCount,
              }
            : i
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    setDeletingIssue(issue);
  };

  const handleConfirmDeleteIssue = async () => {
    if (!deletingIssue) return;
    setDeleteLoading(true);

    try {
      await deleteIssue(deletingIssue.id);
      setIssues((prev) => prev.filter((i) => i.id !== deletingIssue.id));
      setDeletingIssue(null);
    } catch (err: any) {
      alert(err.response?.data?.error || '이슈 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'TODO', label: '할 일 (TODO)', color: '#94a3b8' },
    { key: 'IN_PROGRESS', label: '진행 중 (In Progress)', color: '#3b82f6' },
    { key: 'IN_REVIEW', label: '검토 중 (In Review)', color: '#f59e0b' },
    { key: 'DONE', label: '완료 (Done)', color: '#10b981' },
  ];

  const getIssuesByColumn = (columnKey: string) => {
    return issues.filter((issue) => {
      const cat = issue.status?.category || issue.status?.name || 'TODO';
      if (columnKey === 'TODO') return cat === 'TODO' || !issue.status;
      return cat === columnKey;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Controller & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>이슈 칸반 보드 (Kanban Board)</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            프로젝트 및 유저 담당자별 이슈 목록을 시각화하고 이동/수정 관리합니다.
          </p>
        </div>

        {isAuthenticated && (
          <button className="btn btn-primary" onClick={onOpenCreateIssue}>
            <Plus size={16} /> 새 이슈 작성
          </button>
        )}
      </div>

      {/* Filter Controllers */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
        }}
      >
        {/* Project Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={16} color="var(--primary)" />
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
          >
            <option value="ALL">전체 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* User / Assignee Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserIcon size={16} color="var(--primary)" />
          <select
            value={filterAssigneeId}
            onChange={(e) =>
              setFilterAssigneeId(
                e.target.value === 'MY' ? 'MY' : e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
              )
            }
            className="input-field"
            style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}
          >
            <option value="ALL">전체 담당자</option>
            {isAuthenticated && <option value="MY">👤 내가 담당한 이슈만 보기</option>}
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} (${u.email})` : u.email}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '200px' }}>
          <Search size={16} color="var(--text-sub)" />
          <input
            type="text"
            className="input-field"
            placeholder="이슈 제목/설명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          이슈 목록 로딩 중...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))',
            gap: '16px',
            overflowX: 'auto',
            paddingBottom: '16px',
          }}
        >
          {columns.map((col) => {
            const columnIssues = getIssuesByColumn(col.key);
            return (
              <div
                key={col.key}
                style={{
                  background: 'rgba(15, 21, 35, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '500px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: `2px solid ${col.color}`,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    {columnIssues.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {columnIssues.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                      이슈가 없습니다.
                    </div>
                  ) : (
                    columnIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="glass-panel glass-panel-hover"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          cursor: 'pointer',
                        }}
                        onClick={() => onSelectIssue(issue)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                            #{issue.id}
                          </span>
                          {isAuthenticated && (
                            <button
                              onClick={(e) => handleOpenDeleteConfirm(e, issue)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {issue.title}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Layers size={12} /> {issue.project?.name || `Project #${issue.projectId}`}
                          </span>
                          <span>👤 {issue.assignee?.name || issue.assignee?.email || '미지정'}</span>
                        </div>

                        {/* Status Select & Actions */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            paddingTop: '8px',
                            marginTop: '4px',
                          }}
                        >
                          <select
                            value={col.key}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(issue.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid var(--border-light)',
                              color: 'var(--text-sub)',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              outline: 'none',
                            }}
                          >
                            <option value="TODO" style={{ background: '#111827' }}>TODO</option>
                            <option value="IN_PROGRESS" style={{ background: '#111827' }}>IN_PROGRESS</option>
                            <option value="IN_REVIEW" style={{ background: '#111827' }}>IN_REVIEW</option>
                            <option value="DONE" style={{ background: '#111827' }}>DONE</option>
                          </select>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              onClick={(e) => handleToggleLike(e, issue)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: issue.isLiked ? '#f43f5e' : 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              <Heart size={14} fill={issue.isLiked ? '#f43f5e' : 'none'} />
                              {issue.likesCount || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issue Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingIssue}
        title="이슈 삭제 확인"
        message={`이슈 #${deletingIssue?.id} ('${deletingIssue?.title}')를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="이슈 삭제"
        onConfirm={handleConfirmDeleteIssue}
        onClose={() => setDeletingIssue(null)}
        loading={deleteLoading}
      />
    </div>
  );
};
