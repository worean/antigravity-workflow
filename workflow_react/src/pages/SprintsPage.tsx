import React, { useState, useEffect } from 'react';
import type { Sprint, Project, Issue } from '@/types';
import {
  getSprints,
  getSprint,
  getProjects,
  getIssues,
  updateSprint,
  deleteSprint,
  assignIssuesToSprint,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatDateOnly } from '@/utils/dateUtils';
import {
  SprintToolbar,
  SprintStarredHud,
  SprintGrid,
  SprintManageIssuesModal,
  SprintDetailModal,
  type SprintStatusFilter,
} from '@/components/sprints';
import { SprintModal } from '@/components/SprintModal';
import { useUIStore } from '@/stores/useUIStore';

interface SprintsPageProps {
  selectedProjectId?: number | 'ALL' | null;
  onFilterChange?: (projectId: number | 'ALL') => void;
  onSelectSprint?: (sprintId: number) => void;
  onOpenCreateSprint?: () => void;
  onOpenEditSprint?: (sprint: Sprint) => void;
  onOpenIssueDetail?: (issueId: number) => void;
  onOpenAuth?: () => void;
}

export const SprintsPage: React.FC<SprintsPageProps> = ({
  selectedProjectId: initialProjectId = 'ALL',
  onFilterChange,
  onSelectSprint,
  onOpenCreateSprint,
  onOpenEditSprint,
  onOpenIssueDetail,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Filters (Single Source of Truth from Props)
  const [statusFilter, setStatusFilter] = useState<SprintStatusFilter>('ALL');
  const selectedProjectId = initialProjectId || 'ALL';

  // Create / Edit Modal State (로컬 폴백용)
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);

  // Collaboration Hub / Detail Modal State
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [detailSprint, setDetailSprint] = useState<Sprint | null>(null);

  // Issue Management Modal State
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [managingSprint, setManagingSprint] = useState<Sprint | null>(null);
  const [sprintIssues, setSprintIssues] = useState<Issue[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>([]);
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [backlogSearch, setBacklogSearch] = useState<string>('');
  const [autoCalculating, setAutoCalculating] = useState<boolean>(false);

  const fetchData = async (showLoading: boolean = false) => {
    if (showLoading && sprints.length === 0) setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getSprints(selectedProjectId === 'ALL' ? undefined : selectedProjectId),
        getProjects(),
      ]);
      setSprints(sData);
      setProjects(pData);
    } catch (err) {
      console.error('Failed to fetch sprint data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, [selectedProjectId]);

  // Open Create Modal (전역 모달 우선 호출)
  const handleOpenCreateModal = () => {
    if (onOpenCreateSprint) {
      onOpenCreateSprint();
    } else {
      setEditingSprint(null);
      setShowFormModal(true);
    }
  };

  // Open Edit Modal (전역 모달 우선 호출)
  const handleOpenEditModal = (sprint: Sprint) => {
    if (onOpenEditSprint) {
      onOpenEditSprint(sprint);
    } else {
      setEditingSprint(sprint);
      setShowFormModal(true);
    }
  };

  // Open Collaboration Hub / Detail Page
  const handleOpenDetailModal = (sprint: Sprint) => {
    if (onSelectSprint) {
      onSelectSprint(sprint.id);
    } else {
      setDetailSprint(sprint);
      setShowDetailModal(true);
    }
  };

  // Delete Sprint
  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm('정말로 이 스프린트를 삭제하시겠습니까? 소속된 이슈들은 백로그로 되돌아갑니다.')) return;
    try {
      await deleteSprint(sprintId);
      await fetchData();
      useUIStore.getState().showToast('스프린트가 성공적으로 삭제되었습니다.', 'success');
    } catch (err: any) {
      useUIStore.getState().showToast(err.response?.data?.error || '스프린트 삭제에 실패했습니다.', 'error');
    }
  };

  // Quick Status Change (Start, Complete, Reopen)
  const handleQuickStatusChange = async (sprintId: number, newStatus: string) => {
    try {
      await updateSprint(sprintId, { status: newStatus });
      await fetchData();
      const statusLabel =
        newStatus === 'ACTIVE' ? '진행 중' : newStatus === 'COMPLETED' ? '완료' : '계획됨';
      useUIStore.getState().showToast(`스프린트 상태가 '${statusLabel}'(으)로 변경되었습니다.`, 'success');
    } catch (err: any) {
      useUIStore.getState().showToast(err.response?.data?.error || '상태 변경에 실패했습니다.', 'error');
    }
  };

  // Open Issue Management Modal
  const handleOpenManageModal = async (sprint: Sprint) => {
    setManagingSprint(sprint);
    setShowManageModal(true);
    setManageLoading(true);
    setBacklogSearch('');
    try {
      const [fullSprint, allProjIssues] = await Promise.all([
        getSprint(sprint.id),
        getIssues({ projectId: sprint.projectId }),
      ]);
      setManagingSprint(fullSprint);
      setSprintIssues(fullSprint.issues || []);

      const unassigned = (allProjIssues || []).filter((iss) => !iss.sprintId);
      setBacklogIssues(unassigned);
    } catch (err) {
      console.error(err);
      useUIStore.getState().showToast('이슈 목록 조회에 실패했습니다.', 'error');
    } finally {
      setManageLoading(false);
    }
  };

  // Assign issue to sprint
  const handleAddIssueToSprint = async (issueId: number) => {
    if (!managingSprint) return;
    try {
      await assignIssuesToSprint(managingSprint.id, { addIssueIds: [issueId] });
      const targetIssue = backlogIssues.find((i) => i.id === issueId);
      if (targetIssue) {
        setBacklogIssues((prev) => prev.filter((i) => i.id !== issueId));
        setSprintIssues((prev) => [...prev, { ...targetIssue, sprintId: managingSprint.id }]);
      }
      await fetchData();
      useUIStore.getState().showToast('스프린트에 이슈가 할당되었습니다.', 'success');
    } catch (err: any) {
      useUIStore.getState().showToast(err.response?.data?.error || '이슈 할당에 실패했습니다.', 'error');
    }
  };

  // Remove issue from sprint back to backlog
  const handleRemoveIssueFromSprint = async (issueId: number) => {
    if (!managingSprint) return;
    try {
      await assignIssuesToSprint(managingSprint.id, { removeIssueIds: [issueId] });
      const targetIssue = sprintIssues.find((i) => i.id === issueId);
      if (targetIssue) {
        setSprintIssues((prev) => prev.filter((i) => i.id !== issueId));
        setBacklogIssues((prev) => [...prev, { ...targetIssue, sprintId: null }]);
      }
      await fetchData();
      useUIStore.getState().showToast('스프린트에서 이슈가 제외되어 백로그로 이동했습니다.', 'success');
    } catch (err: any) {
      useUIStore.getState().showToast(err.response?.data?.error || '이슈 제외에 실패했습니다.', 'error');
    }
  };

  // Auto calculate sprint start/end dates from assigned issues
  const handleSyncSprintDates = async () => {
    if (!managingSprint) return;
    if (sprintIssues.length === 0) {
      useUIStore.getState().showToast('스프린트에 할당된 이슈가 없습니다.', 'error');
      return;
    }

    let minStart: string | null = null;
    let maxDue: string | null = null;

    for (const iss of sprintIssues) {
      if (iss.plannedStartDate) {
        const s = iss.plannedStartDate.slice(0, 10);
        if (!minStart || s < minStart) minStart = s;
      }
      if (iss.dueDate) {
        const d = iss.dueDate.slice(0, 10);
        if (!maxDue || d > maxDue) maxDue = d;
      }
    }

    if (!minStart && !maxDue) {
      useUIStore.getState().showToast('할당된 이슈들에 설정된 시작일이나 기한이 없습니다.', 'error');
      return;
    }

    setAutoCalculating(true);
    try {
      const updated = await updateSprint(managingSprint.id, {
        startDate: minStart ? new Date(minStart).toISOString() : undefined,
        endDate: maxDue ? new Date(maxDue).toISOString() : undefined,
      });
      setManagingSprint(updated);
      await fetchData();
      useUIStore.getState().showToast(
        `스프린트 일정이 자동 갱신되었습니다. (${formatDateOnly(updated.startDate) || '미설정'} ~ ${formatDateOnly(updated.endDate) || '미설정'})`,
        'success'
      );
    } catch (err: any) {
      useUIStore.getState().showToast(err.response?.data?.error || '일정 동기화에 실패했습니다.', 'error');
    } finally {
      setAutoCalculating(false);
    }
  };

  // Calculate Progress & D-Day for Sprint Card
  const getSprintProgress = (sprint: Sprint) => {
    const issues = sprint.issues || [];
    if (issues.length === 0) return { total: 0, done: 0, inProgress: 0, todo: 0, rate: 0 };

    let done = 0;
    let inProgress = 0;
    let todo = 0;

    for (const iss of issues) {
      const cat = iss.status?.category || 'TODO';
      if (cat === 'DONE') done++;
      else if (cat === 'IN_PROGRESS' || cat === 'IN_REVIEW') inProgress++;
      else todo++;
    }

    const rate = Math.round((done / issues.length) * 100);
    return { total: issues.length, done, inProgress, todo, rate };
  };

  const getDDayBadge = (sprint: Sprint) => {
    if (sprint.status === 'COMPLETED') {
      return <span style={{ fontSize: '0.68rem', color: '#89d185', background: 'rgba(137,209,133,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>완료됨</span>;
    }
    if (!sprint.endDate) {
      return <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '3px' }}>기한 미설정</span>;
    }

    const end = new Date(sprint.endDate);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span style={{ fontSize: '0.68rem', color: '#f14c4c', background: 'rgba(241,76,76,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>{Math.abs(diffDays)}일 초과</span>;
    }
    if (diffDays === 0) {
      return <span style={{ fontSize: '0.68rem', color: '#cca700', background: 'rgba(204,167,0,0.18)', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>D-Day (오늘 마감)</span>;
    }
    return <span style={{ fontSize: '0.68rem', color: '#9cdcfe', background: 'rgba(0,122,204,0.15)', padding: '1px 6px', borderRadius: '3px', fontWeight: 600 }}>D-{diffDays}일 남음</span>;
  };

  const filteredSprints = sprints.filter((s) => {
    if (statusFilter === 'STARRED') {
      if (!s.isFavorite) return false;
    } else if (statusFilter !== 'ALL' && s.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const filteredBacklog = backlogIssues.filter((i) => {
    if (!backlogSearch.trim()) return true;
    const q = backlogSearch.toLowerCase();
    return i.title.toLowerCase().includes(q) || (i.issueNumber && String(i.issueNumber).includes(q));
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* 1. Header Toolbar */}
      <SprintToolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={(pId) => onFilterChange && onFilterChange(pId)}
        filteredSprintsCount={filteredSprints.length}
        projects={projects}
        isAuthenticated={isAuthenticated}
        onFilterChange={onFilterChange}
        onOpenAuth={onOpenAuth}
        handleOpenCreateModal={handleOpenCreateModal}
      />

      {/* 2. Starred Sprints Focus HUD Strip */}
      <SprintStarredHud
        sprints={sprints}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        getSprintProgress={getSprintProgress}
        handleOpenManageModal={handleOpenManageModal}
      />

      {/* 3. Sprints Grid */}
      <SprintGrid
        filteredSprints={filteredSprints}
        loading={loading}
        sprintsCount={sprints.length}
        statusFilter={statusFilter}
        isAuthenticated={isAuthenticated}
        getSprintProgress={getSprintProgress}
        getDDayBadge={getDDayBadge}
        handleQuickStatusChange={handleQuickStatusChange}
        handleOpenManageModal={handleOpenManageModal}
        handleOpenDetailModal={handleOpenDetailModal}
        handleOpenEditModal={handleOpenEditModal}
        handleDeleteSprint={handleDeleteSprint}
        fetchData={fetchData}
        onOpenAuth={onOpenAuth}
      />

      {/* 4. Form Modal: Create / Edit (IssueModal 완벽 일치 구조) */}
      <SprintModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        sprint={editingSprint}
        projects={projects}
        initialProjectId={selectedProjectId === 'ALL' ? undefined : selectedProjectId}
        onSuccess={() => fetchData()}
      />

      {/* 5. Manage Issues Modal */}
      <SprintManageIssuesModal
        showManageModal={showManageModal}
        setShowManageModal={setShowManageModal}
        managingSprint={managingSprint}
        sprintIssues={sprintIssues}
        filteredBacklog={filteredBacklog}
        manageLoading={manageLoading}
        autoCalculating={autoCalculating}
        backlogSearch={backlogSearch}
        setBacklogSearch={setBacklogSearch}
        getDDayBadge={getDDayBadge}
        handleSyncSprintDates={handleSyncSprintDates}
        handleRemoveIssueFromSprint={handleRemoveIssueFromSprint}
        handleAddIssueToSprint={handleAddIssueToSprint}
      />

      {/* 6. Sprint Collaboration Hub / Detail Modal */}
      <SprintDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        sprint={detailSprint}
        currentUser={user}
        isAuthenticated={isAuthenticated}
        onSprintUpdated={() => fetchData()}
        onOpenIssueDetail={onOpenIssueDetail}
        onOpenManageIssuesModal={(s) => handleOpenManageModal(s)}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};