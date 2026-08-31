// -*- coding: utf-8 -*-
import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Sparkles, X, Rocket, Edit3 } from 'lucide-react';
import type { Sprint, Project } from '@/types';
import { createSprint, updateSprint, getIssues, getProjects } from '@/services/api';
import { formatDateOnly } from '@/utils/dateUtils';
import { useActionFeedback } from '@/hooks/useActionFeedback';
import { ActionFeedbackModal } from '@/components/ActionFeedbackModal';
import { useOverlayClickClose } from '@/hooks/useOverlayClickClose';
import { Button } from '@/components/common';

export interface SprintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint?: Sprint | null;
  projects?: Project[];
  initialProjectId?: number;
  onSuccess?: (sprint?: Sprint) => void;
}

export const SprintFormModal: React.FC<SprintFormModalProps> = ({
  isOpen,
  onClose,
  sprint = null,
  projects: propProjects,
  initialProjectId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const { isPending, errorState, closeErrorModal, executeAction } = useActionFeedback();
  const overlayProps = useOverlayClickClose(onClose);

  // 내부 프로젝트 목록 (props가 없거나 비어있는 경우 자동 fetch)
  const [projects, setProjects] = useState<Project[]>(propProjects || []);

  // 폼 내부 상태
  const [name, setName] = useState<string>('');
  const [goal, setGoal] = useState<string>('');
  const [projectId, setProjectId] = useState<number>(initialProjectId || 1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [status, setStatus] = useState<string>('PLANNED');

  // 🔒 이전 열림 상태 및 스프린트 ID 추적용 Ref (타이핑 중 원복 방어)
  const prevIsOpenRef = useRef<boolean>(false);
  const prevSprintIdRef = useRef<number | null>(null);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (propProjects && propProjects.length > 0) {
      setProjects(propProjects);
    } else if (isOpen) {
      getProjects()
        .then((list) => setProjects(list))
        .catch((err) => console.error('Failed to load projects for sprint modal:', err));
    }
  }, [isOpen, propProjects]);

  // 모달 열림 및 스프린트 변경 감지 시 폼 초기화
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
        // 기본 2주 후로 종료일 설정
        const defaultEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        setEndDate(defaultEnd.toISOString().slice(0, 10));
        setStatus('PLANNED');
      }
    }
  }, [isOpen, sprint, initialProjectId, projects]);

  // 날짜 프리셋 적용 (1주, 2주, 4주)
  const applyDatePreset = (weeks: number) => {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);
    setEndDate(end.toISOString().slice(0, 10));
  };

  // 프로젝트 내 일감 기반 일정 자동 계산
  const handleAutoFillDatesFromProject = async () => {
    try {
      const projIssues = await getIssues({ projectId });
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

      if (minStart) setStartDate(minStart);
      if (maxDue) setEndDate(maxDue);
      if (!minStart && !maxDue) {
        alert('프로젝트 이슈들에 설정된 시작일/기한이 없습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('일정 자동 계산 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('스프린트 이름을 입력하세요.');

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
        } else {
          return await createSprint({
            name: name.trim(),
            goal: goal.trim() || undefined,
            projectId: Number(projectId),
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            status,
          });
        }
      },
      {
        onSuccess: (saved) => {
          queryClient.invalidateQueries({ queryKey: ['sprints'] });
          if (onSuccess) onSuccess(saved);
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" {...overlayProps}>
        <div
          className="modal-content"
          style={{
            maxWidth: '520px',
            padding: '16px 20px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 (IssueModal 표준 구조) */}
          <div
            className="modal-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
              borderBottom: '1px solid var(--border-subtle, #333)',
              paddingBottom: '10px',
            }}
          >
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
                color: 'var(--text-main)',
              }}
            >
              {sprint ? (
                <>
                  <Edit3 size={18} color="var(--primary, #007acc)" />
                  <span>스프린트 수정</span>
                </>
              ) : (
                <>
                  <Rocket size={18} color="var(--primary, #007acc)" />
                  <span>새 스프린트 생성</span>
                </>
              )}
            </h3>
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 폼 본문 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* 1. 스프린트 이름 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                스프린트 이름 <span style={{ color: '#f43f5e' }}>*</span>
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

            {/* 2. 소속 프로젝트 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                소속 프로젝트 <span style={{ color: '#f43f5e' }}>*</span>
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

            {/* 3. 스프린트 목표 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
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

            {/* 4. 기간 설정 */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle, #333)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-xs, 4px)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-sub)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Calendar size={12} /> 기간 설정
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(1)}
                    style={{
                      background: 'var(--bg-card, #2d2d2d)',
                      border: '1px solid var(--border-subtle, #444)',
                      color: 'var(--text-sub)',
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    1주
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(2)}
                    style={{
                      background: 'var(--bg-card, #2d2d2d)',
                      border: '1px solid var(--border-subtle, #444)',
                      color: 'var(--text-sub)',
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    2주
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(4)}
                    style={{
                      background: 'var(--bg-card, #2d2d2d)',
                      border: '1px solid var(--border-subtle, #444)',
                      color: 'var(--text-sub)',
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    4주
                  </button>
                  {!sprint && (
                    <button
                      type="button"
                      onClick={handleAutoFillDatesFromProject}
                      style={{
                        background: 'rgba(204,167,0,0.15)',
                        border: '1px solid rgba(204,167,0,0.4)',
                        color: '#cca700',
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      title="프로젝트 내 이슈들의 시작계획일 최솟값과 기한 최댓값으로 자동 설정"
                    >
                      <Sparkles size={10} /> 자동 계산
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>시작일</label>
                  <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>종료 기한일</label>
                  <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 5. 진행 상태 */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>진행 상태</label>
              <select
                className="input-field"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="PLANNED">계획 중 (PLANNED)</option>
                <option value="ACTIVE">진행 중 (ACTIVE)</option>
                <option value="COMPLETED">완료됨 (COMPLETED)</option>
              </select>
            </div>

            {/* 6. 모달 액션 버튼 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-subtle, #333)',
              }}
            >
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
                취소
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isPending}>
                {sprint ? '수정 완료' : '스프린트 생성'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <ActionFeedbackModal state={errorState} onClose={closeErrorModal} />
    </>
  );
};