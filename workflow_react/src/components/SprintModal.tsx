import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, PlusCircle, Calendar, Sparkles, Loader2 } from 'lucide-react';
import type { Sprint, Project } from '@/types';
import { createSprint, updateSprint, getIssues, getProjects } from '@/services/api';
import { formatDateOnly } from '@/utils/dateUtils';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { useModalLayer } from '@/hooks/useModalLayer';
import { Portal } from '@/components/common/Portal';
import { useUIStore } from '@/stores/useUIStore';

export interface SprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint?: Sprint | null;
  projects?: Project[];
  initialProjectId?: number;
  onSuccess?: (sprint?: Sprint) => void;
}

export const SprintModal: React.FC<SprintModalProps> = ({
  isOpen,
  onClose,
  sprint = null,
  projects: propProjects,
  initialProjectId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const { zIndex: dynamicZIndex } = useModalLayer(isOpen, {
    onClose,
    triggerKey: sprint?.id ?? 'new',
  });
  const overlayProps = useOverlayClickClose(onClose);

  const [projects, setProjects] = useState<Project[]>(propProjects || []);
  const [name, setName] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(initialProjectId || 1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<string>('PLANNED');

  const prevIsOpenRef = useRef<boolean>(false);
  const prevSprintIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
    } else if (isOpen) {
      getProjects()
        .then((list) => setProjects(list))
        .catch((err) => console.error('Failed to load projects for sprint modal:', err));
    }
  }, [isOpen, propProjects]);

  useEffect(() => {
    const isNewlyOpened = isOpen && !prevIsOpenRef.current;
    const isSprintChanged = sprint ? sprint.id !== prevSprintIdRef.current : prevSprintIdRef.current !== null;

    prevIsOpenRef.current = isOpen;
    prevSprintIdRef.current = sprint ? sprint.id : null;

    if (!isOpen) return;

    if (isNewlyOpened || isSprintChanged) {
      if (sprint) {
        setName(sprint.name || '');
        setGoal(sprint.goal || '');
        setProjectId(sprint.projectId || initialProjectId || projects[0]?.id || 1);
        setStartDate(formatDateOnly(sprint.startDate) || '');
        setEndDate(formatDateOnly(sprint.endDate) || '');
        setStatus(sprint.status || 'PLANNED');
      } else {
        setName('');
        setGoal('');
        setProjectId(initialProjectId || (projects.length > 0 ? projects[0].id : 1));
        setStartDate(new Date().toISOString().slice(0, 10));
        const defaultEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        setEndDate(defaultEnd.toISOString().slice(0, 10));
        setStatus('PLANNED');
      }
    }
  }, [isOpen, sprint, initialProjectId, projects]);

  const applyDatePreset = (weeks: number) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handleAutoFillDatesFromProject = async () => {
    try {
      const projIssues = await getIssues({ projectId });
      if (!projIssues || projIssues.length === 0) {
        useUIStore.getState().showToast('해당 프로젝트에 등록된 이슈가 없습니다.', 'error');
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

      if (minStart) setStartDate(minStart);
      if (maxDue) setEndDate(maxDue);
      if (!minStart && !maxDue) {
        useUIStore.getState().showToast('프로젝트 이슈들에 설정된 시작일/기한이 없습니다.', 'error');
      } else {
        useUIStore.getState().showToast('프로젝트 이슈 기반으로 일정이 자동 계산되었습니다.', 'success');
      }
    } catch (err) {
      console.error(err);
      useUIStore.getState().showToast('일정 자동 계산 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      useUIStore.getState().showToast('스프린트 이름을 입력하세요.', 'error');
      return;
    }

    await executeAction(
      async () => {
        if (sprint) {
          return await updateSprint(sprint.id, {
            name: name.trim(),
            goal: goal.trim() || undefined,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            status,
          });
        }
        return await createSprint({
          name: name.trim(),
          goal: goal.trim() || undefined,
          projectId: Number(projectId),
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          endDate: endDate ? new Date(endDate).toISOString() : undefined,
          status,
        });
      },
      {
        onSuccess: (saved) => {
          queryClient.invalidateQueries({ queryKey: ['sprints'] });
          useUIStore.getState().showToast(
            sprint ? `'${name.trim()}' 스프린트가 수정되었습니다.` : `'${name.trim()}' 스프린트가 생성되었습니다.`,
            'success'
          );
          if (onSuccess) onSuccess(saved);
          onClose();
        },
        onError: (err) => {
          useUIStore.getState().showToast(err.response?.data?.error || '스프린트 저장에 실패했습니다.', 'error');
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: dynamicZIndex, background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(2px)' }}
        {...overlayProps}
      >
        <div
          className="modal-content"
          style={{ maxWidth: '540px', width: '92%', padding: '16px 20px', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', margin: 'auto', borderRadius: '6px', background: 'var(--bg-modal)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-bright)' }}>
              {sprint ? (
                <>
                  <span style={{ color: 'var(--primary)' }}>#{sprint.id}</span>
                  <span>스프린트 정보 수정</span>
                </>
              ) : (
                <>
                  <PlusCircle size={15} color="var(--primary)" /> 새 스프린트 생성
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                스프린트 이름 <span style={{ color: 'var(--status-urgent)' }}>*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="예: 2026 Q3 Sprint 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                소속 프로젝트 <span style={{ color: 'var(--status-urgent)' }}>*</span>
              </label>
              <select
                className="input-field"
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                disabled={!!sprint}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key || `PRJ-${p.id}`}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                스프린트 목표
              </label>
              <textarea
                className="input-field"
                placeholder="이번 스프린트에서 달성할 핵심 목표를 입력하세요..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar size={13} /> 기간 설정
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[1, 2, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyDatePreset(w)}
                      style={{ padding: '1px 6px', fontSize: '0.7rem' }}
                    >
                      {w}주
                    </button>
                  ))}
                  {!sprint && (
                    <button
                      type="button"
                      onClick={handleAutoFillDatesFromProject}
                      style={{
                        background: 'rgba(204,167,0,0.15)',
                        border: '1px solid rgba(204,167,0,0.4)',
                        color: 'var(--status-todo)',
                        fontSize: '0.7rem',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      title="프로젝트 내 이슈들의 시작계획일 최솟값과 기한 최댓값으로 자동 설정"
                    >
                      <Sparkles size={11} /> 자동 계산
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '2px', display: 'block' }}>시작일</label>
                  <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.74rem', marginBottom: '2px', display: 'block' }}>종료 기한일</label>
                  <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
                진행 상태
              </label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PLANNED">계획 중 (PLANNED)</option>
                <option value="ACTIVE">진행 중 (ACTIVE)</option>
                <option value="COMPLETED">완료됨 (COMPLETED)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isPending} style={{ flex: 1 }}>
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> 저장 중...
                  </>
                ) : sprint ? (
                  '스프린트 수정 저장'
                ) : (
                  '새 스프린트 생성'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </Portal>
  );
};

export const SprintFormModal = SprintModal;
