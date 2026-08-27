import React, { useState, useEffect } from 'react';
import type { Issue } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  useIssues,
  useProjects,
  useUsers,
  useUpdateIssue,
  useDeleteIssue,
  useToggleLikeIssue,
  useToggleFavorite,
} from '../api';
import { Plus, Heart, Trash2, Search, Calendar, Filter, GripVertical, Star } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { getProjectMembers } from '../utils/projectMembers';
import { PriorityBadge, IssueTypeBadge, UserBadge } from '../components/common';
import { formatDateOnly, getDDayStatus } from '../utils/dateUtils';
import { STATUS_LIST, STATUS_CONFIG, parseStatusCategory, parsePriorityLevel } from '../utils/statusUtils';

interface IssuesPageProps {
  onOpenCreateIssue: () => void;
  onSelectIssue: (issue: Issue) => void;
  selectedProjectId?: number | null;
  selectedAssigneeId?: number | 'ALL' | 'MY';
  searchTermProp?: string;
  onFilterChange?: (filters: { projectId: number | 'ALL'; assigneeId: number | 'ALL' | 'MY'; search: string }) => void;
  refreshKey?: number;
  onIssueUpdatedDirectly?: (updated: Issue) => void;
  onIssueDeletedDirectly?: (issueId: number) => void;
  onOpenAuth?: () => void;
}

export const IssuesPage: React.FC<IssuesPageProps> = ({
  onOpenCreateIssue,
  onSelectIssue,
  selectedProjectId,
  selectedAssigneeId = 'ALL',
  searchTermProp = '',
  onFilterChange,
  onIssueUpdatedDirectly,
  onIssueDeletedDirectly,
  onOpenAuth,
}) => {
  const { isAuthenticated, user } = useAuth();

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<number | 'ALL'>(selectedProjectId || 'ALL');
  const [filterAssigneeId, setFilterAssigneeId] = useState<number | 'ALL' | 'MY'>(selectedAssigneeId || 'ALL');
  const [searchTerm, setSearchTerm] = useState<string>(searchTermProp || '');

  // 1. Projects & Users Query
  const { data: projects = [] } = useProjects({ limit: 50 });
  const { data: users = [] } = useUsers();

  // 2. Issues Query (TanStack Query with automatic caching & debounced filters)
  const queryProjectId = filterProjectId === 'ALL' ? undefined : filterProjectId;
  const queryAssigneeId = filterAssigneeId === 'MY' ? 'my' : filterAssigneeId === 'ALL' ? undefined : Number(filterAssigneeId);

  const { data: issues = [], isLoading: loading } = useIssues({
    projectId: queryProjectId,
    assigneeId: queryAssigneeId,
    search: searchTerm.trim() || undefined,
    all: true, // 보드 뷰에서는 전체 항목 표시
  });

  // Mutations
  const updateIssueMutation = useUpdateIssue();
  const deleteIssueMutation = useDeleteIssue();
  const toggleLikeMutation = useToggleLikeIssue();
  const toggleFavoriteMutation = useToggleFavorite();

  const handleToggleFavorite = (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    toggleFavoriteMutation.mutate({
      targetType: 'ISSUE',
      targetId: issue.id,
    });
  };

  // Drag and Drop States
  const [draggedIssueId, setDraggedIssueId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Deletion confirm modal state
  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // Sync props to internal state on URL change / history back
  useEffect(() => {
    setFilterProjectId(selectedProjectId ? selectedProjectId : 'ALL');
  }, [selectedProjectId]);

  useEffect(() => {
    setFilterAssigneeId(selectedAssigneeId || 'ALL');
  }, [selectedAssigneeId]);

  useEffect(() => {
    setSearchTerm(searchTermProp || '');
  }, [searchTermProp]);

  // Filter change handlers
  const handleProjectFilterChange = (newProj: number | 'ALL') => {
    setFilterProjectId(newProj);
    if (onFilterChange) {
      onFilterChange({ projectId: newProj, assigneeId: filterAssigneeId, search: searchTerm });
    }
  };

  const handleAssigneeFilterChange = (newAssignee: number | 'ALL' | 'MY') => {
    setFilterAssigneeId(newAssignee);
    if (onFilterChange) {
      onFilterChange({ projectId: filterProjectId, assigneeId: newAssignee, search: searchTerm });
    }
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch);
    if (onFilterChange) {
      onFilterChange({ projectId: filterProjectId, assigneeId: filterAssigneeId, search: newSearch });
    }
  };

  const handleStatusChange = async (issueId: number, newStatusCategory: string) => {
    const targetMeta = STATUS_CONFIG[newStatusCategory as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.TODO;
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue) return;

    const curCat = parseStatusCategory(targetIssue.statusId || targetIssue.status);
    if (curCat === targetMeta.key) return;

    try {
      const updated = await updateIssueMutation.mutateAsync({
        id: issueId,
        data: { statusId: targetMeta.id },
      });
      if (onIssueUpdatedDirectly) onIssueUpdatedDirectly(updated);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData('text/plain', String(issue.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIssueId(issue.id);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverColumn(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnKey) {
      setDragOverColumn(columnKey);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn(null);
  };

  const handleDropOnColumn = (e: React.DragEvent, targetColumnKey: string) => {
    e.preventDefault();
    const rawId = e.dataTransfer.getData('text/plain') || String(draggedIssueId || '');
    const issueId = Number(rawId);

    setDragOverColumn(null);
    setDraggedIssueId(null);

    if (issueId && !isNaN(issueId)) {
      handleStatusChange(issueId, targetColumnKey);
    }
  };

  const handleToggleLike = async (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      else alert('좋아요 기능은 로그인 후 이용 가능합니다.');
      return;
    }

    try {
      await toggleLikeMutation.mutateAsync(issue.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDeleteConfirm = (e: React.MouseEvent, issue: Issue) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setDeletingIssue(issue);
  };

  const handleConfirmDeleteIssue = async () => {
    if (!deletingIssue) return;
    setDeleteLoading(true);

    try {
      await deleteIssueMutation.mutateAsync(deletingIssue.id);
      if (onIssueDeletedDirectly) onIssueDeletedDirectly(deletingIssue.id);
      setDeletingIssue(null);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '이슈 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getIssuesByColumn = (columnKey: string) => {
    return issues.filter((issue) => {
      const cat = parseStatusCategory(issue.statusId || issue.status);
      return cat === columnKey;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '100%',
        minHeight: '100%',
        flex: 1,
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Filter Bar (Compact & Integrated) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          background: 'var(--bg-card)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--border-light)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-sub)', fontSize: '0.78rem' }}>
          <Filter size={13} color="var(--primary)" />
          <span>필터:</span>
        </div>

        {/* Project Filter */}
        <select
          value={filterProjectId}
          onChange={(e) => handleProjectFilterChange(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="input-field"
          style={{ width: 'auto', minWidth: '140px' }}
        >
          <option value="ALL">전체 프로젝트 ({projects.length})</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>

        {/* Assignee Filter */}
        <select
          value={filterAssigneeId}
          onChange={(e) =>
            handleAssigneeFilterChange(
              e.target.value === 'MY' ? 'MY' : e.target.value === 'ALL' ? 'ALL' : Number(e.target.value)
            )
          }
          className="input-field"
          style={{ width: 'auto', minWidth: '130px' }}
        >
          <option value="ALL">전체 담당자</option>
          {isAuthenticated && <option value="MY">내 담당 일감 (My Tasks)</option>}
          {getProjectMembers(
            filterProjectId !== 'ALL' ? projects.find((p) => p.id === filterProjectId) : undefined,
            users
          ).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ? `${u.name} (${u.email})` : u.email}
            </option>
          ))}
        </select>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '160px' }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            type="text"
            className="input-field"
            placeholder="이슈 검색 (제목/설명)..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Auth Buttons */}
        {!isAuthenticated && onOpenAuth && (
          <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
            로그인
          </button>
        )}
        {isAuthenticated && (
          <button className="btn btn-primary btn-sm" onClick={onOpenCreateIssue}>
            <Plus size={13} /> 이슈 생성
          </button>
        )}
      </div>

      {/* Kanban Board Grid (100% Height to bottom) */}
      {loading && issues.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          이슈 불러오는 중...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(240px, 1fr))',
            gap: '8px',
            flex: 1,
            height: '100%',
            minHeight: 0,
            overflowX: 'auto',
            overflowY: 'hidden',
            alignItems: 'stretch',
          }}
        >
          {STATUS_LIST.map((col) => {
            const columnIssues = getIssuesByColumn(col.key);
            const isColumnHovered = dragOverColumn === col.key;

            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOverColumn(e, col.key)}
                onDragEnter={(e) => handleDragOverColumn(e, col.key)}
                onDragLeave={handleDragLeaveColumn}
                onDrop={(e) => handleDropOnColumn(e, col.key)}
                style={{
                  background: isColumnHovered ? '#2a2d2e' : 'var(--bg-card)',
                  borderRadius: 'var(--radius-xs)',
                  border: isColumnHovered ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                  boxShadow: isColumnHovered ? 'inset 0 0 0 1px var(--primary)' : 'none',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  height: '100%',
                  minHeight: 0,
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  transition: 'background-color 0.1s ease, border-color 0.1s ease',
                }}
              >
                {/* Column Header (VS Code Tab/Pane style) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '6px',
                    borderBottom: `2px solid ${col.color}`,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--text-bright)' }}>
                      {col.fullLabel}
                    </span>
                    {isColumnHovered && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', background: 'rgba(0,122,204,0.2)', padding: '1px 4px', borderRadius: '2px' }}>
                        여기에 놓기
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: '#333333',
                      color: 'var(--text-main)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                    }}
                  >
                    {columnIssues.length}
                  </span>
                </div>

                {/* Column Cards Area (Scrolls internally if overflowed) */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    flex: 1,
                    overflowY: 'auto',
                    minHeight: 0,
                    paddingRight: '2px',
                  }}
                >
                  {columnIssues.length === 0 ? (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: isColumnHovered ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        textAlign: 'center',
                        padding: '24px 0',
                        border: isColumnHovered ? '1px dashed var(--primary)' : 'none',
                        borderRadius: 'var(--radius-xs)',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isColumnHovered ? '이곳으로 드롭하세요' : '항목 없음'}
                    </div>
                  ) : (
                    columnIssues.map((issue) => {
                      const isThisCardDragged = draggedIssueId === issue.id;
                      const priorityLevel = parsePriorityLevel(issue.priorityId || issue.priority);
                      const isCritical = priorityLevel === 'CRITICAL';
                      const isHigh = priorityLevel === 'HIGH';
                      const isMedium = priorityLevel === 'MEDIUM';
                      const priorityClass = isCritical
                        ? 'card-priority-critical'
                        : isHigh
                        ? 'card-priority-high'
                        : isMedium
                        ? 'card-priority-medium'
                        : 'card-priority-low';

                      return (
                        <div
                          key={issue.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, issue)}
                          onDragEnd={handleDragEnd}
                          className={`glass-panel glass-panel-hover ${priorityClass}`}
                          style={{
                            padding: '6px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '5px',
                            cursor: 'grab',
                            background: '#2d2d2d',
                            border: isThisCardDragged ? '1px dashed var(--primary)' : undefined,
                            borderRadius: 'var(--radius-xs)',
                            opacity: isThisCardDragged ? 0.4 : 1,
                            userSelect: 'none',
                            flexShrink: 0,
                            transition: 'opacity 0.15s ease, transform 0.1s ease',
                          }}
                          onClick={() => onSelectIssue(issue)}
                        >


                          {/* Header: ID, Type, Priority, Drag Handle & Delete */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <GripVertical size={11} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)' }}>
                                #{issue.id}
                              </span>
                              <IssueTypeBadge type={issue.typeId || issue.type} size="sm" />
                              <PriorityBadge priority={issue.priorityId || issue.priority} size="sm" />
                            </div>
                            {isAuthenticated && (
                              <button
                                onClick={(e) => handleOpenDeleteConfirm(e, issue)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                title="삭제"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          {/* Issue Title (Crisp) */}
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-bright)',
                              lineHeight: 1.3,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {issue.title}
                          </div>

                          {/* Project & Assignee info */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                              📁 {issue.project?.name || `Prj #${issue.projectId}`}
                            </span>
                            <UserBadge user={issue.assignee} currentUserId={user?.id} size="sm" />
                          </div>

                          {/* Due Date Indicator (Compact) */}
                          {issue.dueDate && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#252526',
                                padding: '2px 5px',
                                borderRadius: '2px',
                                fontSize: '0.7rem',
                                border: '1px solid #383838',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#9cdcfe' }}>
                                <Calendar size={11} /> {formatDateOnly(issue.dueDate)}
                              </span>
                              {(() => {
                                const dday = getDDayStatus(issue.dueDate);
                                if (!dday) return null;
                                return (
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '0.65rem',
                                      padding: '0 4px',
                                      borderRadius: '2px',
                                      color: dday.color,
                                      background: dday.bg,
                                    }}
                                  >
                                    {dday.label}
                                  </span>
                                );
                              })()}
                            </div>
                          )}

                          {/* Footer: Quick Status Switch & Likes */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              borderTop: '1px solid #383838',
                              paddingTop: '4px',
                              marginTop: '2px',
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
                                background: '#252526',
                                border: '1px solid #3c3c3c',
                                color: 'var(--text-sub)',
                                fontSize: '0.7rem',
                                borderRadius: '2px',
                                padding: '1px 4px',
                                outline: 'none',
                                height: '20px',
                              }}
                            >
                              {STATUS_LIST.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.key}
                                </option>
                              ))}
                            </select>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={(e) => handleToggleFavorite(e, issue)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: issue.isFavorite ? '#eab308' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                  padding: '2px',
                                }}
                                title={issue.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                              >
                                <Star size={11} fill={issue.isFavorite ? '#eab308' : 'none'} color={issue.isFavorite ? '#eab308' : '#9ca3af'} />
                              </button>

                              <button
                                onClick={(e) => handleToggleLike(e, issue)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: issue.isLiked ? '#f14c4c' : 'var(--text-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                }}
                              >
                                <Heart size={11} fill={issue.isLiked ? '#f14c4c' : 'none'} />
                                {issue.likesCount || 0}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingIssue}
        title="이슈 삭제"
        message={`이슈 #${deletingIssue?.id} ('${deletingIssue?.title}')를 삭제하시겠습니까?`}
        confirmText="삭제"
        onConfirm={handleConfirmDeleteIssue}
        onClose={() => setDeletingIssue(null)}
        loading={deleteLoading}
      />
    </div>
  );
};
