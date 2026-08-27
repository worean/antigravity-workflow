// -*- coding: utf-8 -*-
import React, { useState, useEffect } from 'react';
import type { Sprint, Project, Issue } from '../types';
import {
  getSprints,
  getSprint,
  getProjects,
  getIssues,
  createSprint,
  updateSprint,
  deleteSprint,
  assignIssuesToSprint,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Target,
  Zap,
  Play,
  CheckCircle2,
  RotateCcw,
  Calendar,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  X,
  LogIn,
} from 'lucide-react';
import { Button, Card, Spinner, StatusBadge, ProjectBadge, Avatar, FavoriteButton } from '../components/common';
import { formatDateOnly } from '../utils/dateUtils';

type SprintStatusFilter = 'ALL' | 'STARRED' | 'PLANNED' | 'ACTIVE' | 'COMPLETED';

interface SprintsPageProps {
  selectedProjectId?: number | 'ALL' | null;
  onFilterChange?: (projectId: number | 'ALL') => void;
  onOpenAuth?: () => void;
}

export const SprintsPage: React.FC<SprintsPageProps> = ({
  selectedProjectId: initialProjectId = 'ALL',
  onFilterChange,
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<SprintStatusFilter>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'ALL'>(initialProjectId || 'ALL');

  useEffect(() => {
    if (initialProjectId !== undefined && initialProjectId !== null) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // Create / Edit Modal State
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formGoal, setFormGoal] = useState<string>('');
  const [formProjectId, setFormProjectId] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formStatus, setFormStatus] = useState<string>('PLANNED');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Issue Management Modal State (2번 기능)
  const [showManageModal, setShowManageModal] = useState<boolean>(false);
  const [managingSprint, setManagingSprint] = useState<Sprint | null>(null);
  const [sprintIssues, setSprintIssues] = useState<Issue[]>([]);
  const [backlogIssues, setBacklogIssues] = useState<Issue[]>([]);
  const [manageLoading, setManageLoading] = useState<boolean>(false);
  const [backlogSearch, setBacklogSearch] = useState<string>('');
  const [autoCalculating, setAutoCalculating] = useState<boolean>(false);

  const fetchData = async (showLoading: boolean = false) => {
    if (showLoading) setLoading(true);
    try {
      const [sData, pData] = await Promise.all([
        getSprints(selectedProjectId === 'ALL' ? undefined : selectedProjectId),
        getProjects(),
      ]);
      setSprints(sData);
      setProjects(pData);
      if (pData.length > 0 && !formProjectId) setFormProjectId(pData[0].id);
    } catch (err) {
      console.error('Failed to fetch sprint data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [selectedProjectId]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingSprint(null);
    setFormName('');
    setFormGoal('');
    setFormProjectId(projects[0]?.id || 1);
    setFormStartDate(new Date().toISOString().slice(0, 10));
    // Default 2 weeks
    const next2Weeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setFormEndDate(next2Weeks);
    setFormStatus('PLANNED');
    setShowFormModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setFormName(sprint.name);
    setFormGoal(sprint.goal || '');
    setFormProjectId(sprint.projectId);
    setFormStartDate(formatDateOnly(sprint.startDate) || '');
    setFormEndDate(formatDateOnly(sprint.endDate) || '');
    setFormStatus(sprint.status || 'PLANNED');
    setShowFormModal(true);
  };

  // Quick Preset Date Helpers (1주, 2주, 4주)
  const applyDatePreset = (weeks: number) => {
    const start = formStartDate ? new Date(formStartDate) : new Date();
    const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    setFormEndDate(end.toISOString().slice(0, 10));
  };

  // Auto calculate dates from project issues for creation form
  const handleAutoFillDatesFromProject = async () => {
    try {
      const projIssues = await getIssues({ projectId: formProjectId });
      if (!projIssues || projIssues.length === 0) {
        alert('해당 프로젝트에 등록된 이슈가 없습니다.');
        return;
      }
      let minStart: string | null = null;
      let maxDue: string | null = null;

      for (const iss of projIssues) {
        if (iss.plannedStartDate) {
          const s = iss.plannedStartDate.slice(0, 10);
          if (!minStart || s < minStart) minStart = s;
        }
        if (iss.dueDate) {
          const d = iss.dueDate.slice(0, 10);
          if (!maxDue || d > maxDue) maxDue = d;
        }
      }

      if (minStart) setFormStartDate(minStart);
      if (maxDue) setFormEndDate(maxDue);

      if (!minStart && !maxDue) {
        alert('이슈들에 시작계획일이나 기한이 설정되어 있지 않습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('이슈 일정 조회 중 오류가 발생했습니다.');
    }
  };

  // Submit Create or Edit Form
  const handleSaveSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setFormSubmitting(true);

    try {
      if (editingSprint) {
        await updateSprint(editingSprint.id, {
          name: formName,
          goal: formGoal,
          status: formStatus,
          startDate: formStartDate || null,
          endDate: formEndDate || null,
        });
      } else {
        await createSprint({
          name: formName,
          goal: formGoal,
          projectId: formProjectId,
          status: formStatus,
          startDate: formStartDate || undefined,
          endDate: formEndDate || undefined,
        });
      }
      setShowFormModal(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '스프린트 저장 실패');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick Status Change (PLANNED -> ACTIVE -> COMPLETED)
  const handleQuickStatusChange = async (sprintId: number, nextStatus: string) => {
    try {
      await updateSprint(sprintId, { status: nextStatus });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || '상태 변경 실패');
    }
  };

  // Delete Sprint
  const handleDeleteSprint = async (sprintId: number) => {
    if (!confirm('이 스프린트를 삭제하시겠습니까?\n속해 있던 이슈들은 백로그로 안전하게 복귀됩니다.')) return;
    try {
      await deleteSprint(sprintId);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || '스프린트 삭제 실패');
    }
  };

  // --------------------------------------------------------------------------
  // 📋 Issue Management Modal Logic (2번 기능)
  // --------------------------------------------------------------------------
  const handleOpenManageModal = async (sprint: Sprint) => {
    setManagingSprint(sprint);
    setShowManageModal(true);
    setManageLoading(true);
    setBacklogSearch('');

    try {
      const [detail, allProjIssues] = await Promise.all([
        getSprint(sprint.id),
        getIssues({ projectId: sprint.projectId }),
      ]);

      setManagingSprint(detail);
      setSprintIssues(detail.issues || []);

      const sprintIssueIdSet = new Set((detail.issues || []).map((i) => i.id));
      const availableBacklog = allProjIssues.filter((i) => !sprintIssueIdSet.has(i.id) && (!i.sprintId || i.sprintId === sprint.id));
      setBacklogIssues(availableBacklog);
    } catch (err) {
      console.error('Failed to load sprint issues:', err);
      alert('스프린트 이슈 목록을 불러오지 못했습니다.');
    } finally {
      setManageLoading(false);
    }
  };

  // Add issue to sprint
  const handleAddIssueToSprint = async (issueId: number) => {
    if (!managingSprint) return;
    try {
      const updated = await assignIssuesToSprint(managingSprint.id, {
        addIssueIds: [issueId],
        autoCalculateDates: true,
      });
      setManagingSprint(updated);
      setSprintIssues(updated.issues || []);
      setBacklogIssues((prev) => prev.filter((i) => i.id !== issueId));
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || '이슈 추가 실패');
    }
  };

  // Remove issue from sprint
  const handleRemoveIssueFromSprint = async (issueId: number) => {
    if (!managingSprint) return;
    try {
      const updated = await assignIssuesToSprint(managingSprint.id, {
        removeIssueIds: [issueId],
        autoCalculateDates: true,
      });
      setManagingSprint(updated);
      const removedIssue = sprintIssues.find((i) => i.id === issueId);
      setSprintIssues(updated.issues || []);
      if (removedIssue) {
        setBacklogIssues((prev) => [removedIssue, ...prev]);
      }
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || '이슈 제외 실패');
    }
  };

  // Force Auto Calculate Dates for Managing Sprint
  const handleSyncSprintDates = async () => {
    if (!managingSprint) return;
    setAutoCalculating(true);
    try {
      const updated = await updateSprint(managingSprint.id, { autoCalculateDates: true });
      setManagingSprint(updated);
      fetchData();
      alert(`스프린트 일정이 할당된 이슈에 맞춰 자동 갱신되었습니다!\n시작일: ${formatDateOnly(updated.startDate) || '미설정'}\n종료일: ${formatDateOnly(updated.endDate) || '미설정'}`);
    } catch (err: any) {
      alert(err.response?.data?.error || '일정 동기화 실패');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="#cca700" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-bright)' }}>
              스프린트 관리 ({filteredSprints.length})
            </span>
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '3px', background: '#1e1e1e', padding: '2px', borderRadius: 'var(--radius-xs)', border: '1px solid #383838' }}>
            {(['ALL', 'STARRED', 'PLANNED', 'ACTIVE', 'COMPLETED'] as SprintStatusFilter[]).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? 'var(--bg-card)' : 'none',
                  color: statusFilter === st ? (st === 'STARRED' ? '#eab308' : 'var(--text-bright)') : 'var(--text-muted)',
                  border: 'none',
                  fontSize: '0.72rem',
                  fontWeight: statusFilter === st ? 600 : 400,
                  padding: '3px 8px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {st === 'ALL' ? '전체' : st === 'STARRED' ? '⭐ 즐겨찾기' : st === 'PLANNED' ? '계획 중' : st === 'ACTIVE' ? '진행 중' : '완료됨'}
              </button>
            ))}
          </div>

          {/* Project Filter */}
          <select
            className="input-field"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
              setSelectedProjectId(val);
              if (onFilterChange) onFilterChange(val);
            }}
            style={{ width: 'auto', fontSize: '0.75rem', height: '26px', padding: '0 6px' }}
          >
            <option value="ALL">모든 프로젝트</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {!isAuthenticated && onOpenAuth && (
          <Button variant="primary" size="sm" icon={<LogIn size={12} />} onClick={onOpenAuth}>
            로그인
          </Button>
        )}

        {isAuthenticated && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={12} />}
            onClick={handleOpenCreateModal}
          >
            스프린트 생성
          </Button>
        )}
      </div>

      {/* ⭐ Starred Sprints Focus HUD Strip (즐겨찾기 스프린트가 있고 STARRED 탭이 아닐 때) */}
      {statusFilter !== 'STARRED' && sprints.some((s) => s.isFavorite) && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12) 0%, rgba(202, 138, 4, 0.05) 100%)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            borderRadius: 'var(--radius-xs)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308', fontWeight: 600, fontSize: '0.8rem' }}>
              <Zap size={14} />
              <span>집중 모니터링 중인 스프린트 ({sprints.filter((s) => s.isFavorite).length}개):</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {sprints.filter((s) => s.isFavorite).map((fav) => {
                const p = getSprintProgress(fav);
                return (
                  <button
                    key={fav.id}
                    onClick={() => {
                      handleOpenManageModal(fav);
                    }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(234, 179, 8, 0.3)',
                      borderRadius: '3px',
                      padding: '3px 8px',
                      fontSize: '0.73rem',
                      color: 'var(--text-bright)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)')}
                    title="클릭하여 상세 및 이슈 목록 보기"
                  >
                    <span style={{ fontWeight: 600 }}>{fav.name}</span>
                    <span style={{ color: p.rate === 100 ? '#4ec9b0' : '#38bdf8', fontSize: '0.68rem', fontWeight: 700 }}>
                      {p.rate}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStatusFilter('STARRED')}
            style={{
              background: 'none',
              border: 'none',
              color: '#eab308',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            즐겨찾기만 필터링 보기 →
          </button>
        </div>
      )}

      {/* Sprints Grid List */}
      {loading && sprints.length === 0 ? (
        <Spinner centered label="스프린트 불러오는 중..." />
      ) : filteredSprints.length === 0 ? (
        <Card variant="glass" padding="28px" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          {statusFilter === 'ALL' ? '등록된 스프린트가 없습니다. 새로운 스프린트를 생성해 보세요!' : '해당 상태의 스프린트가 없습니다.'}
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
          {filteredSprints.map((s) => {
            const prog = getSprintProgress(s);
            const isPlanned = s.status === 'PLANNED';
            const isActive = s.status === 'ACTIVE';
            const isCompleted = s.status === 'COMPLETED';

            return (
              <div
                key={s.id}
                style={{
                  background: s.isFavorite ? '#23221e' : '#252526',
                  border: s.isFavorite
                    ? '1px solid rgba(234, 179, 8, 0.45)'
                    : isActive
                    ? '1px solid #007acc'
                    : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-xs)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: s.isFavorite
                    ? '0 0 10px rgba(234, 179, 8, 0.12)'
                    : isActive
                    ? '0 0 8px rgba(0,122,204,0.15)'
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Gold Top Accent Line for Favorite Sprint */}
                {s.isFavorite && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                    }}
                  />
                )}
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                      {s.name}
                    </span>
                    <ProjectBadge project={s.project} projectId={s.projectId} size="sm" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FavoriteButton
                      targetType="SPRINT"
                      targetId={s.id}
                      isFavorite={s.isFavorite}
                      size="sm"
                      onOpenAuth={onOpenAuth}
                      onToggleSuccess={() => fetchData()}
                    />
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                </div>

                {/* Goal */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'flex-start', gap: '5px', minHeight: '18px' }}>
                  <Target size={13} color="#cca700" style={{ marginTop: '1px', flexShrink: 0 }} />
                  <span style={{ lineHeight: '1.3' }}>{s.goal || '설정된 목표가 없습니다.'}</span>
                </div>

                {/* Dates & D-Day */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#1e1e1e',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.72rem',
                    color: 'var(--text-sub)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="var(--text-muted)" />
                    <span>
                      {formatDateOnly(s.startDate) || '시작일 미정'} ~ {formatDateOnly(s.endDate) || '기한 미정'}
                    </span>
                  </div>
                  {getDDayBadge(s)}
                </div>

                {/* Progress Bar & Issue Counts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>진척도 ({prog.rate}%)</span>
                    <span>완료 {prog.done} / 전체 {prog.total}개 이슈</span>
                  </div>
                  <div style={{ width: '100%', height: '5px', background: '#333333', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${prog.rate}%`, background: '#89d185', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Action Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #383838',
                    paddingTop: '8px',
                    marginTop: '4px',
                  }}
                >
                  {/* Status Change Buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {isPlanned && isAuthenticated && (
                      <button
                        onClick={() => handleQuickStatusChange(s.id, 'ACTIVE')}
                        className="btn btn-sm"
                        style={{ background: 'rgba(0,122,204,0.2)', color: '#9cdcfe', border: '1px solid #007acc', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                        title="스프린트 시작"
                      >
                        <Play size={10} /> 시작
                      </button>
                    )}
                    {isActive && isAuthenticated && (
                      <button
                        onClick={() => handleQuickStatusChange(s.id, 'COMPLETED')}
                        className="btn btn-sm"
                        style={{ background: 'rgba(137,209,133,0.2)', color: '#89d185', border: '1px solid #89d185', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                        title="스프린트 완료 처리"
                      >
                        <CheckCircle2 size={10} /> 완료
                      </button>
                    )}
                    {isCompleted && isAuthenticated && (
                      <button
                        onClick={() => handleQuickStatusChange(s.id, 'ACTIVE')}
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-sub)', border: '1px solid #444', height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                        title="다시 진행 중으로 변경"
                      >
                        <RotateCcw size={10} /> 다시 열기
                      </button>
                    )}

                    {/* Manage Issues Button (2번 기능) */}
                    <button
                      onClick={() => handleOpenManageModal(s)}
                      className="btn btn-secondary btn-sm"
                      style={{ height: '22px', fontSize: '0.68rem', padding: '0 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                      title="스프린트 이슈 할당 및 백로그 관리"
                    >
                      <Layers size={10} /> 이슈 관리 ({s._count?.issues ?? (s.issues?.length || 0)})
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  {isAuthenticated && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-bright)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="스프린트 수정"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteSprint(s.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '3px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f14c4c')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="스프린트 삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 스프린트 이슈 관리 모달 (이슈 할당 & 자동 계산) */}
      {/* ========================================================================= */}
      {showManageModal && managingSprint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowManageModal(false)}
        >
          <div
            style={{
              background: '#1e1e1e',
              border: '1px solid #3c3c3c',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid #333333',
                background: '#252526',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="#cca700" />
                <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-bright)' }}>
                  [{managingSprint.name}] 이슈 할당 및 백로그 관리
                </span>
                <StatusBadge status={managingSprint.status} size="sm" />
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Date Sync Action Banner (1번 연계 요구사항) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                background: '#282828',
                borderBottom: '1px solid #333',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={13} color="var(--accent-cyan)" />
                <span>
                  현재 기간: <strong>{formatDateOnly(managingSprint.startDate) || '시작일 미정'} ~ {formatDateOnly(managingSprint.endDate) || '기한 미정'}</strong>
                </span>
                {getDDayBadge(managingSprint)}
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={12} color="#cca700" />}
                onClick={handleSyncSprintDates}
                isLoading={autoCalculating}
                style={{ fontSize: '0.72rem', height: '24px' }}
                title="스프린트에 포함된 이슈들의 시작계획일 최솟값과 기한 최댓값으로 스프린트 기간을 자동 계산합니다."
              >
                이슈 일정 기반 시작일/기한 자동 동기화
              </Button>
            </div>

            {/* Modal Body: 2-Column Split View */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '12px 16px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              {/* Left Column: Assigned Issues */}
              <div
                style={{
                  background: '#252526',
                  border: '1px solid #383838',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '8px',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    스프린트 할당 이슈 ({sprintIssues.length})
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>스프린트 포함 목록</span>
                </div>

                {manageLoading ? (
                  <Spinner centered size={16} />
                ) : sprintIssues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    현재 스프린트에 담긴 이슈가 없습니다.<br />우측 백로그에서 이슈를 추가해 보세요!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '380px' }}>
                    {sprintIssues.map((iss) => (
                      <div
                        key={iss.id}
                        style={{
                          background: '#1e1e1e',
                          border: '1px solid #333',
                          borderRadius: 'var(--radius-xs)',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-bright)', lineHeight: '1.3' }}>
                            #{iss.id} {iss.title}
                          </span>
                          <button
                            onClick={() => handleRemoveIssueFromSprint(iss.id)}
                            style={{
                              background: 'rgba(241,76,76,0.15)',
                              border: '1px solid rgba(241,76,76,0.3)',
                              color: '#f14c4c',
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                            title="스프린트에서 제외하고 백로그로 이동"
                          >
                            제외
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <StatusBadge status={iss.status} size="sm" />
                            {iss.assignee && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-sub)' }}>
                                <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={14} shape="circle" />
                                {iss.assignee.name || iss.assignee.email}
                              </span>
                            )}
                          </div>
                          {(iss.plannedStartDate || iss.dueDate) && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)' }}>
                              {formatDateOnly(iss.plannedStartDate) || '~'} ~ {formatDateOnly(iss.dueDate) || '~'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Project Backlog Pool */}
              <div
                style={{
                  background: '#252526',
                  border: '1px solid #383838',
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '8px',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                    프로젝트 미할당 백로그 ({filteredBacklog.length})
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>담을 수 있는 이슈</span>
                </div>

                <input
                  type="text"
                  className="input-field"
                  placeholder="백로그 이슈 검색..."
                  value={backlogSearch}
                  onChange={(e) => setBacklogSearch(e.target.value)}
                  style={{ fontSize: '0.72rem', height: '26px', padding: '0 6px' }}
                />

                {manageLoading ? (
                  <Spinner centered size={16} />
                ) : filteredBacklog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    담을 수 있는 미할당 이슈가 없습니다.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px' }}>
                    {filteredBacklog.map((iss) => (
                      <div
                        key={iss.id}
                        style={{
                          background: '#1e1e1e',
                          border: '1px solid #333',
                          borderRadius: 'var(--radius-xs)',
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-bright)', lineHeight: '1.3' }}>
                            #{iss.id} {iss.title}
                          </span>
                          <button
                            onClick={() => handleAddIssueToSprint(iss.id)}
                            style={{
                              background: 'rgba(0,122,204,0.15)',
                              border: '1px solid rgba(0,122,204,0.4)',
                              color: '#9cdcfe',
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                            }}
                            title="이 스프린트에 추가"
                          >
                            <Plus size={10} /> 추가
                          </button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <StatusBadge status={iss.status} size="sm" />
                            {iss.assignee && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-sub)' }}>
                                <Avatar user={iss.assignee} name={iss.assignee.name || ''} size={14} shape="circle" />
                                {iss.assignee.name || iss.assignee.email}
                              </span>
                            )}
                          </div>
                          {(iss.plannedStartDate || iss.dueDate) && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {formatDateOnly(iss.plannedStartDate) || '~'} ~ {formatDateOnly(iss.dueDate) || '~'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 16px', borderTop: '1px solid #333', background: '#252526' }}>
              <Button variant="primary" size="sm" onClick={() => setShowManageModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. 스프린트 생성 / 수정 모달 (시작일/기한 + 자동 계산 연동) */}
      {/* ========================================================================= */}
      {showFormModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setShowFormModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '14px 16px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} onSubmit={handleSaveSprint}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #383838', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                  {editingSprint ? '스프린트 수정' : '새 스프린트 생성'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">스프린트 이름</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: Sprint 1 - Core API & UI"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">대상 프로젝트</label>
                  <select
                    className="input-field"
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(Number(e.target.value))}
                    disabled={Boolean(editingSprint)}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">초기 상태</label>
                  <select
                    className="input-field"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                  >
                    <option value="PLANNED">계획 중 (PLANNED)</option>
                    <option value="ACTIVE">진행 중 (ACTIVE)</option>
                    <option value="COMPLETED">완료됨 (COMPLETED)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">목표 (Goal)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 사용자 인증 및 이슈 관리 핵심 로직 배포"
                  value={formGoal}
                  onChange={(e) => setFormGoal(e.target.value)}
                />
              </div>

              {/* Date Inputs & Presets & Auto Calculation (요구사항 1번) */}
              <div
                style={{
                  background: '#1e1e1e',
                  border: '1px solid #383838',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    스프린트 기간 (시작일 ~ 기한)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillDatesFromProject}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.68rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: 0,
                    }}
                    title="프로젝트 이슈들의 시작계획일 최솟값과 기한 최댓값으로 자동 채우기"
                  >
                    <Sparkles size={11} color="#cca700" /> 이슈 일정 자동 채우기
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>시작일</span>
                    <input
                      type="date"
                      className="input-field"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>종료 기한</span>
                    <input
                      type="date"
                      className="input-field"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preset Quick Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>빠른 기한 설정:</span>
                  {[1, 2, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => applyDatePreset(w)}
                      style={{
                        background: '#2d2d2d',
                        border: '1px solid #444',
                        color: 'var(--text-sub)',
                        fontSize: '0.65rem',
                        padding: '1px 6px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      +{w}주
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShowFormModal(false)}>
                  취소
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={formSubmitting}>
                  {editingSprint ? '수정 저장' : '생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
