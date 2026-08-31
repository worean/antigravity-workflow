// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import type { Sprint, Project, Issue } from '@/types';
import {
  getSprint,
  getProjects,
  getIssues,
  updateSprint,
  deleteSprint,
  assignIssuesToSprint,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Spinner, Card } from '@/components/common';
import {
  SprintDetailHeader,
  SprintDetailBanner,
  SprintDetailTabsNav,
  SprintIssuesTab,
  type SprintDetailTabType,
} from '@/components/sprintDetail';
import {
  SprintDiscussionsTab,
  SprintWorklogsTab,
  SprintNotesTab,
  SprintManageIssuesModal,
} from '@/components/sprints';
import { SprintModal } from '@/components/SprintModal';

interface SprintDetailPageProps {
  sprintId: number | null;
  projectId?: number | null;
  onBack: () => void;
  onOpenIssueDetail?: (issueId: number) => void;
  onOpenAuth?: () => void;
}

export const SprintDetailPage: React.FC<SprintDetailPageProps> = ({
  sprintId,
  onBack,
  onOpenIssueDetail,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<SprintDetailTabType>('discussions');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // Manage Issues Modal State
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [sprintIssues, setSprintIssues] = useState<Issue[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>([]);
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [backlogSearch, setBacklogSearch] = useState<string>('');
  const [autoCalculating, setAutoCalculating] = useState<boolean>(false);

  const fetchSprintData = async (showLoading: boolean = false) => {
    if (!sprintId) return;
    if (showLoading) setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getSprint(sprintId),
        getProjects(),
      ]);
      setSprint(sData);
      setProjects(pData);
    } catch (err) {
      console.error('Failed to fetch sprint detail:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintData(true);
  }, [sprintId]);

  const handleQuickStatusChange = async (sId: number, newStatus: string) => {
    try {
      await updateSprint(sId, { status: newStatus });
      await fetchSprintData();
    } catch (err) {
      console.error('Failed to change sprint status:', err);
    }
  };

  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  const handleDeleteSprint = async (sId: number) => {
    if (!confirm('정말 이 스프린트를 삭제하시겠습니까? (할당된 이슈는 삭제되지 않고 백로그로 복귀합니다)')) return;
    try {
      await deleteSprint(sId);
      onBack();
    } catch (err) {
      console.error('Failed to delete sprint:', err);
    }
  };

  // Manage Issues
  const handleOpenManageModal = async (s: Sprint) => {
    setShowManageModal(true);
    setManageLoading(true);
    try {
      const [freshSprint, allIssues] = await Promise.all([
        getSprint(s.id),
        getIssues({ projectId: s.projectId }),
      ]);
      setSprintIssues(freshSprint.issues || []);
      const backlog = allIssues.filter((i) => !i.sprintId || i.sprintId === s.id);
      setBacklogIssues(backlog);
    } catch (err) {
      console.error('Failed to load issues for sprint management:', err);
    } finally {
      setManageLoading(false);
    }
  };

  const handleAddIssueToSprint = async (issueId: number) => {
    if (!sprint) return;
    try {
      await assignIssuesToSprint(sprint.id, { addIssueIds: [issueId] });
      await handleOpenManageModal(sprint);
      await fetchSprintData();
    } catch (err) {
      console.error('Failed to add issue to sprint:', err);
    }
  };

  const handleRemoveIssueFromSprint = async (issueId: number) => {
    if (!sprint) return;
    try {
      await assignIssuesToSprint(sprint.id, { removeIssueIds: [issueId] });
      await handleOpenManageModal(sprint);
      await fetchSprintData();
    } catch (err) {
      console.error('Failed to remove issue from sprint:', err);
    }
  };

  const handleSyncSprintDates = async () => {
    if (!sprint) return;
    setAutoCalculating(true);
    try {
      await assignIssuesToSprint(sprint.id, { autoCalculateDates: true });
      await handleOpenManageModal(sprint);
      await fetchSprintData();
    } catch (err) {
      console.error('Failed to auto calculate sprint dates:', err);
    } finally {
      setAutoCalculating(false);
    }
  };

  if (loading) {
    return <Spinner centered label="스프린트 상세 정보를 불러오는 중입니다..." />;
  }

  if (!sprint) {
    return (
      <div className="animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
        <Card variant="glass" padding="30px">
          <div>스프린트를 찾을 수 없습니다.</div>
          <div style={{ marginTop: '12px' }}>
            <button className="btn btn-secondary btn-sm" onClick={onBack}>
              스프린트 목록으로 돌아가기
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const sprintIssuesList = sprint.issues || [];
  const filteredBacklog = backlogIssues.filter((i) => {
    if (!backlogSearch.trim()) return true;
    return (
      i.title.toLowerCase().includes(backlogSearch.toLowerCase()) ||
      String(i.issueNumber || i.id).includes(backlogSearch)
    );
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '30px' }}>
      {/* 1. Header Toolbar */}
      <SprintDetailHeader
        sprint={sprint}
        isAuthenticated={isAuthenticated}
        onBack={onBack}
        handleQuickStatusChange={handleQuickStatusChange}
        handleOpenEditModal={handleOpenEditModal}
        handleDeleteSprint={handleDeleteSprint}
        fetchData={fetchSprintData}
        onOpenAuth={onOpenAuth}
      />

      {/* 2. Summary Banner (Goal & KPI Stats) */}
      <SprintDetailBanner sprint={sprint} />

      {/* 3. 4-Tab Navigation */}
      <SprintDetailTabsNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        issuesCount={sprintIssuesList.length}
      />

      {/* 4. Tab Content Panel */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '16px 20px',
          minHeight: '400px',
        }}
      >
        {/* 4.1 Discussions Feed */}
        {activeTab === 'discussions' && (
          <SprintDiscussionsTab
            sprintId={sprint.id}
            sprintIssuesCount={sprintIssuesList.length}
            currentUser={user}
            isAuthenticated={isAuthenticated}
            onOpenIssueDetail={onOpenIssueDetail}
            onOpenAuth={onOpenAuth}
          />
        )}

        {/* 4.2 Worklogs Timeline */}
        {activeTab === 'worklogs' && (
          <SprintWorklogsTab
            sprintId={sprint.id}
            sprintIssuesCount={sprintIssuesList.length}
            onOpenIssueDetail={onOpenIssueDetail}
          />
        )}

        {/* 4.3 Meeting Minutes & Notes */}
        {activeTab === 'notes' && (
          <SprintNotesTab
            sprint={sprint}
            isAuthenticated={isAuthenticated}
            onSprintUpdated={fetchSprintData}
            onOpenAuth={onOpenAuth}
          />
        )}

        {/* 4.4 Assigned Issues List */}
        {activeTab === 'issues' && (
          <SprintIssuesTab
            sprint={sprint}
            onOpenIssueDetail={onOpenIssueDetail}
            onOpenManageIssuesModal={() => handleOpenManageModal(sprint)}
          />
        )}
      </div>

      {/* Edit Modal (IssueModal 완벽 일치 구조) */}
      <SprintModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        sprint={sprint}
        projects={projects}
        onSuccess={() => fetchSprintData()}
      />

      {/* Manage Issues Modal */}
      <SprintManageIssuesModal
        showManageModal={showManageModal}
        setShowManageModal={setShowManageModal}
        managingSprint={sprint}
        sprintIssues={sprintIssues}
        filteredBacklog={filteredBacklog}
        manageLoading={manageLoading}
        autoCalculating={autoCalculating}
        backlogSearch={backlogSearch}
        setBacklogSearch={setBacklogSearch}
        getDDayBadge={() => null}
        handleSyncSprintDates={handleSyncSprintDates}
        handleRemoveIssueFromSprint={handleRemoveIssueFromSprint}
        handleAddIssueToSprint={handleAddIssueToSprint}
      />
    </div>
  );
};